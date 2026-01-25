# Cookbook

Real-world patterns and recipes for groq-rag.

## Table of Contents

- [RAG Patterns](#rag-patterns)
- [Agent Patterns](#agent-patterns)
- [Web Patterns](#web-patterns)
- [Custom Tools](#custom-tools)
- [Performance Tips](#performance-tips)

---

## RAG Patterns

### Multi-Source Knowledge Base

Combine documents from multiple sources:

```typescript
import GroqRAG from 'groq-rag';
import fs from 'fs';
import path from 'path';

const client = new GroqRAG();
await client.initRAG();

// Load local files
const docsDir = './docs';
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.txt'));

for (const file of files) {
  const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
  await client.rag.addDocument(content, { source: file, type: 'local' });
}

// Load URLs
const urls = [
  'https://docs.example.com/guide',
  'https://blog.example.com/updates'
];

for (const url of urls) {
  await client.rag.addUrl(url);
}

console.log(`Loaded ${await client.rag.count()} chunks`);
```

---

### Conversational RAG with Memory

Maintain conversation context:

```typescript
const client = new GroqRAG();
await client.initRAG();

// Load documents
await client.rag.addDocument('...');

// Keep conversation history
const history: Array<{role: 'user' | 'assistant', content: string}> = [];

async function chat(userMessage: string) {
  history.push({ role: 'user', content: userMessage });

  const response = await client.chat.withRAG({
    messages: history,
    topK: 5,
    systemPrompt: 'You are a helpful assistant. Use context to answer questions.'
  });

  history.push({ role: 'assistant', content: response.content });
  return response;
}

// Multi-turn conversation
await chat('What is the product about?');
await chat('How much does it cost?');  // Remembers context
await chat('What features does it have?');
```

---

### Hybrid Search (RAG + Web)

Combine knowledge base with live web data:

```typescript
const client = new GroqRAG();
await client.initRAG();
await client.rag.addDocument('Internal product docs...');

async function hybridSearch(query: string) {
  // Get internal context
  const ragContext = await client.rag.getContext(query, { topK: 3 });

  // Get web results
  const webResults = await client.web.search(query, { maxResults: 3 });
  const webContext = webResults.map(r => `${r.title}: ${r.snippet}`).join('\n');

  // Combine and answer
  const response = await client.complete({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'system',
      content: `Use these sources to answer:

INTERNAL DOCS:
${ragContext}

WEB RESULTS:
${webContext}`
    }, {
      role: 'user',
      content: query
    }]
  });

  return response.choices[0].message.content;
}
```

---

### Chunking Strategy Selection

Choose the right chunking for your content:

```typescript
// For technical documentation - preserve code blocks
await client.initRAG({
  chunking: { strategy: 'paragraph', chunkSize: 1500, chunkOverlap: 300 }
});

// For conversational content - preserve sentences
await client.initRAG({
  chunking: { strategy: 'sentence', chunkSize: 800, chunkOverlap: 150 }
});

// For mixed content - balanced approach
await client.initRAG({
  chunking: { strategy: 'recursive', chunkSize: 1000, chunkOverlap: 200 }
});
```

---

## Agent Patterns

### Specialized Research Agent

```typescript
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  systemPrompt: `You are a research analyst. For every query:

1. SEARCH: Use web_search to find 3-5 relevant sources
2. READ: Use fetch_url on the most promising results
3. ANALYZE: Synthesize information across sources
4. CITE: Always include source URLs

Format your response as:
## Summary
[Key findings]

## Details
[In-depth analysis]

## Sources
[List of URLs used]`
});

const result = await agent.run('What are the latest breakthroughs in battery technology?');
```

---

### Multi-Step Task Agent

```typescript
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  maxIterations: 15,  // Allow more steps for complex tasks
  systemPrompt: `You are a thorough assistant that breaks down complex tasks.

For multi-step tasks:
1. Plan your approach
2. Execute each step using available tools
3. Verify results
4. Provide a complete answer`
});

const result = await agent.run(`
  1. Search for the top 3 AI companies by market cap
  2. Fetch their latest news
  3. Summarize key developments for each
`);
```

---

### Agent with Custom + Built-in Tools

```typescript
import { ToolDefinition, getBuiltinTools } from 'groq-rag';

// Custom tool
const sentimentTool: ToolDefinition = {
  name: 'analyze_sentiment',
  description: 'Analyze sentiment of text (positive/negative/neutral)',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to analyze' }
    },
    required: ['text']
  },
  execute: async ({ text }) => {
    // Your sentiment analysis logic
    const score = text.includes('great') ? 'positive' :
                  text.includes('bad') ? 'negative' : 'neutral';
    return { sentiment: score, text };
  }
};

// Combine with built-ins
const builtinTools = await getBuiltinTools(client);

const agent = client.createAgent({
  tools: [...builtinTools, sentimentTool]
});

const result = await agent.run('Search for reviews of iPhone 15 and analyze their sentiment');
```

---

### Error-Resilient Agent

```typescript
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  maxIterations: 10,
  systemPrompt: `You are a resilient assistant.

If a tool fails:
1. Try an alternative approach
2. Use different search terms
3. Acknowledge limitations if truly stuck

Never give up on the first failure.`
});

// The agent will retry with different approaches if initial tools fail
```

---

## Web Patterns

### Batch URL Processing

```typescript
const urls = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3',
];

// Fetch all in parallel
const results = await client.web.fetchMany(urls);

// Process results
for (const result of results) {
  if (result.markdown) {
    await client.rag.addDocument(result.markdown, {
      source: result.url,
      title: result.title
    });
  }
}
```

---

### Web Monitoring

```typescript
async function checkForUpdates(url: string, lastContent: string) {
  const result = await client.web.fetch(url);

  if (result.content !== lastContent) {
    const response = await client.complete({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Summarize what changed:\n\nOLD:\n${lastContent.slice(0, 500)}\n\nNEW:\n${result.content.slice(0, 500)}`
      }]
    });

    console.log('Changes detected:', response.choices[0].message.content);
  }

  return result.content;
}
```

---

### Search + Summarize Pattern

```typescript
async function researchTopic(topic: string) {
  // Search
  const searchResults = await client.web.search(topic, { maxResults: 5 });

  // Fetch top 3 results
  const urls = searchResults.slice(0, 3).map(r => r.url);
  const pages = await client.web.fetchMany(urls);

  // Combine content
  const content = pages
    .filter(p => p.markdown)
    .map(p => `## ${p.title}\n${p.markdown}`)
    .join('\n\n---\n\n');

  // Summarize
  const response = await client.complete({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'system',
      content: 'Summarize the following research findings into a concise report.'
    }, {
      role: 'user',
      content
    }]
  });

  return {
    summary: response.choices[0].message.content,
    sources: urls
  };
}
```

---

## Custom Tools

### Database Query Tool

```typescript
const dbTool: ToolDefinition = {
  name: 'query_database',
  description: 'Query the product database. Returns matching products.',
  parameters: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Product category' },
      maxPrice: { type: 'number', description: 'Maximum price' },
      inStock: { type: 'boolean', description: 'Only in-stock items' }
    },
    required: ['category']
  },
  execute: async (params) => {
    // Your database query logic
    const results = await db.products.find({
      category: params.category,
      price: { $lte: params.maxPrice || Infinity },
      stock: params.inStock ? { $gt: 0 } : undefined
    });
    return results;
  }
};
```

---

### API Integration Tool

```typescript
const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
      units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature units' }
    },
    required: ['city']
  },
  execute: async ({ city, units = 'celsius' }) => {
    const response = await fetch(
      `https://api.weather.com/v1/current?city=${city}&units=${units}`
    );
    return response.json();
  }
};
```

---

### File System Tool

```typescript
const fileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read contents of a local file',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' }
    },
    required: ['path']
  },
  execute: async ({ path }) => {
    const fs = await import('fs/promises');
    const content = await fs.readFile(path as string, 'utf-8');
    return { path, content: content.slice(0, 10000) };  // Limit size
  }
};
```

---

## Performance Tips

### Batch Document Ingestion

```typescript
import { batch } from 'groq-rag';

