/**
 * Resize Handle component for sidebar resizing
 */

import React from 'react';
import { GripVertical, ChevronRight } from 'lucide-react';

interface ResizeHandleProps {
  isResizing: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
  isCollapsed?: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  isResizing,
  onMouseDown,
  className = '',
  isCollapsed = false,
}) => {
  return (
    <div
      className={`bg-border hover:bg-primary cursor-col-resize transition-colors relative group ${
        isResizing ? 'bg-primary' : ''
      } ${isCollapsed ? 'w-2 hover:w-3' : 'w-1'} ${className}`}
      onMouseDown={onMouseDown}
      title={isCollapsed ? "Click or drag to open sidebar" : "Drag to resize sidebar"}
      style={{ WebkitAppRegion: 'no-drag' } as any}
    >
      <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
        ) : (
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
}; 