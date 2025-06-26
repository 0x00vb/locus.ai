# Context Window Optimization Module

This module provides sophisticated token optimization strategies for the AI agent system, helping to manage context window limitations while preserving conversation quality and relevant information.

## 🚀 Features

### Core Optimization Strategies

1. **Sliding Message Window**: Keep only the most recent N messages in full detail
2. **Summarization Fallback**: Automatically summarize older messages to preserve context
3. **Metadata Compression**: Shorten file paths to save tokens (`/very/long/path.tsx` → `./very/.../path.tsx`)
4. **Context Deduplication**: Remove duplicate code chunks based on content similarity
5. **Relevance Filtering**: Filter context chunks by relevance score threshold
6. **Token Estimation**: Accurate token counting for optimization decisions

## 📦 Installation & Usage

### Basic Usage

```typescript
import { contextWindowOptimizer, optimizeForModel } from './optimizations';

// Basic optimization with default settings
const optimized = contextWindowOptimizer.optimizeContext(messages, contextChunks);

// Model-specific optimization
const result = optimizeForModel(messages, contextChunks, 4000);
```

### Advanced Usage

```typescript
import { 
  ContextWindowOptimizer, 
  OptimizationPresets, 
  QuickOptimize 
} from './optimizations';

// Custom configuration
const optimizer = new ContextWindowOptimizer({
  maxRecentMessages: 8,
  maxTokens: 4000,
  enableSummarization: true,
  compressFilePaths: true,
  enableDeduplication: true,
  minRelevanceScore: 0.3
});

// Task-specific optimization
const chatOptimized = QuickOptimize.forChat(messages, contextChunks);
const codeOptimized = QuickOptimize.forCodeGeneration(messages, contextChunks);
const debugOptimized = QuickOptimize.forDebugging(messages, contextChunks);
```

## 🛠️ Configuration Options

### ContextWindowConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRecentMessages` | `number` | `6` | Maximum number of recent messages to include in full |
| `maxTokens` | `number` | `4000` | Maximum token limit before triggering optimizations |
| `enableSummarization` | `boolean` | `true` | Whether to summarize older messages |
| `compressFilePaths` | `boolean` | `true` | Whether to compress file paths |
| `enableDeduplication` | `boolean` | `true` | Whether to remove duplicate context chunks |
| `minRelevanceScore` | `number` | `0.1` | Minimum relevance score for context chunks |

### Optimization Presets

#### Conservative (Minimal Optimization)
```typescript
{
  maxRecentMessages: 10,
  maxTokens: 6000,
  enableSummarization: false,
  compressFilePaths: true,
  enableDeduplication: true,
  minRelevanceScore: 0.1
}
```

#### Balanced (Moderate Optimization)
```typescript
{
  maxRecentMessages: 6,
  maxTokens: 4000,
  enableSummarization: true,
  compressFilePaths: true,
  enableDeduplication: true,
  minRelevanceScore: 0.2
}
```

#### Aggressive (Maximum Optimization)
```typescript
{
  maxRecentMessages: 4,
  maxTokens: 2000,
  enableSummarization: true,
  compressFilePaths: true,
  enableDeduplication: true,
  minRelevanceScore: 0.5
}
```

#### Large Context (For Large Models)
```typescript
{
  maxRecentMessages: 20,
  maxTokens: 16000,
  enableSummarization: true,
  compressFilePaths: false,
  enableDeduplication: true,
  minRelevanceScore: 0.1
}
```

## 📊 Performance Monitoring

### Optimization Metrics

```typescript
import { OptimizationMetrics } from './optimizations';

const original = { messages, contextChunks };
const optimized = optimizer.optimizeContext(messages, contextChunks);

// Calculate efficiency
const efficiency = OptimizationMetrics.calculateEfficiency(original, optimized);
console.log(`Token reduction: ${efficiency.tokenReduction.toFixed(1)}%`);

// Generate detailed report
const report = OptimizationMetrics.generateReport(original, optimized);
console.log(report);
```

### Example Report Output

```
Context Window Optimization Report
===================================

Input:
  Messages: 15
  Context Chunks: 8

Output:
  Messages: 6
  Context Chunks: 5
  Estimated Tokens: 1,250

Efficiency:
  Message Reduction: 60.0%
  Context Reduction: 37.5%
  Token Reduction: 45.2%

Optimizations Applied:
  • sliding_window
  • summarization
  • path_compression
  • deduplication

Summary Generated: Yes
```

## 🔧 Integration Examples

### With Chat Agent

```typescript
import { OptimizedChatAgent } from './optimizations';

const agent = new OptimizedChatAgent(4000); // 4000 token limit

const result = await agent.sendOptimizedMessage(
  'agent',
  'Help me debug this React component',
  chatHistory,
  contextChunks
);

console.log('Response:', result.response);
console.log('Optimization Report:', result.optimizationReport);
```

### Model-Specific Optimization

```typescript
import { getModelOptimizationConfig, ModelTokenLimits } from './optimizations';

// Get recommended config for a specific model
const config = getModelOptimizationConfig('gpt-4');
const optimizer = new ContextWindowOptimizer(config);

// Or optimize directly for a model
const optimized = optimizeForModel(messages, contextChunks, ModelTokenLimits['gpt-4']);
```

