import * as pty from 'node-pty';
import * as os from 'node:os';

export interface TerminalOptions {
  cols: number;
  rows: number;
  cwd?: string;
}

export class TerminalService {
  private terminals: Map<string, pty.IPty> = new Map();

  /**
   * Get the default shell for the current platform
   */
  private getDefaultShell(): string {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Try PowerShell first, then cmd
      return process.env.SHELL || 'powershell.exe';
    } else {
      // Unix-like systems (Linux, macOS)
      return process.env.SHELL || '/bin/bash';
    }
  }

  /**
   * Get shell arguments for the current platform
   */
  private getShellArgs(): string[] {
    const platform = os.platform();
    
    if (platform === 'win32') {
      const shell = this.getDefaultShell();
      if (shell.includes('powershell')) {
        return ['-NoLogo'];
      }
      return [];
    }
    
    return [];
  }

  /**
   * Create a new terminal session
   */
  createTerminal(id: string, options: TerminalOptions): string {
    try {
      const shell = this.getDefaultShell();
      const shellArgs = this.getShellArgs();
      
      const terminal = pty.spawn(shell, shellArgs, {
        name: 'xterm-color',
        cols: options.cols,
        rows: options.rows,
        cwd: options.cwd || process.cwd(),
        env: process.env,
      });

      this.terminals.set(id, terminal);
      return id;
    } catch (error) {
      console.error('Failed to create terminal:', error);
      throw error;
    }
  }

  /**
   * Write data to terminal
   */
  writeToTerminal(id: string, data: string): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.write(data);
    }
  }

  /**
   * Resize terminal
   */
  resizeTerminal(id: string, cols: number, rows: number): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.resize(cols, rows);
    }
  }

  /**
   * Set up terminal data listener
   */
  onTerminalData(id: string, callback: (data: string) => void): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.onData(callback);
    }
  }

  /**
   * Set up terminal exit listener
   */
  onTerminalExit(id: string, callback: (code: number, signal?: number) => void): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.onExit((e) => callback(e.exitCode, e.signal));
    }
  }

  /**
   * Close terminal
   */
  closeTerminal(id: string): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      // Graceful termination first
      terminal.kill('SIGTERM');
      
      // Force kill after timeout if process doesn't terminate cleanly
      const forceKillTimeout = setTimeout(() => {
        // Check if terminal still exists in our map (indicates it hasn't been properly closed)
        if (this.terminals.has(id)) {
          terminal.kill('SIGKILL');
        }
      }, 3000);
      
      // Clean up the timeout if terminal exits normally
      terminal.onExit(() => {
        clearTimeout(forceKillTimeout);
      });
      
      this.terminals.delete(id);
    }
  }

  /**
   * Close all terminals
   */
  closeAllTerminals(): void {
    for (const [, terminal] of this.terminals) {
      terminal.kill();
    }
    this.terminals.clear();
  }

  /**
   * Get list of active terminal IDs
   */
  getActiveTerminals(): string[] {
    return Array.from(this.terminals.keys());
  }
} 