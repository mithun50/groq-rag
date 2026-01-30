// groq-rag Demo - Unified Chat with Automatic Tool Selection

const API = '';
let processing = false;
let attachedImages = [];

// MCP Server Presets
const MCP_PRESETS = {
  filesystem: {
    name: 'filesystem',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.']
  },
  memory: {
    name: 'memory',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory']
  },
  fetch: {
    name: 'fetch',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch']
  }
};

// Tool icons
const TOOL_ICONS = {
  web_search: '🔍',
  fetch_url: '📄',
  rag_query: '📚',
  calculator: '🧮',
  get_datetime: '🕐',
  mcp: '🔌'  // Default MCP tool icon
};

// Get icon for tool (handles MCP namespaced tools like "serverName__toolName")
function getToolIcon(toolName) {
  if (TOOL_ICONS[toolName]) return TOOL_ICONS[toolName];
  // MCP tools are namespaced as serverName__toolName
  if (toolName && toolName.includes('__')) return TOOL_ICONS.mcp;
  return '🔧';
}

// Format tool name for display (handles MCP namespaced tools)
function formatToolName(toolName) {
  if (!toolName) return 'unknown';
  // MCP tools: serverName__toolName -> toolName (serverName)
  if (toolName.includes('__')) {
    const [server, tool] = toolName.split('__');
    return `${tool} (${server})`;
  }
  return toolName;
}

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
const mcpModal = $('mcp-modal');
const docBadge = $('doc-badge');
const docCount = $('doc-count');
const mcpBadge = $('mcp-badge');
const imagePreview = $('image-preview');
const imageInput = $('image-input');
const imageBtn = $('image-btn');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  initRAG();
  bindEvents();
  updateDocCount();
  updateMCPCount();
  updateVisionUI();
}

// Show/hide image button based on vision model
function updateVisionUI() {
  const selectedOption = modelSelect.options[modelSelect.selectedIndex];
  const supportsVision = selectedOption.dataset.vision === 'true';
  imageBtn.style.display = supportsVision ? 'flex' : 'none';

  // Clear attached images if switching to non-vision model
  if (!supportsVision && attachedImages.length > 0) {
    attachedImages = [];
    updateImagePreview();
    handleInput();
  }
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

  // Image handling
  imageBtn.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageSelect);

  // Model change - update vision UI
  modelSelect.addEventListener('change', updateVisionUI);

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

  // MCP Modal
  $('mcp-toggle').addEventListener('click', openMCPModal);
  $('close-mcp').addEventListener('click', closeMCPModal);
  mcpModal.addEventListener('click', e => {
    if (e.target === mcpModal) closeMCPModal();
  });

  // MCP transport toggle
  $('mcp-transport').addEventListener('change', e => {
    const isStdio = e.target.value === 'stdio';
    $('mcp-stdio-fields').classList.toggle('hidden', !isStdio);
    $('mcp-http-fields').classList.toggle('hidden', isStdio);
  });

  // MCP actions
  $('add-mcp-btn').addEventListener('click', addMCPServer);
  $('disconnect-all-mcp').addEventListener('click', disconnectAllMCP);

  // MCP Presets
  document.querySelectorAll('.mcp-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (MCP_PRESETS[preset]) {
        addMCPPreset(preset);
      }
    });
  });
}

function handleInput() {
  const hasText = userInput.value.trim().length > 0 || attachedImages.length > 0;
  sendBtn.disabled = !hasText;

  // Auto-resize
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';

  // Hide suggestions when typing
  suggestions.classList.toggle('hidden', hasText);
}

// Image handling
function handleImageSelect(e) {
  const files = Array.from(e.target.files);
  const selectedModel = modelSelect.options[modelSelect.selectedIndex];
  const supportsVision = selectedModel.dataset.vision === 'true';

  if (!supportsVision) {
    toast('Selected model does not support images. Please choose a vision model.', 'error');
    imageInput.value = '';
    return;
  }

  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      attachedImages.push({
        type: 'image_url',
        image_url: { url: base64 }
      });
      updateImagePreview();
      handleInput();
    };
    reader.readAsDataURL(file);
  });

  imageInput.value = '';
}

function updateImagePreview() {
  if (attachedImages.length === 0) {
    imagePreview.classList.add('hidden');
    imagePreview.innerHTML = '';
    imageBtn.classList.remove('active');
    return;
  }

  imageBtn.classList.add('active');
  imagePreview.classList.remove('hidden');
  imagePreview.innerHTML = attachedImages.map((img, idx) => `
    <div class="image-preview-item">
      <img src="${img.image_url.url}" alt="Attached image">
      <button class="remove-image" onclick="removeImage(${idx})">&times;</button>
    </div>
  `).join('');
}

function removeImage(idx) {
  attachedImages.splice(idx, 1);
  updateImagePreview();
  handleInput();
}

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

// MCP Modal functions
function openMCPModal() {
  mcpModal.classList.add('open');
  loadMCPServers();
}

function closeMCPModal() {
  mcpModal.classList.remove('open');
}

