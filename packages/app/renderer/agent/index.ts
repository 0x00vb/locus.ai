/**
 * Renderer-side Agent Interface
 * 
 * This module provides a clean interface for accessing AI agent functionality
 * from the renderer process via IPC. All actual processing happens in the main process.
 */

export interface EmbeddingRecord {
  id: string;
  path: string;
  chunk: string;
  vector: Buffer;
  created_at?: string;
  updated_at?: string;
}

export interface EmbeddingProcessingStats {
  totalFiles: number;
  processedFiles: number;
  totalChunks: number;
  processedChunks: number;
  errors: string[];
  startTime: number;
  endTime?: number;
}

export interface AgentServiceConfig {
  projectRoot: string;
  ollamaBaseUrl?: string;
  embeddingModel?: string;
  dbPath?: string;
  chunkSize?: number;
}

export interface SearchResult {
  record: EmbeddingRecord;
  similarity: number;
}

/**
 * Agent client for renderer process
 * Uses IPC to communicate with main process agent service
 */
export class AgentClient {
  /**
   * Process the entire codebase for embeddings
   */
  async processCodebase(): Promise<EmbeddingProcessingStats> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.processCodebase();
  }

  /**
   * Search for similar code chunks
   */
  async searchSimilar(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.searchSimilar(query, limit);
  }

  /**
   * Get embeddings statistics
   */
  async getStats(): Promise<{
    totalEmbeddings: number;
    uniqueFiles: number;
    dbSize: string;
  }> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.getStats();
  }

  /**
   * Rebuild all embeddings
   */
  async rebuild(): Promise<EmbeddingProcessingStats> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.rebuild();
  }

  /**
   * Get file list from project
   */
  async getFileList(baseDir: string = '.', extensions?: string[]): Promise<string[]> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.getFileList(baseDir, extensions);
  }

  /**
   * Read file content
   */
  async readFileContent(filePath: string): Promise<string | null> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.readFileContent(filePath);
  }

  /**
   * Update agent configuration
   */
  async updateConfig(config: Partial<AgentServiceConfig>): Promise<void> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.updateConfig(config);
  }

  /**
   * Get current agent configuration
   */
  async getConfig(): Promise<AgentServiceConfig> {
    if (!window.electronAPI?.agent) {
      throw new Error('Agent API not available');
    }
    return window.electronAPI.agent.getConfig();
  }
}

/**
 * Legacy database interface for backward compatibility
 * Routes through main process embeddings database
 */
export class EmbeddingsDatabase {
  private dbPath: string;

  constructor(dbPath: string = './agent/db/embeddings.sqlite') {
    this.dbPath = dbPath;
  }

  async init(): Promise<void> {
    if (!window.electronAPI?.embeddingsDB) {
      throw new Error('Embeddings database IPC not available');
    }
    return window.electronAPI.embeddingsDB.init(this.dbPath);
  }

  async close(): Promise<void> {
    if (!window.electronAPI?.embeddingsDB) {
      throw new Error('Embeddings database IPC not available');
    }
    return window.electronAPI.embeddingsDB.close();
  }

  async insertEmbedding(record: EmbeddingRecord): Promise<void> {
    if (!window.electronAPI?.embeddingsDB) {
      throw new Error('Embeddings database IPC not available');
    }
    return window.electronAPI.embeddingsDB.insertEmbedding(record);
  }

  async getEmbeddingsByPath(filePath: string): Promise<EmbeddingRecord[]> {
    if (!window.electronAPI?.embeddingsDB) {
      throw new Error('Embeddings database IPC not available');
    }
    return window.electronAPI.embeddingsDB.getEmbeddingsByPath(filePath);
  }

  async deleteEmbeddingsByPath(filePath: string): Promise<void> {
    if (!window.electronAPI?.embeddingsDB) {
      throw new Error('Embeddings database IPC not available');
    }
    return window.electronAPI.embeddingsDB.deleteEmbeddingsByPath(filePath);
  }

  async getAllEmbeddings(): Promise<EmbeddingRecord[]> {
    if (!window.electronAPI?.embeddingsDB) {
      throw new Error('Embeddings database IPC not available');
    }
    return window.electronAPI.embeddingsDB.getAllEmbeddings();
  }

  async clearAllEmbeddings(): Promise<void> {
    if (!window.electronAPI?.embeddingsDB) {
      throw new Error('Embeddings database IPC not available');
    }
    return window.electronAPI.embeddingsDB.clearAllEmbeddings();
  }
}

// Create singleton instances
export const agentClient = new AgentClient();
export const embeddingsDatabase = new EmbeddingsDatabase();

// Chat agent functionality - import and re-export properly to avoid circular dependency
import { ChatAgent, chatAgent as _chatAgent } from './chat/agent';
export { ChatAgent } from './chat/agent';
export type { SendMessageParams, AgentConfig, CodeContext } from './chat/agent';

// Export the singleton instance
export const chatAgent = _chatAgent;

// Export types
export type { ChatMessage, ChatHistory, ModelInfo, ChatState, ChatActions, ChatContextType } from './types';

// File Operations Parser
export { FileOpsParser } from './chat/fileOpsParser';
export type { FileOp, ParseResult } from './chat/fileOpsParser'; 