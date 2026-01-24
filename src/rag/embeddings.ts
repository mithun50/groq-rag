import Groq from 'groq-sdk';
import { EmbeddingConfig, EmbeddingProvider, EmbeddingResult } from '../types';
import { batch } from '../utils/helpers';

/**
 * Groq-based embedding provider (uses compatible models)
 */
export class GroqEmbeddings implements EmbeddingProvider {
  private client: Groq;
  private model: string;
  public dimensions: number;

  constructor(config: EmbeddingConfig & { groqClient?: Groq }) {
    this.client = config.groqClient || new Groq({ apiKey: config.apiKey });
    this.model = config.model || 'llama-3.3-70b-versatile';
    this.dimensions = config.dimensions || 1536;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    // Groq doesn't have a native embedding endpoint yet
    // Use a workaround: generate a consistent hash-based embedding
    // In production, you'd use OpenAI, Voyage, or local embeddings
    const embedding = await this.generatePseudoEmbedding(text);
    return { embedding, tokenCount: Math.ceil(text.length / 4) };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  /**
   * Generate a pseudo-embedding (for demo purposes)
   * In production, replace with actual embedding API
   */
  private async generatePseudoEmbedding(text: string): Promise<number[]> {
    const embedding: number[] = new Array(this.dimensions).fill(0);

    // Simple hash-based pseudo-embedding
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode * (i + 1)) % this.dimensions;
      embedding[index] += 1 / Math.sqrt(text.length);
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }
}

/**
 * OpenAI-compatible embedding provider
 */
export class OpenAIEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  public dimensions: number;

  constructor(config: EmbeddingConfig) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.model = config.model || 'text-embedding-3-small';
    this.dimensions = config.dimensions || 1536;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: this.model,
        dimensions: this.dimensions,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.statusText}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[] }>;
      usage?: { total_tokens: number };
    };

    return {
      embedding: data.data[0].embedding,
      tokenCount: data.usage?.total_tokens,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const batches = batch(texts, 100); // OpenAI limit
    const results: EmbeddingResult[] = [];

    for (const batchTexts of batches) {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: batchTexts,
          model: this.model,
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding request failed: ${response.statusText}`);
      }

      const data = await response.json() as {
        data: Array<{ embedding: number[] }>;
        usage?: { total_tokens: number };
      };

      for (const item of data.data) {
        results.push({
          embedding: item.embedding,
          tokenCount: data.usage?.total_tokens
            ? Math.floor(data.usage.total_tokens / batchTexts.length)
            : undefined,
        });
      }
    }

    return results;
  }
}

/**
 * Create an embedding provider based on config
 */
export function createEmbeddingProvider(
  config: EmbeddingConfig,
  groqClient?: Groq
): EmbeddingProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIEmbeddings(config);
    case 'groq':
    case 'local':
    default:
      return new GroqEmbeddings({ ...config, groqClient });
  }
}
