# groq-rag Demo Website

A comprehensive demo showcasing all features of the groq-rag library.

## Features Demonstrated

- **Basic Chat** - Simple chat completion with streaming support
- **Vision Support** - Image analysis with vision-capable models (Llama 3.3 70B, Llama 3.2 Vision, Llama 4 Scout)
- **RAG (Retrieval-Augmented Generation)**
  - Initialize with different chunking strategies
  - Add documents and URLs to knowledge base
  - Query and chat with context
- **Web Capabilities**
  - Fetch and parse URLs
  - Web search with DuckDuckGo
  - Chat with search results
  - Chat about URL content
- **MCP Integration**
  - Connect to MCP servers (stdio/http)
  - Discover and use external tools
  - Agent with MCP tools
- **AI Agents**
  - ReAct-style agent execution
  - Streaming agent output
  - Tool usage visualization
  - Support for MCP tools
- **Built-in Tools**
  - Calculator
  - Date/Time

## Using MCP Servers

MCP (Model Context Protocol) allows you to connect external tool servers to extend the agent's capabilities.

### Connecting via UI

1. Click the **🔌 MCP** button in the header
2. Enter a server name (e.g., "filesystem")
3. Choose transport type:
   - **Stdio**: For local command-line servers
   - **HTTP**: For remote HTTP servers
4. For Stdio, enter command and arguments:
   - Command: `npx`
   - Arguments: `-y, @modelcontextprotocol/server-filesystem, .`
5. Click "Connect Server"

### Example MCP Servers

```bash
# Filesystem access
npx -y @modelcontextprotocol/server-filesystem .

# Memory/notes
npx -y @modelcontextprotocol/server-memory

# GitHub integration (requires GITHUB_TOKEN)
GITHUB_TOKEN=xxx npx -y @modelcontextprotocol/server-github
```

### Using MCP Tools

Once connected, the agent automatically has access to MCP tools. Just ask questions that require those tools:
- "List the files in the current directory" (filesystem)
- "Read the contents of package.json" (filesystem)
- "Remember that the project uses TypeScript" (memory)

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
- `POST /api/agent/run-with-mcp` - Run agent with MCP tools

### MCP (Model Context Protocol)
- `GET /api/mcp/servers` - List connected MCP servers
- `POST /api/mcp/add` - Connect to MCP server
- `POST /api/mcp/remove` - Disconnect from server
- `GET /api/mcp/tools` - List all MCP tools
- `POST /api/mcp/disconnect-all` - Disconnect all servers

### Tools
- `POST /api/tools/calculator` - Calculate expression
- `POST /api/tools/datetime` - Get date/time

## Screenshots

The demo features a dark-themed UI with tabs for each feature category:

1. **Chat Tab** - Basic LLM chat with model selection and streaming
2. **RAG Tab** - Document management and semantic search
3. **Web Tab** - URL fetching and web search
4. **MCP Tab** - Connect to MCP servers and manage external tools
5. **Agent Tab** - AI agent with tool visualization (supports MCP tools)
6. **Tools Tab** - Direct tool testing

## Tech Stack

- **Backend**: Express.js
- **Frontend**: Vanilla HTML/CSS/JS
- **AI**: groq-rag library
