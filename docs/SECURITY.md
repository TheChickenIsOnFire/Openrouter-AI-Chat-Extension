# Security Best Practices

## API Key Management
1. **Key Storage**
   - Never hardcode API keys in client-side code
   - Use Chrome's secure storage API for extension settings
   - Avoid storing keys in version control

2. **Key Permissions**
   - Use least-privilege principle when creating API keys
   - Regularly rotate keys (every 90 days recommended)
   - Revoke compromised keys immediately

3. **Transmission Security**
   - Always use HTTPS for API communication
   - Validate SSL certificates in all API requests
   - Implement HSTS headers for secure connections

## Extension Security
1. **Content Security Policy**
   ```json
   "content_security_policy": {
     "extension_pages": "script-src 'self'; object-src 'self'"
   }
   ```

2. **Data Protection**
   - Encrypt sensitive data stored locally
   - Implement secure messaging between components
   - Validate and sanitize all user input

3. **Update Practices**
   - Monitor for security advisories from OpenRouter
   - Regularly update dependencies and libraries
   - Implement automatic update checks in background script