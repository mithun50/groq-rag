import { ToolDefinition } from '../types';
import { WebFetcher } from '../web/fetcher';
import { DuckDuckGoSearch } from '../web/search';
import { Retriever } from '../rag/retriever';

/**
 * Create web search tool
 */
export function createWebSearchTool(
  searchProvider = new DuckDuckGoSearch()
): ToolDefinition {
  return {
    name: 'web_search',
    description: 'Search the web for information. Use this to find current information, news, or research topics.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
        },
      },
      required: ['query'],
    },
    execute: async (params) => {
      const { query, maxResults = 5 } = params as { query: string; maxResults?: number };
      const results = await searchProvider.search(query, { maxResults });
      return results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      }));
    },
  };
}

/**
 * Create URL fetch tool
 */
export function createFetchUrlTool(
  fetcher = new WebFetcher()
): ToolDefinition {
  return {
    name: 'fetch_url',
    description: 'Fetch and extract content from a URL. Use this to read web pages, articles, or documentation.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch',
        },
        includeLinks: {
          type: 'boolean',
          description: 'Include links found on the page (default: false)',
        },
      },
      required: ['url'],
    },
    execute: async (params) => {
      const { url, includeLinks = false } = params as { url: string; includeLinks?: boolean };
      const result = await fetcher.fetch(url, { includeLinks });
      return {
        title: result.title,
        content: result.markdown || result.content,
        links: result.links?.slice(0, 10),
        metadata: result.metadata,
      };
    },
  };
}

/**
 * Create RAG query tool
 */
export function createRAGQueryTool(retriever: Retriever): ToolDefinition {
  return {
    name: 'rag_query',
    description: 'Search the knowledge base for relevant information. Use this to find information from indexed documents.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        topK: {
          type: 'number',
          description: 'Number of results to return (default: 5)',
        },
      },
      required: ['query'],
    },
    execute: async (params) => {
      const { query, topK = 5 } = params as { query: string; topK?: number };
      const results = await retriever.retrieve(query, { topK });
      return results.map(r => ({
        content: r.document.content,
        score: r.score,
        metadata: r.document.metadata,
      }));
    },
  };
}

/**
 * Create calculator tool
 */
export function createCalculatorTool(): ToolDefinition {
  return {
    name: 'calculator',
    description: 'Perform mathematical calculations. Supports basic arithmetic, powers, and common math functions.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "pow(2, 8)")',
        },
      },
      required: ['expression'],
    },
    execute: async (params) => {
      const { expression } = params as { expression: string };

      // Safe math evaluation
      const sanitized = expression
        .replace(/[^0-9+\-*/().,%\s]/gi, '')
        .replace(/pow/gi, 'Math.pow')
        .replace(/sqrt/gi, 'Math.sqrt')
        .replace(/abs/gi, 'Math.abs')
        .replace(/sin/gi, 'Math.sin')
        .replace(/cos/gi, 'Math.cos')
        .replace(/tan/gi, 'Math.tan')
        .replace(/log/gi, 'Math.log')
        .replace(/exp/gi, 'Math.exp')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?![xp])/gi, 'Math.E');

      try {
        if (!sanitized.trim()) {
          return { expression, error: 'Invalid expression' };
        }
        const result = new Function(`return ${sanitized}`)();
        if (result === undefined || (typeof result === 'number' && isNaN(result))) {
          return { expression, error: 'Invalid expression' };
        }
        return { expression, result };
      } catch {
        return { expression, error: 'Invalid expression' };
      }
    },
  };
}

/**
 * Create current datetime tool
 */
export function createDateTimeTool(): ToolDefinition {
  return {
    name: 'get_datetime',
    description: 'Get the current date and time in a specific timezone.',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Timezone (e.g., "UTC", "America/New_York", "Asia/Tokyo"). Defaults to UTC.',
        },
      },
      required: [],
    },
    execute: async (params) => {
      const { timezone = 'UTC' } = params as { timezone?: string };
      const now = new Date();

      try {
        const formatted = now.toLocaleString('en-US', { timeZone: timezone });
        return {
          datetime: formatted,
          timezone,
          timestamp: now.toISOString(),
          unix: Math.floor(now.getTime() / 1000),
        };
      } catch {
        return {
          datetime: now.toISOString(),
          timezone: 'UTC',
          timestamp: now.toISOString(),
          unix: Math.floor(now.getTime() / 1000),
        };
      }
    },
  };
}

/**
 * Get all built-in tools (except RAG which needs a retriever)
 */
export function getBuiltinTools(): ToolDefinition[] {
  return [
    createWebSearchTool(),
    createFetchUrlTool(),
    createCalculatorTool(),
    createDateTimeTool(),
  ];
}
