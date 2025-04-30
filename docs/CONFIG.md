# API Configuration Guide

## API Key Setup
1. **Obtain API Key**
   - Visit [OpenRouter Dashboard](https://openrouter.ai/settings/credits)
   - Click "Create API Key" and copy the generated key

2. **Configure Extension**
   - Open extension popup UI
   - Navigate to Settings tab
   - Enter API key in the designated field
   - Save configuration

3. **Environment Variables (Optional)**
   ```bash
   # For development environments
   export OPENROUTER_API_KEY="your-api-key-here"
   ```

## Configuration Options
- **Model Selection**: Choose from 300+ available models in the settings panel
- **Routing Preferences**: Set priority for price, speed, or quality
- **Rate Limit Management**: Configure custom rate limit thresholds
- **Provider Restrictions**: Whitelist/blacklist specific AI providers

## Authentication Methods
1. Bearer Token (Recommended)
   ```http
   Authorization: Bearer <OPENROUTER_API_KEY>
   ```

2. Query Parameter (Less secure)
   ```
   https://openrouter.ai/api/v1/chat/completions?api_key=<OPENROUTER_API_KEY>