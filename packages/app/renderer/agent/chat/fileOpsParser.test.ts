import { FileOpsParser, FileOp, ParseResult } from './fileOpsParser';

/**
 * Test utilities and cases for the FileOpsParser
 */

// Test data
const validFileOpsResponse = `
I need to make several changes to implement the new feature:

\`\`\`FILE_OPS
CREATE: src/components/NewComponent.tsx
\`\`\`typescript
import React from 'react';

interface Props {
  title: string;
}

export function NewComponent({ title }: Props) {
  return <div>{title}</div>;
}
\`\`\`

---

EDIT: src/utils/helper.ts
\`\`\`typescript
// Add new helper function
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
\`\`\`

---

DELETE: src/old-component.tsx
\`\`\`

These changes will add the new component and helper function.
`;

const multipleFormatsResponse = `
Here are the file operations needed:

\`\`\`FILE_OPS
File: src/components/Button.tsx (edit)
\`\`\`tsx
import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
};
\`\`\`

Path: src/styles/button.css (create)
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

ACTION: delete src/deprecated/old-button.tsx
\`\`\`
`;

const invalidPathsResponse = `
\`\`\`FILE_OPS
CREATE: ../../../etc/passwd
malicious content

EDIT: src/valid/file.ts
valid content

DELETE: C:\\Windows\\System32\\important.dll

CREATE: src/app<script>.ts
alert('xss')
\`\`\`
`;

const conflictingOperationsResponse = `
\`\`\`FILE_OPS
CREATE: src/components/Test.tsx
content 1

EDIT: src/components/Test.tsx
content 2

DELETE: src/components/Test.tsx
\`\`\`
`;

// Test functions
export function testBasicParsing() {
  console.log('Testing basic FILE_OPS parsing...');
  
  const result = FileOpsParser.parseResponse(validFileOpsResponse);
  
  console.log('Parse result:', {
    operationsCount: result.operations.length,
    errorsCount: result.errors.length,
    operations: result.operations.map(op => ({
      action: op.action,
      path: op.path,
      hasContent: !!op.content
    }))
  });

  // Validate expected operations
  const expectedOps = [
    { action: 'create', path: 'src/components/NewComponent.tsx' },
    { action: 'edit', path: 'src/utils/helper.ts' },
    { action: 'delete', path: 'src/old-component.tsx' }
  ];

  let passed = true;
  
  if (result.operations.length !== expectedOps.length) {
    console.error(`Expected ${expectedOps.length} operations, got ${result.operations.length}`);
    passed = false;
  }

  for (let i = 0; i < expectedOps.length; i++) {
    const expected = expectedOps[i];
    const actual = result.operations[i];
    
    if (!actual) {
      console.error(`Missing operation at index ${i}`);
      passed = false;
      continue;
    }

    if (actual.action !== expected.action) {
      console.error(`Operation ${i}: expected action ${expected.action}, got ${actual.action}`);
      passed = false;
    }

    if (actual.path !== expected.path) {
      console.error(`Operation ${i}: expected path ${expected.path}, got ${actual.path}`);
      passed = false;
    }

    // Check content requirements
    if ((actual.action === 'create' || actual.action === 'edit') && !actual.content) {
      console.error(`Operation ${i}: ${actual.action} should have content`);
      passed = false;
    }

    if (actual.action === 'delete' && actual.content) {
      console.error(`Operation ${i}: delete should not have content`);
      passed = false;
    }
  }

  console.log(`Basic parsing test: ${passed ? 'PASSED' : 'FAILED'}\n`);
  return passed;
}

