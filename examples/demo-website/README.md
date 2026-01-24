# groq-rag Demo Website

A comprehensive demo showcasing all features of the groq-rag library.

## Features Demonstrated

- **Basic Chat** - Simple chat completion with streaming support
- **RAG (Retrieval-Augmented Generation)**
  - Initialize with different chunking strategies
  - Add documents and URLs to knowledge base
  - Query and chat with context
- **Web Capabilities**
  - Fetch and parse URLs
  - Web search with DuckDuckGo
  - Chat with search results
  - Chat about URL content
- **AI Agents**
  - ReAct-style agent execution
  - Streaming agent output
  - Tool usage visualization
- **Built-in Tools**
  - Calculator
  - Date/Time

## Setup

1. Install dependencies:
```bash
cd examples/demo-website
npm install
```

2. Set your Groq API key:
```bash
export GROQ_API_KEY=your_api_key_here
```

3. Start the server:
```bash
npm start
```

4. Open http://localhost:3000 in your browser

## API Endpoints

### Chat
- `POST /api/chat` - Send a chat message
- `GET /api/chat/stream` - Stream chat responses

### RAG
- `POST /api/rag/init` - Initialize RAG
- `POST /api/rag/add` - Add document
- `POST /api/rag/add-url` - Add URL content
- `POST /api/rag/query` - Query knowledge base
- `POST /api/rag/chat` - Chat with RAG context
- `POST /api/rag/clear` - Clear knowledge base
- `GET /api/rag/count` - Get document count

### Web
- `POST /api/web/fetch` - Fetch URL
- `POST /api/web/search` - Search the web
- `POST /api/web/chat` - Chat with search results
- `POST /api/url/chat` - Chat about URL

### Agent
- `POST /api/agent/run` - Run agent task
- `GET /api/agent/stream` - Stream agent execution

### Tools
- `POST /api/tools/calculator` - Calculate expression
- `POST /api/tools/datetime` - Get date/time

## Screenshots

The demo features a dark-themed UI with tabs for each feature category:

1. **Chat Tab** - Basic LLM chat with model selection and streaming
2. **RAG Tab** - Document management and semantic search
3. **Web Tab** - URL fetching and web search
4. **Agent Tab** - AI agent with tool visualization
5. **Tools Tab** - Direct tool testing

## Tech Stack

- **Backend**: Express.js
- **Frontend**: Vanilla HTML/CSS/JS
- **AI**: groq-rag library
