import React, { useRef, useCallback, useEffect, useState } from 'react';
import { ThemeSelectorBottom } from '../theme/ThemeSelector';

interface StatusBarProps {
  contentStats: { lines: number; characters: number };
  language: string;
  terminalState?: { isOpen: boolean; height: number };
  terminalActions?: {
    open: () => void;
    setHeight: (height: number) => void;
  };
}

export const StatusBar: React.FC<StatusBarProps> = React.memo(({ 
  contentStats, 
  language, 
  terminalState, 
  terminalActions 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const dragThreshold = 5;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!terminalActions || !terminalState) return;
    
    // Only start dragging if it's not a click on interactive elements
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="button"]')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStarted(false);
    startY.current = e.clientY;
    startHeight.current = terminalState.height;
  }, [terminalState, terminalActions]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !terminalActions || !terminalState) return;

    const deltaY = startY.current - e.clientY;
    
    // Only start actual dragging after threshold is met
    if (!dragStarted && Math.abs(deltaY) >= dragThreshold) {
      setDragStarted(true);
      // Open terminal when drag starts
      if (!terminalState.isOpen) {
        terminalActions.open();
      }
    }

    if (dragStarted) {
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        const newHeight = Math.max(0, Math.min(600, startHeight.current + deltaY));
        terminalActions.setHeight(newHeight);
      });
    }
  }, [isDragging, dragStarted, terminalActions, terminalState, dragThreshold]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStarted(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={`h-8 px-2 border-t border-border bg-card text-sm text-muted-foreground flex items-center justify-between z-10 cursor-ns-resize hover:bg-muted/50 transition-colors ${
        isDragging ? 'select-none' : ''
      }`}
      onMouseDown={handleMouseDown}
    >
        <div className="bg-card">
          <ThemeSelectorBottom className="py-2" />
        </div>

    </div>
  );
});
StatusBar.displayName = 'StatusBar';

export default StatusBar; 