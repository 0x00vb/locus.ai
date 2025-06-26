import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export interface NoteFile {
  id: string;
  title: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
}

export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  createdAt: Date;
  updatedAt: Date;
  size?: number;
  children?: FileSystemItem[];
}

export interface NoteMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
  path: string;
}

export class FileSystemService {
  private notesDirectory: string;

  constructor(notesDirectory?: string) {
    this.notesDirectory = notesDirectory || path.join(process.cwd(), 'notes');
  }

  /**
   * Initialize the notes directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await fs.access(this.notesDirectory);
    } catch {
      await fs.mkdir(this.notesDirectory, { recursive: true });
    }
  }

  /**
   * List all notes in the specified directory
   */
  async listNotes(dir?: string): Promise<NoteFile[]> {
    const targetDir = dir || this.notesDirectory;
    
    try {
      await this.initialize();
      const files = await fs.readdir(targetDir, { withFileTypes: true });
      const noteFiles: NoteFile[] = [];

      for (const file of files) {
        if (file.isFile()) {
          // Include more file types - all text-based files
          const validExtensions = ['.md', '.txt', '.js', '.ts', '.py', '.json', '.html', '.css', '.yaml', '.yml', '.xml', '.sh', '.bash', '.php', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp'];
          const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) || !file.name.includes('.');
          
          if (hasValidExtension) {
            const filePath = path.join(targetDir, file.name);
            const stats = await fs.stat(filePath);
            const metadata = await this.getNoteMetadata(filePath);
            
            noteFiles.push({
              id: metadata.id,
              title: metadata.title,
              path: filePath,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime,
              size: stats.size,
            });
          }
        }
      }

      return noteFiles.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Failed to list notes:', error);
      throw new Error(`Failed to list notes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all files and folders in the specified directory with hierarchical structure
   */
  async listFilesAndFolders(dir?: string): Promise<FileSystemItem[]> {
    const targetDir = dir || this.notesDirectory;
    
    try {
      await this.initialize();
      console.log('Listing files and folders in:', targetDir);
      
      // Check if directory exists
      try {
        await fs.access(targetDir);
      } catch (error) {
        console.log('Directory does not exist, creating:', targetDir);
        await fs.mkdir(targetDir, { recursive: true });
      }
      
      const items = await this.buildFileSystemTree(targetDir);
      console.log('Found items:', items.length);
      return items;
    } catch (error) {
      console.error('Failed to list files and folders:', error);
      throw new Error(`Failed to list files and folders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Recursively build file system tree structure
   */
  private async buildFileSystemTree(dirPath: string, relativePath: string = ''): Promise<FileSystemItem[]> {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const items: FileSystemItem[] = [];

    for (const file of files) {
      try {
        const fullPath = path.join(dirPath, file.name);
        const itemRelativePath = path.join(relativePath, file.name);
        
        // Skip hidden files and directories that commonly cause issues
        if (file.name.startsWith('.') && file.name !== '.md' && file.name !== '.txt') {
          continue;
        }
        
        let stats;
        try {
          stats = await fs.stat(fullPath);
        } catch (statError) {
          // Skip files we can't stat (permissions, broken symlinks, etc.)
          console.warn(`Skipping file ${fullPath}: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
          continue;
        }

        if (file.isDirectory()) {
          // This is a folder
          try {
            const children = await this.buildFileSystemTree(fullPath, itemRelativePath);
            items.push({
              id: this.generateIdFromPath(fullPath),
              name: file.name,
              path: fullPath,
              type: 'folder',
              createdAt: stats.birthtime,
              updatedAt: stats.mtime,
              children: children,
            });
          } catch (dirError) {
            // Skip directories we can't read
            console.warn(`Skipping directory ${fullPath}: ${dirError instanceof Error ? dirError.message : 'Unknown error'}`);
            continue;
          }
        } else if (file.isFile()) {
          // Include more file types - all text-based files
          const validExtensions = ['.md', '.txt', '.js', '.ts', '.py', '.json', '.html', '.css', '.yaml', '.yml', '.xml', '.sh', '.bash', '.php', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp'];
          const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) || !file.name.includes('.');
          
          if (hasValidExtension) {
            // This is a valid file
            try {
              const metadata = await this.getNoteMetadata(fullPath);
              items.push({
                id: metadata.id,
                name: file.name, // Use actual filename with extension
                path: fullPath,
                type: 'file',
                createdAt: stats.birthtime,
                updatedAt: stats.mtime,
                size: stats.size,
              });
            } catch (metadataError) {
              // Skip files we can't read metadata for
              console.warn(`Skipping file metadata for ${fullPath}: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`);
              continue;
            }
          }
        }
      } catch (error) {
        // Skip any file/directory that causes unexpected errors
        console.warn(`Skipping item ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    // Sort: folders first, then files, both alphabetically
    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Read a note from the file system
   */
  async readNote(filePath: string): Promise<string> {
    try {
      const sanitizedPath = this.sanitizePath(filePath);
      return await fs.readFile(sanitizedPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read note: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Write a note to the file system
   */
  async writeNote(filePath: string, content: string): Promise<boolean> {
    try {
      const sanitizedPath = this.sanitizePath(filePath);
      const dir = path.dirname(sanitizedPath);
      
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(sanitizedPath, content, 'utf-8');
      return true;
    } catch (error) {
      throw new Error(`Failed to write note: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a note from the file system
   */
  async deleteNote(filePath: string): Promise<boolean> {
    try {
      const sanitizedPath = this.sanitizePath(filePath);
      await fs.unlink(sanitizedPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a folder from the file system
   */
  async deleteFolder(folderPath: string): Promise<boolean> {
    try {
      const sanitizedPath = this.sanitizePath(folderPath);
      await fs.rmdir(sanitizedPath, { recursive: true });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Rename a note file
   */
  async renameNote(oldPath: string, newName: string): Promise<boolean> {
    try {
      const sanitizedOldPath = this.sanitizePath(oldPath);
      const dir = path.dirname(sanitizedOldPath);
      const newPath = path.join(dir, newName);
      const sanitizedNewPath = this.sanitizePath(newPath);
      
      await fs.rename(sanitizedOldPath, sanitizedNewPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to rename note: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Rename a folder
   */
  async renameFolder(oldPath: string, newName: string): Promise<boolean> {
    try {
      const sanitizedOldPath = this.sanitizePath(oldPath);
      const parentDir = path.dirname(sanitizedOldPath);
      const newPath = path.join(parentDir, newName);
      const sanitizedNewPath = this.sanitizePath(newPath);
      
      await fs.rename(sanitizedOldPath, sanitizedNewPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to rename folder: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a folder in the file system
   */
  async createFolder(folderPath: string): Promise<boolean> {
    try {
      const sanitizedPath = this.sanitizePath(folderPath);
      await fs.mkdir(sanitizedPath, { recursive: true });
      return true;
    } catch (error) {
      throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new note with default content
   */
  async createNote(fileName: string, content?: string): Promise<string> {
    try {
      // Use the filename as provided (should already have extension from frontend)
      // Only add .md if no extension is provided at all
      const noteFileName = fileName.includes('.') ? fileName : `${fileName}.md`;
      
      // Use provided content or empty string
      const defaultContent = content || '';
      
      const sanitizedPath = this.sanitizePath(noteFileName);
      const dir = path.dirname(sanitizedPath);
      
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(sanitizedPath, defaultContent, 'utf-8');
      return sanitizedPath;
    } catch (error) {
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get metadata for a note file
   */
  async getNoteMetadata(filePath: string): Promise<NoteMetadata> {
    try {
      const sanitizedPath = this.sanitizePath(filePath);
      const stats = await fs.stat(sanitizedPath);
      const content = await fs.readFile(sanitizedPath, 'utf-8');
      
      // Extract title - prioritize filename unless there's a proper markdown header
      const lines = content.split('\n');
      let title = path.basename(sanitizedPath, path.extname(sanitizedPath));
      
      // Only use first line as title if it's a proper markdown heading (starts with # )
      if (lines[0] && lines[0].startsWith('# ')) {
        title = lines[0].substring(2).trim();
      }
      // For all other cases (including regular text content), use the filename as title

      return {
        id: this.generateIdFromPath(sanitizedPath),
        title,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
        size: stats.size,
        path: sanitizedPath,
      };
    } catch (error) {
      throw new Error(`Failed to get note metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sanitize file path to prevent directory traversal attacks
   */
  private sanitizePath(filePath: string): string {
    // If the path is relative (doesn't start with / or \), resolve it relative to notes directory
    let resolvedPath: string;
    
    if (path.isAbsolute(filePath)) {
      // For absolute paths, check if they're already within our notes directory
      const normalizedNotesDir = path.resolve(this.notesDirectory);
      const normalizedPath = path.resolve(filePath);
      
      if (normalizedPath.startsWith(normalizedNotesDir)) {
        resolvedPath = normalizedPath;
      } else {
        // Absolute path outside notes directory - treat as relative
        const basename = path.basename(filePath);
        resolvedPath = path.resolve(this.notesDirectory, basename);
      }
    } else {
      // Relative path - resolve relative to notes directory
      resolvedPath = path.resolve(this.notesDirectory, filePath);
    }
    
    // Ensure the path is within the notes directory or its subdirectories
    const normalizedNotesDir = path.resolve(this.notesDirectory);
    if (!resolvedPath.startsWith(normalizedNotesDir)) {
      console.warn('Path outside notes directory:', resolvedPath, 'Notes dir:', normalizedNotesDir);
      // Instead of throwing an error, adjust the path to be within notes directory
      const basename = path.basename(resolvedPath);
      resolvedPath = path.resolve(normalizedNotesDir, basename);
    }
    
    return resolvedPath;
  }

  /**
   * Generate a consistent ID from file path
   */
  private generateIdFromPath(filePath: string): string {
    // Use relative path from notes directory as basis for ID
    const relativePath = path.relative(this.notesDirectory, filePath);
    return relativePath.replace(/[\\\/]/g, '_').replace(/\.[^.]+$/, '');
  }

  /**
   * Set the notes directory
   */
  setNotesDirectory(directory: string): void {
    this.notesDirectory = directory;
  }

  /**
   * Get the current notes directory
   */
  getNotesDirectory(): string {
    return this.notesDirectory;
  }

  /**
   * Move a file or folder to a new location
   */
  async moveItem(sourcePath: string, targetPath: string): Promise<boolean> {
    try {
      const sanitizedSourcePath = this.sanitizePath(sourcePath);
      const sanitizedTargetPath = this.sanitizePath(targetPath);
      
      // Check if source exists
      await fs.access(sanitizedSourcePath);
      
      // Check if target directory exists
      const targetDir = path.dirname(sanitizedTargetPath);
      await fs.access(targetDir);
      
      // Perform the move
      await fs.rename(sanitizedSourcePath, sanitizedTargetPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to move item: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export utility functions
export const sanitizePath = (filePath: string, baseDir: string): string => {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error('Invalid file path: Access denied');
  }
  return resolved;
};

export const getNoteMetadata = async (filePath: string): Promise<NoteMetadata> => {
  const service = new FileSystemService();
  return service.getNoteMetadata(filePath);
}; 