/**
 * MCP (Model Context Protocol) Types
 *
 * Type definitions for MCP protocol communication and tool integration.
 */

// ============================================
// JSON-RPC 2.0 Types
// ============================================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

// ============================================
// MCP Server Configuration
// ============================================

export interface MCPServerConfig {
  /** Unique name for this server */
  name: string;
  /** Transport type to use */
  transport: 'stdio' | 'http';
  /** Command to execute (for stdio transport) */
  command?: string;
  /** Command arguments (for stdio transport) */
  args?: string[];
  /** Environment variables (for stdio transport) */
  env?: Record<string, string>;
  /** URL endpoint (for http transport) */
  url?: string;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Whether to auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
}

// ============================================
// MCP Protocol Types
// ============================================

export interface MCPCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: Record<string, unknown>;
}

export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion?: string;
  capabilities?: MCPCapabilities;
}

export interface MCPClientInfo {
  name: string;
  version: string;
}

export interface MCPInitializeParams {
  protocolVersion: string;
  clientInfo: MCPClientInfo;
  capabilities?: MCPCapabilities;
}

export interface MCPInitializeResult {
  protocolVersion: string;
  serverInfo: MCPServerInfo;
  capabilities?: MCPCapabilities;
}

// ============================================
// MCP Tool Types
// ============================================

export interface MCPToolSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: MCPToolSchema;
}

export interface MCPToolListResult {
  tools: MCPTool[];
  nextCursor?: string;
}

export interface MCPToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPToolCallResult {
  content: MCPContent[];
  isError?: boolean;
}

export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
  uri?: string;
}

// ============================================
// MCP Resource Types
// ============================================

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceListResult {
  resources: MCPResource[];
  nextCursor?: string;
}

export interface MCPResourceReadResult {
  contents: MCPResourceContent[];
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

// ============================================
// MCP Prompt Types
// ============================================

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface MCPPromptListResult {
  prompts: MCPPrompt[];
  nextCursor?: string;
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: MCPContent;
}

export interface MCPPromptGetResult {
  description?: string;
  messages: MCPPromptMessage[];
}

// ============================================
// MCP Client State
// ============================================

export type MCPClientState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MCPClientEvents {
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
  toolsChanged: () => void;
  resourcesChanged: () => void;
  promptsChanged: () => void;
}

// ============================================
// Protocol Constants
// ============================================

export const MCP_PROTOCOL_VERSION = '2024-11-05';

export const MCP_METHODS = {
  INITIALIZE: 'initialize',
  INITIALIZED: 'notifications/initialized',
  PING: 'ping',
  TOOLS_LIST: 'tools/list',
  TOOLS_CALL: 'tools/call',
  RESOURCES_LIST: 'resources/list',
  RESOURCES_READ: 'resources/read',
  PROMPTS_LIST: 'prompts/list',
  PROMPTS_GET: 'prompts/get',
} as const;

export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;
