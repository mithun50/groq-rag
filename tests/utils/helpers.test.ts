import { describe, it, expect } from 'vitest';
import {
  generateId,
  cosineSimilarity,
  estimateTokens,
  truncateToTokens,
  cleanText,
  extractUrls,
  formatContext,
  safeJsonParse,
  batch,
} from '../../src/utils/helpers';

describe('helpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with expected format', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 2, 3];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0];
      const vec2 = [0, 1];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0);
    });

    it('should return -1 for opposite vectors', () => {
      const vec1 = [1, 0];
      const vec2 = [-1, 0];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-1);
    });

    it('should throw for vectors of different lengths', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });

    it('should return 0 for zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 2, 3];
      expect(cosineSimilarity(vec1, vec2)).toBe(0);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens based on character count', () => {
      const text = 'Hello world'; // 11 chars -> ~3 tokens
      const tokens = estimateTokens(text);
      expect(tokens).toBe(3);
    });

    it('should handle empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });
  });

  describe('truncateToTokens', () => {
    it('should not truncate short text', () => {
      const text = 'Hello';
      expect(truncateToTokens(text, 100)).toBe(text);
    });

    it('should truncate long text', () => {
      const text = 'a'.repeat(1000);
      const result = truncateToTokens(text, 10);
      expect(result.length).toBeLessThan(text.length);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('cleanText', () => {
    it('should normalize whitespace', () => {
      expect(cleanText('  hello   world  ')).toBe('hello world');
    });

    it('should reduce multiple newlines', () => {
      expect(cleanText('hello\n\n\n\nworld')).toBe('hello\n\nworld');
    });
  });

  describe('extractUrls', () => {
    it('should extract http URLs', () => {
      const text = 'Visit http://example.com for more info';
      expect(extractUrls(text)).toEqual(['http://example.com']);
    });

    it('should extract https URLs', () => {
      const text = 'Check https://example.com/path?query=1';
      expect(extractUrls(text)).toEqual(['https://example.com/path?query=1']);
    });

    it('should extract multiple URLs', () => {
      const text = 'Links: https://a.com and https://b.com';
      expect(extractUrls(text)).toHaveLength(2);
    });

    it('should return empty array for no URLs', () => {
      expect(extractUrls('No URLs here')).toEqual([]);
    });
  });

  describe('formatContext', () => {
    it('should format single result', () => {
      const results = [{ content: 'Test content' }];
      const formatted = formatContext(results);
      expect(formatted).toContain('[Source 1]');
      expect(formatted).toContain('Test content');
    });

    it('should format multiple results with separator', () => {
      const results = [
        { content: 'First' },
        { content: 'Second' },
      ];
      const formatted = formatContext(results);
      expect(formatted).toContain('[Source 1]');
      expect(formatted).toContain('[Source 2]');
      expect(formatted).toContain('---');
    });

    it('should include metadata when requested', () => {
      const results = [
        { content: 'Content', metadata: { source: 'test.txt' } },
      ];
      const formatted = formatContext(results, { includeMetadata: true });
      expect(formatted).toContain('source: test.txt');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a": 1}', {})).toEqual({ a: 1 });
    });

    it('should return default for invalid JSON', () => {
      expect(safeJsonParse('invalid', { fallback: true })).toEqual({ fallback: true });
    });
  });

  describe('batch', () => {
    it('should split array into batches', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(batch(arr, 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle empty array', () => {
      expect(batch([], 2)).toEqual([]);
    });

    it('should handle batch size larger than array', () => {
      expect(batch([1, 2], 5)).toEqual([[1, 2]]);
    });
  });
});
