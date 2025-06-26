/**
 * Context Window Optimization Module
 * Provides strategies to manage token usage and performance for chat interactions
 */

import { ChatMessage } from '../types';
import { ContextChunk } from '../chat/promptBuilder';

export interface ContextWindowConfig {
  /** Maximum number of recent messages to include in full */
  maxRecentMessages: number;
  /** Maximum number of tokens before triggering optimizations */
  maxTokens: number;
  /** Whether to enable summarization for older messages */
  enableSummarization: boolean;
  /** Whether to compress file paths */
  compressFilePaths: boolean;
  /** Whether to deduplicate context chunks */
  enableDeduplication: boolean;
  /** Minimum relevance score for context chunks */
  minRelevanceScore: number;
}

export interface OptimizedContext {
  messages: ChatMessage[];
  contextChunks: ContextChunk[];
  summary?: string;
  tokenEstimate: number;
  optimizationsApplied: string[];
}

export interface MessageSummary {
  periodStart: number;
  periodEnd: number;
  messageCount: number;
  summary: string;
  keyTopics: string[];
}

export class ContextWindowOptimizer {
  private config: ContextWindowConfig;

  constructor(config: Partial<ContextWindowConfig> = {}) {
    this.config = {
      maxRecentMessages: 6,
      maxTokens: 4000,
      enableSummarization: true,
      compressFilePaths: true,
      enableDeduplication: true,
      minRelevanceScore: 0.1,
      ...config
    };
  }

  /**
   * Main optimization function
   * Applies all configured optimization strategies
   */
  optimizeContext(
    messages: ChatMessage[],
    contextChunks: ContextChunk[] = []
  ): OptimizedContext {
    const optimizationsApplied: string[] = [];
    let optimizedMessages = [...messages];
    let optimizedChunks = [...contextChunks];
    let summary: string | undefined;

    // 1. Apply sliding message window
    const { messages: recentMessages, olderMessages } = this.applySlidingWindow(optimizedMessages);
    optimizedMessages = recentMessages;
    
    if (olderMessages.length > 0) {
      optimizationsApplied.push('sliding_window');
    }

    // 2. Generate summary for older messages if enabled
    if (this.config.enableSummarization && olderMessages.length > 0) {
      summary = this.summarizeOlderMessages(olderMessages);
      optimizationsApplied.push('summarization');
    }

    // 3. Compress file paths in context chunks if enabled
    if (this.config.compressFilePaths) {
      optimizedChunks = this.compressContextPaths(optimizedChunks);
      optimizationsApplied.push('path_compression');
    }

    // 4. Deduplicate context chunks if enabled
    if (this.config.enableDeduplication) {
      const originalLength = optimizedChunks.length;
      optimizedChunks = this.deduplicateContext(optimizedChunks);
      if (optimizedChunks.length < originalLength) {
        optimizationsApplied.push('deduplication');
      }
    }

    // 5. Filter by relevance score
    optimizedChunks = this.filterByRelevance(optimizedChunks);

    // 6. Calculate token estimate
    const tokenEstimate = this.estimateTokens(optimizedMessages, optimizedChunks, summary);

    return {
      messages: optimizedMessages,
      contextChunks: optimizedChunks,
      summary,
      tokenEstimate,
      optimizationsApplied
    };
  }

  /**
   * Apply sliding window to keep only recent messages
   */
  private applySlidingWindow(messages: ChatMessage[]): {
    messages: ChatMessage[];
    olderMessages: ChatMessage[];
  } {
    if (messages.length <= this.config.maxRecentMessages) {
      return { messages, olderMessages: [] };
    }

    const recentMessages = messages.slice(-this.config.maxRecentMessages);
    const olderMessages = messages.slice(0, -this.config.maxRecentMessages);

    return { messages: recentMessages, olderMessages };
  }

