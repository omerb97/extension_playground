import * as vscode from 'vscode';
import { SecretWarning } from '../models/SecretWarning';

export class SecretTreeItem extends vscode.TreeItem {
    public children?: SecretTreeItem[];

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly warning?: SecretWarning,
        children?: SecretTreeItem[]
    ) {
        super(label, collapsibleState);
        this.children = children;
        
        if (warning) {
            this.description = `Line ${warning.line + 1}`;
            this.tooltip = warning.message;
            this.command = {
                command: 'secret-scanner.navigateToSecret',
                title: 'Navigate to Secret',
                arguments: [warning]
            };
            this.contextValue = 'secretWarning';
            this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('list.warningForeground'));
        } else {
            this.contextValue = 'file';
            this.iconPath = new vscode.ThemeIcon('file');
        }
    }
}
