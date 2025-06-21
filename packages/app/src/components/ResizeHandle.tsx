/**
 * Resize Handle component for sidebar resizing
 */

import React from 'react';
import { GripVertical } from 'lucide-react';

interface ResizeHandleProps {
  isResizing: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  isResizing,
  onMouseDown,
  className = '',
}) => {
  return (
    <div
      className={`w-1 bg-border hover:bg-primary cursor-col-resize transition-colors relative group ${
        isResizing ? 'bg-primary' : ''
      } ${className}`}
      onMouseDown={onMouseDown}
      title="Drag to resize sidebar"
      style={{ WebkitAppRegion: 'no-drag' } as any}
    >
      <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}; 