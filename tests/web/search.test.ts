import { describe, it, expect } from 'vitest';
import { createSearchProvider } from '../../src/web/search';

describe('Search Providers', () => {
  describe('createSearchProvider', () => {
    it('should create DuckDuckGo provider by default', () => {
      const provider = createSearchProvider();
      expect(provider).toBeDefined();
      expect(typeof provider.search).toBe('function');
    });

    it('should create DuckDuckGo provider explicitly', () => {
      const provider = createSearchProvider({ provider: 'duckduckgo' });
      expect(provider).toBeDefined();
    });

    it('should throw for Brave without API key', () => {
      expect(() => createSearchProvider({ provider: 'brave' })).toThrow('API key');
    });

    it('should throw for Serper without API key', () => {
      expect(() => createSearchProvider({ provider: 'serper' })).toThrow('API key');
    });

    it('should create Brave provider with API key', () => {
      const provider = createSearchProvider({ provider: 'brave', apiKey: 'test-key' });
      expect(provider).toBeDefined();
    });

    it('should create Serper provider with API key', () => {
      const provider = createSearchProvider({ provider: 'serper', apiKey: 'test-key' });
      expect(provider).toBeDefined();
    });
  });
});
