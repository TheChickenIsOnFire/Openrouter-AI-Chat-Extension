// models.js - OpenRouter Extension Model Directory Module
// Implements API client, caching, search, and UI integration for model management

// Constants for caching and API
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const API_BASE_URL = 'https://openrouter.ai/api/v1/models';
const STORAGE_KEY = 'openrouter_models_cache';
const SELECTED_MODEL_KEY = 'openrouter_selected_model';

// API Client to fetch models from OpenRouter
async function fetchModelsFromAPI(apiKey) {
  try {
    const response = await fetch(API_BASE_URL, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.models || data; // Handle different response structures
  } catch (error) {
    console.error('Error fetching models:', error);
    // Fallback to cached data if available
    const cached = await getCachedModels();
    return cached.models || [];
  }
}

// Caching mechanism for improved performance
async function getCachedModels() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || { models: [], timestamp: 0 });
    });
  });
}

async function cacheModels(models) {
  const cacheData = {
    models,
    timestamp: Date.now()
  };
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: cacheData }, () => {
      resolve();
    });
  });
}

// Main model retrieval function with cache management
async function getAvailableModels(apiKey) {
  const cached = await getCachedModels();
  
  // Return cached models if they're still valid
  if (Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.models;
  }
  
  // Fetch new models if cache is expired
  const models = await fetchModelsFromAPI(apiKey);
  await cacheModels(models);
  return models;
}

// Search and filtering functionality
function searchModels(models, filters) {
  return models.filter(model => {
    // Filter by provider
    if (filters.provider && !model.provider?.id.includes(filters.provider)) {
      return false;
    }
    
    // Filter by model name
    if (filters.query && !model.name.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    
    // Filter by performance metrics (example: latency)
    if (filters.maxLatency && model.latency > filters.maxLatency) {
      return false;
    }
    
    // Filter by cost
    if (filters.maxCost && model.pricing?.prompt > filters.maxCost) {
      return false;
    }
    
    return true;
  });
}

// Model selection and switching capability
async function getSelectedModel() {
  return new Promise((resolve) => {
    chrome.storage.local.get([SELECTED_MODEL_KEY], (result) => {
      resolve(result[SELECTED_MODEL_KEY] || null);
    });
  });
}

async function selectModel(modelId) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SELECTED_MODEL_KEY]: modelId }, () => {
      resolve();
      // Dispatch event for UI updates
      chrome.runtime.sendMessage({ type: 'MODEL_SELECTED', modelId });
    });
  });
}

// Initialize model directory UI integration
function initModelDirectory(container, models, selectedModelId) {
  // Clear existing content
  container.innerHTML = '';
  
  // Create model cards
  models.forEach(model => {
    const card = document.createElement('div');
    card.className = 'model-card' + (model.id === selectedModelId ? ' selected' : '');
    card.innerHTML = `
      <h3>${model.name}</h3>
      <div class="model-provider">Provider: ${model.provider?.id || 'Unknown'}</div>
      <div class="model-metrics">
        Latency: ${model.latency || 'N/A'}ms | 
        Cost: $${(model.pricing?.prompt || 0).toFixed(6)}/token
      </div>
      <button class="select-btn">${model.id === selectedModelId ? 'Selected' : 'Select'}</button>
    `;
    
    // Add click handler
    card.addEventListener('click', () => {
      selectModel(model.id);
      // Update UI
      document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      card.querySelector('.select-btn').textContent = 'Selected';
    });
    
    container.appendChild(card);
  });
  
  // Add event listener for model selection updates
  chrome.runtime.onMessage.addListener((message, sender, response) => {
    if (message.type === 'MODEL_SELECTED') {
      document.querySelectorAll('.model-card').forEach(card => {
        if (card.querySelector('h3').textContent === message.modelId) {
          card.classList.add('selected');
          card.querySelector('.select-btn').textContent = 'Selected';
        } else {
          card.classList.remove('selected');
          card.querySelector('.select-btn').textContent = 'Select';
        }
      });
    }
  });
}

// Error handling for API failures
function handleAPIError(error, retryCallback) {
  console.error('API Error:', error);
  
  // Show error notification in UI
  const errorEl = document.createElement('div');
  errorEl.className = 'api-error';
  errorEl.textContent = `Failed to load models: ${error.message}. Using cached data.`;
  document.body.appendChild(errorEl);
  
  // Auto-hide error after 5 seconds
  setTimeout(() => {
    errorEl.remove();
  }, 5000);
  
  // Attempt retry after delay
  setTimeout(() => {
    if (retryCallback) {
      retryCallback();
    }
  }, 10000);
}

// Export public API
export const ModelDirectory = {
  getAvailableModels,
  searchModels,
  selectModel,
  getSelectedModel,
  initModelDirectory
};