export function testMultipleFormats() {
  console.log('Testing multiple FILE_OPS formats...');
  
  const result = FileOpsParser.parseResponse(multipleFormatsResponse);
  
  console.log('Multiple formats result:', {
    operationsCount: result.operations.length,
    errorsCount: result.errors.length,
    operations: result.operations.map(op => ({
      action: op.action,
      path: op.path
    }))
  });

  const expectedPaths = [
    'src/components/Button.tsx',
    'src/styles/button.css',
    'src/deprecated/old-button.tsx'
  ];

  let passed = true;

  if (result.operations.length !== expectedPaths.length) {
    console.error(`Expected ${expectedPaths.length} operations, got ${result.operations.length}`);
    passed = false;
  }

  for (let i = 0; i < result.operations.length; i++) {
    const op = result.operations[i];
    if (!expectedPaths.includes(op.path)) {
      console.error(`Unexpected path: ${op.path}`);
      passed = false;
    }
  }

  console.log(`Multiple formats test: ${passed ? 'PASSED' : 'FAILED'}\n`);
  return passed;
}

export function testPathSanitization() {
  console.log('Testing path sanitization...');
  
  const result = FileOpsParser.parseResponse(invalidPathsResponse);
  
  console.log('Sanitization result:', {
    operationsCount: result.operations.length,
    errorsCount: result.errors.length,
    errors: result.errors
  });

  // Should have errors for invalid paths
  let passed = true;

  if (result.errors.length === 0) {
    console.error('Expected sanitization errors, but got none');
    passed = false;
  }

  // Check that dangerous paths were rejected
  const paths = result.operations.map(op => op.path);
  const dangerousPaths = ['../../../etc/passwd', 'C:\\Windows\\System32\\important.dll'];
  
  for (const dangerous of dangerousPaths) {
    if (paths.some(p => p.includes('etc/passwd') || p.includes('System32'))) {
      console.error(`Dangerous path not properly sanitized: ${dangerous}`);
      passed = false;
    }
  }

  console.log(`Path sanitization test: ${passed ? 'PASSED' : 'FAILED'}\n`);
  return passed;
}

export function testConflictValidation() {
  console.log('Testing conflict validation...');
  
  const result = FileOpsParser.parseResponse(conflictingOperationsResponse);
  const conflicts = FileOpsParser.validateOperations(result.operations);
  
  console.log('Conflict validation result:', {
    operationsCount: result.operations.length,
    conflictsCount: conflicts.length,
    conflicts
  });

  let passed = true;

  if (conflicts.length === 0) {
    console.error('Expected conflicts to be detected, but got none');
    passed = false;
  }

  console.log(`Conflict validation test: ${passed ? 'PASSED' : 'FAILED'}\n`);
  return passed;
}

export function testEdgeCases() {
  console.log('Testing edge cases...');
  
  const testCases = [
    {
      name: 'Empty response',
      input: '',
      expectedOps: 0
    },
    {
      name: 'No FILE_OPS block',
      input: 'Just some regular text without file operations',
      expectedOps: 0
    },
    {
      name: 'Unclosed FILE_OPS block',
      input: '```FILE_OPS\nCREATE: test.ts\ncontent',
      expectError: true
    },
    {
      name: 'Empty FILE_OPS block',
      input: '```FILE_OPS\n```',
      expectedOps: 0
    },
    {
      name: 'FILE_OPS with no operations',
      input: '```FILE_OPS\nJust some text\n```',
      expectedOps: 0
    }
  ];

  let passed = true;

  for (const testCase of testCases) {
    try {
      const result = FileOpsParser.parseResponse(testCase.input);
      
      if (testCase.expectError && result.errors.length === 0) {
        console.error(`${testCase.name}: Expected error but got none`);
        passed = false;
      }
      
      if (testCase.expectedOps !== undefined && result.operations.length !== testCase.expectedOps) {
        console.error(`${testCase.name}: Expected ${testCase.expectedOps} operations, got ${result.operations.length}`);
        passed = false;
      }
      
      console.log(`${testCase.name}: OK`);
    } catch (error) {
      if (!testCase.expectError) {
        console.error(`${testCase.name}: Unexpected error: ${error}`);
        passed = false;
      } else {
        console.log(`${testCase.name}: Expected error caught: ${error}`);
      }
    }
  }

  console.log(`Edge cases test: ${passed ? 'PASSED' : 'FAILED'}\n`);
  return passed;
}

