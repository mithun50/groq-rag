import Groq from 'groq-sdk';
import { AgentConfig, AgentResult, AgentStep, ToolDefinition, ToolResult } from '../types';
import { ToolExecutor } from '../tools/executor';

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
    return `You are a helpful AI assistant with access to tools.
Use the available tools to help answer questions and complete tasks.
When you need information you don't have, use the appropriate tool to find it.
Always provide clear, accurate, and helpful responses.`;
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

      // Call the model
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: this.messages,
        tools: this.executor.getToolsForAPI(),
        tool_choice: 'auto',
      });

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

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: this.messages,
        tools: this.executor.getToolsForAPI(),
        tool_choice: 'auto',
        stream: true,
      });

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
