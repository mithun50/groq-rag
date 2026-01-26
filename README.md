# groq-rag

[![npm version](https://badge.fury.io/js/groq-rag.svg)](https://www.npmjs.com/package/groq-rag)
[![GitHub Package](https://img.shields.io/badge/GitHub%20Package-@mithun50%2Fgroq--rag-blue)](https://github.com/mithun50/groq-rag/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://groq-rag.onrender.com)

Extended Groq SDK with RAG (Retrieval-Augmented Generation), web browsing, and autonomous agent capabilities. Build intelligent AI applications that can search the web, fetch URLs, query knowledge bases, and reason through complex tasks.

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
| **RAG Support** | Built-in vector store with document chunking, embedding, and semantic retrieval |
| **Web Fetching** | Fetch and parse web pages to clean markdown with metadata extraction |
| **Web Search** | DuckDuckGo (free), Brave Search, and Serper (Google) integration |
| **Agent System** | ReAct-style autonomous agents with tool use, memory, and streaming |
| **Tool Framework** | Extensible tool system with built-in and custom tools |
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

### Basic Chat

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG({
  apiKey: process.env.GROQ_API_KEY,
});

const response = await client.complete({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);
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

The main entry point providing unified access to all functionality.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG({
  apiKey: string,        // Groq API key (defaults to GROQ_API_KEY env var)
  baseURL?: string,      // Custom API base URL
  timeout?: number,      // Request timeout in milliseconds
  maxRetries?: number,   // Max retry attempts (default: 2)
});
```

**Methods:**

| Method | Description |
|--------|-------------|
| `initRAG(options)` | Initialize RAG with vector store and embeddings |
| `complete(params)` | Standard chat completion (passthrough to Groq) |
| `stream(params)` | Streaming chat completion |
| `createAgent(config)` | Create a basic agent |
| `createAgentWithBuiltins(config)` | Create agent with all built-in tools |
| `getRetriever()` | Get the RAG retriever instance |

**Sub-modules:**
- `client.chat` - Enhanced chat methods (withRAG, withWebSearch, withUrl)
- `client.web` - Web operations (fetch, search, fetchMany)
- `client.rag` - Knowledge base management (addDocument, query, getContext)

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
  timeout?: number,        // Default: 30000ms
  maxLength?: number,      // Max content length
  includeLinks?: boolean,  // Extract links
  includeImages?: boolean, // Extract images
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
  maxResults?: number,   // Default: 10
  safeSearch?: boolean,  // Default: true
  language?: string,
  region?: string,
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
  searchQuery?: string,    // Custom search query
  maxResults?: number,     // Search results to include
});
```

#### URL Content Chat

```typescript
const response = await client.chat.withUrl({
  messages: Message[],
  url: string,
  model?: string,
});
```

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

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process
- Adding new features (vector stores, search providers, tools)

## License

MIT - see [LICENSE](LICENSE) for details.

---

**Author:** [mithun50](https://github.com/mithun50)

**Repository:** [github.com/mithun50/groq-rag](https://github.com/mithun50/groq-rag)

**npm:** [npmjs.com/package/groq-rag](https://www.npmjs.com/package/groq-rag)

**GitHub Packages:** [@mithun50/groq-rag](https://github.com/mithun50/groq-rag/packages)
