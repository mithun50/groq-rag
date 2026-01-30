/**
 * MCP Tool Adapter
 *
 * Converts MCP tools to groq-rag ToolDefinition format.
 */

import { ToolDefinition } from '../types';
import { MCPTool, MCPToolCallResult, MCPContent } from './types';

/**
 * Options for converting MCP tools
 */
export interface MCPToolAdapterOptions {
  /** Server name for namespacing tools */
  serverName: string;
  /** Function to call MCP tools */
  callTool: (name: string, args?: Record<string, unknown>) => Promise<MCPToolCallResult>;
}

/**
 * Convert MCP tool schema to JSON Schema format expected by groq-rag
 */
function convertSchema(inputSchema: MCPTool['inputSchema']): ToolDefinition['parameters'] {
  return {
    type: 'object',
    properties: inputSchema.properties ?? {},
    required: inputSchema.required,
  };
}

/**
 * Format MCP content array to a string result
 */
function formatMCPContent(content: MCPContent[]): unknown {
  if (content.length === 0) {
    return null;
  }

  // If single text content, return just the text
  if (content.length === 1 && content[0].type === 'text') {
    // Try to parse as JSON if possible
    const text = content[0].text ?? '';
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  // Multiple content items - return structured
  return content.map(item => {
    switch (item.type) {
      case 'text':
        return { type: 'text', text: item.text };
      case 'image':
        return { type: 'image', data: item.data, mimeType: item.mimeType };
      case 'resource':
        return { type: 'resource', uri: item.uri, text: item.text };
      default:
        return item;
    }
  });
}

/**
 * Convert a single MCP tool to a groq-rag ToolDefinition
 */
export function mcpToolToDefinition(
  tool: MCPTool,
  options: MCPToolAdapterOptions
): ToolDefinition {
  const { serverName, callTool } = options;
  const namespacedName = `${serverName}__${tool.name}`;

  return {
    name: namespacedName,
    description: tool.description ?? `MCP tool from ${serverName}`,
    parameters: convertSchema(tool.inputSchema),
    execute: async (params: Record<string, unknown>) => {
      const result = await callTool(tool.name, params);

      if (result.isError) {
        // Extract error message from content
        const errorText = result.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');
        throw new Error(errorText || 'MCP tool call failed');
      }

      return formatMCPContent(result.content);
    },
  };
}

/**
 * Convert multiple MCP tools to groq-rag ToolDefinitions
 */
export function mcpToolsToDefinitions(
  tools: MCPTool[],
  options: MCPToolAdapterOptions
): ToolDefinition[] {
  return tools.map(tool => mcpToolToDefinition(tool, options));
}

/**
 * Extract the original MCP tool name from a namespaced name
 */
export function extractMCPToolName(namespacedName: string): { serverName: string; toolName: string } | null {
  const parts = namespacedName.split('__');
  if (parts.length < 2) {
    return null;
  }

  const serverName = parts[0];
  const toolName = parts.slice(1).join('__'); // Handle tool names with underscores

  return { serverName, toolName };
}

/**
 * Check if a tool name is from an MCP server
 */
export function isMCPTool(name: string, serverName?: string): boolean {
  const extracted = extractMCPToolName(name);
  if (!extracted) {
    return false;
  }

  if (serverName) {
    return extracted.serverName === serverName;
  }

  return true;
}
