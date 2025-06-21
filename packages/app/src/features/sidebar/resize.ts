/**
 * Sidebar resize functionality
 */

import { useState, useCallback, useEffect } from 'react';

export interface SidebarResizeState {
  sidebarWidth: number;
  isResizing: boolean;
}

export interface SidebarResizeActions {
  setSidebarWidth: (width: number) => void;
  setIsResizing: (resizing: boolean) => void;
  handleResizeStart: (e: React.MouseEvent) => void;
}

export const useSidebarResize = (
  initialWidth: number = 280,
  minWidth: number = 0,
  maxWidth: number = 600
): [SidebarResizeState, SidebarResizeActions] => {
  const [sidebarWidth, setSidebarWidth] = useState<number>(initialWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth]);

  const state: SidebarResizeState = {
    sidebarWidth,
    isResizing,
  };

  const actions: SidebarResizeActions = {
    setSidebarWidth,
    setIsResizing,
    handleResizeStart,
  };

  return [state, actions];
}; 