/**
 * Context menu functionality for tree items
 */

import { useState, useCallback, useRef } from 'react';
import type { TreeNode } from '@features/treeView';
import { useOutsideClick } from '@shared/hooks/use-outside-click';

export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  node: TreeNode | null;
  selectedNodes: TreeNode[];
}

export interface ContextMenuActions {
  show: (event: React.MouseEvent, node: TreeNode, selectedNodes?: TreeNode[]) => void;
  hide: () => void;
  handleDelete: () => void;
  handleRename: () => void;
  handleCreateInFolder: (type: 'file' | 'folder') => void;
  handleBulkDelete: () => void;
}

export const useContextMenu = (
  onDelete: (node: TreeNode) => void,
  onRename: (node: TreeNode) => void,
  onCreateInFolder: (node: TreeNode, type: 'file' | 'folder') => void,
  onBulkDelete?: (nodes: TreeNode[]) => void
): [ContextMenuState, ContextMenuActions, React.RefObject<HTMLDivElement>] => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ 
    show: false, 
    x: 0, 
    y: 0, 
    node: null,
    selectedNodes: []
  });
  
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const showContextMenu = useCallback((event: React.MouseEvent, node: TreeNode, selectedNodes: TreeNode[] = []) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      node,
      selectedNodes
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, node: null, selectedNodes: [] });
  }, []);

  const handleDelete = useCallback(() => {
    if (!contextMenu.node) return;
    onDelete(contextMenu.node);
    hideContextMenu();
  }, [contextMenu.node, onDelete, hideContextMenu]);

  const handleRename = useCallback(() => {
    if (!contextMenu.node) return;
    onRename(contextMenu.node);
    hideContextMenu();
  }, [contextMenu.node, onRename, hideContextMenu]);

  const handleCreateInFolder = useCallback((type: 'file' | 'folder') => {
    if (!contextMenu.node || contextMenu.node.type !== 'folder') return;
    onCreateInFolder(contextMenu.node, type);
    hideContextMenu();
  }, [contextMenu.node, onCreateInFolder, hideContextMenu]);

  const handleBulkDelete = useCallback(() => {
    if (!contextMenu.selectedNodes.length && !contextMenu.node) return;
    const nodesToDelete = contextMenu.selectedNodes.length > 0 ? contextMenu.selectedNodes : [contextMenu.node!];
    if (onBulkDelete) {
      onBulkDelete(nodesToDelete);
    }
    hideContextMenu();
  }, [contextMenu.selectedNodes, contextMenu.node, onBulkDelete, hideContextMenu]);

  // Close context menu when clicking outside
  useOutsideClick(contextMenuRef, hideContextMenu, contextMenu.show);

  const state: ContextMenuState = contextMenu;
  const actions: ContextMenuActions = {
    show: showContextMenu,
    hide: hideContextMenu,
    handleDelete,
    handleRename,
    handleCreateInFolder,
    handleBulkDelete,
  };

  return [state, actions, contextMenuRef];
}; 