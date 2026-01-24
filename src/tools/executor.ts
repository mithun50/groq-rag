import Groq from 'groq-sdk';
import { ToolDefinition, ToolResult } from '../types';

/**
 * Tool executor - manages and executes tools
 */
export class ToolExecutor {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor(tools: ToolDefinition[] = []) {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Register a tool
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get all registered tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools in Groq API format
   */
  getToolsForAPI(): Groq.Chat.ChatCompletionTool[] {
    return this.getTools().map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Execute a tool by name
   */
  async execute(
    name: string,
    params: Record<string, unknown>
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        name,
        result: null,
        error: `Tool "${name}" not found`,
        executionTime: Date.now() - startTime,
      };
    }

    try {
      const result = await tool.execute(params);
      return {
        name,
        result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name,
        result: null,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute multiple tool calls in parallel
   */
  async executeMany(
    calls: Array<{ name: string; params: Record<string, unknown> }>
  ): Promise<ToolResult[]> {
    return Promise.all(
      calls.map(call => this.execute(call.name, call.params))
    );
  }

  /**
   * Process tool calls from Groq API response
   */
  async processToolCalls(
    toolCalls: Groq.Chat.ChatCompletionMessageToolCall[]
  ): Promise<Array<{ toolCallId: string; result: ToolResult }>> {
    const results = await Promise.all(
      toolCalls.map(async toolCall => {
        let params: Record<string, unknown> = {};
        try {
          params = JSON.parse(toolCall.function.arguments);
        } catch {
          // Invalid JSON, use empty params
        }

        const result = await this.execute(toolCall.function.name, params);
        return {
          toolCallId: toolCall.id,
          result,
        };
      })
    );

    return results;
  }

  /**
   * Format tool results as messages for Groq API
   */
  formatToolResultsAsMessages(
    results: Array<{ toolCallId: string; result: ToolResult }>
  ): Groq.Chat.ChatCompletionToolMessageParam[] {
    return results.map(({ toolCallId, result }) => ({
      role: 'tool' as const,
      tool_call_id: toolCallId,
      content: result.error
        ? `Error: ${result.error}`
        : JSON.stringify(result.result),
    }));
  }
}

/**
 * Create a tool executor with optional initial tools
 */
export function createToolExecutor(tools?: ToolDefinition[]): ToolExecutor {
  return new ToolExecutor(tools);
}
