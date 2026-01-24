// Main client
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
