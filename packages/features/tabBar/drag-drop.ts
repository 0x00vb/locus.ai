/**
 * Native HTML5 drag-and-drop functionality for tree view
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TreeNode } from '@features/treeView';

export interface DragDropState {
  isDragging: boolean;
  draggedNode: TreeNode | null;
  draggedNodes: TreeNode[]; // Support for multiple dragged nodes
  dropTargetId: string | null;
  isValidDropTarget: boolean;
  showDropIndicator: boolean;
}

export interface DragDropActions {
  handleDragStart: (e: React.DragEvent, node: TreeNode, selectedNodes?: TreeNode[]) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, node: TreeNode) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetNode: TreeNode) => void;
  handleDropToRoot: (e: React.DragEvent) => void; // New method for dropping to root
  clearDragState: () => void;
}

export interface DragDropCallbacks {
  onMove: (sourceNode: TreeNode, targetNode: TreeNode) => Promise<{ success: boolean; newPath?: string }>;
  onMoveMultiple?: (sourceNodes: TreeNode[], targetNode: TreeNode) => Promise<{ success: boolean; newPaths?: string[] }>; // New callback for multi-move
  onMoveToRoot?: (sourceNodes: TreeNode[]) => Promise<{ success: boolean; newPaths?: string[] }>; // New callback for moving to root
  onExpandFolder?: (node: TreeNode) => void;
}

// Utility function to check if a drop is valid
const isValidDrop = (draggedNode: TreeNode | null, targetNode: TreeNode): boolean => {
  if (!draggedNode) return false;
  
  // Can't drop on itself
  if (draggedNode.id === targetNode.id) return false;
  
  // Can only drop on folders
  if (targetNode.type !== 'folder') return false;
  
  // Can't drop a folder into itself or its descendants
  if (draggedNode.type === 'folder' && targetNode.path.startsWith(draggedNode.path)) {
    return false;
  }
  
  return true;
};

// Utility function to check if multiple nodes can be dropped
const isValidMultiDrop = (draggedNodes: TreeNode[], targetNode: TreeNode): boolean => {
  if (!draggedNodes.length) return false;
  
  // Check each node individually
  return draggedNodes.every(node => isValidDrop(node, targetNode));
};

// Utility function to check if drop to root is valid
const isValidRootDrop = (draggedNodes: TreeNode[]): boolean => {
  // All nodes should be valid for root drop (no parent-child conflicts)
  return draggedNodes.length > 0;
};

// Utility function to get visual feedback styles
export const getDragDropStyles = (
  isDragging: boolean,
  isDropTarget: boolean,
  isValidTarget: boolean,
  isBeingDragged: boolean
) => {
  let className = '';
  
  if (isBeingDragged) {
    className += ' opacity-50 bg-blue-50 dark:bg-blue-900/20';
  }
  
  if (isDropTarget && isValidTarget) {
    className += ' bg-blue-100 dark:bg-blue-800/40 border-blue-300 dark:border-blue-600';
  } else if (isDropTarget && !isValidTarget) {
    className += ' bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600';
  }
  
  if (isDragging) {
    className += ' cursor-grabbing';
  }
  
  return className.trim();
};

export const useDragDrop = (callbacks: DragDropCallbacks): [DragDropState, DragDropActions] => {
  const [state, setState] = useState<DragDropState>({
    isDragging: false,
    draggedNode: null,
    draggedNodes: [],
    dropTargetId: null,
    isValidDropTarget: false,
    showDropIndicator: false,
  });

  // Auto-expand folders on hover during drag
  const expandTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const handleDragStart = useCallback((e: React.DragEvent, node: TreeNode, selectedNodes: TreeNode[] = []) => {
    // Determine what nodes are being dragged
    const draggedNodes = selectedNodes.length > 0 ? selectedNodes : [node];
    
    // Set drag data - store all dragged nodes
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      draggedNode: node,
      draggedNodes: draggedNodes
    }));
    
    // Set custom drag image
    const dragImage = document.createElement('div');
    if (draggedNodes.length > 1) {
      dragImage.textContent = `${draggedNodes.length} files`;
      dragImage.className = 'px-2 py-1 bg-orange-100 border border-orange-300 rounded text-sm';
    } else {
      dragImage.textContent = node.name;
      dragImage.className = 'px-2 py-1 bg-blue-100 border border-blue-300 rounded text-sm';
    }
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    setState(prev => ({
      ...prev,
      isDragging: true,
      draggedNode: node,
      draggedNodes: draggedNodes,
    }));
  }, []);

  const handleDragEnd = useCallback(() => {
    setState({
      isDragging: false,
      draggedNode: null,
      draggedNodes: [],
      dropTargetId: null,
      isValidDropTarget: false,
      showDropIndicator: false,
    });

    // Clear ALL pending expand timeouts
    expandTimeouts.current.forEach(timeout => clearTimeout(timeout));
    expandTimeouts.current.clear();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, node: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check validity based on whether we have multiple nodes or single node
    const isValid = state.draggedNodes.length > 1 
      ? isValidMultiDrop(state.draggedNodes, node)
      : isValidDrop(state.draggedNode, node);
    
    // Set drop effect based on validity
    e.dataTransfer.dropEffect = isValid ? 'move' : 'none';
    
    setState(prev => ({
      ...prev,
      dropTargetId: node.id,
      isValidDropTarget: isValid,
      showDropIndicator: true,
    }));

    // Auto-expand folders after hovering for a delay
    if (isValid && node.type === 'folder' && callbacks.onExpandFolder) {
      // Clear any existing timeouts for this operation
      expandTimeouts.current.forEach(timeout => clearTimeout(timeout));
      expandTimeouts.current.clear();
      
      const timeout = setTimeout(() => {
        callbacks.onExpandFolder!(node);
        expandTimeouts.current.delete(timeout);
      }, 1000); // 1 second delay before expanding
      
      expandTimeouts.current.add(timeout);
    }
  }, [state.draggedNode, state.draggedNodes, callbacks.onExpandFolder]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setState(prev => ({
        ...prev,
        dropTargetId: null,
        isValidDropTarget: false,
        showDropIndicator: false,
      }));

      // Clear expand timeouts
      expandTimeouts.current.forEach(timeout => clearTimeout(timeout));
      expandTimeouts.current.clear();
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();

    const dragData = e.dataTransfer.getData('application/json');
    let draggedNode = state.draggedNode;
    let draggedNodes = state.draggedNodes;

    // Parse drag data if available
    if (dragData) {
      const parsed = JSON.parse(dragData);
      draggedNode = parsed.draggedNode || draggedNode;
      draggedNodes = parsed.draggedNodes || draggedNodes;
    }

    // Handle multiple nodes vs single node
    if (draggedNodes.length > 1) {
      if (!isValidMultiDrop(draggedNodes, targetNode)) return;
      
      try {
        // Use the new multi-move callback if available
        if (callbacks.onMoveMultiple) {
          const result = await callbacks.onMoveMultiple(draggedNodes, targetNode);
          if (!result.success) {
            console.error('Failed to move multiple items');
          }
        } else {
          // Fallback: move each item individually
          for (const node of draggedNodes) {
            await callbacks.onMove(node, targetNode);
          }
        }
      } catch (error) {
        console.error('Error during multi-drop operation:', error);
      }
    } else {
      // Single node drop (existing logic)
      if (!draggedNode || !isValidDrop(draggedNode, targetNode)) return;
      
      try {
        const result = await callbacks.onMove(draggedNode, targetNode);
        if (!result.success) {
          console.error('Failed to move item');
        }
      } catch (error) {
        console.error('Error during drop operation:', error);
      }
    }

    // Clear drag state
    setState({
      isDragging: false,
      draggedNode: null,
      draggedNodes: [],
      dropTargetId: null,
      isValidDropTarget: false,
      showDropIndicator: false,
    });
  }, [state.draggedNode, state.draggedNodes, callbacks.onMove, callbacks.onMoveMultiple]);

  const handleDropToRoot = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dragData = e.dataTransfer.getData('application/json');
    let draggedNodes = state.draggedNodes;

    // Parse drag data if available
    if (dragData) {
      const parsed = JSON.parse(dragData);
      draggedNodes = parsed.draggedNodes || [parsed.draggedNode].filter(Boolean);
    }

    if (!isValidRootDrop(draggedNodes)) return;

    try {
      if (callbacks.onMoveToRoot) {
        const result = await callbacks.onMoveToRoot(draggedNodes);
        if (!result.success) {
          console.error('Failed to move items to root');
        }
      }
    } catch (error) {
      console.error('Error during root drop operation:', error);
    }

    // Clear drag state
    setState({
      isDragging: false,
      draggedNode: null,
      draggedNodes: [],
      dropTargetId: null,
      isValidDropTarget: false,
      showDropIndicator: false,
    });
  }, [state.draggedNodes, callbacks.onMoveToRoot]);

  const clearDragState = useCallback(() => {
    setState({
      isDragging: false,
      draggedNode: null,
      draggedNodes: [],
      dropTargetId: null,
      isValidDropTarget: false,
      showDropIndicator: false,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      expandTimeouts.current.forEach(timeout => clearTimeout(timeout));
      expandTimeouts.current.clear();
    };
  }, []);

  const actions: DragDropActions = {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropToRoot,
    clearDragState,
  };

  return [state, actions];
}; 