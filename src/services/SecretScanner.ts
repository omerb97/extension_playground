import * as vscode from 'vscode';
import { SecretWarning } from '../models/SecretWarning';
import { SECRET_PATTERNS } from '../constants/secretPatterns';

export class SecretScanner {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private allSecrets: Map<string, SecretWarning[]> = new Map();

    constructor(diagnosticCollection: vscode.DiagnosticCollection) {
        this.diagnosticCollection = diagnosticCollection;
    }

    public getAllSecrets(): Map<string, SecretWarning[]> {
        return this.allSecrets;
    }

    public scanAllOpenDocuments(): void {
        vscode.workspace.textDocuments.forEach(document => {
            if (document.uri.scheme === 'file') {
                this.scanDocument(document);
            }
        });
    }

    public scanDocument(document: vscode.TextDocument): SecretWarning[] {
        // Skip certain file types that are unlikely to contain secrets or are binary
        const skipExtensions = ['.min.js', '.min.css', '.map', '.lock', '.log', '.jpg', '.png', '.gif', '.pdf', '.zip'];
        const skipLargeFiles = document.lineCount > 10000; // Skip very large files for performance
        
        if (skipExtensions.some(ext => document.fileName.endsWith(ext)) || skipLargeFiles) {
            return [];
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const secrets: SecretWarning[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, lineIndex) => {
            // Skip comments and certain patterns that are likely false positives
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('//') || 
                trimmedLine.startsWith('#') || 
                trimmedLine.startsWith('*') ||
                trimmedLine.includes('example') ||
                trimmedLine.includes('placeholder') ||
                trimmedLine.includes('your_') ||
                trimmedLine.includes('<YOUR_') ||
                trimmedLine.includes('TODO') ||
                trimmedLine.includes('FIXME')) {
                return;
            }

            SECRET_PATTERNS.forEach(pattern => {
                let match;
                pattern.regex.lastIndex = 0; // Reset regex state
                
                while ((match = pattern.regex.exec(line)) !== null) {
                    const startPos = new vscode.Position(lineIndex, match.index);
                    const endPos = new vscode.Position(lineIndex, match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `${pattern.description}: ${match[0]}`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    
                    diagnostic.source = 'Secret Scanner';
                    diagnostic.code = pattern.name.toLowerCase().replace(/\s+/g, '-');
                    
                    diagnostics.push(diagnostic);

                    // Add to secrets list
                    secrets.push({
                        uri: document.uri,
                        line: lineIndex,
                        column: match.index,
                        message: `${pattern.description}: ${match[0]}`,
                        secretType: pattern.name,
                        range: range
                    });
                }
            });
        });

        this.diagnosticCollection.set(document.uri, diagnostics);
        
        // Update secrets map
        if (secrets.length > 0) {
            this.allSecrets.set(document.uri.fsPath, secrets);
        } else {
            this.allSecrets.delete(document.uri.fsPath);
        }

        return secrets;
    }

    public clearDocument(uri: vscode.Uri): void {
        this.diagnosticCollection.delete(uri);
        this.allSecrets.delete(uri.fsPath);
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
