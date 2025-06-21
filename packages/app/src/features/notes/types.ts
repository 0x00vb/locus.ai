/**
 * Types for the notes feature
 */

import type { TreeNode } from '@notty/ui';

export interface NoteFile {
  id: string;
  name: string;
  path: string;
  type: 'file';
  content?: string;
  size?: number;
  updatedAt?: Date;
}

export interface NoteFolder {
  id: string;
  name: string;
  path: string;
  type: 'folder';
  children?: (NoteFile | NoteFolder)[];
}

export type NoteItem = NoteFile | NoteFolder;

export interface NoteEditorState {
  selectedPath: string;
  selectedContent: string;
  selectedNote: TreeNode | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}

export interface NoteCreationState {
  showCreateInput: boolean;
  createInputValue: string;
  createType: 'file' | 'folder';
  targetFolder: TreeNode | null;
}

export interface NoteRenameState {
  showRenameInput: boolean;
  renameInputValue: string;
  renamingNode: TreeNode | null;
} 