import Groq from 'groq-sdk';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'groq-sdk/resources/chat/completions';
import {
  GroqRAGConfig,
  RAGChatOptions,
  RAGResponse,
  FetchOptions,
  FetchResult,
  SearchOptions,
  WebSearchResult,
  AgentConfig,
  ToolDefinition,
  EmbeddingConfig,
  VectorStoreConfig,
  ChunkingOptions,
} from './types';
import { Retriever, createRetriever } from './rag/retriever';
import { createVectorStore } from './rag/vectorStore';
import { createEmbeddingProvider } from './rag/embeddings';
import { WebFetcher, createFetcher } from './web/fetcher';
import { createSearchProvider, SearchProvider } from './web/search';
import { Agent, createAgent } from './agents/agent';
import { ToolExecutor } from './tools/executor';
import {
  createWebSearchTool,
  createFetchUrlTool,
  createRAGQueryTool,
  getBuiltinTools,
} from './tools/builtins';
import { formatContext } from './utils/helpers';

/**
 * Extended Groq client with RAG, web, and agent capabilities
 */
export class GroqRAG {
  private groq: Groq;
  private config: GroqRAGConfig;
  private retriever?: Retriever;
  private fetcher: WebFetcher;
  private searchProvider: SearchProvider;

  public chat: ChatWithRAG;
  public web: WebModule;
  public rag: RAGModule;

  constructor(config: GroqRAGConfig = {}) {
    this.config = config;

    // Initialize Groq client
    this.groq = new Groq({
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
      baseURL: config.baseURL,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
    });

    // Initialize web modules
    this.fetcher = createFetcher(config.web);
    this.searchProvider = createSearchProvider();

    // Initialize modules
    this.chat = new ChatWithRAG(this);
    this.web = new WebModule(this);
    this.rag = new RAGModule(this);
  }

  /**
   * Get the underlying Groq client
   */
  get client(): Groq {
    return this.groq;
  }

  /**
   * Initialize RAG with vector store and embeddings
   */
  async initRAG(options?: {
    embedding?: EmbeddingConfig;
    vectorStore?: VectorStoreConfig;
    chunking?: Partial<ChunkingOptions>;
  }): Promise<Retriever> {
    const embeddingConfig: EmbeddingConfig = options?.embedding || {
      provider: 'groq',
    };

    const vectorStoreConfig: VectorStoreConfig = options?.vectorStore || {
      provider: 'memory',
    };

    const vectorStore = createVectorStore(vectorStoreConfig);
    const embeddings = createEmbeddingProvider(embeddingConfig, this.groq);
    this.retriever = createRetriever(vectorStore, embeddings, options?.chunking);

    return this.retriever;
  }

  /**
   * Get the retriever (initializes with defaults if not already initialized)
   */
  async getRetriever(): Promise<Retriever> {
    if (!this.retriever) {
      await this.initRAG();
    }
    return this.retriever!;
  }

  /**
   * Get the web fetcher
   */
  getFetcher(): WebFetcher {
    return this.fetcher;
  }

  /**
   * Get the search provider
   */
  getSearchProvider(): SearchProvider {
    return this.searchProvider;
  }

  /**
   * Create an agent with tools
   */
  createAgent(config?: AgentConfig): Agent {
    return createAgent(this.groq, config);
  }

  /**
   * Create an agent with built-in tools (web search, fetch, RAG)
   */
  async createAgentWithBuiltins(config?: AgentConfig): Promise<Agent> {
    const retriever = await this.getRetriever();
    const tools: ToolDefinition[] = [
      ...getBuiltinTools(),
      createRAGQueryTool(retriever),
      ...(config?.tools || []),
    ];

    return createAgent(this.groq, { ...config, tools });
  }

  /**
   * Standard chat completions (passthrough to Groq)
   */
  async complete(
    params: ChatCompletionCreateParamsNonStreaming
  ): Promise<ChatCompletion> {
    return this.groq.chat.completions.create(params);
  }

  /**
   * Streaming chat completions (passthrough to Groq)
   */
  stream(params: ChatCompletionCreateParamsStreaming) {
    return this.groq.chat.completions.create(params);
  }
}

/**
 * Chat module with RAG support
 */
class ChatWithRAG {
  constructor(private parent: GroqRAG) {}

  /**
   * Chat with RAG-augmented context
   */
  async withRAG(options: RAGChatOptions): Promise<RAGResponse> {
    const {
      messages,
      model = 'llama-3.3-70b-versatile',
      temperature = 0.7,
      maxTokens = 1024,
      topK = 5,
      minScore = 0,
      includeMetadata = false,
      systemPrompt,
    } = options;

    // Get the last user message for retrieval
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage || typeof lastUserMessage.content !== 'string') {
      throw new Error('No user message found for RAG retrieval');
    }

    // Retrieve relevant context
    const retriever = await this.parent.getRetriever();
    const results = await retriever.retrieve(lastUserMessage.content, {
      topK,
      minScore,
    });

