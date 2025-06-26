import { ChatMessage } from '../types';
import { buildPrompt, ContextChunk, PromptMode, PromptOptions } from './promptBuilder';
import { queryModel, queryModelStream } from '../models/modelAdapter';

// Import AgentClient directly to avoid circular dependency
interface AgentClient {
  searchSimilar(query: string, limit?: number): Promise<any[]>;
  getFileList(baseDir?: string, extensions?: string[]): Promise<string[]>;
  readFileContent(filePath: string): Promise<string | null>;
  processCodebase(): Promise<any>;
  rebuild(): Promise<any>;
}

class AgentClientImpl implements AgentClient {
  async searchSimilar(query: string, limit: number = 10): Promise<any[]> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.searchSimilar(query, limit);
  }

  async getFileList(baseDir: string = '.', extensions?: string[]): Promise<string[]> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.getFileList(baseDir, extensions);
  }

  async readFileContent(filePath: string): Promise<string | null> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.readFileContent(filePath);
  }

  async processCodebase(): Promise<any> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.processCodebase();
  }

  async rebuild(): Promise<any> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.rebuild();
  }
}

export interface SendMessageParams {
  message: string;
  modelId: string;
  mode: 'ask' | 'agent';
  activeFilePath?: string;
  includeFileList?: boolean;
}

export interface SendMessageStreamParams extends SendMessageParams {
  onChunk: (chunk: string) => void;
  abortSignal?: AbortSignal;
}

export interface AgentConfig {
  maxContextTokens: number;
  temperature: number;
  topK: number;
}

// Keep CodeContext for backward compatibility, but map to ContextChunk
export interface CodeContext {
  filePath: string;
  content: string;
  relevanceScore: number;
  lineStart?: number;
  lineEnd?: number;
}

export class ChatAgent {
  private config: AgentConfig;
  private agentClient: AgentClient;

  constructor(config: AgentConfig = {
    maxContextTokens: 4000,
    temperature: 0.7,
    topK: 5
  }) {
    this.config = config;
    this.agentClient = new AgentClientImpl();
  }

