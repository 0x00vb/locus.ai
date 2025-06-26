export { ChatAgent, chatAgent } from './chat/agent';
export type { SendMessageParams, AgentConfig, CodeContext } from './chat/agent';
export type { ChatMessage, ChatHistory, ModelInfo, ChatState, ChatActions, ChatContextType } from './types';

// File Operations Parser
export { FileOpsParser } from './chat/fileOpsParser';
export type { FileOp, ParseResult } from './chat/fileOpsParser';

// RAG/Embedder exports
export { 
  CodebaseEmbedder, 
  FileWalker, 
  CodeChunker, 
  EmbeddingsDatabase 
} from './rag';
export type { 
  EmbeddingConfig, 
  ProcessingStats, 
  EmbeddingResponse,
  FileInfo, 
  WalkOptions,
  ChunkResult, 
  ChunkMetadata,
  EmbeddingRecord 
} from './rag'; 