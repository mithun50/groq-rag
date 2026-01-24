import { describe, it, expect, beforeEach } from 'vitest';
import { GroqRAG } from '../src/client';

describe('GroqRAG Client', () => {
  let client: GroqRAG;

  beforeEach(() => {
    // Create client without actual API key for unit tests
    client = new GroqRAG({ apiKey: 'test-key' });
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      // Without GROQ_API_KEY env var, Groq SDK throws
      if (!process.env.GROQ_API_KEY) {
        expect(() => new GroqRAG()).toThrow();
      } else {
        const c = new GroqRAG();
        expect(c).toBeDefined();
        expect(c.client).toBeDefined();
      }
    });

    it('should create client with custom config', () => {
      const c = new GroqRAG({
        apiKey: 'custom-key',
        timeout: 5000,
        maxRetries: 5,
      });
      expect(c).toBeDefined();
    });
  });

  describe('modules', () => {
    it('should have chat module', () => {
      expect(client.chat).toBeDefined();
    });

    it('should have web module', () => {
      expect(client.web).toBeDefined();
    });

    it('should have rag module', () => {
      expect(client.rag).toBeDefined();
    });
  });

  describe('initRAG', () => {
    it('should initialize RAG with default options', async () => {
      const retriever = await client.initRAG();
      expect(retriever).toBeDefined();
    });

    it('should initialize RAG with custom embedding config', async () => {
      const retriever = await client.initRAG({
        embedding: { provider: 'groq' },
      });
      expect(retriever).toBeDefined();
    });

    it('should initialize RAG with custom vector store', async () => {
      const retriever = await client.initRAG({
        vectorStore: { provider: 'memory' },
      });
      expect(retriever).toBeDefined();
    });
  });

  describe('getRetriever', () => {
    it('should auto-initialize retriever if not initialized', async () => {
      const retriever = await client.getRetriever();
      expect(retriever).toBeDefined();
    });

    it('should return same retriever on multiple calls', async () => {
      const r1 = await client.getRetriever();
      const r2 = await client.getRetriever();
      expect(r1).toBe(r2);
    });
  });

  describe('getFetcher', () => {
    it('should return web fetcher', () => {
      const fetcher = client.getFetcher();
      expect(fetcher).toBeDefined();
      expect(typeof fetcher.fetch).toBe('function');
    });
  });

  describe('getSearchProvider', () => {
    it('should return search provider', () => {
      const provider = client.getSearchProvider();
      expect(provider).toBeDefined();
      expect(typeof provider.search).toBe('function');
    });
  });

  describe('createAgent', () => {
    it('should create agent with default config', () => {
      const agent = client.createAgent();
      expect(agent).toBeDefined();
    });

    it('should create agent with custom config', () => {
      const agent = client.createAgent({
        name: 'Test Agent',
        model: 'llama-3.3-70b-versatile',
        maxIterations: 5,
      });
      expect(agent).toBeDefined();
    });
  });

  describe('createAgentWithBuiltins', () => {
    it('should create agent with builtin tools', async () => {
      const agent = await client.createAgentWithBuiltins();
      expect(agent).toBeDefined();
    });
  });

  describe('RAG module', () => {
    beforeEach(async () => {
      await client.initRAG();
    });

    it('should add document', async () => {
      const id = await client.rag.addDocument('Test content');
      expect(id).toBeTruthy();
    });

    it('should add document with metadata', async () => {
      const id = await client.rag.addDocument('Test', { source: 'test' });
      expect(id).toBeTruthy();
    });

    it('should add multiple documents', async () => {
      const ids = await client.rag.addDocuments([
        { content: 'Doc 1' },
        { content: 'Doc 2', metadata: { type: 'test' } },
      ]);
      expect(ids.length).toBe(2);
    });

    it('should query documents', async () => {
      await client.rag.addDocument('Test document about AI');
      const results = await client.rag.query('AI');
      expect(results).toBeDefined();
    });

    it('should get context', async () => {
      await client.rag.addDocument('Information about topic');
      const context = await client.rag.getContext('topic');
      expect(typeof context).toBe('string');
    });

    it('should clear documents', async () => {
      await client.rag.addDocument('Test');
      await client.rag.clear();
      expect(await client.rag.count()).toBe(0);
    });

    it('should count documents', async () => {
      expect(await client.rag.count()).toBe(0);
      await client.rag.addDocument('Test');
      expect(await client.rag.count()).toBeGreaterThan(0);
    });
  });
});
