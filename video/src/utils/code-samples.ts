export interface CodeLine {
  text: string;
  indent: number;
  delay?: number;
}

// Realistic chatbot code
export const CHATBOT_CODE: CodeLine[] = [
  { text: "import { GroqRAG } from 'groq-rag';", indent: 0, delay: 40 },
  { text: "", indent: 0, delay: 25 },
  { text: "const client = new GroqRAG({", indent: 0, delay: 35 },
  { text: "apiKey: process.env.GROQ_API_KEY", indent: 1, delay: 40 },
  { text: "});", indent: 0, delay: 25 },
  { text: "", indent: 0, delay: 25 },
  { text: "// Initialize RAG with knowledge base", indent: 0, delay: 30 },
  { text: "await client.initRAG();", indent: 0, delay: 35 },
  { text: "await client.rag.addUrl('https://docs.groq.com');", indent: 0, delay: 45 },
  { text: "", indent: 0, delay: 25 },
  { text: "// Create agent with built-in tools", indent: 0, delay: 30 },
  { text: "const agent = await client.createAgentWithBuiltins({", indent: 0, delay: 40 },
  { text: "model: 'llama-3.3-70b-versatile',", indent: 1, delay: 35 },
  { text: "systemPrompt: 'You are a helpful AI assistant.',", indent: 1, delay: 40 },
  { text: "verbose: true", indent: 1, delay: 30 },
  { text: "});", indent: 0, delay: 25 },
  { text: "", indent: 0, delay: 25 },
  { text: "// Run the agent", indent: 0, delay: 30 },
  { text: "const result = await agent.run(", indent: 0, delay: 35 },
  { text: "'Search for the latest AI news and summarize them'", indent: 1, delay: 50 },
  { text: ");", indent: 0, delay: 25 },
  { text: "", indent: 0, delay: 25 },
  { text: "console.log(result.output);", indent: 0, delay: 35 },
];

// Realistic npm install output
export const NPM_INSTALL_OUTPUT = [
  { text: "npm install groq-rag", type: "command", delay: 0 },
  { text: "", type: "blank", delay: 60 },
  { text: "added 42 packages, and audited 43 packages in 4s", type: "info", delay: 120 },
  { text: "", type: "blank", delay: 20 },
  { text: "7 packages are looking for funding", type: "dim", delay: 30 },
  { text: "  run `npm fund` for details", type: "dim", delay: 20 },
  { text: "", type: "blank", delay: 20 },
  { text: "found 0 vulnerabilities", type: "success", delay: 30 },
];

// Realistic bot execution output - matches actual groq-rag chatbot style
// Single interaction for cleaner demo
export const BOT_OUTPUT = [
  { text: "npx tsx chatbot.ts", type: "command", delay: 0 },
  { text: "", type: "blank", delay: 80 },
  // Header box
  { text: "╔══════════════════════════════════════════════════════════╗", type: "box", delay: 20 },
  { text: "║           GROQ-RAG FULL CHATBOT                          ║", type: "box", delay: 15 },
  { text: "║                                                          ║", type: "box", delay: 10 },
  { text: "║  CAPABILITIES:                                           ║", type: "box", delay: 15 },
  { text: "║  • RAG Knowledge Base     • Web Search (DuckDuckGo)      ║", type: "box", delay: 15 },
  { text: "║  • URL Fetching           • Agent with Tools             ║", type: "box", delay: 15 },
  { text: "║  • Custom Prompts         • Context Management           ║", type: "box", delay: 15 },
  { text: "║  • Multi-turn Memory      • Calculator                   ║", type: "box", delay: 15 },
  { text: "║                                                          ║", type: "box", delay: 10 },
  { text: "╠══════════════════════════════════════════════════════════╣", type: "box", delay: 15 },
  { text: "║  COMMANDS: /help for full list                           ║", type: "box", delay: 15 },
  { text: "╚══════════════════════════════════════════════════════════╝", type: "box", delay: 20 },
  { text: "", type: "blank", delay: 40 },
  { text: "Mode: Agent (all tools enabled)", type: "info", delay: 30 },
  { text: "Type /help for all commands", type: "dim", delay: 30 },
  { text: "", type: "blank", delay: 60 },
  // Single interaction
  { text: "🤖 You: search about groq-rag library", type: "user", delay: 80 },
  { text: "", type: "blank", delay: 40 },
  { text: "🤖 Thinking...", type: "thinking", delay: 50 },
  { text: "   Tools used: web_search, rag_query", type: "toolused", delay: 120 },
  { text: "", type: "blank", delay: 40 },
  { text: "🤖 Assistant: groq-rag is a powerful TypeScript/JavaScript library", type: "assistant", delay: 50 },
  { text: "that combines Groq's fast LLM inference with RAG capabilities.", type: "assistant", delay: 45 },
  { text: "It provides built-in tools for web search, URL fetching, and", type: "assistant", delay: 45 },
  { text: "vector-based knowledge retrieval. Perfect for building AI agents", type: "assistant", delay: 45 },
  { text: "with real-time web access and custom knowledge bases.", type: "assistant", delay: 45 },
  { text: "", type: "blank", delay: 50 },
  { text: "───────────────────────────────────────────────────────────────", type: "divider", delay: 20 },
  { text: "[groq-rag] ✓ Session completed | Tokens: 1,247 | Time: 3.2s", type: "stats", delay: 30 },
];

