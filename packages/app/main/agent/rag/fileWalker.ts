import * as fs from 'node:fs';
import * as path from 'node:path';

export interface FileInfo {
  path: string;
  relativePath: string;
  size: number;
  lastModified: number;
  extension: string;
}

export interface WalkOptions {
  rootPath: string;
  excludeDirectories?: string[];
  excludeFiles?: string[];
  includeExtensions?: string[];
  maxFileSize?: number; // in bytes
}

export class FileWalker {
  private static DEFAULT_EXCLUDE_DIRS = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'out',
    '.nuxt',
    '.output',
    'coverage',
    '.nyc_output',
    '.vscode',
    '.idea',
    '__pycache__',
    '.pytest_cache',
    'target',
    'bin',
    'obj',
    '.vs',
    'Debug',
    'Release',
    'Pods',
    'DerivedData',
    '.expo',
    'android/app/build',
    'ios/build',
    '.gradle'
  ];

  private static DEFAULT_EXCLUDE_FILES = [
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.tmp',
    '*.temp',
    '*.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '*.min.js',
    '*.min.css',
    '*.map'
  ];

  private static SUPPORTED_EXTENSIONS = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.vue',
    '.py',
    '.java',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.php',
    '.rb',
    '.go',
    '.rs',
    '.swift',
    '.kt',
    '.scala',
    '.sh',
    '.bash',
    '.zsh',
    '.fish',
    '.ps1',
    '.sql',
    '.html',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.xml',
    '.json',
    '.yaml',
    '.yml',
    '.toml',
    '.ini',
    '.conf',
    '.cfg',
    '.md',
    '.rst',
    '.txt',
    '.dockerfile',
    '.dockerignore',
    '.gitignore',
    '.env'
  ];

  /**
   * Walk through directory tree and collect file information
   */
  async walkDirectory(options: WalkOptions): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const excludeDirs = new Set([
      ...FileWalker.DEFAULT_EXCLUDE_DIRS,
      ...(options.excludeDirectories || [])
    ]);
    const excludeFiles = new Set([
      ...FileWalker.DEFAULT_EXCLUDE_FILES,
      ...(options.excludeFiles || [])
    ]);
    const includeExts = new Set(
      options.includeExtensions || FileWalker.SUPPORTED_EXTENSIONS
    );
    const maxSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default

    await this.walkRecursive(
      options.rootPath,
      options.rootPath,
      files,
      excludeDirs,
      excludeFiles,
      includeExts,
      maxSize
    );

    return files;
  }

  /**
   * Recursive directory walking implementation
   */
  private async walkRecursive(
    currentPath: string,
    rootPath: string,
    files: FileInfo[],
    excludeDirs: Set<string>,
    excludeFiles: Set<string>,
    includeExts: Set<string>,
    maxSize: number
  ): Promise<void> {
    try {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);

        if (entry.isDirectory()) {
          // Skip excluded directories
          if (excludeDirs.has(entry.name) || this.isHidden(entry.name)) {
            continue;
          }

          // Recursively walk subdirectory
          await this.walkRecursive(
            fullPath,
            rootPath,
            files,
            excludeDirs,
            excludeFiles,
            includeExts,
            maxSize
          );
        } else if (entry.isFile()) {
          // Skip excluded files
          if (this.shouldExcludeFile(entry.name, excludeFiles)) {
            continue;
          }

          const ext = path.extname(entry.name).toLowerCase();
          
          // Skip files with unsupported extensions
          if (!includeExts.has(ext) && ext !== '') {
            continue;
          }

          try {
            const stats = await fs.promises.stat(fullPath);
            
            // Skip files that are too large
            if (stats.size > maxSize) {
              console.warn(`Skipping large file: ${relativePath} (${stats.size} bytes)`);
              continue;
            }

            files.push({
              path: fullPath,
              relativePath,
              size: stats.size,
              lastModified: stats.mtime.getTime(),
              extension: ext
            });
          } catch (statError) {
            console.warn(`Error reading file stats: ${fullPath}`, statError);
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading directory: ${currentPath}`, error);
    }
  }

  /**
   * Check if a file should be excluded based on patterns
   */
  private shouldExcludeFile(filename: string, excludeFiles: Set<string>): boolean {
    // Check exact matches
    if (excludeFiles.has(filename)) {
      return true;
    }

    // Check pattern matches (simple glob patterns)
    for (const pattern of excludeFiles) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(filename)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a directory/file is hidden (starts with .)
   */
  private isHidden(name: string): boolean {
    return name.startsWith('.') && name !== '.env';
  }

  /**
   * Read file content safely with error handling
   */
  async readFileContent(filePath: string): Promise<string | null> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Check if file has been modified since timestamp
   */
  async isModifiedSince(filePath: string, timestamp: number): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.mtime.getTime() > timestamp;
    } catch (error) {
      console.error(`Error checking file modification time for ${filePath}:`, error);
      return true; // Assume modified if we can't check
    }
  }

  /**
   * Get quick file statistics for a directory
   */
  async getDirectoryStats(dirPath: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    const files = await this.walkDirectory({
      rootPath: dirPath,
      maxFileSize: Infinity // Don't exclude based on size for stats
    });

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      fileTypes: {} as Record<string, number>
    };

    for (const file of files) {
      const ext = file.extension || 'no-extension';
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
    }

    return stats;
  }
} 