async function loadMCPServers() {
  try {
    const res = await fetch(`${API}/api/mcp/servers`);
    const data = await res.json();

    const list = $('mcp-servers-list');
    if (data.success && data.servers.length > 0) {
      list.innerHTML = data.servers.map(server => `
        <div class="mcp-server-item">
          <div class="mcp-server-info">
            <div class="mcp-server-name">${server.name}</div>
            <div class="mcp-server-tools">${server.tools.length} tool${server.tools.length !== 1 ? 's' : ''}: ${server.tools.slice(0, 3).join(', ')}${server.tools.length > 3 ? '...' : ''}</div>
          </div>
          <div class="mcp-server-status">Connected</div>
          <div class="mcp-server-actions">
            <button class="mcp-disconnect-btn" onclick="disconnectMCP('${server.name}')">Disconnect</button>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<p class="mcp-empty">No MCP servers connected</p>';
    }

    updateMCPCount();
  } catch (err) {
    console.error('Failed to load MCP servers:', err);
  }
}

async function addMCPPreset(presetName) {
  const preset = MCP_PRESETS[presetName];
  if (!preset) return;

  try {
    toast(`Connecting to ${preset.name}...`, 'info');

    const res = await fetch(`${API}/api/mcp/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset)
    });

    const data = await res.json();
    if (data.success) {
      toast(`Connected to ${preset.name}`, 'success');
      loadMCPServers();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function addMCPServer() {
  const name = $('mcp-name').value.trim();
  const transport = $('mcp-transport').value;

  if (!name) {
    toast('Please enter a server name', 'error');
    return;
  }

  const config = { name, transport };

  if (transport === 'stdio') {
    const command = $('mcp-command').value.trim();
    const argsStr = $('mcp-args').value.trim();

    if (!command) {
      toast('Please enter a command', 'error');
      return;
    }

    config.command = command;
    config.args = argsStr ? argsStr.split(',').map(a => a.trim()) : [];
  } else {
    const url = $('mcp-url').value.trim();
    if (!url) {
      toast('Please enter a server URL', 'error');
      return;
    }
    config.url = url;
  }

  try {
    toast('Connecting to MCP server...', 'info');

    const res = await fetch(`${API}/api/mcp/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const data = await res.json();
    if (data.success) {
      toast(`Connected to ${name}`, 'success');
      $('mcp-name').value = '';
      $('mcp-command').value = '';
      $('mcp-args').value = '';
      $('mcp-url').value = '';
      loadMCPServers();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function disconnectMCP(name) {
  try {
    const res = await fetch(`${API}/api/mcp/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    if (data.success) {
      toast(`Disconnected from ${name}`, 'success');
      loadMCPServers();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function disconnectAllMCP() {
  if (!confirm('Disconnect all MCP servers?')) return;

  try {
    const res = await fetch(`${API}/api/mcp/disconnect-all`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      toast('All MCP servers disconnected', 'success');
      loadMCPServers();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function updateMCPCount() {
  try {
    const res = await fetch(`${API}/api/mcp/servers`);
    const data = await res.json();
    if (data.success) {
      const count = data.count || 0;
      mcpBadge.textContent = count;
      mcpBadge.style.display = count > 0 ? 'flex' : 'none';
    }
  } catch (e) {
    console.error('Failed to get MCP count:', e);
  }
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
  if ((!text && attachedImages.length === 0) || processing) return;

  processing = true;
  sendBtn.disabled = true;
  userInput.value = '';
  const images = [...attachedImages];
  attachedImages = [];
  updateImagePreview();
  handleInput();

  // Clear welcome screen
  const welcome = messages.querySelector('.welcome');
  if (welcome) welcome.remove();

  // Add user message with images
  addMessage('user', text, [], images);

  // Add thinking indicator
  const thinking = addThinking();

  try {
    const model = modelSelect.value;

    // If we have images, use chat API directly
    if (images.length > 0) {
      await sendWithImages(text, model, images, thinking);
      return;
    }

    // Use non-streaming for reliability
    await fetchNonStreaming(text, model, thinking);
    return;

  } catch (err) {
    thinking.remove();
    addMessage('assistant', `Error: ${err.message}`);
    processing = false;
    sendBtn.disabled = false;
  }
}

async function sendWithImages(text, model, images, thinking) {
  try {
    thinking.querySelector('.thinking-text').textContent = 'Analyzing image with tools...';

    // Build message content with images
    const content = [
      { type: 'text', text: text || 'What is in this image?' },
      ...images
    ];

    // Use vision agent endpoint (has web search, MCP tools, etc.)
    const res = await fetch(`${API}/api/agent/run-vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }]
      })
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

async function fetchNonStreaming(text, model, thinking) {
  try {
    // Check if MCP servers are connected
    const mcpCount = parseInt(mcpBadge.textContent) || 0;
    const endpoint = mcpCount > 0 ? '/api/agent/run-with-mcp' : '/api/agent/run';

    thinking.querySelector('.thinking-text').textContent = mcpCount > 0
      ? 'Processing with MCP tools...'
      : 'Processing...';

    const res = await fetch(`${API}${endpoint}`, {
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
function addMessage(role, content, tools = [], images = []) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = role === 'user' ? '👤' : '🤖';

  let toolsHtml = '';
  if (tools.length > 0) {
    toolsHtml = `
      <div class="tool-calls">
        ${tools.map(t => `
          <div class="tool-call">
            <span class="tool-call-icon">${getToolIcon(t.name)}</span>
            <span class="tool-call-name">${formatToolName(t.name)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  let imagesHtml = '';
  if (images.length > 0) {
    imagesHtml = `
      <div class="message-images">
        ${images.map(img => `<img src="${img.image_url.url}" alt="Attached image">`).join('')}
      </div>
    `;
  }

  div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-body">
      ${imagesHtml}
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

// Make functions available globally for onclick handlers
window.removeImage = removeImage;
window.disconnectMCP = disconnectMCP;
