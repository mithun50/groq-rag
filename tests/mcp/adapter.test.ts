import { describe, it, expect, vi } from 'vitest';
import {
  mcpToolToDefinition,
  mcpToolsToDefinitions,
  extractMCPToolName,
  isMCPTool,
} from '../../src/mcp/adapter';
import { MCPTool, MCPToolCallResult } from '../../src/mcp/types';

describe('MCP Adapter', () => {
  describe('mcpToolToDefinition', () => {
    it('should convert MCP tool to ToolDefinition', async () => {
      const mcpTool: MCPTool = {
        name: 'read_file',
        description: 'Read a file from the filesystem',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
          },
          required: ['path'],
        },
      };

      const callTool = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'file contents' }],
        isError: false,
      } as MCPToolCallResult);

      const definition = mcpToolToDefinition(mcpTool, {
        serverName: 'filesystem',
        callTool,
      });

      expect(definition.name).toBe('filesystem__read_file');
      expect(definition.description).toBe('Read a file from the filesystem');
      expect(definition.parameters.type).toBe('object');
      expect(definition.parameters.properties).toHaveProperty('path');
      expect(definition.parameters.required).toContain('path');

      // Test execution
      const result = await definition.execute({ path: '/test.txt' });
      expect(callTool).toHaveBeenCalledWith('read_file', { path: '/test.txt' });
      expect(result).toBe('file contents');
    });

    it('should handle tool execution errors', async () => {
      const mcpTool: MCPTool = {
        name: 'failing_tool',
        inputSchema: { type: 'object' },
      };

      const callTool = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Something went wrong' }],
        isError: true,
      } as MCPToolCallResult);

      const definition = mcpToolToDefinition(mcpTool, {
        serverName: 'test',
        callTool,
      });

      await expect(definition.execute({})).rejects.toThrow('Something went wrong');
    });

    it('should parse JSON responses', async () => {
      const mcpTool: MCPTool = {
        name: 'json_tool',
        inputSchema: { type: 'object' },
      };

      const callTool = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"key": "value"}' }],
        isError: false,
      } as MCPToolCallResult);

      const definition = mcpToolToDefinition(mcpTool, {
        serverName: 'test',
        callTool,
      });

      const result = await definition.execute({});
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle multiple content items', async () => {
      const mcpTool: MCPTool = {
        name: 'multi_content',
        inputSchema: { type: 'object' },
      };

      const callTool = vi.fn().mockResolvedValue({
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' },
        ],
        isError: false,
      } as MCPToolCallResult);

      const definition = mcpToolToDefinition(mcpTool, {
        serverName: 'test',
        callTool,
      });

      const result = await definition.execute({});
      expect(result).toEqual([
        { type: 'text', text: 'First part' },
        { type: 'text', text: 'Second part' },
      ]);
    });
  });

  describe('mcpToolsToDefinitions', () => {
    it('should convert multiple MCP tools', () => {
      const mcpTools: MCPTool[] = [
        { name: 'tool1', inputSchema: { type: 'object' } },
        { name: 'tool2', inputSchema: { type: 'object' } },
      ];

      const callTool = vi.fn();
      const definitions = mcpToolsToDefinitions(mcpTools, {
        serverName: 'server',
        callTool,
      });

      expect(definitions).toHaveLength(2);
      expect(definitions[0].name).toBe('server__tool1');
      expect(definitions[1].name).toBe('server__tool2');
    });
  });

  describe('extractMCPToolName', () => {
    it('should extract server and tool names', () => {
      const result = extractMCPToolName('github__list_repos');
      expect(result).toEqual({
        serverName: 'github',
        toolName: 'list_repos',
      });
    });

    it('should handle tool names with underscores', () => {
      const result = extractMCPToolName('server__tool_with_underscores');
      expect(result).toEqual({
        serverName: 'server',
        toolName: 'tool_with_underscores',
      });
    });

    it('should return null for non-namespaced names', () => {
      const result = extractMCPToolName('simple_tool');
      expect(result).toBeNull();
    });
  });

  describe('isMCPTool', () => {
    it('should identify MCP tools', () => {
      expect(isMCPTool('github__list_repos')).toBe(true);
      expect(isMCPTool('simple_tool')).toBe(false);
    });

    it('should filter by server name', () => {
      expect(isMCPTool('github__list_repos', 'github')).toBe(true);
      expect(isMCPTool('github__list_repos', 'gitlab')).toBe(false);
    });
  });
});
