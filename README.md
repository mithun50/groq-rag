# groq-rag

Extended Groq SDK with RAG (Retrieval-Augmented Generation), web browsing, and agent capabilities.

## Features

- **RAG Support**: Built-in vector store and document retrieval
- **Web Fetching**: Fetch and parse web pages to markdown
- **Web Search**: DuckDuckGo, Brave, and Serper search integration
- **Tool System**: Extensible tool framework with built-in tools
- **Agents**: ReAct-style agents with tool use and streaming
- **TypeScript**: Full type safety and IntelliSense support

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

// Initialize RAG
await client.initRAG();

// Add documents
await client.rag.addDocument('Your document content here...');

// Chat with context
const response = await client.chat.withRAG({
  messages: [{ role: 'user', content: 'What does the document say?' }],
  topK: 5,
});

console.log(response.content);
console.log('Sources:', response.sources);
```

### Web Search Chat

```typescript
const response = await client.chat.withWebSearch({
  messages: [{ role: 'user', content: 'Latest AI news?' }],
});

console.log(response.content);
console.log('Sources:', response.sources);
```

### URL Fetching

```typescript
// Fetch and parse a URL
const result = await client.web.fetch('https://example.com');
console.log(result.markdown);

// Chat about a URL
const response = await client.chat.withUrl({
  messages: [{ role: 'user', content: 'Summarize this page' }],
  url: 'https://example.com',
});
```

### Agents with Tools

```typescript
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  verbose: true,
});

const result = await agent.run('Search for recent AI developments and summarize');
console.log(result.output);
```

### Streaming Agent

```typescript
for await (const event of agent.runStream('Research topic X')) {
  if (event.type === 'content') {
    process.stdout.write(event.data);
  }
}
```

## API Reference

### GroqRAG Client

```typescript
const client = new GroqRAG({
  apiKey?: string,      // Groq API key (or use GROQ_API_KEY env)
  baseURL?: string,     // Custom API base URL
  timeout?: number,     // Request timeout in ms
  maxRetries?: number,  // Max retry attempts
});
```

### RAG Module

```typescript
// Initialize with options
await client.initRAG({
  embedding: { provider: 'groq' | 'openai' },
  vectorStore: { provider: 'memory' | 'chroma' },
  chunking: { strategy: 'recursive', chunkSize: 1000 },
});

// Add documents
await client.rag.addDocument(content, metadata?);
await client.rag.addDocuments([{ content, metadata }]);
await client.rag.addUrl('https://example.com');

// Query
const results = await client.rag.query('search query', { topK: 5 });
const context = await client.rag.getContext('query');

// Manage
await client.rag.clear();
const count = await client.rag.count();
```

### Web Module

```typescript
// Fetch URLs
const result = await client.web.fetch(url, options?);
const results = await client.web.fetchMany(urls);
const markdown = await client.web.fetchMarkdown(url);

// Search
const results = await client.web.search('query', { maxResults: 10 });
```

### Chat Module

```typescript
// With RAG
await client.chat.withRAG({ messages, topK?, minScore? });

// With web search
await client.chat.withWebSearch({ messages, searchQuery?, maxResults? });

// With URL content
await client.chat.withUrl({ messages, url });
```

### Agents

```typescript
// Create agent
const agent = client.createAgent({
  model?: string,
  systemPrompt?: string,
  tools?: ToolDefinition[],
  maxIterations?: number,
  verbose?: boolean,
});

// Create with built-in tools
const agent = await client.createAgentWithBuiltins(config);

// Run
const result = await agent.run('task');

// Stream
for await (const event of agent.runStream('task')) { }
```

### Built-in Tools

- `web_search` - Search the web using DuckDuckGo
- `fetch_url` - Fetch and parse web pages
- `rag_query` - Query the knowledge base
- `calculator` - Mathematical calculations
- `get_datetime` - Get current date/time

### Custom Tools

```typescript
const myTool: ToolDefinition = {
  name: 'my_tool',
  description: 'Does something useful',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'The input' },
    },
    required: ['input'],
  },
  execute: async (params) => {
    return { result: 'done' };
  },
};

agent.addTool(myTool);
```

## Vector Store Providers

### In-Memory (Default)

```typescript
await client.initRAG({
  vectorStore: { provider: 'memory' },
});
```

### ChromaDB

```typescript
await client.initRAG({
  vectorStore: {
    provider: 'chroma',
    connectionString: 'http://localhost:8000',
    indexName: 'my-collection',
  },
});
```

## Embedding Providers

### Groq (Default)

Uses a pseudo-embedding for demos. For production, use OpenAI:

```typescript
await client.initRAG({
  embedding: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
  },
});
```

## Search Providers

### DuckDuckGo (Default, No API Key)

```typescript
import { createSearchProvider } from 'groq-rag';
const search = createSearchProvider({ provider: 'duckduckgo' });
```

### Brave Search

```typescript
const search = createSearchProvider({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY,
});
```

### Serper (Google)

```typescript
const search = createSearchProvider({
  provider: 'serper',
  apiKey: process.env.SERPER_API_KEY,
});
```

## License

MIT
