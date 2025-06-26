/**
 * Example: Integrating Context Window Optimization
 * This file demonstrates how to use the context window optimizer with the chat agent
 */

import { contextWindowOptimizer, optimizeForModel, ContextWindowOptimizer } from './contextWindow';
import { ChatMessage } from '../types';
import { ContextChunk, buildPrompt, PromptMode } from '../chat/promptBuilder';

/**
 * Enhanced Chat Agent with Context Window Optimization
 */
export class OptimizedChatAgent {
  private optimizer: ContextWindowOptimizer;
  private maxModelTokens: number;

  constructor(maxModelTokens: number = 4000) {
    this.maxModelTokens = maxModelTokens;
    this.optimizer = new ContextWindowOptimizer({
      maxTokens: Math.floor(maxModelTokens * 0.8), // Use 80% of model limit
      maxRecentMessages: 6,
      enableSummarization: true,
      compressFilePaths: true,
      enableDeduplication: true,
      minRelevanceScore: 0.2
    });
  }

  /**
   * Send message with automatic context optimization
   */
  async sendOptimizedMessage(
    mode: PromptMode,
    userMessage: string,
    chatHistory: ChatMessage[],
    contextChunks: ContextChunk[] = []
  ): Promise<{ response: string; optimizationReport: string }> {
    
    // 1. Check if optimization is needed
    const needsOptimization = this.optimizer.needsOptimization(chatHistory, contextChunks);
    
    let optimizationReport = '';
    let finalHistory = chatHistory;
    let finalChunks = contextChunks;
    let summary: string | undefined;

    if (needsOptimization) {
      // 2. Apply optimizations
      const optimized = this.optimizer.optimizeContext(chatHistory, contextChunks);
      
      finalHistory = optimized.messages;
      finalChunks = optimized.contextChunks;
      summary = optimized.summary;
      
      optimizationReport = this.generateOptimizationReport(
        chatHistory,
        contextChunks,
        optimized
      );
    }

    // 3. Build prompt with optimized context
    const prompt = this.buildOptimizedPrompt(
      mode,
      userMessage,
      finalHistory,
      finalChunks,
      summary
    );

    // 4. Send to model (simulation)
    const response = await this.simulateModelResponse(prompt);

    return {
      response,
      optimizationReport: optimizationReport || 'No optimization needed'
    };
  }

  /**
   * Build prompt that includes conversation summary if available
   */
  private buildOptimizedPrompt(
    mode: PromptMode,
    userMessage: string,
    messages: ChatMessage[],
    contextChunks: ContextChunk[],
    summary?: string
  ): string {
    let prompt = '';

    // Add conversation summary if available
    if (summary) {
      prompt += `${summary}\n\n`;
    }

    // Add recent conversation context
    if (messages.length > 1) {
      prompt += '[RECENT CONVERSATION]\n';
      messages.slice(0, -1).forEach(msg => {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
      prompt += '[/RECENT CONVERSATION]\n\n';
    }

    // Use standard prompt builder for the current message
    const standardPrompt = buildPrompt(mode, userMessage, contextChunks);
    prompt += standardPrompt;

    return prompt;
  }

  /**
   * Generate a report of optimizations applied
   */
  private generateOptimizationReport(
    originalMessages: ChatMessage[],
    originalChunks: ContextChunk[],
    optimized: any
  ): string {
    const report = [];
    
    report.push('🚀 Context Window Optimization Applied');
    report.push('─'.repeat(40));
    
    // Messages optimization
    if (originalMessages.length > optimized.messages.length) {
      report.push(`📝 Messages: ${originalMessages.length} → ${optimized.messages.length}`);
      report.push(`   Older messages summarized: ${originalMessages.length - optimized.messages.length}`);
    }
    
    // Context chunks optimization
    if (originalChunks.length > optimized.contextChunks.length) {
      report.push(`📁 Context chunks: ${originalChunks.length} → ${optimized.contextChunks.length}`);
    }
    
    // Token estimate
    report.push(`🔢 Estimated tokens: ${optimized.tokenEstimate}`);
    
    // Optimizations applied
    if (optimized.optimizationsApplied.length > 0) {
      report.push(`⚡ Optimizations: ${optimized.optimizationsApplied.join(', ')}`);
    }
    
    return report.join('\n');
  }

  /**
   * Simulate model response for demonstration
   */
  private async simulateModelResponse(prompt: string): Promise<string> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return `I've received your optimized prompt (${prompt.length} characters). The context window optimization has been applied successfully, and I'm ready to help with your request.`;
  }

  /**
   * Update optimizer configuration
   */
  updateOptimizerConfig(config: any): void {
    this.optimizer.updateConfig(config);
  }

  /**
   * Get current optimizer status
   */
  getOptimizerStatus(): any {
    return {
      config: this.optimizer.getConfig(),
      maxModelTokens: this.maxModelTokens
    };
  }
}

/**
 * Example usage scenarios
 */
export const optimizationExamples = {
  
  /**
   * Example 1: Basic optimization for long conversation
   */
  async basicOptimization() {
    console.log('🔧 Example 1: Basic Context Optimization');
    
    // Create sample conversation history
    const messages: ChatMessage[] = Array.from({ length: 12 }, (_, i) => ({
      id: `msg_${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: i % 2 === 0 
        ? `User question ${i}: How do I implement feature X?`
        : `Assistant response ${i}: Here's how you can implement feature X...`,
      timestamp: Date.now() + i * 60000
    }));

    // Create sample context chunks
    const contextChunks: ContextChunk[] = [
      {
        filePath: '/home/user/projects/app/src/components/Button.tsx',
        content: 'export const Button = () => <button>Click me</button>;',
        relevanceScore: 0.9
      },
      {
        filePath: '/home/user/projects/app/src/utils/helpers.ts',
        content: 'export const formatDate = (date: Date) => date.toISOString();',
        relevanceScore: 0.3
      }
    ];

    // Apply optimization
    const optimized = contextWindowOptimizer.optimizeContext(messages, contextChunks);
    
    console.log('Original messages:', messages.length);
    console.log('Optimized messages:', optimized.messages.length);
    console.log('Summary generated:', !!optimized.summary);
    console.log('Optimizations applied:', optimized.optimizationsApplied);
    console.log('Token estimate:', optimized.tokenEstimate);
    
    return optimized;
  },

  /**
   * Example 2: Model-specific optimization
   */
  async modelSpecificOptimization() {
    console.log('🤖 Example 2: Model-Specific Optimization');
    
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Help me debug this React component', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'I can help you debug React components...', timestamp: Date.now() },
    ];

    const contextChunks: ContextChunk[] = [
      {
        filePath: './src/MyComponent.tsx',
        content: 'const MyComponent = () => { return <div>Hello</div>; };',
        relevanceScore: 0.8
      }
    ];

    // Optimize for different Ollama model limits
    const codeLlamaOptimized = optimizeForModel(messages, contextChunks, 4096);
    const llama3Optimized = optimizeForModel(messages, contextChunks, 8192);
    const mistralOptimized = optimizeForModel(messages, contextChunks, 8192);

    console.log('CodeLlama optimization:', codeLlamaOptimized.tokenEstimate, 'tokens');
    console.log('Llama3 optimization:', llama3Optimized.tokenEstimate, 'tokens');
    console.log('Mistral optimization:', mistralOptimized.tokenEstimate, 'tokens');

    return { codeLlamaOptimized, llama3Optimized, mistralOptimized };
  },

