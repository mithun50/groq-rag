# Getting Started

Get up and running with groq-rag in 5 minutes.

## Prerequisites

- Node.js 18+
- Groq API key ([Get one free](https://console.groq.com))

## Installation

```bash
npm install groq-rag
```

## Setup API Key

```bash
# Option 1: Environment variable
export GROQ_API_KEY=gsk_xxxxxxxxxxxx

# Option 2: .env file
echo "GROQ_API_KEY=gsk_xxxxxxxxxxxx" > .env
```

---

## Quick Start

### 1. Basic Chat

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

const response = await client.complete({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: 'Explain quantum computing in simple terms' }]
});

console.log(response.choices[0].message.content);
```

---

## Core Features

### RAG (Retrieval-Augmented Generation)

Answer questions using your own documents.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

// 1. Initialize RAG
await client.initRAG();

// 2. Add your documents
await client.rag.addDocument(`
  Acme Corp was founded in 2020.
  We build AI-powered healthcare solutions.
  Our flagship product is MedAssist.
`);

// 3. Ask questions about your documents
const response = await client.chat.withRAG({
  messages: [{ role: 'user', content: 'When was Acme Corp founded?' }]
});

console.log(response.content);
// → "Acme Corp was founded in 2020."
```

**Key methods:**
| Method | Description |
|--------|-------------|
| `client.rag.addDocument(text)` | Add text to knowledge base |
| `client.rag.addUrl(url)` | Add webpage content |
| `client.chat.withRAG({...})` | Chat using knowledge base |

---

### Web Search

Get real-time information from the internet.

```typescript
const response = await client.chat.withWebSearch({
  messages: [{ role: 'user', content: 'What happened in tech news today?' }],
  maxResults: 5
});

console.log(response.content);
console.log('Sources:', response.sources.map(s => s.url));
```

**Key methods:**
| Method | Description |
|--------|-------------|
| `client.web.search(query)` | Search the web |
| `client.web.fetch(url)` | Fetch and parse a URL |
| `client.chat.withWebSearch({...})` | Chat with web search |

---

### Agents

Create AI that reasons and uses tools autonomously.

```typescript
// Create agent with built-in tools
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  verbose: true  // See reasoning steps
});

// Agent automatically chooses which tools to use
const result = await agent.run(
  'Search for the latest SpaceX launch and summarize it'
);

console.log(result.output);
console.log('Tools used:', result.toolCalls.map(t => t.name));
```

**Built-in tools:**
| Tool | What it does |
|------|--------------|
| `web_search` | Search the internet |
| `fetch_url` | Read webpage content |
| `calculator` | Math operations |
| `get_datetime` | Current date/time |
| `rag_query` | Query knowledge base (added if RAG initialized) |

---

## Common Patterns

### Pattern 1: Document Q&A Bot

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();
await client.initRAG();

// Load your documents
await client.rag.addDocument(fs.readFileSync('docs/faq.txt', 'utf-8'));
await client.rag.addDocument(fs.readFileSync('docs/manual.txt', 'utf-8'));
await client.rag.addUrl('https://docs.example.com/guide');

// Answer questions
async function askQuestion(question: string) {
  const response = await client.chat.withRAG({
    messages: [{ role: 'user', content: question }],
    topK: 5,
    minScore: 0.5
  });
  return response.content;
}

console.log(await askQuestion('How do I reset my password?'));
```

### Pattern 2: Research Assistant

```typescript
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  systemPrompt: `You are a research assistant. When asked about a topic:
1. Search for current information
2. Fetch relevant articles
3. Synthesize findings into a clear summary
Always cite your sources.`
});

const result = await agent.run('Research the current state of fusion energy');
console.log(result.output);
```

### Pattern 3: Streaming Responses

```typescript
const agent = await client.createAgentWithBuiltins();

for await (const event of agent.runStream('Explain machine learning')) {
  switch (event.type) {
    case 'content':
      process.stdout.write(event.data as string);
      break;
    case 'tool_call':
      console.log('\n[Using tool...]');
      break;
    case 'done':
      console.log('\n[Complete]');
      break;
  }
}
```

---

## Configuration

### Models

groq-rag supports **all Groq models**. Here are recommended models by use case:

| Model | Speed | Best For |
|-------|-------|----------|
| `llama-3.3-70b-versatile` | 280 T/s | General purpose, highest quality |
| `llama-3.1-8b-instant` | 560 T/s | Fast responses, cost-effective |
| `openai/gpt-oss-120b` | 500 T/s | Complex reasoning with tools |
| `qwen/qwen3-32b` | — | Math & reasoning tasks |
| `deepseek-r1-distill-qwen-32b` | 140 T/s | Math (94% MATH-500), code |
| `meta-llama/llama-4-scout-17b-16e-instruct` | — | Vision + text tasks |
| `groq/compound` | 450 T/s | Built-in web search & code execution |

> 📚 See [Groq Models Documentation](https://console.groq.com/docs/models) for the complete list.

### RAG Settings

```typescript
await client.initRAG({
  // Embedding provider
  embedding: {
    provider: 'groq',  // 'groq' (free) or 'openai' (better quality)
  },

  // Vector store
  vectorStore: {
    provider: 'memory',  // 'memory' (dev) or 'chroma' (production)
  },

  // How to split documents
  chunking: {
    strategy: 'recursive',
    chunkSize: 1000,
    chunkOverlap: 200
  }
});
```

### Production Setup

```typescript
await client.initRAG({
  embedding: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small'
  },
  vectorStore: {
    provider: 'chroma',
    connectionString: 'http://localhost:8000',
    indexName: 'production-kb'
  }
});
```

---

## Troubleshooting

### "GROQ_API_KEY not found"

```bash
# Check if set
echo $GROQ_API_KEY

# Set it
export GROQ_API_KEY=gsk_xxxxxxxxxxxx
```

### "Rate limit exceeded"

Add delays between requests:
```typescript
import { sleep } from 'groq-rag';
await sleep(1000);  // Wait 1 second
```

### "Model not found"

Check [Groq's model list](https://console.groq.com/docs/models) for valid model names. You can also get the current list programmatically:

```bash
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

---

## Next Steps

- [Cookbook](./cookbook.md) - Real-world patterns
- [Examples](./examples.md) - More code examples
- [API Reference](./api-reference.md) - Complete API docs

## Groq Resources

- 📚 [Groq Models](https://console.groq.com/docs/models) - All available models
- 🧠 [Reasoning Models](https://console.groq.com/docs/reasoning) - Math & logic models
- 👁️ [Vision Models](https://console.groq.com/docs/vision) - Image input support
- 🛡️ [Content Moderation](https://console.groq.com/docs/content-moderation) - Safety models
- 📖 [API Reference](https://console.groq.com/docs/api-reference) - Groq API docs
