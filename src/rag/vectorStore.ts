import { DocumentChunk, SearchResult, VectorStore, VectorStoreConfig } from '../types';
import { cosineSimilarity } from '../utils/helpers';

/**
 * In-memory vector store implementation
 */
export class MemoryVectorStore implements VectorStore {
  private documents: Map<string, DocumentChunk> = new Map();

  async add(documents: DocumentChunk[]): Promise<void> {
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
  }

  async search(
    queryEmbedding: number[],
    options: { topK?: number; filter?: Record<string, unknown> } = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, filter } = options;
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;

      // Apply filter if provided
      if (filter && doc.metadata) {
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (doc.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({
        document: doc,
        score,
        relevance: score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low',
      });
    }

    // Sort by score descending and take topK
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.documents.delete(id);
    }
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  async count(): Promise<number> {
    return this.documents.size;
  }

  /**
   * Get all documents (useful for debugging)
   */
  getAll(): DocumentChunk[] {
    return Array.from(this.documents.values());
  }
}

/**
 * Chroma vector store adapter
 */
export class ChromaVectorStore implements VectorStore {
  private baseURL: string;
  private collectionName: string;
  private collectionId?: string;

  constructor(config: VectorStoreConfig) {
    this.baseURL = config.connectionString || 'http://localhost:8000';
    this.collectionName = config.indexName || 'groq-rag';
  }

  private async ensureCollection(): Promise<void> {
    if (this.collectionId) return;

    // Create or get collection
    const response = await fetch(`${this.baseURL}/api/v1/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: this.collectionName }),
    });

    if (response.ok) {
      const data = await response.json() as { id: string };
      this.collectionId = data.id;
    } else {
      // Collection might exist, try to get it
      const getResponse = await fetch(
        `${this.baseURL}/api/v1/collections/${this.collectionName}`
      );
      if (getResponse.ok) {
        const data = await getResponse.json() as { id: string };
        this.collectionId = data.id;
      }
    }
  }

  async add(documents: DocumentChunk[]): Promise<void> {
    await this.ensureCollection();

    const ids = documents.map(d => d.id);
    const embeddings = documents.map(d => d.embedding || []);
    const metadatas = documents.map(d => d.metadata || {});
    const contents = documents.map(d => d.content);

    await fetch(`${this.baseURL}/api/v1/collections/${this.collectionId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids,
        embeddings,
        metadatas,
        documents: contents,
      }),
    });
  }

  async search(
    queryEmbedding: number[],
    options: { topK?: number; filter?: Record<string, unknown> } = {}
  ): Promise<SearchResult[]> {
    await this.ensureCollection();
    const { topK = 5, filter } = options;

    const response = await fetch(
      `${this.baseURL}/api/v1/collections/${this.collectionId}/query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_embeddings: [queryEmbedding],
          n_results: topK,
          where: filter,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Chroma query failed: ${response.statusText}`);
    }

    const data = await response.json() as {
      ids: string[][];
      distances: number[][];
      documents: string[][];
      metadatas: Array<Record<string, unknown>>[];
    };

    const results: SearchResult[] = [];
    const ids = data.ids[0] || [];
    const distances = data.distances[0] || [];
    const docs = data.documents[0] || [];
    const metas = data.metadatas[0] || [];

    for (let i = 0; i < ids.length; i++) {
      const score = 1 - (distances[i] || 0); // Convert distance to similarity
      results.push({
        document: {
          id: ids[i],
          documentId: ids[i],
          content: docs[i],
          metadata: metas[i],
        },
        score,
        relevance: score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low',
      });
    }

    return results;
  }

  async delete(ids: string[]): Promise<void> {
    await this.ensureCollection();
    await fetch(`${this.baseURL}/api/v1/collections/${this.collectionId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  }

  async clear(): Promise<void> {
    // Delete and recreate collection
    await fetch(`${this.baseURL}/api/v1/collections/${this.collectionName}`, {
      method: 'DELETE',
    });
    this.collectionId = undefined;
    await this.ensureCollection();
  }

  async count(): Promise<number> {
    await this.ensureCollection();
    const response = await fetch(
      `${this.baseURL}/api/v1/collections/${this.collectionId}/count`
    );
    const data = await response.json() as number;
    return data;
  }
}

/**
 * Create a vector store based on config
 */
export function createVectorStore(config: VectorStoreConfig): VectorStore {
  switch (config.provider) {
    case 'chroma':
      return new ChromaVectorStore(config);
    case 'memory':
    default:
      return new MemoryVectorStore();
  }
}
