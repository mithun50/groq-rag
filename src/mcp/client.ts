/**
 * MCP Client
 *
 * Client for connecting to and communicating with MCP servers.
 */

import { ToolDefinition } from '../types';
import {
  MCPServerConfig,
  MCPTool,
  MCPToolCallResult,
  MCPInitializeResult,
  MCPToolListResult,
  MCPClientState,
  MCP_PROTOCOL_VERSION,
  MCP_METHODS,
  JsonRpcRequest,
} from './types';
import {
  MCPTransport,
  StdioTransport,
  HttpTransport,
} from './transports';
import { mcpToolsToDefinitions, isMCPTool } from './adapter';

/**
 * MCP Client for connecting to MCP servers
 */
export class MCPClient {
  private config: MCPServerConfig;
  private transport?: MCPTransport;
  private tools: MCPTool[] = [];
  private serverInfo?: MCPInitializeResult;
  private state: MCPClientState = 'disconnected';
  private requestId: number = 0;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  /**
   * Get the server name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get the current state
   */
  getState(): MCPClientState {
    return this.state;
  }

  /**
   * Get server info (available after connect)
   */
  getServerInfo(): MCPInitializeResult | undefined {
    return this.serverInfo;
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.state === 'connected') {
      return;
    }

    this.state = 'connecting';

    try {
      // Create transport based on config
      this.transport = this.createTransport();

      // Set up event handlers
      this.transport.onError((error) => {
        console.error(`[MCP ${this.config.name}] Error:`, error);
        this.state = 'error';
      });

      this.transport.onDisconnect(() => {
        this.state = 'disconnected';
        this.tools = [];
      });

      this.transport.onNotification((method, params) => {
        this.handleNotification(method, params);
      });

      // Connect transport
      await this.transport.connect();

      // Initialize MCP protocol
      await this.initialize();

      // Discover tools
      await this.discoverTools();

      this.state = 'connected';
    } catch (error) {
      this.state = 'error';
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.disconnect();
      this.transport = undefined;
    }
    this.tools = [];
    this.serverInfo = undefined;
    this.state = 'disconnected';
  }

  /**
   * Get discovered MCP tools
   */
  getTools(): MCPTool[] {
    return [...this.tools];
  }

  /**
   * Get tools as groq-rag ToolDefinitions
   */
  getToolsAsDefinitions(): ToolDefinition[] {
    return mcpToolsToDefinitions(this.tools, {
      serverName: this.config.name,
      callTool: (name, args) => this.callTool(name, args),
    });
  }

  /**
   * Call an MCP tool
   */
  async callTool(name: string, args?: Record<string, unknown>): Promise<MCPToolCallResult> {
    if (!this.transport?.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    const response = await this.sendRequest(MCP_METHODS.TOOLS_CALL, {
      name,
      arguments: args,
    });

    if (response.error) {
      throw new Error(`MCP tool call failed: ${response.error.message}`);
    }

    return response.result as MCPToolCallResult;
  }

  /**
   * Check if a tool name belongs to this MCP client
   */
  hasNamespacedTool(namespacedName: string): boolean {
    return isMCPTool(namespacedName, this.config.name);
  }

  /**
   * Create transport based on config
   */
  private createTransport(): MCPTransport {
    const timeout = this.config.timeout;

    switch (this.config.transport) {
      case 'stdio':
        if (!this.config.command) {
          throw new Error('Command required for stdio transport');
        }
        return new StdioTransport({
          command: this.config.command,
          args: this.config.args,
          env: this.config.env,
          timeout,
        });

      case 'http':
        if (!this.config.url) {
          throw new Error('URL required for http transport');
        }
        return new HttpTransport({
          url: this.config.url,
          timeout,
        });

      default:
        throw new Error(`Unknown transport: ${this.config.transport}`);
    }
  }

  /**
   * Initialize MCP protocol
   */
  private async initialize(): Promise<void> {
    const response = await this.sendRequest(MCP_METHODS.INITIALIZE, {
      protocolVersion: MCP_PROTOCOL_VERSION,
      clientInfo: {
        name: 'groq-rag',
        version: '1.0.0',
      },
      capabilities: {
        tools: {},
      },
    });

    if (response.error) {
      throw new Error(`MCP initialization failed: ${response.error.message}`);
    }

    this.serverInfo = response.result as MCPInitializeResult;

    // Send initialized notification
    await this.transport!.notify(MCP_METHODS.INITIALIZED);
  }

  /**
   * Discover available tools
   */
  private async discoverTools(): Promise<void> {
    const tools: MCPTool[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.sendRequest(MCP_METHODS.TOOLS_LIST, cursor ? { cursor } : undefined);

      if (response.error) {
        throw new Error(`Failed to list tools: ${response.error.message}`);
      }

      const result = response.result as MCPToolListResult;
      tools.push(...result.tools);
      cursor = result.nextCursor;
    } while (cursor);

    this.tools = tools;
  }

  /**
   * Send a JSON-RPC request
   */
  private async sendRequest(method: string, params?: Record<string, unknown>) {
    if (!this.transport) {
      throw new Error('No transport available');
    }

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params,
    };

    return this.transport.send(request);
  }

  /**
   * Handle incoming notifications
   */
  private handleNotification(method: string, _params?: Record<string, unknown>): void {
    switch (method) {
      case 'notifications/tools/list_changed':
        // Re-discover tools when list changes
        this.discoverTools().catch(console.error);
        break;
      // Handle other notifications as needed
    }
  }
}

/**
 * Create an MCP client
 */
export function createMCPClient(config: MCPServerConfig): MCPClient {
  return new MCPClient(config);
}
