/**
 * Editor Component - Monaco Editor
 * 
 * Features:
 * - Monaco Editor integration with syntax highlighting
 * - Custom theming support
 * - Keyboard shortcuts (Ctrl+S for save)
 * - Auto-save functionality
 * - Multi-language support based on file extensions
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
  
  // Update refs when values change
  const currentContentRef = useRef(initialContent);
  const filePathRef = useRef(filePath);
  
  useEffect(() => {
    currentContentRef.current = content;
  }, [content]);
  
  useEffect(() => {
    filePathRef.current = filePath;
  }, [filePath]);

  // Stabilize content updates to prevent Monaco focus loss
  useEffect(() => {
    // Only update if content actually changed and editor exists
    if (initialContent !== content && editorRef.current) {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model) {
        // Preserve cursor position during content update
        const position = editor.getPosition();
        const selection = editor.getSelection();
        
        // Update content without triggering onChange
        editor.setValue(initialContent);
        setContent(initialContent);
        
        // Restore cursor position and selection if they're valid
        if (position && selection) {
          // Use a micro-task to ensure the content is set before restoring position
          requestAnimationFrame(() => {
            if (editor.getModel()) {
              try {
                editor.setPosition(position);
                editor.setSelection(selection);
                editor.focus();
              } catch (e) {
                // If position is invalid, just focus the editor
                editor.focus();
              }
            }
          });
        }
      }
    } else if (initialContent !== content) {
      // If editor doesn't exist yet, just update state
      setContent(initialContent);
    }
  }, [initialContent]);

  // Handle Monaco Editor mount
  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    
    // Ensure proper text direction and prevent RTL issues
    const domNode = editor.getDomNode();
    if (domNode) {
      domNode.style.direction = 'ltr';
      domNode.style.textAlign = 'left';
      
      // Force all input elements to LTR
      const textAreas = domNode.querySelectorAll('textarea');
      textAreas.forEach(textarea => {
        textarea.style.direction = 'ltr';
        textarea.style.textAlign = 'left';
      });
    }
    
    // Add custom keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Focus the editor in a stable way
    requestAnimationFrame(() => {
      if (editor.getModel()) {
        editor.focus();
      }
    });
  }, [onSave]);

  // Handle content changes
  const handleChange = useCallback((value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    onChange(newContent);

    // Update ref immediately
    currentContentRef.current = newContent;
  }, [onChange]);

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
    // IntelliSense settings (built-in Monaco features only)
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
      <div 
        className="flex-1 overflow-hidden"
        style={{
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'bidi-override'
        }}
      >
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