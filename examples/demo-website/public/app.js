// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.section).classList.add('active');
  });
});

// Utility functions
function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showResult(elementId, content, meta = '') {
  const card = document.getElementById(elementId);
  card.style.display = 'block';
  card.querySelector('.result-content').innerHTML = content;
  const metaEl = card.querySelector('.result-meta');
  if (metaEl) metaEl.innerHTML = meta;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function apiCall(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return response.json();
}

// Chat functions
async function sendChat() {
  const message = document.getElementById('chat-message').value;
  const model = document.getElementById('chat-model').value;
  const stream = document.getElementById('chat-stream').checked;

  if (!message.trim()) return alert('Please enter a message');

  showLoading();
  const card = document.getElementById('chat-result');
  card.style.display = 'block';
  const contentEl = card.querySelector('.result-content');
  const metaEl = card.querySelector('.result-meta');

  if (stream) {
    contentEl.innerHTML = '';
    metaEl.innerHTML = '';
    hideLoading();

    const eventSource = new EventSource(
      `/api/chat/stream?message=${encodeURIComponent(message)}&model=${model}`
    );

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.content) {
          contentEl.innerHTML += escapeHtml(data.content);
        }
        if (data.error) {
          contentEl.innerHTML = `<span style="color: var(--danger)">Error: ${escapeHtml(data.error)}</span>`;
          eventSource.close();
        }
      } catch (e) {}
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  } else {
    try {
      const result = await apiCall('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, model }),
      });

      hideLoading();

      if (result.success) {
        contentEl.innerHTML = escapeHtml(result.content);
        metaEl.innerHTML = `Model: ${result.model} | Tokens: ${result.usage?.total_tokens || 'N/A'}`;
      } else {
        contentEl.innerHTML = `<span style="color: var(--danger)">Error: ${escapeHtml(result.error)}</span>`;
      }
    } catch (error) {
      hideLoading();
      contentEl.innerHTML = `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`;
    }
  }
}

// RAG functions
async function initRAG() {
  const strategy = document.getElementById('rag-strategy').value;
  const chunkSize = parseInt(document.getElementById('rag-chunk-size').value);

  showLoading();
  try {
    const result = await apiCall('/api/rag/init', {
      method: 'POST',
      body: JSON.stringify({ strategy, chunkSize }),
    });
    hideLoading();
    document.getElementById('rag-status').textContent = result.success ? 'Initialized!' : result.error;
  } catch (error) {
    hideLoading();
    document.getElementById('rag-status').textContent = error.message;
  }
}

