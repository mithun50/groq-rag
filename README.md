# groq-rag

[![npm version](https://badge.fury.io/js/groq-rag.svg)](https://www.npmjs.com/package/groq-rag)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

Extended Groq SDK with RAG (Retrieval-Augmented Generation), web browsing, and agent capabilities. Build AI agents that can search the web, fetch URLs, query knowledge bases, and more.

## Features

- **RAG Support**: Built-in vector store and document retrieval with chunking strategies
- **Web Fetching**: Fetch and parse web pages to clean markdown
- **Web Search**: DuckDuckGo (free), Brave Search, and Serper (Google) integration
- **Tool System**: Extensible tool framework with built-in tools
- **Agents**: ReAct-style agents with tool use, memory, and streaming
- **TypeScript**: Full type safety and IntelliSense support
- **Zero Config**: Works out of the box with sensible defaults

## Supported Models

This package works with all Groq-supported models. Recommended models:

| Model | Description | Best For |
|-------|-------------|----------|
| `llama-3.3-70b-versatile` | Latest Llama 3.3 70B | General purpose, best quality |
| `llama-3.1-8b-instant` | Fast Llama 3.1 8B | Quick responses, lower cost |
| `qwen/qwen3-32b` | Qwen 3 32B | Alternative, good reasoning |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout | Vision tasks, newest |

See [Groq Models](https://console.groq.com/docs/models) for the full list.

## Installation

```bash
npm install groq-rag
```

## Quick Start

### Basic Chat

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG({
  apiKey: process.env.GROQ_API_KEY,
});

const response = await client.complete({
  model: 'llama-3.3-70b-versatile',
  messages: [
    { role: 'user', content: 'Hello!' },
  ],
});

console.log(response.choices[0].message.content);
```

### RAG-Augmented Chat

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

// Initialize RAG (uses in-memory vector store by default)
await client.initRAG();

// Add documents to the knowledge base
await client.rag.addDocument('Your document content here...');
await client.rag.addDocument('Another document...', { source: 'manual.pdf' });

// Chat with context retrieval
const response = await client.chat.withRAG({
  messages: [{ role: 'user', content: 'What does the document say about X?' }],
  topK: 5,        // Number of chunks to retrieve
  minScore: 0.5,  // Minimum similarity score
});

console.log(response.content);
console.log('Sources:', response.sources);
```

### Web Search Chat

```typescript
const response = await client.chat.withWebSearch({
  messages: [{ role: 'user', content: 'Latest AI news?' }],
  maxResults: 5,
});

console.log(response.content);
console.log('Sources:', response.sources);
```

### URL Fetching

```typescript
// Fetch and parse a URL
const result = await client.web.fetch('https://example.com');
console.log(result.title);
console.log(result.markdown);

// Chat about a URL's content
const response = await client.chat.withUrl({
  messages: [{ role: 'user', content: 'Summarize this page' }],
  url: 'https://example.com/article',
});
```

### Agents with Tools

```typescript
// Create agent with built-in tools
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  verbose: true,
});

const result = await agent.run('Search for recent AI news and summarize the top 3 stories');
console.log(result.output);
console.log('Tools used:', result.toolCalls.map(t => t.name));
```

### Streaming Agent

```typescript
const agent = await client.createAgentWithBuiltins();

for await (const event of agent.runStream('Research topic X')) {
  switch (event.type) {
    case 'content':
      process.stdout.write(event.data as string);
      break;
    case 'tool_call':
      console.log('\n[Calling tool...]');
      break;
    case 'tool_result':
      console.log('[Tool completed]');
      break;
  }
}
```

## API Reference

### GroqRAG Client

```typescript
const client = new GroqRAG({
  apiKey?: string,      // Groq API key (defaults to GROQ_API_KEY env var)
  baseURL?: string,     // Custom API base URL
  timeout?: number,     // Request timeout in milliseconds
  maxRetries?: number,  // Max retry attempts (default: 2)
});
```

### RAG Module

```typescript
// Initialize with custom configuration
await client.initRAG({
  embedding: {
    provider: 'groq' | 'openai',
    apiKey: 'optional-key',
    model: 'text-embedding-3-small',
  },
  vectorStore: {
    provider: 'memory' | 'chroma',
    connectionString: 'http://localhost:8000',
    indexName: 'my-collection',
  },
  chunking: {
    strategy: 'recursive' | 'fixed' | 'sentence' | 'paragraph',
    chunkSize: 1000,
    chunkOverlap: 200,
  },
});

// Document operations
await client.rag.addDocument(content, metadata?);
await client.rag.addDocuments([{ content, metadata }]);
await client.rag.addUrl('https://example.com');

// Querying
const results = await client.rag.query('search query', { topK: 5, minScore: 0.5 });
const context = await client.rag.getContext('query', { includeMetadata: true });

// Management
await client.rag.clear();
const count = await client.rag.count();
```

### Web Module

```typescript
// Fetch URLs
const result = await client.web.fetch(url, {
  headers: {},
  timeout: 30000,
  includeLinks: true,
  includeImages: false,
});

const results = await client.web.fetchMany(urls);
const markdown = await client.web.fetchMarkdown(url);

// Search the web
const results = await client.web.search('query', {
  maxResults: 10,
  safeSearch: true,
});
```

### Chat Module

```typescript
// RAG-augmented chat
await client.chat.withRAG({
  messages,
  model?: string,
  topK?: number,
  minScore?: number,
  includeMetadata?: boolean,
  systemPrompt?: string,
});

// Web search chat
await client.chat.withWebSearch({
  messages,
  model?: string,
  searchQuery?: string,
  maxResults?: number,
});

// URL content chat
await client.chat.withUrl({
  messages,
  url: string,
  model?: string,
});
```

### Agents

```typescript
// Create basic agent
const agent = client.createAgent({
  name?: string,
  model?: string,
  systemPrompt?: string,
  tools?: ToolDefinition[],
  maxIterations?: number,
  verbose?: boolean,
});

// Create with built-in tools
const agent = await client.createAgentWithBuiltins(config);

// Execute
const result = await agent.run('task description');

// Stream execution
for await (const event of agent.runStream('task')) {
  // Handle events: 'content', 'tool_call', 'tool_result', 'done'
}

// Memory management
agent.clearHistory();
const history = agent.getHistory();
```

### Built-in Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web using DuckDuckGo |
| `fetch_url` | Fetch and parse web pages |
| `rag_query` | Query the knowledge base |
| `calculator` | Mathematical calculations |
| `get_datetime` | Get current date/time |

### Custom Tools

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

## Configuration

### Vector Store Providers

#### In-Memory (Default)

```typescript
await client.initRAG({
  vectorStore: { provider: 'memory' },
});
```

Best for: Development, testing, small datasets.

#### ChromaDB

```typescript
await client.initRAG({
  vectorStore: {
    provider: 'chroma',
    connectionString: 'http://localhost:8000',
    indexName: 'my-collection',
  },
});
```

Best for: Production, large datasets, persistence.

### Embedding Providers

#### Groq (Default)

Uses a deterministic pseudo-embedding for demos. Suitable for testing.

```typescript
await client.initRAG({
  embedding: { provider: 'groq' },
});
```

#### OpenAI

For production use with high-quality embeddings:

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

### Search Providers

#### DuckDuckGo (Default, No API Key)

```typescript
import { createSearchProvider } from 'groq-rag';
const search = createSearchProvider({ provider: 'duckduckgo' });
```

#### Brave Search

```typescript
const search = createSearchProvider({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY,
});
```

#### Serper (Google)

```typescript
const search = createSearchProvider({
  provider: 'serper',
  apiKey: process.env.SERPER_API_KEY,
});
```

## Text Chunking Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `recursive` | Splits by separators, falls back to smaller separators | General purpose (default) |
| `fixed` | Fixed character size with overlap | Uniform chunk sizes |
| `sentence` | Splits by sentence boundaries | Preserving sentence context |
| `paragraph` | Splits by paragraphs | Document structure preservation |

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

```typescript
import {
  chunkText,
  cosineSimilarity,
  estimateTokens,
  formatContext,
  extractUrls,
} from 'groq-rag';

// Chunk text manually
const chunks = chunkText('Long text...', 'doc-id', { chunkSize: 500 });

// Calculate similarity
const similarity = cosineSimilarity(embedding1, embedding2);

// Estimate tokens
const tokenCount = estimateTokens('Some text');
```

## Examples

See the [examples](./examples) directory for complete usage examples:

- `basic-chat.ts` - Simple chat completion
- `rag-chat.ts` - RAG-augmented conversation
- `web-search.ts` - Web search integration
- `url-fetch.ts` - URL fetching and summarization
- `agent.ts` - Agent with tools
- `streaming-agent.ts` - Streaming agent execution
- `full-chatbot.ts` - **Full-featured interactive chatbot** with all capabilities

### Full Chatbot Example

The `full-chatbot.ts` example demonstrates all groq-rag features in an interactive CLI:

```bash
GROQ_API_KEY=your_key npx tsx examples/full-chatbot.ts
```

Features:
- **Agent Mode**: Automatically uses web search, URL fetch, calculator, and RAG
- **RAG Mode**: Uses knowledge base for context-aware responses
- **Custom Prompts**: Set your own system prompt with `/prompt`
- **Context Management**: Add context with `/context`
- **Knowledge Base**: Add URLs (`/add`) or text (`/addtext`)
- **Web Tools**: Search (`/search`) and fetch (`/fetch`) web content

Commands:
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

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build

# Lint
npm run lint

# Type check
npm run typecheck
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE](LICENSE) for details.
