# File Operations Preview & Approval System

A comprehensive system for safely applying file changes suggested by AI agents, with user approval workflows and comprehensive logging.

## Overview

This system provides a secure way to handle file operations (create, edit, delete) suggested by AI agents. It ensures that no file changes are applied without explicit user approval and maintains a complete audit trail of all operations.

## Key Components

### 1. FileChangeModal
A React modal component that displays file operations with diff previews and approval controls.

**Features:**
- Side-by-side file list and diff preview
- Individual file approval/rejection
- Bulk approve/reject all operations
- Before/after content comparison for edits
- Visual indicators for operation types (create/edit/delete)
- Loading states and error handling

### 2. FileOperationsService
A service class that handles the execution and logging of approved file operations.

**Features:**
- Secure file operation execution via Electron IPC
- Comprehensive operation logging to `/logs/agent-actions.log`
- Error handling and result reporting
- Operation statistics and history tracking

### 3. useFileOperations Hook
A React hook that manages the file operations workflow state.

**Features:**
- Modal state management
- Operation result handling
- Approval workflow coordination
- Integration with existing agent responses

## Usage

### Basic Integration

```typescript
import { useFileOperations, FileChangeModal } from '@app/ui';
import { FileOpsParser } from '@app/agent/chat/fileOpsParser';

function MyComponent() {
  const {
    showModal,
    isApplying,
    fileOperations,
    openModal,
    closeModal,
    handleApprove,
    handleApproveAll,
    handleRejectAll
  } = useFileOperations();

  // Process agent response containing FILE_OPS
  const handleAgentResponse = (agentResponse: string) => {
    const parseResult = FileOpsParser.parseResponse(agentResponse);
    if (parseResult.operations.length > 0) {
      openModal(parseResult.operations);
    }
  };

  return (
    <div>
      {/* Your UI */}
      
      <FileChangeModal
        isOpen={showModal}
        onClose={closeModal}
        fileOperations={fileOperations}
        onApprove={handleApprove}
        onApproveAll={handleApproveAll}
        onRejectAll={handleRejectAll}
        isApplying={isApplying}
      />
    </div>
  );
}
```

### Agent Integration

The system works with the existing `FileOpsParser` to extract file operations from agent responses:

```typescript
// Agent responds with FILE_OPS blocks
const agentResponse = `
I'll create a new component for you:

\`\`\`FILE_OPS
CREATE: src/components/Button.tsx
\`\`\`typescript
import React from 'react';

export const Button = () => {
  return <button>Click me</button>;
};
\`\`\`
\`\`\`
`;

// Parse and show approval modal
const parseResult = FileOpsParser.parseResponse(agentResponse);
openModal(parseResult.operations);
```

## Security Features

### 1. User Approval Required
- **No automatic execution**: All file operations require explicit user approval
- **Individual control**: Users can approve/reject each file operation separately
- **Preview before action**: Full diff preview shows exactly what will change

### 2. Safe File Operations
- **Electron IPC**: All file operations go through secure Electron IPC channels
- **Path validation**: File paths are validated and sanitized
- **Error handling**: Comprehensive error handling with user feedback

### 3. Comprehensive Logging
All operations are logged to `/logs/agent-actions.log` with:
- Timestamp and session ID
- User identification
- Complete operation details
- Success/failure status
- Error messages

## Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "userId": "user",
  "sessionId": "session_1642248600000_abc123def",
  "operations": [
    {
      "success": true,
      "filePath": "src/components/Button.tsx",
      "action": "create",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalOperations": 1,
  "successfulOperations": 1,
  "failedOperations": 0
}
```

## API Reference

### FileChangeModal Props

```typescript
interface FileChangeModalProps {
  isOpen: boolean;                              // Modal visibility
  onClose: () => void;                          // Close handler
  fileOperations: FileOp[];                     // Operations to preview
  onApprove: (approvals: FileChangeApproval[]) => Promise<void>;  // Individual approval
  onApproveAll: () => Promise<void>;            // Approve all
  onRejectAll: () => void;                      // Reject all
  isApplying?: boolean;                         // Loading state
}
```

