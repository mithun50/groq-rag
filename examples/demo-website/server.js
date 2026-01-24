import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import GroqRAG from 'groq-rag';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize GroqRAG client
const client = new GroqRAG({
  apiKey: process.env.GROQ_API_KEY,
});

// Store for SSE connections
const sseClients = new Map();

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'llama-3.3-70b-versatile' } = req.body;

    const response = await client.complete({
      model,
      messages: [{ role: 'user', content: message }],
    });

    res.json({
      success: true,
      content: response.choices[0].message.content,
      model: response.model,
      usage: response.usage,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Streaming Chat
app.get('/api/chat/stream', async (req, res) => {
  const { message, model = 'llama-3.3-70b-versatile' } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await client.stream({
      model,
      messages: [{ role: 'user', content: message }],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// RAG - Initialize
app.post('/api/rag/init', async (req, res) => {
  try {
    await client.initRAG({
      embedding: { provider: 'groq' },
      vectorStore: { provider: 'memory' },
      chunking: {
        strategy: req.body.strategy || 'recursive',
        chunkSize: req.body.chunkSize || 500,
        chunkOverlap: req.body.chunkOverlap || 100,
      },
    });
    res.json({ success: true, message: 'RAG initialized' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RAG - Add Document
app.post('/api/rag/add', async (req, res) => {
  try {
    const { content, metadata } = req.body;
    const id = await client.rag.addDocument(content, metadata);
    const count = await client.rag.count();
    res.json({ success: true, id, totalChunks: count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RAG - Add URL
app.post('/api/rag/add-url', async (req, res) => {
  try {
    const { url } = req.body;
    const id = await client.rag.addUrl(url);
    const count = await client.rag.count();
    res.json({ success: true, id, totalChunks: count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RAG - Query
app.post('/api/rag/query', async (req, res) => {
  try {
    const { query, topK = 5, minScore = 0.3 } = req.body;
    const results = await client.rag.query(query, { topK, minScore });
    res.json({
      success: true,
      results: results.map(r => ({
        content: r.document.content,
        score: r.score,
        relevance: r.relevance,
        metadata: r.document.metadata,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RAG - Chat with Context
app.post('/api/rag/chat', async (req, res) => {
  try {
    const { message, topK = 5, model = 'llama-3.3-70b-versatile' } = req.body;
    const response = await client.chat.withRAG({
      model,
      messages: [{ role: 'user', content: message }],
      topK,
    });
    res.json({
      success: true,
      content: response.content,
      sources: response.sources,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RAG - Clear
app.post('/api/rag/clear', async (req, res) => {
  try {
    await client.rag.clear();
    res.json({ success: true, message: 'Knowledge base cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RAG - Count
app.get('/api/rag/count', async (req, res) => {
  try {
    const count = await client.rag.count();
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Web - Fetch URL
app.post('/api/web/fetch', async (req, res) => {
  try {
    const { url, includeLinks = false, includeImages = false } = req.body;
    const result = await client.web.fetch(url, { includeLinks, includeImages });
    res.json({
      success: true,
      title: result.title,
      content: result.content?.slice(0, 2000),
      markdown: result.markdown?.slice(0, 2000),
      links: result.links?.slice(0, 20),
      images: result.images?.slice(0, 10),
      metadata: result.metadata,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Web - Search
app.post('/api/web/search', async (req, res) => {
  try {
    const { query, maxResults = 5 } = req.body;
    const results = await client.web.search(query, { maxResults });
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Web Search Chat
app.post('/api/web/chat', async (req, res) => {
  try {
    const { message, maxResults = 5, model = 'llama-3.3-70b-versatile' } = req.body;
    const response = await client.chat.withWebSearch({
      model,
      messages: [{ role: 'user', content: message }],
      maxResults,
    });
    res.json({
      success: true,
      content: response.content,
      sources: response.sources,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// URL Chat
app.post('/api/url/chat', async (req, res) => {
  try {
    const { url, message, model = 'llama-3.3-70b-versatile' } = req.body;
    const response = await client.chat.withUrl({
      model,
      messages: [{ role: 'user', content: message }],
      url,
    });
    res.json({
      success: true,
      content: response.content,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent - Run
app.post('/api/agent/run', async (req, res) => {
  try {
    const { task, model = 'llama-3.3-70b-versatile' } = req.body;

    const agent = await client.createAgentWithBuiltins({
      model,
      maxIterations: 5,
    });

    const result = await agent.run(task);
    res.json({
      success: true,
      output: result.output,
      iterations: result.iterations,
      toolCalls: result.toolCalls.map(t => ({
        name: t.name,
        args: t.args,
        result: typeof t.result === 'string' ? t.result.slice(0, 500) : t.result,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent - Stream
app.get('/api/agent/stream', async (req, res) => {
  const { task, model = 'llama-3.3-70b-versatile' } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const agent = await client.createAgentWithBuiltins({
      model,
      maxIterations: 5,
    });

    for await (const event of agent.runStream(task)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
    res.end();
  }
});

// Tools - Calculator
app.post('/api/tools/calculator', async (req, res) => {
  try {
    const { expression } = req.body;
    const { createCalculatorTool } = await import('groq-rag');
    const calc = createCalculatorTool();
    const result = await calc.execute({ expression });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tools - DateTime
app.post('/api/tools/datetime', async (req, res) => {
  try {
    const { timezone = 'UTC' } = req.body;
    const { createDateTimeTool } = await import('groq-rag');
    const dt = createDateTimeTool();
    const result = await dt.execute({ timezone });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
===============================================
  groq-rag Demo Server
===============================================
  Server running at: http://localhost:${PORT}
  API Documentation: http://localhost:${PORT}/api

  Make sure GROQ_API_KEY is set in your environment
===============================================
  `);
});
