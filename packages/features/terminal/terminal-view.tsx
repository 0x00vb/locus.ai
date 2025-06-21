import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalViewProps {
  className?: string;
  workspaceDirectory?: string;
}

let terminalCounter = 0;

export function TerminalView({ className = '', workspaceDirectory }: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const terminalIdRef = useRef<string>('');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeTerminal = useCallback(async () => {
    if (!terminalRef.current) {
      console.error('Terminal ref not available');
      return;
    }

    try {
      console.log('Initializing terminal...');
      console.log('Window API available:', !!window.api);
      console.log('Terminal API available:', !!window.api?.terminal);

      // Create xterm instance
      const terminal = new Terminal({
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
        cursorBlink: true,
        scrollback: 1000,
      });

      // Create fit addon
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      // Open terminal in DOM
      terminal.open(terminalRef.current);
      
      // Fit terminal to container
      fitAddon.fit();

      // Store references
      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Generate unique terminal ID
      terminalCounter++;
      const terminalId = `terminal-${terminalCounter}`;
      terminalIdRef.current = terminalId;

      // Check if terminal API is available
      if (!window.api?.terminal) {
        throw new Error('Terminal API not available');
      }

      console.log('Creating backend terminal with ID:', terminalId);

      // Create backend terminal
      await window.api.terminal.create(terminalId, {
        cols: terminal.cols,
        rows: terminal.rows,
        cwd: workspaceDirectory, // Use workspace directory
      });

      console.log('Backend terminal created successfully');

      // Set up data handlers
      terminal.onData((data) => {
        console.log('Terminal input:', data);
        window.api.terminal.write(terminalId, data);
      });

      // Set up backend data listener
      window.api.terminal.onData((id, data) => {
        console.log('Terminal output:', id, data);
        if (id === terminalId && terminal) {
          terminal.write(data);
        }
      });

      // Set up exit listener
      window.api.terminal.onExit((id, code, signal) => {
        console.log('Terminal exit:', id, code, signal);
        if (id === terminalId) {
          terminal.write(`\r\n[Process exited with code ${code}]\r\n`);
        }
      });

      // Focus terminal
      terminal.focus();
      setIsReady(true);

    } catch (error) {
      console.error('Failed to initialize terminal:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize terminal');
    }
  }, []);

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current && terminalIdRef.current) {
      // Debounce resize to avoid excessive calls
      setTimeout(() => {
        fitAddonRef.current?.fit();
        if (xtermRef.current && terminalIdRef.current) {
          window.api.terminal.resize(
            terminalIdRef.current,
            xtermRef.current.cols,
            xtermRef.current.rows
          );
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;
    
    const initializeAndSetup = async () => {
      if (!mounted) return;
      
      await initializeTerminal();
      
      if (mounted && terminalRef.current) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(terminalRef.current);
      }
    };
    
    initializeAndSetup();

    return () => {
      mounted = false;
      
      // Cleanup resize observer
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      
      if (terminalIdRef.current) {
        window.api.terminal.close(terminalIdRef.current);
      }
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
      
      // Remove event listeners
      window.api.terminal.removeListeners();
    };
  }, [initializeTerminal, handleResize]);

  // Handle focus when component becomes visible
  useEffect(() => {
    if (isReady && xtermRef.current) {
      const timer = setTimeout(() => {
        xtermRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (error) {
    return (
      <div className={`w-full h-full bg-[#1e1e1e] flex items-center justify-center ${className}`}>
        <div className="text-red-400 text-center">
          <p>Terminal initialization failed:</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsReady(false);
              initializeTerminal();
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={terminalRef} 
      className={`w-full h-full bg-[#1e1e1e] ${className}`}
      style={{ minHeight: '200px' }}
    />
  );
} 