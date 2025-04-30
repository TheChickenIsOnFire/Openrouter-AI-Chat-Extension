// OpenRouter Extension Content Script
class OpenRouterUI {
  constructor() {
    this.init();
  }

  async init() {
    this.createButton();
    this.createPanel();
    this.setupMessageListener();
    this.applyStyles();
    this.setupAccessibility();
  }

  createButton() {
    this.button = document.createElement('button');
    this.button.id = 'openrouter-toggle';
    this.button.innerHTML = '🤖';
    this.button.setAttribute('aria-label', 'Open OpenRouter Panel');
    this.button.setAttribute('aria-expanded', 'false');
    
    document.body.appendChild(this.button);
    
    // Drag functionality
    let isDragging = false, startX, startY;
    
    this.button.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - this.button.offsetLeft;
      startY = e.clientY - this.button.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.button.style.left = `${e.clientX - startX}px`;
        this.button.style.top = `${e.clientY - startY}px`;
      }
    });
    
    document.addEventListener('mouseup', () => isDragging = false);
    
    this.button.addEventListener('click', () => this.togglePanel());
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'openrouter-panel';
    
    this.panel.innerHTML = `
      <div class="header">
        <h3>OpenRouter Chat</h3>
        <button class="close-btn" aria-label="Close panel">×</button>
        <button class="theme-toggle" aria-label="Toggle dark/light mode">🌓</button>
      </div>
      
      <div class="search-container">
        <input type="text" id="model-search" placeholder="Search models..." 
               aria-label="Search AI models">
        <div class="search-results"></div>
      </div>
      
      <div class="chat-container" role="log" aria-live="polite">
        <div class="chat-message typing-indicator">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
      
      <div class="footer">
        <textarea id="chat-input" placeholder="Type your message..." 
                 aria-label="Chat input"></textarea>
        <button id="send-btn" aria-label="Send message">➤</button>
      </div>
    `;
    
    document.body.appendChild(this.panel);
    
    // Panel event listeners
    this.panel.querySelector('.close-btn').addEventListener('click', () => this.collapsePanel());
    this.panel.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());
    this.panel.querySelector('#model-search').addEventListener('input', (e) => this.handleSearch(e));
    this.panel.querySelector('#chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    this.panel.querySelector('#send-btn').addEventListener('click', () => this.sendMessage());
  }

  togglePanel() {
    const isExpanded = this.button.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      this.collapsePanel();
    } else {
      this.expandPanel();
    }
  }

  expandPanel() {
    this.panel.style.display = 'block';
    requestAnimationFrame(() => {
      this.panel.classList.add('expanded');
      this.button.setAttribute('aria-expanded', 'true');
      this.loadModels();
    });
  }

  collapsePanel() {
    this.panel.classList.remove('expanded');
    this.button.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      this.panel.style.display = 'none';
    }, 300);
  }

  applyStyles() {
    const styles = `
      /* Circular Button Styles */
      #openrouter-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #4A90E2;
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 99999;
        transition: background 0.3s ease;
      }
      
      #openrouter-toggle:hover {
        background: #357ABD;
      }
      
      /* Panel Styles */
      #openrouter-panel {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 360px;
        max-height: 0;
        overflow: hidden;
        background: var(--panel-bg, #f5f5f5);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        transition: max-height 0.3s ease-out;
        z-index: 99999;
      }
      
      #openrouter-panel.expanded {
        max-height: 80vh;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color, #ddd);
        background: var(--header-bg, #ffffff);
      }
      
      .header h3 {
        margin: 0;
        font-size: 16px;
        color: var(--text-color, #333);
      }
      
      .close-btn, .theme-toggle {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--text-color, #333);
        padding: 4px 8px;
      }
      
      /* Search Styles */
      .search-container {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color, #ddd);
      }
      
      #model-search {
        width: 100%;
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid var(--border-color, #ddd);
        font-size: 14px;
        color: var(--text-color, #333);
        background: var(--input-bg, #fff);
      }
      
      .search-results {
        margin-top: 8px;
        max-height: 150px;
        overflow-y: auto;
      }
      
      .search-result-item {
        padding: 6px 8px;
        cursor: pointer;
        border-radius: 4px;
      }
      
      .search-result-item:hover {
        background: var(--hover-bg, #e0e0e0);
      }
      
      /* Chat Styles */
      .chat-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .chat-message {
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 85%;
        background: var(--chat-bg, #ffffff);
        color: var(--text-color, #333);
        position: relative;
        word-wrap: break-word;
      }
      
      .user-message {
        align-self: flex-end;
        background: var(--user-bg, #DCF8C6);
      }
      
      /* Typing Indicator */
      .typing-indicator {
        display: flex;
        gap: 4px;
        justify-content: center;
        align-items: center;
        background: transparent !important;
      }
      
      .dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        background: var(--text-color, #333);
        border-radius: 50%;
        animation: typingDots 1.4s infinite ease-in-out both;
      }
      
      .dot:nth-child(1) { animation-delay: -0.32s; }
      .dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typingDots {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1.0); }
      }
      
      /* Footer */
      .footer {
        display: flex;
        padding: 12px 16px;
        border-top: 1px solid var(--border-color, #ddd);
        background: var(--footer-bg, #ffffff);
      }
      
      #chat-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--border-color, #ddd);
        border-radius: 4px;
        font-size: 14px;
        resize: none;
        height: 36px;
        color: var(--text-color, #333);
        background: var(--input-bg, #fff);
      }
      
      #send-btn {
        margin-left: 8px;
        padding: 0 16px;
        background: #4A90E2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      #send-btn:hover {
        background: #357ABD;
      }
      
      /* Dark Mode */
      body.dark-mode {
        --panel-bg: #1e1e1e;
        --header-bg: #2d2d2d;
        --footer-bg: #2d2d2d;
        --input-bg: #2d2d2d;
        --hover-bg: #3d3d3d;
        --chat-bg: #2d2d2d;
        --user-bg: #007acc;
        --text-color: #ffffff;
        --border-color: #444;
      }
      
      /* Responsive Design */
      @media (max-width: 480px) {
        #openrouter-panel {
          width: 90vw;
          right: 5vw;
          bottom: 110px;
        }
        
        .header h3 {
          font-size: 14px;
        }
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  setupAccessibility() {
    // Ensure all interactive elements have proper ARIA attributes
    this.panel.querySelectorAll('button, input, textarea').forEach(el => {
      if (!el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', el.placeholder || el.textContent.trim());
      }
    });
    
    // Set initial focusability
    this.panel.querySelectorAll('button, input, textarea').forEach(el => {
      el.setAttribute('tabindex', '0');
    });
    
    // Keyboard navigation
    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.collapsePanel();
      }
    });
  }

  async loadModels() {
    if (this.models) return; // Already loaded
    
    // Request models from background service worker
    const response = await this.sendMessageToBackground({ type: 'GET_MODELS' });
    this.models = response.models || [];
    
    // Render initial model list
    this.renderModelList(this.models);
  }

  renderModelList(models) {
    const container = this.panel.querySelector('.search-results');
    container.innerHTML = '';
    
    if (!models.length) {
      container.innerHTML = '<div class="no-results">No models found</div>';
      return;
    }
    
    models.forEach(model => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.textContent = model.name;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      
      item.addEventListener('click', () => {
        this.selectModel(model);
      });
      
      container.appendChild(item);
    });
  }

  handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (!searchTerm) {
      this.renderModelList(this.models);
      return;
    }
    
    const filtered = this.models.filter(model => 
      model.name.toLowerCase().includes(searchTerm) || 
      model.description.toLowerCase().includes(searchTerm)
    );
    
    this.renderModelList(filtered);
  }

  selectModel(model) {
    // Handle model selection
    this.panel.querySelector('#model-search').value = model.name;
    this.panel.querySelector('.search-results').innerHTML = '';
    this.sendMessageToBackground({ type: 'SELECT_MODEL', model });
  }

  async sendMessage() {
    const input = this.panel.querySelector('#chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    // Add user message to chat
    this.addMessage(text, 'user');
    input.value = '';
    
    // Show typing indicator
    const typingIndicator = this.panel.querySelector('.typing-indicator');
    typingIndicator.style.display = 'flex';
    
    // Send message to background worker
    const response = await this.sendMessageToBackground({ 
      type: 'CHAT_MESSAGE', 
      content: text 
    });
    
    // Hide typing indicator
    typingIndicator.style.display = 'none';
    
    // Add assistant response
    if (response.content) {
      this.addMessage(response.content, 'assistant');
    }
  }

  addMessage(text, role) {
    const chatContainer = this.panel.querySelector('.chat-container');
    
    const message = document.createElement('div');
    message.className = 'chat-message';
    if (role === 'user') message.classList.add('user-message');
    
    message.textContent = text;
    
    // Add to chat container
    chatContainer.appendChild(message);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    this.sendMessageToBackground({ type: 'SET_THEME', darkMode: isDark });
    
    // Save preference
    localStorage.setItem('openrouter-dark-mode', isDark ? 'true' : 'false');
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'MODEL_RESPONSE') {
        this.renderModelList(request.models);
      } else if (request.type === 'THEME_UPDATE') {
        if (request.darkMode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      }
    });
  }

  sendMessageToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }
}

// Initialize the UI
new OpenRouterUI();