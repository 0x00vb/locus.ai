/**
 * Utility to normalize file paths relative to project root
 * Ensures all file operations stay within the project directory
 * Uses Electron IPC for file system operations in renderer process
 */

// Define interfaces for our operations
interface FileStats {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  mtime: Date;
}

export class ProjectPaths {
  private static projectRoot: string = '';

  /**
   * Initialize the project root path
   * Should be called once during app startup
   */
  static async initialize(rootPath?: string) {
    if (rootPath) {
      this.projectRoot = rootPath;
    } else {
      // Get current workspace from main process
      try {
        const workspace = await window.api?.getCurrentWorkspace();
        this.projectRoot = workspace || '';
      } catch (error) {
        console.warn('Failed to get workspace, using empty root:', error);
        this.projectRoot = '';
      }
    }
  }

  /**
   * Get the project root directory
   */
  static async getProjectRoot(): Promise<string> {
    if (!this.projectRoot) {
      await this.initialize();
    }
    return this.projectRoot;
  }

  /**
   * Normalize a file path relative to project root
   * Ensures the path is within the project directory
   */
  static normalizePath(filePath: string): string {
    // Remove leading slash or dot-slash
    const cleanPath = filePath.replace(/^\.?\//, '');
    
    // Basic path normalization (without Node.js path module)
    const parts = cleanPath.split('/').filter(part => part && part !== '.');
    const normalizedParts: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        if (normalizedParts.length > 0) {
          normalizedParts.pop();
        }
      } else {
        normalizedParts.push(part);
      }
    }
    
    return normalizedParts.join('/');
  }

  /**
   * Convert absolute path back to relative path from project root
   */
  static toRelativePath(absolutePath: string): string {
    // Simple relative path calculation without Node.js path module
    const rootPath = this.projectRoot;
    if (absolutePath.startsWith(rootPath)) {
      return absolutePath.slice(rootPath.length).replace(/^\//, '');
    }
    return absolutePath;
  }

  /**
   * Check if a file exists within the project
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      if (window.electronAPI?.fs?.exists) {
        const result = await window.electronAPI.fs.exists(normalizedPath);
        return result.success && result.data === true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a path is within the project root
   */
  static isWithinProject(filePath: string): boolean {
    try {
      // Check for path traversal attempts
      const normalizedPath = this.normalizePath(filePath);
      return !normalizedPath.includes('../') && normalizedPath.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file stats if file exists (simplified version)
   */
  static async getStats(filePath: string): Promise<FileStats | null> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const exists = await this.exists(normalizedPath);
      if (!exists) return null;
      
      // Try to get actual stats if available
      if (window.electronAPI?.fs?.getFileStats) {
        const result = await window.electronAPI.fs.getFileStats(normalizedPath);
        if (result.success && result.data) {
          return {
            isFile: result.data.isFile || false,
            isDirectory: result.data.isDirectory || false,
            size: result.data.size || 0,
            mtime: result.data.mtime ? new Date(result.data.mtime) : new Date()
          };
        }
      }
      
      // Return simplified stats as fallback
      return {
        isFile: true, // Assume it's a file if it exists
        isDirectory: false,
        size: 0, // Can't determine size without direct fs access
        mtime: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * List all files in the project recursively
   */
  static async getFileList(baseDir: string = '.', extensions?: string[]): Promise<string[]> {
    try {
      const files: string[] = [];
      
      if (window.api?.listFilesAndFolders) {
        const items = await window.api.listFilesAndFolders(baseDir);
        
        if (Array.isArray(items)) {
          for (const item of items) {
            // Only include files, not folders
            if (item.type === 'file') {
              const filePath = item.path;
              
              // Filter by extensions if provided
              if (extensions && extensions.length > 0) {
                const ext = this.getFileExtension(filePath).toLowerCase();
                if (extensions.includes(ext)) {
                  files.push(filePath);
                }
              } else {
                files.push(filePath);
              }
            }
          }
        }
      }
      
      return files.sort();
    } catch (error) {
      console.warn('Failed to list files:', error);
      return [];
    }
  }

  /**
   * Get file extension from path
   */
  private static getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    
    if (lastDot > lastSlash && lastDot !== -1) {
      return filePath.slice(lastDot);
    }
    return '';
  }

  /**
   * Check if a file/directory should be ignored
   */
  private static shouldIgnore(name: string): boolean {
    const ignorePatterns = [
      'node_modules',
      '.git',
      '.vscode',
      '.cursor',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      '.DS_Store',
      'Thumbs.db'
    ];

    return ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(name);
      }
      return name === pattern;
    });
  }
}

// Initialize with default project root
ProjectPaths.initialize(); 