const documents = [...]; // Large array of documents

// Split into batches of 10
const batches = batch(documents, 10);

// Process each batch
for (const docBatch of batches) {
  await client.rag.addDocuments(
    docBatch.map(doc => ({ content: doc.text, metadata: doc.meta }))
  );
}
```

---

### Caching Expensive Operations

```typescript
const cache = new Map<string, any>();

async function cachedSearch(query: string) {
  const cacheKey = `search:${query}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const results = await client.web.search(query);
  cache.set(cacheKey, results);

  // Clear cache after 5 minutes
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

  return results;
}
```

---

### Parallel Operations

```typescript
// Bad: Sequential (slow)
for (const url of urls) {
  await client.rag.addUrl(url);
}

// Good: Parallel (fast)
await Promise.all(urls.map(url => client.rag.addUrl(url)));

// Better: Controlled parallelism
import { batch } from 'groq-rag';
const batches = batch(urls, 5);
for (const urlBatch of batches) {
  await Promise.all(urlBatch.map(url => client.rag.addUrl(url)));
}
```

---

### Token Estimation

```typescript
import { estimateTokens, truncateToTokens } from 'groq-rag';

// Check if context fits
const context = await client.rag.getContext(query);
const tokens = estimateTokens(context);

if (tokens > 4000) {
  // Truncate to fit context window
  const truncated = truncateToTokens(context, 4000);
}
```
