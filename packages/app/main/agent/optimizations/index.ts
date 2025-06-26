/**
 * Agent Optimizations Module
 * 
 * This module provides performance and token optimization strategies for the AI agent system.
 * 
 * Key Features:
 * - Context Window Management: Sliding window for recent messages
 * - Summarization: Automatic summarization of older messages
 * - Path Compression: Shorten file paths to save tokens
 * - Deduplication: Remove duplicate context chunks
 * - Token Estimation: Estimate and manage token usage
 * 
 * @example
 * ```typescript
 * import { contextWindowOptimizer, optimizeForModel } from './optimizations';
 * 
 * // Basic optimization
 * const optimized = contextWindowOptimizer.optimizeContext(messages, contextChunks);
 * 
 * // Model-specific optimization
 * const result = optimizeForModel(messages, contextChunks, 4000);
 * ```
 */

// Core optimization classes and functions
export {
  ContextWindowOptimizer,
  contextWindowOptimizer,
  optimizeForModel,
  type ContextWindowConfig,
  type OptimizedContext,
  type MessageSummary
} from './contextWindow';

// Enhanced chat agent with optimization
export {
  OptimizedChatAgent,
  optimizationExamples,
  runAllExamples
} from './example';

// Re-export commonly used types for convenience
export type { ChatMessage } from '../types';
export type { ContextChunk, PromptMode } from '../chat/promptBuilder';

// Import types for internal use
import { 
  ContextWindowOptimizer, 
  ContextWindowConfig, 
  OptimizedContext 
} from './contextWindow';

/**
 * Default optimization strategies for different scenarios
 */
export const OptimizationPresets = {
  /**
   * Conservative preset - minimal optimization
   */
  conservative: {
    maxRecentMessages: 10,
    maxTokens: 6000,
    enableSummarization: false,
    compressFilePaths: true,
    enableDeduplication: true,
    minRelevanceScore: 0.1
  },

  /**
   * Balanced preset - moderate optimization
   */
  balanced: {
    maxRecentMessages: 6,
    maxTokens: 4000,
    enableSummarization: true,
    compressFilePaths: true,
    enableDeduplication: true,
    minRelevanceScore: 0.2
  },

  /**
   * Aggressive preset - maximum optimization
   */
  aggressive: {
    maxRecentMessages: 4,
    maxTokens: 2000,
    enableSummarization: true,
    compressFilePaths: true,
    enableDeduplication: true,
    minRelevanceScore: 0.5
  },

  /**
   * Large context preset - for models with large context windows
   */
  largeContext: {
    maxRecentMessages: 20,
    maxTokens: 16000,
    enableSummarization: true,
    compressFilePaths: false,
    enableDeduplication: true,
    minRelevanceScore: 0.1
  }
};

/**
 * Model-specific token limits for Ollama models
 */
export const ModelTokenLimits = {
  'codellama:7b': 4096,
  'codellama:13b': 4096,
  'codellama:34b': 4096,
  'llama3:8b': 8192,
  'llama3:70b': 8192,
  'mistral:7b': 8192,
  'mistral:latest': 8192,
  'llama2:7b': 4096,
  'llama2:13b': 4096,
  'llama2:70b': 4096,
  'qwen:7b': 8192,
  'phi3:latest': 4096
};

/**
 * Create an optimizer with a preset configuration
 */
export function createOptimizerWithPreset(preset: keyof typeof OptimizationPresets): ContextWindowOptimizer {
  return new ContextWindowOptimizer(OptimizationPresets[preset]);
}

/**
 * Get recommended optimization settings for a specific model
 */
export function getModelOptimizationConfig(modelId: string): ContextWindowConfig {
  const tokenLimit = ModelTokenLimits[modelId as keyof typeof ModelTokenLimits] || 4000;
  
  if (tokenLimit >= 32000) {
    return OptimizationPresets.largeContext;
  } else if (tokenLimit >= 8000) {
    return OptimizationPresets.conservative;
  } else if (tokenLimit >= 4000) {
    return OptimizationPresets.balanced;
  } else {
    return OptimizationPresets.aggressive;
  }
}

/**
 * Quick optimization utility for common use cases
 */
