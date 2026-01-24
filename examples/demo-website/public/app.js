// ===== Utilities =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading(text = 'Processing...') {
  $('#loading-text').textContent = text;
  $('#loading').classList.add('active');
}

function hideLoading() {
  $('#loading').classList.remove('active');
}

function toast(message, type = 'info') {
  const container = $('#toasts');
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function getModel() {
  return $('#global-model').value;
}

async function api(endpoint, options = {}) {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

// ===== Navigation =====
$$('.sidebar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.sidebar-btn').forEach(b => b.classList.remove('active'));
    $$('.feature').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    $(`#${btn.dataset.feature}`).classList.add('active');
  });
});

// ===== Tabs =====
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const parent = tab.closest('.panel');
    parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    parent.querySelector(`#${tab.dataset.tab}`).classList.add('active');
  });
});

// ===== Chat =====
async function sendChatMessage() {
  const input = $('#chat-input');
  const message = input.value.trim();
  if (!message) return;

  const messagesEl = $('#chat-messages');
  const stream = $('#chat-stream').checked;

  // Add user message
  messagesEl.innerHTML += `
    <div class="message user">
      <div class="message-content">${escapeHtml(message)}</div>
    </div>
  `;
  input.value = '';
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Add assistant placeholder
  const assistantMsg = document.createElement('div');
  assistantMsg.className = 'message assistant';
  assistantMsg.innerHTML = '<div class="message-content"></div>';
  messagesEl.appendChild(assistantMsg);
  const contentEl = assistantMsg.querySelector('.message-content');

  if (stream) {
    const eventSource = new EventSource(
      `/api/chat/stream?message=${encodeURIComponent(message)}&model=${getModel()}`
    );
    eventSource.onmessage = (e) => {
      if (e.data === '[DONE]') {
        eventSource.close();
        return;
      }
      try {
        const data = JSON.parse(e.data);
        if (data.content) contentEl.innerHTML += escapeHtml(data.content);
        if (data.error) contentEl.innerHTML = `<span style="color:var(--danger)">${escapeHtml(data.error)}</span>`;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      } catch {}
    };
    eventSource.onerror = () => eventSource.close();
  } else {
    showLoading('Generating response...');
    const result = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, model: getModel() }),
    });
    hideLoading();
    contentEl.innerHTML = result.success
      ? escapeHtml(result.content)
      : `<span style="color:var(--danger)">${escapeHtml(result.error)}</span>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

$('#chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// ===== RAG =====
async function updateDocCount() {
  try {
    const result = await api('/api/rag/count');
    $('#doc-count').textContent = result.count || 0;
    const dot = $('#rag-status-indicator .status-dot');
    dot.className = `status-dot ${result.count > 0 ? 'green' : 'yellow'}`;
  } catch {}
}

async function initRAGSettings() {
  showLoading('Initializing RAG...');
  const result = await api('/api/rag/init', {
    method: 'POST',
    body: JSON.stringify({
      strategy: $('#rag-strategy').value,
      chunkSize: parseInt($('#rag-chunk-size').value),
    }),
  });
  hideLoading();
  toast(result.success ? 'RAG initialized!' : result.error, result.success ? 'success' : 'error');
  updateDocCount();
}

async function addRAGDocument() {
  const content = $('#rag-doc-content').value.trim();
  if (!content) return toast('Please enter document content', 'error');

  const source = $('#rag-doc-source').value.trim();
  showLoading('Adding document...');
  const result = await api('/api/rag/add', {
    method: 'POST',
    body: JSON.stringify({ content, metadata: source ? { source } : {} }),
  });
  hideLoading();
  if (result.success) {
    toast(`Document added! Total chunks: ${result.totalChunks}`, 'success');
    $('#rag-doc-content').value = '';
    $('#rag-doc-source').value = '';
    updateDocCount();
  } else {
    toast(result.error, 'error');
  }
}

async function addRAGUrl() {
  const url = $('#rag-url').value.trim();
  if (!url) return toast('Please enter a URL', 'error');

  showLoading('Fetching and indexing URL...');
  const result = await api('/api/rag/add-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  hideLoading();
  if (result.success) {
    toast(`URL indexed! Total chunks: ${result.totalChunks}`, 'success');
    $('#rag-url').value = '';
    updateDocCount();
  } else {
    toast(result.error, 'error');
  }
}

async function searchRAG() {
  const query = $('#rag-query').value.trim();
  if (!query) return toast('Please enter a query', 'error');

  showLoading('Searching...');
  const result = await api('/api/rag/query', {
    method: 'POST',
    body: JSON.stringify({ query, topK: 5 }),
  });
  hideLoading();

  const resultsEl = $('#rag-results');
  if (result.success && result.results.length > 0) {
    resultsEl.innerHTML = result.results.map(r => `
      <div class="result-item">
        <div class="meta">Score: ${r.score.toFixed(3)} | ${r.relevance}</div>
        <div class="content">${escapeHtml(r.content)}</div>
      </div>
    `).join('');
  } else {
    resultsEl.innerHTML = '<div class="result-item">No results found. Try adding documents first.</div>';
  }
}

async function chatRAG() {
  const query = $('#rag-query').value.trim();
  if (!query) return toast('Please enter a query', 'error');

  showLoading('Generating response with context...');
  const result = await api('/api/rag/chat', {
    method: 'POST',
    body: JSON.stringify({ message: query, model: getModel() }),
  });
  hideLoading();

  const resultsEl = $('#rag-results');
  if (result.success) {
    let html = `<div class="result-item"><div class="content">${escapeHtml(result.content)}</div></div>`;
    if (result.sources?.length > 0) {
      html += '<div style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">Sources:</div>';
      html += result.sources.slice(0, 3).map(s => `
        <div class="result-item" style="border-left-color:var(--secondary)">
          <div class="meta">Score: ${s.score.toFixed(3)}</div>
          <div class="content">${escapeHtml(s.content.slice(0, 200))}...</div>
        </div>
      `).join('');
    }
    resultsEl.innerHTML = html;
  } else {
    resultsEl.innerHTML = `<div class="result-item" style="border-left-color:var(--danger)">${escapeHtml(result.error)}</div>`;
  }
}

async function clearRAG() {
  if (!confirm('Clear all documents from knowledge base?')) return;
  showLoading('Clearing...');
  await api('/api/rag/clear', { method: 'POST' });
  hideLoading();
  toast('Knowledge base cleared', 'success');
  updateDocCount();
  $('#rag-results').innerHTML = '';
}

// ===== Web =====
async function webSearch() {
  const query = $('#web-query').value.trim();
  if (!query) return toast('Please enter a search query', 'error');

  showLoading('Searching the web...');
  const result = await api('/api/web/search', {
    method: 'POST',
    body: JSON.stringify({ query, maxResults: 5 }),
  });
  hideLoading();

  const resultsEl = $('#web-search-results');
  if (result.success && result.results.length > 0) {
    resultsEl.innerHTML = result.results.map(r => `
      <div class="result-item">
        <div class="title">${escapeHtml(r.title)}</div>
        <div class="meta">${escapeHtml(r.url)}</div>
        <div class="content">${escapeHtml(r.snippet || '')}</div>
      </div>
    `).join('');
  } else {
    resultsEl.innerHTML = '<div class="result-item">No results found.</div>';
  }
}

async function webSearchChat() {
  const query = $('#web-query').value.trim();
  if (!query) return toast('Please enter a search query', 'error');

  showLoading('Searching and generating response...');
  const result = await api('/api/web/chat', {
    method: 'POST',
    body: JSON.stringify({ message: query, model: getModel() }),
  });
  hideLoading();

  const resultsEl = $('#web-search-results');
  if (result.success) {
    let html = `<div class="result-item"><div class="content">${escapeHtml(result.content)}</div></div>`;
    if (result.sources?.length > 0) {
      html += '<div style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">Sources:</div>';
      html += result.sources.map(s => `
        <div class="result-item" style="border-left-color:var(--secondary)">
          <div class="title">${escapeHtml(s.title)}</div>
          <div class="meta">${escapeHtml(s.url)}</div>
        </div>
      `).join('');
    }
    resultsEl.innerHTML = html;
  } else {
    resultsEl.innerHTML = `<div class="result-item" style="border-left-color:var(--danger)">${escapeHtml(result.error)}</div>`;
  }
}

async function fetchUrl() {
  const url = $('#web-url').value.trim();
  if (!url) return toast('Please enter a URL', 'error');

  showLoading('Fetching URL...');
  const result = await api('/api/web/fetch', {
    method: 'POST',
    body: JSON.stringify({
      url,
      includeLinks: $('#web-links').checked,
      includeImages: $('#web-images').checked,
    }),
  });
  hideLoading();

  const resultsEl = $('#web-fetch-results');
  if (result.success) {
    let html = `
      <div class="result-item">
        <div class="title">${escapeHtml(result.title || 'No title')}</div>
        <div class="content">${escapeHtml((result.markdown || result.content || '').slice(0, 1000))}...</div>
      </div>
    `;
    if (result.links?.length > 0) {
      html += `<div class="result-item" style="border-left-color:var(--secondary)">
        <div class="title">Links (${result.links.length})</div>
        <div class="content">${result.links.slice(0, 5).map(l => escapeHtml(l.text || l.href)).join('<br>')}</div>
      </div>`;
    }
    resultsEl.innerHTML = html;
  } else {
    resultsEl.innerHTML = `<div class="result-item" style="border-left-color:var(--danger)">${escapeHtml(result.error)}</div>`;
  }
}

async function chatAboutUrl() {
  const url = $('#url-chat-url').value.trim();
  const question = $('#url-chat-question').value.trim();
  if (!url || !question) return toast('Please enter URL and question', 'error');

  showLoading('Analyzing URL...');
  const result = await api('/api/url/chat', {
    method: 'POST',
    body: JSON.stringify({ url, message: question, model: getModel() }),
  });
  hideLoading();

  const resultsEl = $('#url-chat-results');
  resultsEl.innerHTML = result.success
    ? `<div class="result-item"><div class="content">${escapeHtml(result.content)}</div></div>`
    : `<div class="result-item" style="border-left-color:var(--danger)">${escapeHtml(result.error)}</div>`;
}

// ===== Agent =====
async function runAgent() {
  const task = $('#agent-task').value.trim();
  if (!task) return toast('Please enter a task', 'error');

  const stream = $('#agent-stream').checked;
  const thinkingEl = $('#agent-thinking');
  const responseEl = $('#agent-response');
  const toolsEl = $('#agent-tools');

  thinkingEl.innerHTML = '';
  responseEl.innerHTML = '';
  toolsEl.innerHTML = '';

  if (stream) {
    const eventSource = new EventSource(
      `/api/agent/stream?task=${encodeURIComponent(task)}&model=${getModel()}`
    );

    eventSource.onmessage = (e) => {
      if (e.data === '[DONE]') {
        eventSource.close();
        return;
      }
      try {
        const data = JSON.parse(e.data);
        switch (data.type) {
          case 'content':
            responseEl.innerHTML += escapeHtml(data.data);
            break;
          case 'tool_call':
            thinkingEl.innerHTML += `
              <div class="agent-step">
                🔧 Calling <strong>${escapeHtml(data.data.name)}</strong>
              </div>
            `;
            break;
          case 'tool_result':
            // Silently handled
            break;
          case 'error':
            responseEl.innerHTML = `<span style="color:var(--danger)">${escapeHtml(data.data)}</span>`;
            eventSource.close();
            break;
        }
      } catch {}
    };
    eventSource.onerror = () => eventSource.close();
  } else {
    showLoading('Agent is working...');
    const result = await api('/api/agent/run', {
      method: 'POST',
      body: JSON.stringify({ task, model: getModel() }),
    });
    hideLoading();

    if (result.success) {
      responseEl.innerHTML = escapeHtml(result.output);
      if (result.toolCalls?.length > 0) {
        toolsEl.innerHTML = '<div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Tools Used:</div>' +
          result.toolCalls.map(tc => `
            <div class="agent-step">
              🔧 <strong>${escapeHtml(tc.name)}</strong>
            </div>
          `).join('');
      }
      thinkingEl.innerHTML = `<div class="agent-step">✅ Completed in ${result.iterations} iterations</div>`;
    } else {
      responseEl.innerHTML = `<span style="color:var(--danger)">${escapeHtml(result.error)}</span>`;
    }
  }
}

// ===== Tools =====
async function runCalculator() {
  const expr = $('#calc-expr').value.trim();
  if (!expr) return;
  const result = await api('/api/tools/calculator', {
    method: 'POST',
    body: JSON.stringify({ expression: expr }),
  });
  $('#calc-result').innerHTML = result.result !== undefined
    ? `<strong>${expr}</strong> = <span style="color:var(--success)">${result.result}</span>`
    : `<span style="color:var(--danger)">${result.error || 'Invalid'}</span>`;
}

async function runDateTime() {
  const tz = $('#dt-tz').value;
  const result = await api('/api/tools/datetime', {
    method: 'POST',
    body: JSON.stringify({ timezone: tz }),
  });
  $('#dt-result').innerHTML = result.datetime
    ? `<strong>${result.datetime}</strong><br><span style="color:var(--text-muted)">${result.timezone}</span>`
    : `<span style="color:var(--danger)">${result.error}</span>`;
}

async function runWebSearchTool() {
  const query = $('#tool-search').value.trim();
  if (!query) return;
  showLoading('Searching...');
  const result = await api('/api/web/search', {
    method: 'POST',
    body: JSON.stringify({ query, maxResults: 3 }),
  });
  hideLoading();
  $('#search-result').innerHTML = result.success
    ? result.results.map(r => `<div style="margin-bottom:0.5rem"><strong>${escapeHtml(r.title)}</strong></div>`).join('')
    : `<span style="color:var(--danger)">${result.error}</span>`;
}

async function runFetchTool() {
  const url = $('#tool-url').value.trim();
  if (!url) return;
  showLoading('Fetching...');
  const result = await api('/api/web/fetch', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  hideLoading();
  $('#fetch-result').innerHTML = result.success
    ? `<strong>${escapeHtml(result.title || 'No title')}</strong><br><span style="color:var(--text-muted)">${escapeHtml((result.content || '').slice(0, 200))}...</span>`
    : `<span style="color:var(--danger)">${result.error}</span>`;
}

// ===== Init =====
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await api('/api/rag/init', { method: 'POST', body: JSON.stringify({}) });
    updateDocCount();
  } catch {}
});
