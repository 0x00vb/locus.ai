/**
 * Tree item creation functionality
 */

import { useState, useCallback } from 'react';
import type { TreeNode } from '@notty/ui';

export interface CreationState {
  showCreateInput: boolean;
  createInputValue: string;
  createType: 'file' | 'folder';
  targetFolder: TreeNode | null;
}

export interface CreationActions {
  showCreateInput: (type: 'file' | 'folder', targetFolder?: TreeNode | null) => void;
  hideCreateInput: () => void;
  setCreateInputValue: (value: string) => void;
  handleCreateSubmit: () => void;
  handleCreateCancel: () => void;
  handleCreateKeyPress: (e: React.KeyboardEvent) => void;
}

export const useCreation = (
  onCreate: (fileName: string, createType: 'file' | 'folder', targetFolder?: TreeNode | null) => Promise<void>
): [CreationState, CreationActions] => {
  const [showCreateInput, setShowCreateInput] = useState<boolean>(false);
  const [createInputValue, setCreateInputValue] = useState<string>('');
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [targetFolder, setTargetFolder] = useState<TreeNode | null>(null);

  const showCreateInputHandler = useCallback((type: 'file' | 'folder', folder?: TreeNode | null) => {
    setCreateType(type);
    setTargetFolder(folder || null);
    setShowCreateInput(true);
    setCreateInputValue('');
  }, []);

  const hideCreateInput = useCallback(() => {
    setShowCreateInput(false);
    setCreateInputValue('');
    setTargetFolder(null);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (createInputValue.trim()) {
      await onCreate(createInputValue.trim(), createType, targetFolder);
      hideCreateInput();
    }
  }, [createInputValue, createType, targetFolder, onCreate, hideCreateInput]);

  const handleCreateCancel = useCallback(() => {
    hideCreateInput();
  }, [hideCreateInput]);

  const handleCreateKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubmit();
    } else if (e.key === 'Escape') {
      handleCreateCancel();
    }
  }, [handleCreateSubmit, handleCreateCancel]);

  const state: CreationState = {
    showCreateInput,
    createInputValue,
    createType,
    targetFolder,
  };

  const actions: CreationActions = {
    showCreateInput: showCreateInputHandler,
    hideCreateInput,
    setCreateInputValue,
    handleCreateSubmit,
    handleCreateCancel,
    handleCreateKeyPress,
  };

  return [state, actions];
}; 