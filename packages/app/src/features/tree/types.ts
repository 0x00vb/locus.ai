/**
 * Types for the tree feature
 */

import type { TreeNode } from '@notty/ui';

export interface TreeState {
  treeNodes: TreeNode[];
  selectedPath: string;
}

export interface TreeActions {
  setTreeNodes: (nodes: TreeNode[]) => void;
  setSelectedPath: (path: string) => void;
  refreshTree: () => Promise<void>;
  selectNode: (path: string, node: TreeNode) => void;
}

export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  node: TreeNode | null;
}

export interface CreationState {
  showCreateInput: boolean;
  createInputValue: string;
  createType: 'file' | 'folder';
  targetFolder: TreeNode | null;
}

export interface RenameState {
  showRenameInput: boolean;
  renameInputValue: string;
  renamingNode: TreeNode | null;
}

export interface TreeEventHandlers {
  onSelect: (path: string, node: TreeNode) => void;
  onContextMenu: (event: React.MouseEvent, node: TreeNode) => void;
  onCreate: (fileName: string, createType: 'file' | 'folder', targetFolder?: TreeNode | null) => Promise<void>;
  onDelete: (node: TreeNode) => Promise<void>;
  onRename: (node: TreeNode, newName: string) => Promise<{ success: boolean; newPath?: string }>;
} 