import { queryOllamaModel, queryOllamaModelStream } from './ollamaAdapter';

/**
 * Model adapter for local Ollama models only
 * @param modelId - The Ollama model identifier (e.g., "codellama:7b" or "llama3")
 * @param prompt - The prompt to send to the model
 * @returns Promise<string> - Clean, plain-text response from the model
 */
export async function queryModel(modelId: string, prompt: string): Promise<string> {
  if (!modelId || !prompt) {
    throw new Error('Both modelId and prompt are required');
  }

  try {
    // All models are now Ollama models - remove any "ollama:" prefix if present
    const ollamaModelName = modelId.startsWith('ollama:') ? modelId.replace('ollama:', '') : modelId;
    return await queryOllamaModel(ollamaModelName, prompt);
  } catch (error) {
    console.error('Error querying Ollama model:', error);
    throw new Error(`Failed to query Ollama model "${modelId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Model adapter for local Ollama models with streaming support
 * @param modelId - The Ollama model identifier (e.g., "codellama:7b" or "llama3")
 * @param prompt - The prompt to send to the model
 * @param onChunk - Callback function called for each streaming chunk
 * @param abortSignal - Optional AbortSignal to cancel the request
 * @returns Promise<string> - Complete response from the model
 */
export async function queryModelStream(
  modelId: string, 
  prompt: string, 
  onChunk: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  if (!modelId || !prompt) {
    throw new Error('Both modelId and prompt are required');
  }

  try {
    // All models are now Ollama models - remove any "ollama:" prefix if present
    const ollamaModelName = modelId.startsWith('ollama:') ? modelId.replace('ollama:', '') : modelId;
    return await queryOllamaModelStream(ollamaModelName, prompt, onChunk, abortSignal);
  } catch (error) {
    console.error('Error querying Ollama model with streaming:', error);
    throw new Error(`Failed to query Ollama model "${modelId}" with streaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 