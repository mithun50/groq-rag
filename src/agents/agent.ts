import Groq from 'groq-sdk';
import { AgentConfig, AgentResult, AgentStep, ToolDefinition, ToolResult } from '../types';
import { ToolExecutor } from '../tools/executor';

/**
 * Parse text-based function calls that some models output
 * Handles formats:
 * - <function=name{"key": "value"}</function>
 * - <function=name {"key": "value"} </function>
 * - <function=name={"key": "value"}</function>
 * - <function=name [{"key": "value"}] (with optional array brackets, optional closing tag)
 */
function parseTextFunctionCall(text: string): { name: string; args: Record<string, unknown> } | null {
  // Try multiple patterns to handle various model outputs

  // Pattern 1: Standard format with closing tag
  let match = text.match(/<function=(\w+)[=\s]*(\{[\s\S]*?\})\s*<\/function>/);

  // Pattern 2: Array wrapped JSON with optional closing tag
  if (!match) {
    match = text.match(/<function=(\w+)[=\s]*\[\s*(\{[\s\S]*?\})\s*\](?:\s*<\/function>)?/);
  }

  // Pattern 3: Missing closing tag (extract JSON after function name)
  if (!match) {
    match = text.match(/<function=(\w+)[=\s]*(\{[\s\S]*\})/);
  }

  if (match) {
    try {
      const name = match[1];
      const args = JSON.parse(match[2]);
      return { name, args };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Extract failed_generation from Groq API error
 */
function extractFailedGeneration(error: unknown): string | null {
  if (error instanceof Error) {
    // Try to parse JSON from error message
    const jsonMatch = error.message.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.error?.failed_generation || null;
      } catch {
        return null;
      }
    }
  }
  // Check if error has error property directly
  const err = error as { error?: { failed_generation?: string } };
  return err.error?.failed_generation || null;
}

/**
 * ReAct-style agent that can use tools
 */
export class Agent {
  private client: Groq;
  private config: Required<AgentConfig>;
  private executor: ToolExecutor;
  private messages: Groq.Chat.ChatCompletionMessageParam[];

  constructor(client: Groq, config: AgentConfig = {}) {
    this.client = client;
    this.config = {
      name: config.name || 'Agent',
      model: config.model || 'llama-3.3-70b-versatile',
      systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(),
      tools: config.tools || [],
      maxIterations: config.maxIterations || 10,
      verbose: config.verbose ?? false,
      memory: config.memory || { messages: [] },
    };

    this.executor = new ToolExecutor(this.config.tools);
    this.messages = [
      { role: 'system', content: this.config.systemPrompt },
      ...this.config.memory.messages,
    ];
  }

  private getDefaultSystemPrompt(): string {
    return `You are a helpful AI assistant. You have access to tools that you can use to help answer questions.

IMPORTANT: When you need to use a tool, the system will automatically handle the tool calling for you. Just respond naturally and the tools will be invoked through the API's function calling mechanism. Do NOT write out function calls as text like "<function=..." - that format is not supported.

Available capabilities:
- Search the web for current information
- Fetch and read content from URLs
- Query the knowledge base for indexed documents
- Perform mathematical calculations
- Get current date and time

When you don't know something or need current information, use the appropriate tool. Provide clear, helpful responses based on the information you gather.`;
  }

  /**
   * Add a tool to the agent
   */
  addTool(tool: ToolDefinition): void {
    this.config.tools.push(tool);
    this.executor.register(tool);
  }

  /**
   * Run the agent with a user message
   */
  async run(input: string): Promise<AgentResult> {
    const steps: AgentStep[] = [];
    const toolCalls: ToolResult[] = [];

    // Add user message
    this.messages.push({ role: 'user', content: input });

    let iteration = 0;
    let totalTokens = 0;

    while (iteration < this.config.maxIterations) {
      iteration++;

      if (this.config.verbose) {
        console.log(`\n[Agent] Iteration ${iteration}`);
      }

      let response;
      let textFunctionCall: { name: string; args: Record<string, unknown> } | null = null;

      try {
        // Call the model
        response = await this.client.chat.completions.create({
          model: this.config.model,
          messages: this.messages,
          tools: this.executor.getToolsForAPI(),
          tool_choice: 'auto',
        });
      } catch (error: unknown) {
        // Handle text-based function call errors
        const failedGen = extractFailedGeneration(error);
        if (failedGen) {
          textFunctionCall = parseTextFunctionCall(failedGen);
          if (textFunctionCall) {
            // Execute the parsed function call
            const result = await this.executor.execute(textFunctionCall.name, textFunctionCall.args);
            toolCalls.push(result);
            steps.push({
              action: textFunctionCall.name,
              actionInput: textFunctionCall.args,
              observation: result.error || JSON.stringify(result.result),
            });

            // Format result for the model
            const toolResultStr = result.error
              ? `Error: ${result.error}`
              : JSON.stringify(result.result, null, 2);

            // Add assistant message about using the tool
            this.messages.push({
              role: 'assistant',
              content: `I'll use the ${textFunctionCall.name} tool to help answer this.`,
            });

            // Add tool result as system context
            this.messages.push({
              role: 'user',
              content: `Here is the result from ${textFunctionCall.name}:\n\n${toolResultStr}\n\nPlease provide a helpful response based on this information.`,
            });
            continue;
          }
        }
        throw error;
      }

      const choice = response.choices[0];
      const message = choice.message;
      totalTokens += response.usage?.total_tokens || 0;

      // Add assistant message to history
      this.messages.push(message);

      // Check if we have tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        if (this.config.verbose) {
          console.log(`[Agent] Tool calls:`, message.tool_calls.map(tc => tc.function.name));
        }

        // Execute tools
        const results = await this.executor.processToolCalls(message.tool_calls);

        // Record steps
        for (const { toolCallId, result } of results) {
          const toolCall = message.tool_calls.find(tc => tc.id === toolCallId);
          steps.push({
            action: toolCall?.function.name,
            actionInput: toolCall ? JSON.parse(toolCall.function.arguments) : {},
            observation: result.error || JSON.stringify(result.result),
          });
          toolCalls.push(result);
        }

        // Add tool results to messages
        const toolMessages = this.executor.formatToolResultsAsMessages(results);
        this.messages.push(...toolMessages);

        if (this.config.verbose) {
          console.log(`[Agent] Tool results:`, results.map(r => r.result));
        }
      } else {
        // No tool calls, we have a final response
        steps.push({
          thought: message.content || '',
          isFinal: true,
        });

        if (this.config.verbose) {
          console.log(`[Agent] Final response:`, message.content?.substring(0, 100));
        }

        return {
          output: message.content || '',
          steps,
          toolCalls,
          totalTokens,
        };
      }

      // Check for stop condition
      if (choice.finish_reason === 'stop' && !message.tool_calls) {
        steps.push({
          thought: message.content || '',
          isFinal: true,
        });

        return {
          output: message.content || '',
          steps,
          toolCalls,
          totalTokens,
        };
      }
    }

    // Max iterations reached
    return {
      output: 'Agent reached maximum iterations without completing the task.',
      steps,
      toolCalls,
      totalTokens,
    };
  }

  /**
   * Run with streaming output
   */
  async *runStream(input: string): AsyncGenerator<{
    type: 'thought' | 'tool_call' | 'tool_result' | 'content' | 'done';
    data: unknown;
  }> {
    this.messages.push({ role: 'user', content: input });

    let iteration = 0;
    const steps: AgentStep[] = [];
    const toolCalls: ToolResult[] = [];

    while (iteration < this.config.maxIterations) {
      iteration++;

      let response;
      try {
        response = await this.client.chat.completions.create({
          model: this.config.model,
          messages: this.messages,
          tools: this.executor.getToolsForAPI(),
          tool_choice: 'auto',
          stream: true,
        });
      } catch (error: unknown) {
        // Handle text-based function call errors
        const failedGen = extractFailedGeneration(error);
        if (failedGen) {
          const textFunctionCall = parseTextFunctionCall(failedGen);
          if (textFunctionCall) {
            yield { type: 'tool_call', data: { name: textFunctionCall.name, arguments: JSON.stringify(textFunctionCall.args) } };

            const result = await this.executor.execute(textFunctionCall.name, textFunctionCall.args);
            yield { type: 'tool_result', data: result };
            toolCalls.push(result);

            this.messages.push({
              role: 'assistant',
              content: `Using ${textFunctionCall.name} tool.`,
            });
            this.messages.push({
              role: 'user',
              content: `Tool result: ${result.error || JSON.stringify(result.result)}`,
            });
            continue;
          }
        }
        throw error;
      }

      let content = '';
      const currentToolCalls: Groq.Chat.ChatCompletionMessageToolCall[] = [];

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          content += delta.content;
          yield { type: 'content', data: delta.content };
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.index !== undefined) {
              if (!currentToolCalls[tc.index]) {
                currentToolCalls[tc.index] = {
                  id: tc.id || '',
                  type: 'function',
                  function: { name: tc.function?.name || '', arguments: '' },
                };
              }
              if (tc.id) currentToolCalls[tc.index].id = tc.id;
              if (tc.function?.name) currentToolCalls[tc.index].function.name = tc.function.name;
              if (tc.function?.arguments) {
                currentToolCalls[tc.index].function.arguments += tc.function.arguments;
              }
            }
          }
        }
      }

      // Process tool calls if any
      if (currentToolCalls.length > 0) {
        // Add assistant message
        this.messages.push({
          role: 'assistant',
          content: content || null,
          tool_calls: currentToolCalls,
        });

        for (const tc of currentToolCalls) {
          yield { type: 'tool_call', data: { name: tc.function.name, arguments: tc.function.arguments } };

          const result = await this.executor.execute(
            tc.function.name,
            JSON.parse(tc.function.arguments || '{}')
          );

          yield { type: 'tool_result', data: result };
          toolCalls.push(result);

          // Add tool result to messages
          this.messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result.error || JSON.stringify(result.result),
          });
        }
      } else {
        // Final response
        this.messages.push({ role: 'assistant', content });
        yield { type: 'done', data: { output: content, steps, toolCalls } };
        return;
      }
    }

    yield { type: 'done', data: { output: 'Max iterations reached', steps, toolCalls } };
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.messages = [{ role: 'system', content: this.config.systemPrompt }];
  }

  /**
   * Get conversation history
   */
  getHistory(): Groq.Chat.ChatCompletionMessageParam[] {
    return [...this.messages];
  }
}

/**
 * Create an agent with default configuration
 */
export function createAgent(
  client: Groq,
  config?: AgentConfig
): Agent {
  return new Agent(client, config);
}
