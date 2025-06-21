/**
 * Sidebar resize functionality
 */

import { useState, useCallback, useEffect } from 'react';

export interface SidebarResizeState {
  sidebarWidth: number;
  isResizing: boolean;
  isCollapsed: boolean;
}

export interface SidebarResizeActions {
  setSidebarWidth: (width: number) => void;
  setIsResizing: (resizing: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  handleResizeStart: (e: React.MouseEvent) => void;
  toggleSidebar: () => void;
}

export const useSidebarResize = (
  initialWidth: number = 280,
  minWidth: number = 120,
  maxWidth: number = 600
): [SidebarResizeState, SidebarResizeActions] => {
  const [sidebarWidth, setSidebarWidth] = useState<number>(initialWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [lastWidth, setLastWidth] = useState<number>(initialWidth);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isCollapsed) {
      const widthToRestore = lastWidth >= minWidth ? lastWidth : initialWidth;
      setSidebarWidth(widthToRestore);
      setIsCollapsed(false);
    } else {
      setLastWidth(sidebarWidth);
      setIsCollapsed(true);
    }
  }, [isCollapsed, lastWidth, minWidth, initialWidth, sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      
      if (newWidth < minWidth) {
        setLastWidth(sidebarWidth);
        setIsCollapsed(true);
      } else if (newWidth <= maxWidth) {
        if (isCollapsed) {
          setIsCollapsed(false);
        }
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
  }, [isResizing, minWidth, maxWidth, sidebarWidth, isCollapsed]);

  const state: SidebarResizeState = {
    sidebarWidth,
    isResizing,
    isCollapsed,
  };

  const actions: SidebarResizeActions = {
    setSidebarWidth,
    setIsResizing,
    setIsCollapsed,
    handleResizeStart,
    toggleSidebar,
  };

  return [state, actions];
}; 