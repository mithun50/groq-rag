/**
 * groq-rag - Extended Groq TypeScript SDK
 *
 * Built on top of the official Groq TypeScript SDK (groq-sdk)
 * Provides 100% API compatibility with additional RAG, web, and agent capabilities.
 *
 * @see https://github.com/groq/groq-typescript - Official Groq TypeScript SDK
 * @see https://console.groq.com/docs - Groq API Documentation
 * @see https://github.com/mithun50/groq-rag - This library
 *
 * @packageDocumentation
 */

// Main client - extends Groq SDK
export { GroqRAG } from './client';

// Types
export * from './types';

// RAG module
export {
  Retriever,
  createRetriever,
  MemoryVectorStore,
  ChromaVectorStore,
  createVectorStore,
  GroqEmbeddings,
  OpenAIEmbeddings,
  createEmbeddingProvider,
} from './rag';

// Web module
export {
  WebFetcher,
  createFetcher,
  DuckDuckGoSearch,
  BraveSearch,
  SerperSearch,
  createSearchProvider,
  type SearchProvider,
} from './web';

// Tools module
export {
  ToolExecutor,
  createToolExecutor,
  createWebSearchTool,
  createFetchUrlTool,
  createRAGQueryTool,
  createCalculatorTool,
  createDateTimeTool,
  getBuiltinTools,
} from './tools';

// Agents module
export { Agent, createAgent } from './agents';

// MCP module
export {
  MCPClient,
  createMCPClient,
  MCPServerConfig,
  MCPTool,
  MCPToolCallResult,
  MCPContent,
  MCPClientState,
  StdioTransport,
  HttpTransport,
  createStdioTransport,
  createHttpTransport,
  mcpToolToDefinition,
  mcpToolsToDefinitions,
} from './mcp';

// Utilities
export {
  TextChunker,
  chunkText,
  generateId,
  cosineSimilarity,
  estimateTokens,
  truncateToTokens,
  cleanText,
  extractUrls,
  sleep,
  retry,
  formatContext,
  safeJsonParse,
  batch,
} from './utils';

// Default export
import { GroqRAG } from './client';
export default GroqRAG;
