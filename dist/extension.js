"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode6 = __toESM(require("vscode"));

// src/services/SecretScanner.ts
var vscode = __toESM(require("vscode"));

// src/constants/secretPatterns.ts
var SECRET_PATTERNS = [
  // API Keys
  {
    name: "API Key",
    regex: /(?:api[_-]?key|apikey|key)\s*[=:]\s*['"]\s*[a-zA-Z0-9_\-]{16,}['"]/gi,
    description: "Potential API key detected"
  },
  {
    name: "Bearer Token",
    regex: /bearer\s+[a-zA-Z0-9_\-\.=]{20,}/gi,
    description: "Bearer token detected"
  },
  // Passwords
  {
    name: "Password",
    regex: /(?:password|passwd|pwd)\s*[=:]\s*['"]\s*[^\s'"]{6,}['"]/gi,
    description: "Hardcoded password detected"
  },
  // Database credentials
  {
    name: "Database URL",
    regex: /(?:mongodb|mysql|postgres|postgresql):\/\/[^:]+:[^@]+@[^\/\s]+/gi,
    description: "Database connection string with credentials detected"
  },
  // AWS Keys
  {
    name: "AWS Access Key",
    regex: /AKIA[0-9A-Z]{16}/g,
    description: "AWS access key detected"
  },
  {
    name: "AWS Secret Key",
    regex: /aws[_-]?secret[_-]?access[_-]?key\s*[=:]\s*['"]\s*[a-zA-Z0-9+\/]{40}['"]/gi,
    description: "AWS secret access key detected"
  },
  // Generic secrets
  {
    name: "Secret",
    regex: /(?:secret|token)\s*[=:]\s*['"]\s*[a-zA-Z0-9_\-]{12,}['"]/gi,
    description: "Potential secret token detected"
  },
  // Private keys
  {
    name: "Private Key",
    regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
    description: "Private key detected"
  },
  // JWT tokens
  {
    name: "JWT Token",
    regex: /eyJ[a-zA-Z0-9_\-]*\.eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*/g,
    description: "JWT token detected"
  },
  // GitHub tokens
  {
    name: "GitHub Token",
    regex: /gh[pousr]_[A-Za-z0-9_]{36}/g,
    description: "GitHub token detected"
  }
];

// src/services/SecretScanner.ts
var SecretScanner = class {
  diagnosticCollection;
  allSecrets = /* @__PURE__ */ new Map();
  constructor(diagnosticCollection) {
    this.diagnosticCollection = diagnosticCollection;
  }
  getAllSecrets() {
    return this.allSecrets;
  }
  scanAllOpenDocuments() {
    vscode.workspace.textDocuments.forEach((document) => {
      if (document.uri.scheme === "file") {
        this.scanDocument(document);
      }
    });
  }
  scanDocument(document) {
    const skipExtensions = [".min.js", ".min.css", ".map", ".lock", ".log", ".jpg", ".png", ".gif", ".pdf", ".zip"];
    const skipLargeFiles = document.lineCount > 1e4;
    if (skipExtensions.some((ext) => document.fileName.endsWith(ext)) || skipLargeFiles) {
      return [];
    }
    const diagnostics = [];
    const secrets = [];
    const text = document.getText();
    const lines = text.split("\n");
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("#") || trimmedLine.startsWith("*") || trimmedLine.includes("example") || trimmedLine.includes("placeholder") || trimmedLine.includes("your_") || trimmedLine.includes("<YOUR_") || trimmedLine.includes("TODO") || trimmedLine.includes("FIXME")) {
        return;
      }
      SECRET_PATTERNS.forEach((pattern) => {
        let match;
        pattern.regex.lastIndex = 0;
        while ((match = pattern.regex.exec(line)) !== null) {
          const startPos = new vscode.Position(lineIndex, match.index);
          const endPos = new vscode.Position(lineIndex, match.index + match[0].length);
          const range = new vscode.Range(startPos, endPos);
          const diagnostic = new vscode.Diagnostic(
            range,
            `${pattern.description}: ${match[0]}`,
            vscode.DiagnosticSeverity.Warning
          );
          diagnostic.source = "Secret Scanner";
          diagnostic.code = pattern.name.toLowerCase().replace(/\s+/g, "-");
          diagnostics.push(diagnostic);
          secrets.push({
            uri: document.uri,
            line: lineIndex,
            column: match.index,
            message: `${pattern.description}: ${match[0]}`,
            secretType: pattern.name,
            range
          });
        }
      });
    });
    this.diagnosticCollection.set(document.uri, diagnostics);
    if (secrets.length > 0) {
      this.allSecrets.set(document.uri.fsPath, secrets);
    } else {
      this.allSecrets.delete(document.uri.fsPath);
    }
    return secrets;
  }
  clearDocument(uri) {
    this.diagnosticCollection.delete(uri);
    this.allSecrets.delete(uri.fsPath);
  }
  dispose() {
    this.diagnosticCollection.dispose();
  }
};

