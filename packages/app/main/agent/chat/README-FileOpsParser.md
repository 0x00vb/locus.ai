# File Operations Parser

A robust parser for extracting structured file operations from agent responses, designed for use in AI-assisted development workflows.

## Overview

The `FileOpsParser` extracts and validates file operations from agent responses that contain `FILE_OPS` blocks. This enables safe, structured file modifications with proper validation and conflict detection.

## Features

- **Multiple Format Support**: Handles various FILE_OPS declaration formats
- **Path Sanitization**: Prevents directory traversal and dangerous file operations
- **Conflict Detection**: Identifies conflicting operations on the same file
- **Content Extraction**: Extracts code content from various block formats
- **Error Handling**: Comprehensive error reporting and validation
- **Security**: Built-in security measures against malicious paths

## Usage

### Basic Parsing

```typescript
import { FileOpsParser } from './fileOpsParser';

const agentResponse = `
I'll create a new component for you:

\`\`\`FILE_OPS
CREATE: src/components/Button.tsx
\`\`\`typescript
import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
};
\`\`\`
\`\`\`
`;

const result = FileOpsParser.parseResponse(agentResponse);
console.log(result.operations); // Array of FileOp objects
console.log(result.errors);     // Any parsing errors
```

### Integration with Chat Agent

```typescript
import { processAgentResponse } from './fileOpsExample';

// Get response from chat agent
const agentResponse = await chatAgent.sendMessage({
  message: "Create a user profile component",
  modelId: "llama3.2:latest",
  mode: "agent"
});

// Process the response to extract both text and file operations
const processed = processAgentResponse(agentResponse.content);

console.log('Text Response:', processed.textResponse);
console.log('File Operations:', processed.fileOperations);
console.log('Has File Operations:', processed.hasFileOps);
```

## Supported Formats

The parser supports multiple declaration formats:

### Format 1: Action Prefix
```
CREATE: src/components/NewComponent.tsx
EDIT: src/utils/helper.ts
DELETE: src/old-file.ts
```

### Format 2: File with Action
```
File: src/components/Button.tsx (edit)
Path: src/styles/button.css (create)
```

### Format 3: Simple Path (with context inference)
```
src/components/UserProfile.tsx

[content here - action inferred from context]
```

### Format 4: Action with Path
```
ACTION: edit src/components/MyComponent.tsx
```

## File Operation Interface

```typescript
interface FileOp {
  path: string;                    // Sanitized file path
  action: "edit" | "create" | "delete";  // Operation type
  content?: string;                // File content (for edit/create)
}

interface ParseResult {
  operations: FileOp[];           // Extracted operations
  errors: string[];              // Parsing/validation errors
  rawBlock?: string;             // Raw FILE_OPS block content
}
```

## Security Features

### Path Sanitization
- Removes directory traversal attempts (`../`)
- Prevents access to system directories
- Normalizes path separators
- Validates file name characters
- Ensures relative paths only

### Validation
- Requires content for create/edit operations
- Prevents empty paths
- Validates action types
- Checks for dangerous characters

## Conflict Detection

The parser can detect conflicting operations:

```typescript
const conflicts = FileOpsParser.validateOperations(operations);
if (conflicts.length > 0) {
  console.log('Conflicts detected:', conflicts);
}
```

Common conflicts:
- Create + Edit on same file
- Delete + Edit/Create on same file
- Multiple create operations on same file

## Error Handling

The parser provides detailed error reporting:

```typescript
const result = FileOpsParser.parseResponse(response);

if (result.errors.length > 0) {
  result.errors.forEach(error => {
    console.error('Parse error:', error);
  });
}
```

Error types:
- Missing file paths
- Invalid action types
- Missing content for create/edit
- Path sanitization failures
- Malformed FILE_OPS blocks

## Advanced Features

### Multiple Blocks
Parse multiple FILE_OPS blocks from a single response:

```typescript
const result = FileOpsParser.parseMultipleBlocks(response);
```

### Content Extraction
The parser intelligently extracts content from various formats:
- Code blocks with language specifiers
- Plain text content
- Mixed content with metadata

### Operation Separators
Supports multiple separators within FILE_OPS blocks:
- `---` (triple dash)
- `===` (triple equals)
- `###` (triple hash)
- Double newlines

## Example Workflow

```typescript
import { 
  processAgentResponse, 
  simulateFileOpApproval, 
  generateFileOpPreviews 
} from './fileOpsExample';

// 1. Get agent response with file operations
const agentResponse = await chatAgent.sendMessage({
  message: "Refactor the authentication system",
  modelId: "llama3.2:latest",
  mode: "agent"
});

// 2. Parse and process the response
const processed = processAgentResponse(agentResponse.content);

// 3. Generate approval workflow
const approvals = simulateFileOpApproval(processed.fileOperations);

// 4. Create diff previews
const previews = await generateFileOpPreviews(
  processed.fileOperations, 
  projectRoot
);

// 5. Present to user for review and approval
console.log('Operations requiring approval:');
processed.fileOperations.forEach((op, index) => {
  const approval = approvals[index];
  console.log(`${op.action} ${op.path}: ${approval.approved ? 'AUTO' : 'MANUAL'}`);
});
```

## Testing

The parser includes comprehensive tests:

```typescript
import { runAllFileOpsTests } from './fileOpsParser.test';

// Run all tests
const results = await runAllFileOpsTests();
console.log(`Passed: ${results.filter(r => r.success).length}/${results.length}`);
```

Test coverage:
- Basic parsing functionality
- Multiple format support
- Path sanitization
- Conflict detection
- Edge cases and error handling
- Complex parsing scenarios

## Integration Points

### With Chat Agent
- Parse agent responses automatically
- Extract both text and file operations
- Validate operations before presentation

### With UI Components
- Generate diff previews for display
- Provide approval/rejection interface
- Show operation status and conflicts

### With File System
- Apply approved operations safely
- Create backups before modifications
- Handle file creation/editing/deletion

## Best Practices

1. **Always validate operations** before applying
2. **Present diff previews** to users for review
3. **Implement approval workflows** for safety
4. **Handle errors gracefully** with user feedback
5. **Log all operations** for audit trails
6. **Use conflict detection** to prevent issues
7. **Sanitize all paths** for security

## Future Enhancements

- Support for file moves/renames
- Batch operation optimization
- Integration with version control
- Advanced diff generation
- Custom validation rules
- Operation rollback capabilities 