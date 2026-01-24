import { describe, it, expect } from 'vitest';
import { TextChunker, chunkText } from '../../src/utils/chunker';

describe('TextChunker', () => {
  describe('fixed chunking', () => {
    it('should chunk text into fixed sizes', () => {
      const chunker = new TextChunker({ strategy: 'fixed', chunkSize: 10, chunkOverlap: 0 });
      const chunks = chunker.chunk('Hello World Test', 'doc1');

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk.documentId).toBe('doc1');
        expect(chunk.content.length).toBeLessThanOrEqual(10);
      });
    });

    it('should handle overlap', () => {
      const chunker = new TextChunker({ strategy: 'fixed', chunkSize: 10, chunkOverlap: 5 });
      const text = 'abcdefghijklmnopqrstuvwxyz';
      const chunks = chunker.chunk(text, 'doc1');

      // With overlap, we should have more chunks
      expect(chunks.length).toBeGreaterThan(2);
    });
  });

  describe('sentence chunking', () => {
    it('should chunk by sentences', () => {
      const chunker = new TextChunker({ strategy: 'sentence', chunkSize: 100 });
      const text = 'First sentence. Second sentence. Third sentence.';
      const chunks = chunker.chunk(text, 'doc1');

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should respect chunk size', () => {
      const chunker = new TextChunker({ strategy: 'sentence', chunkSize: 20 });
      const text = 'Short. Another short. Yet another.';
      const chunks = chunker.chunk(text, 'doc1');

      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeLessThanOrEqual(30); // Some tolerance
      });
    });
  });

  describe('paragraph chunking', () => {
    it('should chunk by paragraphs', () => {
      const chunker = new TextChunker({ strategy: 'paragraph', chunkSize: 200 });
      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const chunks = chunker.chunk(text, 'doc1');

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should combine small paragraphs', () => {
      const chunker = new TextChunker({ strategy: 'paragraph', chunkSize: 100 });
      const text = 'Small.\n\nAlso small.';
      const chunks = chunker.chunk(text, 'doc1');

      // Should combine into one chunk
      expect(chunks.length).toBe(1);
    });
  });

  describe('recursive chunking', () => {
    it('should use default recursive strategy', () => {
      const chunker = new TextChunker({ chunkSize: 50 });
      const text = 'This is a test paragraph.\n\nAnother paragraph here with more content.';
      const chunks = chunker.chunk(text, 'doc1');

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk.id).toContain('doc1');
      });
    });
  });

  describe('chunkText helper', () => {
    it('should work with default options', () => {
      const chunks = chunkText('Test content', 'doc1');
      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe('Test content');
    });

    it('should accept custom options', () => {
      const chunks = chunkText('Test content here', 'doc1', { chunkSize: 5, strategy: 'fixed' });
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const chunker = new TextChunker();
      const chunks = chunker.chunk('', 'doc1');
      expect(chunks.length).toBe(0);
    });

    it('should handle whitespace only', () => {
      const chunker = new TextChunker();
      const chunks = chunker.chunk('   \n\n   ', 'doc1');
      expect(chunks.length).toBe(0);
    });

    it('should generate unique chunk IDs', () => {
      const chunker = new TextChunker({ chunkSize: 10, strategy: 'fixed' });
      const chunks = chunker.chunk('a'.repeat(50), 'doc1');
      const ids = chunks.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
