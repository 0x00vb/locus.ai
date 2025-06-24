/**
 * Notes operations - handles file creation, deletion, reading, writing
 */

import { IPCService } from '@shared/services/ipc';
import { getInitialContent } from '@shared/utils/file-templates';
import type { TreeNode } from '@features/treeView';

export interface NoteOperationsCallbacks {
  onFileTreeUpdate: () => Promise<void>;
  onNoteSelect: (path: string, node: TreeNode) => void;
}

export class NoteOperations {
  private callbacks: NoteOperationsCallbacks;

  constructor(callbacks: NoteOperationsCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Create a new note file
   */
  async createNote(
    fileName: string,
    createType: 'file' | 'folder',
    targetFolder?: TreeNode | null
  ): Promise<boolean> {
    try {
      let fullFileName = fileName;
      if (createType === 'file' && !fileName.includes('.')) {
        fullFileName = `${fileName}.txt`;
      }
      
      let finalPath = fullFileName;
      if (targetFolder) {
        finalPath = `${targetFolder.path}/${fullFileName}`;
      }
      
      const extension = fullFileName.split('.').pop() || 'txt';
      const content = createType === 'file' ? getInitialContent(extension) : '';
      
      if (createType === 'file') {
        const result = await IPCService.createNote(finalPath, content);
        if (result) {
          await this.callbacks.onFileTreeUpdate();
          
          // Auto-open newly created file
          this.callbacks.onNoteSelect(finalPath, {
            id: fullFileName,
            name: fullFileName,
            type: 'file',
            path: finalPath,
          });
          
          return true;
        }
      } else {
        const result = await IPCService.createFolder(finalPath);
        if (result) {
          await this.callbacks.onFileTreeUpdate();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to create ${createType}:`, error);
      return false;
    }
  }

  /**
   * Read note content
   */
  async readNote(filePath: string): Promise<string | null> {
    try {
      const content = await IPCService.readNote(filePath);
      // Return content even if it's an empty string - only return null if undefined
      return content !== undefined ? content : null;
    } catch (error) {
      console.error('Failed to read note:', error);
      return null;
    }
  }

  /**
   * Save note content
   */
  async saveNote(filePath: string, content: string): Promise<boolean> {
    try {
      const result = await IPCService.writeNote(filePath, content);
      if (result) {
        await this.callbacks.onFileTreeUpdate();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save note:', error);
      return false;
    }
  }

  /**
   * Delete a note or folder
   */
  async deleteItem(node: TreeNode): Promise<boolean> {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${node.name}"?${
          node.type === 'folder' ? ' This will delete all contents.' : ''
        }`
      );
      
      if (!confirmed) return false;
      
      let result: boolean | undefined = false;
      if (node.type === 'file') {
        result = await IPCService.deleteNote(node.path);
      } else {
        result = await IPCService.deleteFolder(node.path);
      }
      
      if (result) {
        await this.callbacks.onFileTreeUpdate();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to delete ${node.type}:`, error);
      alert(`Failed to delete ${node.type}. Please try again.`);
      return false;
    }
  }

  /**
   * Rename a note or folder
   */
  async renameItem(node: TreeNode, newName: string): Promise<{ success: boolean; newPath?: string }> {
    try {
      if (newName === node.name) {
        return { success: true };
      }
      
      const oldPath = node.path;
      const newPath = newName;
      
      let result: boolean | undefined = false;
      if (node.type === 'file') {
        result = await IPCService.renameNote(oldPath, newPath);
      } else {
        result = await IPCService.renameFolder(oldPath, newPath);
      }
      
      if (result) {
        await this.callbacks.onFileTreeUpdate();
        return { success: true, newPath };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Failed to rename item:', error);
      return { success: false };
    }
  }

  /**
   * Move a file or folder to a new location
   */
  async moveItem(sourceNode: TreeNode, targetFolderNode: TreeNode): Promise<{ success: boolean; newPath?: string }> {
    try {
      // Validate the move operation
      if (sourceNode.path === targetFolderNode.path) {
        return { success: false }; // Can't move to itself
      }

      // Prevent moving a folder into itself or its descendants
      if (sourceNode.type === 'folder' && targetFolderNode.path.startsWith(sourceNode.path)) {
        return { success: false }; // Would create infinite loop
      }

      // Construct the new path
      const fileName = sourceNode.name;
      const newPath = `${targetFolderNode.path}/${fileName}`;

      // Perform the move operation
      const result = await IPCService.moveItem(sourceNode.path, newPath);
      
      if (result) {
        await this.callbacks.onFileTreeUpdate();
        return { success: true, newPath };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Failed to move item:', error);
      return { success: false };
    }
  }
} 