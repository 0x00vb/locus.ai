/**
 * Model Manager Service - Ollama Only
 * Manages local Ollama models exclusively
 */

import { ModelInfo } from '../types';
import { ollamaService, OllamaModelInfo, OllamaUtils } from './ollamaService';

export interface ModelManagerConfig {
  selectedModelKey: string;
  refreshInterval?: number;
}

export class ModelManager {
  private config: ModelManagerConfig;
  private refreshTimer?: NodeJS.Timeout;
  private listeners: Array<(models: ModelInfo[]) => void> = [];

  constructor(config: Partial<ModelManagerConfig> = {}) {
    this.config = {
      selectedModelKey: 'selected_model_id',
      refreshInterval: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Initialize the model manager and fetch Ollama models
   */
  async initialize(): Promise<ModelInfo[]> {
    try {
      const models = await this.getAllAvailableModels();
      
      // Start auto-refresh
      if (this.config.refreshInterval) {
        this.startAutoRefresh();
      }
      
      return models;
    } catch (error) {
      console.error('Failed to initialize model manager:', error);
      return [];
    }
  }

  /**
   * Get all available Ollama models
   */
  async getAllAvailableModels(): Promise<ModelInfo[]> {
    try {
      const isOllamaAvailable = await ollamaService.isAvailable();
      if (!isOllamaAvailable) {
        console.warn('Ollama is not available at localhost:11434');
        return [];
      }

      const ollamaModels = await ollamaService.getAvailableModels();
      const convertedModels = ollamaModels.map(model => this.convertOllamaToModelInfo(model));
      return this.sortModelsByPreference(convertedModels);
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  /**
   * Convert Ollama model info to generic ModelInfo format
   */
  private convertOllamaToModelInfo(ollamaModel: OllamaModelInfo): ModelInfo {
    return {
      id: ollamaModel.id,
      name: ollamaModel.name,
      displayName: ollamaModel.displayName,
      provider: 'ollama',
      available: ollamaModel.available,
      size: ollamaModel.size,
      family: ollamaModel.family,
      parameterSize: ollamaModel.parameterSize,
      lastModified: ollamaModel.lastModified,
      description: this.generateModelDescription(ollamaModel),
    };
  }

  /**
   * Generate a description for a model
   */
  private generateModelDescription(model: OllamaModelInfo): string {
    const parts: string[] = [];
    
    if (model.family) {
      parts.push(`${model.family} family`);
    }
    
    if (model.parameterSize) {
      parts.push(model.parameterSize);
    }
    
    if (model.size) {
      parts.push(OllamaUtils.formatSize(model.size));
    }
    
    return parts.join(' • ');
  }

  /**
   * Sort models by preference (code models first, available models first)
   */
  private sortModelsByPreference(models: ModelInfo[]): ModelInfo[] {
    return models.sort((a, b) => {
      // Available models first
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      
      // Code-focused models first
      const aIsCode = a.name.toLowerCase().includes('code');
      const bIsCode = b.name.toLowerCase().includes('code');
      if (aIsCode && !bIsCode) return -1;
      if (!aIsCode && bIsCode) return 1;
      
      // Sort by name
      return (a.displayName || a.name).localeCompare(b.displayName || b.name);
    });
  }

  /**
   * Get the currently selected model ID from localStorage
   */
  getSelectedModelId(): string | null {
    try {
      return localStorage.getItem(this.config.selectedModelKey);
    } catch (error) {
      console.warn('Failed to get selected model from localStorage:', error);
      return null;
    }
  }

  /**
   * Set the selected model ID in localStorage
   */
  setSelectedModelId(modelId: string): void {
    try {
      localStorage.setItem(this.config.selectedModelKey, modelId);
    } catch (error) {
      console.warn('Failed to save selected model to localStorage:', error);
    }
  }

  /**
   * Get the best default model from available models
   */
  async getDefaultModel(): Promise<ModelInfo | null> {
    try {
      const models = await this.getAllAvailableModels();
      const availableModels = models.filter(m => m.available);
      
      if (availableModels.length === 0) {
        return null;
      }
      
      // Look for preferred models first
      const preferred = ['codellama', 'llama', 'mistral'];
      for (const pref of preferred) {
        const model = availableModels.find(m => 
          m.name.toLowerCase().includes(pref)
        );
        if (model) return model;
      }
      
      // Return first available model
      return availableModels[0];
    } catch (error) {
      console.error('Failed to get default model:', error);
      return null;
    }
  }

  /**
   * Refresh available models and notify listeners
   */
  async refreshModels(): Promise<ModelInfo[]> {
    try {
      const models = await this.getAllAvailableModels();
      this.notifyListeners(models);
      return models;
    } catch (error) {
      console.error('Failed to refresh models:', error);
      return [];
    }
  }

  /**
   * Add a listener for model updates
   */
  addListener(listener: (models: ModelInfo[]) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (models: ModelInfo[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of model updates
   */
  private notifyListeners(models: ModelInfo[]): void {
    this.listeners.forEach(listener => {
      try {
        listener(models);
      } catch (error) {
        console.error('Error in model listener:', error);
      }
    });
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(async () => {
      await this.refreshModels();
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.listeners = [];
  }
}

// Export singleton instance
export const modelManager = new ModelManager(); 