/**
 * Ollama Service - Model Detection and Management
 * Handles fetching available models from Ollama API and model management
 */

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaModelInfo {
  id: string;
  name: string;
  displayName: string;
  size: number;
  family?: string;
  parameterSize?: string;
  available: boolean;
  lastModified: string;
}

export class OllamaService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:11434', timeout: number = 5000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  /**
   * Check if Ollama is running and accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Ollama not available:', error);
      return false;
    }
  }

  /**
   * Fetch all available models from Ollama
   */
  async getAvailableModels(): Promise<OllamaModelInfo[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data: OllamaTagsResponse = await response.json();
      
      return data.models.map(model => this.transformOllamaModel(model));
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout: Ollama took too long to respond');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to Ollama. Make sure Ollama is running on localhost:11434');
        }
      }
      throw error;
    }
  }

  /**
   * Transform Ollama model data to our format
   */
  private transformOllamaModel(model: OllamaModel): OllamaModelInfo {
    // Create a clean model ID for Ollama
    const modelId = `ollama:${model.name}`;
    
    // Generate a human-readable display name
    const displayName = this.generateDisplayName(model.name, model.details);
    
    // Format size in human-readable format
    const sizeInGB = model.size / (1024 * 1024 * 1024);
    
    return {
      id: modelId,
      name: model.name,
      displayName,
      size: model.size,
      family: model.details?.family,
      parameterSize: model.details?.parameter_size,
      available: true,
      lastModified: model.modified_at,
    };
  }

  /**
   * Generate a human-readable display name for a model
   */
  private generateDisplayName(modelName: string, details?: OllamaModel['details']): string {
    // Handle common model name patterns
    const nameMap: Record<string, string> = {
      'codellama': 'CodeLlama',
      'llama2': 'Llama 2',
      'llama3': 'Llama 3',
      'mistral': 'Mistral',
      'mixtral': 'Mixtral',
      'qwen': 'Qwen',
      'dolphin': 'Dolphin',
      'orca': 'Orca',
      'vicuna': 'Vicuna',
      'alpaca': 'Alpaca',
      'wizard': 'WizardLM',
      'openchat': 'OpenChat',
      'starling': 'Starling',
      'neural-chat': 'Neural Chat',
      'deepseek': 'DeepSeek',
      'phi': 'Phi',
      'tinyllama': 'TinyLlama',
      'stable-code': 'Stable Code',
      'magicoder': 'Magicoder',
      'codegemma': 'CodeGemma',
    };

    // Extract base model name and version
    const parts = modelName.split(':');
    const baseName = parts[0].toLowerCase();
    const version = parts[1] || '';

    // Find matching display name
    const displayBase = nameMap[baseName] || this.capitalizeFirst(baseName);

    // Add version and parameter size if available
    let displayName = displayBase;
    if (version) {
      displayName += ` ${version.toUpperCase()}`;
    }
    if (details?.parameter_size) {
      displayName += ` (${details.parameter_size})`;
    }

    return displayName;
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get model info by name
   */
  async getModelInfo(modelName: string): Promise<OllamaModelInfo | null> {
    try {
      const models = await this.getAvailableModels();
      return models.find(model => model.name === modelName || model.id === modelName) || null;
    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const modelInfo = await this.getModelInfo(modelName);
      return modelInfo !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get default model (first available model)
   */
  async getDefaultModel(): Promise<OllamaModelInfo | null> {
    try {
      const models = await this.getAvailableModels();
      
      // Prefer code-focused models for a notes/coding app
      const preferredOrder = [
        'codellama',
        'llama2',
        'llama3',
        'mistral',
        'mixtral'
      ];

      for (const preferred of preferredOrder) {
        const model = models.find(m => m.name.toLowerCase().includes(preferred));
        if (model) return model;
      }

      // Return first available model if no preferred model found
      return models[0] || null;
    } catch (error) {
      console.error('Failed to get default model:', error);
      return null;
    }
  }

  /**
   * Format model size in human-readable format
   */
  static formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Sort models by preference (code models first, then by size)
   */
  static sortModels(models: OllamaModelInfo[]): OllamaModelInfo[] {
    return models.sort((a, b) => {
      // Prioritize code-focused models
      const aIsCode = a.name.toLowerCase().includes('code');
      const bIsCode = b.name.toLowerCase().includes('code');
      
      if (aIsCode && !bIsCode) return -1;
      if (!aIsCode && bIsCode) return 1;
      
      // Then sort by model family preference
      const familyOrder = ['codellama', 'llama', 'mistral', 'mixtral'];
      const aFamilyIndex = familyOrder.findIndex(f => a.name.toLowerCase().includes(f));
      const bFamilyIndex = familyOrder.findIndex(f => b.name.toLowerCase().includes(f));
      
      if (aFamilyIndex !== -1 && bFamilyIndex !== -1) {
        return aFamilyIndex - bFamilyIndex;
      }
      if (aFamilyIndex !== -1) return -1;
      if (bFamilyIndex !== -1) return 1;
      
      // Finally sort by name
      return a.name.localeCompare(b.name);
    });
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();

// Export utility functions
export const OllamaUtils = {
  formatSize: OllamaService.formatSize,
  sortModels: OllamaService.sortModels,
}; 