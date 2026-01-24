import GroqRAG from 'groq-rag';

async function main() {
  const client = new GroqRAG({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Create an agent with web tools
  const agent = await client.createAgentWithBuiltins({
    model: 'llama-3.3-70b-versatile',
    maxIterations: 5,
  });

  console.log('Agent starting...\n');

  // Run with streaming
  for await (const event of agent.runStream('Search for the latest SpaceX news and summarize it')) {
    switch (event.type) {
      case 'content':
        process.stdout.write(event.data as string);
        break;
      case 'tool_call':
        const call = event.data as { name: string; arguments: string };
        console.log(`\n[Tool Call] ${call.name}`);
        break;
      case 'tool_result':
        console.log(`[Tool Result] Received`);
        break;
      case 'done':
        console.log('\n\n[Agent Complete]');
        break;
    }
  }
}

main().catch(console.error);
