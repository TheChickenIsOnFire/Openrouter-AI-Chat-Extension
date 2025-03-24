// content-part2.js
(function(global) {
    // ********** UI Setup and Event Wiring **********
  
    // Create the UI using Shadow DOM
    const containerElem = document.createElement("div");
    containerElem.id = "qwen-extension-container";
    Object.assign(containerElem.style, {
      all: "initial",
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "9999999"
    });
    const shadow = containerElem.attachShadow({ mode: "open" });
    document.documentElement.appendChild(containerElem);
  
    // Create a wrapper to hold our UI
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      pointerEvents: "auto",
      position: "relative"
    });
    shadow.appendChild(wrapper);
  
    // Insert CSS for professional dark theme.
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      /* Global reset */
      * { box-sizing: border-box; }
      /* Floating Button */
      #qwen-floating-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: #1a1a1a;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 0 12px 2px rgba(88,166,255,0.7);
        transition: transform 0.2s, box-shadow 0.2s, opacity 0.3s;
        z-index: 10000;
        font-weight: bold;
      }
      #qwen-floating-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 0 18px 3px rgba(88,166,255,1);
      }
      /* Chat Container */
      #qwen-chat-container {
        position: fixed;
        width: 400px;
        height: 600px;
        background: #212121;
        border: 1px solid #444;
        border-radius: 8px;
        box-shadow: 0 0 20px 3px rgba(88,166,255,0.6);
        display: none;
        flex-direction: column;
        color: #eee;
        overflow: hidden;
      }
      /* Chat Header */
      #qwen-chat-header {
        background: #2b2b2b;
        padding: 8px 12px;
        cursor: move;
        border-bottom: 1px solid #444;
        display: flex;
        flex-direction: column;
      }
      /* Header Row 1 */
      #qwen-header-row1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #qwen-tab-bar {
        display: flex;
        gap: 6px;
        overflow-x: auto;
      }
      .qwen-tab {
        padding: 4px 8px;
        background: #444;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        font-size: 13px;
      }
      .qwen-tab.active { background: #58a6ff; }
      .tab-close {
        margin-left: 4px;
        color: #ccc;
        cursor: pointer;
      }
      /* Header Row 2: Options Panel */
      #qwen-options-panel {
        display: none;
        margin-top: 6px;
        border-top: 1px solid #555;
        padding-top: 6px;
      }
      .option-group {
        margin-bottom: 6px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .option-group button {
        background: #58a6ff;
        border: none;
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
      }
      .option-group button:hover {
        background: #4592e6;
      }
      /* Options Toggle Button (Settings Symbol) */
      #qwen-options-toggle {
        background: transparent;
        border: none;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
      }
      /* Model Selection */
      #qwen-model-container {
        background: #2a2a2a;
        padding: 6px 12px;
        border-bottom: 1px solid #444;
      }
      #qwen-model-select {
        width: 100%;
        padding: 6px;
        font-size: 14px;
        background: #2a2a2a;
        color: #fff;
        border: 1px solid #555;
        border-radius: 4px;
      }
      /* Chat Body */
      #qwen-chat-body { 
        flex: 1; 
        padding: 10px; 
        overflow-y: auto;
        background: #272727;
      }
      .qwen-message { margin-bottom: 10px; word-wrap: break-word; }
      /* Chat Footer */
      #qwen-chat-footer {
        background: #2a2a2a;
        padding: 10px;
        border-top: 1px solid #444;
      }
      #qwen-input {
        width: calc(100% - 20px);
        padding: 6px;
        background: #1e1e1e;
        color: #eee;
        border: 1px solid #555;
        border-radius: 4px;
      }
      #qwen-input:focus {
        outline: none;
        border-color: #58a6ff;
        box-shadow: 0 0 6px #58a6ff;
      }
      #qwen-send-btn {
        background: #58a6ff;
        border: none;
        color: #fff;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      #qwen-send-btn:hover { background: #4592e6; }
      /* Code Container & Copy Button */
      .code-container { position: relative; margin-top: 4px; }
      .code-block {
        background: #333;
        color: #eee;
        padding: 8px;
        border-radius: 4px;
        font-family: monospace;
        overflow: auto;
        white-space: pre-wrap;
      }
      .copy-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #58a6ff;
        border: none;
        color: #fff;
        padding: 2px 6px;
        font-size: 12px;
        border-radius: 3px;
        cursor: pointer;
        opacity: 0.7;
      }
      .code-container:hover .copy-btn { opacity: 1; }
    `;
    wrapper.appendChild(styleEl);
  
    // ********** Global Variables & API Setup **********
    // Expose chatContainer globally for functions in part1.js to use.
    const chatContainer = document.createElement("div");
    chatContainer.id = "qwen-chat-container";
    wrapper.appendChild(chatContainer);
    global.chatContainer = chatContainer;
  
    // Build chat container innerHTML.
    chatContainer.innerHTML = `
      <div id="qwen-chat-header">
        <div id="qwen-header-row1">
          <div id="qwen-tab-bar"></div>
          <button id="qwen-options-toggle" title="Settings">⚙️</button>
        </div>
        <div id="qwen-options-panel">
          <div class="option-group">
            <button id="qwen-newchat-btn" title="New Chat">New</button>
            <button id="qwen-load-btn" title="Load Saved Chat">Load</button>
            <button id="qwen-save-btn" title="Save Current Chat">Save</button>
            <button id="qwen-download-btn" title="Download Chat Log">Download</button>
            <button id="qwen-close-btn" title="Close This Chat">Close</button>
            <button id="qwen-hide-btn" title="Hide UI">Hide</button>
          </div>
        </div>
      </div>
      <div id="qwen-model-container">
        <select id="qwen-model-select"></select>
      </div>
      <div id="qwen-chat-body"></div>
      <div id="qwen-chat-footer">
        <textarea id="qwen-input" rows="2" placeholder="Type your message..."></textarea>
        <div style="margin-top:6px;">
          <label style="font-size:12px; color:#eee;">
            <input type="checkbox" id="qwen-web-search" /> Enable Web Search
          </label>
          <button id="qwen-send-btn" style="float:right;">Send</button>
        </div>
      </div>
    `;
  
    // Create floating button.
    const floatingButton = document.createElement("div");
    floatingButton.id = "qwen-floating-btn";
    floatingButton.innerText = "AI";
    wrapper.appendChild(floatingButton);
  
    // ********** UI Interaction Setup **********
  
    // Function to make element draggable.
    function makeDraggable(element, handle = element) {
      let offsetX, offsetY;
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        document.addEventListener("mousemove", mouseMoveHandler, true);
        document.addEventListener("mouseup", mouseUpHandler, true);
      });
      function mouseMoveHandler(e) {
        element.style.left = (e.clientX - offsetX) + "px";
        element.style.top = (e.clientY - offsetY) + "px";
      }
      function mouseUpHandler() {
        document.removeEventListener("mousemove", mouseMoveHandler, true);
        document.removeEventListener("mouseup", mouseUpHandler, true);
      }
    }
    makeDraggable(floatingButton);
    makeDraggable(chatContainer, chatContainer.querySelector("#qwen-chat-header"));
  
    // Function to make element resizable.
    function makeResizable(element) {
      const handle = document.createElement("div");
      handle.style.width = "16px";
      handle.style.height = "16px";
      handle.style.position = "absolute";
      handle.style.right = "0";
      handle.style.bottom = "0";
      handle.style.cursor = "nwse-resize";
      handle.style.background = "rgba(255,255,255,0.5)";
      element.appendChild(handle);
      handle.addEventListener("mousedown", initResize, false);
      function initResize(e) {
        e.preventDefault();
        window.addEventListener("mousemove", Resize, false);
        window.addEventListener("mouseup", stopResize, false);
      }
      function Resize(e) {
        const rect = element.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const newHeight = e.clientY - rect.top;
        if (newWidth > 300) { element.style.width = newWidth + "px"; }
        if (newHeight > 400) { element.style.height = newHeight + "px"; }
      }
      function stopResize() {
        window.removeEventListener("mousemove", Resize, false);
        window.removeEventListener("mouseup", stopResize, false);
      }
    }
    makeResizable(chatContainer);
  
    // Options Toggle.
    chatContainer.querySelector("#qwen-options-toggle").addEventListener("click", () => {
      const panel = chatContainer.querySelector("#qwen-options-panel");
      panel.style.display = (!panel.style.display || panel.style.display === "none") ? "block" : "none";
    });
  
    // Hide UI: when Hide button clicked, hide chat container and make floating button transparent.
    chatContainer.querySelector("#qwen-hide-btn").addEventListener("click", () => {
      chatContainer.style.display = "none";
      floatingButton.style.opacity = "0";
    });
  
    // Floating button click: if invisible, restore; else toggle chat container.
    floatingButton.addEventListener("click", () => {
      if (floatingButton.style.opacity === "0") {
        floatingButton.style.opacity = "1";
        chatContainer.style.display = "flex";
      } else {
        const btnRect = floatingButton.getBoundingClientRect();
        chatContainer.style.top = (btnRect.bottom + 10) + "px";
        chatContainer.style.left = (btnRect.left) + "px";
        chatContainer.style.display = (chatContainer.style.display === "none") ? "flex" : "none";
      }
    });
  
    // Wiring UI buttons with functions from part1.js.
    chatContainer.querySelector("#qwen-newchat-btn").addEventListener("click", () => {
      global.createNewChatSession();
      global.saveActiveSessionsToStorage();
    });
    chatContainer.querySelector("#qwen-load-btn").addEventListener("click", () => {
      showLoadChatsModal();
    });
    chatContainer.querySelector("#qwen-save-btn").addEventListener("click", () => {
      global.saveCurrentSessionToSaved();
    });
    // Placeholder: Implement downloadChatLog() as needed.
    chatContainer.querySelector("#qwen-download-btn").addEventListener("click", () => {
      alert("Download Chat Log functionality not implemented.");
    });
    chatContainer.querySelector("#qwen-close-btn").addEventListener("click", () => {
      global.closeChatSession(global.currentSessionId);
    });
    chatContainer.querySelector("#qwen-model-select").addEventListener("change", (e) => {
      global.updateCurrentSessionModel(e.target.value);
      global.saveActiveSessionsToStorage();
    });
    const inputArea = chatContainer.querySelector("#qwen-input");
    inputArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    chatContainer.querySelector("#qwen-send-btn").addEventListener("click", sendMessage);
  
    // Function to send a message via the API.
    async function sendMessage() {
      const inputField = chatContainer.querySelector("#qwen-input");
      const userMessage = inputField.value.trim();
      if (!userMessage) return;
      global.appendSessionMessage("You", userMessage);
      inputField.value = "";
      const modelSelect = chatContainer.querySelector("#qwen-model-select");
      let selectedModel = modelSelect.value || "qwen/qwq-32b";
      const webSearchEnabled = chatContainer.querySelector("#qwen-web-search").checked;
      const payload = {
        model: selectedModel,
        messages: [{ role: "user", content: userMessage }]
      };
      if (webSearchEnabled) {
        if (!selectedModel.includes(":online")) {
          payload.model = `${selectedModel}:online`;
        }
        payload.plugins = [{
          id: "web",
          max_results: 5,
          search_prompt: "A web search was conducted on " + new Date().toDateString() +
                         ". Incorporate the following web search results into your response. IMPORTANT: Cite them using markdown links named using the domain of the source."
        }];
      } else {
        payload.web_search = false;
      }
      const senderName = modelSelect.options[modelSelect.selectedIndex].textContent || "AI";
      const loaderMessageId = global.appendLoaderMessage(senderName + " is thinking");
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer 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`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "OpenRouter Chat Extension"
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        global.removeLoaderMessage(loaderMessageId);
        if (!response.ok || data.error) {
          const code = data.error?.code || response.status;
          const errMsg = data.error?.message || "Failed to fetch response from server.";
          global.appendSessionMessage("Error", `Error ${code}: ${errMsg}`);
          return;
        }
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          global.appendSessionMessage(senderName, data.choices[0].message.content);
        } else {
          global.appendSessionMessage("Error", "No valid response received.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        global.removeLoaderMessage(loaderMessageId);
        global.appendSessionMessage("Error", "Failed to fetch response.");
      }
      renderChatBody();
      global.saveActiveSessionsToStorage();
    }
  
    // Load models from API.
    async function loadModels() {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          mode: "cors",
          headers: { "HTTP-Referer": window.location.origin, "X-Title": "OpenRouter Chat Extension" }
        });
        if (!response.ok) {
          console.error("Failed to fetch models. Status:", response.status);
          return;
        }
        const data = await response.json();
        const modelSelect = chatContainer.querySelector("#qwen-model-select");
        modelSelect.innerHTML = "";
        data.data.forEach(model => {
          const option = document.createElement("option");
          option.value = model.id;
          option.textContent = model.name;
          modelSelect.appendChild(option);
        });
        const defaultOption = Array.from(modelSelect.options).find(
          o => o.value === "qwen/qwq-32b" || o.textContent.toLowerCase().includes("qwq")
        );
        if (defaultOption) {
          modelSelect.value = defaultOption.value;
          if (global.currentSessionId) {
            currentChatSessions[global.currentSessionId].model = defaultOption.value;
          }
        }
      } catch (error) {
        console.error("Error loading models:", error);
      }
    }
    loadModels();
  
    // Load any previously saved sessions.
    global.loadActiveSessionsFromStorage();
    if (!global.currentSessionId) {
      global.createNewChatSession();
    }
  })(window);