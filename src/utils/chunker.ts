import { ChunkingOptions, DocumentChunk } from '../types';

/**
 * Text chunking utilities for RAG
 */
export class TextChunker {
  private options: Required<ChunkingOptions>;

  constructor(options: Partial<ChunkingOptions> = {}) {
    this.options = {
      strategy: options.strategy || 'recursive',
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      separators: options.separators || ['\n\n', '\n', '. ', ' ', ''],
    };
  }

  /**
   * Chunk text into smaller pieces
   */
  chunk(text: string, documentId: string): DocumentChunk[] {
    switch (this.options.strategy) {
      case 'fixed':
        return this.fixedChunk(text, documentId);
      case 'sentence':
        return this.sentenceChunk(text, documentId);
      case 'paragraph':
        return this.paragraphChunk(text, documentId);
      case 'recursive':
        return this.recursiveChunk(text, documentId);
      case 'semantic':
        return this.semanticChunk(text, documentId);
      default:
        return this.recursiveChunk(text, documentId);
    }
  }

  /**
   * Fixed-size chunking with overlap
   */
  private fixedChunk(text: string, documentId: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.options.chunkSize, text.length);
      const content = text.slice(start, end).trim();

      if (content) {
        chunks.push({
          id: `${documentId}-chunk-${chunks.length}`,
          documentId,
          content,
          startIndex: start,
          endIndex: end,
        });
      }

      start += this.options.chunkSize - this.options.chunkOverlap;
    }

    return chunks;
  }

  /**
   * Sentence-based chunking
   */
  private sentenceChunk(text: string, documentId: string): DocumentChunk[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let startIndex = 0;

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.options.chunkSize && currentChunk) {
        chunks.push({
          id: `${documentId}-chunk-${chunks.length}`,
          documentId,
          content: currentChunk.trim(),
          startIndex,
          endIndex: startIndex + currentChunk.length,
        });
        startIndex += currentChunk.length;
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `${documentId}-chunk-${chunks.length}`,
        documentId,
        content: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
      });
    }

    return chunks;
  }

  /**
   * Paragraph-based chunking
   */
  private paragraphChunk(text: string, documentId: string): DocumentChunk[] {
    const paragraphs = text.split(/\n\n+/);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let startIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      if ((currentChunk + '\n\n' + trimmed).length > this.options.chunkSize && currentChunk) {
        chunks.push({
          id: `${documentId}-chunk-${chunks.length}`,
          documentId,
          content: currentChunk.trim(),
          startIndex,
          endIndex: startIndex + currentChunk.length,
        });
        startIndex += currentChunk.length;
        currentChunk = trimmed;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `${documentId}-chunk-${chunks.length}`,
        documentId,
        content: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
      });
    }

    return chunks;
  }

  /**
   * Recursive character text splitter (LangChain-style)
   */
  private recursiveChunk(text: string, documentId: string): DocumentChunk[] {
    return this.recursiveSplit(text, this.options.separators, documentId);
  }

  private recursiveSplit(
    text: string,
    separators: string[],
    documentId: string,
    chunks: DocumentChunk[] = []
  ): DocumentChunk[] {
    const separator = separators[0];
    const remainingSeparators = separators.slice(1);

    let splits: string[];
    if (separator === '') {
      splits = text.split('');
    } else {
      splits = text.split(separator);
    }

    let currentChunk = '';

    for (const split of splits) {
      const piece = separator === '' ? split : split + separator;

      if ((currentChunk + piece).length > this.options.chunkSize) {
        if (currentChunk) {
          if (currentChunk.length > this.options.chunkSize && remainingSeparators.length > 0) {
            this.recursiveSplit(currentChunk, remainingSeparators, documentId, chunks);
          } else {
            chunks.push({
              id: `${documentId}-chunk-${chunks.length}`,
              documentId,
              content: currentChunk.trim(),
            });
          }
        }
        currentChunk = piece;
      } else {
        currentChunk += piece;
      }
    }

    if (currentChunk.trim()) {
      if (currentChunk.length > this.options.chunkSize && remainingSeparators.length > 0) {
        this.recursiveSplit(currentChunk, remainingSeparators, documentId, chunks);
      } else {
        chunks.push({
          id: `${documentId}-chunk-${chunks.length}`,
          documentId,
          content: currentChunk.trim(),
        });
      }
    }

    return chunks;
  }

  /**
   * Semantic chunking (placeholder - would use embeddings in production)
   */
  private semanticChunk(text: string, documentId: string): DocumentChunk[] {
    // For now, fall back to paragraph chunking
    // In production, this would use embeddings to find semantic boundaries
    return this.paragraphChunk(text, documentId);
  }
}

/**
 * Utility function for quick chunking
 */
export function chunkText(
  text: string,
  documentId: string,
  options?: Partial<ChunkingOptions>
): DocumentChunk[] {
  const chunker = new TextChunker(options);
  return chunker.chunk(text, documentId);
}
