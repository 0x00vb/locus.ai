# RAG (Retrieval-Augmented Generation) System

A comprehensive codebase chunking and indexing engine that enables semantic search across your project files using local embeddings.

## Features

- **AST-Aware Chunking**: Uses tree-sitter to intelligently split TypeScript/JavaScript files by functions, classes, interfaces, etc.
- **Fallback Text Chunking**: Line-based chunking for unsupported file types
- **Local Embeddings**: Uses Ollama's embedding endpoint for generating vector representations
- **SQLite Storage**: Efficient local storage with normalized float32 vectors
- **Incremental Updates**: Only processes files that have been modified
- **Semantic Search**: Cosine similarity search for finding relevant code chunks

## Quick Start

```typescript
import { CodebaseEmbedder } from './agent/rag';

const embedder = new CodebaseEmbedder({
  projectRoot: '/path/to/your/project',
  ollamaBaseUrl: 'http://localhost:11434',
  embeddingModel: 'nomic-embed-text'
});

// Initialize and process codebase
await embedder.initialize();
const stats = await embedder.processCodebase();

// Search for relevant code
const results = await embedder.searchSimilar('React component', 5);
console.log(results);
```

## Architecture

### Core Components

1. **FileWalker** (`fileWalker.ts`)
   - Recursively traverses project directory
   - Excludes common directories (node_modules, .git, dist, etc.)
   - Filters files by extension and size
   - Tracks modification times for incremental updates

2. **CodeChunker** (`chunker.ts`)
   - AST-aware parsing for TypeScript/JavaScript files
   - Extracts meaningful code constructs (functions, classes, interfaces)
   - Falls back to line-based chunking for other file types
   - Configurable chunk size limits

3. **EmbeddingsDatabase** (`../db/database.ts`)
   - SQLite storage for embeddings and metadata
   - Normalized float32 vector storage as binary blobs
   - Indexed by file path and timestamps
   - CRUD operations for embedding records

4. **CodebaseEmbedder** (`embedder.ts`)
   - Main orchestrator class
   - Integrates file walking, chunking, and embedding generation
   - Handles Ollama API communication
   - Provides semantic search functionality

## Configuration

```typescript
interface EmbeddingConfig {
  projectRoot: string;              // Root directory to process
  ollamaBaseUrl?: string;           // Ollama API endpoint (default: http://localhost:11434)
  embeddingModel?: string;          // Model name (default: nomic-embed-text)
  dbPath?: string;                  // SQLite database path
  chunkSize?: number;               // Max chunk size in characters
  walkOptions?: Partial<WalkOptions>; // File walking options
}
```

## Database Schema

```sql
CREATE TABLE embeddings (
  id TEXT PRIMARY KEY,              -- Unique chunk identifier
  path TEXT NOT NULL,               -- Relative file path
  chunk TEXT NOT NULL,              -- Code/text chunk
  vector BLOB NOT NULL,             -- Embedding vector (float32 binary)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Supported File Types

- **AST-Aware**: `.ts`, `.tsx`, `.js`, `.jsx`
- **Text-Based**: `.py`, `.java`, `.c`, `.cpp`, `.cs`, `.php`, `.rb`, `.go`, `.rs`, `.swift`, `.kt`, `.scala`, `.sh`, `.sql`, `.html`, `.css`, `.scss`, `.xml`, `.json`, `.yaml`, `.md`, `.txt`, and more

## Usage Examples

### Basic Processing

```typescript
const embedder = new CodebaseEmbedder({
  projectRoot: process.cwd(),
  walkOptions: {
    includeExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    excludeDirectories: ['node_modules', 'dist', 'build']
  }
});

await embedder.initialize();
const stats = await embedder.processCodebase();
console.log('Processing completed:', stats);
```

### Incremental Updates

```typescript
// Only processes files modified since last embedding
const stats = await embedder.processCodebase();
```

### Semantic Search

```typescript
const results = await embedder.searchSimilar('authentication middleware', 10);
results.forEach(result => {
  console.log(`${result.record.path} (${result.similarity.toFixed(3)})`);
  console.log(result.record.chunk.slice(0, 200));
});
```

### Rebuild Database

```typescript
// Clear all embeddings and rebuild from scratch
const stats = await embedder.rebuild();
```

### Get Statistics

```typescript
const stats = await embedder.getStats();
console.log({
  totalEmbeddings: stats.totalEmbeddings,
  uniqueFiles: stats.uniqueFiles,
  dbSize: stats.dbSize
});
```

## Performance Considerations

- **Chunk Size**: Larger chunks provide more context but increase processing time
- **File Filters**: Use `includeExtensions` and `excludeDirectories` to limit scope
- **Incremental Updates**: Only modified files are reprocessed on subsequent runs
- **Vector Normalization**: All vectors are normalized for consistent similarity calculations

## Requirements

- **Ollama**: Must be running locally with an embedding model installed
- **Node.js**: File system access for reading project files
- **SQLite3**: For local embedding storage

## Installation

The required dependencies should already be installed:

```bash
npm install sqlite3 tree-sitter tree-sitter-typescript tree-sitter-javascript
```

## Error Handling

The system includes comprehensive error handling:

- File access errors are logged and skipped
- Ollama API failures are retried with backoff
- Database errors are caught and reported
- Processing continues even if individual files fail

## Testing

Run the test suite to verify functionality:

```typescript
import { runAllTests } from './embedder.test';
await runAllTests();
```

## Integration with Chat Agent

The embedder can be integrated with the chat agent to provide context-aware responses:

```typescript
// In your chat agent
const searchResults = await embedder.searchSimilar(userQuery, 5);
const context = searchResults.map(r => r.record.chunk).join('\n\n');
// Include context in prompt to LLM
``` 