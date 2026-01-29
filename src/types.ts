import Groq from 'groq-sdk';

// ============================================
// Configuration Types
// ============================================

export interface GroqRAGConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  /** Allow usage in browser environments (exposes API key - use with caution) */
  dangerouslyAllowBrowser?: boolean;

  // Embedding configuration
  embedding?: EmbeddingConfig;

  // Vector store configuration
  vectorStore?: VectorStoreConfig;

  // Web configuration
  web?: WebConfig;
}

export interface EmbeddingConfig {
  provider: 'groq' | 'openai' | 'local' | 'custom';
  model?: string;
  apiKey?: string;
  baseURL?: string;
  dimensions?: number;
}

export interface VectorStoreConfig {
  provider: 'memory' | 'chroma' | 'pinecone' | 'qdrant' | 'custom';
  connectionString?: string;
  apiKey?: string;
  namespace?: string;
  indexName?: string;
}

export interface WebConfig {
  userAgent?: string;
  timeout?: number;
  maxContentLength?: number;
  followRedirects?: boolean;
  proxy?: string;
}

// ============================================
// Document & Embedding Types
// ============================================

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  startIndex?: number;
  endIndex?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  tokenCount?: number;
}

export interface SearchResult {
  document: DocumentChunk;
  score: number;
  relevance?: 'high' | 'medium' | 'low';
}

// ============================================
// RAG Types
// ============================================

export interface RAGOptions {
  /** Number of documents to retrieve */
  topK?: number;
  /** Minimum similarity score (0-1) */
  minScore?: number;
  /** Include document metadata in context */
  includeMetadata?: boolean;
  /** Custom context template */
  contextTemplate?: string;
  /** Maximum context length in tokens */
  maxContextTokens?: number;
}

export interface RAGChatOptions extends RAGOptions {
  messages: Groq.Chat.ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface RAGResponse {
  content: string;
  sources: SearchResult[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// Web Types
// ============================================

export interface FetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
  maxLength?: number;
  extractText?: boolean;
  includeLinks?: boolean;
  includeImages?: boolean;
  /** Max characters for content/markdown (optional - no limit if not set) */
  maxContentLength?: number;
  /** Estimated token limit - uses ~4 chars per token (optional - no limit if not set) */
  maxTokens?: number;
}

export interface FetchResult {
  url: string;
  title?: string;
  content: string;
  markdown?: string;
  links?: Array<{ text: string; href: string }>;
  images?: Array<{ alt: string; src: string }>;
  metadata?: {
    description?: string;
    author?: string;
    publishedDate?: string;
  };
  fetchedAt: Date;
}

export interface SearchOptions {
  maxResults?: number;
  language?: string;
  region?: string;
  safeSearch?: boolean;
  /** Max characters per snippet (optional - no limit if not set) */
  maxSnippetLength?: number;
  /** Max total characters for all results combined (optional - no limit if not set) */
  maxTotalContentLength?: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface BrowseOptions extends FetchOptions {
  /** Wait for JavaScript to execute */
  waitForJs?: boolean;
  /** Wait for specific selector */
  waitForSelector?: string;
  /** Execute custom JavaScript */
  executeScript?: string;
  /** Screenshot options */
  screenshot?: boolean;
  /** Scroll to load more content */
  scrollToBottom?: boolean;
}

// ============================================
// Tool Types
// ============================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
  error?: string;
  executionTime?: number;
}

// ============================================
// Agent Types
// ============================================

export interface AgentConfig {
  name?: string;
  model?: string;
  systemPrompt?: string;
  tools?: ToolDefinition[];
  maxIterations?: number;
  verbose?: boolean;
  memory?: AgentMemory;
}

export interface AgentMemory {
  messages: Groq.Chat.ChatCompletionMessageParam[];
  context?: string;
  variables?: Record<string, unknown>;
}

export interface AgentStep {
  thought?: string;
  action?: string;
  actionInput?: Record<string, unknown>;
  observation?: string;
  isFinal?: boolean;
}

export interface AgentResult {
  output: string;
  steps: AgentStep[];
  toolCalls: ToolResult[];
  totalTokens?: number;
}

// ============================================
// Chunking Types
// ============================================

export interface ChunkingOptions {
  strategy: 'fixed' | 'sentence' | 'paragraph' | 'semantic' | 'recursive';
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

// ============================================
// Vector Store Interface
// ============================================

export interface VectorStore {
  add(documents: DocumentChunk[]): Promise<void>;
  search(query: number[], options?: { topK?: number; filter?: Record<string, unknown> }): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
  clear(): Promise<void>;
  count(): Promise<number>;
}

// ============================================
// Embedding Provider Interface
// ============================================

export interface EmbeddingProvider {
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
  dimensions: number;
}
