// groq-rag Demo - Unified Chat with Automatic Tool Selection

const API = '';
let processing = false;

// Tool icons
const TOOL_ICONS = {
  web_search: '🔍',
  fetch_url: '📄',
  rag_query: '📚',
  calculator: '🧮',
  get_datetime: '🕐'
};

// DOM Elements
const $ = id => document.getElementById(id);
const messages = $('messages');
const userInput = $('user-input');
const sendBtn = $('send-btn');
const modelSelect = $('model-select');
const suggestions = $('suggestions');
const sidebar = $('sidebar');
const sidebarOverlay = $('sidebar-overlay');
const settingsModal = $('settings-modal');
const docBadge = $('doc-badge');
const docCount = $('doc-count');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  initRAG();
  bindEvents();
  updateDocCount();
}

function bindEvents() {
  // Input handling
  userInput.addEventListener('input', handleInput);
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  sendBtn.addEventListener('click', send);

  // Suggestions
  suggestions.addEventListener('click', e => {
    if (e.target.classList.contains('suggestion')) {
      userInput.value = e.target.dataset.text;
      handleInput();
      userInput.focus();
    }
  });

  // Sidebar
  $('kb-toggle').addEventListener('click', openSidebar);
  $('sidebar-close').addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Sidebar tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // KB actions
  $('add-doc-btn').addEventListener('click', addDocument);
  $('add-url-btn').addEventListener('click', addUrl);
  $('clear-kb-btn').addEventListener('click', clearKB);

  // Settings
  $('settings-btn').addEventListener('click', () => settingsModal.classList.add('open'));
  $('close-settings').addEventListener('click', () => settingsModal.classList.remove('open'));
  settingsModal.addEventListener('click', e => {
    if (e.target === settingsModal) settingsModal.classList.remove('open');
  });
  $('apply-settings').addEventListener('click', applySettings);
}

function handleInput() {
  const hasText = userInput.value.trim().length > 0;
  sendBtn.disabled = !hasText;

  // Auto-resize
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';

  // Hide suggestions when typing
  suggestions.classList.toggle('hidden', hasText);
}

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

