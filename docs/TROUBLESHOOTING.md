# Troubleshooting Guide

## Common Issues
1. **Extension Not Loading**
   - Ensure Developer Mode is enabled in Chrome
   - Check for manifest.json errors
   - Verify all required files are present

2. **API Key Errors**
   - Confirm key format matches `sk-or-...`
   - Check for trailing spaces in key entry
   - Verify key has active credits

3. **Model Timeout Errors**
   - Try alternative models/providers
   - Check internet connection stability
   - Increase timeout settings in config

## Diagnostic Steps
1. **Check Console Logs**
   ```bash
   # In Chrome DevTools Console
   chrome.runtime.lastError
   ```

2. **Test API Directly**
   ```bash
   curl -H "Authorization: Bearer <API_KEY>" \
     https://openrouter.ai/api/v1/models
   ```

3. **Network Inspection**
   - Open DevTools > Network tab
   - Filter by XHR requests
   - Inspect request/response details