import * as vscode from 'vscode';
import { SecretWarning } from '../models/SecretWarning';

export class SecretQuickFixProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] | undefined {
        // Only provide actions for diagnostics from our extension
        const secretDiagnostics = context.diagnostics.filter(
            diagnostic => diagnostic.source === 'Secret Scanner'
        );

        if (secretDiagnostics.length === 0) {
            return undefined;
        }

        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of secretDiagnostics) {
            // Create SecretWarning from diagnostic for commands
            const warning: SecretWarning = {
                uri: document.uri,
                line: diagnostic.range.start.line,
                column: diagnostic.range.start.character,
                message: diagnostic.message,
                secretType: this.extractSecretType(diagnostic.message),
                range: diagnostic.range
            };

            // Action 1: Explain security issue
            const explainAction = new vscode.CodeAction(
                '💬 Explain security issue with Copilot',
                vscode.CodeActionKind.QuickFix
            );
            explainAction.command = {
                command: 'secret-scanner.askCopilot',
                title: 'Explain Security Issue',
                arguments: [{ warning }]
            };
            explainAction.diagnostics = [diagnostic];
            explainAction.isPreferred = false;
            actions.push(explainAction);

            // Action 2: Fix with Copilot
            const fixAction = new vscode.CodeAction(
                '🔧 Fix with Copilot (local-environment ready)',
                vscode.CodeActionKind.QuickFix
            );
            fixAction.command = {
                command: 'secret-scanner.fixWithCopilot',
                title: 'Fix with Copilot',
                arguments: [{ warning }]
            };
            fixAction.diagnostics = [diagnostic];
            fixAction.isPreferred = true; // Make this the default quick fix
            actions.push(fixAction);
        }

        return actions;
    }

    private extractSecretType(message: string): string {
        // Extract the secret type from the diagnostic message
        // Format is typically "Potential API key detected: ..." or similar
        const match = message.match(/^(.+?)(?:\s+detected)?:/);
        if (match) {
            return match[1];
        }
        return 'Secret';
    }
}
