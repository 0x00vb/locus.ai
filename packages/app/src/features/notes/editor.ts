/**
 * Notes editor state management
 */

import { useState, useCallback } from 'react';
import type { TreeNode } from '@notty/ui';

export interface EditorState {
  selectedPath: string;
  selectedContent: string;
  selectedNote: TreeNode | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}

export interface EditorActions {
  setSelectedPath: (path: string) => void;
  setSelectedContent: (content: string) => void;
  setSelectedNote: (note: TreeNode | null) => void;
  setIsEditing: (editing: boolean) => void;
  setHasUnsavedChanges: (changes: boolean) => void;
  handleContentChange: (content: string) => void;
  resetEditor: () => void;
}

export const useEditorState = (): [EditorState, EditorActions] => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<TreeNode | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const handleContentChange = useCallback((content: string) => {
    setSelectedContent(content);
    setHasUnsavedChanges(true);
  }, []);

  const resetEditor = useCallback(() => {
    setSelectedPath('');
    setSelectedContent('');
    setSelectedNote(null);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, []);

  const state: EditorState = {
    selectedPath,
    selectedContent,
    selectedNote,
    isEditing,
    hasUnsavedChanges,
  };

  const actions: EditorActions = {
    setSelectedPath,
    setSelectedContent,
    setSelectedNote,
    setIsEditing,
    setHasUnsavedChanges,
    handleContentChange,
    resetEditor,
  };

  return [state, actions];
};

export const createEditorHandlers = (
  editorState: EditorState,
  editorActions: EditorActions,
  noteOperations: any
) => {
  const handleFileSelect = async (filePath: string, node: TreeNode) => {
    if (node.type === 'file') {
      try {
        editorActions.setSelectedPath(filePath);
        editorActions.setSelectedNote(node);
        editorActions.setSelectedContent('Loading...');
        editorActions.setIsEditing(true);
        
        const content = await noteOperations.readNote(filePath);
        if (content !== null) {
          editorActions.setSelectedContent(content);
          editorActions.setHasUnsavedChanges(false);
        } else {
          editorActions.setSelectedContent('Error loading file content.');
        }
      } catch (error) {
        console.error('Failed to read note:', error);
        editorActions.setSelectedContent('Error loading file content.');
      }
    }
  };

  const handleSave = async () => {
    if (!editorState.selectedNote || !editorState.selectedPath) return;
    
    try {
      const success = await noteOperations.saveNote(editorState.selectedPath, editorState.selectedContent);
      if (success) {
        editorActions.setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  return {
    handleFileSelect,
    handleSave,
  };
}; 