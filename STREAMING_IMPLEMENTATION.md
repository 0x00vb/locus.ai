# Chat Response Streaming Implementation

This document describes the streaming functionality that has been added to the Notty chat system for real-time AI responses.

## Overview

The chat system now supports **response streaming** for a better user experience. Instead of waiting for the complete AI response, users see the response being generated in real-time as the AI model processes and generates the text.

## Key Benefits

- ✅ **Real-time feedback**: Users see responses as they're generated
- ✅ **Better UX**: No long waits for responses to appear
- ✅ **Responsive interface**: Users know the AI is actively working
- ✅ **Faster perceived performance**: Content appears immediately as generated

## Implementation Details

### 1. Ollama Adapter Changes

**File**: `packages/app/renderer/agent/models/ollamaAdapter.ts`

Added streaming support to the Ollama API integration:

```typescript
// New streaming interface
interface OllamaStreamRequest {
  model: string;
  prompt: string;
  stream: true;  // Enable streaming
}

// New streaming function
export async function queryOllamaModelStream(
  modelName: string, 
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string>
```

**Key Features**:
- Uses `fetch()` with response body streaming
- Parses newline-delimited JSON chunks
- Calls `onChunk` callback for each text fragment
- Returns complete response when done

### 2. Model Adapter Changes

**File**: `packages/app/renderer/agent/models/modelAdapter.ts`

Added a streaming wrapper function:

```typescript
export async function queryModelStream(
  modelId: string, 
  prompt: string, 
  onChunk: (chunk: string) => void
): Promise<string>
```

This provides the same interface for streaming regardless of the underlying model provider.

### 3. Chat Agent Changes

**File**: `packages/app/renderer/agent/chat/agent.ts`

Added streaming support to the chat agent:

```typescript
// New streaming interface
export interface SendMessageStreamParams extends SendMessageParams {
  onChunk: (chunk: string) => void;
}

// New streaming method
async sendMessageStream(params: SendMessageStreamParams): Promise<ChatMessage>
```

### 4. Chat Context Changes

**File**: `packages/app/renderer/ui/context/ChatContext.tsx`

Updated the chat context with streaming support:

```typescript
// New streaming method in ChatActions
sendMessageStream: (message: string, modelId: string, mode: 'ask' | 'agent') => Promise<void>;

// New message update method
updateMessage: (messageId: string, content: string) => void;
```

**Streaming Flow**:
1. Create empty AI message immediately
2. Update message content as chunks arrive
3. Apply file operations when complete (for agent mode)

### 5. UI Changes

**File**: `packages/app/renderer/ui/AgentChatPanel.tsx`

Updated the chat panel to use streaming:

```typescript
// Changed from sendMessage to sendMessageStream
await sendMessageStream(message, selectedModel, mode);
```

**UI Improvements**:
- Updated loading indicator: "AI is responding..." 
- Added streaming hint in placeholder text
- Real-time message updates during streaming

## How to Use

### For End Users

1. **Start a chat**: Open the AI Assistant panel
2. **Send a message**: Type and send as normal
3. **Watch real-time response**: See the AI response appear word-by-word
4. **No changes needed**: Streaming is enabled by default

### For Developers

#### Using the Streaming API Directly

```typescript
import { queryModelStream } from './agent/models';

// Basic streaming usage
const response = await queryModelStream(
  'llama3.2:latest',
  'Your prompt here',
  (chunk: string) => {
    console.log('New chunk:', chunk);
    // Update UI with each chunk
  }
);
```

#### Using the Chat Agent with Streaming

```typescript
import { chatAgent } from './agent/chat/agent';

const aiMessage = await chatAgent.sendMessageStream({
  message: 'Your question',
  modelId: 'llama3.2:latest',
  mode: 'ask',
  onChunk: (chunk: string) => {
    // Handle each streaming chunk
    updateUI(chunk);
  }
});
```

## Technical Implementation

### Streaming Protocol

The implementation uses **Server-Sent Events (SSE)** style streaming over HTTP:

1. **Request**: POST to Ollama API with `stream: true`
2. **Response**: Newline-delimited JSON chunks
3. **Processing**: Parse each line as separate JSON object
4. **Callback**: Call `onChunk` for each response fragment

### Error Handling

- **Network errors**: Gracefully fallback with error message
- **Parse errors**: Skip invalid JSON lines, continue streaming
- **Model errors**: Display error in chat interface
- **Connection issues**: Show appropriate error message

### Performance Considerations

- **Memory efficient**: Processes chunks as they arrive
- **Non-blocking**: UI remains responsive during streaming
- **Cancellable**: Future implementation can add abort support
- **Progressive rendering**: Users see content immediately

## Testing

### Manual Testing

1. **Start the application**: `npm run dev`
2. **Open chat panel**: Click AI Assistant
3. **Send a test message**: "Count from 1 to 10"
4. **Observe streaming**: See numbers appear in real-time

### Programmatic Testing

Use the test utilities provided:

```typescript
import { testStreamingInConsole } from './agent/models/testStreaming';

// Run streaming test
const result = await testStreamingInConsole();
console.log('Test result:', result);
```

### Browser Console Testing

Copy and paste the browser test code from `testStreaming.ts` to test streaming directly in the browser console.

## Future Enhancements

### Planned Features

- **Stream cancellation**: Allow users to stop streaming responses
- **Typing indicators**: Show more sophisticated "AI is typing" indicators
- **Response timing**: Display response generation speed metrics
- **Chunk buffering**: Optional buffering for smoother display
- **Progress bars**: Show completion percentage for longer responses

### Technical Improvements

- **Error recovery**: Better handling of network interruptions
- **Retry logic**: Automatic retry for failed streaming connections
- **Performance monitoring**: Track streaming performance metrics
- **Memory optimization**: Efficient handling of very long responses

## Troubleshooting

### Common Issues

1. **No streaming response**
   - Check if Ollama is running on `localhost:11434`
   - Verify model is available: `ollama list`
   - Check browser console for errors

2. **Choppy streaming**
   - Network latency may cause delays
   - Large models may have slower token generation
   - Consider using smaller/faster models for testing

3. **Streaming stops abruptly**
   - Check Ollama logs for errors
   - Verify sufficient system resources
   - Check for network connectivity issues

### Debug Mode

Enable debug logging in browser console:

```javascript
localStorage.setItem('debug', 'streaming');
```

This will log detailed streaming information for troubleshooting.

## Compatibility

- **Browsers**: Modern browsers with Fetch API and ReadableStream support
- **Ollama**: Requires Ollama server with streaming API support
- **Models**: All Ollama-compatible models support streaming
- **Platforms**: Works on Windows, macOS, and Linux

## Security Considerations

- **Local only**: Streaming connects only to local Ollama instance
- **No external APIs**: No data sent to external streaming services
- **Memory safe**: Proper cleanup of streaming connections
- **Resource limits**: Reasonable limits on response length and time 