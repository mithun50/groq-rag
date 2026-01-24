import GroqRAG from 'groq-rag';

async function main() {
  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Fetch and summarize a URL
  const url = 'https://en.wikipedia.org/wiki/Artificial_intelligence';

  console.log(`Fetching ${url}...`);

  const response = await client.chat.withUrl({
    messages: [
      { role: 'user', content: 'Summarize this article in 3 bullet points.' },
    ],
    url,
  });

  console.log('\nSummary:', response.content);
  console.log('\nPage title:', response.source.title);
}

main().catch(console.error);
