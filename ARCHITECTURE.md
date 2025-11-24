# Secret Scanner Extension - Architecture Documentation

## Overview
This document describes the modular, OOP-based architecture of the Secret Scanner VS Code extension.

## Project Structure

```
src/
├── extension.ts                 # Entry point - orchestrates services and registers commands
├── models/                      # Data models and interfaces
│   ├── SecretPattern.ts        # Interface for secret detection patterns
│   └── SecretWarning.ts        # Interface for detected secret warnings
├── constants/                   # Configuration and constants
│   └── secretPatterns.ts       # Array of regex patterns for detecting secrets
├── services/                    # Business logic services
│   ├── SecretScanner.ts        # Core scanning logic and diagnostics management
│   └── CopilotService.ts       # GitHub Copilot integration service
├── providers/                   # VS Code providers
│   └── SecretsViewProvider.ts  # TreeView data provider for sidebar
├── views/                       # View components
│   └── SecretTreeItem.ts       # TreeView item representation
└── utils/                       # Utility functions
    └── debounce.ts             # Debounce utility for performance
```

## Architecture Principles

### 1. Separation of Concerns
Each file has a single, well-defined responsibility:
- **Models**: Define data structures
- **Constants**: Store configuration
- **Services**: Implement business logic
- **Providers**: Handle VS Code integration
- **Views**: Manage UI components
- **Utils**: Provide helper functions

### 2. Object-Oriented Design
- Services encapsulate related functionality in classes
- Clear interfaces for data models
- Dependency injection for testability

### 3. Modularity
- Easy to add new features without modifying existing code
- Components can be tested independently
- Clear import/export boundaries

## Component Responsibilities

### extension.ts (~130 lines)
**Purpose**: Entry point that orchestrates the extension

**Responsibilities**:
- Initialize services (SecretScanner, CopilotService)
- Create TreeView with SecretsViewProvider
- Register all commands
- Set up event listeners
- Coordinate between components

**Key Functions**:
- `activate()`: Extension initialization
- `registerCommands()`: Command registration
- `registerEventListeners()`: Event listener setup
- `deactivate()`: Cleanup

### models/SecretPattern.ts
**Purpose**: Define the structure of secret detection patterns

**Interface**:
```typescript
interface SecretPattern {
    name: string;           // Display name (e.g., "API Key")
    regex: RegExp;          // Detection pattern
    description: string;    // Human-readable description
}
```

### models/SecretWarning.ts
**Purpose**: Define the structure of detected secrets

**Interface**:
```typescript
interface SecretWarning {
    uri: vscode.Uri;        // File URI
    line: number;           // Line number (0-indexed)
    column: number;         // Column number
    message: string;        // Warning message
    secretType: string;     // Type of secret detected
    range: vscode.Range;    // VS Code range object
}
```

### constants/secretPatterns.ts
**Purpose**: Store all secret detection patterns

**Contains**: Array of 10 SecretPattern objects detecting:
- API Keys
- Bearer Tokens
- Passwords
- Database URLs
- AWS Credentials
- Generic Secrets
- Private Keys
- JWT Tokens
- GitHub Tokens

### services/SecretScanner.ts (~115 lines)
**Purpose**: Core scanning functionality

**Class**: `SecretScanner`

**Properties**:
- `diagnosticCollection`: VS Code diagnostic collection
- `allSecrets`: Map of file paths to detected secrets

**Methods**:
- `scanDocument(document)`: Scan a single document
- `scanAllOpenDocuments()`: Scan all open files
- `getAllSecrets()`: Get all detected secrets
- `clearDocument(uri)`: Clear diagnostics for a file
- `dispose()`: Cleanup

**Features**:
- Skips binary files and large files
- Filters out false positives (comments, examples)
- Updates both Problems panel and secrets map

### services/CopilotService.ts (~90 lines)
**Purpose**: GitHub Copilot integration

**Class**: `CopilotService`

**Methods**:
- `askAboutSecret(warning)`: Open Copilot chat with context