    // Format context
    const context = formatContext(
      results.map(r => ({
        content: r.document.content,
        metadata: r.document.metadata,
      })),
      { includeMetadata }
    );

    // Build messages with context
    const ragSystemPrompt = systemPrompt ||
      `You are a helpful assistant. Use the following context to answer questions accurately.
If the context doesn't contain relevant information, say so clearly.

Context:
${context}`;

    const augmentedMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: ragSystemPrompt },
      ...messages,
    ];

    // Call Groq
    const response = await this.parent.client.chat.completions.create({
      model,
      messages: augmentedMessages,
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      sources: results,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Chat with web search augmentation
   */
  async withWebSearch(options: {
    messages: Groq.Chat.ChatCompletionMessageParam[];
    model?: string;
    searchQuery?: string;
    maxResults?: number;
  }): Promise<{ content: string; sources: WebSearchResult[] }> {
    const {
      messages,
      model = 'llama-3.3-70b-versatile',
      searchQuery,
      maxResults = 5,
    } = options;

    // Get search query from last user message if not provided
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const query = searchQuery ||
      (typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '');

    // Search the web
    const searchResults = await this.parent.getSearchProvider().search(query, { maxResults });

    // Format search results as context
    const context = searchResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
      .join('\n\n');

    const systemPrompt = `You are a helpful assistant with access to web search results.
Use the following search results to answer the question. Cite sources using [1], [2], etc.

Search Results:
${context}`;

    const response = await this.parent.client.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });

    return {
      content: response.choices[0]?.message?.content || '',
      sources: searchResults,
    };
  }

  /**
   * Chat with URL content
   */
  async withUrl(options: {
    messages: Groq.Chat.ChatCompletionMessageParam[];
    url: string;
    model?: string;
  }): Promise<{ content: string; source: FetchResult }> {
    const { messages, url, model = 'llama-3.3-70b-versatile' } = options;

    // Fetch the URL
    const fetchResult = await this.parent.getFetcher().fetch(url);

    const systemPrompt = `You are a helpful assistant. Use the following web page content to answer questions.

Title: ${fetchResult.title || 'Unknown'}
URL: ${url}

Content:
${fetchResult.markdown || fetchResult.content}`;

    const response = await this.parent.client.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });

    return {
      content: response.choices[0]?.message?.content || '',
      source: fetchResult,
    };
  }
}

/**
 * Web module for fetching and searching
 */
class WebModule {
  constructor(private parent: GroqRAG) {}

  /**
   * Fetch a URL
   */
  async fetch(url: string, options?: FetchOptions): Promise<FetchResult> {
    return this.parent.getFetcher().fetch(url, options);
  }

  /**
   * Fetch multiple URLs
   */
  async fetchMany(urls: string[], options?: FetchOptions): Promise<Array<FetchResult | Error>> {
    return this.parent.getFetcher().fetchMany(urls, options);
  }

  /**
   * Search the web
   */
  async search(query: string, options?: SearchOptions): Promise<WebSearchResult[]> {
    return this.parent.getSearchProvider().search(query, options);
  }

  /**
   * Fetch URL and convert to markdown
   */
  async fetchMarkdown(url: string): Promise<string> {
    return this.parent.getFetcher().fetchMarkdown(url);
  }
}

/**
 * RAG module for document management
 */
class RAGModule {
  constructor(private parent: GroqRAG) {}

  /**
   * Add a document to the knowledge base
   */
  async addDocument(
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const retriever = await this.parent.getRetriever();
    return retriever.addDocument(content, metadata);
  }

  /**
   * Add multiple documents
   */
  async addDocuments(
    documents: Array<{ content: string; metadata?: Record<string, unknown> }>
  ): Promise<string[]> {
    const retriever = await this.parent.getRetriever();
    return retriever.addDocuments(documents);
  }

  /**
   * Add a URL's content to the knowledge base
   */
  async addUrl(url: string, metadata?: Record<string, unknown>): Promise<string> {
    const fetcher = this.parent.getFetcher();
    const result = await fetcher.fetch(url);
    const content = result.markdown || result.content;

    const retriever = await this.parent.getRetriever();
    return retriever.addDocument(content, {
      ...metadata,
      url,
      title: result.title,
      fetchedAt: result.fetchedAt.toISOString(),
    });
  }

  /**
   * Query the knowledge base
   */
  async query(query: string, options?: { topK?: number; minScore?: number }) {
    const retriever = await this.parent.getRetriever();
    return retriever.retrieve(query, options);
  }

  /**
   * Get formatted context for a query
   */
  async getContext(query: string, options?: { topK?: number; includeMetadata?: boolean }) {
    const retriever = await this.parent.getRetriever();
    return retriever.getContext(query, options);
  }

  /**
   * Clear the knowledge base
   */
  async clear(): Promise<void> {
    const retriever = await this.parent.getRetriever();
    return retriever.clear();
  }

  /**
   * Get document count
   */
  async count(): Promise<number> {
    const retriever = await this.parent.getRetriever();
    return retriever.count();
  }
}