// src/services/CopilotService.ts
var vscode2 = __toESM(require("vscode"));
var path = __toESM(require("path"));
var CopilotService = class {
  async fixWithCopilot(warning) {
    try {
      const document = await vscode2.workspace.openTextDocument(warning.uri);
      const lineText = document.lineAt(warning.line).text;
      const startLine = Math.max(0, warning.line - 2);
      const endLine = Math.min(document.lineCount - 1, warning.line + 2);
      const contextLines = [];
      for (let i = startLine; i <= endLine; i++) {
        const prefix = i === warning.line ? "\u2192 " : "  ";
        contextLines.push(`${prefix}${i + 1}: ${document.lineAt(i).text}`);
      }
      const context = contextLines.join("\n");
      const fileName = path.basename(warning.uri.fsPath);
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
      const models = await vscode2.lm.selectChatModels({
        vendor: "copilot",
        family: "gpt-4"
      });
      if (models.length === 0) {
        await vscode2.commands.executeCommand("workbench.action.chat.open", {
          query: prompt
        });
        return;
      }
      const model = models[0];
      const messages = [
        vscode2.LanguageModelChatMessage.User(prompt)
      ];
      const chatResponse = await model.sendRequest(messages, {}, new vscode2.CancellationTokenSource().token);
      let response = "";
      for await (const fragment of chatResponse.text) {
        response += fragment;
      }
      await vscode2.commands.executeCommand("workbench.action.chat.open", {
        query: prompt
      });
    } catch (error) {
      console.error("Error communicating with Copilot:", error);
      const message = `How can I securely fix this hardcoded ${warning.secretType} on line ${warning.line + 1} for use in a local development environment?`;
      try {
        await vscode2.commands.executeCommand("workbench.action.chat.open", {
          query: message
        });
      } catch (chatError) {
        vscode2.window.showErrorMessage(
          "Unable to open Copilot Chat. Please make sure GitHub Copilot is installed and enabled.",
          "Learn More"
        ).then((selection) => {
          if (selection === "Learn More") {
            vscode2.env.openExternal(vscode2.Uri.parse("https://marketplace.visualstudio.com/items?itemName=GitHub.copilot"));
          }
        });
      }
    }
  }
  async askAboutSecret(warning) {
    try {
      const document = await vscode2.workspace.openTextDocument(warning.uri);
      const lineText = document.lineAt(warning.line).text;
      const startLine = Math.max(0, warning.line - 2);
      const endLine = Math.min(document.lineCount - 1, warning.line + 2);
      const contextLines = [];
      for (let i = startLine; i <= endLine; i++) {
        const prefix = i === warning.line ? "\u2192 " : "  ";
        contextLines.push(`${prefix}${i + 1}: ${document.lineAt(i).text}`);
      }
      const context = contextLines.join("\n");
      const fileName = path.basename(warning.uri.fsPath);
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
      const models = await vscode2.lm.selectChatModels({
        vendor: "copilot",
        family: "gpt-4"
      });
      if (models.length === 0) {
        await vscode2.commands.executeCommand("workbench.action.chat.open", {
          query: prompt
        });
        return;
      }
      const model = models[0];
      const messages = [
        vscode2.LanguageModelChatMessage.User(prompt)
      ];
      const chatResponse = await model.sendRequest(messages, {}, new vscode2.CancellationTokenSource().token);
      let response = "";
      for await (const fragment of chatResponse.text) {
        response += fragment;
      }
      await vscode2.commands.executeCommand("workbench.action.chat.open", {
        query: prompt
      });
    } catch (error) {
      console.error("Error communicating with Copilot:", error);
      const message = `I detected a hardcoded ${warning.secretType} on line ${warning.line + 1}. What is the security risk here and how should I fix it?`;
      try {
        await vscode2.commands.executeCommand("workbench.action.chat.open", {
          query: message
        });
      } catch (chatError) {
        vscode2.window.showErrorMessage(
          "Unable to open Copilot Chat. Please make sure GitHub Copilot is installed and enabled.",
          "Learn More"
        ).then((selection) => {
          if (selection === "Learn More") {
            vscode2.env.openExternal(vscode2.Uri.parse("https://marketplace.visualstudio.com/items?itemName=GitHub.copilot"));
          }
        });
      }
    }
  }
};

