# Secret Scanner VS Code Extension

A VS Code extension that automatically detects hardcoded secrets, passwords, and API keys in your code and displays warnings in the Problems panel.

## Features

- **Real-time scanning**: Automatically scans open files for potential secrets as you type
- **Multiple pattern detection**: Detects various types of secrets including:
  - API keys and tokens
  - Hardcoded passwords
  - Database connection strings with credentials
  - AWS access keys and secret keys
  - Bearer tokens and JWT tokens
  - GitHub tokens
  - Private key headers
  - Generic secret patterns

- **Smart filtering**: Reduces false positives by ignoring:
  - Comments and documentation
  - Examples and placeholders (containing "example", "placeholder", "your_", etc.)
  - TODO/FIXME comments
  - Binary and minified files

- **Sidebar view**: Custom sidebar panel that lists all detected secrets organized by file
- **Click-to-navigate**: Click any secret in the sidebar to jump directly to its location in the code
- **GitHub Copilot integration**: Ask Copilot about specific security issues with a single click
- **Problems panel integration**: All detected secrets also appear in VS Code's Problems panel with clear descriptions

## Usage

### Automatic Scanning
The extension automatically scans:
- Files when they are opened
- Files as you edit them (with debouncing to improve performance)
- All currently open files when the extension activates

### Manual Scanning
You can also manually trigger a scan using the Command Palette:
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Scan Workspace for Secrets"
3. Press Enter

### GitHub Copilot Integration

The extension provides two ways to get help from GitHub Copilot:

#### 1. Ask Copilot About Security Issues
Each detected secret in the sidebar has a chat icon button (💬) that explains the security risk:
1. Open the Secret Scanner sidebar (shield icon in Activity Bar)
2. Hover over any detected secret warning
3. Click the chat icon (💬) button
4. Copilot Chat opens with questions about the security risk and best practices

#### 2. Fix with Copilot
Get automated fix suggestions that work in local development:
1. **From Sidebar**: Click the tools icon (🔧) next to any detected secret
2. **From Editor (Quick Fix)**: 
   - Hover over the secret warning squiggle in your code
   - Click the lightbulb icon or press `Ctrl+.` / `Cmd+.`
   - Select "🔧 Fix with Copilot (local-environment ready)"

The fix prompt asks Copilot to provide:
- Secure replacement code using environment variables or config files
- Step-by-step setup instructions for local development
- How to keep secrets out of version control
- Complete working examples

#### 3. Quick Fix Menu
When you hover over a detected secret in the editor, you'll see Quick Fix options:
- **💬 Explain security issue with Copilot** - Opens explanation
- **🔧 Fix with Copilot (local-environment ready)** - Generates fix (default option)

The extension automatically provides context to Copilot including:
- The file name and line number
- The surrounding code context (±2 lines)
- The type of secret detected
- Specific questions or fix requirements

**Note**: These features require the GitHub Copilot extension to be installed and active.

## Installation for Development

1. Clone or download this repository
2. Open the folder in VS Code
3. Run `npm install` to install dependencies
4. Run `npm run compile` to build the extension
5. Press `F5` to open a new Extension Development Host window
6. Open any file with potential secrets to see the extension in action

## Testing

A test file `test-secrets.js` is included that contains various types of hardcoded secrets for demonstration purposes. Open this file in the Extension Development Host to see the secret detection in action.

## Detected Secret Types

| Pattern | Example | Description |
|---------|---------|-------------|
| API Key | `apiKey = "sk-1234..."` | API keys and access tokens |
| Password | `password = "secret123"` | Hardcoded passwords |
| Database URL | `mongodb://user:pass@host` | Connection strings with credentials |
| AWS Access Key | `AKIAIOSFODNN7EXAMPLE` | AWS access key IDs |
| AWS Secret | `aws_secret_access_key = "..."` | AWS secret access keys |
| Bearer Token | `Bearer eyJhbGci...` | Authorization bearer tokens |
| JWT Token | `eyJ0eXAiOiJKV1Q...` | JSON Web Tokens |
| GitHub Token | `ghp_1234567890...` | GitHub personal access tokens |
| Private Key | `-----BEGIN RSA PRIVATE KEY-----` | Private key headers |
| Generic Secret | `secret = "token123"` | Generic secret patterns |

## Performance Considerations

- Files larger than 10,000 lines are skipped for performance
- Certain file types (.min.js, .map, .lock, binary files) are automatically skipped
- Document change scanning is debounced (500ms) to avoid excessive processing

## Security Note

This extension is designed to help identify potential security issues in your code. However:
- It may produce false positives or miss some patterns
- Always review flagged items to determine if they are actual security concerns
- Consider using additional security tools and practices
- Remove or properly secure any legitimate secrets found

## Contributing

Feel free to contribute by:
- Adding new secret detection patterns
- Improving existing patterns
- Enhancing performance
- Reducing false positives
- Adding configuration options

## License

This project is provided as-is for educational and development purposes.
