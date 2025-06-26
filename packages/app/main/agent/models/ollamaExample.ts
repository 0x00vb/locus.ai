/**
 * Ollama Model Detection Example
 * Demonstrates how to use the Ollama service for model detection and management
 */

import { ollamaService, OllamaUtils } from './ollamaService';
import { modelManager } from './modelManager';

/**
 * Example: Check if Ollama is running and available
 */
export async function exampleCheckOllamaAvailability() {
  console.log('🔍 Checking Ollama availability...');
  
  try {
    const isAvailable = await ollamaService.isAvailable();
    
    if (isAvailable) {
      console.log('✅ Ollama is running and accessible');
      return true;
    } else {
      console.log('❌ Ollama is not available');
      console.log('📝 Make sure Ollama is installed and running:');
      console.log('   curl -fsSL https://ollama.ai/install.sh | sh');
      console.log('   ollama run codellama:7b');
      return false;
    }
  } catch (error) {
    console.error('💥 Error checking Ollama:', error);
    return false;
  }
}

/**
 * Example: Fetch and display available models
 */
export async function exampleFetchModels() {
  console.log('📋 Fetching available Ollama models...');
  
  try {
    const models = await ollamaService.getAvailableModels();
    
    if (models.length === 0) {
      console.log('📝 No models found. Install some models:');
      console.log('   ollama pull codellama:7b');
      console.log('   ollama pull mistral:7b');
      console.log('   ollama pull llama2:7b');
      return [];
    }
    
    console.log(`🎯 Found ${models.length} model(s):`);
    console.log('');
    
    // Sort models for better display
    const sortedModels = OllamaUtils.sortModels(models);
    
    sortedModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.displayName}`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Size: ${OllamaUtils.formatSize(model.size)}`);
      if (model.family) {
        console.log(`   Family: ${model.family}`);
      }
      if (model.parameterSize) {
        console.log(`   Parameters: ${model.parameterSize}`);
      }
      console.log(`   Last Modified: ${new Date(model.lastModified).toLocaleDateString()}`);
      console.log('');
    });
    
    return sortedModels;
  } catch (error) {
    console.error('💥 Error fetching models:', error);
    return [];
  }
}

/**
 * Example: Get and display default model
 */
export async function exampleGetDefaultModel() {
  console.log('🎯 Finding default model...');
  
  try {
    const defaultModel = await ollamaService.getDefaultModel();
    
    if (defaultModel) {
      console.log('✅ Default model found:');
      console.log(`   Name: ${defaultModel.displayName}`);
      console.log(`   ID: ${defaultModel.id}`);
      console.log(`   Size: ${OllamaUtils.formatSize(defaultModel.size)}`);
      return defaultModel;
    } else {
      console.log('❌ No default model available');
      console.log('📝 Install a code-focused model:');
      console.log('   ollama pull codellama:7b');
      return null;
    }
  } catch (error) {
    console.error('💥 Error getting default model:', error);
    return null;
  }
}

/**
 * Example: Model Manager Integration
 */
export async function exampleModelManager() {
  console.log('🔧 Testing Model Manager integration...');
  
  try {
    // Initialize model manager
    console.log('📋 Initializing model manager...');
    const allModels = await modelManager.initialize();
    
    console.log(`🎯 Found ${allModels.length} total model(s) (Ollama + fallback):`);
    
    allModels.forEach((model, index) => {
      const status = model.available ? '✅' : '❌';
      const provider = model.provider.toUpperCase();
      console.log(`${index + 1}. ${status} [${provider}] ${model.displayName || model.name}`);
      if (model.description) {
        console.log(`    ${model.description}`);
      }
    });
    
    // Test getting default model
    console.log('');
    console.log('🎯 Getting best default model...');
    const defaultModel = await modelManager.getDefaultModel();
    
    if (defaultModel) {
      console.log(`✅ Best default: ${defaultModel.displayName} (${defaultModel.provider})`);
    } else {
      console.log('❌ No available models found');
    }
    
    // Test localStorage persistence
    console.log('');
    console.log('💾 Testing localStorage persistence...');
    
    if (defaultModel) {
      modelManager.setSelectedModelId(defaultModel.id);
      const saved = modelManager.getSelectedModelId();
      console.log(`✅ Saved model ID: ${saved}`);
    }
    
    return allModels;
  } catch (error) {
    console.error('💥 Error with model manager:', error);
    return [];
  }
}

/**
 * Example: Model status monitoring
 */
export async function exampleModelMonitoring() {
  console.log('📊 Setting up model monitoring...');
  
  // Add listener for model updates
  const handleModelUpdate = (models: any[]) => {
    console.log(`🔄 Models updated: ${models.length} available`);
    
    const ollamaModels = models.filter(m => m.provider === 'ollama');
    if (ollamaModels.length > 0) {
      console.log(`   Ollama models: ${ollamaModels.map(m => m.name).join(', ')}`);
    }
  };
  
  modelManager.addListener(handleModelUpdate);
  
  // Trigger initial refresh
  console.log('🔄 Triggering model refresh...');
  await modelManager.refreshModels();
  
  console.log('📊 Model monitoring active. Updates will be logged automatically.');
  
  // Clean up after 10 seconds for demo
  setTimeout(() => {
    modelManager.removeListener(handleModelUpdate);
    console.log('🛑 Model monitoring stopped');
  }, 10000);
}

/**
 * Run all examples
 */
export async function runOllamaExamples() {
  console.log('🚀 Running Ollama Model Detection Examples');
  console.log('='.repeat(50));
  console.log('');
  
  try {
    // Check availability
    const isAvailable = await exampleCheckOllamaAvailability();
    console.log('');
    
    if (!isAvailable) {
      console.log('❌ Ollama not available. Skipping remaining examples.');
      return;
    }
    
    // Fetch models
    await exampleFetchModels();
    console.log('─'.repeat(30));
    console.log('');
    
    // Get default model
    await exampleGetDefaultModel();
    console.log('');
    console.log('─'.repeat(30));
    console.log('');
    
    // Model manager integration
    await exampleModelManager();
    console.log('');
    console.log('─'.repeat(30));
    console.log('');
    
    // Model monitoring
    await exampleModelMonitoring();
    
    console.log('');
    console.log('✅ All Ollama examples completed!');
    
  } catch (error) {
    console.error('💥 Error running examples:', error);
  }
}

// Export convenience functions
export const OllamaExamples = {
  checkAvailability: exampleCheckOllamaAvailability,
  fetchModels: exampleFetchModels,
  getDefaultModel: exampleGetDefaultModel,
  modelManager: exampleModelManager,
  monitoring: exampleModelMonitoring,
  runAll: runOllamaExamples
}; 