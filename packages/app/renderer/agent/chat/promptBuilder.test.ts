/**
 * Test file for prompt builder functionality
 * Run these tests to verify prompt generation works correctly
 */

import { buildPrompt, buildPromptSafe, ContextChunk, PromptMode, validatePromptInputs } from './promptBuilder';

// Example context chunks for testing
const sampleContextChunks: ContextChunk[] = [
  {
    filePath: './src/components/TodoList.tsx',
    content: `export function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}`,
    relevanceScore: 0.85,
    lineStart: 15,
    lineEnd: 25
  },
  {
    filePath: './src/types/todo.ts',
    content: `export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}`,
    relevanceScore: 0.92,
    lineStart: 1,
    lineEnd: 6
  }
];

/**
 * Test ask mode prompt generation
 */
export function testAskMode() {
  console.log('=== Testing ASK Mode ===');
  
  const userMessage = "How can I add a delete function to the TodoList component?";
  const prompt = buildPrompt('ask', userMessage, sampleContextChunks);
  
  console.log('Generated prompt:');
  console.log(prompt);
  console.log('\n');
  
  return prompt;
}

/**
 * Test agent mode prompt generation
 */
export function testAgentMode() {
  console.log('=== Testing AGENT Mode ===');
  
  const userMessage = "Add a delete button to each todo item and implement the delete functionality";
  const prompt = buildPrompt('agent', userMessage, sampleContextChunks);
  
  console.log('Generated prompt:');
  console.log(prompt);
  console.log('\n');
  
  return prompt;
}

/**
 * Test prompt generation without context
 */
export function testNoContext() {
  console.log('=== Testing without Context ===');
  
  const userMessage = "What is React useEffect hook?";
  const askPrompt = buildPrompt('ask', userMessage);
  const agentPrompt = buildPrompt('agent', userMessage);
  
  console.log('ASK mode without context:');
  console.log(askPrompt);
  console.log('\n');
  
  console.log('AGENT mode without context:');
  console.log(agentPrompt);
  console.log('\n');
  
  return { askPrompt, agentPrompt };
}

/**
 * Test input validation
 */
export function testValidation() {
  console.log('=== Testing Input Validation ===');
  
  try {
    // Test invalid mode
    buildPrompt('invalid' as PromptMode, 'test message');
    console.log('❌ Should have thrown error for invalid mode');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('✅ Correctly caught invalid mode error:', errorMessage);
  }
  
  try {
    // Test empty message
    buildPromptSafe('ask', '');
    console.log('❌ Should have thrown error for empty message');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('✅ Correctly caught empty message error:', errorMessage);
  }
  
  try {
    // Test invalid context chunk
    const invalidChunks = [{ filePath: '', content: 'some content' }] as ContextChunk[];
    buildPromptSafe('ask', 'test', invalidChunks);
    console.log('❌ Should have thrown error for invalid context chunk');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('✅ Correctly caught invalid context chunk error:', errorMessage);
  }
  
  try {
    // Test valid input
    buildPromptSafe('ask', 'valid message', sampleContextChunks);
    console.log('✅ Successfully validated correct input');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ Should not have thrown error for valid input:', errorMessage);
  }
  
  console.log('\n');
}

/**
 * Test expected prompt formats
 */
export function testPromptFormats() {
  console.log('=== Testing Prompt Formats ===');
  
  const userMessage = "Test message";
  const contextChunks = [{
    filePath: './test.ts',
    content: 'console.log("test");'
  }] as ContextChunk[];
  
  // Test ask mode format
  const askPrompt = buildPrompt('ask', userMessage, contextChunks);
  console.log('ASK mode format check:');
  console.log('✅ Starts with "You are a helpful coding assistant":', askPrompt.startsWith('You are a helpful coding assistant'));
  console.log('✅ Contains [CODE CONTEXT] tags:', askPrompt.includes('[CODE CONTEXT]') && askPrompt.includes('[/CODE CONTEXT]'));
  console.log('✅ Contains user message:', askPrompt.includes('User: ' + userMessage));
  
  // Test agent mode format
  const agentPrompt = buildPrompt('agent', userMessage, contextChunks);
  console.log('\nAGENT mode format check:');
  console.log('✅ Starts with "You are a coding agent":', agentPrompt.startsWith('You are a coding agent'));
  console.log('✅ Contains [FILE_OPS] format:', agentPrompt.includes('[FILE_OPS]'));
  console.log('✅ Contains example format:', agentPrompt.includes('- path: ./src/index.tsx'));
  console.log('✅ Contains [CODE CONTEXT] tags:', agentPrompt.includes('[CODE CONTEXT]') && agentPrompt.includes('[/CODE CONTEXT]'));
  console.log('✅ Contains user message:', agentPrompt.includes('User: ' + userMessage));
  
  console.log('\n');
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log('🧪 Running Prompt Builder Tests\n');
  
  testAskMode();
  testAgentMode();
  testNoContext();
  testValidation();
  testPromptFormats();
  
  console.log('✅ All tests completed!');
}

// Export for manual testing
export const promptBuilderTests = {
  testAskMode,
  testAgentMode,
  testNoContext,
  testValidation,
  testPromptFormats,
  runAllTests,
  sampleContextChunks
}; 