import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolExecutor } from '../../src/tools/executor';
import { MCPClient } from '../../src/mcp/client';
import { isMCPTool } from '../../src/mcp/adapter';

// Create a mock MCP client
function createMockMCPClient(name: string, tools: Array<{ name: string; description: string }>) {
  const mockClient = {
    name,
    getToolsAsDefinitions: vi.fn().mockReturnValue(
      tools.map(t => ({
        name: `${name}__${t.name}`,
        description: t.description,
        parameters: { type: 'object' as const, properties: {} },
        execute: vi.fn().mockResolvedValue({ result: 'mock' }),
      }))
    ),
    getTools: vi.fn().mockReturnValue(
      tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: { type: 'object' },
      }))
    ),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'mock result' }],
      isError: false,
    }),
    getState: vi.fn().mockReturnValue('connected'),
    getServerInfo: vi.fn().mockReturnValue({
      protocolVersion: '2024-11-05',
      serverInfo: { name, version: '1.0.0' },
    }),
    hasNamespacedTool: vi.fn().mockImplementation((toolName: string) =>
      toolName.startsWith(`${name}__`)
    ),
  } as unknown as MCPClient;

  return mockClient;
}

describe('ToolExecutor MCP Integration', () => {
  let executor: ToolExecutor;

  beforeEach(() => {
    executor = new ToolExecutor();
  });

  it('should register MCP tools from client', () => {
    const mockClient = createMockMCPClient('github', [
      { name: 'list_repos', description: 'List repositories' },
      { name: 'create_issue', description: 'Create an issue' },
    ]);

    executor.registerMCPTools(mockClient);

    expect(executor.has('github__list_repos')).toBe(true);
    expect(executor.has('github__create_issue')).toBe(true);
    expect(executor.getMCPClients()).toHaveLength(1);
  });

  it('should unregister MCP tools', () => {
    const mockClient = createMockMCPClient('github', [
      { name: 'list_repos', description: 'List repositories' },
    ]);

    executor.registerMCPTools(mockClient);
    expect(executor.has('github__list_repos')).toBe(true);

    executor.unregisterMCPTools(mockClient);
    expect(executor.has('github__list_repos')).toBe(false);
    expect(executor.getMCPClients()).toHaveLength(0);
  });

  it('should handle multiple MCP clients', () => {
    const githubClient = createMockMCPClient('github', [
      { name: 'list_repos', description: 'List repositories' },
    ]);

    const filesystemClient = createMockMCPClient('filesystem', [
      { name: 'read_file', description: 'Read a file' },
      { name: 'write_file', description: 'Write a file' },
    ]);

    executor.registerMCPTools(githubClient);
    executor.registerMCPTools(filesystemClient);

    expect(executor.has('github__list_repos')).toBe(true);
    expect(executor.has('filesystem__read_file')).toBe(true);
    expect(executor.has('filesystem__write_file')).toBe(true);
    expect(executor.getMCPClients()).toHaveLength(2);
  });

  it('should execute MCP tools', async () => {
    const mockClient = createMockMCPClient('test', [
      { name: 'my_tool', description: 'A test tool' },
    ]);

    executor.registerMCPTools(mockClient);

    const result = await executor.execute('test__my_tool', { input: 'test' });

    expect(result.name).toBe('test__my_tool');
    expect(result.error).toBeUndefined();
  });

  it('should mix MCP tools with regular tools', () => {
    // Add regular tool
    executor.register({
      name: 'regular_tool',
      description: 'A regular tool',
      parameters: { type: 'object', properties: {} },
      execute: async () => ({ result: 'regular' }),
    });

    // Add MCP tools
    const mockClient = createMockMCPClient('mcp', [
      { name: 'mcp_tool', description: 'An MCP tool' },
    ]);
    executor.registerMCPTools(mockClient);

    expect(executor.has('regular_tool')).toBe(true);
    expect(executor.has('mcp__mcp_tool')).toBe(true);

    const tools = executor.getTools();
    expect(tools).toHaveLength(2);
  });

  it('should get tools for API including MCP tools', () => {
    const mockClient = createMockMCPClient('test', [
      { name: 'tool1', description: 'Tool 1' },
    ]);

    executor.registerMCPTools(mockClient);

    const apiTools = executor.getToolsForAPI();
    expect(apiTools).toHaveLength(1);
    expect(apiTools[0].function.name).toBe('test__tool1');
    expect(apiTools[0].type).toBe('function');
  });
});

describe('isMCPTool helper', () => {
  it('should identify MCP tool names', () => {
    expect(isMCPTool('github__list_repos')).toBe(true);
    expect(isMCPTool('filesystem__read_file')).toBe(true);
    expect(isMCPTool('server__tool__with__many__underscores')).toBe(true);
  });

  it('should reject non-MCP tool names', () => {
    expect(isMCPTool('web_search')).toBe(false);
    expect(isMCPTool('calculator')).toBe(false);
    expect(isMCPTool('my_custom_tool')).toBe(false);
  });

  it('should filter by server name', () => {
    expect(isMCPTool('github__list_repos', 'github')).toBe(true);
    expect(isMCPTool('github__list_repos', 'gitlab')).toBe(false);
  });
});
