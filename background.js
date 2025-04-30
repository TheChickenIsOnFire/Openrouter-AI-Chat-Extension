// background.js - OpenRouter Extension Service Worker

// Service Worker Lifecycle
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  // Clean up old caches if needed
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'openrouter-cache-v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Secure API Key Management
const CRYPTO_KEY_NAME = 'openrouter_api_key_encryption_key';

async function getEncryptionKey() {
  const storedKey = await chrome.storage.local.get(CRYPTO_KEY_NAME);
  if (storedKey[CRYPTO_KEY_NAME]) {
    return crypto.subtle.importKey(
      'jwk',
      storedKey[CRYPTO_KEY_NAME],
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  // Generate new key if none exists
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  await chrome.storage.local.set({ [CRYPTO_KEY_NAME]: exportedKey });
  return key;
}

async function encryptApiKey(apiKey) {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return {
    iv: Array.from(iv),
    encrypted: Array.from(new Uint8Array(encrypted))
  };
}

async function decryptApiKey(encryptedData) {
  const key = await getEncryptionKey();
  const iv = new Uint8Array(encryptedData.iv);
  const encrypted = new Uint8Array(encryptedData.encrypted);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// Message Passing
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (!message || !message.type) {
    sendResponse({ success: false, error: 'Invalid message format' });
    return;
  }
  
  try {
    switch (message.type) {
      case 'STORE_API_KEY':
        const encrypted = await encryptApiKey(message.apiKey);
        await chrome.storage.local.set({ openrouter_api_key: encrypted });
        sendResponse({ success: true });
        break;
        
      case 'GET_API_KEY':
        const stored = await chrome.storage.local.get('openrouter_api_key');
        if (stored.openrouter_api_key) {
          const decrypted = await decryptApiKey(stored.openrouter_api_key);
          sendResponse({ apiKey: decrypted });
        } else {
          sendResponse({ apiKey: null });
        }
        break;
        
      case 'SAVE_POSITION':
        await chrome.storage.local.set({ 
          'drag_position': message.position 
        });
        sendResponse({ success: true });
        break;
        
      case 'GET_POSITION':
        const pos = await chrome.storage.local.get('drag_position');
        sendResponse({ position: pos.drag_position || { x: 0, y: 0 } });
        break;
        
      case 'TRACK_METRIC':
        const data = await chrome.storage.local.get('performance_metrics');
        const metrics = data.performance_metrics || [];
        metrics.push({
          ...message.metric,
          timestamp: Date.now()
        });
        chrome.storage.local.set({ performance_metrics: metrics });
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep message channel open for async responses
});

// Cross-Origin Request Handling
chrome.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    try {
      if (!details || !details.requestHeaders) {
        return { cancel: true };
      }
      
      const data = await chrome.storage.local.get('openrouter_api_key');
      
      if (data?.openrouter_api_key) {
        const apiKey = await decryptApiKey(data.openrouter_api_key);
        if (apiKey) {
          details.requestHeaders.push({
            name: 'Authorization',
            value: `Bearer ${apiKey}`
          });
        }
      }
      
      details.requestHeaders.push({
        name: 'X-Content-Type-Options',
        value: 'nosniff'
      });
      
      return { requestHeaders: details.requestHeaders };
    } catch (error) {
      console.error('Request header modification failed:', error);
      return { cancel: true };
    }
  },
  { urls: ['https://openrouter.ai/api/*'] },
  ['blocking', 'requestHeaders', 'extraHeaders']
);

// Keyboard Shortcut Listeners
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-extension') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_EXTENSION' });
    });
  }
  
  if (command === 'clear-cache') {
    chrome.storage.local.clear(() => {
      console.log('Cache cleared');
    });
  }
});

// Performance Metrics Collection
function trackPerformance() {
  const metrics = {
    navigation: performance.getEntriesByType('navigation')[0],
    resourceTiming: performance.getEntriesByType('resource')
  };
  
  chrome.runtime.sendMessage({
    type: 'PERFORMANCE_UPDATE',
    metrics
  });
}

// Periodic metrics collection
setInterval(trackPerformance, 30000);