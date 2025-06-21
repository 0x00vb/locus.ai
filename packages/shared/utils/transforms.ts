/**
 * Data transformation utilities
 */

import type { FileSystemItem } from '@domains/fileSystem';
import type { TreeNode } from '@features/treeView';

/**
 * Transform FileSystemItem to TreeNode format
 */
export function transformFileSystemToTreeNodes(items: FileSystemItem[]): TreeNode[] {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    path: item.path,
    size: item.size,
    updatedAt: item.updatedAt,
    children: item.children ? transformFileSystemToTreeNodes(item.children) : undefined,
  }));
} 