/**
 * Test setup file
 * Polyfills for Node.js test environment
 */

// Polyfill File for Node 18.x (undici/fetch requires it)
if (typeof globalThis.File === 'undefined') {
  const { Blob } = await import('buffer');

  // Simple File polyfill
  class FilePolyfill extends Blob {
    name: string;
    lastModified: number;

    constructor(
      fileBits: BlobPart[],
      fileName: string,
      options?: FilePropertyBag
    ) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options?.lastModified || Date.now();
    }
  }

  globalThis.File = FilePolyfill as unknown as typeof File;
}
