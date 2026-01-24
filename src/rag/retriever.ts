import {
  Document,
  DocumentChunk,
  EmbeddingProvider,
  RAGOptions,
  SearchResult,
  VectorStore,
  ChunkingOptions,
} from '../types';
import { TextChunker } from '../utils/chunker';
import { generateId, formatContext } from '../utils/helpers';

/**
 * RAG Retriever - handles document ingestion and retrieval
 */
export class Retriever {
  private vectorStore: VectorStore;
  private embeddings: EmbeddingProvider;
  private chunker: TextChunker;

  constructor(
    vectorStore: VectorStore,
    embeddings: EmbeddingProvider,
    chunkingOptions?: Partial<ChunkingOptions>
  ) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.chunker = new TextChunker(chunkingOptions);
  }

  /**
   * Add a document to the retriever
   */
  async addDocument(
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const documentId = generateId();
    const chunks = this.chunker.chunk(content, documentId);

    // Add metadata to chunks
    const chunksWithMetadata = chunks.map(chunk => ({
      ...chunk,
      metadata: { ...metadata, documentId },
    }));

    // Generate embeddings for all chunks
    const texts = chunksWithMetadata.map(c => c.content);
    const embedResults = await this.embeddings.embedBatch(texts);

    const chunksWithEmbeddings: DocumentChunk[] = chunksWithMetadata.map(
      (chunk, i) => ({
        ...chunk,
        embedding: embedResults[i].embedding,
      })
    );

    // Store in vector store
    await this.vectorStore.add(chunksWithEmbeddings);

    return documentId;
  }

  /**
   * Add multiple documents
   */
  async addDocuments(
    documents: Array<{ content: string; metadata?: Record<string, unknown> }>
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const doc of documents) {
      const id = await this.addDocument(doc.content, doc.metadata);
      ids.push(id);
    }
    return ids;
  }

  /**
   * Add raw text directly (without chunking)
   */
  async addChunk(
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const id = generateId();
    const [embedResult] = await this.embeddings.embedBatch([content]);

    const chunk: DocumentChunk = {
      id,
      documentId: id,
      content,
      metadata,
      embedding: embedResult.embedding,
    };

    await this.vectorStore.add([chunk]);
    return id;
  }

  /**
   * Retrieve relevant documents for a query
   */
  async retrieve(query: string, options: RAGOptions = {}): Promise<SearchResult[]> {
    const { topK = 5, minScore = 0 } = options;

    // Generate query embedding
    const { embedding } = await this.embeddings.embed(query);

    // Search vector store
    const results = await this.vectorStore.search(embedding, { topK: topK * 2 });

    // Filter by minimum score
    return results
      .filter(r => r.score >= minScore)
      .slice(0, topK);
  }

  /**
   * Retrieve and format context for LLM
   */
  async getContext(query: string, options: RAGOptions = {}): Promise<string> {
    const results = await this.retrieve(query, options);

    return formatContext(
      results.map(r => ({
        content: r.document.content,
        metadata: r.document.metadata,
      })),
      { includeMetadata: options.includeMetadata }
    );
  }

  /**
   * Delete documents by ID
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.vectorStore.delete(ids);
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    await this.vectorStore.clear();
  }

  /**
   * Get document count
   */
  async count(): Promise<number> {
    return this.vectorStore.count();
  }
}

/**
 * Create a default retriever with in-memory storage
 */
export function createRetriever(
  vectorStore: VectorStore,
  embeddings: EmbeddingProvider,
  options?: Partial<ChunkingOptions>
): Retriever {
  return new Retriever(vectorStore, embeddings, options);
}
