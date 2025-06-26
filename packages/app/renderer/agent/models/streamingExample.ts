/**
 * Example usage of the streaming model adapter system
 * This file demonstrates how to use the queryModelStream function with streaming responses
 */

import { queryModelStream } from './modelAdapter';

// Example: Using Ollama with streaming for real-time responses
export async function exampleStreamingUsage() {
  try {
    console.log('Starting streaming example...');
    
    let fullResponse = '';
    
    const response = await queryModelStream(
      'llama3.2:latest', 
      'Write a simple hello world in Python and explain each line',
      (chunk: string) => {
        // This callback is called for each streaming chunk
        console.log('Received chunk:', chunk);
        fullResponse += chunk;
        
        // In a real UI, you would update the display here
        // For example: updateMessageContent(messageId, fullResponse);
      }
    );
    
    console.log('Streaming completed. Final response:', response);
    console.log('Accumulated response:', fullResponse);
    
    return response;
  } catch (error) {
    console.error('Streaming example failed:', error);
    throw error;
  }
}

// Example: Generic streaming usage function
export async function askModelWithStreaming(
  modelId: string, 
  question: string,
  onProgress?: (chunk: string, accumulated: string) => void
): Promise<string> {
  try {
    console.log(`Streaming query to ${modelId}: ${question}`);
    
    let accumulated = '';
    
    const response = await queryModelStream(modelId, question, (chunk: string) => {
      accumulated += chunk;
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(chunk, accumulated);
      }
    });
    
    console.log(`Streaming completed for ${modelId}`);
    return response;
  } catch (error) {
    console.error(`Failed to stream query to ${modelId}:`, error);
    throw error;
  }
}

// Example usage scenarios
export const streamingExamples = {
  // Simple streaming example
  codeGeneration: () => askModelWithStreaming(
    'llama3.2:latest', 
    'Create a TypeScript function to validate email addresses',
    (chunk, accumulated) => {
      console.log(`Progress: ${accumulated.length} characters received`);
    }
  ),
  
  // Explanation with streaming
  explanation: () => askModelWithStreaming(
    'llama3.2:latest',
    'Explain the difference between async/await and Promises in JavaScript',
    (chunk, accumulated) => {
      // Could update a progress bar or word count here
      const wordCount = accumulated.split(' ').length;
      console.log(`Words generated: ${wordCount}`);
    }
  ),
  
  // Code review with streaming
  codeReview: () => askModelWithStreaming(
    'codellama:7b',
    'Review this React component and suggest improvements:\n\nfunction Button() {\n  return <button>Click me</button>;\n}',
    (chunk, accumulated) => {
      // In a real app, you'd update the UI in real-time
      console.log('Streaming code review...');
    }
  ),
}; 