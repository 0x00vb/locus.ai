# Notty - Cross-Platform Desktop Notes Application

A modern, minimalistic desktop notes application built with Electron, React, and TypeScript. Features a file-tree style organization system with keyboard-friendly navigation and clean interface.

## Features

- **Modern Stack**: Built with Electron, React, Vite, TypeScript, and TailwindCSS
- **File Tree Management**: Organize notes in folders with drag-and-drop support
- **Theme Support**: Light/Dark/System theme modes
- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Hot Reload**: Fast development with Vite's hot module replacement
- **Local Storage**: All notes stored locally with optional cloud sync (future)

## Tech Stack

- **Frontend**: React 18, TailwindCSS
- **Desktop Framework**: Electron 28
- **Build Tool**: Vite 5
- **State Management**: Zustand
- **Language**: TypeScript
- **Linting**: ESLint + Prettier
- **Package Manager**: npm workspaces

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd notty
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

This will start the Vite development server and launch the Electron app with hot reload enabled.

### Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production (all platforms)
npm run build

# Build for development (faster, unpackaged)
npm run build:all

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type check without building
npm run type-check

# Clean all build artifacts
npm run clean
```

## Project Structure

```
notty/
├── packages/
│   ├── core/                 # Shared utilities and types
│   │   ├── src/
│   │   │   ├── types.ts     # TypeScript interfaces
│   │   │   ├── store.ts     # Zustand state management
│   │   │   ├── utils.ts     # Utility functions
│   │   │   └── index.ts     # Package exports
│   │   └── package.json
│   │
│   └── app/                  # Main Electron application
│       ├── electron/
│       │   ├── main.ts      # Electron main process
│       │   └── preload.ts   # Preload script for IPC
│       ├── src/
│       │   ├── App.tsx      # Main React component
│       │   ├── main.tsx     # React entry point
│       │   └── index.css    # TailwindCSS styles
│       ├── public/          # Static assets
│       ├── vite.config.ts   # Vite configuration
│       ├── tailwind.config.js
│       └── package.json
│
├── package.json             # Root package.json (monorepo)
├── tsconfig.json           # Root TypeScript config
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
└── README.md
```

## Building for Production

### Build for Current Platform
```bash
npm run build
```

This creates distributable packages in `packages/app/build/`.

### Build for Specific Platforms

The build configuration supports:
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG package (.dmg) for x64 and ARM64
- **Linux**: AppImage and Debian package (.deb)

### Manual Distribution Build
```bash
cd packages/app
npm run build:dir  # Creates unpacked directory for testing
npm run dist       # Creates distribution packages
```

## Configuration

### Application Settings

The app includes settings for:
- Theme (Light/Dark/System)
- Font size and family
- Editor width
- Auto-save interval
- Spell check toggle

### Build Configuration

Electron-builder configuration is in `packages/app/package.json` under the `build` field. You can customize:
- App ID and product name
- Icons and assets
- Target platforms and formats
- Code signing (when configured)

## Development Guidelines

### Adding New Features

1. **Types**: Add TypeScript interfaces to `packages/core/src/types.ts`
2. **State**: Extend the Zustand store in `packages/core/src/store.ts`
3. **Components**: Create React components in `packages/app/src/components/`
4. **Utilities**: Add shared functions to `packages/core/src/utils.ts`

### Code Quality

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **Husky** (can be added) for git hooks

Run `npm run lint:fix` and `npm run format` before committing.

## Troubleshooting

### Common Issues

1. **Build Errors**: Run `npm run clean` and reinstall dependencies
2. **TypeScript Errors**: Check `tsconfig.json` configurations in each package
3. **Electron Issues**: Ensure Electron version matches in all configs
4. **Hot Reload Not Working**: Restart the dev server

### Platform-Specific Notes

- **Linux**: May require additional dependencies for proper rendering
- **macOS**: Code signing required for distribution
- **Windows**: May need Visual Studio Build Tools for native modules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] Markdown editor with live preview
- [ ] Search functionality
- [ ] File attachments support
- [ ] Cloud synchronization
- [ ] Plugin system
- [ ] Keyboard shortcuts customization
- [ ] Export/import features 