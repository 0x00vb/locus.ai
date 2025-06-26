const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Core notes operations
  listNotes: (path: string) => ipcRenderer.invoke('core:listNotes', path),
  listFilesAndFolders: (path: string) => ipcRenderer.invoke('core:listFilesAndFolders', path),
  readNote: (filePath: string) => ipcRenderer.invoke('core:readNote', filePath),
  writeNote: (filePath: string, content: string) => ipcRenderer.invoke('core:writeNote', filePath, content),
  deleteNote: (filePath: string) => ipcRenderer.invoke('core:deleteNote', filePath),
  deleteFolder: (folderPath: string) => ipcRenderer.invoke('core:deleteFolder', folderPath),
  renameNote: (oldPath: string, newPath: string) => ipcRenderer.invoke('core:renameNote', oldPath, newPath),
  renameFolder: (oldPath: string, newPath: string) => ipcRenderer.invoke('core:renameFolder', oldPath, newPath),
  moveItem: (sourcePath: string, targetPath: string) => ipcRenderer.invoke('core:moveItem', sourcePath, targetPath),
  createNote: (filePath: string, content: string) => ipcRenderer.invoke('core:createNote', filePath, content),
  createFolder: (folderPath: string) => ipcRenderer.invoke('core:createFolder', folderPath),
  
  // Workspace operations
  getCurrentWorkspace: () => ipcRenderer.invoke('core:getCurrentWorkspace'),
  selectWorkspace: () => ipcRenderer.invoke('core:selectWorkspace'),
  onWorkspaceChanged: (callback: (workspace: string) => void) => {
    ipcRenderer.on('workspace-changed', (_event: any, workspace: any) => callback(workspace));
  },
  hasUnsavedChanges: () => {
    // Check if the window has a tabbedEditorAPI and if it has unsaved changes
    if ((window as any).tabbedEditorAPI && typeof (window as any).tabbedEditorAPI.hasUnsavedChanges === 'function') {
      return (window as any).tabbedEditorAPI.hasUnsavedChanges();
    }
    return false;
  },

  // Window control operations
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Terminal operations
  terminal: {
    create: (name: string, options?: any) => ipcRenderer.invoke('terminal:create', name, options),
    write: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
    close: (id: string) => ipcRenderer.invoke('terminal:close', id),
    list: () => ipcRenderer.invoke('terminal:list'),
    onData: (callback: (id: string, data: string) => void) => {
      ipcRenderer.on('terminal:data', (_event: any, id: any, data: any) => callback(id, data));
    },
    onExit: (callback: (id: string, code: number, signal: string) => void) => {
      ipcRenderer.on('terminal:exit', (_event: any, id: any, code: any, signal: any) => callback(id, code, signal));
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('terminal:data');
      ipcRenderer.removeAllListeners('terminal:exit');
    },
  },
});

// Keep electronAPI for backwards compatibility
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    deleteFile: (filePath: string) => ipcRenderer.invoke('fs:deleteFile', filePath),
    createFolder: (folderPath: string) => ipcRenderer.invoke('fs:createFolder', folderPath),
    deleteFolder: (folderPath: string) => ipcRenderer.invoke('fs:deleteFolder', folderPath),
    exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
    listFiles: (dirPath: string) => ipcRenderer.invoke('fs:listFiles', dirPath),
  },

  // Embeddings database operations
  embeddingsDB: {
    init: (dbPath: string) => ipcRenderer.invoke('embeddings:init', dbPath),
    close: () => ipcRenderer.invoke('embeddings:close'),
    insertEmbedding: (record: any) => ipcRenderer.invoke('embeddings:insertEmbedding', record),
    getEmbeddingsByPath: (filePath: string) => ipcRenderer.invoke('embeddings:getEmbeddingsByPath', filePath),
    deleteEmbeddingsByPath: (filePath: string) => ipcRenderer.invoke('embeddings:deleteEmbeddingsByPath', filePath),
    getAllEmbeddings: () => ipcRenderer.invoke('embeddings:getAllEmbeddings'),
    clearAllEmbeddings: () => ipcRenderer.invoke('embeddings:clearAllEmbeddings'),
  },

  // Agent service operations
  agent: {
    processCodebase: () => ipcRenderer.invoke('agent:processCodebase'),
    searchSimilar: (query: string, limit?: number) => ipcRenderer.invoke('agent:searchSimilar', query, limit),
    getStats: () => ipcRenderer.invoke('agent:getStats'),
    rebuild: () => ipcRenderer.invoke('agent:rebuild'),
    getFileList: (baseDir?: string, extensions?: string[]) => ipcRenderer.invoke('agent:getFileList', baseDir, extensions),
    readFileContent: (filePath: string) => ipcRenderer.invoke('agent:readFileContent', filePath),
    updateConfig: (config: any) => ipcRenderer.invoke('agent:updateConfig', config),
    getConfig: () => ipcRenderer.invoke('agent:getConfig'),
  },

  // Menu listeners
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-new-note', () => callback('new-note'));
    ipcRenderer.on('menu-new-folder', () => callback('new-folder'));
    ipcRenderer.on('menu-save', () => callback('save'));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Main process messages
  onMainProcessMessage: (callback: (message: any) => void) => {
    ipcRenderer.on('main-process-message', (_event: any, message: any) => callback(message));
  },
}); 