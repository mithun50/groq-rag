import GroqRAG from 'groq-rag';

async function main() {
  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Add some knowledge to RAG
  await client.initRAG();
  await client.rag.addDocument(
    'Our company headquarters is located at 123 Main Street, San Francisco, CA.',
    { source: 'company-info' }
  );

  // Create an agent with built-in tools
  const agent = await client.createAgentWithBuiltins({
    name: 'Research Assistant',
    model: 'llama-3.3-70b-versatile',
    systemPrompt: `You are a research assistant. Use your tools to:
    - Search the web for current information
    - Fetch and read web pages
    - Query the knowledge base for internal information
    Always cite your sources.`,
    verbose: true,
  });

  // Run the agent
  const result = await agent.run(
    'What is the latest news about artificial intelligence? Also, where is our company located?'
  );

  console.log('\n=== Final Output ===');
  console.log(result.output);

  console.log('\n=== Tools Used ===');
  for (const tool of result.toolCalls) {
    console.log(`- ${tool.name}: ${tool.executionTime}ms`);
  }
}

main().catch(console.error);
