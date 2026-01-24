// Unified Chat App - Uses Agent for automatic tool selection
// All features (RAG, Web Search, URL Fetch, Calculator, DateTime) in one chat

const API_BASE = '';
let isProcessing = false;
let ragInitialized = false;

// DOM Elements
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');
const docCountEl = document.getElementById('doc-count');
const knowledgePanel = document.getElementById('knowledge-panel');
const panelToggle = document.getElementById('panel-toggle');
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettings = document.getElementById('close-settings');

// Tool icons mapping
const toolIcons = {
  web_search: '🔍',
  fetch_url: '📄',
  rag_query: '📚',
  calculator: '🧮',
  get_datetime: '🕐',
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initRAG();
  setupEventListeners();
  updateDocCount();
  autoResizeTextarea();
});

// Setup Event Listeners
function setupEventListeners() {
  // Send message
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  userInput.addEventListener('input', autoResizeTextarea);

  // Knowledge panel toggle
  panelToggle.addEventListener('click', () => {
    knowledgePanel.classList.toggle('collapsed');
  });
  // Start collapsed
  knowledgePanel.classList.add('collapsed');

  // KB tabs
  document.querySelectorAll('.kb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.kb-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.kb-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // Add document
  document.getElementById('add-doc-btn').addEventListener('click', addDocument);
  document.getElementById('add-url-btn').addEventListener('click', addUrl);
  document.getElementById('clear-kb-btn').addEventListener('click', clearKnowledgeBase);

  // Settings modal
  settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
  closeSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('active');
  });
  document.getElementById('apply-settings').addEventListener('click', applySettings);

  // Hints
  document.querySelectorAll('.hint').forEach(hint => {
    hint.addEventListener('click', () => {
      const text = hint.textContent.replace('Try: ', '').replace(/"/g, '');
      userInput.value = text;
      autoResizeTextarea();
      userInput.focus();
    });
  });
}

function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
}

// Initialize RAG
async function initRAG() {
  try {
    const strategy = document.getElementById('chunk-strategy')?.value || 'recursive';
    const chunkSize = parseInt(document.getElementById('chunk-size')?.value) || 500;

    await fetch(`${API_BASE}/api/rag/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy, chunkSize }),
    });
    ragInitialized = true;
  } catch (err) {
    console.error('Failed to init RAG:', err);
  }
}

// Update document count
async function updateDocCount() {
  try {
    const res = await fetch(`${API_BASE}/api/rag/count`);
    const data = await res.json();
    if (data.success) {
      docCountEl.textContent = `${data.count} docs`;
    }
  } catch (err) {
    console.error('Failed to get doc count:', err);
  }
}

// Send message using Agent (automatic tool selection)
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || isProcessing) return;

  isProcessing = true;
  sendBtn.disabled = true;
  userInput.value = '';
  autoResizeTextarea();

  // Add user message
  addMessage('user', message);

  // Add thinking indicator
  const thinkingEl = addThinkingIndicator();

  try {
    const model = modelSelect.value;

    // Use streaming agent endpoint
    const eventSource = new EventSource(
      `${API_BASE}/api/agent/stream?task=${encodeURIComponent(message)}&model=${encodeURIComponent(model)}`
    );

    let response = '';
    let toolCalls = [];
    let currentThinkingText = 'Thinking...';

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        removeThinkingIndicator(thinkingEl);
        addMessage('assistant', response, toolCalls);
        isProcessing = false;
        sendBtn.disabled = false;
        return;
      }

      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'thinking':
            currentThinkingText = data.data || 'Thinking...';
            updateThinkingText(thinkingEl, currentThinkingText);
            break;

          case 'tool_start':
            currentThinkingText = `Using ${data.data.name}...`;
            updateThinkingText(thinkingEl, currentThinkingText);
            break;

          case 'tool_end':
            toolCalls.push({
              name: data.data.name,
              args: data.data.args,
              result: data.data.result,
            });
            break;

          case 'response':
            response = data.data;
            break;

          case 'stream':
            response += data.data;
            break;

          case 'error':
            throw new Error(data.data);
        }
      } catch (e) {
        if (e.message !== 'Unexpected end of JSON input') {
          console.error('Parse error:', e);
        }
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();
      removeThinkingIndicator(thinkingEl);

      if (!response) {
        // Fallback to non-streaming if SSE fails
        fallbackToNonStreaming(message, model, thinkingEl);
      } else {
        addMessage('assistant', response, toolCalls);
        isProcessing = false;
        sendBtn.disabled = false;
      }
    };

  } catch (err) {
    removeThinkingIndicator(thinkingEl);
    addMessage('assistant', `Error: ${err.message}`);
    isProcessing = false;
    sendBtn.disabled = false;
  }
}

// Fallback to non-streaming request
async function fallbackToNonStreaming(message, model, thinkingEl) {
  try {
    updateThinkingText(thinkingEl, 'Processing...');

    const res = await fetch(`${API_BASE}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: message, model }),
    });

    const data = await res.json();
    removeThinkingIndicator(thinkingEl);

    if (data.success) {
      addMessage('assistant', data.output, data.toolCalls || []);
    } else {
      addMessage('assistant', `Error: ${data.error}`);
    }
  } catch (err) {
    removeThinkingIndicator(thinkingEl);
    addMessage('assistant', `Error: ${err.message}`);
  } finally {
    isProcessing = false;
    sendBtn.disabled = false;
  }
}

