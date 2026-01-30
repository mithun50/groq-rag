import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StdioTransport } from '../../src/mcp/transports/stdio';
import { HttpTransport } from '../../src/mcp/transports/http';

// Mock fetch for HttpTransport tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('StdioTransport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create transport with options', () => {
    const transport = new StdioTransport({
      command: 'node',
      args: ['server.js'],
      timeout: 5000,
    });

    expect(transport).toBeDefined();
    expect(transport.isConnected()).toBe(false);
  });

  // Note: connect/disconnect tests require actual process spawning
  // which is difficult to mock properly. Testing basic construction
  // and handler setup instead.

  it('should set notification handler', () => {
    const transport = new StdioTransport({
      command: 'node',
    });

    const handler = vi.fn();
    transport.onNotification(handler);

    // Handler should be stored (internal implementation detail)
    expect(transport['notificationHandler']).toBe(handler);
  });

  it('should set error handler', () => {
    const transport = new StdioTransport({
      command: 'node',
    });

    const handler = vi.fn();
    transport.onError(handler);

    expect(transport['errorHandler']).toBe(handler);
  });

  it('should set disconnect handler', () => {
    const transport = new StdioTransport({
      command: 'node',
    });

    const handler = vi.fn();
    transport.onDisconnect(handler);

    expect(transport['disconnectHandler']).toBe(handler);
  });

  it('should report not connected initially', () => {
    const transport = new StdioTransport({
      command: 'node',
    });

    expect(transport.isConnected()).toBe(false);
  });

  it('should store environment variables', () => {
    const transport = new StdioTransport({
      command: 'node',
      env: { TEST_VAR: 'test_value' },
    });

    // Access private property for testing
    expect(transport['env']).toEqual({ TEST_VAR: 'test_value' });
  });
});

describe('HttpTransport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should create transport with options', () => {
    const transport = new HttpTransport({
      url: 'http://localhost:3000',
      timeout: 5000,
    });

    expect(transport).toBeDefined();
    expect(transport.isConnected()).toBe(false);
  });

  it('should connect successfully', async () => {
    const transport = new HttpTransport({
      url: 'http://localhost:3000',
    });

    await transport.connect();
    expect(transport.isConnected()).toBe(true);
  });

  it('should disconnect', async () => {
    const transport = new HttpTransport({
      url: 'http://localhost:3000',
    });

    await transport.connect();
    await transport.disconnect();
    expect(transport.isConnected()).toBe(false);
  });

  it('should send requests via POST', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: { data: 'test' },
      }),
    });

    const transport = new HttpTransport({
      url: 'http://localhost:3000/mcp',
    });

    await transport.connect();

    const response = await transport.send({
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/mcp',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    expect(response.result).toEqual({ data: 'test' });
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const transport = new HttpTransport({
      url: 'http://localhost:3000',
    });

    await transport.connect();

    await expect(
      transport.send({
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
      })
    ).rejects.toThrow('HTTP error: 500 Internal Server Error');
  });

  it('should throw when not connected', async () => {
    const transport = new HttpTransport({
      url: 'http://localhost:3000',
    });

    await expect(
      transport.send({
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
      })
    ).rejects.toThrow('Transport not connected');
  });

  it('should include authorization header when apiKey provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} }),
    });

    const transport = new HttpTransport({
      url: 'http://localhost:3000',
      apiKey: 'test-api-key',
    });

    await transport.connect();
    await transport.send({ jsonrpc: '2.0', id: 1, method: 'test' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
        }),
      })
    );
  });
});
