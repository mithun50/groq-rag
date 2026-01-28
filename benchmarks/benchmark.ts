/**
 * groq-rag Benchmark Tests
 * Run with: npx tsx benchmarks/benchmark.ts
 */

import GroqRAG, { createSearchProvider } from '../src/index.js';

const client = new GroqRAG({ apiKey: process.env.GROQ_API_KEY });

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSec: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// Fast local benchmark without delays
function benchmarkLocal(
  name: string,
  fn: () => void,
  iterations: number = 1000
): BenchmarkResult {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < 10; i++) fn();

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSec = 1000 / avgTime;

  console.log(`  ${iterations} iterations: avg ${avgTime.toFixed(4)}ms, ${opsPerSec.toFixed(0)} ops/sec`);

  return {
    name,
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    opsPerSec,
  };
}

async function benchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 5,
  timeoutMs: number = 30000
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  try {
    await withTimeout(fn(), timeoutMs, name);
  } catch (e) {
    console.log(`  ⚠ Warmup failed for ${name}: ${(e as Error).message}`);
  }

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await withTimeout(fn(), timeoutMs, name);
      const end = performance.now();
      times.push(end - start);
      process.stdout.write(`  Iteration ${i + 1}/${iterations}: ${(end - start).toFixed(2)}ms\n`);
    } catch (e) {
      console.log(`  ⚠ Iteration ${i + 1} failed: ${(e as Error).message}`);
    }

    // Rate limit delay
    await new Promise(r => setTimeout(r, 1000));
  }

  if (times.length === 0) {
    return {
      name,
      iterations: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: 0,
      maxTime: 0,
      opsPerSec: 0,
    };
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSec = 1000 / avgTime;

  return {
    name,
    iterations: times.length,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    opsPerSec,
  };
}

