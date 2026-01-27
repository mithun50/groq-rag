import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/utils/chunker.test.ts'], // Excluded: hangs on some platforms
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
    },
    testTimeout: 30000,
    teardownTimeout: 3000,
    hookTimeout: 10000,
  },
});