// Add message to chat
function addMessage(role, content, toolCalls = []) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const avatar = role === 'user' ? '👤' : '🤖';

  let toolCallsHtml = '';
  if (toolCalls.length > 0) {
    toolCallsHtml = `
      <div class="tool-calls">
        ${toolCalls.map(tc => `
          <div class="tool-call">
            <span class="tool-icon">${toolIcons[tc.name] || '🔧'}</span>
            <span class="tool-name">${tc.name}</span>
            <span class="tool-result">${getToolResultSummary(tc)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-text">${formatMessage(content)}</div>
      ${toolCallsHtml}
    </div>
  `;

  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Get tool result summary
function getToolResultSummary(tc) {
  if (!tc.result) return '';

  if (typeof tc.result === 'string') {
    return tc.result.length > 50 ? tc.result.slice(0, 50) + '...' : tc.result;
  }

  if (tc.name === 'web_search') {
    const results = tc.result.results || tc.result;
    return Array.isArray(results) ? `${results.length} results` : '';
  }

  if (tc.name === 'calculator') {
    return tc.result.result !== undefined ? `= ${tc.result.result}` : '';
  }

  if (tc.name === 'get_datetime') {
    return tc.result.formatted || tc.result.datetime || '';
  }

  return 'Done';
}

// Format message content
function formatMessage(content) {
  if (!content) return '';

  // Escape HTML
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

// Add thinking indicator
function addThinkingIndicator() {
  const div = document.createElement('div');
  div.className = 'message assistant thinking-message';
  div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="thinking">
        <div class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
        <span class="thinking-text">Thinking...</span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(div);
  scrollToBottom();
  return div;
}

// Update thinking text
function updateThinkingText(el, text) {
  if (el) {
    const textEl = el.querySelector('.thinking-text');
    if (textEl) textEl.textContent = text;
  }
}

// Remove thinking indicator
function removeThinkingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

// Scroll to bottom
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add document to knowledge base
async function addDocument() {
  const content = document.getElementById('doc-text').value.trim();
  const source = document.getElementById('doc-source').value.trim();

  if (!content) {
    showToast('Please enter document content', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/rag/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        metadata: source ? { source } : {}
      }),
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Added document (${data.totalChunks} chunks total)`, 'success');
      document.getElementById('doc-text').value = '';
      document.getElementById('doc-source').value = '';
      updateDocCount();
    } else {
      showToast(data.error, 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Add URL to knowledge base
async function addUrl() {
  const url = document.getElementById('doc-url').value.trim();

  if (!url) {
    showToast('Please enter a URL', 'error');
    return;
  }

  try {
    showToast('Fetching URL...', 'info');

    const res = await fetch(`${API_BASE}/api/rag/add-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Indexed URL (${data.totalChunks} chunks total)`, 'success');
      document.getElementById('doc-url').value = '';
      updateDocCount();
    } else {
      showToast(data.error, 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Clear knowledge base
async function clearKnowledgeBase() {
  if (!confirm('Clear all documents from knowledge base?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/rag/clear`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      showToast('Knowledge base cleared', 'success');
      updateDocCount();
    } else {
      showToast(data.error, 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Apply settings
async function applySettings() {
  await initRAG();
  settingsModal.classList.remove('active');
  showToast('Settings applied', 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
