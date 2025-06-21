const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Core notes operations
  listNotes: (dir?: string) => ipcRenderer.invoke('core:listNotes', dir),
  listFilesAndFolders: (dir?: string) => ipcRenderer.invoke('core:listFilesAndFolders', dir),
  readNote: (path: string) => ipcRenderer.invoke('core:readNote', path),
  writeNote: (path: string, content: string) => ipcRenderer.invoke('core:writeNote', path, content),
  deleteNote: (path: string) => ipcRenderer.invoke('core:deleteNote', path),
  deleteFolder: (path: string) => ipcRenderer.invoke('core:deleteFolder', path),
  renameNote: (oldPath: string, newName: string) => ipcRenderer.invoke('core:renameNote', oldPath, newName),
  renameFolder: (oldPath: string, newName: string) => ipcRenderer.invoke('core:renameFolder', oldPath, newName),
  moveItem: (sourcePath: string, targetPath: string) => ipcRenderer.invoke('core:moveItem', sourcePath, targetPath),
  createNote: (fileName: string, content?: string) => ipcRenderer.invoke('core:createNote', fileName, content),
  createFolder: (folderPath: string) => ipcRenderer.invoke('core:createFolder', folderPath),
  
  // Workspace operations
  getCurrentWorkspace: () => ipcRenderer.invoke('core:getCurrentWorkspace'),
  selectWorkspace: () => ipcRenderer.invoke('core:selectWorkspace'),
  onWorkspaceChanged: (callback: (workspace: string) => void) => {
    ipcRenderer.on('workspace-changed', (_: any, workspace: string) => callback(workspace));
  },

  // Window control operations
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Terminal operations
  terminal: {
    create: (id: string, options: { cols: number, rows: number, cwd?: string }) => 
      ipcRenderer.invoke('terminal:create', id, options),
    write: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) => 
      ipcRenderer.invoke('terminal:resize', id, cols, rows),
    close: (id: string) => ipcRenderer.invoke('terminal:close', id),
    list: () => ipcRenderer.invoke('terminal:list'),
    onData: (callback: (id: string, data: string) => void) => {
      ipcRenderer.on('terminal:data', (_: any, id: string, data: string) => callback(id, data));
    },
    onExit: (callback: (id: string, code: number, signal?: number) => void) => {
      ipcRenderer.on('terminal:exit', (_: any, id: string, code: number, signal?: number) => 
        callback(id, code, signal));
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
    writeFile: (filePath: string, content: string) =>
      ipcRenderer.invoke('fs:writeFile', filePath, content),
    deleteFile: (filePath: string) =>
      ipcRenderer.invoke('fs:deleteFile', filePath),
    createFolder: (folderPath: string) =>
      ipcRenderer.invoke('fs:createFolder', folderPath),
    deleteFolder: (folderPath: string) =>
      ipcRenderer.invoke('fs:deleteFolder', folderPath),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    listFiles: (dirPath: string) => ipcRenderer.invoke('fs:listFiles', dirPath),
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
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_: any, message: any) => callback(message));
  },
}); 