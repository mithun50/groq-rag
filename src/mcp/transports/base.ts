/**
 * MCP Transport Base Interface
 *
 * Defines the contract for MCP transport implementations.
 */

import { JsonRpcRequest, JsonRpcResponse } from '../types';

export interface MCPTransportOptions {
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface MCPTransport {
  /**
   * Connect to the MCP server
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the MCP server
   */
  disconnect(): Promise<void>;

  /**
   * Send a JSON-RPC request and wait for response
   */
  send(request: JsonRpcRequest): Promise<JsonRpcResponse>;

  /**
   * Send a notification (no response expected)
   */
  notify(method: string, params?: Record<string, unknown>): Promise<void>;

  /**
   * Check if transport is connected
   */
  isConnected(): boolean;

  /**
   * Set handler for incoming notifications
   */
  onNotification(handler: (method: string, params?: Record<string, unknown>) => void): void;

  /**
   * Set handler for errors
   */
  onError(handler: (error: Error) => void): void;

  /**
   * Set handler for disconnect
   */
  onDisconnect(handler: () => void): void;
}

/**
 * Base transport implementation with common functionality
 */
export abstract class BaseMCPTransport implements MCPTransport {
  protected timeout: number;
  protected debug: boolean;
  protected connected: boolean = false;
  protected notificationHandler?: (method: string, params?: Record<string, unknown>) => void;
  protected errorHandler?: (error: Error) => void;
  protected disconnectHandler?: () => void;

  constructor(options: MCPTransportOptions = {}) {
    this.timeout = options.timeout ?? 30000;
    this.debug = options.debug ?? false;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(request: JsonRpcRequest): Promise<JsonRpcResponse>;

  async notify(method: string, params?: Record<string, unknown>): Promise<void> {
    const notification = {
      jsonrpc: '2.0' as const,
      method,
      params,
    };
    await this.sendRaw(JSON.stringify(notification));
  }

  protected abstract sendRaw(data: string): Promise<void>;

  isConnected(): boolean {
    return this.connected;
  }

  onNotification(handler: (method: string, params?: Record<string, unknown>) => void): void {
    this.notificationHandler = handler;
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler;
  }

  onDisconnect(handler: () => void): void {
    this.disconnectHandler = handler;
  }

  protected log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[MCP Transport]', ...args);
    }
  }

  protected handleNotification(method: string, params?: Record<string, unknown>): void {
    if (this.notificationHandler) {
      this.notificationHandler(method, params);
    }
  }

  protected handleError(error: Error): void {
    if (this.errorHandler) {
      this.errorHandler(error);
    }
  }

  protected handleDisconnect(): void {
    this.connected = false;
    if (this.disconnectHandler) {
      this.disconnectHandler();
    }
  }
}
