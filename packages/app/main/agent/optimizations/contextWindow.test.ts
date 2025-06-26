/**
 * Tests for Context Window Optimization Module
 */

import {
  ContextWindowOptimizer,
  contextWindowOptimizer,
  optimizeForModel,
  ContextWindowConfig,
  OptimizedContext
} from './contextWindow';
import { ChatMessage } from '../types';
import { ContextChunk } from '../chat/promptBuilder';

// Helper function to create mock chat messages
function createMockMessage(
  id: string,
  role: 'user' | 'assistant',
  content: string,
  timestamp: number = Date.now()
): ChatMessage {
  return { id, role, content, timestamp };
}

// Helper function to create mock context chunks
function createMockContextChunk(
  filePath: string,
  content: string,
  relevanceScore?: number
): ContextChunk {
  return {
    filePath,
    content,
    relevanceScore
  };
}

describe('ContextWindowOptimizer', () => {
  let optimizer: ContextWindowOptimizer;

  beforeEach(() => {
    optimizer = new ContextWindowOptimizer();
  });

  describe('Sliding Window Strategy', () => {
    test('should keep all messages when under limit', () => {
      const messages = [
        createMockMessage('1', 'user', 'Hello'),
        createMockMessage('2', 'assistant', 'Hi there'),
        createMockMessage('3', 'user', 'How are you?')
      ];

      const result = optimizer.optimizeContext(messages);

      expect(result.messages).toHaveLength(3);
      expect(result.optimizationsApplied).not.toContain('sliding_window');
    });

    test('should apply sliding window when exceeding maxRecentMessages', () => {
      const messages = Array.from({ length: 10 }, (_, i) =>
        createMockMessage(
          `${i}`,
          i % 2 === 0 ? 'user' : 'assistant',
          `Message ${i}`,
          Date.now() + i * 1000
        )
      );

      const result = optimizer.optimizeContext(messages);

      expect(result.messages).toHaveLength(6); // Default maxRecentMessages
      expect(result.optimizationsApplied).toContain('sliding_window');
      
      // Should keep the most recent messages
      expect(result.messages[0].id).toBe('4');
      expect(result.messages[result.messages.length - 1].id).toBe('9');
    });

    test('should generate summary when sliding window is applied', () => {
      const messages = Array.from({ length: 8 }, (_, i) =>
        createMockMessage(
          `${i}`,
          i % 2 === 0 ? 'user' : 'assistant',
          i % 2 === 0 ? `User question ${i}` : `Assistant response ${i}`
        )
      );

      const result = optimizer.optimizeContext(messages);

      expect(result.summary).toBeDefined();
      expect(result.summary).toContain('CONVERSATION SUMMARY');
      expect(result.optimizationsApplied).toContain('summarization');
    });
  });

  describe('Path Compression Strategy', () => {
    test('should compress absolute paths to relative format', () => {
      const contextChunks = [
        createMockContextChunk(
          '/home/user/projects/myapp/src/components/Button.tsx',
          'export const Button = () => <button>Click me</button>;'
        ),
        createMockContextChunk(
          '/home/user/projects/myapp/packages/ui/index.ts',
          'export * from "./Button";'
        )
      ];

      const result = optimizer.optimizeContext([], contextChunks);

      expect(result.contextChunks[0].filePath).toBe('./src/components/Button.tsx');
      expect(result.contextChunks[1].filePath).toBe('./packages/ui/index.ts');
      expect(result.optimizationsApplied).toContain('path_compression');
    });

    test('should shorten very long paths', () => {
      const contextChunks = [
        createMockContextChunk(
          './very/long/nested/path/structure/components/Button.tsx',
          'content'
        )
      ];

      const result = optimizer.optimizeContext([], contextChunks);

      expect(result.contextChunks[0].filePath).toBe('./very/.../Button.tsx');
    });
  });

  describe('Context Deduplication Strategy', () => {
    test('should remove duplicate context chunks', () => {
      const contextChunks = [
        createMockContextChunk('./Button.tsx', 'const Button = () => <button>Click</button>;', 0.8),
        createMockContextChunk('./Button.tsx', 'const Button = () => <button>Click</button>;', 0.9),
        createMockContextChunk('./Input.tsx', 'const Input = () => <input />;', 0.7)
      ];

      const result = optimizer.optimizeContext([], contextChunks);

      expect(result.contextChunks).toHaveLength(2);
      expect(result.optimizationsApplied).toContain('deduplication');
      
      // Should keep the chunk with higher relevance score
      const buttonChunk = result.contextChunks.find(c => c.filePath.includes('Button'));
      expect(buttonChunk?.relevanceScore).toBe(0.9);
    });

    test('should handle chunks with no relevance score', () => {
      const contextChunks = [
        createMockContextChunk('./Button.tsx', 'content'),
        createMockContextChunk('./Button.tsx', 'content'),
        createMockContextChunk('./Input.tsx', 'different content')
      ];

      const result = optimizer.optimizeContext([], contextChunks);

      expect(result.contextChunks).toHaveLength(2);
    });
  });

  describe('Relevance Filtering', () => {
    test('should filter out low relevance chunks', () => {
      const config: Partial<ContextWindowConfig> = {
        minRelevanceScore: 0.5
      };
      const optimizer = new ContextWindowOptimizer(config);

      const contextChunks = [
        createMockContextChunk('./Button.tsx', 'content', 0.8),
        createMockContextChunk('./Input.tsx', 'content', 0.3),
        createMockContextChunk('./Form.tsx', 'content', 0.6)
      ];

      const result = optimizer.optimizeContext([], contextChunks);

      expect(result.contextChunks).toHaveLength(2);
      expect(result.contextChunks.every(c => (c.relevanceScore || 1) >= 0.5)).toBe(true);
    });
  });

  describe('Token Estimation', () => {
    test('should estimate tokens correctly', () => {
      const messages = [
        createMockMessage('1', 'user', 'Short message'),
        createMockMessage('2', 'assistant', 'A much longer message with more content to estimate tokens')
      ];

      const contextChunks = [
        createMockContextChunk('./test.ts', 'console.log("hello world");')
      ];

      const result = optimizer.optimizeContext(messages, contextChunks);

      expect(result.tokenEstimate).toBeGreaterThan(0);
      expect(typeof result.tokenEstimate).toBe('number');
    });
  });

  describe('Key Topic Extraction', () => {
    test('should extract technical topics from user messages', () => {
      const messages = [
        createMockMessage('1', 'user', 'How do I fix this React component error?'),
        createMockMessage('2', 'assistant', 'Response'),
        createMockMessage('3', 'user', 'Need help with TypeScript interface'),
        createMockMessage('4', 'assistant', 'Response'),
        createMockMessage('5', 'user', 'Database query optimization issue')
      ];

      // Use more messages to trigger summarization
      const manyMessages = Array.from({ length: 10 }, (_, i) => 
        createMockMessage(`${i}`, i % 2 === 0 ? 'user' : 'assistant', 
          i % 2 === 0 ? 'React component testing error' : 'Response')
      );

      const result = optimizer.optimizeContext(manyMessages);

      expect(result.summary).toBeDefined();
      if (result.summary) {
        expect(result.summary).toContain('react');
      }
    });
  });

  describe('Time Span Calculation', () => {
    test('should calculate time spans correctly', () => {
      const now = Date.now();
      const messages = [
        createMockMessage('1', 'user', 'Message 1', now),
        createMockMessage('2', 'assistant', 'Response 1', now + 30000), // 30 seconds later
        createMockMessage('3', 'user', 'Message 2', now + 120000), // 2 minutes later
      ];

      // Create enough messages to trigger summarization
      const manyMessages = Array.from({ length: 10 }, (_, i) =>
        createMockMessage(`${i}`, i % 2 === 0 ? 'user' : 'assistant', 
          `Message ${i}`, now + i * 60000) // 1 minute apart
      );

      const result = optimizer.optimizeContext(manyMessages);

      expect(result.summary).toBeDefined();
      if (result.summary) {
        expect(result.summary).toMatch(/\d+ minute/);
      }
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration correctly', () => {
      const newConfig: Partial<ContextWindowConfig> = {
        maxRecentMessages: 10,
        maxTokens: 8000,
        enableSummarization: false
      };

      optimizer.updateConfig(newConfig);
      const config = optimizer.getConfig();

      expect(config.maxRecentMessages).toBe(10);
      expect(config.maxTokens).toBe(8000);
      expect(config.enableSummarization).toBe(false);
    });

    test('should detect when optimization is needed', () => {
      const messages = Array.from({ length: 10 }, (_, i) =>
        createMockMessage(`${i}`, 'user', 'Message')
      );

      const needsOptimization = optimizer.needsOptimization(messages, []);
      expect(needsOptimization).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex optimization scenario', () => {
      const messages = Array.from({ length: 15 }, (_, i) =>
        createMockMessage(
          `${i}`,
          i % 2 === 0 ? 'user' : 'assistant',
          i % 2 === 0 
            ? `User question about React ${i} with error debugging` 
            : `Assistant response ${i} with code example`,
          Date.now() + i * 60000
        )
      );

      const contextChunks = [
        createMockContextChunk(
          '/home/user/projects/myapp/src/components/Button.tsx',
          'export const Button = () => <button>Click me</button>;',
          0.9
        ),
        createMockContextChunk(
          '/home/user/projects/myapp/src/components/Button.tsx',
          'export const Button = () => <button>Click me</button>;',
          0.8
        ),
        createMockContextChunk(
          '/home/user/projects/myapp/very/long/nested/path/Input.tsx',
          'export const Input = () => <input />;',
          0.1
        ),
        createMockContextChunk(
          '/home/user/projects/myapp/src/utils/helpers.ts',
          'export const formatDate = (date: Date) => date.toISOString();',
          0.7
        )
      ];

      const result = optimizer.optimizeContext(messages, contextChunks);

      // Should apply multiple optimizations
      expect(result.optimizationsApplied).toContain('sliding_window');
      expect(result.optimizationsApplied).toContain('summarization');
      expect(result.optimizationsApplied).toContain('path_compression');
      expect(result.optimizationsApplied).toContain('deduplication');

      // Should have recent messages only
      expect(result.messages).toHaveLength(6);

      // Should have summary
      expect(result.summary).toBeDefined();

      // Should have compressed paths
      expect(result.contextChunks.every(c => c.filePath.startsWith('./'))).toBe(true);

      // Should have deduplication applied
      expect(result.contextChunks.length).toBeLessThan(contextChunks.length);

      // Should have token estimate
      expect(result.tokenEstimate).toBeGreaterThan(0);
    });
  });
});

describe('Utility Functions', () => {
  test('optimizeForModel should work with custom token limits', () => {
    const messages = Array.from({ length: 10 }, (_, i) =>
      createMockMessage(`${i}`, 'user', 'Test message')
    );

    const contextChunks = [
      createMockContextChunk('./test.ts', 'test content')
    ];

    const result = optimizeForModel(messages, contextChunks, 2000);

    expect(result.tokenEstimate).toBeLessThanOrEqual(1600); // 80% of 2000
    expect(result.optimizationsApplied.length).toBeGreaterThan(0);
  });
});

describe('Singleton Instance', () => {
  test('should provide working singleton instance', () => {
    const messages = [
      createMockMessage('1', 'user', 'Test message')
    ];

    const result = contextWindowOptimizer.optimizeContext(messages);

    expect(result).toBeDefined();
    expect(result.messages).toHaveLength(1);
    expect(result.tokenEstimate).toBeGreaterThan(0);
  });
}); 