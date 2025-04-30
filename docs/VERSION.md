# Version History & Update Instructions

## Version 1.0.0 (Initial Release)
- Core functionality: OpenRouter API integration
- Supported models: 300+ via unified interface
- Key features: API key management, provider routing, analytics

## Version 1.1.0 (Planned)
- Enhanced features:
  - Team account management
  - Advanced analytics dashboard
  - Model comparison tools

## Update Procedure
1. **Manual Updates**
   - Download new version from Chrome Web Store
   - Extension auto-updates by default
   - Force update via `chrome://extensions/` > Update button

2. **Development Updates**
   ```bash
   # For local development
   git pull origin main
   npm run build
   # Load unpacked extension in Chrome
   ```

3. **Version Verification**
   ```javascript
   // In background.js console
   console.log('Extension Version:', chrome.runtime.getManifest().version);