### Task-Specific Quick Optimization

```typescript
import { QuickOptimize } from './optimizations';

// For different types of tasks
const chatResult = QuickOptimize.forChat(messages, contextChunks);
const codeResult = QuickOptimize.forCodeGeneration(messages, contextChunks);
const debugResult = QuickOptimize.forDebugging(messages, contextChunks);
const docsResult = QuickOptimize.forDocumentation(messages, contextChunks);
```

## 🧪 Testing & Development

### Running Examples

```typescript
import { runAllExamples, optimizationExamples } from './optimizations';

// Run all optimization examples
await runAllExamples();

// Run specific examples
await optimizationExamples.basicOptimization();
await optimizationExamples.modelSpecificOptimization();
await optimizationExamples.integratedChatExample();
await optimizationExamples.customConfigExample();
```

### Development Utilities

```typescript
import { DevUtils } from './optimizations';

// Create mock data for testing
const { messages, contextChunks } = DevUtils.createMockData(15, 8);

// Test all optimization strategies
DevUtils.testAllStrategies();
```

## 🔍 How It Works

### 1. Sliding Window Strategy

The optimizer maintains a sliding window of recent messages while older messages are either summarized or discarded:

```
Original: [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8]
Window=4: [msg5, msg6, msg7, msg8] + summary_of_[msg1-msg4]
```

### 2. Summarization Process

Older messages are analyzed and summarized to preserve context:

```
[CONVERSATION SUMMARY]
Previous discussion covered 8 messages over 15 minutes.

Key topics:
• react
• typescript
• error
• debugging

Summary: User asked 4 questions and received 4 responses about React component debugging.
[/CONVERSATION SUMMARY]
```

### 3. Path Compression

File paths are compressed to save tokens while maintaining readability:

```
Before: /home/user/projects/myapp/src/components/Button.tsx
After:  ./src/components/Button.tsx

Before: /very/long/nested/path/structure/deep/Component.tsx
After:  ./very/.../Component.tsx
```

### 4. Content Deduplication

Duplicate context chunks are identified and merged, keeping the highest relevance score:

```
Chunk A: ./Button.tsx (relevance: 0.8)
Chunk B: ./Button.tsx (relevance: 0.9) ← kept
Result: Only Chunk B is retained
```

### 5. Token Estimation

The module uses a simple but effective token estimation algorithm:
- Approximately 1 token per 4 characters
- Includes content, file paths, and metadata
- Provides estimates for optimization decisions

## 🚨 Best Practices

### 1. Choose Appropriate Presets

- **Conservative**: For debugging sessions where context is critical
- **Balanced**: For general coding assistance
- **Aggressive**: For simple Q&A or when tokens are severely limited
- **Large Context**: For models like Claude with large context windows

### 2. Monitor Optimization Impact

```typescript
// Check if optimization is actually needed
const needsOptimization = optimizer.needsOptimization(messages, contextChunks);

if (needsOptimization) {
  const optimized = optimizer.optimizeContext(messages, contextChunks);
  console.log('Optimizations applied:', optimized.optimizationsApplied);
}
```

### 3. Adjust Based on Task Type

Different tasks benefit from different optimization strategies:

- **Code Generation**: Higher relevance threshold, path compression
- **Debugging**: More message history, lower relevance threshold
- **Documentation**: Full paths, comprehensive context
- **Chat**: Balanced optimization with summarization

### 4. Regular Configuration Updates

```typescript
// Update configuration based on model performance
agent.updateOptimizerConfig({
  maxTokens: newModelLimit,
  minRelevanceScore: optimalThreshold
});
```

## 🎯 Performance Tips

1. **Enable Deduplication**: Especially useful when RAG systems might return similar chunks
2. **Use Summarization**: Preserves conversation flow while reducing tokens
3. **Adjust Relevance Thresholds**: Higher thresholds for focused tasks, lower for comprehensive analysis
4. **Monitor Token Usage**: Use `tokenEstimate` to track optimization effectiveness
5. **Choose Model-Appropriate Settings**: Leverage `getModelOptimizationConfig()` for optimal settings

## 🤝 Contributing

When extending the optimization module:

1. Add new optimization strategies to the `ContextWindowOptimizer` class
2. Include corresponding tests in `contextWindow.test.ts`
3. Add usage examples to `example.ts`
4. Update presets and documentation as needed
5. Consider performance impact and token efficiency

## 📝 API Reference

### Classes

- **`ContextWindowOptimizer`**: Main optimization class
- **`OptimizedChatAgent`**: Enhanced chat agent with optimization

### Functions

- **`optimizeForModel()`**: Quick optimization for specific model limits
- **`createOptimizerWithPreset()`**: Create optimizer with preset configuration
- **`getModelOptimizationConfig()`**: Get recommended config for a model

### Types

- **`ContextWindowConfig`**: Configuration interface
- **`OptimizedContext`**: Optimization result interface
- **`MessageSummary`**: Message summarization interface

### Constants

- **`OptimizationPresets`**: Predefined optimization strategies
- **`ModelTokenLimits`**: Token limits for common models
- **`QuickOptimize`**: Task-specific optimization utilities
- **`OptimizationMetrics`**: Performance monitoring utilities
- **`DevUtils`**: Development and testing utilities 