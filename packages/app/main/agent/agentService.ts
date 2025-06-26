/**
 * Agent Service - Main Process
 * 
 * This service manages all AI agent functionality in the main process,
 * including embeddings, RAG operations, and file processing.
 * It exposes methods via IPC for the renderer process to use.
 */

import { CodebaseEmbedder, EmbeddingConfig, ProcessingStats } from './rag/embedder';
import { EmbeddingsDatabase, EmbeddingRecord } from './db/database';
import { FileWalker, FileInfo, WalkOptions } from './rag/fileWalker';
import * as path from 'node:path';

export interface AgentServiceConfig {
  projectRoot: string;
  ollamaBaseUrl?: string;
  embeddingModel?: string;
  dbPath?: string;
  chunkSize?: number;
}

export class AgentService {
  private embedder: CodebaseEmbedder | null = null;
  private database: EmbeddingsDatabase | null = null;
  private fileWalker: FileWalker;
  private config: AgentServiceConfig;

  constructor() {
    this.fileWalker = new FileWalker();
    this.config = {
      projectRoot: '',
      ollamaBaseUrl: 'http://localhost:11434',
      embeddingModel: 'nomic-embed-text',
      dbPath: './agent/db/embeddings.sqlite',
      chunkSize: 1000
    };
  }

  /**
   * Initialize the agent service with a project root
   */
  async initialize(config: Partial<AgentServiceConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    if (!this.config.projectRoot) {
      throw new Error('Project root is required');
    }

    // Initialize database
    this.database = new EmbeddingsDatabase(this.config.dbPath);
    await this.database.init();

    // Initialize embedder
    this.embedder = new CodebaseEmbedder({
      projectRoot: this.config.projectRoot,
      ollamaBaseUrl: this.config.ollamaBaseUrl,
      embeddingModel: this.config.embeddingModel,
      dbPath: this.config.dbPath,
      chunkSize: this.config.chunkSize,
      walkOptions: {
        excludeDirectories: ['node_modules', '.git', 'dist', 'build', '.next', 'out'],
        includeExtensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.md', '.txt']
      }
    });

    await this.embedder.initialize();
    console.log('Agent service initialized successfully');
  }

  /**
   * Process the entire codebase for embeddings
   */
  async processCodebase(): Promise<ProcessingStats> {
    if (!this.embedder) {
      throw new Error('Agent service not initialized');
    }
    return this.embedder.processCodebase();
  }

  /**
   * Search for similar code chunks
   */
  async searchSimilar(query: string, limit: number = 10): Promise<Array<{
    record: EmbeddingRecord;
    similarity: number;
  }>> {
    if (!this.embedder) {
      throw new Error('Agent service not initialized');
    }
    return this.embedder.searchSimilar(query, limit);
  }

  /**
   * Get embeddings statistics
   */
  async getStats(): Promise<{
    totalEmbeddings: number;
    uniqueFiles: number;
    dbSize: string;
  }> {
    if (!this.embedder) {
      throw new Error('Agent service not initialized');
    }
    return this.embedder.getStats();
  }

  /**
   * Rebuild all embeddings
   */
  async rebuild(): Promise<ProcessingStats> {
    if (!this.embedder) {
      throw new Error('Agent service not initialized');
    }
    return this.embedder.rebuild();
  }

  /**
   * Get file list from project
   */
  async getFileList(baseDir: string = '.', extensions?: string[]): Promise<string[]> {
    const walkOptions: WalkOptions = {
      rootPath: path.resolve(this.config.projectRoot, baseDir),
      includeExtensions: extensions
    };

    const files = await this.fileWalker.walkDirectory(walkOptions);
    return files.map(file => file.relativePath);
  }

  /**
   * Read file content
   */
  async readFileContent(filePath: string): Promise<string | null> {
    const fullPath = path.resolve(this.config.projectRoot, filePath);
    return this.fileWalker.readFileContent(fullPath);
  }

  /**
   * Get embeddings for a specific file path
   */
  async getEmbeddingsByPath(filePath: string): Promise<EmbeddingRecord[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    return this.database.getEmbeddingsByPath(filePath);
  }

  /**
   * Delete embeddings for a specific file path
   */
  async deleteEmbeddingsByPath(filePath: string): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    return this.database.deleteEmbeddingsByPath(filePath);
  }

  /**
   * Clear all embeddings
   */
  async clearAllEmbeddings(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    return this.database.clearAllEmbeddings();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.embedder) {
      await this.embedder.cleanup();
      this.embedder = null;
    }
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig: Partial<AgentServiceConfig>): Promise<void> {
    const oldProjectRoot = this.config.projectRoot;
    this.config = { ...this.config, ...newConfig };

    // If project root changed, reinitialize
    if (newConfig.projectRoot && newConfig.projectRoot !== oldProjectRoot) {
      await this.cleanup();
      await this.initialize(this.config);
    }
  }
}

// Export singleton instance
export const agentService = new AgentService(); 