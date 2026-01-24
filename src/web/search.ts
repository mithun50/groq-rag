import { SearchOptions, WebSearchResult } from '../types';

/**
 * Web search provider interface
 */
export interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<WebSearchResult[]>;
}

/**
 * DuckDuckGo search (no API key required)
 */
export class DuckDuckGoSearch implements SearchProvider {
  private baseUrl = 'https://html.duckduckgo.com/html/';

  async search(query: string, options: SearchOptions = {}): Promise<WebSearchResult[]> {
    const { maxResults = 10 } = options;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; GroqRAG/1.0)',
        },
        body: `q=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const html = await response.text();
      const results = this.parseResults(html, maxResults);

      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  private parseResults(html: string, maxResults: number): WebSearchResult[] {
    const results: WebSearchResult[] = [];

    // Simple regex-based parsing (cheerio could be used for more robust parsing)
    const resultRegex = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([^<]+(?:<[^>]+>[^<]+<\/[^>]+>)*[^<]*)<\/a>/gi;

    let match;
    let position = 1;

    while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
      const url = this.decodeUrl(match[1]);
      const title = this.decodeHtml(match[2]);

      // Try to find corresponding snippet
      const snippetMatch = snippetRegex.exec(html);
      const snippet = snippetMatch
        ? this.decodeHtml(snippetMatch[1].replace(/<[^>]+>/g, ''))
        : '';

      if (url && title && !url.includes('duckduckgo.com')) {
        results.push({
          title,
          url,
          snippet,
          position: position++,
        });
      }
    }

    return results;
  }

  private decodeUrl(url: string): string {
    // DuckDuckGo URLs are often encoded
    try {
      const decoded = decodeURIComponent(url);
      const match = decoded.match(/uddg=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
      return decoded;
    } catch {
      return url;
    }
  }

  private decodeHtml(html: string): string {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
}

/**
 * Brave Search API
 */
export class BraveSearch implements SearchProvider {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options: SearchOptions = {}): Promise<WebSearchResult[]> {
    const { maxResults = 10, safeSearch = true } = options;

    const params = new URLSearchParams({
      q: query,
      count: String(maxResults),
      safesearch: safeSearch ? 'moderate' : 'off',
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave search failed: ${response.statusText}`);
    }

    const data = await response.json() as {
      web?: {
        results?: Array<{
          title: string;
          url: string;
          description: string;
        }>;
      };
    };

    return (data.web?.results || []).map((result, index) => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
      position: index + 1,
    }));
  }
}

/**
 * Serper.dev Google Search API
 */
export class SerperSearch implements SearchProvider {
  private apiKey: string;
  private baseUrl = 'https://google.serper.dev/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options: SearchOptions = {}): Promise<WebSearchResult[]> {
    const { maxResults = 10 } = options;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: JSON.stringify({
        q: query,
        num: maxResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper search failed: ${response.statusText}`);
    }

    const data = await response.json() as {
      organic?: Array<{
        title: string;
        link: string;
        snippet: string;
        position: number;
      }>;
    };

    return (data.organic || []).map(result => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet,
      position: result.position,
    }));
  }
}

/**
 * Create a search provider based on available API keys
 */
export function createSearchProvider(config?: {
  provider?: 'duckduckgo' | 'brave' | 'serper';
  apiKey?: string;
}): SearchProvider {
  const { provider = 'duckduckgo', apiKey } = config || {};

  switch (provider) {
    case 'brave':
      if (!apiKey) throw new Error('Brave Search requires an API key');
      return new BraveSearch(apiKey);
    case 'serper':
      if (!apiKey) throw new Error('Serper Search requires an API key');
      return new SerperSearch(apiKey);
    case 'duckduckgo':
    default:
      return new DuckDuckGoSearch();
  }
}
