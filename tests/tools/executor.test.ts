import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolExecutor } from '../../src/tools/executor';
import { ToolDefinition } from '../../src/types';

describe('ToolExecutor', () => {
  let executor: ToolExecutor;

  const createMockTool = (name: string, result: unknown = 'success'): ToolDefinition => ({
    name,
    description: `Mock tool: ${name}`,
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
    },
    execute: vi.fn().mockResolvedValue(result),
  });

  beforeEach(() => {
    executor = new ToolExecutor();
  });

  describe('register', () => {
    it('should register a tool', () => {
      const tool = createMockTool('test');
      executor.register(tool);
      expect(executor.has('test')).toBe(true);
    });

    it('should overwrite existing tool with same name', () => {
      const tool1 = createMockTool('test', 'first');
      const tool2 = createMockTool('test', 'second');

      executor.register(tool1);
      executor.register(tool2);

      expect(executor.getTools().length).toBe(1);
    });
  });

  describe('unregister', () => {
    it('should remove a registered tool', () => {
      executor.register(createMockTool('test'));
      expect(executor.unregister('test')).toBe(true);
      expect(executor.has('test')).toBe(false);
    });

    it('should return false for non-existent tool', () => {
      expect(executor.unregister('non-existent')).toBe(false);
    });
  });

  describe('getTools', () => {
    it('should return all registered tools', () => {
      executor.register(createMockTool('tool1'));
      executor.register(createMockTool('tool2'));

      const tools = executor.getTools();
      expect(tools.length).toBe(2);
    });

    it('should return empty array when no tools registered', () => {
      expect(executor.getTools()).toEqual([]);
    });
  });

  describe('getToolsForAPI', () => {
    it('should format tools for Groq API', () => {
      executor.register(createMockTool('test'));
      const apiTools = executor.getToolsForAPI();

      expect(apiTools[0]).toEqual({
        type: 'function',
        function: {
          name: 'test',
          description: 'Mock tool: test',
          parameters: {
            type: 'object',
            properties: {
              input: { type: 'string' },
            },
          },
        },
      });
    });
  });

  describe('has', () => {
    it('should return true for registered tool', () => {
      executor.register(createMockTool('test'));
      expect(executor.has('test')).toBe(true);
    });

    it('should return false for unregistered tool', () => {
      expect(executor.has('non-existent')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute a registered tool', async () => {
      const tool = createMockTool('test', { data: 'result' });
      executor.register(tool);

      const result = await executor.execute('test', { input: 'hello' });

      expect(result.name).toBe('test');
      expect(result.result).toEqual({ data: 'result' });
      expect(result.error).toBeUndefined();
      expect(result.executionTime).toBeDefined();
    });

    it('should return error for non-existent tool', async () => {
      const result = await executor.execute('non-existent', {});

      expect(result.name).toBe('non-existent');
      expect(result.error).toContain('not found');
      expect(result.result).toBeNull();
    });

    it('should catch and return execution errors', async () => {
      const tool: ToolDefinition = {
        ...createMockTool('failing'),
        execute: vi.fn().mockRejectedValue(new Error('Execution failed')),
      };
      executor.register(tool);

      const result = await executor.execute('failing', {});

      expect(result.error).toBe('Execution failed');
      expect(result.result).toBeNull();
    });

    it('should measure execution time', async () => {
      const tool: ToolDefinition = {
        ...createMockTool('slow'),
        execute: vi.fn().mockImplementation(async () => {
          await new Promise(r => setTimeout(r, 50));
          return 'done';
        }),
      };
      executor.register(tool);

      const result = await executor.execute('slow', {});

      expect(result.executionTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe('executeMany', () => {
    it('should execute multiple tools in parallel', async () => {
      executor.register(createMockTool('tool1', 'result1'));
      executor.register(createMockTool('tool2', 'result2'));

      const results = await executor.executeMany([
        { name: 'tool1', params: {} },
        { name: 'tool2', params: {} },
      ]);

      expect(results.length).toBe(2);
      expect(results[0].result).toBe('result1');
      expect(results[1].result).toBe('result2');
    });
  });

  describe('processToolCalls', () => {
    it('should process Groq API tool calls', async () => {
      executor.register(createMockTool('test', { output: 'processed' }));

      const toolCalls = [
        {
          id: 'call_123',
          type: 'function' as const,
          function: {
            name: 'test',
            arguments: '{"input": "hello"}',
          },
        },
      ];

      const results = await executor.processToolCalls(toolCalls);

      expect(results.length).toBe(1);
      expect(results[0].toolCallId).toBe('call_123');
      expect(results[0].result.result).toEqual({ output: 'processed' });
    });

    it('should handle invalid JSON arguments', async () => {
      executor.register(createMockTool('test'));

      const toolCalls = [
        {
          id: 'call_123',
          type: 'function' as const,
          function: {
            name: 'test',
            arguments: 'invalid json',
          },
        },
      ];

      // Should not throw
      const results = await executor.processToolCalls(toolCalls);
      expect(results.length).toBe(1);
    });
  });

  describe('formatToolResultsAsMessages', () => {
    it('should format results as tool messages', () => {
      const results = [
        {
          toolCallId: 'call_123',
          result: { name: 'test', result: { data: 'value' }, executionTime: 10 },
        },
      ];

      const messages = executor.formatToolResultsAsMessages(results);

      expect(messages[0]).toEqual({
        role: 'tool',
        tool_call_id: 'call_123',
        content: '{"data":"value"}',
      });
    });

    it('should format error results', () => {
      const results = [
        {
          toolCallId: 'call_123',
          result: { name: 'test', result: null, error: 'Something failed', executionTime: 10 },
        },
      ];

      const messages = executor.formatToolResultsAsMessages(results);

      expect(messages[0].content).toBe('Error: Something failed');
    });
  });

  describe('constructor with initial tools', () => {
    it('should register tools passed to constructor', () => {
      const tools = [createMockTool('tool1'), createMockTool('tool2')];
      const exec = new ToolExecutor(tools);

      expect(exec.has('tool1')).toBe(true);
      expect(exec.has('tool2')).toBe(true);
    });
  });
});
