/**
 * Custom hook for managing keyboard shortcuts
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcuts {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, key, shiftKey, altKey } = event;
    
    // Build the shortcut key
    let shortcutKey = '';
    if (ctrlKey || metaKey) shortcutKey += 'mod+';
    if (shiftKey) shortcutKey += 'shift+';
    if (altKey) shortcutKey += 'alt+';
    shortcutKey += key.toLowerCase();

    // Check if we have a handler for this shortcut
    if (shortcuts[shortcutKey]) {
      event.preventDefault();
      shortcuts[shortcutKey]();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Helper to create common shortcuts
export const createShortcuts = (handlers: {
  onSave?: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onFind?: () => void;
  onToggleTheme?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}): KeyboardShortcuts => {
  const shortcuts: KeyboardShortcuts = {};

  if (handlers.onSave) {
    shortcuts['mod+s'] = handlers.onSave;
  }
  
  if (handlers.onNewFile) {
    shortcuts['mod+n'] = handlers.onNewFile;
  }
  
  if (handlers.onNewFolder) {
    shortcuts['mod+shift+n'] = handlers.onNewFolder;
  }
  
  if (handlers.onFind) {
    shortcuts['mod+f'] = handlers.onFind;
  }
  
  if (handlers.onToggleTheme) {
    shortcuts['mod+shift+t'] = handlers.onToggleTheme;
  }
  
  if (handlers.onDelete) {
    shortcuts['delete'] = handlers.onDelete;
  }
  
  if (handlers.onRename) {
    shortcuts['f2'] = handlers.onRename;
  }

  return shortcuts;
}; 