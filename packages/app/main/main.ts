import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as os from 'node:os';
import { FileSystemService } from '@domains/fileSystem';
import { TerminalService } from '@shared/services/terminal';
import { spawn, ChildProcess } from 'child_process';
import { EmbeddingsDatabase } from './agent/db/database';
import { agentService } from './agent/agentService';

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== Unhandled Promise Rejection ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('=== Uncaught Exception ===');
  console.error(err);
});


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// ├─┬ dist-electron
// │ ├── main.js
// │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;

// Initialize FileSystemService with default notes directory
let currentWorkspace = path.join(os.homedir(), 'Documents', 'Notty');
let fileSystemService = new FileSystemService(currentWorkspace);

// Initialize TerminalService
let terminalService = new TerminalService();

// Embeddings database instance
let embeddingsDatabase: EmbeddingsDatabase | null = null;

function createWindow() {
  const distPath = process.env.DIST || path.join(__dirname, '../dist');
  const publicPath = process.env.VITE_PUBLIC || path.join(distPath, '../public');
  
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove native window frame
    titleBarStyle: 'hidden', // Hide title bar for all platforms
    icon: path.join(publicPath, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false, // Don't show until ready
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(distPath, 'index.html'));
  }

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win?.show();
  });

  // Handle window closed
  win.on('closed', () => {
    win = null;
  });

  // Handle external links
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  createWindow();

  // Initialize agent service with current workspace
  try {
    await agentService.initialize({
      projectRoot: currentWorkspace,
      ollamaBaseUrl: 'http://localhost:11434',
      embeddingModel: 'nomic-embed-text',
      dbPath: path.join(currentWorkspace, '.vscode', 'embeddings.json'),
      chunkSize: 1000
    });
  } catch (error) {
    console.warn('Failed to initialize agent service:', error);
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Set up application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Select Workspace',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            // Check for unsaved files first
            const hasUnsavedChanges = await win?.webContents.executeJavaScript(`
              window.api && typeof window.api.hasUnsavedChanges === 'function' 
                ? window.api.hasUnsavedChanges() 
                : false
            `);

            if (hasUnsavedChanges) {
              const response = dialog.showMessageBoxSync(win!, {
                type: 'warning',
                title: 'Unsaved Changes',
                message: 'You have unsaved changes that will be lost.',
                detail: 'Do you want to continue changing the workspace?',
                buttons: ['Cancel', 'Continue'],
                defaultId: 0,
                cancelId: 0,
              });

              if (response === 0) {
                return; // User cancelled
              }
            }

            const result = await dialog.showOpenDialog(win!, {
              title: 'Select Workspace Directory',
              message: 'Choose the folder where your notes will be stored',
              properties: ['openDirectory', 'createDirectory'],
              defaultPath: currentWorkspace,
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const newWorkspace = result.filePaths[0];
              
              // Store the new workspace for restart
              currentWorkspace = newWorkspace;
              
              // Close current window and create new one with new workspace
              if (win) {
                win.close();
                // Create new window after a short delay to ensure clean shutdown
                setTimeout(() => {
                  fileSystemService = new FileSystemService(newWorkspace);
                  createWindow();
                }, 100);
              }
            }
          },
        },
        { type: 'separator' },
        {
          label: 'New Note',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            win?.webContents.send('menu-new-note');
          },
        },
        {
          label: 'New Folder',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            win?.webContents.send('menu-new-folder');
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            win?.webContents.send('menu-save');
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];

  // @ts-ignore
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Store IPC handlers for cleanup
const ipcHandlers = new Map<string, any>();

function registerIpcHandler(channel: string, handler: any) {
  // Remove existing handler if present
  if (ipcHandlers.has(channel)) {
    ipcMain.removeHandler(channel);
  }
  
  ipcMain.handle(channel, handler);
  ipcHandlers.set(channel, handler);
}

// Cleanup when app is quitting
app.on('before-quit', async () => {
  // Clean up all IPC handlers
  ipcHandlers.forEach((_handler, channel) => {
    ipcMain.removeHandler(channel);
  });
  ipcHandlers.clear();

  // Clean up terminals on app quit
  terminalService.closeAllTerminals();
});

