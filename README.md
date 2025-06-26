# 🗒️ Notty - Cross-Platform Desktop Notes Application

A beautiful, modern notes application built with Electron, React, and TypeScript. Featuring a powerful file tree manager and Monaco editor for an exceptional note-taking experience.

## ✨ Features

- **Rich Text Editor**: Monaco editor with syntax highlighting for multiple languages
- **File Tree Manager**: Intuitive folder structure with drag-and-drop support
- **Multi-Tab Interface**: Work with multiple notes simultaneously  
- **Integrated Terminal**: Built-in terminal for development workflows
- **Cross-Platform**: Windows, macOS, and Linux support
- **Auto-Save**: Never lose your work with automatic saving
- **Modern UI**: Clean, responsive interface with dark/light mode
- **Workspace Management**: Easy switching between different note collections

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/notty/notty.git
cd notty
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run electron:dev
```

4. **Build for production**
```bash
npm run build
```

## 🎯 Usage

### Basic Operations
- **Create Note**: Click the "+" button in the file tree or use `Ctrl+N`
- **Create Folder**: Right-click in file tree > "New Folder" 
- **Save**: `Ctrl+S` or auto-save (enabled by default)
- **Format Code**: `Ctrl+Shift+I` 

### File Organization
- Drag and drop files/folders to reorganize
- Use nested folders for complex projects
- Search across all files with `Ctrl+Shift+F`

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron 
- **Editor**: Monaco Editor (VS Code editor core)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Build Tool**: Vite

### Project Structure
```
notty/
├── packages/
│   ├── app/              # Main Electron app
│   │   ├── main/         # Electron main process
│   │   ├── preload/      # Preload scripts
│   │   ├── renderer/     # React frontend
│   │   │   ├── components/
│   │   │   ├── editor/   # Monaco editor
│   │   │   ├── hooks/
│   │   │   └── store/
│   │   └── package.json
│   ├── shared/           # Shared utilities
│   └── config/           # Build configuration
└── package.json
```

## ⚡ Performance

- **Startup**: ~800ms cold boot
- **Memory**: ~300MB with multiple files open
- **File Loading**: Instant for files under 10MB
- **Search**: Sub-second across thousands of files

## 🐛 Troubleshooting

- **App won't start**: Ensure Node.js v18+ is installed
- **Missing dependencies**: Run `npm install` in root directory
- **Build errors**: Clear cache with `npm run clean` then rebuild

### Development Testing

```bash
# 1. Create a test note with some content
# 2. Test file tree operations (create, rename, delete)
# 3. Verify terminal functionality
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the excellent code editor
- [Electron](https://www.electronjs.org/) for cross-platform desktop support
- [React](https://reactjs.org/) for the UI framework

---

**Note**: The application provides basic syntax highlighting and editing features. For advanced development features, consider using dedicated IDEs or editors with full language server support. 