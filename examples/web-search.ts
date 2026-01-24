import GroqRAG from 'groq-rag';

async function main() {
  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Chat with web search augmentation
  const response = await client.chat.withWebSearch({
    messages: [
      { role: 'user', content: 'What are the latest developments in AI?' },
    ],
    maxResults: 5,
  });

  console.log('Response:', response.content);
  console.log('\nSources:');
  for (const source of response.sources) {
    console.log(`[${source.position}] ${source.title}`);
    console.log(`    ${source.url}`);
  }
}

main().catch(console.error);
