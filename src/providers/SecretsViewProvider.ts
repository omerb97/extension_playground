import * as vscode from 'vscode';
import * as path from 'path';
import { SecretWarning } from '../models/SecretWarning';
import { SecretTreeItem } from '../views/SecretTreeItem';

export class SecretsViewProvider implements vscode.TreeDataProvider<SecretTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SecretTreeItem | undefined | null | void> = new vscode.EventEmitter<SecretTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SecretTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private secrets: Map<string, SecretWarning[]> = new Map();

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateSecrets(secrets: Map<string, SecretWarning[]>): void {
        this.secrets = secrets;
        this.refresh();
    }

    getTreeItem(element: SecretTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SecretTreeItem): Thenable<SecretTreeItem[]> {
        if (!element) {
            // Root level - show files
            const fileItems: SecretTreeItem[] = [];
            
            this.secrets.forEach((warnings, filePath) => {
                if (warnings.length > 0) {
                    const fileName = path.basename(filePath);
                    const fileItem = new SecretTreeItem(
                        fileName,
                        vscode.TreeItemCollapsibleState.Expanded,
                        undefined
                    );
                    fileItem.description = `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`;
                    fileItem.tooltip = filePath;
                    fileItem.resourceUri = vscode.Uri.file(filePath);
                    
                    // Store warnings as children
                    fileItem.children = warnings.map(warning => 
                        new SecretTreeItem(
                            warning.secretType,
                            vscode.TreeItemCollapsibleState.None,
                            warning
                        )
                    );
                    
                    fileItems.push(fileItem);
                }
            });

            if (fileItems.length === 0) {
                const noSecretsItem = new SecretTreeItem(
                    'No secrets detected',
                    vscode.TreeItemCollapsibleState.None
                );
                noSecretsItem.iconPath = new vscode.ThemeIcon('pass');
                return Promise.resolve([noSecretsItem]);
            }

            return Promise.resolve(fileItems);
        } else {
            // File level - show warnings
            return Promise.resolve(element.children || []);
        }
    }
}
