// Main process database implementation using SQLite
import * as path from 'node:path';
import * as fs from 'node:fs';

export interface EmbeddingRecord {
  id: string;
  path: string;
  chunk: string;
  vector: Buffer;
  created_at?: string;
  updated_at?: string;
}

export class EmbeddingsDatabase {
  private dbPath: string;
  private db: any; // Will hold the database instance

  constructor(dbPath: string = './agent/db/embeddings.sqlite') {
    this.dbPath = path.resolve(dbPath);
  }

  async init(): Promise<void> {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // For now, we'll use a simple JSON file-based storage
      // In a production environment, you'd want to use better-sqlite3 or similar
      await this.initJsonStorage();
    } catch (error) {
      console.error('Failed to initialize embeddings database:', error);
      throw error;
    }
  }

  private async initJsonStorage(): Promise<void> {
    // Create embeddings.json file if it doesn't exist
    const jsonPath = this.dbPath.replace('.sqlite', '.json');
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, JSON.stringify({ embeddings: [] }, null, 2));
    }
  }

  async close(): Promise<void> {
    // JSON storage doesn't need closing
    this.db = null;
  }

  async insertEmbedding(record: EmbeddingRecord): Promise<void> {
    try {
      const jsonPath = this.dbPath.replace('.sqlite', '.json');
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      // Add timestamps
      record.created_at = new Date().toISOString();
      record.updated_at = new Date().toISOString();
      
      data.embeddings.push(record);
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to insert embedding:', error);
      throw error;
    }
  }

  async getEmbeddingsByPath(filePath: string): Promise<EmbeddingRecord[]> {
    try {
      const jsonPath = this.dbPath.replace('.sqlite', '.json');
      if (!fs.existsSync(jsonPath)) {
        return [];
      }
      
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return data.embeddings.filter((record: EmbeddingRecord) => record.path === filePath);
    } catch (error) {
      console.error('Failed to get embeddings by path:', error);
      return [];
    }
  }

  async deleteEmbeddingsByPath(filePath: string): Promise<void> {
    try {
      const jsonPath = this.dbPath.replace('.sqlite', '.json');
      if (!fs.existsSync(jsonPath)) {
        return;
      }
      
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      data.embeddings = data.embeddings.filter((record: EmbeddingRecord) => record.path !== filePath);
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to delete embeddings by path:', error);
      throw error;
    }
  }

  async getAllEmbeddings(): Promise<EmbeddingRecord[]> {
    try {
      const jsonPath = this.dbPath.replace('.sqlite', '.json');
      if (!fs.existsSync(jsonPath)) {
        return [];
      }
      
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return data.embeddings || [];
    } catch (error) {
      console.error('Failed to get all embeddings:', error);
      return [];
    }
  }

  async clearAllEmbeddings(): Promise<void> {
    try {
      const jsonPath = this.dbPath.replace('.sqlite', '.json');
      fs.writeFileSync(jsonPath, JSON.stringify({ embeddings: [] }, null, 2));
    } catch (error) {
      console.error('Failed to clear all embeddings:', error);
      throw error;
    }
  }
} 