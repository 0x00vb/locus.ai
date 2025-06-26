import { FileWalker, FileInfo, WalkOptions } from './fileWalker';
import { CodeChunker, ChunkResult, ChunkMetadata } from './chunker';
import { EmbeddingsDatabase, EmbeddingRecord } from '../db/database';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';

export interface EmbeddingConfig {
  projectRoot: string;
  ollamaBaseUrl?: string;
  embeddingModel?: string;
  dbPath?: string;
  chunkSize?: number;
  walkOptions?: Partial<WalkOptions>;
}

export interface ProcessingStats {
  totalFiles: number;
  processedFiles: number;
  totalChunks: number;
  processedChunks: number;
  errors: string[];
  startTime: number;
  endTime?: number;
}

export interface EmbeddingResponse {
  embedding: number[];
}

export class CodebaseEmbedder {
  private fileWalker: FileWalker;
  private chunker: CodeChunker;
  private database: EmbeddingsDatabase;
  private config: Required<EmbeddingConfig>;

  constructor(config: EmbeddingConfig) {
    this.config = {
      projectRoot: config.projectRoot,
      ollamaBaseUrl: config.ollamaBaseUrl || 'http://localhost:11434',
      embeddingModel: config.embeddingModel || 'nomic-embed-text',
      dbPath: config.dbPath || './agent/db/embeddings.sqlite',
      chunkSize: config.chunkSize || 1000,
      walkOptions: config.walkOptions || {}
    };

    this.fileWalker = new FileWalker();
    this.chunker = new CodeChunker();
    this.database = new EmbeddingsDatabase(this.config.dbPath);
  }

  /**
   * Initialize the embedder system
   */
  async initialize(): Promise<void> {
    await this.database.init();
    console.log('Embedder initialized successfully');
  }

  /**
   * Process the entire codebase
   */
  async processCodebase(): Promise<ProcessingStats> {
    const stats: ProcessingStats = {
      totalFiles: 0,
      processedFiles: 0,
      totalChunks: 0,
      processedChunks: 0,
      errors: [],
      startTime: Date.now()
    };

    try {
      console.log('Starting codebase processing...');
      
      // Walk the directory tree
      const files = await this.fileWalker.walkDirectory({
        rootPath: this.config.projectRoot,
        ...this.config.walkOptions
      });

      stats.totalFiles = files.length;
      console.log(`Found ${files.length} files to process`);

      // Process each file
      for (const file of files) {
        try {
          await this.processFile(file, stats);
          stats.processedFiles++;
        } catch (error) {
          const errorMsg = `Error processing file ${file.relativePath}: ${error}`;
          console.error(errorMsg);
          stats.errors.push(errorMsg);
        }
      }

      stats.endTime = Date.now();
      console.log('Codebase processing completed:', stats);
      
      return stats;
    } catch (error) {
      stats.endTime = Date.now();
      const errorMsg = `Error during codebase processing: ${error}`;
      console.error(errorMsg);
      stats.errors.push(errorMsg);
      throw error;
    }
  }