  /**
   * Example 3: Integration with chat agent
   */
  async integratedChatExample() {
    console.log('💬 Example 3: Integrated Chat Agent');
    
    const agent = new OptimizedChatAgent(4000);
    
    // Simulate a long conversation
    const chatHistory: ChatMessage[] = Array.from({ length: 15 }, (_, i) => ({
      id: `msg_${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: i % 2 === 0 
        ? `User: How do I fix this React error in component ${i}?`
        : `Assistant: Here's how to fix that React error...`,
      timestamp: Date.now() + i * 120000 // 2 minutes apart
    }));

    const contextChunks: ContextChunk[] = [
      {
        filePath: '/very/long/path/to/components/ErrorBoundary.tsx',
        content: 'class ErrorBoundary extends React.Component { /* implementation */ }',
        relevanceScore: 0.9
      },
      {
        filePath: '/very/long/path/to/utils/errorHandling.ts',
        content: 'export const handleError = (error: Error) => { console.error(error); };',
        relevanceScore: 0.7
      }
    ];

    // Send optimized message
    const result = await agent.sendOptimizedMessage(
      'agent',
      'I need help implementing error boundaries in my React app',
      chatHistory,
      contextChunks
    );

    console.log('Agent Response:', result.response);
    console.log('\nOptimization Report:');
    console.log(result.optimizationReport);

    return result;
  },

  /**
   * Example 4: Custom optimization configuration
   */
  async customConfigExample() {
    console.log('⚙️ Example 4: Custom Configuration');
    
    const customOptimizer = new ContextWindowOptimizer({
      maxRecentMessages: 10,
      maxTokens: 2000,
      enableSummarization: true,
      compressFilePaths: true,
      enableDeduplication: false, // Disable deduplication
      minRelevanceScore: 0.5 // Higher relevance threshold
    });

    const messages: ChatMessage[] = Array.from({ length: 8 }, (_, i) => ({
      id: `msg_${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i} with some content to analyze`,
      timestamp: Date.now() + i * 30000
    }));

    const contextChunks: ContextChunk[] = [
      { filePath: './high-relevance.ts', content: 'high relevance content', relevanceScore: 0.8 },
      { filePath: './low-relevance.ts', content: 'low relevance content', relevanceScore: 0.3 },
      { filePath: './medium-relevance.ts', content: 'medium relevance content', relevanceScore: 0.6 }
    ];

    const result = customOptimizer.optimizeContext(messages, contextChunks);
    
    console.log('Custom config applied:');
    console.log('- Deduplication disabled');
    console.log('- High relevance threshold (0.5)');
    console.log('- Max 2000 tokens');
    console.log('\nResults:');
    console.log('Context chunks after filtering:', result.contextChunks.length);
    console.log('Optimizations applied:', result.optimizationsApplied);
    
    return result;
  }
};

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running Context Window Optimization Examples\n');
  
  try {
    await optimizationExamples.basicOptimization();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await optimizationExamples.modelSpecificOptimization();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await optimizationExamples.integratedChatExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await optimizationExamples.customConfigExample();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for easy importing
export { contextWindowOptimizer, optimizeForModel } from './contextWindow'; 