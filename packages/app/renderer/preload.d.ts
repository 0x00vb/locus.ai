declare global {
  interface Window {
    api: {
      listNotes: (dir?: string) => Promise<import('@domains/fileSystem').NoteFile[]>;
      listFilesAndFolders: (dir?: string) => Promise<import('@domains/fileSystem').FileSystemItem[]>;
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
      hasUnsavedChanges: () => boolean;

      // Window control operations
        minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;

      // AI Chat operations
      getOllamaModels?: () => Promise<string[]>;
      sendChatMessage?: (params: { modelId: string; prompt: string; temperature?: number }) => Promise<string>;

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
      // File system operations
      fs: {
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
      debug: {
        createMockData: () => Promise<{ success: boolean; message?: string; error?: string }>;
      };
      
      // Embeddings database operations
      embeddingsDB: {
        init: (dbPath: string) => Promise<void>;
        close: () => Promise<void>;
        insertEmbedding: (record: {
          id: string;
          path: string;
          chunk: string;
          vector: Buffer;
        }) => Promise<void>;
        getEmbeddingsByPath: (filePath: string) => Promise<Array<{
          id: string;
          path: string;
          chunk: string;
          vector: Buffer;
          created_at?: string;
          updated_at?: string;
        }>>;
        deleteEmbeddingsByPath: (filePath: string) => Promise<void>;
        getAllEmbeddings: () => Promise<Array<{
          id: string;
          path: string;
          chunk: string;
          vector: Buffer;
          created_at?: string;
          updated_at?: string;
        }>>;
        clearAllEmbeddings: () => Promise<void>;
      };
      
      // Agent service operations
      agent: {
        processCodebase: () => Promise<{
          totalFiles: number;
          processedFiles: number;
          totalChunks: number;
          processedChunks: number;
          errors: string[];
          startTime: number;
          endTime?: number;
        }>;
        searchSimilar: (query: string, limit?: number) => Promise<Array<{
          record: {
            id: string;
            path: string;
            chunk: string;
            vector: Buffer;
            created_at?: string;
            updated_at?: string;
          };
          similarity: number;
        }>>;
        getStats: () => Promise<{
          totalEmbeddings: number;
          uniqueFiles: number;
          dbSize: string;
        }>;
        rebuild: () => Promise<{
          totalFiles: number;
          processedFiles: number;
          totalChunks: number;
          processedChunks: number;
          errors: string[];
          startTime: number;
          endTime?: number;
        }>;
        getFileList: (baseDir?: string, extensions?: string[]) => Promise<string[]>;
        readFileContent: (filePath: string) => Promise<string | null>;
        updateConfig: (config: {
          projectRoot?: string;
          ollamaBaseUrl?: string;
          embeddingModel?: string;
          dbPath?: string;
          chunkSize?: number;
        }) => Promise<void>;
        getConfig: () => Promise<{
          projectRoot: string;
          ollamaBaseUrl?: string;
          embeddingModel?: string;
          dbPath?: string;
          chunkSize?: number;
        }>;
      };
      
      onMenuAction: (callback: (action: string) => void) => void;
      removeAllListeners: (channel: string) => void;
      onMainProcessMessage: (callback: (message: string) => void) => void;
    };

    // Global reference to tabbed editor API for unsaved changes check
    tabbedEditorAPI?: {
      hasUnsavedChanges: () => boolean;
    };
  }
}

export {}; 