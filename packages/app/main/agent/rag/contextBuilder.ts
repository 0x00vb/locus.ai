import { ProjectPaths } from '../fs/projectPaths';
import { ContextChunk } from '../chat/promptBuilder';
import { detectLanguageFromPath, getLanguageInfoFromPath } from '../utils/langDetect';

export interface ContextBuilderOptions {
  includeFileList?: boolean;
  includeActiveFile?: boolean;
  activeFilePath?: string;
  maxFileListItems?: number;
  relevantExtensions?: string[];
}

export interface ActiveFileContext {
  path: string;
  content: string;
  language: string;
  exists: boolean;
  fileSize?: number;
  lastModified?: Date;
}

/**
 * Context builder that creates grounded, file-aware context for AI prompts
 */
export class ContextBuilder {
  /**
   * Build context with real file awareness
   */
  static async buildContext(
    userQuery: string,
    options: ContextBuilderOptions = {}
  ): Promise<{
    contextChunks: ContextChunk[];
    projectFilesBlock: string;
    activeFileBlock: string;
  }> {
    const {
      includeFileList = true,
      includeActiveFile = true,
      activeFilePath,
      maxFileListItems = 50,
      relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss']
    } = options;

    // Build project files block
    let projectFilesBlock = '';
    if (includeFileList) {
      projectFilesBlock = await this.buildProjectFilesBlock(maxFileListItems, relevantExtensions);
    }

    // Build active file block with enhanced validation
    let activeFileBlock = '';
    if (includeActiveFile && activeFilePath) {
      activeFileBlock = await this.buildActiveFileBlock(activeFilePath);
    }

    // For now, return empty context chunks - this will be enhanced with RAG later
    const contextChunks: ContextChunk[] = [];

    return {
      contextChunks,
      projectFilesBlock,
      activeFileBlock
    };
  }

  /**
   * Build the project files list block for context injection
   */
  private static async buildProjectFilesBlock(maxItems: number, extensions: string[]): Promise<string> {
    try {
      const fileList = await ProjectPaths.getFileList('.', extensions);
      const limitedFileList = fileList.slice(0, maxItems);
      
      // Group files by language/type for better organization
      const filesByType = this.groupFilesByType(limitedFileList);
      
      let fileTree = '';
      for (const [type, files] of Object.entries(filesByType)) {
        if (files.length > 0) {
          fileTree += `\n  ${type}:\n`;
          files.forEach(file => {
            fileTree += `    - ${file}\n`;
          });
        }
      }
      
      const truncationNote = fileList.length > maxItems 
        ? `\n(... and ${fileList.length - maxItems} more files)` 
        : '';

      return `[PROJECT_FILES]
Project structure (${limitedFileList.length}${fileList.length > maxItems ? `/${fileList.length}` : ''} files):${fileTree}${truncationNote}
[/PROJECT_FILES]`;
    } catch (error) {
      console.error('Failed to build project files block:', error);
      return `[PROJECT_FILES]
Error: Could not read project files - ${error}
[/PROJECT_FILES]`;
    }
  }

  /**
   * Group files by their language/type
   */
  private static groupFilesByType(files: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    for (const file of files) {
      const langInfo = getLanguageInfoFromPath(file);
      const category = langInfo?.category || 'other';
      const typeName = langInfo?.name || 'Other';
      
      const key = `${typeName} (${category})`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
    }
    
    // Sort groups by priority
    const sortedGroups: Record<string, string[]> = {};
    const priority = ['web', 'system', 'data', 'config', 'document', 'mobile'];
    
    for (const prio of priority) {
      for (const [key, files] of Object.entries(groups)) {
        if (key.includes(`(${prio})`)) {
          sortedGroups[key] = files.sort();
        }
      }
    }
    
    // Add remaining groups
    for (const [key, files] of Object.entries(groups)) {
      if (!sortedGroups[key]) {
        sortedGroups[key] = files.sort();
      }
    }
    
    return sortedGroups;
  }

