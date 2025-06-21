/**
 * Workspace operations - handles workspace management
 */

import { useState, useCallback, useEffect } from 'react';
import { IPCService } from '@shared/services';
import { transformFileSystemToTreeNodes } from '@shared/utils';
import type { TreeNode } from '@features/treeView';

export interface WorkspaceState {
  currentWorkspace: string;
  treeNodes: TreeNode[];
}

export interface WorkspaceActions {
  setCurrentWorkspace: (workspace: string) => void;
  setTreeNodes: (nodes: TreeNode[]) => void;
  loadWorkspace: () => Promise<void>;
  loadFileTree: () => Promise<void>;
}

export const useWorkspace = (): [WorkspaceState, WorkspaceActions] => {
  const [currentWorkspace, setCurrentWorkspace] = useState<string>('~/Documents/Notty');
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);

  const loadCurrentWorkspace = useCallback(async () => {
    try {
      const workspace = await IPCService.getCurrentWorkspace();
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
    } catch (error) {
      console.error('Failed to load current workspace:', error);
    }
  }, []);

  const loadFileTree = useCallback(async () => {
    try {
      const fileSystemItems = await IPCService.listFilesAndFolders();
      if (fileSystemItems) {
        const treeData = transformFileSystemToTreeNodes(fileSystemItems);
        setTreeNodes(treeData);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    await Promise.all([
      loadCurrentWorkspace(),
      loadFileTree(),
    ]);
  }, [loadCurrentWorkspace, loadFileTree]);

  // Initialize workspace on mount
  useEffect(() => {
    loadWorkspace();
    
    const handleWorkspaceChange = (workspace: string) => {
      setCurrentWorkspace(workspace);
      loadFileTree();
    };

    // Listen for workspace changes
    IPCService.onWorkspaceChanged(handleWorkspaceChange);
  }, [loadWorkspace, loadFileTree]);

  const state: WorkspaceState = {
    currentWorkspace,
    treeNodes,
  };

  const actions: WorkspaceActions = {
    setCurrentWorkspace,
    setTreeNodes,
    loadWorkspace,
    loadFileTree,
  };

  return [state, actions];
}; 