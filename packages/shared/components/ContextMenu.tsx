/**
 * Context Menu component for tree items
 */

import React from 'react';
import { Plus, FolderPlus, Edit2, Trash2 } from 'lucide-react';
import type { ContextMenuState } from '@features/treeView/types';

interface ContextMenuProps {
  state: ContextMenuState;
  contextMenuRef: React.RefObject<HTMLDivElement>;
  onDelete: () => void;
  onRename: () => void;
  onCreateInFolder: (type: 'file' | 'folder') => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  contextMenuRef,
  onDelete,
  onRename,
  onCreateInFolder,
}) => {
  if (!state.show || !state.node) {
    return null;
  }

  return (
    <div
      ref={contextMenuRef}
      className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-[150px]"
      style={{
        left: state.x,
        top: state.y,
      }}
    >
      {/* Show folder-specific options for folders */}
      {state.node.type === 'folder' && (
        <>
          <button
            onClick={() => onCreateInFolder('file')}
            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2"
          >
            <Plus className="h-3 w-3" />
            New File
          </button>
          <button
            onClick={() => onCreateInFolder('folder')}
            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2"
          >
            <FolderPlus className="h-3 w-3" />
            New Folder
          </button>
          <div className="border-t border-border my-1" />
        </>
      )}
      
      <button
        onClick={onRename}
        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2"
      >
        <Edit2 className="h-3 w-3" />
        Rename
      </button>
      <button
        onClick={onDelete}
        className="w-full text-left px-3 py-2 hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm flex items-center gap-2"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </button>
    </div>
  );
}; 