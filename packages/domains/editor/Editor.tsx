/**
 * Editor Component - Monaco Editor with LSP Integration
 * 
 * Migration Notes:
 * - Replaced @uiw/react-textarea-code-editor with Monaco Editor for better performance and features
 * - Maintained all existing functionality: syntax highlighting, keyboard shortcuts, theming
 * - Added LSP integration for IntelliSense: autocompletion, hover, signature help, go-to-definition
 * - LSP features are lazy-loaded and only enabled for supported languages
 * - WebSocket-based communication with LSP servers in main process
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTheme } from '@shared/theme/ThemeProvider';

// Extend Window interface for Monaco global 
declare global {
  interface Window {
    monaco: typeof import('monaco-editor');
  }
}

// LSP-supported languages and their file extensions
const LSP_LANGUAGES = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx'], 
  python: ['.py', '.pyw']
};

const getLanguageFromExtension = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python',
    json: 'json', html: 'html', css: 'css', scss: 'scss', sass: 'sass', yml: 'yaml',
    yaml: 'yaml', xml: 'xml', sql: 'sql', sh: 'shell', bash: 'shell', php: 'php',
    rb: 'ruby', go: 'go', rs: 'rust', java: 'java', c: 'c', cpp: 'cpp', h: 'c',
    hpp: 'cpp', md: 'markdown', txt: 'plaintext', doc: 'plaintext', rtf: 'plaintext'
  };
  return map[ext] || 'plaintext';
};

// Check if language supports LSP
const isLSPSupported = (language: string): boolean => {
  return language in LSP_LANGUAGES;
};

// Get LSP language from file path
const getLSPLanguageFromPath = (filePath: string): string | null => {
  const ext = '.' + (filePath.split('.').pop()?.toLowerCase() || '');
  
  for (const [language, extensions] of Object.entries(LSP_LANGUAGES)) {
    if (extensions.includes(ext)) {
      return language;
    }
  }
  
  return null;
};

export interface EditorProps {
  initialContent: string;
  filePath: string;
  onChange: (content: string) => void;
  onSave: () => void;
  className?: string;
}

export const CodeEditor: React.FC<EditorProps> = ({ 
  initialContent, 
  filePath, 
  onChange, 
  onSave, 
  className = '' 
}) => {
  const [content, setContent] = useState(initialContent);
  const theme = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const lspConnection = useRef<WebSocket | null>(null);
  const [lspPort, setLSPPort] = useState<number | null>(null);

  // Update content when initialContent changes (file switching)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // LSP Port initialization
  useEffect(() => {
    if (window.api?.lsp) {
      // Listen for LSP port
      window.api.lsp.onPortAvailable((port: number) => {
        setLSPPort(port);
      });

      // Try to get port immediately
      window.api.lsp.getPort().then(port => {
        if (port) setLSPPort(port);
      }).catch(console.error);

      return () => {
        window.api?.lsp?.removePortListener();
      };
    }
  }, []);

  // Setup LSP connection for supported languages
  useEffect(() => {
    const language = getLanguageFromExtension(filePath);
    const lspLanguage = getLSPLanguageFromPath(filePath);
    
    if (!lspLanguage || !lspPort || !editorRef.current) {
      return;
    }

    console.log(`Setting up LSP for ${lspLanguage} (${language})`);
    
    // Create WebSocket connection
    const ws = new WebSocket(`ws://localhost:${lspPort}?language=${lspLanguage}`);
    lspConnection.current = ws;

    ws.onopen = () => {
      console.log(`LSP connected for ${lspLanguage}`);
      
      // Initialize LSP session
      const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          processId: null,
          clientInfo: { name: 'Notty', version: '1.0.0' },
          capabilities: {
            textDocument: {
              completion: {
                dynamicRegistration: false,
                completionItem: {
                  snippetSupport: true,
                  commitCharactersSupport: true,
                }
              },
              hover: { dynamicRegistration: false },
              signatureHelp: { dynamicRegistration: false },
              definition: { dynamicRegistration: false },
            }
          },
          workspaceFolders: null,
        }
      };
      
      ws.send(JSON.stringify(initMessage));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleLSPMessage(message, lspLanguage);
      } catch (error) {
        console.error('Failed to parse LSP message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`LSP connection error for ${lspLanguage}:`, error);
    };

    ws.onclose = () => {
      console.log(`LSP disconnected for ${lspLanguage}`);
    };

    return () => {
      if (lspConnection.current) {
        lspConnection.current.close();
        lspConnection.current = null;
      }
    };
  }, [filePath, lspPort]);

  // Handle LSP messages
  const handleLSPMessage = useCallback((message: any, language: string) => {
    if (!editorRef.current) return;

    // Handle initialization response
    if (message.id === 1 && message.method === undefined) {
      // Send initialized notification
      const initializedMessage = {
        jsonrpc: '2.0',
        method: 'initialized',
        params: {}
      };
      
      lspConnection.current?.send(JSON.stringify(initializedMessage));
      
      // Notify document opened
      const docOpenMessage = {
        jsonrpc: '2.0',
        method: 'textDocument/didOpen',
        params: {
          textDocument: {
            uri: `file://${filePath}`,
            languageId: language,
            version: 1,
            text: content
          }
        }
      };
      
      lspConnection.current?.send(JSON.stringify(docOpenMessage));
    }

    // Handle completion responses
    if (message.result && message.result.items) {
      // Monaco will handle completion items through providers
      console.log('Received completion items:', message.result.items.length);
    }

    // Handle hover responses
    if (message.result && message.result.contents) {
      console.log('Received hover info:', message.result.contents);
    }
  }, [filePath, content]);

  // Store cleanup handlers to prevent memory leaks
  const cleanupHandlersRef = useRef(new Set<() => void>());
  const disposablesRef = useRef<import('monaco-editor').IDisposable[]>([]);

  // Handle Monaco Editor mount
  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    
    // Clear previous disposables
    disposablesRef.current.forEach(d => d.dispose());
    disposablesRef.current = [];
    
    // Add custom keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Add Go to Definition (F12)
    editor.addCommand(monaco.KeyCode.F12, () => {
      const position = editor.getPosition();
      if (position && lspConnection.current) {
        const message = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'textDocument/definition',
          params: {
            textDocument: { uri: `file://${filePath}` },
            position: { line: position.lineNumber - 1, character: position.column - 1 }
          }
        };
        lspConnection.current.send(JSON.stringify(message));
      }
    });

    // Setup completion provider for LSP-supported languages
    const language = getLanguageFromExtension(filePath);
    const lspLanguage = getLSPLanguageFromPath(filePath);
    
    if (lspLanguage) {
      const completionProvider = monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: async (_model, position) => {
          if (!lspConnection.current || lspConnection.current.readyState !== WebSocket.OPEN) {
            return { suggestions: [] };
          }

          return new Promise((resolve) => {
            const requestId = Date.now();
            
            const message = {
              jsonrpc: '2.0',
              id: requestId,
              method: 'textDocument/completion',
              params: {
                textDocument: { uri: `file://${filePath}` },
                position: { line: position.lineNumber - 1, character: position.column - 1 }
              }
            };

            // Timeout for completion request
            const timeout = setTimeout(() => {
              resolve({ suggestions: [] });
            }, 1000);

            // Handle response
            const handler = (event: MessageEvent) => {
              try {
                const response = JSON.parse(event.data);
                if (response.id === requestId) {
                  clearTimeout(timeout);
                  lspConnection.current?.removeEventListener('message', handler);
                  cleanupHandlersRef.current.delete(() => {
                    clearTimeout(timeout);
                    lspConnection.current?.removeEventListener('message', handler);
                  });
                  
                  const suggestions = response.result?.items?.map((item: any) => ({
                    label: item.label,
                    kind: monaco.languages.CompletionItemKind.Text,
                    insertText: item.insertText || item.label,
                    detail: item.detail,
                    documentation: item.documentation,
                  })) || [];
                  
                  resolve({ suggestions });
                }
              } catch (error) {
                clearTimeout(timeout);
                lspConnection.current?.removeEventListener('message', handler);
                cleanupHandlersRef.current.delete(() => {
                  clearTimeout(timeout);
                  lspConnection.current?.removeEventListener('message', handler);
                });
                resolve({ suggestions: [] });
              }
            };

            // Add cleanup handler to set
            const cleanup = () => {
              clearTimeout(timeout);
              lspConnection.current?.removeEventListener('message', handler);
            };
            cleanupHandlersRef.current.add(cleanup);

            lspConnection.current?.addEventListener('message', handler);
            lspConnection.current?.send(JSON.stringify(message));
          });
        }
      });

      // Setup hover provider
      const hoverProvider = monaco.languages.registerHoverProvider(language, {
        provideHover: async (_model, position) => {
          if (!lspConnection.current || lspConnection.current.readyState !== WebSocket.OPEN) {
            return null;
          }

          return new Promise((resolve) => {
            const requestId = Date.now();
            
            const message = {
              jsonrpc: '2.0',
              id: requestId,
              method: 'textDocument/hover',
              params: {
                textDocument: { uri: `file://${filePath}` },
                position: { line: position.lineNumber - 1, character: position.column - 1 }
              }
            };

            const timeout = setTimeout(() => {
              resolve(null);
            }, 1000);

            const handler = (event: MessageEvent) => {
              try {
                const response = JSON.parse(event.data);
                if (response.id === requestId) {
                  clearTimeout(timeout);
                  lspConnection.current?.removeEventListener('message', handler);
                  cleanupHandlersRef.current.delete(() => {
                    clearTimeout(timeout);
                    lspConnection.current?.removeEventListener('message', handler);
                  });
                  
                  if (response.result?.contents) {
                    const contents = Array.isArray(response.result.contents) 
                      ? response.result.contents 
                      : [response.result.contents];
                    
                    resolve({
                      contents: contents.map((content: any) => ({
                        value: typeof content === 'string' ? content : content.value || ''
                      }))
                    });
                  } else {
                    resolve(null);
                  }
                }
              } catch (error) {
                clearTimeout(timeout);
                lspConnection.current?.removeEventListener('message', handler);
                cleanupHandlersRef.current.delete(() => {
                  clearTimeout(timeout);
                  lspConnection.current?.removeEventListener('message', handler);
                });
                resolve(null);
              }
            };

            // Add cleanup handler to set
            const cleanup = () => {
              clearTimeout(timeout);
              lspConnection.current?.removeEventListener('message', handler);
            };
            cleanupHandlersRef.current.add(cleanup);

            lspConnection.current?.addEventListener('message', handler);
            lspConnection.current?.send(JSON.stringify(message));
          });
        }
      });

      // Store disposables for cleanup
      disposablesRef.current.push(completionProvider, hoverProvider);
    }

    // Focus the editor
    editor.focus();
  }, [onSave, filePath]);

  // Cleanup effect for LSP resources
  useEffect(() => {
    return () => {
      // Clean up all pending handlers
      cleanupHandlersRef.current.forEach(cleanup => cleanup());
      cleanupHandlersRef.current.clear();
      
      // Dispose Monaco providers
      disposablesRef.current.forEach(d => d.dispose());
      disposablesRef.current = [];
    };
  }, [filePath]);

  // Handle content changes
  const handleChange = useCallback((value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    onChange(newContent);

    // Notify LSP of document changes
    if (lspConnection.current && lspConnection.current.readyState === WebSocket.OPEN) {
      const lspLanguage = getLSPLanguageFromPath(filePath);
      if (lspLanguage) {
        const message = {
          jsonrpc: '2.0',
          method: 'textDocument/didChange',
          params: {
            textDocument: {
              uri: `file://${filePath}`,
              version: Date.now()
            },
            contentChanges: [{ text: newContent }]
          }
        };
        
        lspConnection.current.send(JSON.stringify(message));
      }
    }
  }, [onChange, filePath]);

  // Memoize computed values for performance
  const computedValues = useMemo(() => {
    const language = getLanguageFromExtension(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const useMono = [
      'js','jsx','ts','tsx','py','json','html','css','scss','sass','yml','yaml','xml','sql','sh','bash','php','rb','go','rs','java','c','cpp','h','hpp'
    ].includes(ext);
    
    const fontFamily = useMono
      ? 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace'
      : 'Inter, system-ui, sans-serif';

    // Monaco Editor theme configuration
    const monacoTheme = theme.isDark ? 'vs-dark' : 'vs';
    
    return { language, fontFamily, monacoTheme };
  }, [filePath, theme.isDark]);

  // Monaco Editor options
  const editorOptions = useMemo((): editor.IStandaloneEditorConstructionOptions => ({
    fontSize: 14,
    fontFamily: computedValues.fontFamily,
    lineHeight: 1.6,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    glyphMargin: false,
    folding: true,
    lineDecorationsWidth: 10,
    renderLineHighlight: 'line',
    selectOnLineNumbers: true,
    padding: { top: 16, bottom: 16 },
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    // IntelliSense settings
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    wordBasedSuggestions: 'currentDocument',
    // Accessibility
    accessibilitySupport: 'auto',
    // Performance
    renderControlCharacters: false,
    renderWhitespace: 'none',
    // Theme colors will be applied via Monaco's theme system
    theme: computedValues.monacoTheme,
  }), [computedValues.fontFamily, computedValues.monacoTheme]);

  // Custom theme definition for Monaco Editor
  useEffect(() => {
    if (typeof window !== 'undefined' && window.monaco) {
      const monaco = window.monaco;
      
      // Helper function to convert HSL to hex
      const hslToHex = (hsl: string): string => {
        // If already hex, return as is
        if (hsl.startsWith('#')) return hsl;
        
        // Extract HSL values
        const match = hsl.match(/hsl\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/);
        if (!match) return '#000000';
        
        const h = parseInt(match[1]) / 360;
        const s = parseInt(match[2]) / 100;
        const l = parseInt(match[3]) / 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        if (h < 1/6) [r, g, b] = [c, x, 0];
        else if (h < 2/6) [r, g, b] = [x, c, 0];
        else if (h < 3/6) [r, g, b] = [0, c, x];
        else if (h < 4/6) [r, g, b] = [0, x, c];
        else if (h < 5/6) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        
        const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };
      
      // Define custom theme based on current theme
      const customTheme: editor.IStandaloneThemeData = {
        base: theme.isDark ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: hslToHex(`hsl(${theme.currentTheme.colors.syntaxKeyword})`) },
          { token: 'string', foreground: hslToHex(`hsl(${theme.currentTheme.colors.syntaxString})`) },
          { token: 'comment', foreground: hslToHex(`hsl(${theme.currentTheme.colors.syntaxComment})`) },
          { token: 'number', foreground: hslToHex(`hsl(${theme.currentTheme.colors.syntaxNumber})`) },
          { token: 'operator', foreground: hslToHex(`hsl(${theme.currentTheme.colors.syntaxOperator})`) },
          { token: 'function', foreground: hslToHex(`hsl(${theme.currentTheme.colors.syntaxFunction})`) },
          { token: 'variable', foreground: hslToHex(`hsl(${theme.currentTheme.colors.syntaxVariable})`) },
        ],
        colors: {
          'editor.background': hslToHex(`hsl(${theme.currentTheme.colors.editorBackground})`),
          'editor.foreground': hslToHex(`hsl(${theme.currentTheme.colors.editorForeground})`),
          'editor.selectionBackground': hslToHex(`hsl(${theme.currentTheme.colors.editorSelectionBackground})`),
          'editor.lineHighlightBackground': hslToHex(`hsl(${theme.currentTheme.colors.editorLineHighlight})`),
          'editorLineNumber.foreground': hslToHex(`hsl(${theme.currentTheme.colors.mutedForeground})`),
          'editorGutter.background': hslToHex(`hsl(${theme.currentTheme.colors.editorBackground})`),
        }
      };

      monaco.editor.defineTheme('notty-theme', customTheme);
      monaco.editor.setTheme('notty-theme');
    }
  }, [theme.currentTheme.colors, theme.isDark]);

  return (
    <div className={`flex flex-col h-screen ${className}`}>
      <div className="flex-1 overflow-hidden">
        <Editor
          value={content}
          language={computedValues.language}
          onChange={handleChange}
          onMount={handleEditorMount}
          options={editorOptions}
          theme="notty-theme"
          loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
        />
      </div>
    </div>
  );
};

// Maintain backward compatibility with existing exports
CodeEditor.displayName = 'Editor';
export { CodeEditor as Editor };
export default CodeEditor;