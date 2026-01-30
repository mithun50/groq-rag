# API Reference

Complete API documentation for groq-rag.

## Quick Reference

| Module | Access | Key Methods |
|--------|--------|-------------|
| Client | `client` | `complete()`, `stream()`, `initRAG()`, `createAgent()` |
| Chat | `client.chat` | `withRAG()`, `withWebSearch()`, `withUrl()` |
| RAG | `client.rag` | `addDocument()`, `query()`, `getContext()` |
| Web | `client.web` | `fetch()`, `search()`, `fetchMany()` |
| MCP | `client.mcp` | `addServer()`, `getAllTools()`, `disconnectAll()` |
| Agent | `agent` | `run()`, `runStream()`, `addTool()` |

---

## GroqRAG Client

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG({
  apiKey?: string,       // Default: GROQ_API_KEY env
  baseURL?: string,      // Custom API endpoint
  timeout?: number,      // Request timeout (ms)
  maxRetries?: number,   // Retry attempts (default: 2)
});
```

### client.initRAG(options?)

Initialize RAG system.

```typescript
await client.initRAG({
  embedding?: {
    provider: 'groq' | 'openai',
    apiKey?: string,
    model?: string,
    dimensions?: number,
  },
  vectorStore?: {
    provider: 'memory' | 'chroma',
    connectionString?: string,
    indexName?: string,
  },
  chunking?: {
    strategy: 'recursive' | 'fixed' | 'sentence' | 'paragraph' | 'semantic',
    chunkSize?: number,    // Default: 1000
    chunkOverlap?: number, // Default: 200
  },
});
```

### client.complete(params)

Standard chat completion. Supports all [Groq models](https://console.groq.com/docs/models).

```typescript
const response = await client.complete({
  model: string,           // Any Groq chat model
  messages: Message[],
  temperature?: number,
  maxTokens?: number,
});

// Returns: Groq.ChatCompletion
```

**Recommended models:**
- `llama-3.3-70b-versatile` - Best quality
- `llama-3.1-8b-instant` - Fastest
- `openai/gpt-oss-120b` - Complex reasoning
- `groq/compound` - Built-in tools

### client.stream(params)

Streaming chat completion.

```typescript
const stream = await client.stream({ model, messages });

for await (const chunk of stream) {
  console.log(chunk.choices[0]?.delta?.content);
}
```

### client.createAgent(config)

Create agent with custom tools.

```typescript
const agent = client.createAgent({
  name?: string,
  model?: string,          // Any Groq model (default: llama-3.3-70b-versatile)
  systemPrompt?: string,
  tools?: ToolDefinition[],
  maxIterations?: number,  // Default: 10
  verbose?: boolean,       // Log reasoning
});
```

> **Supported models:** All [Groq chat models](https://console.groq.com/docs/models) work with agents.

### client.createAgentWithBuiltins(config, options?)

Create agent with all built-in tools (plus rag_query if RAG is initialized, plus MCP tools if requested).

```typescript
const agent = await client.createAgentWithBuiltins(
  {
    model?: string,
    systemPrompt?: string,
    verbose?: boolean,
  },
  {
    includeMCP?: boolean,  // Include tools from connected MCP servers
  }
);

// Built-in tools: web_search, fetch_url, calculator, get_datetime
// + rag_query (only if client.initRAG() was called first)
// + MCP tools (only if includeMCP: true and servers are connected)
```

---

## MCP Module

Access: `client.mcp`

Connect to [Model Context Protocol](https://modelcontextprotocol.io/) servers for external tools.

### mcp.addServer(config)

Connect to an MCP server.

```typescript
const mcpClient = await client.mcp.addServer({
  name: string,              // Unique server name
  transport: 'stdio' | 'http',
  // For stdio transport:
  command?: string,          // Command to run
  args?: string[],           // Command arguments
  env?: Record<string, string>, // Environment variables
  // For http transport:
  url?: string,              // Server URL
  // Common options:
  timeout?: number,          // Connection timeout (ms)
});

