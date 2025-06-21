/**
 * Native HTML5 drag-and-drop functionality for tree view
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TreeNode } from '@features/treeView';

export interface DragDropState {
  isDragging: boolean;
  draggedNode: TreeNode | null;
  dropTargetId: string | null;
  isValidDropTarget: boolean;
  showDropIndicator: boolean;
}

export interface DragDropActions {
  handleDragStart: (e: React.DragEvent, node: TreeNode) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, node: TreeNode) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetNode: TreeNode) => void;
  clearDragState: () => void;
}

export interface DragDropCallbacks {
  onMove: (sourceNode: TreeNode, targetNode: TreeNode) => Promise<{ success: boolean; newPath?: string }>;
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
    dropTargetId: null,
    isValidDropTarget: false,
    showDropIndicator: false,
  });

  // Auto-expand folders on hover during drag
  const expandTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const handleDragStart = useCallback((e: React.DragEvent, node: TreeNode) => {
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(node));
    
    // Set custom drag image (optional)
    const dragImage = document.createElement('div');
    dragImage.textContent = node.name;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.className = 'px-2 py-1 bg-blue-100 border border-blue-300 rounded text-sm';
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
    }));
  }, []);

  const handleDragEnd = useCallback(() => {
    setState({
      isDragging: false,
      draggedNode: null,
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
    
    const isValid = isValidDrop(state.draggedNode, node);
    
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
  }, [state.draggedNode, callbacks.onExpandFolder]);

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
    const draggedNode = dragData ? JSON.parse(dragData) as TreeNode : state.draggedNode;

    if (!draggedNode || !isValidDrop(draggedNode, targetNode)) {
      return;
    }

    try {
      const result = await callbacks.onMove(draggedNode, targetNode);
      
      if (!result.success) {
        // Could show an error message here
        console.error('Failed to move item');
      }
    } catch (error) {
      console.error('Error during drop operation:', error);
    }

    // Clear drag state
    setState({
      isDragging: false,
      draggedNode: null,
      dropTargetId: null,
      isValidDropTarget: false,
      showDropIndicator: false,
    });
  }, [state.draggedNode, callbacks.onMove]);

  const clearDragState = useCallback(() => {
    setState({
      isDragging: false,
      draggedNode: null,
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
    clearDragState,
  };

  return [state, actions];
}; 