async function addDocument() {
  const content = document.getElementById('rag-content').value;
  let metadata = {};

  try {
    const metaStr = document.getElementById('rag-metadata').value;
    if (metaStr) metadata = JSON.parse(metaStr);
  } catch (e) {
    return alert('Invalid metadata JSON');
  }

  if (!content.trim()) return alert('Please enter document content');

  showLoading();
  try {
    const result = await apiCall('/api/rag/add', {
      method: 'POST',
      body: JSON.stringify({ content, metadata }),
    });
    hideLoading();

    if (result.success) {
      document.getElementById('rag-status').textContent = `Added! Total chunks: ${result.totalChunks}`;
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    alert('Error: ' + error.message);
  }
}

async function addUrl() {
  const url = document.getElementById('rag-url').value;
  if (!url) return alert('Please enter a URL');

  showLoading();
  try {
    const result = await apiCall('/api/rag/add-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    hideLoading();

    if (result.success) {
      document.getElementById('rag-status').textContent = `Added URL! Total chunks: ${result.totalChunks}`;
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    alert('Error: ' + error.message);
  }
}

async function queryRAG() {
  const query = document.getElementById('rag-query').value;
  const topK = parseInt(document.getElementById('rag-topk').value);
  const minScore = parseFloat(document.getElementById('rag-min-score').value);

  if (!query.trim()) return alert('Please enter a query');

  showLoading();
  try {
    const result = await apiCall('/api/rag/query', {
      method: 'POST',
      body: JSON.stringify({ query, topK, minScore }),
    });
    hideLoading();

    if (result.success) {
      let html = '';
      if (result.results.length === 0) {
        html = '<p>No results found. Try adding documents first or lowering the minimum score.</p>';
      } else {
        result.results.forEach((r, i) => {
          html += `
            <div class="rag-result-item">
              <div class="rag-result-score">
                Score: ${r.score.toFixed(3)} | Relevance: ${r.relevance}
                ${r.metadata?.source ? ` | Source: ${escapeHtml(r.metadata.source)}` : ''}
              </div>
              <div class="rag-result-content">${escapeHtml(r.content)}</div>
            </div>
          `;
        });
      }
      showResult('rag-result', html);
    } else {
      showResult('rag-result', `<span style="color: var(--danger)">Error: ${escapeHtml(result.error)}</span>`);
    }
  } catch (error) {
    hideLoading();
    showResult('rag-result', `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`);
  }
}

async function chatWithRAG() {
  const message = document.getElementById('rag-query').value;
  const topK = parseInt(document.getElementById('rag-topk').value);

  if (!message.trim()) return alert('Please enter a query');

  showLoading();
  try {
    const result = await apiCall('/api/rag/chat', {
      method: 'POST',
      body: JSON.stringify({ message, topK }),
    });
    hideLoading();

    if (result.success) {
      let html = `<div style="margin-bottom: 1rem">${escapeHtml(result.content)}</div>`;
      if (result.sources?.length > 0) {
        html += '<hr style="border-color: var(--border); margin: 1rem 0"><strong>Sources:</strong>';
        result.sources.forEach((s, i) => {
          html += `
            <div class="rag-result-item" style="margin-top: 0.5rem">
              <div class="rag-result-score">Score: ${s.score.toFixed(3)}</div>
              <div class="rag-result-content">${escapeHtml(s.content.slice(0, 200))}...</div>
            </div>
          `;
        });
      }
      showResult('rag-result', html);
    } else {
      showResult('rag-result', `<span style="color: var(--danger)">Error: ${escapeHtml(result.error)}</span>`);
    }
  } catch (error) {
    hideLoading();
    showResult('rag-result', `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`);
  }
}

async function clearRAG() {
  if (!confirm('Are you sure you want to clear the knowledge base?')) return;

  showLoading();
  try {
    await apiCall('/api/rag/clear', { method: 'POST' });
    hideLoading();
    document.getElementById('rag-status').textContent = 'Knowledge base cleared';
  } catch (error) {
    hideLoading();
    alert('Error: ' + error.message);
  }
}

// Web functions
async function fetchUrl() {
  const url = document.getElementById('web-url').value;
  const includeLinks = document.getElementById('web-include-links').checked;
  const includeImages = document.getElementById('web-include-images').checked;

  if (!url) return alert('Please enter a URL');

  showLoading();
  try {
    const result = await apiCall('/api/web/fetch', {
      method: 'POST',
      body: JSON.stringify({ url, includeLinks, includeImages }),
    });
    hideLoading();

    if (result.success) {
      let html = `<strong>Title:</strong> ${escapeHtml(result.title || 'N/A')}\n\n`;
      html += `<strong>Content:</strong>\n${escapeHtml(result.markdown || result.content || 'No content')}\n`;

      if (result.links?.length > 0) {
        html += `\n<strong>Links (${result.links.length}):</strong>\n`;
        result.links.slice(0, 10).forEach(link => {
          html += `- ${escapeHtml(link.text || link.url)}: ${escapeHtml(link.url)}\n`;
        });
      }

      if (result.metadata) {
        html += `\n<strong>Metadata:</strong>\n${JSON.stringify(result.metadata, null, 2)}`;
      }

      showResult('web-result', html);
    } else {
      showResult('web-result', `<span style="color: var(--danger)">Error: ${escapeHtml(result.error)}</span>`);
    }
  } catch (error) {
    hideLoading();
    showResult('web-result', `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`);
  }
}

async function webSearch() {
  const query = document.getElementById('web-search-query').value;
  const maxResults = parseInt(document.getElementById('web-max-results').value);

  if (!query.trim()) return alert('Please enter a search query');

  showLoading();
  try {
    const result = await apiCall('/api/web/search', {
      method: 'POST',
      body: JSON.stringify({ query, maxResults }),
    });
    hideLoading();

    if (result.success) {
      let html = '';
      if (result.results.length === 0) {
        html = '<p>No results found.</p>';
      } else {
        result.results.forEach(r => {
          html += `
            <div class="search-result">
              <div class="search-result-title">${escapeHtml(r.title)}</div>
              <div class="search-result-url">${escapeHtml(r.url)}</div>
              <div class="search-result-snippet">${escapeHtml(r.snippet || '')}</div>
            </div>
          `;
        });
      }
      showResult('web-result', html);
    } else {
      showResult('web-result', `<span style="color: var(--danger)">Error: ${escapeHtml(result.error)}</span>`);
    }
  } catch (error) {
    hideLoading();
    showResult('web-result', `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`);
  }
}

async function chatWithSearch() {
  const message = document.getElementById('web-search-query').value;
  const maxResults = parseInt(document.getElementById('web-max-results').value);

  if (!message.trim()) return alert('Please enter a search query');

  showLoading();
  try {
    const result = await apiCall('/api/web/chat', {
      method: 'POST',
      body: JSON.stringify({ message, maxResults }),
    });
    hideLoading();

    if (result.success) {
      let html = `<div style="margin-bottom: 1rem">${escapeHtml(result.content)}</div>`;
      if (result.sources?.length > 0) {
        html += '<hr style="border-color: var(--border); margin: 1rem 0"><strong>Sources:</strong>';
        result.sources.forEach(s => {
          html += `
            <div class="search-result" style="margin-top: 0.5rem">
              <div class="search-result-title">${escapeHtml(s.title)}</div>
              <div class="search-result-url">${escapeHtml(s.url)}</div>
            </div>
          `;
        });
      }
      showResult('web-result', html);
    } else {
      showResult('web-result', `<span style="color: var(--danger)">Error: ${escapeHtml(result.error)}</span>`);
    }
  } catch (error) {
    hideLoading();
    showResult('web-result', `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`);
  }
}

async function chatAboutUrl() {
  const url = document.getElementById('url-chat-url').value;
  const message = document.getElementById('url-chat-message').value;

  if (!url) return alert('Please enter a URL');
  if (!message.trim()) return alert('Please enter a question');

  showLoading();
  try {
    const result = await apiCall('/api/url/chat', {
      method: 'POST',
      body: JSON.stringify({ url, message }),
    });
    hideLoading();

    if (result.success) {
      showResult('web-result', escapeHtml(result.content));
    } else {
      showResult('web-result', `<span style="color: var(--danger)">Error: ${escapeHtml(result.error)}</span>`);
    }
  } catch (error) {
    hideLoading();
    showResult('web-result', `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`);
  }
}

// Agent functions
async function runAgent() {
  const task = document.getElementById('agent-task').value;
  const stream = document.getElementById('agent-stream').checked;

  if (!task.trim()) return alert('Please enter a task');

  const card = document.getElementById('agent-result');
  const stepsEl = document.getElementById('agent-steps');
  const contentEl = card.querySelector('.result-content');
  const toolCallsEl = document.getElementById('tool-calls');

  card.style.display = 'block';
  stepsEl.innerHTML = '';
  contentEl.innerHTML = '';
  toolCallsEl.innerHTML = '';

  if (stream) {
    const eventSource = new EventSource(
      `/api/agent/stream?task=${encodeURIComponent(task)}`
    );

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        return;
      }

      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'content':
            contentEl.innerHTML += escapeHtml(data.data);
            break;
          case 'tool_call':
            stepsEl.innerHTML += `
              <div class="agent-step tool">
                Calling tool: <strong>${escapeHtml(data.data.name)}</strong>
                <br><small>${escapeHtml(JSON.stringify(data.data.args))}</small>
              </div>
            `;
            break;
          case 'tool_result':
            // Tool result handled silently
            break;
          case 'thinking':
            stepsEl.innerHTML += `
              <div class="agent-step thinking">
                ${escapeHtml(data.data)}
              </div>
            `;
            break;
          case 'error':
            contentEl.innerHTML = `<span style="color: var(--danger)">Error: ${escapeHtml(data.data)}</span>`;
            eventSource.close();
            break;
        }
      } catch (e) {}
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  } else {
    showLoading();
    try {
      const result = await apiCall('/api/agent/run', {
        method: 'POST',
        body: JSON.stringify({ task }),
      });
      hideLoading();

      if (result.success) {
        contentEl.innerHTML = escapeHtml(result.output);

        if (result.toolCalls?.length > 0) {
          toolCallsEl.innerHTML = '<strong>Tool Calls:</strong>';
          result.toolCalls.forEach(tc => {
            toolCallsEl.innerHTML += `
              <div class="tool-call">
                <span class="tool-call-name">${escapeHtml(tc.name)}</span>
                <br>Args: ${escapeHtml(JSON.stringify(tc.args))}
                <br>Result: ${escapeHtml(typeof tc.result === 'object' ? JSON.stringify(tc.result).slice(0, 200) : String(tc.result).slice(0, 200))}...
              </div>
            `;
          });
        }

        stepsEl.innerHTML = `<div class="agent-step thinking">Completed in ${result.iterations} iterations</div>`;
      } else {
        contentEl.innerHTML = `<span style="color: var(--danger)">Error: ${escapeHtml(result.error)}</span>`;
      }
    } catch (error) {
      hideLoading();
      contentEl.innerHTML = `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`;
    }
  }
}