  /**
   * Build the active file block for context injection with enhanced validation
   */
  private static async buildActiveFileBlock(filePath: string): Promise<string> {
    try {
      // Validate file path is within project and safe
      if (!ProjectPaths.isWithinProject(filePath)) {
        return `[ACTIVE_FILE]
path: ${filePath}
status: File path is outside project root
language: text
[/ACTIVE_FILE]`;
      }

      // Check if file exists
      const fileExists = await ProjectPaths.exists(filePath);
      if (!fileExists) {
        return `[ACTIVE_FILE]
path: ${filePath}
status: File does not exist
language: ${detectLanguageFromPath(filePath)}
[/ACTIVE_FILE]`;
      }

      // Get file stats for additional metadata
      const stats = await ProjectPaths.getStats(filePath);
      const language = detectLanguageFromPath(filePath);
      const langInfo = getLanguageInfoFromPath(filePath);

      // Try to read file content using multiple methods
      let content = '';
      let contentStatus = 'success';
      
      try {
        // Primary method: use the readNote API if available
        if (window.api?.readNote) {
          content = await window.api.readNote(filePath);
        } else if (window.electronAPI?.fs?.readFile) {
          // Alternative method: use electronAPI
          const result = await window.electronAPI.fs.readFile(filePath);
          if (result.success && typeof result.data === 'string') {
            content = result.data;
          } else {
            contentStatus = 'read_failed';
            content = '(Failed to read file content)';
          }
        } else {
          contentStatus = 'api_unavailable';
          content = '(File reading API not available)';
        }
      } catch (error) {
        contentStatus = 'error';
        content = `(Error reading file: ${error})`;
      }

      // Truncate content if too large (prevent token overflow)
      const maxContentLength = 8000; // Reasonable limit for context
      let truncated = false;
      if (content.length > maxContentLength) {
        content = content.slice(0, maxContentLength) + '\n... (content truncated)';
        truncated = true;
      }

      // Build metadata section
      const metadata = [];
      if (langInfo) {
        metadata.push(`language: ${language} (${langInfo.name})`);
        metadata.push(`category: ${langInfo.category}`);
      } else {
        metadata.push(`language: ${language}`);
      }
      
      if (stats) {
        if (stats.size) metadata.push(`size: ${this.formatFileSize(stats.size)}`);
        if (stats.mtime) metadata.push(`modified: ${stats.mtime.toISOString().split('T')[0]}`);
      }
      
      if (truncated) metadata.push('note: content truncated for context limit');
      if (contentStatus !== 'success') metadata.push(`read_status: ${contentStatus}`);

      return `[ACTIVE_FILE]
path: ${filePath}
${metadata.join('\n')}
content:
\`\`\`${language}
${content}
\`\`\`
[/ACTIVE_FILE]`;
    } catch (error) {
      console.error('Failed to build active file block:', error);
      return `[ACTIVE_FILE]
path: ${filePath}
error: ${error}
language: ${detectLanguageFromPath(filePath)}
[/ACTIVE_FILE]`;
    }
  }

  /**
   * Format file size in human readable format
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Get relevant files based on query (for future RAG enhancement)
   */
  static async getRelevantFiles(query: string): Promise<ContextChunk[]> {
    // TODO: Implement RAG-based file relevance scoring
    // For now, return empty array
    return [];
  }

  /**
   * Validate file exists before including in context
   */
  static async validateFile(filePath: string): Promise<{
    exists: boolean;
    error?: string;
    stats?: any;
    language?: string;
    isSupported?: boolean;
  }> {
    try {
      const exists = await ProjectPaths.exists(filePath);
      const stats = exists ? await ProjectPaths.getStats(filePath) : null;
      const language = detectLanguageFromPath(filePath);
      const langInfo = getLanguageInfoFromPath(filePath);
      
      return {
        exists,
        stats,
        language,
        isSupported: !!langInfo
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        language: detectLanguageFromPath(filePath),
        isSupported: false
      };
    }
  }

  /**
   * Get active file context with full validation
   */
  static async getActiveFileContext(filePath: string): Promise<ActiveFileContext> {
    const language = detectLanguageFromPath(filePath);
    
    try {
      const exists = await ProjectPaths.exists(filePath);
      if (!exists) {
        return {
          path: filePath,
          content: '',
          language,
          exists: false
        };
      }

      const stats = await ProjectPaths.getStats(filePath);
      let content = '';
      
      try {
        if (window.api?.readNote) {
          content = await window.api.readNote(filePath);
        }
      } catch (error) {
        console.warn(`Failed to read file ${filePath}:`, error);
      }

      return {
        path: filePath,
        content,
        language,
        exists: true,
        fileSize: stats?.size,
        lastModified: stats?.mtime
      };
    } catch (error) {
      console.error('Failed to get active file context:', error);
      return {
        path: filePath,
        content: '',
        language,
        exists: false
      };
    }
  }
} 