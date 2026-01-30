/**
 * MCP (Model Context Protocol) Module
 *
 * Provides integration with MCP servers for external tool access.
 */

// Types
export {
  MCPServerConfig,
  MCPTool,
  MCPToolCallResult,
  MCPContent,
  MCPCapabilities,
  MCPServerInfo,
  MCPClientInfo,
  MCPInitializeResult,
  MCPToolSchema,
  MCPToolListResult,
  MCPResource,
  MCPResourceListResult,
  MCPPrompt,
  MCPPromptListResult,
  MCPClientState,
  MCP_PROTOCOL_VERSION,
  MCP_METHODS,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
} from './types';

// Client
export { MCPClient, createMCPClient } from './client';

// Transports
export {
  MCPTransport,
  MCPTransportOptions,
  StdioTransport,
  StdioTransportOptions,
  createStdioTransport,
  HttpTransport,
  HttpTransportOptions,
  createHttpTransport,
} from './transports';

// Adapter
export {
  mcpToolToDefinition,
  mcpToolsToDefinitions,
  extractMCPToolName,
  isMCPTool,
  MCPToolAdapterOptions,
} from './adapter';