// Core FileSystem Service IPC handlers
registerIpcHandler('core:listNotes', async (_event: any, dir?: string) => {
  try {
    return await fileSystemService.listNotes(dir);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:listFilesAndFolders', async (_event: any, dir?: string) => {
  try {
    return await fileSystemService.listFilesAndFolders(dir);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:readNote', async (_event: any, filePath: string) => {
  try {
    return await fileSystemService.readNote(filePath);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:writeNote', async (_event: any, filePath: string, content: string) => {
  try {
    return await fileSystemService.writeNote(filePath, content);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:deleteNote', async (_event: any, filePath: string) => {
  try {
    return await fileSystemService.deleteNote(filePath);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:createNote', async (_event: any, fileName: string, content?: string) => {
  try {
    return await fileSystemService.createNote(fileName, content);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:createFolder', async (_event: any, folderPath: string) => {
  try {
    return await fileSystemService.createFolder(folderPath);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:deleteFolder', async (_event: any, folderPath: string) => {
  try {
    return await fileSystemService.deleteFolder(folderPath);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:renameNote', async (_event: any, oldPath: string, newName: string) => {
  try {
    return await fileSystemService.renameNote(oldPath, newName);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:renameFolder', async (_event: any, oldPath: string, newName: string) => {
  try {
    return await fileSystemService.renameFolder(oldPath, newName);
  } catch (error) {
    throw error;
  }
});

registerIpcHandler('core:moveItem', async (_event: any, sourcePath: string, targetPath: string) => {
  try {
    return await fileSystemService.moveItem(sourcePath, targetPath);
  } catch (error) {
    throw error;
  }
});

// Legacy IPC handlers for backwards compatibility
ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    return await fileSystemService.readNote(filePath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    return await fileSystemService.writeNote(filePath, content);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('fs:deleteFile', async (_, filePath: string) => {
  try {
    return await fileSystemService.deleteNote(filePath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('fs:createFolder', async (_, folderPath: string) => {
  try {
    const { promises: fs } = await import('node:fs');
    await fs.mkdir(folderPath, { recursive: true });
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('fs:deleteFolder', async (_, folderPath: string) => {
  try {
    const { promises: fs } = await import('node:fs');
    await fs.rmdir(folderPath, { recursive: true });
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('fs:exists', async (_, filePath: string) => {
  try {
    const { promises: fs } = await import('node:fs');
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:listFiles', async (_, dirPath: string) => {
  try {
    const notes = await fileSystemService.listNotes(dirPath);
    return notes.map((note: { path: string }) => path.basename(note.path));
  } catch (error) {
    throw error;
  }
});

// Add IPC handler for getting current workspace
ipcMain.handle('core:getCurrentWorkspace', async () => {
  return currentWorkspace;
});

// Add IPC handler for selecting workspace directory
ipcMain.handle('core:selectWorkspace', async () => {
  if (!win) return null;
  
  // Check for unsaved files first
  const hasUnsavedChanges = await win.webContents.executeJavaScript(`
    window.api && typeof window.api.hasUnsavedChanges === 'function' 
      ? window.api.hasUnsavedChanges() 
      : false
  `);

  if (hasUnsavedChanges) {
    const response = dialog.showMessageBoxSync(win, {
      type: 'warning',
      title: 'Unsaved Changes',
      message: 'You have unsaved changes that will be lost.',
      detail: 'Do you want to continue changing the workspace?',
      buttons: ['Cancel', 'Continue'],
      defaultId: 0,
      cancelId: 0,
    });

    if (response === 0) {
      return null; // User cancelled
    }
  }
  
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Workspace Directory',
    message: 'Choose the folder where your notes will be stored',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: currentWorkspace,
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const newWorkspace = result.filePaths[0];
    
    // Store the new workspace for restart
    currentWorkspace = newWorkspace;
    
    // Close current window and create new one with new workspace
    if (win) {
      win.close();
      // Create new window after a short delay to ensure clean shutdown
      setTimeout(() => {
        fileSystemService = new FileSystemService(newWorkspace);
        createWindow();
      }, 100);
    }
    
    return newWorkspace;
  }
  
  return null;
});

// Window control IPC handlers
ipcMain.handle('window:minimize', () => {
  if (win) {
    win.minimize();
  }
});

ipcMain.handle('window:maximize', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    return win.isMaximized();
  }
  return false;
});

ipcMain.handle('window:close', () => {
  if (win) {
    win.close();
  }
});

ipcMain.handle('window:isMaximized', () => {
  return win ? win.isMaximized() : false;
});

// Terminal IPC handlers
ipcMain.handle('terminal:create', async (_, id: string, options: { cols: number, rows: number, cwd?: string }) => {
  try {
    const terminalId = terminalService.createTerminal(id, options);
    
    // Set up data listener
    terminalService.onTerminalData(id, (data: string) => {
      win?.webContents.send('terminal:data', id, data);
    });
    
    // Set up exit listener
    terminalService.onTerminalExit(id, (code: number, signal?: number) => {
      win?.webContents.send('terminal:exit', id, code, signal);
    });
    
    return terminalId;
  } catch (error) {
    console.error('Failed to create terminal:', error);
    throw error;
  }
});

ipcMain.handle('terminal:write', (_, id: string, data: string) => {
  terminalService.writeToTerminal(id, data);
});

ipcMain.handle('terminal:resize', (_, id: string, cols: number, rows: number) => {
  terminalService.resizeTerminal(id, cols, rows);
});

ipcMain.handle('terminal:close', (_, id: string) => {
  terminalService.closeTerminal(id);
});

// Embeddings database IPC handlers
registerIpcHandler('embeddings:init', async (_event: any, dbPath: string) => {
  try {
    embeddingsDatabase = new EmbeddingsDatabase(dbPath);
    await embeddingsDatabase.init();
  } catch (error) {
    console.error('Failed to initialize embeddings database:', error);
    throw error;
  }
});

registerIpcHandler('embeddings:close', async (_event: any) => {
  try {
    if (embeddingsDatabase) {
      await embeddingsDatabase.close();
      embeddingsDatabase = null;
    }
  } catch (error) {
    console.error('Failed to close embeddings database:', error);
    throw error;
  }
});

registerIpcHandler('embeddings:insertEmbedding', async (_event: any, record: any) => {
  try {
    if (!embeddingsDatabase) {
      throw new Error('Embeddings database not initialized');
    }
    await embeddingsDatabase.insertEmbedding(record);
  } catch (error) {
    console.error('Failed to insert embedding:', error);
    throw error;
  }
});

registerIpcHandler('embeddings:getEmbeddingsByPath', async (_event: any, filePath: string) => {
  try {
    if (!embeddingsDatabase) {
      throw new Error('Embeddings database not initialized');
    }
    return await embeddingsDatabase.getEmbeddingsByPath(filePath);
  } catch (error) {
    console.error('Failed to get embeddings by path:', error);
    throw error;
  }
});

registerIpcHandler('embeddings:deleteEmbeddingsByPath', async (_event: any, filePath: string) => {
  try {
    if (!embeddingsDatabase) {
      throw new Error('Embeddings database not initialized');
    }
    await embeddingsDatabase.deleteEmbeddingsByPath(filePath);
  } catch (error) {
    console.error('Failed to delete embeddings by path:', error);
    throw error;
  }
});

registerIpcHandler('embeddings:getAllEmbeddings', async (_event: any) => {
  try {
    if (!embeddingsDatabase) {
      throw new Error('Embeddings database not initialized');
    }
    return await embeddingsDatabase.getAllEmbeddings();
  } catch (error) {
    console.error('Failed to get all embeddings:', error);
    throw error;
  }
});

registerIpcHandler('embeddings:clearAllEmbeddings', async (_event: any) => {
  try {
    if (!embeddingsDatabase) {
      throw new Error('Embeddings database not initialized');
    }
    await embeddingsDatabase.clearAllEmbeddings();
  } catch (error) {
    console.error('Failed to clear all embeddings:', error);
    throw error;
  }
});

ipcMain.handle('terminal:list', () => {
  return terminalService.getActiveTerminals();
});

// Agent Service IPC handlers
registerIpcHandler('agent:processCodebase', async (_event: any) => {
  try {
    return await agentService.processCodebase();
  } catch (error) {
    console.error('Failed to process codebase:', error);
    throw error;
  }
});

registerIpcHandler('agent:searchSimilar', async (_event: any, query: string, limit: number = 10) => {
  try {
    return await agentService.searchSimilar(query, limit);
  } catch (error) {
    console.error('Failed to search similar:', error);
    throw error;
  }
});

registerIpcHandler('agent:getStats', async (_event: any) => {
  try {
    return await agentService.getStats();
  } catch (error) {
    console.error('Failed to get agent stats:', error);
    throw error;
  }
});

registerIpcHandler('agent:rebuild', async (_event: any) => {
  try {
    return await agentService.rebuild();
  } catch (error) {
    console.error('Failed to rebuild embeddings:', error);
    throw error;
  }
});

registerIpcHandler('agent:getFileList', async (_event: any, baseDir: string = '.', extensions?: string[]) => {
  try {
    return await agentService.getFileList(baseDir, extensions);
  } catch (error) {
    console.error('Failed to get file list:', error);
    throw error;
  }
});

registerIpcHandler('agent:readFileContent', async (_event: any, filePath: string) => {
  try {
    return await agentService.readFileContent(filePath);
  } catch (error) {
    console.error('Failed to read file content:', error);
    throw error;
  }
});

registerIpcHandler('agent:updateConfig', async (_event: any, config: any) => {
  try {
    return await agentService.updateConfig(config);
  } catch (error) {
    console.error('Failed to update agent config:', error);
    throw error;
  }
});

registerIpcHandler('agent:getConfig', async (_event: any) => {
  try {
    return agentService.getConfig();
  } catch (error) {
    console.error('Failed to get agent config:', error);
    throw error;
  }
}); 