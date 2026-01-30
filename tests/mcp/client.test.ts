import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient, createMCPClient } from '../../src/mcp/client';
import { MCPServerConfig } from '../../src/mcp/types';

// Mock the transports
vi.mock('../../src/mcp/transports/stdio', () => ({
  StdioTransport: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    send: vi.fn(),
    notify: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    onNotification: vi.fn(),
    onError: vi.fn(),
    onDisconnect: vi.fn(),
  })),
}));

vi.mock('../../src/mcp/transports/http', () => ({
  HttpTransport: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    send: vi.fn(),
    notify: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    onNotification: vi.fn(),
    onError: vi.fn(),
    onDisconnect: vi.fn(),
  })),
}));

describe('MCPClient', () => {
  let mockTransportSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock responses
    mockTransportSend = vi.fn()
      .mockResolvedValueOnce({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
          capabilities: { tools: {} },
        },
      })
      .mockResolvedValueOnce({
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [
            {
              name: 'test_tool',
              description: 'A test tool',
              inputSchema: {
                type: 'object',
                properties: {
                  input: { type: 'string' },
                },
              },
            },
          ],
        },
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createMCPClient', () => {
    it('should create a client with stdio config', () => {
      const config: MCPServerConfig = {
        name: 'test',
        transport: 'stdio',
        command: 'node',
        args: ['server.js'],
      };

      const client = createMCPClient(config);
      expect(client).toBeInstanceOf(MCPClient);
      expect(client.name).toBe('test');
    });

    it('should create a client with http config', () => {
      const config: MCPServerConfig = {
        name: 'test',
        transport: 'http',
        url: 'http://localhost:3000',
      };

      const client = createMCPClient(config);
      expect(client).toBeInstanceOf(MCPClient);
    });
  });

  describe('MCPClient', () => {
    it('should have correct initial state', () => {
      const client = createMCPClient({
        name: 'test',
        transport: 'stdio',
        command: 'node',
      });

      expect(client.getState()).toBe('disconnected');
      expect(client.getTools()).toEqual([]);
    });

    it('should return namespaced tool names', async () => {
      const { StdioTransport } = await import('../../src/mcp/transports/stdio');
      (StdioTransport as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        send: mockTransportSend,
        notify: vi.fn().mockResolvedValue(undefined),
        isConnected: vi.fn().mockReturnValue(true),
        onNotification: vi.fn(),
        onError: vi.fn(),
        onDisconnect: vi.fn(),
      }));

      const client = createMCPClient({
        name: 'myserver',
        transport: 'stdio',
        command: 'node',
      });

      await client.connect();

      const definitions = client.getToolsAsDefinitions();
      expect(definitions[0].name).toBe('myserver__test_tool');
    });

    it('should check if namespaced tool belongs to client', () => {
      const client = createMCPClient({
        name: 'github',
        transport: 'stdio',
        command: 'node',
      });

      expect(client.hasNamespacedTool('github__list_repos')).toBe(true);
      expect(client.hasNamespacedTool('gitlab__list_repos')).toBe(false);
      expect(client.hasNamespacedTool('list_repos')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw on missing command for stdio', () => {
      const client = createMCPClient({
        name: 'test',
        transport: 'stdio',
      } as MCPServerConfig);

      expect(client.connect()).rejects.toThrow('Command required for stdio transport');
    });

    it('should throw on missing URL for http', () => {
      const client = createMCPClient({
        name: 'test',
        transport: 'http',
      } as MCPServerConfig);

      expect(client.connect()).rejects.toThrow('URL required for http transport');
    });
  });
});
