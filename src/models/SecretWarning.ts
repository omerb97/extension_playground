import * as vscode from 'vscode';

export interface SecretWarning {
    uri: vscode.Uri;
    line: number;
    column: number;
    message: string;
    secretType: string;
    range: vscode.Range;
}