  /**
   * Summarize older messages to preserve context while reducing tokens
   */
  private summarizeOlderMessages(olderMessages: ChatMessage[]): string {
    if (olderMessages.length === 0) {
      return '';
    }

    // Group messages by conversation flow
    const conversationSummary = this.generateConversationSummary(olderMessages);
    
    return `[CONVERSATION SUMMARY]
Previous discussion covered ${olderMessages.length} messages over ${this.getTimeSpan(olderMessages)}.

Key topics:
${conversationSummary.keyTopics.map(topic => `• ${topic}`).join('\n')}

Summary: ${conversationSummary.summary}
[/CONVERSATION SUMMARY]`;
  }

  /**
   * Generate a structured summary of conversation messages
   */
  private generateConversationSummary(messages: ChatMessage[]): MessageSummary {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    // Extract key topics from user messages
    const keyTopics = this.extractKeyTopics(userMessages);

    // Generate summary based on message patterns
    const summary = this.generateSummaryText(userMessages, assistantMessages);

    return {
      periodStart: messages[0]?.timestamp || 0,
      periodEnd: messages[messages.length - 1]?.timestamp || 0,
      messageCount: messages.length,
      summary,
      keyTopics
    };
  }

  /**
   * Extract key topics from user messages
   */
  private extractKeyTopics(userMessages: ChatMessage[]): string[] {
    const topics = new Set<string>();
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // Look for technical terms and patterns
      const patterns = [
        /\b(react|vue|angular|component|hook|state)\b/g,
        /\b(typescript|javascript|jsx|tsx|css|html)\b/g,
        /\b(api|endpoint|fetch|axios|request)\b/g,
        /\b(database|db|sql|query|model)\b/g,
        /\b(test|testing|jest|cypress|unit)\b/g,
        /\b(error|bug|fix|debug|issue)\b/g,
        /\b(performance|optimization|speed|memory)\b/g,
        /\b(refactor|clean|organize|structure)\b/g
      ];

      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => topics.add(match));
        }
      });

      // Look for file extensions and paths
      const filePattern = /\.(ts|tsx|js|jsx|css|html|json|md)(\b|$)/g;
      const fileMatches = content.match(filePattern);
      if (fileMatches) {
        topics.add('file operations');
      }
    });

    return Array.from(topics).slice(0, 8); // Limit to top 8 topics
  }

  /**
   * Generate summary text based on message analysis
   */
  private generateSummaryText(userMessages: ChatMessage[], assistantMessages: ChatMessage[]): string {
    const userQuestions = userMessages.length;
    const aiResponses = assistantMessages.length;
    
    if (userQuestions === 0) {
      return 'No user interactions in this period.';
    }

    let summary = `User asked ${userQuestions} question${userQuestions > 1 ? 's' : ''}`;
    
    if (aiResponses > 0) {
      summary += ` and received ${aiResponses} response${aiResponses > 1 ? 's' : ''}`;
    }

    // Analyze conversation type
    const lastUserMessage = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
    
    if (lastUserMessage.includes('error') || lastUserMessage.includes('bug')) {
      summary += ' about debugging and error resolution';
    } else if (lastUserMessage.includes('implement') || lastUserMessage.includes('create')) {
      summary += ' about implementing new features';
    } else if (lastUserMessage.includes('refactor') || lastUserMessage.includes('improve')) {
      summary += ' about code improvements and refactoring';
    } else {
      summary += ' about development tasks';
    }

    return summary + '.';
  }

  /**
   * Get time span of messages in human-readable format
   */
  private getTimeSpan(messages: ChatMessage[]): string {
    if (messages.length < 2) {
      return 'single message';
    }

    const start = messages[0].timestamp;
    const end = messages[messages.length - 1].timestamp;
    const diffMinutes = Math.floor((end - start) / (1000 * 60));

    if (diffMinutes < 1) {
      return 'less than a minute';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  /**
   * Compress file paths to relative format
   */
  private compressContextPaths(contextChunks: ContextChunk[]): ContextChunk[] {
    return contextChunks.map(chunk => ({
      ...chunk,
      filePath: this.compressFilePath(chunk.filePath)
    }));
  }

  /**
   * Compress a single file path
   */
  private compressFilePath(filePath: string): string {
    // Remove absolute path prefixes and use relative format
    const path = filePath
      .replace(/^.*\/projects\/[^\/]+\//, './')  // Remove project root
      .replace(/^.*\/src\//, './src/')           // Keep src relative
      .replace(/^.*\/packages\//, './packages/') // Keep packages relative
      .replace(/^\/+/, './');                    // Convert leading slashes

    // Shorten very long paths
    const segments = path.split('/');
    if (segments.length > 4) {
      return `${segments[0]}/${segments[1]}/.../${segments[segments.length - 1]}`;
    }

    return path;
  }

  /**
   * Remove duplicate context chunks based on content similarity
   */
  private deduplicateContext(contextChunks: ContextChunk[]): ContextChunk[] {
    const seen = new Map<string, ContextChunk>();
    const result: ContextChunk[] = [];

    for (const chunk of contextChunks) {
      const key = this.generateContentHash(chunk);
      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, chunk);
        result.push(chunk);
      } else {
        // Keep the chunk with higher relevance score
        if ((chunk.relevanceScore || 0) > (existing.relevanceScore || 0)) {
          const index = result.indexOf(existing);
          if (index !== -1) {
            result[index] = chunk;
            seen.set(key, chunk);
          }
        }
      }
    }

    return result;
  }

  /**
   * Generate a simple hash for content deduplication
   */
  private generateContentHash(chunk: ContextChunk): string {
    // Create a hash based on file path and content similarity
    const normalizedContent = chunk.content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200); // Use first 200 chars for comparison

    return `${chunk.filePath}:${normalizedContent}`;
  }

  /**
   * Filter context chunks by relevance score
   */
  private filterByRelevance(contextChunks: ContextChunk[]): ContextChunk[] {
    return contextChunks.filter(chunk => 
      (chunk.relevanceScore || 1) >= this.config.minRelevanceScore
    );
  }

  /**
   * Estimate token count for the optimized context
   */
  private estimateTokens(
    messages: ChatMessage[],
    contextChunks: ContextChunk[],
    summary?: string
  ): number {
    let tokens = 0;

    // Estimate tokens for messages (rough: 1 token per 4 characters)
    messages.forEach(message => {
      tokens += Math.ceil(message.content.length / 4);
    });

    // Estimate tokens for context chunks
    contextChunks.forEach(chunk => {
      tokens += Math.ceil(chunk.content.length / 4);
      tokens += Math.ceil(chunk.filePath.length / 4);
    });

    // Estimate tokens for summary
    if (summary) {
      tokens += Math.ceil(summary.length / 4);
    }

    return tokens;
  }

  /**
   * Update optimizer configuration
   */
  updateConfig(newConfig: Partial<ContextWindowConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ContextWindowConfig {
    return { ...this.config };
  }

  /**
   * Check if context optimization is needed
   */
  needsOptimization(messages: ChatMessage[], contextChunks: ContextChunk[]): boolean {
    const tokenEstimate = this.estimateTokens(messages, contextChunks);
    return tokenEstimate > this.config.maxTokens || messages.length > this.config.maxRecentMessages;
  }
}

// Export singleton instance with default configuration
export const contextWindowOptimizer = new ContextWindowOptimizer();

// Export utility functions
export function optimizeForModel(
  messages: ChatMessage[],
  contextChunks: ContextChunk[],
  modelTokenLimit: number
): OptimizedContext {
  const optimizer = new ContextWindowOptimizer({
    maxTokens: Math.floor(modelTokenLimit * 0.8), // Use 80% of limit for safety
    maxRecentMessages: 6,
    enableSummarization: true,
    compressFilePaths: true,
    enableDeduplication: true
  });

  return optimizer.optimizeContext(messages, contextChunks);
} 