/**
 * Examples demonstrating how to use the prompt builder
 */

import { buildPrompt, ContextChunk } from './promptBuilder';

/**
 * Example 1: Simple ask mode without context
 */
export function exampleSimpleAsk() {
  const userMessage = "What is the difference between useEffect and useLayoutEffect in React?";
  const prompt = buildPrompt('ask', userMessage);
  
  console.log('=== Simple Ask Mode Example ===');
  console.log(prompt);
  console.log('\n');
  
  return prompt;
}

/**
 * Example 2: Agent mode for code modifications
 */
export function exampleAgentMode() {
  const userMessage = "Add TypeScript types to this React component";
  const contextChunks: ContextChunk[] = [
    {
      filePath: './src/components/UserProfile.jsx',
      content: `function UserProfile({ user, onEdit }) {
  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => onEdit(user.id)}>Edit Profile</button>
    </div>
  );
}

export default UserProfile;`
    }
  ];
  
  const prompt = buildPrompt('agent', userMessage, contextChunks);
  
  console.log('=== Agent Mode Example ===');
  console.log(prompt);
  console.log('\n');
  
  return prompt;
}

/**
 * Example 3: Ask mode with multiple context files
 */
export function exampleAskWithContext() {
  const userMessage = "How can I optimize this component for better performance?";
  const contextChunks: ContextChunk[] = [
    {
      filePath: './src/components/ExpensiveList.tsx',
      content: `import React from 'react';

interface Item {
  id: string;
  name: string;
  value: number;
}

export function ExpensiveList({ items }: { items: Item[] }) {
  const processedItems = items.map(item => ({
    ...item,
    formattedValue: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(item.value)
  }));

  return (
    <div>
      {processedItems.map(item => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.formattedValue}</p>
        </div>
      ))}
    </div>
  );
}`,
      relevanceScore: 0.95,
      lineStart: 1,
      lineEnd: 30
    },
    {
      filePath: './src/hooks/useExpensiveCalculation.ts',
      content: `export function useExpensiveCalculation(data: any[]) {
  // This runs on every render - not optimized!
  const result = data.reduce((acc, item) => {
    return acc + complexCalculation(item);
  }, 0);
  
  return result;
}

function complexCalculation(item: any) {
  // Simulate expensive operation
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += item.value * Math.random();
  }
  return result;
}`,
      relevanceScore: 0.87,
      lineStart: 1,
      lineEnd: 16
    }
  ];
  
  const prompt = buildPrompt('ask', userMessage, contextChunks);
  
  console.log('=== Ask Mode with Context Example ===');
  console.log(prompt);
  console.log('\n');
  
  return prompt;
}

/**
 * Example 4: Agent mode for bug fixing
 */
export function exampleBugFix() {
  const userMessage = "Fix the memory leak in this useEffect hook";
  const contextChunks: ContextChunk[] = [
    {
      filePath: './src/components/Timer.tsx',
      content: `import React, { useState, useEffect } from 'react';

export function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    
    // Missing cleanup function - this causes memory leak!
  }, []);

  return <div>Timer: {seconds}s</div>;
}`,
      relevanceScore: 0.98,
      lineStart: 3,
      lineEnd: 16
    }
  ];
  
  const prompt = buildPrompt('agent', userMessage, contextChunks);
  
  console.log('=== Bug Fix Agent Example ===');
  console.log(prompt);
  console.log('\n');
  
  return prompt;
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🚀 Running Prompt Builder Examples\n');
  
  exampleSimpleAsk();
  exampleAgentMode();
  exampleAskWithContext();
  exampleBugFix();
  
  console.log('✅ All examples completed!');
}

// Export for easy access
export const promptBuilderExamples = {
  exampleSimpleAsk,
  exampleAgentMode,
  exampleAskWithContext,
  exampleBugFix,
  runAllExamples
}; 