function formatResult(result: BenchmarkResult): string {
  return `
┌─────────────────────────────────────────────────┐
│ ${result.name.padEnd(47)} │
├─────────────────────────────────────────────────┤
│ Iterations:    ${String(result.iterations).padStart(10)}                    │
│ Total Time:    ${result.totalTime.toFixed(2).padStart(10)} ms               │
│ Avg Time:      ${result.avgTime.toFixed(2).padStart(10)} ms               │
│ Min Time:      ${result.minTime.toFixed(2).padStart(10)} ms               │
│ Max Time:      ${result.maxTime.toFixed(2).padStart(10)} ms               │
│ Ops/sec:       ${result.opsPerSec.toFixed(2).padStart(10)}                    │
└─────────────────────────────────────────────────┘`;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('           groq-rag Benchmark Suite                 ');
  console.log('═══════════════════════════════════════════════════\n');

  const results: BenchmarkResult[] = [];

  // ============ LOCAL PROCESSING BENCHMARKS ============

  // 1. Text Chunking (local) - run 100 iterations
  console.log('⚡ Benchmarking: Text Chunking (local)');
  const sampleText = 'Lorem ipsum dolor sit amet. '.repeat(1000);
  results.push(await benchmarkLocal('Text Chunking (local)', () => {
    const chunks: string[] = [];
    const chunkSize = 500;
    for (let i = 0; i < sampleText.length; i += chunkSize) {
      chunks.push(sampleText.slice(i, i + chunkSize));
    }
  }, 100));

  // 2. Content Truncation (local)
  console.log('\n⚡ Benchmarking: Content Truncation (local)');
  const longContent = 'A'.repeat(10000);
  results.push(await benchmarkLocal('Content Truncation (local)', () => {
    const maxLength = 1000;
    const truncated = longContent.length > maxLength
      ? longContent.slice(0, maxLength - 3) + '...'
      : longContent;
  }, 1000));

  // 3. Context Formatting (local)
  console.log('\n⚡ Benchmarking: Context Formatting (local)');
  const docs = Array(10).fill({ title: 'Doc', content: 'Content here' });
  results.push(await benchmarkLocal('Context Formatting (local)', () => {
    const formatted = docs.map((d, i) => `[${i + 1}] ${d.title}\n${d.content}`).join('\n\n');
  }, 1000));

  // ============ NETWORK BENCHMARKS ============

  // 4. Basic Chat Completion (using underlying Groq client)
  console.log('📝 Benchmarking: Basic Chat Completion (timeout: 10s)');
  results.push(await benchmark('Basic Chat Completion', async () => {
    await client.client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'Say hello in one word.' }],
      max_tokens: 10,
    });
  }, 5, 10000));

  // 2. Web Search (DuckDuckGo)
  console.log('\n🔍 Benchmarking: Web Search (DuckDuckGo) (timeout: 15s)');
  const searchProvider = createSearchProvider({ provider: 'duckduckgo' });
  results.push(await benchmark('Web Search (DuckDuckGo)', async () => {
    await searchProvider.search('TypeScript', { maxResults: 5 });
  }, 3, 15000));

  // 3. URL Fetch
  console.log('\n🌐 Benchmarking: URL Fetch (timeout: 10s)');
  results.push(await benchmark('URL Fetch', async () => {
    await client.web.fetch('https://example.com');
  }, 3, 10000));

  // 4. Chat with Web Search
  console.log('\n🔎 Benchmarking: Chat with Web Search (timeout: 30s)');
  results.push(await benchmark('Chat with Web Search', async () => {
    await client.chat.withWebSearch({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'What is TypeScript?' }],
      maxResults: 3,
      searchOptions: { maxTotalContentLength: 1000 },
    });
  }, 3, 30000));

  // 5. Chat with URL
  console.log('\n📄 Benchmarking: Chat with URL (timeout: 20s)');
  results.push(await benchmark('Chat with URL', async () => {
    await client.chat.withUrl({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'What is this page about?' }],
      url: 'https://example.com',
      fetchOptions: { maxContentLength: 1000 },
    });
  }, 3, 20000));

  // 6. Content Limiting - Snippet Truncation
  console.log('\n✂️ Benchmarking: Content Limiting (Snippet) (timeout: 15s)');
  results.push(await benchmark('Content Limiting (Snippet)', async () => {
    await searchProvider.search('JavaScript frameworks', {
      maxResults: 10,
      maxSnippetLength: 100,
    });
  }, 3, 15000));

  // 7. Content Limiting - Total Content
  console.log('\n📏 Benchmarking: Content Limiting (Total) (timeout: 15s)');
  results.push(await benchmark('Content Limiting (Total)', async () => {
    await searchProvider.search('Node.js tutorials', {
      maxResults: 10,
      maxTotalContentLength: 500,
    });
  }, 3, 15000));

  // Print Summary
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('                 BENCHMARK RESULTS                   ');
  console.log('═══════════════════════════════════════════════════');

  for (const result of results) {
    console.log(formatResult(result));
  }

  // Summary Table
  console.log('\n📊 Summary Table:');
  console.log('┌────────────────────────────────┬──────────┬──────────┬──────────┐');
  console.log('│ Benchmark                      │ Avg (ms) │ Min (ms) │ Max (ms) │');
  console.log('├────────────────────────────────┼──────────┼──────────┼──────────┤');
  for (const r of results) {
    const name = r.name.substring(0, 30).padEnd(30);
    const avg = r.avgTime.toFixed(0).padStart(8);
    const min = r.minTime.toFixed(0).padStart(8);
    const max = r.maxTime.toFixed(0).padStart(8);
    console.log(`│ ${name} │${avg} │${min} │${max} │`);
  }
  console.log('└────────────────────────────────┴──────────┴──────────┴──────────┘');

  // Save results to JSON
  const output = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    results: results.map(r => ({
      name: r.name,
      avgMs: Math.round(r.avgTime),
      minMs: Math.round(r.minTime),
      maxMs: Math.round(r.maxTime),
      opsPerSec: parseFloat(r.opsPerSec.toFixed(2)),
    })),
  };

  console.log('\n📁 Results JSON:');
  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
