/**
 * Stdio Transport for MCP
 *
 * Communicates with MCP servers via subprocess stdin/stdout.
 */

import { spawn, ChildProcess } from 'child_process';
import { JsonRpcRequest, JsonRpcResponse, JsonRpcNotification } from '../types';
import { BaseMCPTransport, MCPTransportOptions } from './base';

export interface StdioTransportOptions extends MCPTransportOptions {
  /** Command to execute */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Working directory */
  cwd?: string;
}

/**
 * Stdio transport implementation
 *
 * Spawns a subprocess and communicates via JSON-RPC over stdin/stdout.
 */
export class StdioTransport extends BaseMCPTransport {
  private command: string;
  private args: string[];
  private env: Record<string, string>;
  private cwd?: string;
  private process?: ChildProcess;
  private buffer: string = '';
  private pendingRequests: Map<string | number, {
    resolve: (response: JsonRpcResponse) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = new Map();
  private requestId: number = 0;

  constructor(options: StdioTransportOptions) {
    super(options);
    this.command = options.command;
    this.args = options.args ?? [];
    this.env = options.env ?? {};
    this.cwd = options.cwd;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.log(`Spawning: ${this.command} ${this.args.join(' ')}`);

      try {
        this.process = spawn(this.command, this.args, {
          env: { ...process.env, ...this.env },
          cwd: this.cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        // Handle stdout (responses from server)
        this.process.stdout?.on('data', (data: Buffer) => {
          this.handleData(data.toString());
        });

        // Handle stderr (logging/errors from server)
        this.process.stderr?.on('data', (data: Buffer) => {
          this.log('stderr:', data.toString());
        });

        // Handle process errors
        this.process.on('error', (error) => {
          this.log('Process error:', error);
          this.handleError(error);
          if (!this.connected) {
            reject(error);
          }
        });

        // Handle process exit
        this.process.on('exit', (code, signal) => {
          this.log(`Process exited: code=${code}, signal=${signal}`);
          this.cleanup();
          this.handleDisconnect();
        });

        // Consider connected once process is spawned
        this.connected = true;
        this.log('Connected via stdio');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.process) {
      return;
    }

    this.log('Disconnecting...');

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Transport disconnected'));
    }
    this.pendingRequests.clear();

    // Kill the process
    this.process.kill();
    this.cleanup();
  }

  async send(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.connected || !this.process?.stdin) {
      throw new Error('Transport not connected');
    }

    // Assign request ID if not present
    const id = request.id ?? ++this.requestId;
    const fullRequest = { ...request, id };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${request.method}`));
      }, this.timeout);

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timer });

      // Send the request
      const data = JSON.stringify(fullRequest) + '\n';
      this.log('Sending:', data.trim());

      this.process!.stdin!.write(data, (error) => {
        if (error) {
          this.pendingRequests.delete(id);
          clearTimeout(timer);
          reject(error);
        }
      });
    });
  }

  protected async sendRaw(data: string): Promise<void> {
    if (!this.connected || !this.process?.stdin) {
      throw new Error('Transport not connected');
    }

    return new Promise((resolve, reject) => {
      this.process!.stdin!.write(data + '\n', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private handleData(data: string): void {
    this.buffer += data;

    // Process complete JSON-RPC messages (newline-delimited)
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line) {
        this.handleMessage(line);
      }
    }
  }

  private handleMessage(data: string): void {
    this.log('Received:', data);

    let message: JsonRpcResponse | JsonRpcNotification;
    try {
      message = JSON.parse(data);
    } catch (error) {
      this.log('Failed to parse message:', data);
      return;
    }

    // Check if it's a response (has id) or notification (no id)
    if ('id' in message && message.id !== null && message.id !== undefined) {
      const response = message as JsonRpcResponse;
      const id = response.id as string | number;
      const pending = this.pendingRequests.get(id);

      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(id);
        pending.resolve(response);
      }
    } else if ('method' in message) {
      // It's a notification
      const notification = message as JsonRpcNotification;
      this.handleNotification(notification.method, notification.params);
    }
  }

  private cleanup(): void {
    this.connected = false;
    this.process = undefined;
    this.buffer = '';
  }
}

/**
 * Create a stdio transport
 */
export function createStdioTransport(options: StdioTransportOptions): StdioTransport {
  return new StdioTransport(options);
}