// src/providers/SecretsViewProvider.ts
var vscode4 = __toESM(require("vscode"));
var path2 = __toESM(require("path"));

// src/views/SecretTreeItem.ts
var vscode3 = __toESM(require("vscode"));
var SecretTreeItem = class extends vscode3.TreeItem {
  constructor(label, collapsibleState, warning, children) {
    super(label, collapsibleState);
    this.label = label;
    this.collapsibleState = collapsibleState;
    this.warning = warning;
    this.children = children;
    if (warning) {
      this.description = `Line ${warning.line + 1}`;
      this.tooltip = warning.message;
      this.command = {
        command: "secret-scanner.navigateToSecret",
        title: "Navigate to Secret",
        arguments: [warning]
      };
      this.contextValue = "secretWarning";
      this.iconPath = new vscode3.ThemeIcon("warning", new vscode3.ThemeColor("list.warningForeground"));
    } else {
      this.contextValue = "file";
      this.iconPath = new vscode3.ThemeIcon("file");
    }
  }
  children;
};

// src/providers/SecretsViewProvider.ts
var SecretsViewProvider = class {
  _onDidChangeTreeData = new vscode4.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  secrets = /* @__PURE__ */ new Map();
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  updateSecrets(secrets) {
    this.secrets = secrets;
    this.refresh();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      const fileItems = [];
      this.secrets.forEach((warnings, filePath) => {
        if (warnings.length > 0) {
          const fileName = path2.basename(filePath);
          const fileItem = new SecretTreeItem(
            fileName,
            vscode4.TreeItemCollapsibleState.Expanded,
            void 0
          );
          fileItem.description = `${warnings.length} warning${warnings.length > 1 ? "s" : ""}`;
          fileItem.tooltip = filePath;
          fileItem.resourceUri = vscode4.Uri.file(filePath);
          fileItem.children = warnings.map(
            (warning) => new SecretTreeItem(
              warning.secretType,
              vscode4.TreeItemCollapsibleState.None,
              warning
            )
          );
          fileItems.push(fileItem);
        }
      });
      if (fileItems.length === 0) {
        const noSecretsItem = new SecretTreeItem(
          "No secrets detected",
          vscode4.TreeItemCollapsibleState.None
        );
        noSecretsItem.iconPath = new vscode4.ThemeIcon("pass");
        return Promise.resolve([noSecretsItem]);
      }
      return Promise.resolve(fileItems);
    } else {
      return Promise.resolve(element.children || []);
    }
  }
};

// src/providers/SecretQuickFixProvider.ts
var vscode5 = __toESM(require("vscode"));
var SecretQuickFixProvider = class {
  static providedCodeActionKinds = [
    vscode5.CodeActionKind.QuickFix
  ];
  provideCodeActions(document, range, context, token) {
    const secretDiagnostics = context.diagnostics.filter(
      (diagnostic) => diagnostic.source === "Secret Scanner"
    );
    if (secretDiagnostics.length === 0) {
      return void 0;
    }
    const actions = [];
    for (const diagnostic of secretDiagnostics) {
      const warning = {
        uri: document.uri,
        line: diagnostic.range.start.line,
        column: diagnostic.range.start.character,
        message: diagnostic.message,
        secretType: this.extractSecretType(diagnostic.message),
        range: diagnostic.range
      };
      const explainAction = new vscode5.CodeAction(
        "\u{1F4AC} Explain security issue with Copilot",
        vscode5.CodeActionKind.QuickFix
      );
      explainAction.command = {
        command: "secret-scanner.askCopilot",
        title: "Explain Security Issue",
        arguments: [{ warning }]
      };
      explainAction.diagnostics = [diagnostic];
      explainAction.isPreferred = false;
      actions.push(explainAction);
      const fixAction = new vscode5.CodeAction(
        "\u{1F527} Fix with Copilot (local-environment ready)",
        vscode5.CodeActionKind.QuickFix
      );
      fixAction.command = {
        command: "secret-scanner.fixWithCopilot",
        title: "Fix with Copilot",
        arguments: [{ warning }]
      };
      fixAction.diagnostics = [diagnostic];
      fixAction.isPreferred = true;
      actions.push(fixAction);
    }
    return actions;
  }
  extractSecretType(message) {
    const match = message.match(/^(.+?)(?:\s+detected)?:/);
    if (match) {
      return match[1];
    }
    return "Secret";
  }
};