### useFileOperations Hook

```typescript
interface UseFileOperationsReturn {
  showModal: boolean;                           // Modal state
  isApplying: boolean;                          // Operation in progress
  fileOperations: FileOp[];                     // Current operations
  operationResults: FileOperationResult[];     // Last results
  openModal: (operations: FileOp[]) => void;    // Open with operations
  closeModal: () => void;                       // Close modal
  handleApprove: (approvals: FileChangeApproval[]) => Promise<void>;  // Process approvals
  handleApproveAll: () => Promise<void>;        // Approve all
  handleRejectAll: () => void;                  // Reject all
  clearResults: () => void;                     // Clear results
}
```

### FileOperationsService Methods

```typescript
class FileOperationsService {
  // Apply approved operations
  static async applyFileOperations(approvals: FileChangeApproval[]): Promise<FileOperationResult[]>
  
  // Read operation history
  static async readOperationsLog(): Promise<FileOperationLog[]>
  
  // Get statistics
  static async getOperationStats(): Promise<OperationStats>
}
```

## File Operation Types

### CREATE
Creates a new file with the specified content.

```typescript
{
  path: "src/components/NewComponent.tsx",
  action: "create",
  content: "import React from 'react';\n\nexport const NewComponent = () => {\n  return <div>Hello</div>;\n};"
}
```

### EDIT
Modifies an existing file, replacing its content.

```typescript
{
  path: "src/components/ExistingComponent.tsx", 
  action: "edit",
  content: "// Updated content here"
}
```

### DELETE
Removes an existing file.

```typescript
{
  path: "src/components/OldComponent.tsx",
  action: "delete"
  // No content needed for delete operations
}
```

## Error Handling

The system provides comprehensive error handling:

1. **Parse Errors**: Invalid FILE_OPS blocks are reported with detailed error messages
2. **File System Errors**: IPC failures are caught and logged
3. **Validation Errors**: Invalid paths or missing content are detected
4. **User Feedback**: All errors are displayed in the UI with actionable information

## Best Practices

### For Developers

1. **Always use the approval system**: Never bypass the user approval workflow
2. **Check operation results**: Always handle the results from `applyFileOperations`
3. **Provide feedback**: Show users the results of their approved operations
4. **Log important operations**: Consider additional logging for critical operations

### For Users

1. **Review before approving**: Always examine the diff preview before approving changes
2. **Approve selectively**: Don't feel obligated to approve all operations at once
3. **Check the logs**: Review `/logs/agent-actions.log` periodically for audit purposes
4. **Backup important work**: The system is safe, but backups are always recommended

## Integration with Existing Agent System

This system integrates seamlessly with the existing agent chat system:

1. **Agent responds** with FILE_OPS blocks
2. **FileOpsParser extracts** operations from the response
3. **Preview modal shows** diffs and approval options
4. **User approves/rejects** individual operations
5. **FileOperationsService executes** approved operations via IPC
6. **Results are logged** to the agent actions log
7. **User receives feedback** on operation success/failure

The system maintains the conversational flow while adding a crucial safety layer for file modifications.

## Troubleshooting

### Common Issues

1. **Modal doesn't open**: Check that `fileOperations` array is not empty
2. **Operations fail**: Verify file paths are valid and writable
3. **Logging errors**: Ensure `/logs` directory exists and is writable
4. **Preview issues**: Check that files exist for edit operations

### Debug Information

Enable debug logging by setting `localStorage.setItem('debug-file-ops', 'true')` in the browser console.

This will provide additional console output for:
- File operation parsing
- IPC communication
- Operation execution
- Error details

## Future Enhancements

Potential improvements for future versions:

1. **Advanced diff viewer**: Line-by-line diff with syntax highlighting
2. **Operation preview**: Simulate operations without applying them
3. **Batch operations**: Group related operations for bulk approval
4. **Undo functionality**: Ability to undo recently applied operations
5. **Remote logging**: Send logs to external audit systems
6. **User preferences**: Configurable approval settings and defaults 