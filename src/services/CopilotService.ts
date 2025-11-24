import * as vscode from 'vscode';
import * as path from 'path';
import { SecretWarning } from '../models/SecretWarning';

export class CopilotService {
    public async fixWithCopilot(warning: SecretWarning): Promise<void> {
        try {
            // Get the document content for context
            const document = await vscode.workspace.openTextDocument(warning.uri);
            const lineText = document.lineAt(warning.line).text;
            
            // Get surrounding lines for better context
            const startLine = Math.max(0, warning.line - 2);
            const endLine = Math.min(document.lineCount - 1, warning.line + 2);
            const contextLines: string[] = [];
            
            for (let i = startLine; i <= endLine; i++) {
                const prefix = i === warning.line ? '→ ' : '  ';
                contextLines.push(`${prefix}${i + 1}: ${document.lineAt(i).text}`);
            }
            
            const context = contextLines.join('\n');
            const fileName = path.basename(warning.uri.fsPath);
            
            // Build the prompt for Copilot to fix the issue
            const prompt = `I have a hardcoded ${warning.secretType} in my code that needs to be fixed securely.
The solution MUST work in a local development environment.

File: ${fileName}
Line ${warning.line + 1}:
\`\`\`
${context}
\`\`\`

Security Issue: ${warning.message}

Please provide:
1. Secure replacement code using environment variables, configuration files, or secure storage
2. Step-by-step instructions for setting this up in a local development environment
3. How to keep the secret out of version control (e.g., .gitignore, .env.example)
4. Complete code example showing the secure implementation
5. Any additional libraries or tools needed

Important: The solution should be production-ready but work seamlessly in local development.`;

            // Try to use the Chat API
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4'
            });

            if (models.length === 0) {
                // Fallback: Open chat panel with the question
                await vscode.commands.executeCommand('workbench.action.chat.open', {
                    query: prompt
                });
                return;
            }

            // Send request to Copilot
            const model = models[0];
            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            const chatResponse = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

            // Collect the response
            let response = '';
            for await (const fragment of chatResponse.text) {
                response += fragment;
            }

            // Open chat view with the result
            await vscode.commands.executeCommand('workbench.action.chat.open', {
                query: prompt
            });

        } catch (error) {
            // Fallback: Show error and try to open chat
            console.error('Error communicating with Copilot:', error);
            
            const message = `How can I securely fix this hardcoded ${warning.secretType} on line ${warning.line + 1} for use in a local development environment?`;
            
            try {
                await vscode.commands.executeCommand('workbench.action.chat.open', {
                    query: message
                });
            } catch (chatError) {
                vscode.window.showErrorMessage(
                    'Unable to open Copilot Chat. Please make sure GitHub Copilot is installed and enabled.',
                    'Learn More'
                ).then(selection => {
                    if (selection === 'Learn More') {
                        vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=GitHub.copilot'));
                    }
                });
            }
        }
    }

    public async askAboutSecret(warning: SecretWarning): Promise<void> {
        try {
            // Get the document content for context
            const document = await vscode.workspace.openTextDocument(warning.uri);
            const lineText = document.lineAt(warning.line).text;
            
            // Get surrounding lines for better context
            const startLine = Math.max(0, warning.line - 2);
            const endLine = Math.min(document.lineCount - 1, warning.line + 2);
            const contextLines: string[] = [];
            
            for (let i = startLine; i <= endLine; i++) {
                const prefix = i === warning.line ? '→ ' : '  ';
                contextLines.push(`${prefix}${i + 1}: ${document.lineAt(i).text}`);
            }
            
            const context = contextLines.join('\n');
            const fileName = path.basename(warning.uri.fsPath);
            
            // Build the prompt for Copilot
            const prompt = `I detected a hardcoded ${warning.secretType} in my code. Here's the context:

File: ${fileName}
Line ${warning.line + 1}:
\`\`\`
${context}
\`\`\`

Security Issue: ${warning.message}

Questions:
1. What is the security risk of having this hardcoded ${warning.secretType.toLowerCase()}?
2. What are the best practices for handling this type of credential?
3. How should I fix this issue securely?`;

            // Try to use the Chat API
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4'
            });

            if (models.length === 0) {
                // Fallback: Open chat panel with the question
                await vscode.commands.executeCommand('workbench.action.chat.open', {
                    query: prompt
                });
                return;
            }

            // Send request to Copilot
            const model = models[0];
            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            const chatResponse = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

            // Collect the response
            let response = '';
            for await (const fragment of chatResponse.text) {
                response += fragment;
            }

            // Open chat view with the result
            await vscode.commands.executeCommand('workbench.action.chat.open', {
                query: prompt
            });

        } catch (error) {
            // Fallback: Show error and try to open chat
            console.error('Error communicating with Copilot:', error);
            
            const message = `I detected a hardcoded ${warning.secretType} on line ${warning.line + 1}. What is the security risk here and how should I fix it?`;
            
            try {
                await vscode.commands.executeCommand('workbench.action.chat.open', {
                    query: message
                });
            } catch (chatError) {
                vscode.window.showErrorMessage(
                    'Unable to open Copilot Chat. Please make sure GitHub Copilot is installed and enabled.',
                    'Learn More'
                ).then(selection => {
                    if (selection === 'Learn More') {
                        vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=GitHub.copilot'));
                    }
                });
            }
        }
    }
}