// src/utils/debounce.ts
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// src/extension.ts
var secretScanner;
var copilotService;
var secretsViewProvider;
function activate(context) {
  console.log("Secret Scanner extension is now active!");
  const diagnosticCollection = vscode6.languages.createDiagnosticCollection("secretScanner");
  context.subscriptions.push(diagnosticCollection);
  secretScanner = new SecretScanner(diagnosticCollection);
  copilotService = new CopilotService();
  secretsViewProvider = new SecretsViewProvider();
  const treeView = vscode6.window.createTreeView("secretScannerView", {
    treeDataProvider: secretsViewProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(treeView);
  registerCommands(context);
  secretScanner.scanAllOpenDocuments();
  secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
  registerEventListeners(context);
}
function registerCommands(context) {
  const navigateCommand = vscode6.commands.registerCommand(
    "secret-scanner.navigateToSecret",
    (warning) => {
      vscode6.workspace.openTextDocument(warning.uri).then((document) => {
        vscode6.window.showTextDocument(document).then((editor) => {
          const position = new vscode6.Position(warning.line, warning.column);
          editor.selection = new vscode6.Selection(warning.range.start, warning.range.end);
          editor.revealRange(warning.range, vscode6.TextEditorRevealType.InCenter);
        });
      });
    }
  );
  context.subscriptions.push(navigateCommand);
  const scanWorkspaceCommand = vscode6.commands.registerCommand(
    "secret-scanner.scanWorkspace",
    () => {
      secretScanner.scanAllOpenDocuments();
      secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
      vscode6.window.showInformationMessage("Secret scan completed!");
    }
  );
  context.subscriptions.push(scanWorkspaceCommand);
  const refreshCommand = vscode6.commands.registerCommand(
    "secret-scanner.refresh",
    () => {
      secretScanner.scanAllOpenDocuments();
      secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
    }
  );
  context.subscriptions.push(refreshCommand);
  const askCopilotCommand = vscode6.commands.registerCommand(
    "secret-scanner.askCopilot",
    async (itemOrArgs) => {
      const warning = "warning" in itemOrArgs ? itemOrArgs.warning : itemOrArgs.warning;
      if (!warning) {
        return;
      }
      await copilotService.askAboutSecret(warning);
    }
  );
  context.subscriptions.push(askCopilotCommand);
  const fixWithCopilotCommand = vscode6.commands.registerCommand(
    "secret-scanner.fixWithCopilot",
    async (itemOrArgs) => {
      const warning = "warning" in itemOrArgs ? itemOrArgs.warning : itemOrArgs.warning;
      if (!warning) {
        return;
      }
      await copilotService.fixWithCopilot(warning);
    }
  );
  context.subscriptions.push(fixWithCopilotCommand);
  const quickFixProvider = vscode6.languages.registerCodeActionsProvider(
    { scheme: "file" },
    new SecretQuickFixProvider(),
    {
      providedCodeActionKinds: SecretQuickFixProvider.providedCodeActionKinds
    }
  );
  context.subscriptions.push(quickFixProvider);
}
function registerEventListeners(context) {
  const onDidOpenTextDocument = vscode6.workspace.onDidOpenTextDocument((document) => {
    secretScanner.scanDocument(document);
    secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
  });
  context.subscriptions.push(onDidOpenTextDocument);
  const onDidChangeTextDocument = vscode6.workspace.onDidChangeTextDocument((event) => {
    debounce(() => {
      secretScanner.scanDocument(event.document);
      secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
    }, 500)();
  });
  context.subscriptions.push(onDidChangeTextDocument);
  const onDidCloseTextDocument = vscode6.workspace.onDidCloseTextDocument((document) => {
    secretScanner.clearDocument(document.uri);
    secretsViewProvider.updateSecrets(secretScanner.getAllSecrets());
  });
  context.subscriptions.push(onDidCloseTextDocument);
}
function deactivate() {
  if (secretScanner) {
    secretScanner.dispose();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
