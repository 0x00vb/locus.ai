/**
 * Rename Input component for file/folder renaming
 */

import React from 'react';
import type { RenameState } from '@features/treeView/types';

interface RenameInputProps {
  state: RenameState;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const RenameInput: React.FC<RenameInputProps> = ({
  state,
  onInputChange,
  onKeyPress,
}) => {
  if (!state.showRenameInput || !state.renamingNode) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-md p-2 space-y-2 mb-4">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={state.renameInputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyPress}
          className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      </div>
    </div>
  );
}; 