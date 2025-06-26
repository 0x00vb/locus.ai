import { CodebaseEmbedder, FileWalker, CodeChunker } from './index';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Test utilities for the embedder system
 */

// Mock Ollama response for testing
const mockEmbeddingResponse = {
  embedding: Array.from({ length: 384 }, () => Math.random() - 0.5)
};

// Mock the database since we can't use SQLite in test environment
const mockDatabase = {
  init: () => Promise.resolve(),
  close: () => Promise.resolve(),
  insertEmbedding: () => Promise.resolve(),
  getEmbeddingsByPath: () => Promise.resolve([]),
  deleteEmbeddingsByPath: () => Promise.resolve(),
  getAllEmbeddings: () => Promise.resolve([]),
  clearAllEmbeddings: () => Promise.resolve(),
};

// Mock the file walker
const mockFileWalker = {
  walkDirectory: () => Promise.resolve([
    {
      path: '/test/file1.ts',
      relativePath: 'file1.ts',
      size: 1000,
      lastModified: Date.now(),
      extension: '.ts'
    }
  ]),
  readFileContent: () => Promise.resolve('console.log("test");'),
  isModifiedSince: () => Promise.resolve(true),
};

const testDir = path.resolve(__dirname, '../');

// Test the file walker
export async function testFileWalker() {
  console.log('Testing FileWalker...');
  
  const walker = new FileWalker();
  
  try {
    const files = await walker.walkDirectory({
      rootPath: testDir,
      includeExtensions: ['.ts', '.tsx'],
      excludeDirectories: ['node_modules', 'dist']
    });
    
    console.log(`Found ${files.length} TypeScript files`);
    files.slice(0, 3).forEach(file => {
      console.log(`- ${file.relativePath} (${file.size} bytes)`);
    });
    
    return true;
  } catch (error) {
    console.error('FileWalker test failed:', error);
    return false;
  }
}

// Test the code chunker
export async function testCodeChunker() {
  console.log('Testing CodeChunker...');
  
  const chunker = new CodeChunker();
  
  const sampleCode = `
import React from 'react';

interface Props {
  name: string;
  age: number;
}

export function UserCard({ name, age }: Props) {
  const handleClick = () => {
    console.log(\`User \${name} clicked\`);
  };

  return (
    <div onClick={handleClick}>
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
}

export default UserCard;
`;

  try {
    const result = await chunker.chunkFile('test.tsx', sampleCode);
    
    console.log(`Generated ${result.chunks.length} chunks`);
    result.chunks.forEach((chunk, index) => {
      const metadata = result.metadata[index];
      console.log(`Chunk ${index + 1} (${metadata.type}): ${chunk.slice(0, 50)}...`);
    });
    
    return true;
  } catch (error) {
    console.error('CodeChunker test failed:', error);
    return false;
  }
}

// Test database operations
export async function testDatabase() {
  console.log('Testing EmbeddingsDatabase...');
  
  // Import dynamically to avoid issues in browser environment
  const { EmbeddingsDatabase } = await import('../db/database');
  
  const testDbPath = './test-embeddings.sqlite';
  const db = new EmbeddingsDatabase(testDbPath);
  
  try {
    await db.init();
    
    // Test inserting an embedding
    const testRecord = {
      id: 'test-chunk-1',
      path: 'test/file.ts',
      chunk: 'function test() { return "hello"; }',
      vector: Buffer.from(new Float32Array([0.1, 0.2, 0.3, 0.4]).buffer)
    };
    
    await db.insertEmbedding(testRecord);
    
    // Test retrieving embeddings
    const records = await db.getEmbeddingsByPath('test/file.ts');
    console.log(`Retrieved ${records.length} records for test file`);
    
    // Cleanup
    await db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    
    // Cleanup on error
    try {
      await db.close();
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (cleanupError) {
      console.warn('Cleanup failed:', cleanupError);
    }
    
    return false;
  }
}

// Test vector operations
export function testVectorOperations() {
  console.log('Testing vector operations...');
  
  try {
    const embedder = new (class extends CodebaseEmbedder {
      // Expose private methods for testing
      public testNormalizeVector(vector: number[]) {
        return this['normalizeVector'](vector);
      }
      
      public testCosineSimilarity(a: number[], b: number[]) {
        return this['cosineSimilarity'](a, b);
      }
      
      public testVectorToBuffer(vector: number[]) {
        return this['vectorToBuffer'](vector);
      }
      
      public testBufferToVector(buffer: Buffer) {
        return this['bufferToVector'](buffer);
      }
    })({ projectRoot: '/tmp' });
    
    // Test normalization
    const vector = [3, 4, 0]; // magnitude = 5
    const normalized = embedder.testNormalizeVector(vector);
    const expectedMagnitude = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0));
    console.log(`Normalized vector magnitude: ${expectedMagnitude.toFixed(6)} (should be ~1.0)`);
    
    // Test cosine similarity
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    const c = [1, 0, 0];
    
    const similarity1 = embedder.testCosineSimilarity(a, b); // orthogonal = 0
    const similarity2 = embedder.testCosineSimilarity(a, c); // identical = 1
    
    console.log(`Cosine similarity (orthogonal): ${similarity1} (should be 0)`);
    console.log(`Cosine similarity (identical): ${similarity2} (should be 1)`);
    
    // Test buffer conversion
    const testVector = [0.1, 0.2, 0.3, 0.4];
    const buffer = embedder.testVectorToBuffer(testVector);
    const reconstructed = embedder.testBufferToVector(buffer);
    
    const conversionError = testVector.reduce((sum, val, i) => 
      sum + Math.abs(val - reconstructed[i]), 0
    );
    console.log(`Buffer conversion error: ${conversionError} (should be ~0)`);
    
    return true;
  } catch (error) {
    console.error('Vector operations test failed:', error);
    return false;
  }
}

// Run all tests
export async function runAllTests() {
  console.log('=== Running Embedder Tests ===\n');
  
  const tests = [
    { name: 'FileWalker', test: testFileWalker },
    { name: 'CodeChunker', test: testCodeChunker },
    { name: 'Database', test: testDatabase },
    { name: 'Vector Operations', test: testVectorOperations }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    console.log(`\n--- ${name} Test ---`);
    try {
      const success = await test();
      results.push({ name, success });
      console.log(`${name}: ${success ? 'PASSED' : 'FAILED'}\n`);
    } catch (error) {
      console.error(`${name} test threw an error:`, error);
      results.push({ name, success: false });
    }
  }
  
  console.log('\n=== Test Results ===');
  results.forEach(({ name, success }) => {
    console.log(`${name}: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  });
  
  const passedCount = results.filter(r => r.success).length;
  console.log(`\nPassed: ${passedCount}/${results.length}`);
  
  return results;
}

// Uncomment to run tests
// runAllTests().catch(console.error); 