// Returns: MCPClient instance
```

### mcp.removeServer(name)

Disconnect from a server.

```typescript
await client.mcp.removeServer('github');
```

### mcp.getServer(name)

Get a specific MCP client.

```typescript
const github = client.mcp.getServer('github');
if (github) {
  const tools = github.getToolsAsDefinitions();
}
```

### mcp.getServers()

Get all connected MCP clients.

```typescript
const servers = client.mcp.getServers();
// Returns: MCPClient[]
```

### mcp.getAllTools()

Get all tools from all connected servers.

```typescript
const tools = await client.mcp.getAllTools();
// Returns: ToolDefinition[]
```

### mcp.disconnectAll()

Disconnect from all servers.

```typescript
await client.mcp.disconnectAll();
```

### mcp.hasServers()

Check if any servers are connected.

```typescript
if (client.mcp.hasServers()) {
  // ...
}
```

### mcp.getServerCount()

Get number of connected servers.

```typescript
const count = client.mcp.getServerCount();
```

---

## Standalone MCP Client

For advanced usage without the GroqRAG client.

```typescript
import { createMCPClient, MCPClient } from 'groq-rag';

const client = createMCPClient({
  name: 'filesystem',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './data'],
});

await client.connect();

// Get tools
const tools = client.getToolsAsDefinitions();

// Call a tool directly
const result = await client.callTool('read_file', { path: './README.md' });

// Get server info
const info = client.getServerInfo();

// Check state
const state = client.getState(); // 'disconnected' | 'connecting' | 'connected' | 'error'

await client.disconnect();
```

---

## Chat Module

Access: `client.chat`

### chat.withRAG(options)

Chat with knowledge base context.

```typescript
const response = await client.chat.withRAG({
  messages: Message[],       // Required
  model?: string,
  topK?: number,             // Docs to retrieve (default: 5)
  minScore?: number,         // Min similarity (default: 0.5)
  includeMetadata?: boolean,
  systemPrompt?: string,
  temperature?: number,
  maxTokens?: number,
});

// Returns: { content: string, sources: SearchResult[], usage?: {...} }
```

### chat.withWebSearch(options)

Chat with web search results.

```typescript
const response = await client.chat.withWebSearch({
  messages: Message[],
  model?: string,
  searchQuery?: string,      // Custom query (default: last message)
  maxResults?: number,       // Default: 5
});

// Returns: { content: string, sources: WebSearchResult[] }
```

### chat.withUrl(options)

Chat about URL content.

```typescript
const response = await client.chat.withUrl({
  messages: Message[],
  url: string,               // Required
  model?: string,
});

// Returns: { content: string, source: FetchResult }
```

---

## RAG Module

Access: `client.rag`

### rag.addDocument(content, metadata?)

Add document to knowledge base.

```typescript
await client.rag.addDocument(
  content: string,
  metadata?: { source?: string, [key: string]: any }
);
```

### rag.addDocuments(docs)

Add multiple documents.

```typescript
await client.rag.addDocuments([
  { content: 'text', metadata: { source: 'file.txt' } },
  ...
]);
```

### rag.addUrl(url, metadata?)

Add URL content to knowledge base.

```typescript
await client.rag.addUrl('https://example.com', { category: 'docs' });
```

### rag.query(query, options?)

Semantic search.

```typescript
const results = await client.rag.query('search text', {
  topK?: number,      // Default: 5
  minScore?: number,  // Default: 0
});

// Returns: SearchResult[]
// [{ document: { content, metadata }, score: 0.85 }, ...]
```

### rag.getContext(query, options?)

Get formatted context for prompts.

```typescript
const context = await client.rag.getContext('query', {
  topK?: number,
  minScore?: number,
  includeMetadata?: boolean,
  maxTokens?: number,
});

// Returns: string (formatted context)
```

### rag.clear()

Clear all documents.

```typescript
await client.rag.clear();
```

### rag.count()

Get chunk count.

```typescript
const count = await client.rag.count();
```

---

## Web Module

Access: `client.web`

### web.fetch(url, options?)

Fetch and parse URL.

```typescript
const result = await client.web.fetch('https://example.com', {
  headers?: Record<string, string>,
  timeout?: number,        // Default: 30000
  maxLength?: number,
  includeLinks?: boolean,
  includeImages?: boolean,
});

// Returns: FetchResult
// { url, title, content, markdown, links, images, metadata, fetchedAt }
```

### web.fetchMany(urls, options?)

Fetch multiple URLs in parallel.

```typescript
const results = await client.web.fetchMany(['url1', 'url2']);

// Returns: FetchResult[]
```

### web.fetchMarkdown(url)

Get markdown only.

```typescript
const markdown = await client.web.fetchMarkdown('https://example.com');
```

### web.search(query, options?)

Web search.

```typescript
const results = await client.web.search('query', {
  maxResults?: number,   // Default: 10
  safeSearch?: boolean,  // Default: true
  language?: string,
  region?: string,
});

