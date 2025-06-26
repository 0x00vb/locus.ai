/**
 * Common types for model adapters
 */

export interface ModelConfig {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface ModelResponse {
  content: string;
  metadata?: {
    tokens?: number;
    duration?: number;
    model?: string;
  };
}

export type ModelProvider = 'ollama' | 'openai' | 'anthropic' | 'custom';

export interface ModelInfo {
  id: string;
  provider: ModelProvider;
  name: string;
  description?: string;
  available: boolean;
}

export class ModelError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly modelId: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ModelError';
  }
} 