// Initialize RAG
async function initRAG() {
  try {
    await fetch(`${API}/api/rag/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy: $('chunk-strategy')?.value || 'recursive',
        chunkSize: parseInt($('chunk-size')?.value) || 500
      })
    });
  } catch (e) {
    console.error('RAG init failed:', e);
  }
}

// Update document count
async function updateDocCount() {
  try {
    const res = await fetch(`${API}/api/rag/count`);
    const data = await res.json();
    if (data.success) {
      const count = data.count || 0;
      docBadge.textContent = count;
      docBadge.style.display = count > 0 ? 'flex' : 'none';
      docCount.textContent = `${count} document${count !== 1 ? 's' : ''} indexed`;
    }
  } catch (e) {
    console.error('Failed to get doc count:', e);
  }
}

// Send message
async function send() {
  const text = userInput.value.trim();
  if (!text || processing) return;

  processing = true;
  sendBtn.disabled = true;
  userInput.value = '';
  handleInput();

  // Clear welcome screen
  const welcome = messages.querySelector('.welcome');
  if (welcome) welcome.remove();

  // Add user message
  addMessage('user', text);

  // Add thinking indicator
  const thinking = addThinking();

  try {
    const model = modelSelect.value;

    // Try streaming first
    const eventSource = new EventSource(
      `${API}/api/agent/stream?task=${encodeURIComponent(text)}&model=${encodeURIComponent(model)}`
    );

    let response = '';
    let tools = [];

    eventSource.onmessage = e => {
      if (e.data === '[DONE]') {
        eventSource.close();
        thinking.remove();
        addMessage('assistant', response, tools);
        processing = false;
        sendBtn.disabled = false;
        return;
      }

      try {
        const data = JSON.parse(e.data);

        if (data.type === 'thinking' || data.type === 'tool_start' || data.type === 'tool_call') {
          const label = data.type === 'tool_call'
            ? `Using ${data.data.name}...`
            : data.type === 'tool_start'
              ? `Using ${data.data.name}...`
              : (data.data || 'Thinking...');
          thinking.querySelector('.thinking-text').textContent = label;
        } else if (data.type === 'tool_end' || data.type === 'tool_result') {
          if (data.data && data.data.name) {
            tools.push(data.data);
          } else if (data.data && data.data.result) {
            // tool_result format from agent
            tools.push({ name: 'tool', result: data.data.result });
          }
        } else if (data.type === 'response') {
          response = data.data;
        } else if (data.type === 'stream' || data.type === 'content') {
          response += data.data;
        } else if (data.type === 'done') {
          // Final response from agent
          if (data.data && data.data.output) {
            response = data.data.output;
          }
        } else if (data.type === 'error') {
          throw new Error(data.data);
        }
      } catch (err) {
        if (!err.message.includes('JSON')) console.error(err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (!response) {
        // Fallback to non-streaming
        fetchNonStreaming(text, model, thinking);
      } else {
        thinking.remove();
        addMessage('assistant', response, tools);
        processing = false;
        sendBtn.disabled = false;
      }
    };

  } catch (err) {
    thinking.remove();
    addMessage('assistant', `Error: ${err.message}`);
    processing = false;
    sendBtn.disabled = false;
  }
}

async function fetchNonStreaming(text, model, thinking) {
  try {
    thinking.querySelector('.thinking-text').textContent = 'Processing...';

    const res = await fetch(`${API}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: text, model })
    });

    const data = await res.json();
    thinking.remove();

    if (data.success) {
      addMessage('assistant', data.output, data.toolCalls || []);
    } else {
      addMessage('assistant', `Error: ${data.error}`);
    }
  } catch (err) {
    thinking.remove();
    addMessage('assistant', `Error: ${err.message}`);
  } finally {
    processing = false;
    sendBtn.disabled = false;
  }
}

// Add message to chat
function addMessage(role, content, tools = []) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = role === 'user' ? '👤' : '🤖';

  let toolsHtml = '';
  if (tools.length > 0) {
    toolsHtml = `
      <div class="tool-calls">
        ${tools.map(t => `
          <div class="tool-call">
            <span class="tool-call-icon">${TOOL_ICONS[t.name] || '🔧'}</span>
            <span class="tool-call-name">${t.name}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-body">
      <div class="message-content">${formatContent(content)}</div>
      ${toolsHtml}
    </div>
  `;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Add thinking indicator
function addThinking() {
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-body">
      <div class="thinking">
        <div class="thinking-dots"><span></span><span></span><span></span></div>
        <span class="thinking-text">Thinking...</span>
      </div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

// Format message content
function formatContent(text) {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>');
}

// Add document
async function addDocument() {
  const content = $('doc-text').value.trim();
  const source = $('doc-source').value.trim();

  if (!content) {
    toast('Please enter document content', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/api/rag/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, metadata: source ? { source } : {} })
    });

    const data = await res.json();
    if (data.success) {
      toast('Document added successfully', 'success');
      $('doc-text').value = '';
      $('doc-source').value = '';
      updateDocCount();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Add URL
async function addUrl() {
  const url = $('doc-url').value.trim();

  if (!url) {
    toast('Please enter a URL', 'error');
    return;
  }

  try {
    toast('Fetching URL...', 'info');

    const res = await fetch(`${API}/api/rag/add-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (data.success) {
      toast('URL indexed successfully', 'success');
      $('doc-url').value = '';
      updateDocCount();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Clear knowledge base
async function clearKB() {
  if (!confirm('Clear all documents?')) return;

  try {
    const res = await fetch(`${API}/api/rag/clear`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      toast('Knowledge base cleared', 'success');
      updateDocCount();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Apply settings
async function applySettings() {
  await initRAG();
  settingsModal.classList.remove('open');
  toast('Settings applied', 'success');
}

// Toast notification
function toast(message, type = 'info') {
  const container = $('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
