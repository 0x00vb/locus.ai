/**
 * Quick test for streaming functionality
 * Run this in Node.js console or browser console to test streaming
 */

import { queryModelStream } from './modelAdapter';

export async function testStreamingInConsole() {
  console.log('🚀 Testing streaming functionality...');
  
  try {
    let chunks: string[] = [];
    let fullResponse = '';
    
    const startTime = Date.now();
    
    const result = await queryModelStream(
      'llama3.2:latest',
      'Say hello and count to 5',
      (chunk: string) => {
        chunks.push(chunk);
        fullResponse += chunk;
        
        // Log each chunk as it arrives
        console.log(`📝 Chunk ${chunks.length}: "${chunk}"`);
        console.log(`📊 Progress: ${fullResponse.length} characters total`);
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n✅ Streaming completed!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📈 Total chunks: ${chunks.length}`);
    console.log(`📏 Final length: ${result.length} characters`);
    console.log(`📋 Final response: "${result}"`);
    
    return {
      success: true,
      duration,
      chunks: chunks.length,
      finalResponse: result,
      characterCount: result.length
    };
    
  } catch (error) {
    console.error('❌ Streaming test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Browser-compatible version (no imports)
export const streamingTestCode = `
// Copy this code to browser console to test streaming
async function testStreamingInBrowser() {
  const API_URL = 'http://localhost:11434/api/generate';
  
  console.log('🚀 Testing streaming in browser...');
  
  try {
    let chunks = [];
    let fullResponse = '';
    
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: 'Say hello and count to 5',
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const jsonChunk = JSON.parse(line);
            
            if (jsonChunk.response) {
              chunks.push(jsonChunk.response);
              fullResponse += jsonChunk.response;
              
              console.log(\`📝 Chunk \${chunks.length}: "\${jsonChunk.response}"\`);
              console.log(\`📊 Progress: \${fullResponse.length} characters\`);
            }
            
            if (jsonChunk.done) {
              const endTime = Date.now();
              console.log('\\n✅ Browser streaming test completed!');
              console.log(\`⏱️  Duration: \${endTime - startTime}ms\`);
              console.log(\`📈 Total chunks: \${chunks.length}\`);
              console.log(\`📋 Final response: "\${fullResponse}"\`);
              return { success: true, response: fullResponse };
            }
          } catch (parseError) {
            // Skip invalid JSON
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Browser streaming test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testStreamingInBrowser();
`;

console.log('📖 To test streaming in browser console, copy this code:');
console.log(streamingTestCode); 