/**
 * Create Input component for file/folder creation
 */

import React from 'react';
import type { CreationState } from '../features/tree/types';

interface CreateInputProps {
  state: CreationState;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const CreateInput: React.FC<CreateInputProps> = ({
  state,
  onInputChange,
  onKeyPress,
}) => {
  if (!state.showCreateInput) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-md p-2 space-y-2 mb-4">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={state.createInputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder={state.createType === 'file' ? 'filename.txt' : 'folder-name'}
          className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      </div>
    </div>
  );
}; 