/**
 * LSP Server Management Service
 * 
 * This service runs in the Electron main process and manages language server instances.
 * It provides a WebSocket-based communication bridge between Monaco Editor in the renderer
 * and actual LSP servers running as Node.js child processes.
 * 
 * Architecture:
 * - Each language server runs as a separate child process
 * - Communication happens via stdin/stdout (LSP standard)
 * - WebSocket server bridges between renderer and LSP servers
 * - Lazy loading: servers start only when needed
 * - Cleanup: servers stop when no longer needed
 */

import { spawn, ChildProcess } from 'child_process';
import { WebSocketServer, WebSocket } from 'ws';
import * as path from 'path';
import { app } from 'electron';
import type { IncomingMessage } from 'http';

export interface LSPServerConfig {
  language: string;
  command: string;
  args: string[];
  initOptions?: any;
}

export interface LSPServerInstance {
  process: ChildProcess;
  clients: Set<WebSocket>;
  lastUsed: number;
  config: LSPServerConfig;
}

export class LSPServerManager {
  private servers = new Map<string, LSPServerInstance>();
  private wsServer?: WebSocketServer;
  private cleanupInterval?: NodeJS.Timeout;
  private readonly SERVER_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  // Supported language server configurations
  private readonly serverConfigs: Record<string, LSPServerConfig> = {
    typescript: {
      language: 'typescript',
      command: 'typescript-language-server',
      args: ['--stdio'],
      initOptions: {
        preferences: {
          includeCompletionsForModuleExports: true,
          includeCompletionsForImportStatements: true,
        },
      },
    },
    javascript: {
      language: 'javascript',
      command: 'typescript-language-server',
      args: ['--stdio'],
      initOptions: {
        preferences: {
          includeCompletionsForModuleExports: true,
          includeCompletionsForImportStatements: true,
        },
      },
    },
    python: {
      language: 'python',
      command: 'pyright-langserver',
      args: ['--stdio'],
      initOptions: {
        settings: {
          python: {
            analysis: {
              typeCheckingMode: 'basic',
              autoSearchPaths: true,
            },
          },
        },
      },
    },
  };

  constructor() {
    this.setupCleanupTimer();
  }

  /**
   * Initialize the WebSocket server for LSP communication
   */
  async initialize(port: number = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      this.wsServer = new WebSocketServer({ port }, () => {
        const actualPort = (this.wsServer!.address() as any)?.port;
        console.log(`LSP WebSocket server started on port ${actualPort}`);
        resolve(actualPort);
      });

      this.wsServer.on('error', (error: Error) => {
        console.error('LSP WebSocket server error:', error);
        reject(error);
      });

      this.wsServer.on('connection', (ws: WebSocket, request: IncomingMessage) => {
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const language = url.searchParams.get('language');
        
        if (!language || !this.serverConfigs[language]) {
          ws.close(1002, `Unsupported language: ${language}`);
          return;
        }

        this.handleClientConnection(ws, language);
      });
    });
  }

  /**
   * Handle new client connection from renderer process
   */
  private async handleClientConnection(ws: WebSocket, language: string) {
    try {
      const server = await this.getOrCreateServer(language);
      server.clients.add(ws);
      server.lastUsed = Date.now();

      // Forward messages between client and LSP server
      ws.on('message', (data: Buffer) => {
        if (server.process.stdin) {
          const message = JSON.parse(data.toString());
          server.process.stdin.write(JSON.stringify(message) + '\n');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        server.clients.delete(ws);
        console.log(`Client disconnected from ${language} LSP server`);
      });

      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for ${language}:`, error);
        server.clients.delete(ws);
      });

      console.log(`Client connected to ${language} LSP server`);
    } catch (error) {
      console.error(`Failed to connect client to ${language} LSP server:`, error);
      ws.close(1011, 'Server error');
    }
  }

  /**
   * Get existing server or create new one
   */
  private async getOrCreateServer(language: string): Promise<LSPServerInstance> {
    let server = this.servers.get(language);
    
    if (!server || server.process.killed) {
      server = await this.createServer(language);
      this.servers.set(language, server);
    }

    return server;
  }

  /**
   * Create a new LSP server instance
   */
  private async createServer(language: string): Promise<LSPServerInstance> {
    const config = this.serverConfigs[language];
    if (!config) {
      throw new Error(`No configuration found for language: ${language}`);
    }

    console.log(`Starting ${language} language server...`);

    // Try to find the language server binary
    const command = this.findLanguageServerBinary(config.command);
    
    const childProcess = spawn(command, config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    const server: LSPServerInstance = {
      process: childProcess,
      clients: new Set(),
      lastUsed: Date.now(),
      config,
    };

    // Handle server output and forward to clients
    let buffer = '';
    childProcess.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            // Broadcast message to all connected clients
            server.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
              }
            });
          } catch (error) {
            console.error(`Failed to parse LSP message for ${language}:`, error);
          }
        }
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`${language} LSP server stderr:`, data.toString());
    });

    childProcess.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      console.log(`${language} LSP server exited with code ${code}, signal ${signal}`);
      this.servers.delete(language);
    });

    childProcess.on('error', (error: Error) => {
      console.error(`${language} LSP server error:`, error);
      this.servers.delete(language);
    });

    return server;
  }

  /**
   * Find the language server binary path
   */
  private findLanguageServerBinary(command: string): string {
    // In packaged app, look in node_modules/.bin
    if (app.isPackaged) {
      const binPath = path.join(process.resourcesPath, 'app', 'node_modules', '.bin', command);
      return binPath;
    }
    
    // In development, use the command directly (assumes it's in PATH or node_modules/.bin)
    return command;
  }

  /**
   * Setup cleanup timer to stop unused servers
   */
  private setupCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [language, server] of this.servers.entries()) {
        if (server.clients.size === 0 && 
            now - server.lastUsed > this.SERVER_TIMEOUT) {
          console.log(`Stopping unused ${language} LSP server`);
          this.stopServer(language);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop a specific language server
   */
  private stopServer(language: string) {
    const server = this.servers.get(language);
    if (server) {
      server.process.kill();
      server.clients.forEach(client => client.close());
      this.servers.delete(language);
    }
  }

  /**
   * Get the WebSocket port
   */
  getPort(): number | undefined {
    return (this.wsServer?.address() as any)?.port;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return language in this.serverConfigs;
  }

  /**
   * Cleanup all servers and WebSocket server
   */
  async cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Stop all language servers
    for (const language of this.servers.keys()) {
      this.stopServer(language);
    }

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }
  }
} 