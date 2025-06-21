/**
 * Tree item rename functionality
 */

import { useState, useCallback } from 'react';
import type { TreeNode } from '@notty/ui';

export interface RenameState {
  showRenameInput: boolean;
  renameInputValue: string;
  renamingNode: TreeNode | null;
}

export interface RenameActions {
  showRenameInput: (node: TreeNode) => void;
  hideRenameInput: () => void;
  setRenameInputValue: (value: string) => void;
  handleRenameSubmit: () => void;
  handleRenameCancel: () => void;
  handleRenameKeyPress: (e: React.KeyboardEvent) => void;
}

export const useRename = (
  onRename: (node: TreeNode, newName: string) => Promise<{ success: boolean; newPath?: string }>
): [RenameState, RenameActions] => {
  const [showRenameInput, setShowRenameInput] = useState<boolean>(false);
  const [renameInputValue, setRenameInputValue] = useState<string>('');
  const [renamingNode, setRenamingNode] = useState<TreeNode | null>(null);

  const showRenameInputHandler = useCallback((node: TreeNode) => {
    setRenamingNode(node);
    setRenameInputValue(node.name);
    setShowRenameInput(true);
  }, []);

  const hideRenameInput = useCallback(() => {
    setShowRenameInput(false);
    setRenameInputValue('');
    setRenamingNode(null);
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingNode || !renameInputValue.trim()) return;
    
    const newName = renameInputValue.trim();
    if (newName === renamingNode.name) {
      hideRenameInput();
      return;
    }
    
    try {
      const result = await onRename(renamingNode, newName);
      if (result.success) {
        hideRenameInput();
      }
    } catch (error) {
      console.error(`Failed to rename ${renamingNode.type}:`, error);
    }
  }, [renamingNode, renameInputValue, onRename, hideRenameInput]);

  const handleRenameCancel = useCallback(() => {
    hideRenameInput();
  }, [hideRenameInput]);

  const handleRenameKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  }, [handleRenameSubmit, handleRenameCancel]);

  const state: RenameState = {
    showRenameInput,
    renameInputValue,
    renamingNode,
  };

  const actions: RenameActions = {
    showRenameInput: showRenameInputHandler,
    hideRenameInput,
    setRenameInputValue,
    handleRenameSubmit,
    handleRenameCancel,
    handleRenameKeyPress,
  };

  return [state, actions];
}; 