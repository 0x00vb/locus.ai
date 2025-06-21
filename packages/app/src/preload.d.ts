declare global {
  interface Window {
    api: {
      listNotes: (dir?: string) => Promise<import('@notty/core').NoteFile[]>;
      listFilesAndFolders: (dir?: string) => Promise<import('@notty/core').FileSystemItem[]>;
      readNote: (path: string) => Promise<string>;
      writeNote: (path: string, content: string) => Promise<boolean>;
      deleteNote: (path: string) => Promise<boolean>;
      deleteFolder: (path: string) => Promise<boolean>;
      renameNote: (oldPath: string, newName: string) => Promise<boolean>;
      renameFolder: (oldPath: string, newName: string) => Promise<boolean>;
      moveItem: (sourcePath: string, targetPath: string) => Promise<boolean>;
      createNote: (fileName: string, content?: string) => Promise<string>;
      createFolder: (folderPath: string) => Promise<boolean>;
      
      // Workspace operations
      getCurrentWorkspace: () => Promise<string>;
      selectWorkspace: () => Promise<string | null>;
      onWorkspaceChanged?: (callback: (workspace: string) => void) => void;

      // Window control operations
        minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;

  terminal: {
    create: (id: string, options: { cols: number, rows: number, cwd?: string }) => Promise<string>;
    write: (id: string, data: string) => Promise<void>;
    resize: (id: string, cols: number, rows: number) => Promise<void>;
    close: (id: string) => Promise<void>;
    list: () => Promise<string[]>;
    onData: (callback: (id: string, data: string) => void) => void;
    onExit: (callback: (id: string, code: number, signal?: number) => void) => void;
    removeListeners: () => void;
  };
};
    electronAPI: {
      notes: {
        create: (note: any) => Promise<{ success: boolean; error?: string }>;
        read: (noteId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
        update: (note: any) => Promise<{ success: boolean; error?: string }>;
        delete: (noteId: string) => Promise<{ success: boolean; error?: string }>;
        rename: (noteId: string, newTitle: string) => Promise<{ success: boolean; error?: string }>;
        getAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
        search: (query: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
      folders: {
        create: (folder: any) => Promise<{ success: boolean; error?: string }>;
        read: (folderId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
        update: (folder: any) => Promise<{ success: boolean; error?: string }>;
        delete: (folderId: string) => Promise<{ success: boolean; error?: string }>;
        rename: (folderId: string, newName: string) => Promise<{ success: boolean; error?: string }>;
        getAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
      fs: {
        listDirectory: (dirPath: string, recursive?: boolean) => 
          Promise<{ success: boolean; data?: any[]; error?: string }>;
        createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
        deleteDirectory: (dirPath: string, recursive?: boolean) => 
          Promise<{ success: boolean; error?: string }>;
        readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
        writeFile: (filePath: string, content: string) => 
          Promise<{ success: boolean; error?: string }>;
        deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
        renameFile: (oldPath: string, newPath: string) => 
          Promise<{ success: boolean; error?: string }>;
        exists: (filePath: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
        getFileStats: (filePath: string) => 
          Promise<{ success: boolean; data?: any; error?: string }>;
        getBasePath: () => Promise<{ success: boolean; data?: string; error?: string }>;
        getDirectorySize: (dirPath: string) => 
          Promise<{ success: boolean; data?: number; error?: string }>;
        searchFiles: (query: string, dirPath?: string) => 
          Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
      debug: {
        createMockData: () => Promise<{ success: boolean; message?: string; error?: string }>;
      };
      onMenuAction: (callback: (action: string) => void) => void;
      removeAllListeners: (channel: string) => void;
      onMainProcessMessage: (callback: (message: string) => void) => void;
    };
  }
}

export {}; 