  /**
   * Process a single file
   */
  private async processFile(file: FileInfo, stats: ProcessingStats): Promise<void> {
    // Check if file has been processed and is up to date
    const existingEmbeddings = await this.database.getEmbeddingsByPath(file.relativePath);
    const needsUpdate = existingEmbeddings.length === 0 || 
                       await this.fileWalker.isModifiedSince(file.path, file.lastModified);

    if (!needsUpdate) {
      console.log(`Skipping unchanged file: ${file.relativePath}`);
      return;
    }

    // Read file content
    const content = await this.fileWalker.readFileContent(file.path);
    if (!content) {
      throw new Error(`Could not read file content: ${file.path}`);
    }

    // Delete existing embeddings for this file
    if (existingEmbeddings.length > 0) {
      await this.database.deleteEmbeddingsByPath(file.relativePath);
    }

    // Chunk the file
    const chunkResult = await this.chunker.chunkFile(file.path, content);
    stats.totalChunks += chunkResult.chunks.length;

    console.log(`Processing ${chunkResult.chunks.length} chunks for ${file.relativePath}`);

    // Process each chunk
    for (let i = 0; i < chunkResult.chunks.length; i++) {
      const chunk = chunkResult.chunks[i];
      const metadata = chunkResult.metadata[i];

      try {
        await this.processChunk(file, chunk, metadata, i);
        stats.processedChunks++;
      } catch (error) {
        const errorMsg = `Error processing chunk ${i} of ${file.relativePath}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }
  }

  /**
   * Process a single chunk: generate embedding and store in database
   */
  private async processChunk(
    file: FileInfo,
    chunk: string,
    metadata: ChunkMetadata,
    chunkIndex: number
  ): Promise<void> {
    // Generate unique ID for this chunk
    const chunkId = this.generateChunkId(file.relativePath, chunkIndex, chunk);

    // Generate embedding using Ollama
    const embedding = await this.generateEmbedding(chunk);

    // Convert embedding to Buffer
    const vectorBuffer = this.vectorToBuffer(embedding);

    // Create embedding record
    const record: EmbeddingRecord = {
      id: chunkId,
      path: file.relativePath,
      chunk: chunk,
      vector: vectorBuffer
    };

    // Store in database
    await this.database.insertEmbedding(record);
  }

  /**
   * Generate embedding using Ollama API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const url = `${this.config.ollamaBaseUrl}/api/embeddings`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.embeddingModel,
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data: EmbeddingResponse = await response.json();
    
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    // Normalize the embedding vector
    return this.normalizeVector(data.embedding);
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * Convert number array to Float32Array buffer
   */
  private vectorToBuffer(vector: number[]): Buffer {
    const float32Array = new Float32Array(vector);
    return Buffer.from(float32Array.buffer);
  }

  /**
   * Convert buffer back to number array
   */
  private bufferToVector(buffer: Buffer): number[] {
    const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
    return Array.from(float32Array);
  }

  /**
   * Generate unique chunk ID
   */
  private generateChunkId(filePath: string, chunkIndex: number, content: string): string {
    const hash = createHash('sha256');
    hash.update(`${filePath}:${chunkIndex}:${content.slice(0, 100)}`);
    return hash.digest('hex');
  }

  /**
   * Search for similar chunks using cosine similarity
   */
  async searchSimilar(queryText: string, limit: number = 10): Promise<Array<{
    record: EmbeddingRecord;
    similarity: number;
  }>> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(queryText);
    
    // Get all embeddings from database
    const allEmbeddings = await this.database.getAllEmbeddings();
    
    // Calculate similarities
    const similarities = allEmbeddings.map(record => {
      const recordVector = this.bufferToVector(record.vector);
      const similarity = this.cosineSimilarity(queryEmbedding, recordVector);
      return { record, similarity };
    });

    // Sort by similarity and return top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get processing statistics
   */
  async getStats(): Promise<{
    totalEmbeddings: number;
    uniqueFiles: number;
    dbSize: string;
  }> {
    const allEmbeddings = await this.database.getAllEmbeddings();
    const uniqueFiles = new Set(allEmbeddings.map(e => e.path)).size;
    
    // Get database file size
    const dbSize = await this.getDbFileSize();

    return {
      totalEmbeddings: allEmbeddings.length,
      uniqueFiles,
      dbSize: this.formatBytes(dbSize)
    };
  }

  /**
   * Get database file size in bytes
   */
  private async getDbFileSize(): Promise<number> {
    try {
      const stats = await fs.promises.stat(this.config.dbPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Clear all embeddings and rebuild
   */
  async rebuild(): Promise<ProcessingStats> {
    console.log('Rebuilding embeddings database...');
    await this.database.clearAllEmbeddings();
    return this.processCodebase();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.database.close();
  }
} 