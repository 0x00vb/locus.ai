import { ContextChunk } from '../chat/promptBuilder';
import { AgentClient } from '../index';

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
  private static agentClient = new AgentClient();

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

    try {
      // Get semantic search results for context chunks
      const searchResults = await this.agentClient.searchSimilar(userQuery, 5);
      
      const contextChunks: ContextChunk[] = searchResults.map(result => ({
        filePath: result.record.path,
        content: result.record.chunk,
        relevanceScore: result.similarity,
        lineStart: 1,
        lineEnd: result.record.chunk.split('\n').length
      }));

      // Build project files block if requested
      let projectFilesBlock = '';
      if (includeProjectFiles) {
        const fileList = await this.agentClient.getFileList('.', relevantExtensions);
        const limitedFileList = fileList.slice(0, maxProjectFiles);
        if (limitedFileList.length > 0) {
          projectFilesBlock = `## Project Files\n\`\`\`\n${limitedFileList.join('\n')}\n\`\`\`\n\n`;
        }
      }

      // Build active file block if current file is specified
      let activeFileBlock = '';
      if (currentFile) {
        const content = await this.agentClient.readFileContent(currentFile);
        if (content) {
          const truncatedContent = content.length > 3000 ? content.slice(0, 3000) + '\n... (file truncated)' : content;
          activeFileBlock = `## Current File: ${currentFile}\n\`\`\`\n${truncatedContent}\n\`\`\`\n\n`;
        }

        // Ensure current file is prioritized in context chunks if not already included
        const hasCurrentFile = contextChunks.some(chunk => chunk.filePath === currentFile);
        if (!hasCurrentFile && content) {
          contextChunks.unshift({
            filePath: currentFile,
            content: content.slice(0, 2000), // Limit size
            relevanceScore: 1.0, // Highest relevance
            lineStart: 1,
            lineEnd: content.split('\n').length
          });
        }
      }

      return {
        contextChunks,
        projectFilesBlock,
        activeFileBlock
      };
    } catch (error) {
      console.warn('Failed to build chat context:', error);
      // Return empty context on error
      return {
        contextChunks: [],
        projectFilesBlock: '',
        activeFileBlock: ''
      };
    }
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