**Features**:
- Extracts code context (±2 lines)
- Builds detailed security analysis prompt
- Uses VS Code Chat API
- Multiple fallback strategies
- Error handling for missing Copilot

### providers/SecretsViewProvider.ts (~70 lines)
**Purpose**: Provide data for the sidebar TreeView

**Class**: `SecretsViewProvider` implements `TreeDataProvider<SecretTreeItem>`

**Properties**:
- `secrets`: Map of file paths to warnings
- `_onDidChangeTreeData`: Event emitter for updates

**Methods**:
- `refresh()`: Trigger UI update
- `updateSecrets(secrets)`: Update internal state
- `getTreeItem(element)`: Return tree item
- `getChildren(element)`: Return hierarchical data

**Features**:
- Two-level hierarchy (files → warnings)
- Shows count of warnings per file
- "No secrets detected" message when clean

### views/SecretTreeItem.ts (~30 lines)
**Purpose**: Represent items in the TreeView

**Class**: `SecretTreeItem` extends `vscode.TreeItem`

**Properties**:
- `children`: Child items (for file nodes)
- `warning`: Associated SecretWarning (for warning nodes)

**Features**:
- Click-to-navigate command
- Contextual icons (warning, file, pass)
- Tooltips and descriptions

### utils/debounce.ts (~10 lines)
**Purpose**: Debounce function for performance optimization

**Function**: `debounce(func, wait)`

**Usage**: Prevents excessive scanning on rapid document changes

## Data Flow

### 1. Scanning Flow
```
Document Change Event
  ↓
extension.ts (event listener)
  ↓
SecretScanner.scanDocument()
  ↓
- Parse document line by line
- Apply regex patterns from constants/secretPatterns
- Create SecretWarning objects
- Update diagnosticCollection (Problems panel)
- Update allSecrets map
  ↓
SecretsViewProvider.updateSecrets()
  ↓
TreeView UI updates
```

### 2. Navigation Flow
```
User clicks warning in sidebar
  ↓
SecretTreeItem.command (navigateToSecret)
  ↓
extension.ts command handler
  ↓
Open document and jump to line
```

### 3. Copilot Integration Flow
```
User clicks chat icon on warning
  ↓
SecretTreeItem context menu (askCopilot)
  ↓
extension.ts command handler
  ↓
CopilotService.askAboutSecret()
  ↓
- Extract code context
- Build security prompt
- Open Copilot Chat with question
```

## Benefits of This Architecture

### Maintainability
- Clear file organization makes code easy to find
- Single Responsibility Principle reduces complexity
- Changes are localized to specific files

### Testability
- Services can be unit tested independently
- Mock dependencies easily (e.g., mock diagnosticCollection)
- Clear interfaces for mocking

### Extensibility
- Add new secret patterns in constants/secretPatterns.ts
- Add new detection methods in SecretScanner
- Add new commands in extension.ts
- Add new Copilot features in CopilotService

### Readability
- Main entry point (extension.ts) is now ~130 lines vs 370 lines
- Each file has a clear, focused purpose
- Import statements document dependencies

## Comparison: Before vs After

### Before (Monolithic)
- Single file: 370 lines
- All logic mixed together
- Hard to navigate
- Difficult to test individual components

### After (Modular)
- 10 focused files
- Largest file: ~130 lines (extension.ts)
- Clear separation of concerns
- Each component independently testable
- Easy to understand and maintain

## Future Enhancements

With this architecture, you can easily:

1. **Add new services**: Create new files in `services/` for additional features
2. **Add new patterns**: Edit `constants/secretPatterns.ts`
3. **Add new views**: Create new providers in `providers/` and views in `views/`
4. **Add unit tests**: Create parallel test structure mirroring `src/`
5. **Add configuration**: Create new files in `constants/` for user settings

## Development Guidelines

1. **Adding a new feature**: Determine which layer it belongs to (model, service, provider, view)
2. **Modifying existing features**: Locate the appropriate file based on responsibility
3. **Testing**: Test services independently before integration
4. **Documentation**: Update this file when adding new major components
