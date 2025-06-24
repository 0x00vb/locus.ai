/**
 * Multi-select functionality for tree items
 */

import { useState, useCallback } from 'react';
import type { TreeNode } from '@features/treeView';

export interface MultiSelectState {
  selectedPaths: string[];
  lastSelectedPath: string | null;
}

export interface MultiSelectActions {
  handleSelection: (path: string, node: TreeNode, isMultiSelect: boolean) => void;
  clearSelection: () => void;
  isSelected: (path: string) => boolean;
  getSelectedNodes: (allNodes: TreeNode[]) => TreeNode[];
  selectAll: (paths: string[]) => void;
  toggleSelection: (path: string) => void;
}

export const useMultiSelect = (
  onSelectionChange?: (selectedPaths: string[], selectedNodes: TreeNode[]) => void
): [MultiSelectState, MultiSelectActions] => {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [lastSelectedPath, setLastSelectedPath] = useState<string | null>(null);

  // Utility function to find all nodes by paths (recursive)
  const findNodesByPaths = useCallback((nodes: TreeNode[], paths: string[]): TreeNode[] => {
    const result: TreeNode[] = [];
    
    const findInNodes = (nodeList: TreeNode[]) => {
      for (const node of nodeList) {
        if (paths.includes(node.path)) {
          result.push(node);
        }
        if (node.children) {
          findInNodes(node.children);
        }
      }
    };
    
    findInNodes(nodes);
    return result;
  }, []);

  const handleSelection = useCallback((path: string, node: TreeNode, isMultiSelect: boolean) => {
    let newSelectedPaths: string[];

    if (isMultiSelect) {
      // Multi-select mode (Ctrl+click)
      if (selectedPaths.includes(path)) {
        // Deselect if already selected
        newSelectedPaths = selectedPaths.filter(p => p !== path);
      } else {
        // Add to selection
        newSelectedPaths = [...selectedPaths, path];
      }
    } else {
      // Single select mode (normal click)
      newSelectedPaths = [path];
    }

    setSelectedPaths(newSelectedPaths);
    setLastSelectedPath(path);

    // Notify parent of selection change if callback provided
    if (onSelectionChange) {
      // We'll need to get the nodes from the parent, for now just pass empty array
      onSelectionChange(newSelectedPaths, [node]);
    }
  }, [selectedPaths, onSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectedPaths([]);
    setLastSelectedPath(null);
    if (onSelectionChange) {
      onSelectionChange([], []);
    }
  }, [onSelectionChange]);

  const isSelected = useCallback((path: string) => {
    return selectedPaths.includes(path);
  }, [selectedPaths]);

  const getSelectedNodes = useCallback((allNodes: TreeNode[]) => {
    return findNodesByPaths(allNodes, selectedPaths);
  }, [selectedPaths, findNodesByPaths]);

  const selectAll = useCallback((paths: string[]) => {
    setSelectedPaths(paths);
    if (onSelectionChange) {
      onSelectionChange(paths, []);
    }
  }, [onSelectionChange]);

  const toggleSelection = useCallback((path: string) => {
    const newSelectedPaths = selectedPaths.includes(path)
      ? selectedPaths.filter(p => p !== path)
      : [...selectedPaths, path];
    
    setSelectedPaths(newSelectedPaths);
    if (onSelectionChange) {
      onSelectionChange(newSelectedPaths, []);
    }
  }, [selectedPaths, onSelectionChange]);

  const state: MultiSelectState = {
    selectedPaths,
    lastSelectedPath,
  };

  const actions: MultiSelectActions = {
    handleSelection,
    clearSelection,
    isSelected,
    getSelectedNodes,
    selectAll,
    toggleSelection,
  };

  return [state, actions];
}; 