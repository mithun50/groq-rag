# Examples

Quick reference to all groq-rag examples.

## Running Examples

```bash
# Set your API key
export GROQ_API_KEY=gsk_xxxxxxxxxxxx

# Run any example
npx tsx examples/basic-chat.ts
```

---

## Example Files

### basic-chat.ts

Simple chat completion.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

const response = await client.complete({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
```

**Run:** `npx tsx examples/basic-chat.ts`

---

### rag-chat.ts

RAG-augmented conversation.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();
await client.initRAG();

// Add documents
await client.rag.addDocument('Your company info here...');

// Chat with context
const response = await client.chat.withRAG({
  messages: [{ role: 'user', content: 'Tell me about the company' }]
});

console.log(response.content);
console.log('Sources:', response.sources);
```

**Run:** `npx tsx examples/rag-chat.ts`

---

### web-search.ts

Web search integration.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

const response = await client.chat.withWebSearch({
  messages: [{ role: 'user', content: 'Latest AI news' }],
  maxResults: 5
});

console.log(response.content);
```

**Run:** `npx tsx examples/web-search.ts`

---

### url-fetch.ts

URL fetching and summarization.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

// Fetch and parse URL
const page = await client.web.fetch('https://example.com');
console.log('Title:', page.title);
console.log('Content:', page.markdown);

// Chat about URL content
const response = await client.chat.withUrl({
  messages: [{ role: 'user', content: 'Summarize this page' }],
  url: 'https://example.com/article'
});

console.log(response.content);
```

**Run:** `npx tsx examples/url-fetch.ts`

---

### agent.ts

Agent with tools.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  verbose: true
});

const result = await agent.run('Search for AI news and summarize');

console.log('Output:', result.output);
console.log('Tools used:', result.toolCalls.map(t => t.name));
```

**Run:** `npx tsx examples/agent.ts`

---

### streaming-agent.ts

Streaming agent execution.

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();
const agent = await client.createAgentWithBuiltins();

for await (const event of agent.runStream('Explain quantum computing')) {
  switch (event.type) {
    case 'content':
      process.stdout.write(event.data as string);
      break;
    case 'tool_call':
      console.log('\n[Tool call]');
      break;
    case 'tool_result':
      console.log('[Tool done]');
      break;
    case 'done':
      console.log('\n[Complete]');
      break;
  }
}
```

**Run:** `npx tsx examples/streaming-agent.ts`

---

### full-chatbot.ts

Full-featured interactive CLI chatbot with all capabilities.

**Features:**
- Agent mode with automatic tool use
- RAG mode with knowledge base
- Custom system prompts
- Web search and URL fetching
- Knowledge base management

**Run:** `npx tsx examples/full-chatbot.ts`

**Commands:**
```
/help        - Show all commands
/add <url>   - Add URL to knowledge base
/addtext     - Add custom text
/search <q>  - Web search
/fetch <url> - Fetch and summarize URL
/prompt      - Set custom system prompt
/context     - Set additional context
/mode        - Toggle agent/RAG mode
/clear       - Clear chat history
/quit        - Exit
```

---

## Quick Snippets

### Initialize with All Features

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

// Initialize RAG
await client.initRAG({
  embedding: { provider: 'groq' },
  vectorStore: { provider: 'memory' }
});

// Create agent
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile'
});

// Now you can use:
// - client.complete()      Basic chat
// - client.chat.withRAG()  RAG chat
// - client.chat.withWebSearch()  Web search chat
// - client.web.fetch()     URL fetching
// - client.rag.addDocument()  Add documents
// - agent.run()            Autonomous agent
```

---

### Custom Tool Example

```typescript
import GroqRAG, { ToolDefinition } from 'groq-rag';

const myTool: ToolDefinition = {
  name: 'my_custom_tool',
  description: 'Does something useful',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input value' }
    },
    required: ['input']
  },
  execute: async ({ input }) => {
    return { result: `Processed: ${input}` };
  }
};

const client = new GroqRAG();
const agent = client.createAgent({
  tools: [myTool]
});

const result = await agent.run('Use my custom tool with input "hello"');
```

---

### Streaming Chat

```typescript
const stream = await client.stream({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: 'Tell me a story' }]
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

---

### Error Handling

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();

try {
  const response = await client.complete({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Hello' }]
  });
  console.log(response.choices[0].message.content);
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limited. Wait and retry.');
  } else if (error.status === 401) {
    console.error('Invalid API key.');
  } else {
    console.error('Error:', error.message);
  }
}
```

---

## Project Templates

### Simple Q&A Bot

```typescript
import GroqRAG from 'groq-rag';
import * as readline from 'readline';

const client = new GroqRAG();
await client.initRAG();

// Load your documents
await client.rag.addDocument('...');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask() {
  rl.question('You: ', async (question) => {
    if (question === 'quit') {
      rl.close();
      return;
    }

    const response = await client.chat.withRAG({
      messages: [{ role: 'user', content: question }]
    });

    console.log('Bot:', response.content);
    ask();
  });
}

ask();
```

---

### Research Agent Script

```typescript
import GroqRAG from 'groq-rag';

const client = new GroqRAG();
const agent = await client.createAgentWithBuiltins({
  model: 'llama-3.3-70b-versatile',
  systemPrompt: 'You are a research assistant. Search, analyze, and summarize.'
});

const topic = process.argv[2] || 'artificial intelligence trends';

console.log(`Researching: ${topic}\n`);

const result = await agent.run(`Research and summarize: ${topic}`);

console.log(result.output);
console.log('\nTools used:', result.toolCalls.map(t => t.name).join(', '));
```

**Run:** `npx tsx research.ts "quantum computing"`
