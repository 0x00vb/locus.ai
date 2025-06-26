interface OllamaRequest {
  model: string;
  prompt: string;
  stream: false;
}

interface OllamaStreamRequest {
  model: string;
  prompt: string;
  stream: true;
}

interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaStreamResponse {
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Query Ollama model via local API
 * @param modelName - The Ollama model name (e.g., "codellama:7b")
 * @param prompt - The prompt to send to the model
 * @returns Promise<string> - Clean, plain-text response from Ollama
 */
export async function queryOllamaModel(modelName: string, prompt: string): Promise<string> {
  if (!modelName || !prompt) {
    throw new Error('Both modelName and prompt are required');
  }

  const requestBody: OllamaRequest = {
    model: modelName,
    prompt: prompt,
    stream: false
  };

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    
    if (!data.response) {
      throw new Error('Invalid response from Ollama API: missing response field');
    }

    // Return clean, plain-text string only
    return data.response.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to Ollama. Make sure Ollama is running on localhost:11434');
    }
    throw error;
  }
}

/**
 * Query Ollama model with streaming support
 * @param modelName - The Ollama model name (e.g., "codellama:7b")
 * @param prompt - The prompt to send to the model
 * @param onChunk - Callback function called for each streaming chunk
 * @param abortSignal - Optional AbortSignal to cancel the request
 * @returns Promise<string> - Complete response from Ollama
 */
export async function queryOllamaModelStream(
  modelName: string, 
  prompt: string,
  onChunk: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  if (!modelName || !prompt) {
    throw new Error('Both modelName and prompt are required');
  }

  const requestBody: OllamaStreamRequest = {
    model: modelName,
    prompt: prompt,
    stream: true
  };

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        if (abortSignal?.aborted) {
          throw new Error('Request was aborted');
        }

        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const jsonChunk: OllamaStreamResponse = JSON.parse(line);
              
              if (jsonChunk.response) {
                fullResponse += jsonChunk.response;
                if (!abortSignal?.aborted) {
                  onChunk(jsonChunk.response);
                }
              }

              if (jsonChunk.done) {
                return fullResponse.trim();
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to Ollama. Make sure Ollama is running on localhost:11434');
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request was cancelled');
    }
    throw error;
  }
} 