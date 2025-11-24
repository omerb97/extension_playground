import * as vscode from 'vscode';
import { SecretScanner } from './services/SecretScanner';
import { CopilotService } from './services/CopilotService';
import { SecretsViewProvider } from './providers/SecretsViewProvider';
import { SecretQuickFixProvider } from './providers/SecretQuickFixProvider';
import { SecretTreeItem } from './views/SecretTreeItem';
import { SecretWarning } from './models/SecretWarning';
import { debounce } from './utils/debounce';

let secretScanner: SecretScanner;
let copilotService: CopilotService;
let secretsViewProvider: SecretsViewProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('Secret Scanner extension is now active!');

    // Initialize services
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('secretScanner');
    context.subscriptions.push(diagnosticCollection);

    secretScanner = new SecretScanner(diagnosticCollection);
    copilotService = new CopilotService();

    // Initialize TreeView provider
    secretsViewProvider = new SecretsViewProvider();
    const treeView = vscode.window.createTreeView('secretScannerView', {
        treeDataProvider: secretsViewProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);

    // Register commands
    registerCommands(context);

    // Initial scan
    secretScanner.scanAllOpenDocuments();
    secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());

    // Register event listeners
    registerEventListeners(context);
}

function registerCommands(context: vscode.ExtensionContext): void {
    // Navigate to secret command
    const navigateCommand = vscode.commands.registerCommand(
        'secret-scanner.navigateToSecret',
        (warning: SecretWarning) => {
            vscode.workspace.openTextDocument(warning.uri).then(document => {
                vscode.window.showTextDocument(document).then(editor => {
                    const position = new vscode.Position(warning.line, warning.column);
                    editor.selection = new vscode.Selection(warning.range.start, warning.range.end);
                    editor.revealRange(warning.range, vscode.TextEditorRevealType.InCenter);
                });
            });
        }
    );
    context.subscriptions.push(navigateCommand);

    // Manual workspace scan command
    const scanWorkspaceCommand = vscode.commands.registerCommand(
        'secret-scanner.scanWorkspace',
        () => {
            secretScanner.scanAllOpenDocuments();
            secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
            vscode.window.showInformationMessage('Secret scan completed!');
        }
    );
    context.subscriptions.push(scanWorkspaceCommand);

    // Refresh command
    const refreshCommand = vscode.commands.registerCommand(
        'secret-scanner.refresh',
        () => {
            secretScanner.scanAllOpenDocuments();
            secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
        }
    );
    context.subscriptions.push(refreshCommand);

    // Ask Copilot command
    const askCopilotCommand = vscode.commands.registerCommand(
        'secret-scanner.askCopilot',
        async (itemOrArgs: SecretTreeItem | { warning: SecretWarning }) => {
            // Handle both TreeItem (from sidebar) and direct warning object (from Quick Fix)
            const warning = 'warning' in itemOrArgs ? itemOrArgs.warning : itemOrArgs.warning;
            if (!warning) {
                return;
            }
            await copilotService.askAboutSecret(warning);
        }
    );
    context.subscriptions.push(askCopilotCommand);

    // Fix with Copilot command
    const fixWithCopilotCommand = vscode.commands.registerCommand(
        'secret-scanner.fixWithCopilot',
        async (itemOrArgs: SecretTreeItem | { warning: SecretWarning }) => {
            // Handle both TreeItem (from sidebar) and direct warning object (from Quick Fix)
            const warning = 'warning' in itemOrArgs ? itemOrArgs.warning : itemOrArgs.warning;
            if (!warning) {
                return;
            }
            await copilotService.fixWithCopilot(warning);
        }
    );
    context.subscriptions.push(fixWithCopilotCommand);

    // Register Code Action Provider for Quick Fix
    const quickFixProvider = vscode.languages.registerCodeActionsProvider(
        { scheme: 'file' },
        new SecretQuickFixProvider(),
        {
            providedCodeActionKinds: SecretQuickFixProvider.providedCodeActionKinds
        }
    );
    context.subscriptions.push(quickFixProvider);
}

function registerEventListeners(context: vscode.ExtensionContext): void {
    // Document opened
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(document => {
        secretScanner.scanDocument(document);
        secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
    });
    context.subscriptions.push(onDidOpenTextDocument);

    // Document changed (with debounce)
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
        debounce(() => {
            secretScanner.scanDocument(event.document);
            secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
        }, 500)();
    });
    context.subscriptions.push(onDidChangeTextDocument);

    // Document closed
    const onDidCloseTextDocument = vscode.workspace.onDidCloseTextDocument(document => {
        secretScanner.clearDocument(document.uri);
        secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
    });
    context.subscriptions.push(onDidCloseTextDocument);
}

export function deactivate() {
    if (secretScanner) {
        secretScanner.dispose();
    }
}
