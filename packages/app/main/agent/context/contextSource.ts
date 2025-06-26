import { ContextBuilder, ContextBuilderOptions } from '../rag/contextBuilder';
import { ContextChunk } from '../chat/promptBuilder';

export interface ContextSourceOptions {
  currentFile?: string;
  includeProjectFiles?: boolean;
  maxProjectFiles?: number;
  relevantExtensions?: string[];
}

/**
 * Context source that provides enhanced context with active file awareness
 */
export class ContextSource {
  /**
   * Build chat context with current file prioritization
   */
  static async buildChatContext(
    userQuery: string,
    options: ContextSourceOptions = {}
  ): Promise<{
    contextChunks: ContextChunk[];
    projectFilesBlock: string;
    activeFileBlock: string;
  }> {
    const {
      currentFile,
      includeProjectFiles = true,
      maxProjectFiles = 50,
      relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss']
    } = options;

    const contextBuilderOptions: ContextBuilderOptions = {
      includeFileList: includeProjectFiles,
      includeActiveFile: !!currentFile,
      activeFilePath: currentFile,
      maxFileListItems: maxProjectFiles,
      relevantExtensions
    };

    return await ContextBuilder.buildContext(userQuery, contextBuilderOptions);
  }

  /**
   * Add current file parameter to chat context builder
   * This ensures the active file gets top priority in context token budget
   */
  static async buildContextWithActiveFile(
    userQuery: string,
    currentFile: string,
    additionalOptions: Partial<ContextSourceOptions> = {}
  ): Promise<{
    contextChunks: ContextChunk[];
    projectFilesBlock: string;
    activeFileBlock: string;
  }> {
    return await this.buildChatContext(userQuery, {
      currentFile,
      ...additionalOptions
    });
  }

  /**
   * Build minimal context for quick responses (no file list)
   */
  static async buildMinimalContext(
    userQuery: string,
    currentFile?: string
  ): Promise<{
    contextChunks: ContextChunk[];
    projectFilesBlock: string;
    activeFileBlock: string;
  }> {
    return await this.buildChatContext(userQuery, {
      currentFile,
      includeProjectFiles: false
    });
  }
} 