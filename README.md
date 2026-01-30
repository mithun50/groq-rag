# groq-rag

[![npm version](https://img.shields.io/npm/v/groq-rag)](https://www.npmjs.com/package/groq-rag)
[![GitHub Package](https://img.shields.io/badge/GitHub%20Package-@mithun50%2Fgroq--rag-blue)](https://github.com/mithun50/groq-rag/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://groq-rag.onrender.com)
[![Groq SDK](https://img.shields.io/badge/Built%20on-Groq%20SDK-orange.svg)](https://github.com/groq/groq-typescript)
[![Context7](https://img.shields.io/badge/Context7-AI%20Docs-purple.svg)](https://context7.com/mithun50/groq-rag)
[![Benchmark](https://img.shields.io/badge/Benchmark-1.7M%20ops%2Fs-brightgreen.svg)](#benchmarks)
[![Groq API](https://img.shields.io/badge/Groq%20API-190ms-blue.svg)](#benchmarks)

Extended [Groq TypeScript SDK](https://github.com/groq/groq-typescript) with RAG (Retrieval-Augmented Generation), web browsing, and autonomous agent capabilities. Build intelligent AI applications that can search the web, fetch URLs, query knowledge bases, and reason through complex tasks.

> **🔌 Drop-in Replacement:** groq-rag includes **100% of the official [groq-sdk](https://www.npmjs.com/package/groq-sdk) API**. All Groq SDK functions, types, and features work seamlessly. Simply replace `groq-sdk` with `groq-rag` and gain RAG, web, and agent superpowers!

## Groq SDK Compatibility

groq-rag is built on top of the official [Groq TypeScript SDK](https://github.com/groq/groq-typescript) and provides full API compatibility:

| Groq SDK Feature | groq-rag Support |
|------------------|------------------|
| Chat Completions | ✅ Full support |
| Streaming | ✅ Full support |
| Audio Transcription | ✅ Full support |
| Audio Translation | ✅ Full support |
| Models API | ✅ Full support |
| Function Calling | ✅ Full support |
| Vision | ✅ Full support |
| All Types & Interfaces | ✅ Full support |

**Plus additional features:** RAG, Web Search, URL Fetching, Autonomous Agents, Tool System

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Supported Models](#supported-models)
  - [Production Models](#production-models)
  - [Compound AI Systems](#compound-ai-systems)
  - [Preview Models](#preview-models)
  - [Reasoning Models](#reasoning-models)
  - [Vision Models](#vision-models)
  - [Safety & Moderation Models](#safety--moderation-models)
  - [Feature Compatibility](#feature-compatibility)
- [Core Modules](#core-modules)
  - [GroqRAG Client](#groqrag-client)
  - [RAG Module](#rag-module)
  - [Web Module](#web-module)
  - [Chat Module](#chat-module)
  - [Agent System](#agent-system)
  - [Tool System](#tool-system)
  - [MCP Integration](#mcp-integration)
- [Configuration](#configuration)
  - [Vector Stores](#vector-stores)
  - [Embedding Providers](#embedding-providers)
  - [Search Providers](#search-providers)
  - [Chunking Strategies](#chunking-strategies)
- [Utilities](#utilities)
- [Examples](#examples)
- [Architecture](#architecture)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

| Feature | Description |
|---------|-------------|
| **100% Groq SDK API** | Complete [groq-sdk](https://github.com/groq/groq-typescript) compatibility - chat, streaming, audio, vision, function calling |
| **RAG Support** | Built-in vector store with document chunking, embedding, and semantic retrieval |
| **Web Fetching** | Fetch and parse web pages to clean markdown with metadata extraction |
| **Web Search** | DuckDuckGo (free), Brave Search, and Serper (Google) integration |
| **Agent System** | ReAct-style autonomous agents with tool use, memory, and streaming |
| **Tool Framework** | Extensible tool system with built-in and custom tools |
| **MCP Integration** | Connect to Model Context Protocol servers for external tool access |
| **Content Limiting** | Optional token/character limits to control API costs |
| **TypeScript** | Full type safety with comprehensive IntelliSense support |
| **Zero Config** | Works out of the box with sensible defaults |
| **Streaming** | Real-time streaming for both chat and agent execution |

## Installation

### From npm (Recommended)

```bash
npm install groq-rag
```

### From GitHub Packages

```bash
# Add to your .npmrc
echo "@mithun50:registry=https://npm.pkg.github.com" >> .npmrc

# Install
npm install @mithun50/groq-rag
```

**Requirements:**
- Node.js 18.0.0 or higher
- Groq API key (get one at [console.groq.com](https://console.groq.com))

## Quick Start

### Migrating from groq-sdk

Already using the official Groq SDK? Migration is seamless:

```typescript
// Before (groq-sdk)
import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// After (groq-rag) - just change the import!
import GroqRAG from 'groq-rag';
const groq = new GroqRAG({ apiKey: process.env.GROQ_API_KEY });

// All your existing code works exactly the same
// Plus you now have access to RAG, web, and agent features!
```

### Basic Chat (Groq SDK Compatible)

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG({
  apiKey: process.env.GROQ_API_KEY,
});

// Standard Groq SDK chat completion - works exactly the same!
const response = await client.complete({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);

// Access the underlying Groq client for advanced usage
const groqClient = client.client; // Full Groq SDK instance
```

### RAG-Augmented Chat

```typescript
const client = new GroqRAG();

// Initialize RAG with in-memory vector store
await client.initRAG();

// Add documents to the knowledge base
await client.rag.addDocument('Your document content here...');
await client.rag.addDocument('Another document...', { source: 'manual.pdf' });

// Chat with automatic context retrieval
const response = await client.chat.withRAG({
  messages: [{ role: 'user', content: 'What does the document say about X?' }],
  topK: 5,
  minScore: 0.5,
});

console.log(response.content);
console.log('Sources:', response.sources);
```

### Autonomous Agent

```typescript
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  verbose: true,
});

const result = await agent.run('Search for recent AI news and summarize the top 3 stories');

console.log(result.output);
console.log('Tools used:', result.toolCalls.map(t => t.name));
```

## Supported Models

This package supports **all Groq models** through direct API passthrough. Any model available on Groq works with groq-rag.

### Production Models

| Model ID | Developer | Speed | Context | Best For |
|----------|-----------|-------|---------|----------|
| `llama-3.3-70b-versatile` | Meta | 280 T/s | 131K | General purpose, highest quality |
| `llama-3.1-8b-instant` | Meta | 560 T/s | 131K | Fast responses, cost-effective |
| `openai/gpt-oss-120b` | OpenAI | 500 T/s | 131K | Complex reasoning, flagship open model |
| `openai/gpt-oss-20b` | OpenAI | 1000 T/s | 131K | Fast reasoning tasks |

### Compound AI Systems

| Model ID | Description |
|----------|-------------|
| `groq/compound` | AI system with built-in web search & code execution |
| `groq/compound-mini` | Lightweight compound system |

### Preview Models

| Model ID | Developer | Features |
|----------|-----------|----------|
| `meta-llama/llama-4-scout-17b-16e-instruct` | Meta | 🖼️ Vision, 128K context |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | Meta | 🖼️ Vision, 128K context |
| `qwen/qwen3-32b` | Alibaba | Strong reasoning |
| `moonshotai/kimi-k2-instruct-0905` | Moonshot AI | Extended context |
| `deepseek-r1-distill-qwen-32b` | DeepSeek | Math & code reasoning, 128K context |

### Reasoning Models

Best for math, logic, and complex problem-solving:

| Model ID | Strengths |
|----------|-----------|
| `openai/gpt-oss-120b` | Complex reasoning with tools |
| `openai/gpt-oss-20b` | Fast reasoning |
| `qwen/qwen3-32b` | Math, structured thinking |
| `deepseek-r1-distill-qwen-32b` | Math (94.3% MATH-500), code (1691 CodeForces) |

### Vision Models

Support image inputs alongside text:

| Model ID | Max Images | Max Resolution |
|----------|------------|----------------|
| `meta-llama/llama-4-scout-17b-16e-instruct` | 5/request | 33 megapixels |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | 5/request | 33 megapixels |

### Safety & Moderation Models

| Model ID | Purpose |
|----------|---------|
| `meta-llama/llama-guard-4-12b` | Content safety classification (text & images) |
| `openai/gpt-oss-safeguard-20b` | Custom policy enforcement |
| `meta-llama/llama-prompt-guard-2-86m` | Prompt injection detection |
| `meta-llama/llama-prompt-guard-2-22m` | Lightweight injection detection |

### Audio Models

| Model ID | Purpose |
|----------|---------|
| `whisper-large-v3` | Speech-to-text transcription |
| `whisper-large-v3-turbo` | Fast transcription |

### Feature Compatibility

| Feature | Compatible Models |
|---------|-------------------|
| **RAG** | All chat models (11+) |
| **Web Search** | All chat models (11+) |
| **URL Fetch** | All chat models (11+) |
| **Agents (Tool Use)** | All chat models with function calling |
| **Streaming** | All chat models |
| **Vision + RAG** | llama-4-scout, llama-4-maverick |

### References

- 📚 [Groq Models Documentation](https://console.groq.com/docs/models) - Complete model list & specs
- 🧠 [Reasoning Models Guide](https://console.groq.com/docs/reasoning) - Using reasoning models
- 👁️ [Vision Models Guide](https://console.groq.com/docs/vision) - Image input support
- 🛡️ [Content Moderation](https://console.groq.com/docs/content-moderation) - Safety models
- 📖 [Groq API Reference](https://console.groq.com/docs/api-reference) - Full API documentation
- 💰 [Pricing](https://groq.com/pricing) - Model pricing information

> **Note:** Model availability may change. Use the [Groq Models API](https://api.groq.com/openai/v1/models) to get the current list programmatically.

## Core Modules

### GroqRAG Client

The main entry point providing unified access to all functionality. **Built on the official [Groq TypeScript SDK](https://github.com/groq/groq-typescript)** - includes 100% API compatibility plus extended features.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG({
  apiKey: string,        // Groq API key (defaults to GROQ_API_KEY env var)
  baseURL?: string,      // Custom API base URL
  timeout?: number,      // Request timeout in milliseconds
  maxRetries?: number,   // Max retry attempts (default: 2)
});

// Access the underlying Groq SDK client directly
const groqSdk = client.client; // Full Groq SDK instance
```

**Groq SDK Passthrough Methods:**

| Method | Description |
|--------|-------------|
| `complete(params)` | Chat completion (Groq SDK passthrough) |
| `stream(params)` | Streaming chat completion (Groq SDK passthrough) |
| `client` | Direct access to underlying Groq SDK instance |

**Extended Methods:**

| Method | Description |
|--------|-------------|
| `initRAG(options)` | Initialize RAG with vector store and embeddings |
| `createAgent(config)` | Create a basic agent |
| `createAgentWithBuiltins(config)` | Create agent with all built-in tools |
| `getRetriever()` | Get the RAG retriever instance |

**Sub-modules:**
- `client.chat` - Enhanced chat methods (withRAG, withWebSearch, withUrl)
- `client.web` - Web operations (fetch, search, fetchMany)
- `client.rag` - Knowledge base management (addDocument, query, getContext)

**Using Groq SDK Features Directly:**

```typescript
// All Groq SDK APIs are accessible
const client = new GroqRAG();

// Chat completions
const chat = await client.client.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: 'Hello!' }],
});

// Audio transcription
const transcription = await client.client.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-large-v3',
});

// List available models
const models = await client.client.models.list();
```

---

### RAG Module

Manage your knowledge base with document ingestion, chunking, and semantic retrieval.

#### Initialization

```typescript
await client.initRAG({
  embedding: {
    provider: 'groq' | 'openai',
    apiKey?: string,
    model?: string,
    dimensions?: number,
  },
  vectorStore: {
    provider: 'memory' | 'chroma',
    connectionString?: string,
    indexName?: string,
  },
  chunking: {
    strategy: 'recursive' | 'fixed' | 'sentence' | 'paragraph',
    chunkSize: 1000,
    chunkOverlap: 200,
  },
});
```

#### Document Operations

```typescript
// Add single document
await client.rag.addDocument(content: string, metadata?: Record<string, unknown>);

// Add multiple documents
await client.rag.addDocuments([
  { content: 'Document 1...', metadata: { source: 'file1.txt' } },
  { content: 'Document 2...', metadata: { source: 'file2.txt' } },
]);

// Add URL content directly
await client.rag.addUrl('https://example.com');
```

#### Querying

```typescript
// Semantic search
const results = await client.rag.query('search query', {
  topK: 5,
  minScore: 0.5,
});

// Get formatted context for LLM
const context = await client.rag.getContext('query', {
  includeMetadata: true,
  maxTokens: 4000,
});
```

#### Management

```typescript
await client.rag.clear();        // Clear all documents
const count = await client.rag.count();  // Get document count
```

---

### Web Module

Fetch, parse, and search the web.

#### Fetching URLs

```typescript
// Fetch single URL
const result = await client.web.fetch(url, {
  headers?: Record<string, string>,
  timeout?: number,           // Default: 30000ms
  maxLength?: number,         // Max content length
  includeLinks?: boolean,     // Extract links
  includeImages?: boolean,    // Extract images
  maxContentLength?: number,  // Truncate content to N chars (optional)
  maxTokens?: number,         // Truncate to ~N tokens (optional, ~4 chars/token)
});

// Returns:
// {
//   url: string,
//   title?: string,
//   content: string,
//   markdown?: string,
//   links?: Array<{ text: string, href: string }>,
//   images?: Array<{ alt: string, src: string }>,
//   metadata?: { description?, author?, publishedDate? },
//   fetchedAt: Date,
// }

// Fetch multiple URLs
const results = await client.web.fetchMany(['url1', 'url2', 'url3']);

// Get markdown only
const markdown = await client.web.fetchMarkdown(url);
```

#### Web Search

```typescript
const results = await client.web.search('query', {
  maxResults?: number,            // Default: 10
  safeSearch?: boolean,           // Default: true
  language?: string,
  region?: string,
  maxSnippetLength?: number,      // Truncate each snippet to N chars (optional)
  maxTotalContentLength?: number, // Max total chars for all results (optional)
});

// Returns:
// Array<{
//   title: string,
//   url: string,
//   snippet: string,
//   position: number,
// }>
```

---

### Chat Module

Enhanced chat methods with built-in RAG and web integration.

#### RAG-Augmented Chat

```typescript
const response = await client.chat.withRAG({
  messages: Message[],
  model?: string,
  topK?: number,           // Documents to retrieve (default: 5)
  minScore?: number,       // Minimum similarity (default: 0.5)
  includeMetadata?: boolean,
  systemPrompt?: string,
  temperature?: number,
  maxTokens?: number,
});

// Returns:
// {
//   content: string,
//   sources: SearchResult[],
//   usage?: { promptTokens, completionTokens, totalTokens },
// }
```

#### Web Search Chat

```typescript
const response = await client.chat.withWebSearch({
  messages: Message[],
  model?: string,
  searchQuery?: string,           // Custom search query
  maxResults?: number,            // Search results to include
  maxSnippetLength?: number,      // Truncate each snippet (optional)
  maxTotalContentLength?: number, // Max total chars for context (optional)
});
```

#### URL Content Chat

```typescript
const response = await client.chat.withUrl({
  messages: Message[],
  url: string,
  model?: string,
  maxContentLength?: number,  // Truncate content to N chars (optional)
  maxTokens?: number,         // Truncate to ~N tokens (optional)
});
```

#### Vision Chat with Tools

Analyze images with vision models and automatically use tools (web search, calculator, MCP) to provide enhanced responses.

```typescript
const response = await client.chat.withVision({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is this and find more info about it' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
      ]
    }
  ],
  visionModel?: string,      // Default: 'meta-llama/llama-4-scout-17b-16e-instruct'
  agentModel?: string,       // Default: 'llama-3.3-70b-versatile'
  useTools?: boolean,        // Enable agent tools (default: true)
  includeMCP?: boolean,      // Include MCP tools (default: false)
  maxIterations?: number,    // Agent iterations (default: 5)
});

// Returns:
// {
//   content: string,          // Final response with tool-enhanced info
//   imageAnalysis: string,    // Raw vision model description
//   toolCalls: Array<{        // Tools that were used
//     name: string,
//     args: unknown,
//     result: unknown,
//   }>,
// }
```

**How it works:**
1. Vision model analyzes the image(s)
2. Agent takes the analysis + user question
3. Agent uses tools (web search, calculator, MCP) if needed
4. Returns comprehensive answer with sources

---

### Agent System

Create autonomous agents that reason and use tools to accomplish tasks.

#### Creating Agents

```typescript
// Basic agent with custom tools
const agent = client.createAgent({
  name?: string,
  model?: string,
  systemPrompt?: string,
  tools?: ToolDefinition[],
  maxIterations?: number,  // Default: 10
  verbose?: boolean,       // Log agent reasoning
});

// Agent with all built-in tools
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  verbose: true,
});
```

#### Running Agents

```typescript
// Synchronous execution
const result = await agent.run('Your task description');

// Returns:
// {
//   output: string,        // Final answer
//   steps: AgentStep[],    // Reasoning steps
//   toolCalls: ToolResult[], // Tools used
//   totalTokens?: number,
// }
```

#### Streaming Execution

```typescript
for await (const event of agent.runStream('Research topic X')) {
  switch (event.type) {
    case 'thought':
      console.log('Thinking:', event.data);
      break;
    case 'content':
      process.stdout.write(event.data as string);
      break;
    case 'tool_call':
      console.log('Calling tool:', event.data);
      break;
    case 'tool_result':
      console.log('Tool result received');
      break;
    case 'done':
      console.log('Agent finished');
      break;
  }
}
```

#### Memory Management

```typescript
agent.clearHistory();              // Reset conversation
const history = agent.getHistory(); // Get conversation history
```

---

### Tool System

Define custom tools for agents to use.

#### Built-in Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web using DuckDuckGo |
| `fetch_url` | Fetch and parse web pages |
| `calculator` | Mathematical calculations |
| `get_datetime` | Get current date/time |
| `rag_query` | Query knowledge base (requires RAG initialization) |

#### Custom Tools

```typescript
import { ToolDefinition } from 'groq-rag';

const myTool: ToolDefinition = {
  name: 'my_tool',
  description: 'Does something useful',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'The input value' },
      count: { type: 'number', description: 'How many times' },
    },
    required: ['input'],
  },
  execute: async (params) => {
    const { input, count = 1 } = params as { input: string; count?: number };
    return { result: input.repeat(count) };
  },
};

const agent = client.createAgent({ tools: [myTool] });
```

#### Tool Executor

```typescript
import { ToolExecutor, createToolExecutor } from 'groq-rag';

const executor = createToolExecutor();
executor.register(myTool);
executor.register(anotherTool);

const result = await executor.execute('my_tool', { input: 'hello' });
```

---

### MCP Integration

Connect to [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers to use external tools from the MCP ecosystem.

#### Adding MCP Servers

```typescript
const client = new GroqRAG();

// Add an MCP server (stdio transport)
await client.mcp.addServer({
  name: 'filesystem',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './data'],
});

// Add another MCP server (e.g., GitHub)
await client.mcp.addServer({
  name: 'github',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
});
```

#### Using MCP Tools with Agents

```typescript
// Create agent with built-in + MCP tools
const agent = await client.createAgentWithBuiltins(
  { model: 'llama-3.3-70b-versatile', verbose: true },
  { includeMCP: true }
);

// Agent can now use tools from all connected MCP servers
const result = await agent.run('List files in the data directory');

// Cleanup when done
await client.mcp.disconnectAll();
```

#### MCP Server Configuration

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | Unique name for the server |
| `transport` | 'stdio' \| 'http' | Transport protocol |
| `command` | string | Command to run (stdio) |
| `args` | string[] | Command arguments (stdio) |
| `env` | object | Environment variables (stdio) |
| `url` | string | Server URL (http) |
| `timeout` | number | Connection timeout (ms) |

#### Standalone MCP Client

```typescript
import { createMCPClient } from 'groq-rag';

// Create and connect to an MCP server
const mcpClient = createMCPClient({
  name: 'filesystem',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
});

await mcpClient.connect();

// Get tools as ToolDefinitions for use with any agent
const tools = mcpClient.getToolsAsDefinitions();
console.log('Available tools:', tools.map(t => t.name));

// Call a tool directly
const result = await mcpClient.callTool('read_file', { path: './README.md' });

await mcpClient.disconnect();
```

#### MCP Module Methods

| Method | Description |
|--------|-------------|
| `client.mcp.addServer(config)` | Connect to an MCP server |
| `client.mcp.removeServer(name)` | Disconnect from a server |
| `client.mcp.getServer(name)` | Get a specific MCP client |
| `client.mcp.getServers()` | List all connected clients |
| `client.mcp.getAllTools()` | Get all tools from all servers |
| `client.mcp.disconnectAll()` | Disconnect from all servers |

#### Popular MCP Servers

| Server | Package | Description |
|--------|---------|-------------|
| Filesystem | `@modelcontextprotocol/server-filesystem` | Read/write local files |
| GitHub | `@modelcontextprotocol/server-github` | GitHub API access |
| Brave Search | `@modelcontextprotocol/server-brave-search` | Web search |
| SQLite | `@modelcontextprotocol/server-sqlite` | SQLite database |
| Memory | `@modelcontextprotocol/server-memory` | Persistent memory |

> See [MCP Servers](https://github.com/modelcontextprotocol/servers) for more available servers.

## Configuration

### Vector Stores

#### In-Memory (Default)

Best for development, testing, and small datasets. No persistence.

```typescript
await client.initRAG({
  vectorStore: { provider: 'memory' },
});
```

#### ChromaDB

Best for production, large datasets, and persistence.

```typescript
await client.initRAG({
  vectorStore: {
    provider: 'chroma',
    connectionString: 'http://localhost:8000',
    indexName: 'my-collection',
  },
});
```

---

### Embedding Providers

#### Groq Embeddings (Default)

Deterministic pseudo-embeddings for testing. No API cost.

```typescript
await client.initRAG({
  embedding: { provider: 'groq' },
});
```

#### OpenAI Embeddings

High-quality embeddings for production use.

```typescript
await client.initRAG({
  embedding: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
});
```

---

### Search Providers

#### DuckDuckGo (Default)

Free, no API key required.

```typescript
import { createSearchProvider } from 'groq-rag';
const search = createSearchProvider({ provider: 'duckduckgo' });
```

#### Brave Search

High-quality results, requires API key.

```typescript
const search = createSearchProvider({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY,
});
```

#### Serper (Google)

Google search via Serper API.

```typescript
const search = createSearchProvider({
  provider: 'serper',
  apiKey: process.env.SERPER_API_KEY,
});
```

---

### Chunking Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `recursive` | Splits by separators with fallback | General purpose (default) |
| `fixed` | Fixed character size with overlap | Uniform chunk sizes |
| `sentence` | Splits by sentence boundaries | Preserving sentence context |
| `paragraph` | Splits by paragraphs | Document structure |
| `semantic` | Context-aware boundaries | Preserving meaning |

```typescript
await client.initRAG({
  chunking: {
    strategy: 'recursive',
    chunkSize: 1000,
    chunkOverlap: 200,
  },
});
```

---

### Content Limiting (Token Control)

Control content size to avoid burning API tokens. All limits are **optional** - if not set, full content is returned.

#### Web Search Limiting

```typescript
// Limit search result content
const results = await client.web.search('query', {
  maxResults: 5,
  maxSnippetLength: 200,        // Max 200 chars per snippet
  maxTotalContentLength: 2000,  // Max 2000 chars total
});
```

#### URL Fetch Limiting

```typescript
// Limit fetched page content
const result = await client.web.fetch(url, {
  maxContentLength: 5000,  // Max 5000 characters
});

// Or use token-based limiting (~4 chars per token)
const result = await client.web.fetch(url, {
  maxTokens: 1000,  // ~4000 characters
});
```

#### Chat with Content Limits

```typescript
// Web search with limits
const response = await client.chat.withWebSearch({
  messages: [{ role: 'user', content: 'Latest AI news?' }],
  maxResults: 3,
  maxSnippetLength: 150,
  maxTotalContentLength: 1500,
});

// URL chat with limits
const response = await client.chat.withUrl({
  messages: [{ role: 'user', content: 'Summarize this page' }],
  url: 'https://example.com/article',
  maxTokens: 2000,  // Limit context to ~2000 tokens
});
```

#### Built-in Tools with Limits

When using agents, the tools also support content limiting:

```typescript
// web_search tool parameters
{
  query: 'search query',
  maxResults: 5,
  maxSnippetLength: 200,         // Optional
  maxTotalContentLength: 2000,   // Optional
}

// fetch_url tool parameters
{
  url: 'https://example.com',
  maxContentLength: 5000,  // Optional
  maxTokens: 1000,         // Optional
}
```

**Why use content limiting?**
- Reduce API token costs
- Prevent context overflow on large pages
- Faster responses with less data
- More focused, relevant context

## Utilities

Standalone utility functions exported for direct use.

```typescript
import {
  chunkText,
  cosineSimilarity,
  estimateTokens,
  truncateToTokens,
  formatContext,
  extractUrls,
  cleanText,
  generateId,
  sleep,
  retry,
  batch,
  safeJsonParse,
} from 'groq-rag';

// Chunk text manually
const chunks = chunkText('Long text...', 'doc-id', {
  strategy: 'recursive',
  chunkSize: 500,
  chunkOverlap: 100,
});

// Calculate vector similarity
const similarity = cosineSimilarity(embedding1, embedding2);

// Estimate tokens
const tokenCount = estimateTokens('Some text');

// Truncate to token limit
const truncated = truncateToTokens('Long text...', 1000);

// Format retrieved docs for LLM
const context = formatContext(searchResults, { includeMetadata: true });

// Extract URLs from text
const urls = extractUrls('Check out https://example.com for more');

// Retry with exponential backoff
const result = await retry(() => fetchData(), { maxRetries: 3 });

// Split array into batches
const batches = batch(items, 10);  // Returns T[][]
for (const group of batches) {
  await processBatch(group);
}
```

## Examples

Complete examples in the [examples/](./examples) directory:

| Example | Description |
|---------|-------------|
| `basic-chat.ts` | Simple chat completion |
| `rag-chat.ts` | RAG-augmented conversation |
| `web-search.ts` | Web search integration |
| `url-fetch.ts` | URL fetching and summarization |
| `agent.ts` | Agent with tools |
| `streaming-agent.ts` | Streaming agent execution |
| `mcp-tools.ts` | **MCP server integration** |
| `full-chatbot.ts` | **Full-featured interactive CLI chatbot** |

### Running the Full Chatbot

The `full-chatbot.ts` example demonstrates all groq-rag capabilities:

```bash
GROQ_API_KEY=your_key npx tsx examples/full-chatbot.ts
```

**Capabilities:**
- Agent Mode: Automatically uses web search, URL fetch, calculator, and RAG
- RAG Mode: Uses knowledge base for context-aware responses
- Custom system prompts and context management
- Knowledge base management (add URLs, custom text)
- Web search and URL fetching

**Commands:**
```
/help        - Show all commands
/add <url>   - Add URL to knowledge base
/addtext     - Add custom text to knowledge
/search <q>  - Web search
/fetch <url> - Fetch and summarize URL
/prompt      - Set custom system prompt
/context     - Set additional context
/mode        - Toggle agent/RAG mode
/clear       - Clear chat history
/quit        - Exit
```

## Architecture

```
groq-rag/
├── src/
│   ├── index.ts          # Public API exports
│   ├── client.ts         # GroqRAG client class
│   ├── types.ts          # TypeScript interfaces
│   ├── rag/
│   │   ├── retriever.ts  # Document retrieval orchestrator
│   │   ├── vectorStore.ts # Vector store implementations
│   │   └── embeddings.ts # Embedding providers
│   ├── web/
│   │   ├── fetcher.ts    # Web page fetching
│   │   └── search.ts     # Search providers
│   ├── tools/
│   │   ├── executor.ts   # Tool execution engine
│   │   └── builtins.ts   # Built-in tools
│   ├── mcp/
│   │   ├── client.ts     # MCP client implementation
│   │   ├── adapter.ts    # MCP to ToolDefinition conversion
│   │   └── transports/   # Stdio and HTTP transports
│   ├── agents/
│   │   └── agent.ts      # ReAct agent implementation
│   └── utils/
│       ├── chunker.ts    # Text chunking
│       └── helpers.ts    # Utility functions
├── tests/                # Test files
└── examples/             # Usage examples
```

**Data Flow:**

```
Document Ingestion:
  Document → Chunker → Embeddings → Vector Store

Query Flow:
  Query → Embedding → Vector Search → Top-K Results → LLM Context

Agent Flow:
  User Input → Agent Loop → Tool Selection → Tool Execution → Response
```

## Development

```bash
# Clone repository
git clone https://github.com/mithun50/groq-rag.git
cd groq-rag

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint

# Type check
npm run typecheck
```

## Benchmarks

Performance benchmarks for groq-rag SDK operations.

### Local Processing (CPU-bound)

| Operation | Ops/sec | Avg Time |
|-----------|---------|----------|
| Content Truncation | **1,743,317** | 0.0006ms |
| Context Formatting | **330,914** | 0.003ms |
| Text Chunking | **84,861** | 0.01ms |

### Network Operations (I/O-bound)

| Operation | Ops/sec | Avg Time |
|-----------|---------|----------|
| Groq Chat Completion | 5.27 | 190ms |
| URL Fetch | 5.05 | 198ms |
| Content Limiting (Total) | 4.87 | 205ms |
| Content Limiting (Snippet) | 3.09 | 323ms |
| Chat with URL | 2.61 | 383ms |
| Web Search (DuckDuckGo) | 1.83 | 546ms |
| Chat with Web Search | 0.98 | 1024ms |

> **Note**: Network operations are limited by external API latency (Groq, DuckDuckGo), not SDK performance. Local processing shows the SDK's actual code efficiency.

Run benchmarks:
```bash
npm run benchmark
```

## Changelog

### v0.2.2

- **New Feature: Vision + Tools** - Analyze images with automatic tool enhancement
  - `client.chat.withVision()` - Vision analysis with agent tools (web search, calculator, MCP)
  - Two-step processing: vision model analyzes images, then agent enhances with tools
  - Supports all vision models (Llama 4 Scout, Llama 4 Maverick)
  - Returns image analysis, final content, and tool calls used
- **ToolResult Enhancement** - Added `args` property to track tool input parameters
- **Demo Website Updates** - All Groq models, vision-only image upload button, MCP integration fixes

### v0.2.1

- Bug fixes and improvements

### v0.2.0

- MCP (Model Context Protocol) support improvements
- Browser environment support with `dangerouslyAllowBrowser` option

### v0.1.6

- **New Feature: MCP Integration** - Connect to Model Context Protocol servers
  - `client.mcp.addServer()` - Connect to MCP servers (stdio/http)
  - `client.mcp.getAllTools()` - Get tools from connected servers
  - `createAgentWithBuiltins({ includeMCP: true })` - Include MCP tools in agents
  - Support for `@modelcontextprotocol/server-*` packages
  - Standalone `createMCPClient()` for direct MCP usage
- **ToolExecutor Enhancement** - Added `registerMCPTools()` and `unregisterMCPTools()`
- **Tests** - Added MCP client and adapter tests

### v0.1.4

- **New Feature: Content Limiting** - Control token usage with optional limits
  - `maxSnippetLength` - Truncate search result snippets
  - `maxTotalContentLength` - Limit total search content
  - `maxContentLength` - Limit fetched URL content
  - `maxTokens` - Token-based content limiting (~4 chars/token)
- **GitHub Templates** - Added issue and PR templates
- **Bug Fixes** - Fixed workflow dist file check
- **Tests** - Added content limiting tests, fixed test hanging issue

### v0.1.3

- Clarified groq-rag includes all groq-sdk functions
- Updated npm badge
- Added GitHub Packages support
- Updated supported models list

### v0.1.2

- Initial public release
- RAG support with vector stores
- Web fetching and search
- Agent system with tools

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process
- Adding new features (vector stores, search providers, tools)

## License

MIT - see [LICENSE](LICENSE) for details.

## Acknowledgments

- **[Groq](https://groq.com/)** - For the blazing fast LPU inference engine
- **[Groq TypeScript SDK](https://github.com/groq/groq-typescript)** - The official SDK this library extends
- **[Groq API](https://console.groq.com/docs)** - For the excellent API documentation

---

**Author:** [mithun50](https://github.com/mithun50)

**Repository:** [github.com/mithun50/groq-rag](https://github.com/mithun50/groq-rag)

**npm:** [npmjs.com/package/groq-rag](https://www.npmjs.com/package/groq-rag)

**GitHub Packages:** [@mithun50/groq-rag](https://github.com/mithun50/groq-rag/packages)

**Built with:** [groq-sdk](https://github.com/groq/groq-typescript) | [cheerio](https://cheerio.js.org/) | [turndown](https://github.com/mixmark-io/turndown)