export function testComplexParsing() {
  console.log('Testing complex parsing scenarios...');
  
  const complexResponse = `
\`\`\`FILE_OPS
src/components/UserProfile.tsx

import React, { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <div className="user-profile">
      {user ? (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

===

DELETE: src/components/OldProfile.tsx

===

CREATE: src/types/user.ts
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface UserProfile extends User {
  avatar?: string;
  bio?: string;
}
\`\`\`
`;

  const result = FileOpsParser.parseResponse(complexResponse);
  
  console.log('Complex parsing result:', {
    operationsCount: result.operations.length,
    errorsCount: result.errors.length,
    operations: result.operations.map(op => ({
      action: op.action,
      path: op.path,
      contentLength: op.content?.length || 0
    }))
  });

  let passed = true;

  // Should detect the operations correctly
  const expectedPaths = [
    'src/components/UserProfile.tsx',
    'src/components/OldProfile.tsx',
    'src/types/user.ts'
  ];

  if (result.operations.length !== expectedPaths.length) {
    console.error(`Expected ${expectedPaths.length} operations, got ${result.operations.length}`);
    passed = false;
  }

  // Check that create/edit operations have content
  for (const op of result.operations) {
    if ((op.action === 'create' || op.action === 'edit') && !op.content) {
      console.error(`Operation ${op.action} ${op.path} missing content`);
      passed = false;
    }
  }

  console.log(`Complex parsing test: ${passed ? 'PASSED' : 'FAILED'}\n`);
  return passed;
}

export async function runAllFileOpsTests() {
  console.log('=== Running FileOpsParser Tests ===\n');
  
  const tests = [
    { name: 'Basic Parsing', test: testBasicParsing },
    { name: 'Multiple Formats', test: testMultipleFormats },
    { name: 'Path Sanitization', test: testPathSanitization },
    { name: 'Conflict Validation', test: testConflictValidation },
    { name: 'Edge Cases', test: testEdgeCases },
    { name: 'Complex Parsing', test: testComplexParsing }
  ];

  const results = [];
  
  for (const { name, test } of tests) {
    console.log(`--- ${name} Test ---`);
    try {
      const success = test();
      results.push({ name, success });
    } catch (error) {
      console.error(`${name} test threw an error:`, error);
      results.push({ name, success: false });
    }
  }
  
  console.log('\n=== FileOpsParser Test Results ===');
  results.forEach(({ name, success }) => {
    console.log(`${name}: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  });
  
  const passedCount = results.filter(r => r.success).length;
  console.log(`\nPassed: ${passedCount}/${results.length}`);
  
  return results;
}

// Example usage
export function exampleUsage() {
  console.log('=== FileOpsParser Example Usage ===\n');
  
  const sampleResponse = `
I'll help you create the user authentication system:

\`\`\`FILE_OPS
CREATE: src/auth/AuthProvider.tsx
\`\`\`tsx
import React, { createContext, useContext, useState } from 'react';

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string) => {
    // Implementation here
  };
  
  const logout = () => {
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
\`\`\`

---

EDIT: src/App.tsx
\`\`\`tsx
import { AuthProvider } from './auth/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* existing routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
\`\`\`
\`\`\`
`;

  const result = FileOpsParser.parseResponse(sampleResponse);
  
  console.log('Parsed operations:');
  result.operations.forEach((op, index) => {
    console.log(`${index + 1}. ${op.action.toUpperCase()}: ${op.path}`);
    if (op.content) {
      console.log(`   Content: ${op.content.slice(0, 100)}...`);
    }
  });
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log(`- ${error}`));
  }
  
  // Validate operations
  const conflicts = FileOpsParser.validateOperations(result.operations);
  if (conflicts.length > 0) {
    console.log('\nConflicts detected:');
    conflicts.forEach(conflict => console.log(`- ${conflict}`));
  }
}

// Uncomment to run tests
// runAllFileOpsTests().catch(console.error);
// exampleUsage(); 