/**
 * HTTP Transport for MCP
 *
 * Communicates with MCP servers via HTTP/HTTPS endpoints.
 */

import { JsonRpcRequest, JsonRpcResponse } from '../types';
import { BaseMCPTransport, MCPTransportOptions } from './base';

export interface HttpTransportOptions extends MCPTransportOptions {
  /** Server URL endpoint */
  url: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** API key for authorization */
  apiKey?: string;
}

/**
 * HTTP transport implementation
 *
 * Sends JSON-RPC requests via HTTP POST to an MCP server endpoint.
 */
export class HttpTransport extends BaseMCPTransport {
  private url: string;
  private headers: Record<string, string>;

  constructor(options: HttpTransportOptions) {
    super(options);
    this.url = options.url;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.apiKey) {
      this.headers['Authorization'] = `Bearer ${options.apiKey}`;
    }
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    // For HTTP, we just verify the endpoint is reachable
    try {
      this.log(`Testing connection to: ${this.url}`);

      // Send a simple ping or just mark as connected
      // Some HTTP MCP servers may not support ping, so we just mark as connected
      this.connected = true;
      this.log('Connected via HTTP');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.log('Disconnected');
  }

  async send(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      this.log('Sending:', JSON.stringify(request));

      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as JsonRpcResponse;
      this.log('Received:', JSON.stringify(data));

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout: ${request.method}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected async sendRaw(data: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      await fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: data,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Create an HTTP transport
 */
export function createHttpTransport(options: HttpTransportOptions): HttpTransport {
  return new HttpTransport(options);
}
