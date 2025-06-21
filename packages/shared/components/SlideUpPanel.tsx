import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface SlideUpPanelProps {
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
  className?: string;
  title?: string;
}

export function SlideUpPanel({
  children,
  isOpen,
  onToggle,
  height: externalHeight,
  minHeight = 0,
  maxHeight = 600,
  defaultHeight = 300,
  className = '',
  title = 'Panel',
}: SlideUpPanelProps) {
  const [internalHeight, setInternalHeight] = useState(defaultHeight);
  const height = externalHeight ?? internalHeight;
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = height;
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = startY.current - e.clientY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight.current + deltaY));
    if (!externalHeight) {
      setInternalHeight(newHeight);
    }
  }, [isResizing, minHeight, maxHeight, externalHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!isOpen) {
    return null; // Completely hidden when not open
  }

  // Don't render if height is 0 or very small (less than 20px)
  if (height < 20) {
    return (
      <div
        ref={panelRef}
        className={`bg-card border-t border-border flex flex-col ${className}`}
        style={{
          height: `${height}px`,
          overflow: 'hidden',
        }}
      />
    );
  }

  return (
    <div
      ref={panelRef}
      className={`bg-card border-t border-border flex flex-col transition-all duration-200 ease-in-out ${className}`}
      style={{
        height: `${height}px`,
        overflow: 'hidden',
      }}
    >
      {/* Header/Drag Handle */}
      <div
        className="flex items-center justify-between px-3 py-1 border-b border-border bg-muted/30 cursor-ns-resize hover:bg-muted/50 transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">{height}px</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            title="Close Terminal"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
} 