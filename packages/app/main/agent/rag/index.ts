// Main embedder exports
export { CodebaseEmbedder } from './embedder';
export type { 
  EmbeddingConfig, 
  ProcessingStats, 
  EmbeddingResponse 
} from './embedder';

// File walking exports
export { FileWalker } from './fileWalker';
export type { 
  FileInfo, 
  WalkOptions 
} from './fileWalker';

// Chunking exports
export { CodeChunker } from './chunker';
export type { 
  ChunkResult, 
  ChunkMetadata 
} from './chunker';

// Database exports
export { EmbeddingsDatabase } from '../db/database';
export type { 
  EmbeddingRecord 
} from '../db/database'; 