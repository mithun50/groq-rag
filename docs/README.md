# Documentation

Welcome to the groq-rag documentation.

## Quick Links

| Guide | Description |
|-------|-------------|
| [Getting Started](./getting-started.md) | Installation and first steps |
| [API Reference](./api-reference.md) | Complete API documentation |
| [Cookbook](./cookbook.md) | Real-world patterns and recipes |
| [Examples](./examples.md) | Code examples for common use cases |

## What is groq-rag?

**groq-rag** extends the Groq SDK with three powerful capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                        groq-rag                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│      RAG        │      Web        │        Agents           │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Add documents │ • Fetch URLs    │ • Autonomous reasoning  │
│ • Semantic      │ • Web search    │ • Tool use              │
│   search        │ • Parse HTML    │ • Multi-step tasks      │
│ • Context       │ • Markdown      │ • Streaming             │
│   retrieval     │   conversion    │ • Memory                │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Choose Your Path

### I want to...

**Build a chatbot with my own data** → [RAG Guide](./getting-started.md#adding-a-knowledge-base-rag)

**Search the web in real-time** → [Web Search Guide](./getting-started.md#adding-web-search)

**Create an AI that uses tools** → [Agent Guide](./getting-started.md#creating-an-autonomous-agent)

**Understand the full API** → [API Reference](./api-reference.md)

**See working code** → [Examples](./examples.md)

## Architecture Overview

```
User Request
     │
     ▼
┌─────────────┐
│  GroqRAG    │ ◄── Main client
│   Client    │
└─────┬───────┘
      │
      ├──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   Chat   │  │   RAG    │  │   Web    │  │  Agent   │
│  Module  │  │  Module  │  │  Module  │  │  System  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     │        ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
     │        ▼         ▼   ▼         ▼   ▼         │
     │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
     │   │Chunker │ │Vector  │ │Fetcher │ │ Tools  ││
     │   │        │ │Store   │ │        │ │        ││
     │   └────────┘ └────────┘ └────────┘ └────────┘│
     │        │         │          │          │     │
     └────────┴─────────┴──────────┴──────────┴─────┘
                              │
                              ▼
                        ┌──────────┐
                        │ Groq API │
                        └──────────┘
```

## Installation

```bash
npm install groq-rag
```

## Minimum Example

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

// Simple chat
const response = await client.complete({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
```

## Need Help?

- [GitHub Issues](https://github.com/mithun50/groq-rag/issues)
- [Examples Directory](../examples/)
