/**
 * MCP Tools Integration Example
 *
 * This example demonstrates how to connect to MCP (Model Context Protocol)
 * servers and use their tools with groq-rag agents.
 *
 * MCP allows AI applications to connect to external tools and data sources
 * through a standardized protocol. See: https://modelcontextprotocol.io/
 *
 * Prerequisites:
 * - GROQ_API_KEY environment variable set
 * - Node.js 18+ with npx available
 *
 * Run: npx tsx examples/mcp-tools.ts
 */

import GroqRAG, { createMCPClient, ToolExecutor } from 'groq-rag';

// ============================================
// Example 1: Basic MCP Integration
// ============================================
async function basicMCPExample() {
  console.log('=== Example 1: Basic MCP Integration ===\n');

  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Check initial state
  console.log(`Initial MCP servers: ${client.mcp.getServerCount()}`);
  console.log(`Has servers: ${client.mcp.hasServers()}\n`);

  // Try to connect to filesystem server (requires @modelcontextprotocol/server-filesystem)
  console.log('Attempting to connect to filesystem MCP server...');
  try {
    await client.mcp.addServer({
      name: 'filesystem',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      timeout: 15000,
    });

    console.log('Connected to filesystem server!');
    console.log(`Server count: ${client.mcp.getServerCount()}`);

    // List tools from the server
    const tools = await client.mcp.getAllTools();
    console.log(`\nDiscovered ${tools.length} tools:`);
    tools.forEach(t => console.log(`  - ${t.name}: ${t.description?.slice(0, 60)}...`));
  } catch (error: any) {
    console.log(`Could not connect: ${error.message}`);
    console.log('This is expected if the MCP server is not installed.\n');
  }

  // Cleanup
  await client.mcp.disconnectAll();
  console.log('Disconnected all servers.\n');
}

// ============================================
// Example 2: Agent with MCP Tools
// ============================================
async function agentWithMCPExample() {
  console.log('=== Example 2: Agent with MCP Tools ===\n');

  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Try to connect to MCP server first
  let hasMCPTools = false;
  try {
    await client.mcp.addServer({
      name: 'filesystem',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      timeout: 15000,
    });
    hasMCPTools = true;
    console.log('MCP server connected!');
  } catch {
    console.log('MCP server not available, using built-in tools only.');
  }

  // Create agent with MCP tools included
  const agent = await client.createAgentWithBuiltins(
    {
      model: 'llama-3.3-70b-versatile',
      systemPrompt: `You are a helpful assistant. You have access to various tools:
- Built-in: web_search, fetch_url, calculator, get_datetime
${hasMCPTools ? '- MCP Filesystem: read_file, write_file, list_directory' : ''}
Use these tools to help answer questions.`,
      verbose: true,
      maxIterations: 5,
    },
    { includeMCP: true }
  );

  // Run a task
  const task = hasMCPTools
    ? 'List the files in the current directory and tell me what this project is about.'
    : 'Search for information about the Model Context Protocol and explain what it is.';

  console.log(`\nTask: ${task}\n`);
  const result = await agent.run(task);

  console.log('\n=== Result ===');
  console.log(result.output);

  console.log('\n=== Tools Used ===');
  result.toolCalls.forEach(t => {
    console.log(`- ${t.name} (${t.executionTime}ms): ${t.error || 'Success'}`);
  });

  // Cleanup
  await client.mcp.disconnectAll();
}

// ============================================
// Example 3: Standalone MCP Client
// ============================================
async function standaloneMCPExample() {
  console.log('=== Example 3: Standalone MCP Client ===\n');

  // Create a standalone MCP client (without GroqRAG)
  const mcpClient = createMCPClient({
    name: 'standalone-fs',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    timeout: 15000,
  });

  console.log(`Client name: ${mcpClient.name}`);
  console.log(`Initial state: ${mcpClient.getState()}`);

  try {
    // Connect
    console.log('\nConnecting...');
    await mcpClient.connect();
    console.log(`State after connect: ${mcpClient.getState()}`);

    // Get server info
    const info = mcpClient.getServerInfo();
    console.log(`\nServer: ${info?.serverInfo?.name} v${info?.serverInfo?.version}`);
    console.log(`Protocol: ${info?.protocolVersion}`);

    // Get native MCP tools
    const mcpTools = mcpClient.getTools();
    console.log(`\nNative MCP tools (${mcpTools.length}):`);
    mcpTools.forEach(t => {
      console.log(`  - ${t.name}`);
      console.log(`    ${t.description?.slice(0, 80)}...`);
    });

    // Convert to groq-rag ToolDefinitions
    const definitions = mcpClient.getToolsAsDefinitions();
    console.log(`\nConverted to ToolDefinitions (${definitions.length}):`);
    definitions.forEach(t => console.log(`  - ${t.name}`));

    // Use with ToolExecutor
    const executor = new ToolExecutor();
    executor.registerMCPTools(mcpClient);
    console.log(`\nRegistered with ToolExecutor`);
    console.log(`Executor has ${executor.getTools().length} tools`);

    // Try calling a tool
    console.log('\nTrying to read package.json...');
    try {
      const result = await executor.execute('standalone-fs__read_file', {
        path: './package.json',
      });
      if (!result.error) {
        const content = JSON.parse(result.result as string);
        console.log(`Package: ${content.name} v${content.version}`);
      }
    } catch (e: any) {
      console.log(`Could not read file: ${e.message}`);
    }

    // Cleanup
    executor.unregisterMCPTools(mcpClient);
    await mcpClient.disconnect();
    console.log(`\nDisconnected. State: ${mcpClient.getState()}`);
  } catch (error: any) {
    console.log(`\nMCP server not available: ${error.message}`);
    console.log('Install with: npm install -g @modelcontextprotocol/server-filesystem');
  }
}

// ============================================
// Example 4: Multiple MCP Servers
// ============================================
async function multipleMCPServersExample() {
  console.log('=== Example 4: Multiple MCP Servers ===\n');

  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  const servers = [
    {
      name: 'filesystem',
      transport: 'stdio' as const,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    },
    {
      name: 'memory',
      transport: 'stdio' as const,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  ];

  console.log('Connecting to multiple MCP servers...\n');

  for (const config of servers) {
    try {
      const mcpClient = await client.mcp.addServer({
        ...config,
        timeout: 15000,
      });
      const tools = mcpClient.getTools();
      console.log(`✓ ${config.name}: ${tools.length} tools`);
    } catch (error: any) {
      console.log(`✗ ${config.name}: ${error.message}`);
    }
  }

  console.log(`\nTotal servers: ${client.mcp.getServerCount()}`);
  console.log(`Total tools: ${(await client.mcp.getAllTools()).length}`);

  // List all connected servers
  const connectedServers = client.mcp.getServers();
  connectedServers.forEach(s => {
    console.log(`\nServer: ${s.name} (${s.getState()})`);
    s.getTools().forEach(t => console.log(`  - ${t.name}`));
  });

  // Cleanup
  await client.mcp.disconnectAll();
  console.log('\nAll servers disconnected.');
}

// ============================================
// Main Entry Point
// ============================================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           MCP (Model Context Protocol) Examples          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Run examples
  await basicMCPExample();
  console.log('\n' + '─'.repeat(60) + '\n');

  await agentWithMCPExample();
  console.log('\n' + '─'.repeat(60) + '\n');

  await standaloneMCPExample();
  console.log('\n' + '─'.repeat(60) + '\n');

  await multipleMCPServersExample();

  console.log('\n' + '═'.repeat(60));
  console.log('All MCP examples completed!');
  console.log('═'.repeat(60));
}

main().catch(console.error);
