# Model Adapter System

A modular adapter system for interfacing with local and cloud LLMs in the Notty application.

## Overview

The model adapter provides a unified interface for querying different LLM providers through a single `queryModel` function. It automatically routes requests to the appropriate adapter based on the model ID.

## Usage

```typescript
import { queryModel } from './agent/models';

// Query Ollama (local)
const ollamaResponse = await queryModel('ollama:codellama:7b', 'Write a Python function');

// Query OpenAI (cloud)
const openaiResponse = await queryModel('gpt-3.5-turbo', 'Explain JavaScript closures');
```

## Supported Providers

### Ollama (Local)
- **Model ID Format**: `ollama:model-name`
- **Examples**: `ollama:codellama:7b`, `ollama:mistral:7b`, `ollama:llama2:13b`
- **Requirements**: Ollama running on `localhost:11434`
- **Configuration**: No API key required

### OpenAI (Cloud)
- **Model ID Format**: Standard OpenAI model names
- **Examples**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`
- **Requirements**: Valid OpenAI API key
- **Configuration**: Set `OPENAI_API_KEY` environment variable or store in localStorage as `openai_api_key`

## API Reference

### `queryModel(modelId: string, prompt: string): Promise<string>`

Main function that routes requests to appropriate adapters.

**Parameters:**
- `modelId`: The model identifier (determines which adapter to use)
- `prompt`: The prompt/question to send to the model

**Returns:**
- `Promise<string>`: Clean, plain-text response from the model

**Throws:**
- `Error`: If modelId or prompt is missing
- `Error`: If the specific adapter fails (network, API key, etc.)

### Individual Adapters

#### `queryOllamaModel(modelName: string, prompt: string): Promise<string>`
Direct interface to Ollama API.

#### `queryOpenAIModel(modelId: string, prompt: string): Promise<string>`
Direct interface to OpenAI API.

## File Structure

```
/agent/models/
├── index.ts           # Main exports
├── modelAdapter.ts    # Main routing logic
├── ollamaAdapter.ts   # Ollama API interface
├── openaiAdapter.ts   # OpenAI API interface
├── types.ts          # Common types and interfaces
├── example.ts        # Usage examples
└── README.md         # This documentation
```

## Error Handling

The adapter system provides comprehensive error handling:

- **Connection errors**: Clear messages when services are unavailable
- **Authentication errors**: Helpful messages about missing API keys
- **API errors**: Detailed error messages from provider APIs
- **Validation errors**: Input validation for required parameters

## Examples

See `example.ts` for comprehensive usage examples including:
- Basic Ollama queries
- OpenAI API calls
- Error handling patterns
- Multiple model comparisons

## Configuration

### Ollama Setup
1. Install Ollama from https://ollama.ai
2. Pull desired models: `ollama pull codellama:7b`
3. Ensure Ollama is running: `ollama serve`

### OpenAI Setup
1. Get API key from https://platform.openai.com
2. Set environment variable: `export OPENAI_API_KEY=your-key-here`
3. Or store in localStorage: `localStorage.setItem('openai_api_key', 'your-key')`

## Extending the System

To add new providers:

1. Create a new adapter file (e.g., `anthropicAdapter.ts`)
2. Implement the provider-specific logic
3. Update `modelAdapter.ts` to route to your new adapter
4. Export the new adapter in `index.ts`
5. Update this README with usage instructions 