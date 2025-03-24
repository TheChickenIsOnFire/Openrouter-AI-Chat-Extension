// content-part1.js
(function(global) {
    // Utility to escape HTML so that code or HTML content isn’t rendered.
    function escapeHTML(str) {
      return str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    }
    global.escapeHTML = escapeHTML;
  
    // Format message text.
    // If code blocks (```...```) exist, escape HTML and wrap them in a container with a copy button.
    function formatMessage(text) {
      const codeBlockRegex = /```([\s\S]+?)```/g;
      let formatted = escapeHTML(text);
      if (codeBlockRegex.test(formatted)) {
        formatted = formatted.replace(codeBlockRegex, (match, codeContent) => {
          return `<div class="code-container">
    <pre class="code-block">${codeContent.trim()}</pre>
    <button class="copy-btn">Copy</button>
  </div>`;
        });
      }
      return formatted;
    }
    global.formatMessage = formatMessage;
  
    // ----- Chat Sessions Management -----
    // currentChatSessions holds the in-memory active chat sessions.
    let currentChatSessions = {};
    let currentSessionId = null;
    global.currentChatSessions = currentChatSessions;
    global.currentSessionId = currentSessionId;
  
    // Reassign session numbers so they are consecutive.
    function reassignSessionNumbers() {
      const sessions = Object.values(currentChatSessions).sort((a, b) => a.number - b.number);
      sessions.forEach((session, index) => {
        session.number = index + 1;
        session.title = "Chat " + session.number;
      });
    }
    global.reassignSessionNumbers = reassignSessionNumbers;
  
    // Create a new chat session.
    function createNewChatSession() {
      const newNumber = Object.keys(currentChatSessions).length + 1;
      // Create a unique id using timestamp and a random component.
      const id = "session-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      currentChatSessions[id] = {
        id: id,
        number: newNumber,
        title: "Chat " + newNumber,
        messages: [],
        model: "qwen/qwq-32b" // default model
      };
      currentSessionId = id;
      global.currentSessionId = currentSessionId;
      updateTabsUI();
      renderChatBody();
      updateModelUI();
    }
    global.createNewChatSession = createNewChatSession;
  
    // Close (remove) a specified chat session and reassign numbering.
    function closeChatSession(id) {
      if (currentChatSessions[id]) {
        delete currentChatSessions[id];
        reassignSessionNumbers();
        // If the closed tab was active, set active to the first available.
        if (currentSessionId === id) {
          const ids = Object.keys(currentChatSessions);
          currentSessionId = ids.length ? ids[0] : null;
          global.currentSessionId = currentSessionId;
          if (!currentSessionId) {
            createNewChatSession();
            return;
          }
        }
        updateTabsUI();
        renderChatBody();
        updateModelUI();
        saveActiveSessionsToStorage();
      }
    }
    global.closeChatSession = closeChatSession;
  
    // Switch the active chat session.
    function switchChatSession(id) {
      currentSessionId = id;
      global.currentSessionId = id;
      renderChatBody();
      updateModelUI();
    }
    global.switchChatSession = switchChatSession;
  
    // Functions updateTabsUI, renderChatBody, updateModelUI rely on a global variable "chatContainer"
    // which will be defined in the UI file.
    function updateTabsUI() {
      if (!global.chatContainer) return;
      const tabBar = global.chatContainer.querySelector("#qwen-tab-bar");
      tabBar.innerHTML = "";
      // Sort sessions by their number.
      const sessions = Object.values(currentChatSessions).sort((a, b) => a.number - b.number);
      sessions.forEach(session => {
        const sessionId = session.id;
        const tab = document.createElement("div");
        tab.className = "qwen-tab";
        tab.dataset.sessionId = sessionId;
        tab.innerHTML = `<span class="tab-title">${session.title}</span> <span class="tab-close" title="Close Tab">×</span>`;
        if (sessionId === currentSessionId) {
          tab.classList.add("active");
        }
        tab.addEventListener("click", (e) => {
          if (!e.target.classList.contains("tab-close")) {
            switchChatSession(sessionId);
          }
        });
        tab.querySelector(".tab-close").addEventListener("click", (e) => {
          e.stopPropagation();
          closeChatSession(sessionId);
        });
        tabBar.appendChild(tab);
      });
    }
    global.updateTabsUI = updateTabsUI;
  
    // Render the current session's chat messages.
    function renderChatBody() {
      if (!global.chatContainer) return;
      const chatBody = global.chatContainer.querySelector("#qwen-chat-body");
      chatBody.innerHTML = "";
      if (!currentSessionId || !currentChatSessions[currentSessionId]) return;
      const messages = currentChatSessions[currentSessionId].messages;
      messages.forEach(msg => {
        const msgDiv = document.createElement("div");
        msgDiv.className = "qwen-message";
        msgDiv.innerHTML = `<strong>${msg.sender}:</strong> ${formatMessage(msg.content)}`;
        chatBody.appendChild(msgDiv);
      });
      chatBody.scrollTop = chatBody.scrollHeight;
      attachCopyButtons();
    }
    global.renderChatBody = renderChatBody;
  
    // Update model dropdown based on current session.
    function updateModelUI() {
      if (!global.chatContainer) return;
      if (!currentSessionId || !currentChatSessions[currentSessionId]) return;
      const modelSelect = global.chatContainer.querySelector("#qwen-model-select");
      modelSelect.value = currentChatSessions[currentSessionId].model;
    }
    global.updateModelUI = updateModelUI;
  
    // Update the current session's model.
    function updateCurrentSessionModel(newModel) {
      if (currentSessionId && currentChatSessions[currentSessionId]) {
        currentChatSessions[currentSessionId].model = newModel;
      }
    }
    global.updateCurrentSessionModel = updateCurrentSessionModel;
  
    // Append a message to the current session.
    function appendSessionMessage(sender, text) {
      if (!currentSessionId) {
        createNewChatSession();
      }
      currentChatSessions[currentSessionId].messages.push({ sender, content: text });
      renderChatBody();
    }
    global.appendSessionMessage = appendSessionMessage;
  
    // ----- Loader Functions -----
    let loaderIdCounter = 0;
    function appendLoaderMessage(text) {
      if (!global.chatContainer) return "";
      const chatBody = global.chatContainer.querySelector("#qwen-chat-body");
      loaderIdCounter++;
      const loaderId = "loader-" + loaderIdCounter;
      const msgDiv = document.createElement("div");
      msgDiv.id = loaderId;
      msgDiv.className = "qwen-message";
      msgDiv.innerHTML = `<strong>${escapeHTML(text)}</strong> <span class="loader"><span></span><span></span><span></span></span>`;
      chatBody.appendChild(msgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
      return loaderId;
    }
    global.appendLoaderMessage = appendLoaderMessage;
  
    function removeLoaderMessage(loaderId) {
      if (!global.chatContainer) return;
      const loaderElem = global.chatContainer.querySelector("#" + loaderId);
      if (loaderElem) { loaderElem.remove(); }
    }
    global.removeLoaderMessage = removeLoaderMessage;
  
    // ----- Sessions Persistence -----
    function saveActiveSessionsToStorage() {
      localStorage.setItem("qwenActiveSessions", JSON.stringify(currentChatSessions));
    }
    global.saveActiveSessionsToStorage = saveActiveSessionsToStorage;
  
    function loadActiveSessionsFromStorage() {
      const stored = localStorage.getItem("qwenActiveSessions");
      if (stored) {
        currentChatSessions = JSON.parse(stored);
        const ids = Object.keys(currentChatSessions);
        if (ids.length) {
          currentSessionId = ids[0];
          global.currentSessionId = currentSessionId;
        }
        updateTabsUI();
        renderChatBody();
        updateModelUI();
      }
    }
    global.loadActiveSessionsFromStorage = loadActiveSessionsFromStorage;
  
    // Expose functions for use by the UI
  })(window);