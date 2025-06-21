# Notty - Cross-Platform Desktop Notes Application

A modern, cross-platform desktop notes application built with Electron, React, and TypeScript, following Screaming Architecture principles.

## 🏗️ Architecture Overview

This project follows **Screaming Architecture** principles, where the folder structure immediately reveals what the application does, not what technology it uses.

### 📁 Directory Structure

```
packages/
├── app/                    # Electron application bootstrap
│   ├── main/              # Electron main process
│   │   └── main.ts        # Main process entry point
│   ├── preload/           # Electron preload scripts  
│   │   └── preload.ts     # Preload script for renderer
│   ├── renderer/          # React renderer application
│   │   ├── App.tsx        # Main React application
│   │   ├── index.tsx      # React DOM entry point
│   │   ├── main.css       # Global styles
│   │   └── preload.d.ts   # TypeScript definitions
│   └── package.json       # Electron app dependencies

├── domains/               # Core business domains (what the app does)
│   ├── editor/            # Note editing domain
│   │   ├── operations.ts  # Editor business operations
│   │   ├── editor.tsx     # Editor component
│   │   └── types.ts       # Editor domain types
│   ├── fileSystem/        # File system management domain
│   │   └── filesystem.ts  # File operations and management
│   └── workspace/         # Workspace management domain
│       ├── store.ts       # Workspace state management
│       ├── operations.ts  # Workspace operations
│       └── types.ts       # Workspace domain types

├── features/              # User-facing features (how users interact)
│   ├── tabs/              # Tab management feature
│   │   └── TabbedNoteEditor.tsx
│   ├── treeView/          # File tree navigation feature
│   │   ├── TreeView.tsx   # Tree view component
│   │   ├── context-menu.ts
│   │   ├── creation.ts
│   │   ├── rename.ts
│   │   └── types.ts
│   ├── tabBar/            # Tab bar and sidebar features
│   │   ├── TabBar.tsx
│   │   ├── TabItem.tsx
│   │   ├── drag-drop.ts
│   │   ├── resize.ts
│   │   └── types.ts
│   ├── statusBar/         # Status bar feature
│   │   └── StatusBar.tsx
│   └── terminal/          # Integrated terminal feature
│       ├── terminal-view.tsx
│       └── terminal-hooks.ts

├── shared/                # Reusable components and utilities
│   ├── components/        # Generic UI components
│   │   ├── TitleBar.tsx
│   │   ├── ContextMenu.tsx
│   │   ├── CreateInput.tsx
│   │   ├── RenameInput.tsx
│   │   ├── ResizeHandle.tsx
│   │   └── SlideUpPanel.tsx
│   ├── hooks/             # Reusable React hooks
│   ├── utils/             # Utility functions and types
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── workspace.ts
│   ├── theme/             # Theme management
│   │   └── ThemeProvider.tsx
│   └── services/          # Shared services
│       ├── lsp-server.ts  # Language Server Protocol
│       └── terminal.ts    # Terminal service

└── config/                # Project-wide configuration
    ├── vite.config.ts     # Vite build configuration
    ├── tailwind.config.js # Tailwind CSS configuration
    ├── postcss.config.js  # PostCSS configuration
    └── tsconfig.app.json  # TypeScript configuration
```

## 🎯 Architectural Principles

### Screaming Architecture
- **Domain-driven structure**: The folder names scream what the application does (notes, workspace, file management)
- **Feature-based organization**: User-facing capabilities are clearly separated
- **Technology-agnostic naming**: Folders represent business concepts, not frameworks

### Module Organization

#### 🏢 **Domains** (`packages/domains/`)
Core business logic and rules. These represent the fundamental concepts of what Notty does:
- **Editor**: Everything related to note editing and content management
- **FileSystem**: File operations, paths, and storage management  
- **Workspace**: Workspace state, configuration, and management

#### ⚡ **Features** (`packages/features/`)
User-facing functionality. These represent how users interact with the application:
- **TreeView**: File tree navigation and folder management
- **Tabs**: Tab management and navigation
- **TabBar**: Tab bar UI and sidebar resizing
- **StatusBar**: Application status display
- **Terminal**: Integrated terminal functionality

#### 🧱 **Shared** (`packages/shared/`)
Reusable components, utilities, and services:
- **Components**: Generic UI components used across features
- **Hooks**: Reusable React hooks
- **Utils**: Utility functions and shared types
- **Theme**: Theme management and styling
- **Services**: Shared services (LSP, terminal backend)

#### ⚙️ **Config** (`packages/config/`)
Build tools and project-wide configuration files

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code  
npm run format
```

## 🛠️ Development Guide

### Adding a New Feature

When adding a new user-facing feature:

1. **Create the feature directory**: `packages/features/newFeature/`
2. **Add the main component**: `packages/features/newFeature/NewFeature.tsx`
3. **Create supporting files**: hooks, types, operations as needed
4. **Export from index**: `packages/features/newFeature/index.ts`
5. **Import in App.tsx**: Use the `@features/newFeature` alias

### Adding a New Domain

When adding new business logic:

1. **Create the domain directory**: `packages/domains/newDomain/`
2. **Add core logic**: operations, state management, types
3. **Export from index**: `packages/domains/newDomain/index.ts` 
4. **Import where needed**: Use the `@domains/newDomain` alias

### Adding Shared Components

For reusable UI components:

1. **Add to shared**: `packages/shared/components/NewComponent.tsx`
2. **Export from index**: Update `packages/shared/components/index.ts`
3. **Import anywhere**: Use `@shared/components`

## 🎨 Import Aliases

The project uses TypeScript path mapping for clean imports:

```typescript
// Domains (business logic)
import { useAppStore } from '@domains/workspace';
import { NoteOperations } from '@domains/editor';

// Features (user interactions)  
import { TreeView } from '@features/treeView';
import { StatusBar } from '@features/statusBar';

// Shared utilities
import { TitleBar } from '@shared/components';
import { useTerminal } from '@shared/hooks';

// App-specific
import { SomeComponent } from '@app/renderer';

// Configuration
import { tailwindConfig } from '@config/tailwind.config';
```

## 📝 Key Benefits

1. **Immediate Understanding**: New developers can quickly understand what the app does
2. **Feature Isolation**: Features are self-contained and easy to modify
3. **Domain Clarity**: Business logic is separated from UI concerns
4. **Scalability**: Easy to add new features or domains without restructuring
5. **Maintainability**: Clear boundaries make refactoring safer

## 🔧 Configuration

### Path Mapping
TypeScript path mapping is configured in:
- `tsconfig.json` (root level)
- `packages/config/vite.config.ts` (build time)

### Build System
- **Vite**: Fast development and build tool
- **Electron Builder**: Cross-platform app packaging
- **TypeScript**: Type safety and enhanced developer experience

## 📚 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron 28
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand (in workspace domain)
- **Build Tool**: Vite 5
- **Code Quality**: ESLint + Prettier

## 🤝 Contributing

When contributing:

1. Follow the established architectural patterns
2. Place new code in the appropriate domain/feature/shared directory
3. Use the established import aliases
4. Update this README if you add new architectural concepts

## 📄 License

MIT License - see LICENSE file for details 