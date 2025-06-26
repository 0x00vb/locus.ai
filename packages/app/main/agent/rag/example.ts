import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { CodebaseEmbedder } from './embedder';

const __dirname = dirname(fileURLToPath(import.meta.url));


// NOTE: This example is for demonstration purposes.
// In a real Electron app, the embedder should run in the main process,
// not the renderer process, due to file system and database access requirements.

/**
 * Example usage of the CodebaseEmbedder
 */
export async function exampleBasicUsage() {
  console.log('=== Basic Codebase Embedding Example ===');
  
  const embedder = new CodebaseEmbedder({
    projectRoot: path.resolve(__dirname, '../../../../../'), // Go to project root
    ollamaBaseUrl: 'http://localhost:11434',
    embeddingModel: 'nomic-embed-text',
    dbPath: './agent/db/embeddings.sqlite',
    chunkSize: 1000,
    walkOptions: {
      excludeDirectories: ['node_modules', '.git', 'dist', 'build'],
      includeExtensions: ['.ts', '.tsx', '.js', '.jsx', '.md']
    }
  });

  try {
    // Initialize the system
    console.log('Initializing embedder...');
    await embedder.initialize();

    // Process the codebase
    console.log('Processing codebase...');
    const stats = await embedder.processCodebase();
    
    console.log('Processing completed:', {
      files: `${stats.processedFiles}/${stats.totalFiles}`,
      chunks: `${stats.processedChunks}/${stats.totalChunks}`,
      duration: `${(stats.endTime! - stats.startTime) / 1000}s`,
      errors: stats.errors.length
    });

    // Get current stats
    const currentStats = await embedder.getStats();
    console.log('Database stats:', currentStats);

    // Example search
    const searchResults = await embedder.searchSimilar('React component', 5);
    console.log('Search results for "React component":');
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.record.path} (similarity: ${result.similarity.toFixed(3)})`);
      console.log(`   Chunk: ${result.record.chunk.slice(0, 100)}...`);
    });

  } catch (error) {
    console.error('Error during processing:', error);
  } finally {
    // Cleanup
    await embedder.cleanup();
  }
}

/**
 * Example of incremental updates
 */
export async function exampleIncrementalUpdate() {
  const config = {
    projectRoot: path.resolve(__dirname, '../../../../../'),
    dbPath: './agent/db/embeddings.sqlite'
  };

  const embedder = new CodebaseEmbedder(config);

  try {
    await embedder.initialize();
    
    // This will only process files that have been modified
    // since they were last embedded
    const stats = await embedder.processCodebase();
    
    console.log('Incremental update completed:', stats);
    
  } catch (error) {
    console.error('Error during incremental update:', error);
  } finally {
    await embedder.cleanup();
  }
}

/**
 * Example of rebuilding the entire database
 */
export async function exampleRebuild() {
  const config = {
    projectRoot: path.resolve(__dirname, '../../../../../'),
    dbPath: './agent/db/embeddings.sqlite'
  };

  const embedder = new CodebaseEmbedder(config);

  try {
    await embedder.initialize();
    
    // This will clear all existing embeddings and rebuild from scratch
    const stats = await embedder.rebuild();
    
    console.log('Rebuild completed:', stats);
    
  } catch (error) {
    console.error('Error during rebuild:', error);
  } finally {
    await embedder.cleanup();
  }
}

export async function exampleWithCustomConfig() {
  console.log('=== Custom Configuration Example ===');
  
  const embedder = new CodebaseEmbedder({
    projectRoot: path.resolve(__dirname, '../../../../../'),
    ollamaBaseUrl: 'http://localhost:11434',
    embeddingModel: 'nomic-embed-text',
    dbPath: './agent/db/embeddings.sqlite',
    chunkSize: 1000,
    walkOptions: {
      excludeDirectories: ['node_modules', '.git', 'dist', 'build'],
      includeExtensions: ['.ts', '.tsx', '.js', '.jsx', '.md']
    }
  });

  try {
    // Initialize the system
    console.log('Initializing embedder...');
    await embedder.initialize();

    // Process the codebase
    console.log('Processing codebase...');
    const stats = await embedder.processCodebase();
    
    console.log('Processing completed:', {
      files: `${stats.processedFiles}/${stats.totalFiles}`,
      chunks: `${stats.processedChunks}/${stats.totalChunks}`,
      duration: `${(stats.endTime! - stats.startTime) / 1000}s`,
      errors: stats.errors.length
    });

    // Get current stats
    const currentStats = await embedder.getStats();
    console.log('Database stats:', currentStats);

    // Example search
    const searchResults = await embedder.searchSimilar('React component', 5);
    console.log('Search results for "React component":');
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.record.path} (similarity: ${result.similarity.toFixed(3)})`);
      console.log(`   Chunk: ${result.record.chunk.slice(0, 100)}...`);
    });

  } catch (error) {
    console.error('Error during processing:', error);
  } finally {
    // Cleanup
    await embedder.cleanup();
  }
}

export async function exampleSearchAndRetrieval() {
  console.log('=== Search and Retrieval Example ===');
  
  const embedder = new CodebaseEmbedder({
    projectRoot: path.resolve(__dirname, '../../../../../'),
    ollamaBaseUrl: 'http://localhost:11434',
    embeddingModel: 'nomic-embed-text',
    dbPath: './agent/db/embeddings.sqlite',
    chunkSize: 1000,
    walkOptions: {
      excludeDirectories: ['node_modules', '.git', 'dist', 'build'],
      includeExtensions: ['.ts', '.tsx', '.js', '.jsx', '.md']
    }
  });

  try {
    // Initialize the system
    console.log('Initializing embedder...');
    await embedder.initialize();

    // Process the codebase
    console.log('Processing codebase...');
    const stats = await embedder.processCodebase();
    
    console.log('Processing completed:', {
      files: `${stats.processedFiles}/${stats.totalFiles}`,
      chunks: `${stats.processedChunks}/${stats.totalChunks}`,
      duration: `${(stats.endTime! - stats.startTime) / 1000}s`,
      errors: stats.errors.length
    });

    // Get current stats
    const currentStats = await embedder.getStats();
    console.log('Database stats:', currentStats);

    // Example search
    const searchResults = await embedder.searchSimilar('React component', 5);
    console.log('Search results for "React component":');
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.record.path} (similarity: ${result.similarity.toFixed(3)})`);
      console.log(`   Chunk: ${result.record.chunk.slice(0, 100)}...`);
    });

  } catch (error) {
    console.error('Error during processing:', error);
  } finally {
    // Cleanup
    await embedder.cleanup();
  }
}

// Uncomment to run the examples
// exampleBasicUsage().catch(console.error);
// exampleIncrementalUpdate().catch(console.error);
// exampleRebuild().catch(console.error);
// exampleWithCustomConfig().catch(console.error);
// exampleSearchAndRetrieval().catch(console.error); 