export const QuickOptimize = {
  /**
   * Optimize for chat mode with reasonable defaults
   */
  forChat: (messages: any[], contextChunks: any[] = []) => {
    // Import using ES modules
    import('./contextWindow').then(({ contextWindowOptimizer }) => {
      return contextWindowOptimizer.optimizeContext(messages, contextChunks);
    });
  },

  /**
   * Optimize specifically for code generation tasks
   */
  forCodeGeneration: (messages: any[], contextChunks: any[] = []) => {
    const optimizer = createOptimizerWithPreset('balanced');
    optimizer.updateConfig({
      minRelevanceScore: 0.3, // Higher relevance for code context
      compressFilePaths: true,
      enableDeduplication: true
    });
    return optimizer.optimizeContext(messages, contextChunks);
  },

  /**
   * Optimize for debugging tasks
   */
  forDebugging: (messages: any[], contextChunks: any[] = []) => {
    const optimizer = createOptimizerWithPreset('conservative');
    optimizer.updateConfig({
      maxRecentMessages: 8, // Keep more recent messages for debugging context
      minRelevanceScore: 0.2
    });
    return optimizer.optimizeContext(messages, contextChunks);
  },

  /**
   * Optimize for documentation tasks
   */
  forDocumentation: (messages: any[], contextChunks: any[] = []) => {
    const optimizer = createOptimizerWithPreset('balanced');
    optimizer.updateConfig({
      compressFilePaths: false, // Keep full paths for documentation
      minRelevanceScore: 0.1 // Include more context for comprehensive docs
    });
    return optimizer.optimizeContext(messages, contextChunks);
  }
};

/**
 * Performance monitoring utilities
 */
export const OptimizationMetrics = {
  /**
   * Calculate optimization efficiency
   */
  calculateEfficiency(original: { messages: any[], contextChunks: any[] }, optimized: OptimizedContext): {
    messageReduction: number;
    contextReduction: number;
    tokenReduction: number;
    totalReduction: number;
  } {
    const originalMessageTokens = original.messages.reduce((sum: number, msg: any) => sum + Math.ceil(msg.content.length / 4), 0);
    const originalContextTokens = original.contextChunks.reduce((sum: number, chunk: any) => sum + Math.ceil(chunk.content.length / 4), 0);
    const originalTotalTokens = originalMessageTokens + originalContextTokens;

    const messageReduction = ((original.messages.length - optimized.messages.length) / original.messages.length) * 100;
    const contextReduction = ((original.contextChunks.length - optimized.contextChunks.length) / original.contextChunks.length) * 100;
    const tokenReduction = ((originalTotalTokens - optimized.tokenEstimate) / originalTotalTokens) * 100;
    const totalReduction = tokenReduction;

    return {
      messageReduction: Math.max(0, messageReduction),
      contextReduction: Math.max(0, contextReduction),
      tokenReduction: Math.max(0, tokenReduction),
      totalReduction: Math.max(0, totalReduction)
    };
  },

  /**
   * Generate a performance report
   */
  generateReport(original: { messages: any[], contextChunks: any[] }, optimized: OptimizedContext): string {
    const efficiency = this.calculateEfficiency(original, optimized);
    
    return `
Context Window Optimization Report
${'='.repeat(35)}

Input:
  Messages: ${original.messages.length}
  Context Chunks: ${original.contextChunks.length}

Output:
  Messages: ${optimized.messages.length}
  Context Chunks: ${optimized.contextChunks.length}
  Estimated Tokens: ${optimized.tokenEstimate}

Efficiency:
  Message Reduction: ${efficiency.messageReduction.toFixed(1)}%
  Context Reduction: ${efficiency.contextReduction.toFixed(1)}%
  Token Reduction: ${efficiency.tokenReduction.toFixed(1)}%

Optimizations Applied:
  ${optimized.optimizationsApplied.map((opt: string) => `• ${opt}`).join('\n  ')}

${optimized.summary ? 'Summary Generated: Yes' : 'Summary Generated: No'}
    `.trim();
  }
};

/**
 * Development utilities for testing and debugging
 */
export const DevUtils = {
  /**
   * Create mock data for testing
   */
  createMockData: (messageCount: number = 10, contextCount: number = 5) => {
    const messages = Array.from({ length: messageCount }, (_, i) => ({
      id: `msg_${i}`,
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Mock message ${i} with some content to test optimization`,
      timestamp: Date.now() + i * 60000
    }));

    const contextChunks = Array.from({ length: contextCount }, (_, i) => ({
      filePath: `/mock/path/to/file${i}.ts`,
      content: `Mock content for file ${i}`,
      relevanceScore: Math.random()
    }));

    return { messages, contextChunks };
  },

  /**
   * Test all optimization strategies
   */
  testAllStrategies: () => {
    const { messages, contextChunks } = DevUtils.createMockData(15, 8);
    
    console.log('Testing optimization strategies...\n');
    
    Object.entries(OptimizationPresets).forEach(([name, config]) => {
      const optimizer = new ContextWindowOptimizer(config);
      const result = optimizer.optimizeContext(messages, contextChunks);
      
      console.log(`${name.toUpperCase()} Strategy:`);
      console.log(`  Messages: ${messages.length} → ${result.messages.length}`);
      console.log(`  Context: ${contextChunks.length} → ${result.contextChunks.length}`);
      console.log(`  Tokens: ${result.tokenEstimate}`);
      console.log(`  Optimizations: ${result.optimizationsApplied.join(', ')}`);
      console.log('');
    });
  }
}; 