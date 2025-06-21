/**
 * EditorService manages editor-related utilities and state operations
 */
export interface EditorState {
  selectedPath: string;
  selectedContent: string;
  selectedNote: any | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}

export class EditorService {
  /**
   * Extracts the file name from a full path
   */
  static getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  /**
   * Returns true if the content has changed
   */
  static hasContentChanged(original: string, current: string): boolean {
    return original !== current;
  }

  /**
   * Creates a debounced auto-save handler
   */
  static createAutoSave(
    saveCallback: () => Promise<void>,
    delay: number = 2000
  ) {
    let timeoutId: NodeJS.Timeout | null = null;

    const trigger = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await saveCallback();
        timeoutId = null;
      }, delay);
    };

    const cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return { trigger, cancel, destroy: cancel };
  }

  /**
   * Handles common editor keyboard shortcuts (save, new file, find)
   * Returns true if a shortcut was handled
   */
  static handleEditorKeydown(
    event: KeyboardEvent,
    callbacks: {
      onSave?: () => void;
      onNewFile?: () => void;
      onFind?: () => void;
    }
  ): boolean {
    const isCmdOrCtrl = event.ctrlKey || event.metaKey;
    if (!isCmdOrCtrl) return false;

    const key = event.key.toLowerCase();

    const handlerMap: Record<string, (() => void) | undefined> = {
      s: callbacks.onSave,
      n: callbacks.onNewFile,
      f: callbacks.onFind,
    };

    const handler = handlerMap[key];
    if (handler) {
      event.preventDefault();
      handler();
      return true;
    }

    return false;
  }
}
