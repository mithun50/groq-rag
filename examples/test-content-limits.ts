/**
 * Test script for content limiting feature
 * Tests: web search limits, URL fetch limits
 */

import GroqRAG from '../src/index';

const client = new GroqRAG({
  apiKey: process.env.GROQ_API_KEY,
});

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function testWebSearchLimits() {
  console.log('\n=== Testing Web Search Content Limits ===\n');

  const query = 'TypeScript tutorial';

  // Test 1: No limits (full content)
  console.log('1. Search WITHOUT limits:');
  const fullResults = await client.web.search(query, { maxResults: 5 });
  const fullTotalChars = fullResults.reduce((sum, r) => sum + r.title.length + r.snippet.length + r.url.length, 0);
  console.log(`   Results: ${fullResults.length}`);
  console.log(`   Total chars: ${fullTotalChars}`);
  console.log(`   Sample snippet length: ${fullResults[0]?.snippet.length || 0} chars`);
  console.log(`   Snippet preview: "${fullResults[0]?.snippet.slice(0, 50)}..."`);

  await delay(1500); // Avoid rate limiting

  // Test 2: With maxSnippetLength
  console.log('\n2. Search WITH maxSnippetLength=50:');
  const limitedSnippets = await client.web.search(query, {
    maxResults: 3,
    maxSnippetLength: 50,
  });
  console.log(`   Results: ${limitedSnippets.length}`);
  console.log(`   Sample snippet length: ${limitedSnippets[0]?.snippet.length || 0} chars`);
  console.log(`   Snippet: "${limitedSnippets[0]?.snippet}"`);

  await delay(1500); // Avoid rate limiting

  // Test 3: With maxTotalContentLength
  console.log('\n3. Search WITH maxTotalContentLength=400:');
  const limitedTotal = await client.web.search(query, {
    maxResults: 5,
    maxTotalContentLength: 400,
  });
  const limitedTotalChars = limitedTotal.reduce((sum, r) => sum + r.title.length + r.snippet.length + r.url.length, 0);
  console.log(`   Results returned: ${limitedTotal.length} (requested 5)`);
  console.log(`   Total chars: ${limitedTotalChars} (limit: 400)`);

  await delay(1500); // Avoid rate limiting

  // Test 4: Both limits combined
  console.log('\n4. Search WITH both limits (snippet=40, total=300):');
  const bothLimits = await client.web.search(query, {
    maxResults: 5,
    maxSnippetLength: 40,
    maxTotalContentLength: 300,
  });
  const bothTotalChars = bothLimits.reduce((sum, r) => sum + r.title.length + r.snippet.length + r.url.length, 0);
  console.log(`   Results returned: ${bothLimits.length}`);
  console.log(`   Total chars: ${bothTotalChars} (limit: 300)`);
  bothLimits.forEach((r, i) => {
    console.log(`   [${i + 1}] snippet (${r.snippet.length} chars): "${r.snippet}"`);
  });
}

async function testUrlFetchLimits() {
  console.log('\n\n=== Testing URL Fetch Content Limits ===\n');

  const url = 'https://example.com';

  // Test 1: No limits
  console.log('1. Fetch WITHOUT limits:');
  const fullFetch = await client.web.fetch(url);
  console.log(`   Content length: ${fullFetch.content.length} chars`);
  console.log(`   Markdown length: ${fullFetch.markdown?.length || 0} chars`);
  console.log(`   Preview: "${fullFetch.content.slice(0, 100)}..."`);

  // Test 2: With maxContentLength
  console.log('\n2. Fetch WITH maxContentLength=200:');
  const limitedContent = await client.web.fetch(url, {
    maxContentLength: 200,
  });
  console.log(`   Content length: ${limitedContent.content.length} chars (limit: 200)`);
  console.log(`   Content: "${limitedContent.content}"`);

  // Test 3: With maxTokens
  console.log('\n3. Fetch WITH maxTokens=50 (~200 chars):');
  const limitedTokens = await client.web.fetch(url, {
    maxTokens: 50,
  });
  console.log(`   Content length: ${limitedTokens.content.length} chars`);
  console.log(`   Content: "${limitedTokens.content}"`);
}

async function testChatWithLimits() {
  console.log('\n\n=== Testing Chat with Content Limits ===\n');

  // Test chat.withWebSearch with limits
  console.log('1. Chat with web search (maxSnippetLength=100, maxTotalContentLength=500):');
  try {
    const response = await client.chat.withWebSearch({
      messages: [{ role: 'user', content: 'What is Node.js?' }],
      model: 'llama-3.3-70b-versatile',
      maxResults: 3,
      maxSnippetLength: 100,
      maxTotalContentLength: 500,
    });
    console.log(`   Sources: ${response.sources.length}`);
    console.log(`   Response preview: "${response.content.slice(0, 150)}..."`);
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}`);
  }

  // Test chat.withUrl with limits
  console.log('\n2. Chat with URL (maxTokens=500):');
  try {
    const response = await client.chat.withUrl({
      messages: [{ role: 'user', content: 'Summarize this page' }],
      url: 'https://example.com',
      model: 'llama-3.3-70b-versatile',
      maxTokens: 500,
    });
    console.log(`   Response preview: "${response.content.slice(0, 150)}..."`);
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}`);
  }
}

async function main() {
  console.log('========================================');
  console.log('  Content Limiting Feature Test');
  console.log('========================================');

  try {
    await testWebSearchLimits();
    await testUrlFetchLimits();
    await testChatWithLimits();

    console.log('\n\n========================================');
    console.log('  All tests completed!');
    console.log('========================================\n');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();
