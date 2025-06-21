import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';

export interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
  size?: number;
  updatedAt?: Date;
}

export interface DragDropHandlers {
  onDragStart?: (e: React.DragEvent, node: TreeNode) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent, node: TreeNode) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, node: TreeNode) => void;
}

export interface TreeViewProps {
  nodes: TreeNode[];
  onSelect: (path: string, node: TreeNode) => void;
  onContextMenu?: (event: React.MouseEvent, node: TreeNode) => void;
  selectedPath?: string;
  className?: string;
  dragDropHandlers?: DragDropHandlers;
  dragDropState?: {
    isDragging: boolean;
    draggedNode: TreeNode | null;
    dropTargetId: string | null;
    isValidDropTarget: boolean;
  };
  onExpandFolder?: (node: TreeNode) => void;
}

export interface TreeNodeItemProps {
  node: TreeNode;
  onSelect: (path: string, node: TreeNode) => void;
  onContextMenu?: (event: React.MouseEvent, node: TreeNode) => void;
  selectedPath?: string;
  depth?: number;
  dragDropHandlers?: DragDropHandlers;
  dragDropState?: {
    isDragging: boolean;
    draggedNode: TreeNode | null;
    dropTargetId: string | null;
    isValidDropTarget: boolean;
  };
  onExpandFolder?: (node: TreeNode) => void;
}

const getDragDropStyles = (
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

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ 
  node, 
  onSelect, 
  onContextMenu, 
  selectedPath, 
  depth = 0,
  dragDropHandlers,
  dragDropState,
  onExpandFolder
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  // Drag and drop state
  const isDragging = dragDropState?.isDragging || false;
  const isBeingDragged = dragDropState?.draggedNode?.id === node.id;
  const isDropTarget = dragDropState?.dropTargetId === node.id;
  const isValidTarget = dragDropState?.isValidDropTarget || false;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      
      // Call onExpandFolder if provided and we're expanding
      if (newExpanded && onExpandFolder) {
        onExpandFolder(node);
      }
    }
  };

  const handleSelect = () => {
    onSelect(node.path, node);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, node);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (dragDropHandlers?.onDragStart) {
      dragDropHandlers.onDragStart(e, node);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (dragDropHandlers?.onDragEnd) {
      dragDropHandlers.onDragEnd();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (dragDropHandlers?.onDragOver) {
      dragDropHandlers.onDragOver(e, node);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (dragDropHandlers?.onDragLeave) {
      dragDropHandlers.onDragLeave(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (dragDropHandlers?.onDrop) {
      dragDropHandlers.onDrop(e, node);
    }
  };

  // Apply drag and drop styles
  const dragDropClasses = getDragDropStyles(isDragging, isDropTarget, isValidTarget, isBeingDragged);

  return (
    <div className="select-none">
      <div
        className={`flex gap-1 items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
          isSelected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
        } ${dragDropClasses}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        draggable={dragDropHandlers ? true : false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm mr-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        
        {!hasChildren && <div className="w-4" />}
        
        <div className="flex gap-3 mr-2">
          {node.type === 'folder' ? (
            <Folder className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          ) : (
            <File className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        
        <span className="flex-1 truncate text-sm" title={node.name}>
          {node.name}
        </span>
      </div>
      
      {/* Render children if expanded and has children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              selectedPath={selectedPath}
              depth={depth + 1}
              dragDropHandlers={dragDropHandlers}
              dragDropState={dragDropState}
              onExpandFolder={onExpandFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({ 
  nodes, 
  onSelect, 
  onContextMenu,
  selectedPath, 
  className = '',
  dragDropHandlers,
  dragDropState,
  onExpandFolder
}) => {

  return (
    <div className={`text-sm ${className}`}>
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          selectedPath={selectedPath}
          dragDropHandlers={dragDropHandlers}
          dragDropState={dragDropState}
          onExpandFolder={onExpandFolder}
        />
      ))}
    </div>
  );
};

// Utility function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default TreeView; 