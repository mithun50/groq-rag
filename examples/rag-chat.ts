import GroqRAG from 'groq-rag';

async function main() {
  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Initialize RAG with in-memory vector store
  await client.initRAG({
    embedding: { provider: 'groq' },
    vectorStore: { provider: 'memory' },
  });

  // Add documents to the knowledge base
  await client.rag.addDocument(
    `Our company's refund policy allows returns within 30 days of purchase.
    Items must be in original condition with tags attached.
    Refunds are processed within 5-7 business days.
    Digital products are non-refundable.`,
    { source: 'refund-policy', category: 'policies' }
  );

  await client.rag.addDocument(
    `Our shipping policy:
    - Standard shipping: 5-7 business days ($5.99)
    - Express shipping: 2-3 business days ($12.99)
    - Overnight shipping: Next business day ($24.99)
    Free shipping on orders over $50.`,
    { source: 'shipping-policy', category: 'policies' }
  );

  // Chat with RAG-augmented context
  const response = await client.chat.withRAG({
    messages: [
      { role: 'user', content: 'What is your refund policy?' },
    ],
    topK: 3,
  });

  console.log('Response:', response.content);
  console.log('\nSources used:');
  for (const source of response.sources) {
    console.log(`- Score: ${source.score.toFixed(3)}`);
    console.log(`  Content: ${source.document.content.substring(0, 100)}...`);
  }
}

main().catch(console.error);