// Tool functions
async function calculate() {
  const expression = document.getElementById('calc-expression').value;
  if (!expression.trim()) return alert('Please enter an expression');

  try {
    const result = await apiCall('/api/tools/calculator', {
      method: 'POST',
      body: JSON.stringify({ expression }),
    });

    const el = document.getElementById('calc-result');
    if (result.success && result.result !== undefined) {
      el.innerHTML = `${escapeHtml(expression)} = <strong>${result.result}</strong>`;
    } else {
      el.innerHTML = `<span style="color: var(--danger)">${escapeHtml(result.error || 'Invalid expression')}</span>`;
    }
  } catch (error) {
    document.getElementById('calc-result').innerHTML =
      `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`;
  }
}

async function getDateTime() {
  const timezone = document.getElementById('dt-timezone').value;

  try {
    const result = await apiCall('/api/tools/datetime', {
      method: 'POST',
      body: JSON.stringify({ timezone }),
    });

    const el = document.getElementById('dt-result');
    if (result.success) {
      el.innerHTML = `
        <strong>Time:</strong> ${escapeHtml(result.datetime)}<br>
        <strong>Timezone:</strong> ${escapeHtml(result.timezone)}<br>
        <strong>ISO:</strong> ${escapeHtml(result.timestamp)}<br>
        <strong>Unix:</strong> ${result.unix}
      `;
    } else {
      el.innerHTML = `<span style="color: var(--danger)">${escapeHtml(result.error)}</span>`;
    }
  } catch (error) {
    document.getElementById('dt-result').innerHTML =
      `<span style="color: var(--danger)">Error: ${escapeHtml(error.message)}</span>`;
  }
}

// Initialize RAG on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await apiCall('/api/rag/init', { method: 'POST', body: JSON.stringify({}) });
    console.log('RAG initialized');
  } catch (e) {
    console.log('RAG init skipped:', e.message);
  }
});
