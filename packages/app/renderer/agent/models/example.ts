/**
 * Example usage of the model adapter system
 * This file demonstrates how to use the queryModel function with different providers
 */

import { queryModel } from './modelAdapter';

// Example: Using Ollama with CodeLlama
export async function exampleOllamaUsage() {
  try {
    const response = await queryModel('ollama:codellama:7b', 'Write a simple hello world in Python');
    console.log('Ollama response:', response);
    return response;
  } catch (error) {
    console.error('Ollama example failed:', error);
    throw error;
  }
}

// Example: Generic usage function
export async function askModel(modelId: string, question: string): Promise<string> {
  try {
    console.log(`Querying ${modelId} with: ${question}`);
    const response = await queryModel(modelId, question);
    console.log(`Response from ${modelId}:`, response);
    return response;
  } catch (error) {
    console.error(`Failed to query ${modelId}:`, error);
    throw error;
  }
}

// Example usage scenarios
export const exampleUsages = {
  // Local Ollama models
  codeLlama: () => askModel('ollama:codellama:7b', 'Explain async/await in JavaScript'),
  mistral: () => askModel('ollama:mistral:7b', 'What is the difference between REST and GraphQL?'),
}; 