export const FILE_TREE = [
  { name: "my-ai-project", type: "folder" as const, level: 0, open: true },
  { name: "src", type: "folder" as const, level: 1, open: true },
  { name: "chatbot.ts", type: "file" as const, level: 2, active: true },
  { name: "config.ts", type: "file" as const, level: 2 },
  { name: "package.json", type: "file" as const, level: 1 },
  { name: "tsconfig.json", type: "file" as const, level: 1 },
  { name: ".env", type: "file" as const, level: 1 },
];

// Clean syntax highlighting - "Aurora" theme
const SYNTAX_COLORS = {
  keyword: '#ff7b72',      // Coral - import, const, await, new
  string: '#a5d6ff',       // Light blue - strings
  function: '#d2a8ff',     // Purple - function names
  comment: '#c9d1d9',      // Light gray/white - comments (VISIBLE)
  type: '#ffa657',         // Orange - types, classes
  variable: '#e6edf3',     // White - variables
  number: '#79c0ff',       // Cyan - numbers
  operator: '#ff7b72',     // Coral - operators
  property: '#7ee787',     // Green - properties
  punctuation: '#b1bac4',  // Light gray - punctuation, brackets
  bracket: '#b1bac4',      // Light gray - brackets
  boolean: '#79c0ff',      // Cyan - true/false
};

export const highlightCode = (text: string): { text: string; color: string }[] => {
  const tokens: { text: string; color: string }[] = [];

  const keywords = ['import', 'from', 'const', 'await', 'new', 'async', 'function', 'return', 'let', 'var', 'if', 'else', 'for', 'while'];
  const booleans = ['true', 'false', 'null', 'undefined'];
  const types = ['GroqRAG', 'string', 'number', 'boolean', 'Promise', 'Array', 'Object', 'Response'];

  let remaining = text;

  while (remaining.length > 0) {
    // Check for comments
    if (remaining.startsWith('//')) {
      tokens.push({ text: remaining, color: SYNTAX_COLORS.comment });
      break;
    }

    // Check for strings (single or double quotes)
    const stringMatch = remaining.match(/^(['"`]).*?\1/);
    if (stringMatch) {
      tokens.push({ text: stringMatch[0], color: SYNTAX_COLORS.string });
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    // Check for numbers
    const numberMatch = remaining.match(/^\d+(\.\d+)?/);
    if (numberMatch) {
      tokens.push({ text: numberMatch[0], color: SYNTAX_COLORS.number });
      remaining = remaining.slice(numberMatch[0].length);
      continue;
    }

    // Check for booleans
    let found = false;
    for (const bool of booleans) {
      if (remaining.startsWith(bool) && !/\w/.test(remaining[bool.length] || '')) {
        tokens.push({ text: bool, color: SYNTAX_COLORS.boolean });
        remaining = remaining.slice(bool.length);
        found = true;
        break;
      }
    }
    if (found) continue;

    // Check for keywords
    for (const kw of keywords) {
      if (remaining.startsWith(kw) && !/\w/.test(remaining[kw.length] || '')) {
        tokens.push({ text: kw, color: SYNTAX_COLORS.keyword });
        remaining = remaining.slice(kw.length);
        found = true;
        break;
      }
    }
    if (found) continue;

    // Check for types/classes (PascalCase)
    const typeMatch = remaining.match(/^[A-Z][a-zA-Z0-9]*/);
    if (typeMatch) {
      tokens.push({ text: typeMatch[0], color: SYNTAX_COLORS.type });
      remaining = remaining.slice(typeMatch[0].length);
      continue;
    }

    // Check for function calls
    const funcMatch = remaining.match(/^(\w+)\s*\(/);
    if (funcMatch) {
      tokens.push({ text: funcMatch[1], color: SYNTAX_COLORS.function });
      remaining = remaining.slice(funcMatch[1].length);
      continue;
    }

    // Check for properties/methods after dot
    const propMatch = remaining.match(/^\.(\w+)/);
    if (propMatch) {
      tokens.push({ text: '.', color: SYNTAX_COLORS.punctuation });
      tokens.push({ text: propMatch[1], color: SYNTAX_COLORS.property });
      remaining = remaining.slice(propMatch[0].length);
      continue;
    }

    // Check for property names before colon (object keys)
    const keyMatch = remaining.match(/^(\w+):/);
    if (keyMatch) {
      tokens.push({ text: keyMatch[1], color: SYNTAX_COLORS.property });
      tokens.push({ text: ':', color: SYNTAX_COLORS.punctuation });
      remaining = remaining.slice(keyMatch[0].length);
      continue;
    }

    // Check for operators
    const operatorMatch = remaining.match(/^(===|!==|==|!=|=>|<=|>=|&&|\|\||[+\-*/%=<>!])/);
    if (operatorMatch) {
      tokens.push({ text: operatorMatch[0], color: SYNTAX_COLORS.operator });
      remaining = remaining.slice(operatorMatch[0].length);
      continue;
    }

    // Default: single character
    const char = remaining[0];
    const brackets = '{}[]()';
    const punctuation = ';,.';
    let color = SYNTAX_COLORS.variable;
    if (brackets.includes(char)) {
      color = SYNTAX_COLORS.bracket;
    } else if (punctuation.includes(char)) {
      color = SYNTAX_COLORS.punctuation;
    }
    tokens.push({ text: char, color });
    remaining = remaining.slice(1);
  }

  return tokens;
};
