import React from 'react';
import { X } from 'lucide-react';
import type { TabData } from '@shared/hooks/useTabManager';

export interface TabItemProps {
  tab: TabData;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export const TabItem: React.FC<TabItemProps> = React.memo(({
  tab,
  isActive,
  onSelect,
  onClose,
}) => {
  const handleClick = () => {
    onSelect(tab.id);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-1 min-w-0 max-w-[200px] cursor-pointer
        border-r border-border/50 last:border-r-0
        hover:bg-muted/50 transition-colors
        ${isActive 
          ? 'bg-background border-b-2 border-b-primary text-foreground' 
          : 'bg-muted/20 text-muted-foreground hover:text-foreground'
        }
      `}
      onClick={handleClick}
      title={tab.path}
    >
      {/* File name with unsaved indicator */}
      <span className="truncate text-sm font-medium flex items-center gap-1">
        {tab.isDirty && (
          <div 
            className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"
            title="Unsaved changes"
          />
        )}
        {tab.name}
      </span>
      
      {/* Close button - always visible on hover */}
      <div className="flex-shrink-0 ml-auto">
        <button
          onClick={handleClose}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-destructive/20 hover:text-destructive transition-all"
          title={tab.isDirty ? "Close tab (unsaved changes will be lost)" : "Close tab"}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // CRITICAL: Only re-render when visual aspects change
  // Allow isDirty changes to show/hide the orange dot, but be efficient about it
  
  return (
    prevProps.tab.id === nextProps.tab.id &&
    prevProps.tab.name === nextProps.tab.name &&
    prevProps.tab.isDirty === nextProps.tab.isDirty && // Include isDirty for orange dot
    prevProps.isActive === nextProps.isActive &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onClose === nextProps.onClose
  );
});

TabItem.displayName = 'TabItem'; 