/**
 * Full-featured chatbot example demonstrating all groq-rag capabilities:
 * - RAG (Retrieval-Augmented Generation)
 * - Web Search
 * - URL Fetching
 * - Agent with Tools
 * - Multi-turn conversation
 *
 * Usage:
 *   GROQ_API_KEY=your_key npx tsx full-chatbot.ts
 *
 * Commands:
 *   /help     - Show all commands
 *   /add      - Add URL to knowledge base
 *   /search   - Web search
 *   /fetch    - Fetch and summarize URL
 *   /mode     - Toggle agent/RAG mode
 *   /quit     - Exit
 */

import 'dotenv/config';
import GroqRAG from 'groq-rag';
import * as readline from 'readline';

interface Document {
  url?: string;
  source?: string;
  title?: string;
  addedAt: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Initialize GroqRAG client
const client = new GroqRAG({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize RAG
await client.initRAG({
  embedding: { provider: 'groq' },
  vectorStore: { provider: 'memory' },
});

// Create agent with all built-in tools
const agent = await client.createAgentWithBuiltins({
  name: 'SuperAssistant',
  model: 'llama-3.3-70b-versatile',
  systemPrompt: `You are a powerful AI assistant with full capabilities:

ABILITIES:
1. RAG Knowledge - Search and retrieve from your knowledge base
2. Web Search - Search the internet for current information
3. URL Fetching - Read and analyze any webpage
4. Calculator - Perform mathematical calculations

BEHAVIOR:
- Be helpful, accurate, and thorough
- Use your tools proactively when needed
- Cite sources when using web search or fetched URLs
- If you don't know something, search for it

Always provide the best possible answer using all available resources.`,
  verbose: false,
});

// Store documents info
let documents: Document[] = [];

// Chat history
let chatHistory: Message[] = [];

// Mode
let useAgentMode = true;

// Custom system prompt
let customSystemPrompt = `You are a helpful AI assistant. Use the provided context to answer questions accurately.
If you don't know something, say so honestly. Always be helpful and concise.`;

// Context - additional context provided by user
let userContext = '';

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Display banner
function showBanner(): void {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           GROQ-RAG FULL CHATBOT                          ║');
  console.log('║                                                          ║');
  console.log('║  CAPABILITIES:                                           ║');
  console.log('║  • RAG Knowledge Base     • Web Search (DuckDuckGo)      ║');
  console.log('║  • URL Fetching           • Agent with Tools             ║');
  console.log('║  • Custom Prompts         • Context Management           ║');
  console.log('║  • Multi-turn Memory      • Calculator                   ║');
  console.log('║                                                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  COMMANDS: /help for full list                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

// Show help
function showHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                        COMMANDS                               ║
╠═══════════════════════════════════════════════════════════════╣
║  KNOWLEDGE BASE:                                              ║
║    /add <url>       Add webpage content to knowledge base     ║
║    /addtext         Add custom text (multi-line input)        ║
║    /docs            List all documents in knowledge base      ║
║                                                               ║
║  WEB TOOLS:                                                   ║
║    /search <query>  Search the web for information            ║
║    /fetch <url>     Fetch URL and summarize content           ║
║                                                               ║
║  CUSTOMIZATION:                                               ║
║    /prompt          Set custom system prompt                  ║
║    /context         Set additional context for responses      ║
║    /showprompt      Display current system prompt             ║
║    /showcontext     Display current context                   ║
║    /resetprompt     Reset to default system prompt            ║
║                                                               ║
║  CHAT CONTROL:                                                ║
║    /mode            Toggle between Agent and RAG mode         ║
║    /clear           Clear conversation history                ║
║    /history         Show conversation history                 ║
║                                                               ║
║  OTHER:                                                       ║
║    /help            Show this help                            ║
║    /quit            Exit the chatbot                          ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

// Add URL to knowledge base
async function addURL(url: string): Promise<void> {
  try {
    console.log(`\n📥 Fetching: ${url}...`);

    // Use chat.withUrl to get content and add to RAG
    const response = await client.chat.withUrl({
      messages: [{ role: 'user', content: 'Extract the main content from this page as plain text.' }],
      url,
    });

    const content = response.content;
    await client.rag.addDocument(content, {
      source: url,
      title: response.source?.title || url,
      addedAt: new Date().toISOString(),
    });

    documents.push({ url, title: response.source?.title, addedAt: new Date().toISOString() });
    console.log(`✅ Added to knowledge base! (${content.length} chars)\n`);
  } catch (error) {
    console.error(`❌ Failed: ${(error as Error).message}\n`);
  }
}

// Add custom text
async function addCustomText(): Promise<void> {
  console.log('\n📝 Enter your text (type "END" on a new line to finish):');

  let text = '';
  const collectText = (): Promise<string> => {
    return new Promise((resolve) => {
      const lineHandler = (line: string): void => {
        if (line.trim() === 'END') {
          rl.removeListener('line', lineHandler);
          resolve(text);
        } else {
          text += line + '\n';
        }
      };
      rl.on('line', lineHandler);
    });
  };

  const content = await collectText();

  if (content.trim()) {
    await client.rag.addDocument(content, {
      source: 'user-input',
      addedAt: new Date().toISOString(),
    });
    documents.push({ source: 'Custom Text', addedAt: new Date().toISOString() });
    console.log(`✅ Added custom text to knowledge base!\n`);
  } else {
    console.log('❌ No text provided.\n');
  }
}

// Web search
async function webSearch(query: string): Promise<void> {
  try {
    console.log(`\n🔍 Searching: "${query}"...`);

    const response = await client.chat.withWebSearch({
      messages: [{ role: 'user', content: query }],
      maxResults: 5,
    });

    console.log(`\n📋 Answer:\n${response.content}\n`);

    if (response.sources && response.sources.length > 0) {
      console.log('Sources:');
      response.sources.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.title || 'No title'}`);
        console.log(`     ${s.url}\n`);
      });
    }
  } catch (error) {
    console.error(`❌ Search failed: ${(error as Error).message}\n`);
  }
}

// Fetch URL and summarize
async function fetchURL(url: string): Promise<void> {
  try {
    console.log(`\n🌐 Fetching: ${url}...`);

    const response = await client.chat.withUrl({
      messages: [{ role: 'user', content: 'Summarize this page in detail.' }],
      url,
    });

    console.log('\n--- Summary ---\n');
    console.log(response.content);
    console.log('\n--- End ---\n');

    if (response.source?.title) {
      console.log(`Page title: ${response.source.title}\n`);
    }
  } catch (error) {
    console.error(`❌ Fetch failed: ${(error as Error).message}\n`);
  }
}

// List documents
function listDocs(): void {
  if (documents.length === 0) {
    console.log('\n📚 Knowledge base is empty. Use /add <url> to add content.\n');
    return;
  }

  console.log('\n📚 Knowledge Base Documents:\n');
  documents.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.url || doc.source}`);
    if (doc.title) console.log(`   Title: ${doc.title}`);
    console.log(`   Added: ${doc.addedAt}\n`);
  });
}

// Show history
function showHistory(): void {
  if (chatHistory.length === 0) {
    console.log('\n📜 No conversation history yet.\n');
    return;
  }

  console.log('\n📜 Conversation History:\n');
  chatHistory.forEach((msg) => {
    const role = msg.role === 'user' ? 'You' : 'Bot';
    const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
    console.log(`${role}: ${preview}`);
  });
  console.log('');
}

// Set custom prompt
async function setCustomPrompt(): Promise<void> {
  console.log('\n📝 Enter your custom system prompt (type "END" on a new line to finish):');
  console.log('   This defines how the AI should behave.\n');

  let text = '';
  const collectText = (): Promise<string> => {
    return new Promise((resolve) => {
      const lineHandler = (line: string): void => {
        if (line.trim() === 'END') {
          rl.removeListener('line', lineHandler);
          resolve(text);
        } else {
          text += line + '\n';
        }
      };
      rl.on('line', lineHandler);
    });
  };

  const content = await collectText();

  if (content.trim()) {
    customSystemPrompt = content.trim();
    console.log(`✅ Custom prompt set!\n`);
  } else {
    console.log('❌ No prompt provided. Keeping current prompt.\n');
  }
}

// Set context
async function setContext(): Promise<void> {
  console.log('\n📝 Enter context information (type "END" on a new line to finish):');
  console.log('   This will be included in every response.\n');

  let text = '';
  const collectText = (): Promise<string> => {
    return new Promise((resolve) => {
      const lineHandler = (line: string): void => {
        if (line.trim() === 'END') {
          rl.removeListener('line', lineHandler);
          resolve(text);
        } else {
          text += line + '\n';
        }
      };
      rl.on('line', lineHandler);
    });
  };

  const content = await collectText();

  if (content.trim()) {
    userContext = content.trim();
    // Add context to RAG knowledge base
    await client.rag.addDocument(userContext, {
      source: 'user-context',
      type: 'context',
      addedAt: new Date().toISOString(),
    });
    console.log(`✅ Context set and added to knowledge base!\n`);
  } else {
    console.log('❌ No context provided.\n');
  }
}

// Show current prompt
function showCurrentPrompt(): void {
  console.log('\n📋 Current System Prompt:\n');
  console.log('─'.repeat(50));
  console.log(customSystemPrompt);
  console.log('─'.repeat(50));
  console.log('');
}

// Show current context
function showCurrentContext(): void {
  if (!userContext) {
    console.log('\n📋 No custom context set.\n');
    return;
  }
  console.log('\n📋 Current Context:\n');
  console.log('─'.repeat(50));
  console.log(userContext);
  console.log('─'.repeat(50));
  console.log('');
}

// Reset prompt to default
function resetPrompt(): void {
  customSystemPrompt = `You are a helpful AI assistant. Use the provided context to answer questions accurately.
If you don't know something, say so honestly. Always be helpful and concise.`;
  console.log('\n✅ System prompt reset to default.\n');
}

// Chat with Agent (uses tools automatically)
async function chatWithAgent(userInput: string): Promise<string> {
  try {
    console.log('\n🤖 Thinking...');

    const result = await agent.run(userInput);

    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('   Tools used:', result.toolCalls.map(t => t.name).join(', '));
    }

    return result.output;
  } catch (error) {
    console.error('Error:', (error as Error).message);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

// Chat with RAG
async function chatWithRAG(userInput: string): Promise<string> {
  try {
    chatHistory.push({ role: 'user', content: userInput });

    console.log('\n🤖 Thinking...');

    const response = await client.chat.withRAG({
      messages: chatHistory,
      topK: 5,
      systemPrompt: customSystemPrompt,
    });

    const answer = response.content;
    chatHistory.push({ role: 'assistant', content: answer });

    if (response.sources && response.sources.length > 0) {
      console.log(`   (Used ${response.sources.length} knowledge sources)`);
    }

    return answer;
  } catch (error) {
    // Fallback to basic chat if RAG fails
    try {
      const response = await client.complete({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: customSystemPrompt },
          ...chatHistory,
        ],
      });

      const answer = response.choices[0].message.content;
      chatHistory.push({ role: 'assistant', content: answer });
      return answer;
    } catch (e) {
      console.error('Error:', (e as Error).message);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }
}

// Main chat function
async function chat(userInput: string): Promise<string> {
  if (useAgentMode) {
    return await chatWithAgent(userInput);
  } else {
    return await chatWithRAG(userInput);
  }
}

// Process commands
async function processCommand(input: string): Promise<boolean> {
  const parts = input.trim().split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (cmd) {
    case '/help':
      showHelp();
      return true;

    case '/add':
      if (args) await addURL(args);
      else console.log('Usage: /add <url>\n');
      return true;

    case '/addtext':
      await addCustomText();
      return true;

    case '/search':
      if (args) await webSearch(args);
      else console.log('Usage: /search <query>\n');
      return true;

    case '/fetch':
      if (args) await fetchURL(args);
      else console.log('Usage: /fetch <url>\n');
      return true;

    case '/docs':
      listDocs();
      return true;

    case '/prompt':
      await setCustomPrompt();
      return true;

    case '/context':
      await setContext();
      return true;

    case '/showprompt':
      showCurrentPrompt();
      return true;

    case '/showcontext':
      showCurrentContext();
      return true;

    case '/resetprompt':
      resetPrompt();
      return true;

    case '/clear':
      chatHistory = [];
      console.log('\n🗑️  Chat history cleared!\n');
      return true;

    case '/history':
      showHistory();
      return true;

    case '/mode':
      useAgentMode = !useAgentMode;
      console.log(`\n🔄 Switched to ${useAgentMode ? 'Agent' : 'RAG'} mode`);
      if (useAgentMode) {
        console.log('   Agent: Auto uses web search, URL fetch, calculator, RAG\n');
      } else {
        console.log('   RAG: Uses knowledge base for context\n');
      }
      return true;

    case '/quit':
    case '/exit':
      console.log('\n👋 Goodbye!\n');
      rl.close();
      process.exit(0);

    default:
      return false;
  }
}

// Main prompt loop
async function prompt(): Promise<void> {
  const modeIcon = useAgentMode ? '🤖' : '💬';

  rl.question(`${modeIcon} You: `, async (input) => {
    const trimmed = input.trim();

    if (!trimmed) {
      prompt();
      return;
    }

    // Check if it's a command
    if (trimmed.startsWith('/')) {
      const handled = await processCommand(trimmed);
      if (handled) {
        prompt();
        return;
      }
    }

    // Regular chat
    const response = await chat(trimmed);
    console.log(`\n🤖 Assistant: ${response}\n`);

    prompt();
  });
}

// Start
showBanner();
console.log(`Mode: ${useAgentMode ? 'Agent (all tools enabled)' : 'RAG Chat'}`);
console.log('Type /help for all commands\n');
prompt();
