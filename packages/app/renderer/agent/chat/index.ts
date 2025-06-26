// Chat module exports
export { ChatAgent, chatAgent } from './agent';
export type { SendMessageParams, AgentConfig, CodeContext } from './agent';

// Prompt builder exports
export { buildPrompt, buildPromptSafe, validatePromptInputs } from './promptBuilder';
export type { ContextChunk, PromptMode } from './promptBuilder';

// Test utilities (for development)
export { promptBuilderTests } from './promptBuilder.test'; 