  /**
   * Main entry point for sending messages
   */
  async sendMessage(params: SendMessageParams): Promise<ChatMessage> {
    const { message, modelId, mode, activeFilePath, includeFileList = true } = params;

    try {
      // 1. Build context with file awareness using agent client
      const contextChunks = await this.buildContextChunks(message, activeFilePath, includeFileList);
      
      // 2. Build project files block if requested
      const projectFilesBlock = includeFileList ? await this.buildProjectFilesBlock() : '';
      
      // 3. Build active file block if available
      const activeFileBlock = activeFilePath ? await this.buildActiveFileBlock(activeFilePath) : '';

      // 4. Build the appropriate prompt based on mode with enhanced context
      const promptOptions: PromptOptions = {
        projectFilesBlock,
        activeFileBlock,
        includeAntiHallucination: true,
        activeFilePath
      };

      const prompt = buildPrompt(mode as PromptMode, message, contextChunks, promptOptions);

      // 5. Send to the selected model via adapter
      const response = await this.sendToModel(modelId, prompt);

      // 6. Create AI message object
      const aiMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      return aiMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Main entry point for sending messages with streaming support
   */
  async sendMessageStream(params: SendMessageStreamParams): Promise<ChatMessage> {
    const { message, modelId, mode, activeFilePath, includeFileList = true, onChunk, abortSignal } = params;

    try {
      // 1. Build context with file awareness using agent client
      const contextChunks = await this.buildContextChunks(message, activeFilePath, includeFileList);
      
      // 2. Build project files block if requested
      const projectFilesBlock = includeFileList ? await this.buildProjectFilesBlock() : '';
      
      // 3. Build active file block if available
      const activeFileBlock = activeFilePath ? await this.buildActiveFileBlock(activeFilePath) : '';

      // 4. Build the appropriate prompt based on mode with enhanced context
      const promptOptions: PromptOptions = {
        projectFilesBlock,
        activeFileBlock,
        includeAntiHallucination: true,
        activeFilePath
      };

      const prompt = buildPrompt(mode as PromptMode, message, contextChunks, promptOptions);

      // 5. Send to the selected model via adapter with streaming
      const response = await this.sendToModelStream(modelId, prompt, onChunk, abortSignal);

      // 6. Create AI message object
      const aiMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      return aiMessage;
    } catch (error) {
      console.error('Failed to send message with streaming:', error);
      throw new Error(`Failed to get AI response with streaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build context chunks using agent client for semantic search
   */
  private async buildContextChunks(query: string, activeFilePath?: string, includeFileList?: boolean): Promise<ContextChunk[]> {
    try {
      // Get semantic search results from main process
      const searchResults = await this.agentClient.searchSimilar(query, this.config.topK);
      
      const contextChunks: ContextChunk[] = searchResults.map(result => ({
        filePath: result.record.path,
        content: result.record.chunk,
        relevanceScore: result.similarity,
        lineStart: 1, // TODO: Extract from chunk metadata if available
        lineEnd: result.record.chunk.split('\n').length
      }));

      // If we have an active file, ensure it's prioritized
      if (activeFilePath && includeFileList) {
        const activeFileContent = await this.agentClient.readFileContent(activeFilePath);
        if (activeFileContent) {
          // Add active file as highest priority context if not already included
          const hasActiveFile = contextChunks.some(chunk => chunk.filePath === activeFilePath);
          if (!hasActiveFile) {
            contextChunks.unshift({
              filePath: activeFilePath,
              content: activeFileContent.slice(0, 2000), // Limit size
              relevanceScore: 1.0, // Highest relevance
              lineStart: 1,
              lineEnd: activeFileContent.split('\n').length
            });
          }
        }
      }

      return contextChunks;
    } catch (error) {
      console.warn('Failed to build context chunks:', error);
      return [];
    }
  }

  /**
   * Build project files block using agent client
   */
  private async buildProjectFilesBlock(): Promise<string> {
    try {
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss'];
      const fileList = await this.agentClient.getFileList('.', extensions);
      
      if (fileList.length === 0) {
        return '';
      }

      const limitedFileList = fileList.slice(0, 50); // Limit to first 50 files
      return `## Project Files\n\`\`\`\n${limitedFileList.join('\n')}\n\`\`\`\n\n`;
    } catch (error) {
      console.warn('Failed to build project files block:', error);
      return '';
    }
  }

  /**
   * Build active file block using agent client
   */
  private async buildActiveFileBlock(activeFilePath: string): Promise<string> {
    try {
      const content = await this.agentClient.readFileContent(activeFilePath);
      if (!content) {
        return '';
      }

      const truncatedContent = content.length > 3000 ? content.slice(0, 3000) + '\n... (file truncated)' : content;
      return `## Current File: ${activeFilePath}\n\`\`\`\n${truncatedContent}\n\`\`\`\n\n`;
    } catch (error) {
      console.warn('Failed to build active file block:', error);
      return '';
    }
  }

  /**
   * Retrieve relevant code context chunks using agent client
   */
  private async getCodeContext(query: string): Promise<CodeContext[]> {
    try {
      // Use agent client to find relevant code chunks
      const searchResults = await this.agentClient.searchSimilar(query, this.config.topK);
      
      return searchResults.map(result => ({
        filePath: result.record.path,
        content: result.record.chunk,
        relevanceScore: result.similarity,
        lineStart: 1, // TODO: Extract from chunk metadata if available
        lineEnd: result.record.chunk.split('\n').length
      }));
    } catch (error) {
      console.warn('Failed to get code context:', error);
      return [];
    }
  }

  /**
   * Send prompt to the selected model via adapter
   */
  private async sendToModel(modelId: string, prompt: string): Promise<string> {
    try {
      // Use the real model adapter to query Ollama
      const response = await queryModel(modelId, prompt);
      return response;
    } catch (error) {
      console.error('Model query failed:', error);
      throw error;
    }
  }

  /**
   * Send prompt to the selected model via adapter with streaming
   */
  private async sendToModelStream(modelId: string, prompt: string, onChunk: (chunk: string) => void, abortSignal?: AbortSignal): Promise<string> {
    try {
      // Use the real model adapter to query Ollama with streaming
      const response = await queryModelStream(modelId, prompt, onChunk, abortSignal);
      return response;
    } catch (error) {
      console.error('Model query with streaming failed:', error);
      throw error;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update agent configuration
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update RAG index with new/changed files
   */
  async updateRAGIndex(): Promise<void> {
    try {
      const stats = await this.agentClient.processCodebase();
      console.log('RAG index updated:', stats);
    } catch (error) {
      console.error('Failed to update RAG index:', error);
      throw error;
    }
  }

  /**
   * Rebuild entire RAG index from scratch
   */
  async rebuildRAGIndex(): Promise<void> {
    try {
      const stats = await this.agentClient.rebuild();
      console.log('RAG index rebuilt:', stats);
    } catch (error) {
      console.error('Failed to rebuild RAG index:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatAgent = new ChatAgent();