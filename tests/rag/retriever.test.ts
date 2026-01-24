import { describe, it, expect, beforeEach } from 'vitest';
import { Retriever } from '../../src/rag/retriever';
import { MemoryVectorStore } from '../../src/rag/vectorStore';
import { EmbeddingProvider, EmbeddingResult } from '../../src/types';

// Mock embedding provider
class MockEmbeddings implements EmbeddingProvider {
  dimensions = 3;
  private counter = 0;

  async embed(text: string): Promise<EmbeddingResult> {
    // Generate deterministic embedding based on text length
    const hash = text.length % 3;
    const embedding = [0, 0, 0];
    embedding[hash] = 1;
    return { embedding, tokenCount: text.length };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map(t => this.embed(t)));
  }
}

describe('Retriever', () => {
  let retriever: Retriever;
  let vectorStore: MemoryVectorStore;
  let embeddings: MockEmbeddings;

  beforeEach(() => {
    vectorStore = new MemoryVectorStore();
    embeddings = new MockEmbeddings();
    retriever = new Retriever(vectorStore, embeddings, { chunkSize: 100 });
  });

  describe('addDocument', () => {
    it('should add a document and return ID', async () => {
      const id = await retriever.addDocument('Test content');
      expect(id).toBeTruthy();
      expect(await retriever.count()).toBeGreaterThan(0);
    });

    it('should chunk large documents', async () => {
      const longContent = 'word '.repeat(100);
      await retriever.addDocument(longContent);

      // Should have multiple chunks
      expect(await retriever.count()).toBeGreaterThan(1);
    });

    it('should include metadata in chunks', async () => {
      await retriever.addDocument('Test', { source: 'test.txt' });
      const chunks = vectorStore.getAll();

      expect(chunks[0].metadata?.source).toBe('test.txt');
    });
  });

  describe('addDocuments', () => {
    it('should add multiple documents', async () => {
      const ids = await retriever.addDocuments([
        { content: 'First document' },
        { content: 'Second document' },
      ]);

      expect(ids.length).toBe(2);
      expect(await retriever.count()).toBeGreaterThanOrEqual(2);
    });
  });

  describe('addChunk', () => {
    it('should add raw chunk without chunking', async () => {
      const id = await retriever.addChunk('Raw content');
      expect(id).toBeTruthy();
      expect(await retriever.count()).toBe(1);
    });
  });

  describe('retrieve', () => {
    beforeEach(async () => {
      await retriever.addChunk('Short text'); // length 10 -> embedding[1]
      await retriever.addChunk('Medium length text here'); // length 23 -> embedding[2]
      await retriever.addChunk('A'); // length 1 -> embedding[1]
    });

    it('should retrieve relevant documents', async () => {
      const results = await retriever.retrieve('test query', { topK: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by minimum score', async () => {
      const results = await retriever.retrieve('query', { minScore: 0.9 });
      results.forEach(r => {
        expect(r.score).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should respect topK', async () => {
      const results = await retriever.retrieve('query', { topK: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getContext', () => {
    beforeEach(async () => {
      await retriever.addChunk('First relevant content');
      await retriever.addChunk('Second relevant content');
    });

    it('should return formatted context', async () => {
      const context = await retriever.getContext('query');
      expect(context).toContain('[Source');
    });

    it('should include metadata when requested', async () => {
      await retriever.clear();
      await retriever.addChunk('Content', { author: 'Test' });

      const context = await retriever.getContext('query', { includeMetadata: true });
      expect(context).toContain('author');
    });
  });

  describe('deleteDocuments', () => {
    it('should delete documents by ID', async () => {
      const id = await retriever.addChunk('Test');
      expect(await retriever.count()).toBe(1);

      await retriever.deleteDocuments([id]);
      expect(await retriever.count()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all documents', async () => {
      await retriever.addDocument('Test 1');
      await retriever.addDocument('Test 2');

      await retriever.clear();
      expect(await retriever.count()).toBe(0);
    });
  });

  describe('count', () => {
    it('should return document count', async () => {
      expect(await retriever.count()).toBe(0);

      await retriever.addChunk('Test');
      expect(await retriever.count()).toBe(1);
    });
  });
});
