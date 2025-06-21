import React, { useState, useCallback, useMemo, useEffect } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { useTheme } from '../theme/ThemeProvider';

const getLanguageFromExtension = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python',
    json: 'json', html: 'html', css: 'css', scss: 'css', sass: 'css', yml: 'yaml',
    yaml: 'yaml', xml: 'xml', sql: 'sql', sh: 'bash', bash: 'bash', php: 'php',
    rb: 'ruby', go: 'go', rs: 'rust', java: 'java', c: 'c', cpp: 'cpp', h: 'c',
    hpp: 'cpp', md: 'markdown', txt: 'text', doc: 'text', rtf: 'text'
  };
  return map[ext] || 'text';
};

const LineNumberColumn = React.memo(({ lineCount, fontSize, backgroundColor }: {
  lineCount: number;
  fontSize: number;
  backgroundColor: string;
}) => {
  const width = useMemo(() => Math.max(String(lineCount).length * 0.6 + 1, 3), [lineCount]);
  const style = useMemo(() => ({
    width: `${width}rem`,
    fontSize: `${fontSize}px`,
    fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
    lineHeight: '1.6',
    backgroundColor,
    color: 'hsl(var(--muted-foreground))',
    padding: '16px 8px'
  }), [width, fontSize, backgroundColor]);

  return (
    <div className="flex-shrink-0 text-right border-r border-border/50 select-none" style={style}>
      <div className="h-full overflow-y-auto">
        {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>
    </div>
  );
});

export interface EditorProps {
  initialContent: string;
  filePath: string;
  onChange: (content: string) => void;
  onSave: () => void;
  className?: string;
}

export const Editor: React.FC<EditorProps> = ({ 
  initialContent, 
  filePath, 
  onChange, 
  onSave, 
  className = '' 
}) => {
  const [content, setContent] = useState(initialContent);
  const theme = useTheme();

  // Update content when initialContent changes (file switching)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Stable callbacks to prevent rerenders
  const handleChange = useCallback((e: any) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange(newContent);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  }, [onSave]);

  // Memoize computed values for performance
  const computedValues = useMemo(() => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const language = getLanguageFromExtension(filePath);
    const useMono = [
      'js','jsx','ts','tsx','py','json','html','css','scss','sass','yml','yaml','xml','sql','sh','bash','php','rb','go','rs','java','c','cpp','h','hpp'
    ].includes(ext);
    
    const font = useMono
      ? 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace'
      : 'Inter, system-ui, sans-serif';

    const bg = theme.currentTheme.colors.editorBackground;
    const fg = theme.currentTheme.colors.editorForeground;
    const backgroundColor = bg.startsWith('hsl(') ? bg : `hsl(${bg})`;
    const foregroundColor = fg.startsWith('hsl(') ? fg : `hsl(${fg})`;
    
    const colorMode: 'dark' | 'light' = theme.isDark ? 'dark' : 'light';
    
    return { language, font, backgroundColor, foregroundColor, colorMode };
  }, [filePath, theme.currentTheme.colors.editorBackground, theme.currentTheme.colors.editorForeground, theme.isDark]);

  const editorStyle = useMemo(() => ({
    fontSize: '14px',
    fontFamily: computedValues.font,
    lineHeight: '1.6',
    backgroundColor: computedValues.backgroundColor,
    color: computedValues.foregroundColor,
    height: '100%',
    width: '100%',
  }), [computedValues]);

  const lineCount = useMemo(() => content.split('\n').length, [content]);

  return (
    <div className={`flex flex-col h-screen ${className}`}>
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          <LineNumberColumn 
            lineCount={lineCount} 
            fontSize={14} 
            backgroundColor={computedValues.backgroundColor} 
          />
          <div className="flex-1">
            <CodeEditor
              value={content}
              language={computedValues.language}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              padding={16}
              data-color-mode={computedValues.colorMode}
              className="h-screen w-full resize-none outline-none"
              style={editorStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

Editor.displayName = 'Editor';
export default Editor;