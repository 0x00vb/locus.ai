import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as os from 'node:os';
import { FileSystemService } from '../../core/dist/main.js';
import { TerminalService } from './terminal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
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
      preload: path.join(__dirname, 'preload.js'),
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
app.whenReady().then(() => {
  createWindow();

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
            const result = await dialog.showOpenDialog(win!, {
              title: 'Select Workspace Directory',
              message: 'Choose the folder where your notes will be stored',
              properties: ['openDirectory', 'createDirectory'],
              defaultPath: currentWorkspace,
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const newWorkspace = result.filePaths[0];
              currentWorkspace = newWorkspace;
              fileSystemService = new FileSystemService(newWorkspace);
              
              // Notify the renderer process about the workspace change
              win?.webContents.send('workspace-changed', newWorkspace);
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

// Core FileSystem Service IPC handlers
ipcMain.handle('core:listNotes', async (_, dir?: string) => {
  try {
    return await fileSystemService.listNotes(dir);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:listFilesAndFolders', async (_, dir?: string) => {
  try {
    return await fileSystemService.listFilesAndFolders(dir);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:readNote', async (_, filePath: string) => {
  try {
    return await fileSystemService.readNote(filePath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:writeNote', async (_, filePath: string, content: string) => {
  try {
    return await fileSystemService.writeNote(filePath, content);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:deleteNote', async (_, filePath: string) => {
  try {
    return await fileSystemService.deleteNote(filePath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:createNote', async (_, fileName: string, content?: string) => {
  try {
    return await fileSystemService.createNote(fileName, content);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:createFolder', async (_, folderPath: string) => {
  try {
    return await fileSystemService.createFolder(folderPath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:deleteFolder', async (_, folderPath: string) => {
  try {
    return await fileSystemService.deleteFolder(folderPath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:renameNote', async (_, oldPath: string, newName: string) => {
  try {
    return await fileSystemService.renameNote(oldPath, newName);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:renameFolder', async (_, oldPath: string, newName: string) => {
  try {
    return await fileSystemService.renameFolder(oldPath, newName);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('core:moveItem', async (_, sourcePath: string, targetPath: string) => {
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
    return notes.map(note => path.basename(note.path));
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
  
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Workspace Directory',
    message: 'Choose the folder where your notes will be stored',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: currentWorkspace,
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const newWorkspace = result.filePaths[0];
    currentWorkspace = newWorkspace;
    fileSystemService = new FileSystemService(newWorkspace);
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
    terminalService.onTerminalData(id, (data) => {
      win?.webContents.send('terminal:data', id, data);
    });
    
    // Set up exit listener
    terminalService.onTerminalExit(id, (code, signal) => {
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

ipcMain.handle('terminal:list', () => {
  return terminalService.getActiveTerminals();
});

// Clean up terminals on app quit
app.on('before-quit', () => {
  terminalService.closeAllTerminals();
}); 