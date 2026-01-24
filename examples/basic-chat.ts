import GroqRAG from 'groq-rag';

async function main() {
  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Basic chat completion
  const response = await client.complete({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' },
    ],
  });

  console.log('Response:', response.choices[0].message.content);
}

main().catch(console.error);
