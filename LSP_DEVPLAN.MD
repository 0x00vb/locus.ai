I want you to fully implement an automatic, modular, and non-intrusive Lazy LSP Installer system for this Electron + React IDE, following the existing codebase structure, and without breaking any current features or affecting the UI unless explicitly specified.
✅ GOAL

Enhance the IDE so that when a user opens a file:

    The file’s language is detected (via file extension).

    If the corresponding LSP is not yet installed, a status bar button appears prompting the user to install IntelliSense for that language.

    Upon installation, the LSP is registered, persisted, and loaded automatically.

    The system should be modular, performant, scalable, and maintain the existing lightweight bundle size and responsiveness.

📦 FEATURES TO IMPLEMENT
1. Language Detection on File Open

    Add a utility module (e.g. language/detectLanguage.ts) that maps file extensions (e.g. .ts, .py, .go) to supported language names.

    Integrate detection logic into the file open flow (likely in Editor.tsx or similar).

2. Installed LSP Check

    Extend or create a LspRegistry service/module that:

        Keeps track of which LSPs are installed.

        Persists this to a config file (.lsp-registry.json or similar).

        Provides methods like:

        isInstalled(language: string): boolean;
        getInstalledLanguages(): string[];
        register(language: string, path: string): void;

3. Status Bar Integration

    In the StatusBar component:

        Display a button like [Install Go IntelliSense] if a file is opened for a language whose LSP is not installed.

        Auto-hide this button once the LSP is installed.

        Call LspInstaller.install(language) on click.

4. LSP Installer System

    Create a new module lsp/installer.ts or services/LspInstaller.ts.

    For each language, provide installation logic that:

        Assumes language runtime is present (e.g., go, python, etc.).

        Spawns a child process (e.g. go install gopls@latest).

        Detects success/failure and logs errors cleanly.

    Example:

async function installGoLsp(): Promise<void> {
  await runCommand('go', ['install', 'golang.org/x/tools/gopls@latest']);
}

Wrap all installers behind:

    async function install(language: string): Promise<void>;

    Use modular, per-language installer definitions (installers/go.ts, installers/python.ts, etc).

5. Post-Install Hook

    After install, auto-register and boot the LSP for the currently opened file.

    Refresh the status bar to hide the install button.

6. Config & Persistence

    Save installed LSPs in a JSON config file (e.g., ~/.your-ide/lsp-config.json).

    Load this at IDE startup to pre-register already installed LSPs.

7. Safety & UX

    Prevent duplicate installations.

    Show meaningful error messages in case of:

        Missing language runtime (e.g., go not found)

        Installation errors

    Non-blocking: no freezes or UI delays during install.

📁 PROJECT STRUCTURE RESPECT

    Keep all modules within the correct domains/, features/, or services/ directories according to the existing Screaming Architecture structure.

    Ensure LspManager remains the central point of LSP control.

    Status bar changes should only affect the existing StatusBar component and use reactive state.

🔒 NON-NEGOTIABLE CONSTRAINTS

    ❌ Do not modify or break any current UI components or behavior.

    ✅ Use modular, clean code — no tight coupling.

    ⚡ Keep performance snappy — don’t block the UI thread.

    📦 Avoid adding unnecessary libraries or bloating bundle size.

    🧪 Prefer integration over duplication — reuse LSP management logic where possible.

📘 BONUS (Optional)

    Log installs and LSP failures to a lightweight console or .log file.

    Add ability to uninstall LSPs in future.