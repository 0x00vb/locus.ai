import { ChatMessage } from '../types';
import { buildPrompt, ContextChunk, PromptMode, PromptOptions } from './promptBuilder';
import { queryModel, queryModelStream } from '../models/modelAdapter';
import { ContextBuilder, ContextBuilderOptions } from '../rag/contextBuilder';
import { CodebaseEmbedder } from '../rag/embedder';

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
  private ragService: CodebaseEmbedder | null = null;
  private modelAdapter: any; // Will be properly typed later

  constructor(config: AgentConfig = {
    maxContextTokens: 4000,
    temperature: 0.7,
    topK: 5
  }) {
    this.config = config;
    this.initializeRAG();
  }

  /**
   * Initialize RAG service if available
   */
  private async initializeRAG() {
    try {
      // Only initialize if we have a valid project path
      const projectRoot = await window.api?.getCurrentWorkspace?.();
      if (projectRoot) {
        this.ragService = new CodebaseEmbedder({
          projectRoot,
          ollamaBaseUrl: 'http://localhost:11434',
          embeddingModel: 'nomic-embed-text',
          dbPath: './agent/db/embeddings.sqlite',
          chunkSize: 1000,
          walkOptions: {
            excludeDirectories: ['node_modules', '.git', 'dist', 'build', '.cursor'],
            includeExtensions: ['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.css', '.scss']
          }
        });
        
        await this.ragService.initialize();
        console.log('RAG service initialized successfully');
      }
    } catch (error) {
      console.warn('Failed to initialize RAG service:', error);
      this.ragService = null;
    }
  }

  /**
   * Main entry point for sending messages
   */
  async sendMessage(params: SendMessageParams): Promise<ChatMessage> {
    const { message, modelId, mode, activeFilePath, includeFileList = true } = params;

    try {
      // 1. Build context with file awareness
      const contextBuilderOptions: ContextBuilderOptions = {
        includeFileList,
        includeActiveFile: !!activeFilePath,
        activeFilePath,
        maxFileListItems: 50,
        relevantExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss']
      };

      const { contextChunks, projectFilesBlock, activeFileBlock } = await ContextBuilder.buildContext(
        message, 
        contextBuilderOptions
      );

      // 2. Build the appropriate prompt based on mode with enhanced context
      const promptOptions: PromptOptions = {
        projectFilesBlock,
        activeFileBlock,
        includeAntiHallucination: true,
        activeFilePath
      };

      const prompt = buildPrompt(mode as PromptMode, message, contextChunks, promptOptions);

      // 3. Send to the selected model via adapter
      const response = await this.sendToModel(modelId, prompt);

      // 4. Create AI message object
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
      // 1. Build context with file awareness
      const contextBuilderOptions: ContextBuilderOptions = {
        includeFileList,
        includeActiveFile: !!activeFilePath,
        activeFilePath,
        maxFileListItems: 50,
        relevantExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss']
      };

      const { contextChunks, projectFilesBlock, activeFileBlock } = await ContextBuilder.buildContext(
        message, 
        contextBuilderOptions
      );

      // 2. Build the appropriate prompt based on mode with enhanced context
      const promptOptions: PromptOptions = {
        projectFilesBlock,
        activeFileBlock,
        includeAntiHallucination: true,
        activeFilePath
      };

      const prompt = buildPrompt(mode as PromptMode, message, contextChunks, promptOptions);

      // 3. Send to the selected model via adapter with streaming
      const response = await this.sendToModelStream(modelId, prompt, onChunk, abortSignal);

      // 4. Create AI message object
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
   * Retrieve relevant code context chunks using RAG
   */
  private async getCodeContext(query: string): Promise<CodeContext[]> {
    try {
      if (!this.ragService) {
        console.log('RAG service not available, skipping semantic search');
        return [];
      }
      
      // Use RAG service to find relevant code chunks
      const searchResults = await this.ragService.searchSimilar(query, this.config.topK);
      
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
   * Update the RAG index incrementally
   */
  async updateRAGIndex(): Promise<void> {
    try {
      if (!this.ragService) {
        await this.initializeRAG();
      }
      
      if (this.ragService) {
        const stats = await this.ragService.processCodebase();
        console.log('RAG index updated:', stats);
      }
    } catch (error) {
      console.error('Failed to update RAG index:', error);
    }
  }

  /**
   * Rebuild the entire RAG index
   */
  async rebuildRAGIndex(): Promise<void> {
    try {
      if (!this.ragService) {
        await this.initializeRAG();
      }
      
      if (this.ragService) {
        const stats = await this.ragService.rebuild();
        console.log('RAG index rebuilt:', stats);
      }
    } catch (error) {
      console.error('Failed to rebuild RAG index:', error);
    }
  }
}

// Export singleton instance
export const chatAgent = new ChatAgent();