// Returns: WebSearchResult[]
// [{ title, url, snippet, position }, ...]
```

---

## Agent

### agent.run(input)

Execute task.

```typescript
const result = await agent.run('Search for AI news');

// Returns: AgentResult
// {
//   output: string,
//   steps: AgentStep[],
//   toolCalls: ToolResult[],
//   totalTokens?: number,
// }
```

### agent.runStream(input)

Stream execution.

```typescript
for await (const event of agent.runStream('task')) {
  // event.type: 'thought' | 'content' | 'tool_call' | 'tool_result' | 'done'
  // event.data: varies by type
}
```

### agent.addTool(tool)

Add tool at runtime.

```typescript
agent.addTool(toolDefinition);
```

### agent.clearHistory()

Reset conversation.

```typescript
agent.clearHistory();
```

### agent.getHistory()

Get conversation history.

```typescript
const history = agent.getHistory();
// Returns: Message[]
```

---

## Tool System

### ToolDefinition

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}
```

### Creating Tools

```typescript
const myTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get weather for a city',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' }
    },
    required: ['city']
  },
  execute: async ({ city }) => {
    return { temp: 72, city };
  }
};
```

### Built-in Tool Factories

```typescript
import {
  createWebSearchTool,
  createFetchUrlTool,
  createRAGQueryTool,
  createCalculatorTool,
  createDateTimeTool,
  getBuiltinTools,
} from 'groq-rag';

// Get default built-in tools (sync, no rag_query)
const defaultTools = getBuiltinTools();
// Returns: [web_search, fetch_url, calculator, get_datetime]

// Create RAG tool separately (requires retriever)
const retriever = await client.getRetriever();
const ragTool = createRAGQueryTool(retriever);
```

---

## Utilities

```typescript
import {
  chunkText,          // Split text into chunks
  cosineSimilarity,   // Vector similarity (0-1)
  estimateTokens,     // Estimate token count
  truncateToTokens,   // Truncate to limit
  formatContext,      // Format results for LLM
  extractUrls,        // Extract URLs from text
  cleanText,          // Normalize whitespace
  generateId,         // Generate unique ID
  sleep,              // Async delay
  retry,              // Retry with backoff
  batch,              // Split array into chunks (returns T[][])
  safeJsonParse,      // Safe JSON parse
} from 'groq-rag';
```

### Usage Examples

```typescript
// Chunk text
const chunks = chunkText('long text...', 'doc-1', { chunkSize: 500 });

// Similarity
const score = cosineSimilarity(vec1, vec2);

// Tokens
const count = estimateTokens('some text');
const truncated = truncateToTokens('long text', 1000);

// Retry with backoff
const result = await retry(() => apiCall(), { maxRetries: 3 });

// Batch array into chunks
const batches = batch(items, 10);  // Returns T[][]
for (const group of batches) {
  await processGroup(group);
}
```

---

## Types

### Core Types

```typescript
// Message
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Search Result
interface SearchResult {
  document: DocumentChunk;
  score: number;
}

// Document Chunk
interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

// Fetch Result
interface FetchResult {
  url: string;
  title?: string;
  content: string;
  markdown?: string;
  fetchedAt: Date;
}

// Web Search Result
interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

// Agent Result
interface AgentResult {
  output: string;
  steps: AgentStep[];
  toolCalls: ToolResult[];
}

// Tool Result
interface ToolResult {
  name: string;
  result: unknown;
  error?: string;
}
```

### Configuration Types

```typescript
interface EmbeddingConfig {
  provider: 'groq' | 'openai' | 'local' | 'custom';
  model?: string;
  apiKey?: string;
  baseURL?: string;
  dimensions?: number;
}

interface VectorStoreConfig {
  provider: 'memory' | 'chroma' | 'pinecone' | 'qdrant' | 'custom';
  connectionString?: string;
  apiKey?: string;
  namespace?: string;
  indexName?: string;
}

interface ChunkingOptions {
  strategy: 'recursive' | 'fixed' | 'sentence' | 'paragraph' | 'semantic';
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

// MCP Types
interface MCPServerConfig {
  name: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  timeout?: number;
}

type MCPClientState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface MCPToolCallResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}
```
