import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryVectorStore } from '../../src/rag/vectorStore';
import { DocumentChunk } from '../../src/types';

describe('MemoryVectorStore', () => {
  let store: MemoryVectorStore;

  beforeEach(() => {
    store = new MemoryVectorStore();
  });

  const createChunk = (id: string, embedding: number[]): DocumentChunk => ({
    id,
    documentId: `doc-${id}`,
    content: `Content for ${id}`,
    embedding,
    metadata: { source: 'test' },
  });

  describe('add', () => {
    it('should add documents to the store', async () => {
      const chunks = [
        createChunk('1', [1, 0, 0]),
        createChunk('2', [0, 1, 0]),
      ];

      await store.add(chunks);
      expect(await store.count()).toBe(2);
    });

    it('should overwrite documents with same ID', async () => {
      const chunk1 = createChunk('1', [1, 0, 0]);
      const chunk2 = { ...createChunk('1', [0, 1, 0]), content: 'Updated' };

      await store.add([chunk1]);
      await store.add([chunk2]);

      expect(await store.count()).toBe(1);
      const all = store.getAll();
      expect(all[0].content).toBe('Updated');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await store.add([
        createChunk('1', [1, 0, 0]),
        createChunk('2', [0.9, 0.1, 0]),
        createChunk('3', [0, 1, 0]),
        createChunk('4', [0, 0, 1]),
      ]);
    });

    it('should find similar documents', async () => {
      const results = await store.search([1, 0, 0], { topK: 2 });

      expect(results.length).toBe(2);
      expect(results[0].document.id).toBe('1'); // Exact match
      expect(results[0].score).toBeCloseTo(1);
    });

    it('should respect topK parameter', async () => {
      const results = await store.search([1, 0, 0], { topK: 1 });
      expect(results.length).toBe(1);
    });

    it('should return results sorted by score', async () => {
      const results = await store.search([1, 0, 0], { topK: 4 });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should assign relevance levels', async () => {
      const results = await store.search([1, 0, 0], { topK: 4 });

      expect(results[0].relevance).toBe('high'); // score > 0.8
      expect(results.some(r => r.relevance === 'low')).toBe(true); // score < 0.5
    });

    it('should filter by metadata', async () => {
      await store.clear();
      await store.add([
        { ...createChunk('1', [1, 0, 0]), metadata: { type: 'a' } },
        { ...createChunk('2', [0.9, 0.1, 0]), metadata: { type: 'b' } },
      ]);

      const results = await store.search([1, 0, 0], { topK: 10, filter: { type: 'a' } });
      expect(results.length).toBe(1);
      expect(results[0].document.metadata?.type).toBe('a');
    });

    it('should skip documents without embeddings', async () => {
      await store.add([{ id: 'no-embed', documentId: 'doc', content: 'test' }]);
      const results = await store.search([1, 0, 0], { topK: 10 });

      expect(results.find(r => r.document.id === 'no-embed')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete specified documents', async () => {
      await store.add([
        createChunk('1', [1, 0, 0]),
        createChunk('2', [0, 1, 0]),
      ]);

      await store.delete(['1']);
      expect(await store.count()).toBe(1);

      const results = await store.search([1, 0, 0], { topK: 10 });
      expect(results.find(r => r.document.id === '1')).toBeUndefined();
    });

    it('should handle deleting non-existent IDs', async () => {
      await store.add([createChunk('1', [1, 0, 0])]);
      await store.delete(['non-existent']);
      expect(await store.count()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all documents', async () => {
      await store.add([
        createChunk('1', [1, 0, 0]),
        createChunk('2', [0, 1, 0]),
      ]);

      await store.clear();
      expect(await store.count()).toBe(0);
    });
  });

  describe('count', () => {
    it('should return correct count', async () => {
      expect(await store.count()).toBe(0);

      await store.add([createChunk('1', [1, 0, 0])]);
      expect(await store.count()).toBe(1);

      await store.add([createChunk('2', [0, 1, 0])]);
      expect(await store.count()).toBe(2);
    });
  });

  describe('getAll', () => {
    it('should return all documents', async () => {
      await store.add([
        createChunk('1', [1, 0, 0]),
        createChunk('2', [0, 1, 0]),
      ]);

      const all = store.getAll();
      expect(all.length).toBe(2);
    });
  });
});
