import React, { useState } from 'react';
import { FileOpsParser } from '../../agent/chat/fileOpsParser';
import { FileChangeModal } from '../FileChangeModal';
import { useFileOperations } from '../hooks/useFileOperations';
import { processAgentResponse } from '../../agent/chat/fileOpsExample';

/**
 * Example integration of file operations approval workflow
 * This demonstrates how to use the FileChangeModal with agent responses
 */
export const FileOperationsExample: React.FC = () => {
  const {
    showModal,
    isApplying,
    fileOperations,
    operationResults,
    openModal,
    closeModal,
    handleApprove,
    handleApproveAll,
    handleRejectAll,
    clearResults
  } = useFileOperations();

  const [agentResponse, setAgentResponse] = useState('');
  const [lastResults, setLastResults] = useState<string>('');

  // Example agent response with FILE_OPS
  const exampleResponse = `I'll help you create a React button component with TypeScript:

\`\`\`FILE_OPS
CREATE: src/components/Button.tsx
\`\`\`typescript
import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary',
  disabled = false 
}) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`\${baseClasses} \${variantClasses[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
    >
      {children}
    </button>
  );
};
\`\`\`

CREATE: src/components/Button.stories.tsx
\`\`\`typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
  },
};
\`\`\`
\`\`\`

This creates a reusable Button component with TypeScript support and includes Storybook stories for documentation and testing.`;

  const handleProcessResponse = async () => {
    if (!agentResponse.trim()) {
      setAgentResponse(exampleResponse);
      return;
    }

    // Parse file operations from the response
    const parseResult = await FileOpsParser.parseResponse(agentResponse);
    
    if (parseResult.operations.length > 0) {
      // Show the preview modal
      openModal(parseResult.operations);
    } else {
      alert('No file operations found in the response');
    }
  };

  const handleApproveWithCallback = async (approvals: any[]) => {
    await handleApprove(approvals);
    
    // Show results
    const results = operationResults;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => r.success === false).length;
    
    setLastResults(`Operations completed: ${successful} successful, ${failed} failed`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">File Operations Preview & Approval System</h2>
      
      <div className="space-y-6">
        {/* Example Controls */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Try the System</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Agent Response (with FILE_OPS blocks):
              </label>
              <textarea
                value={agentResponse}
                onChange={(e) => setAgentResponse(e.target.value)}
                placeholder="Enter an agent response containing FILE_OPS blocks, or click 'Load Example' to see a sample"
                className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none font-mono text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setAgentResponse(exampleResponse)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Load Example
              </button>
              <button
                onClick={handleProcessResponse}
                disabled={!agentResponse.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Process Response
              </button>
              <button
                onClick={() => setAgentResponse('')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {lastResults && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
              Last Operation Results:
            </h4>
            <p className="text-green-700 dark:text-green-400">{lastResults}</p>
            <button
              onClick={() => setLastResults('')}
              className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            How it works:
          </h4>
          <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1 text-sm">
            <li>Agent responds with FILE_OPS blocks containing file operations</li>
            <li>System parses the response and extracts file operations</li>
            <li>Preview modal shows diffs and allows individual approval</li>
            <li>Approved operations are executed via Electron IPC</li>
            <li>All operations are logged to /logs/agent-actions.log</li>
          </ol>
        </div>

        {/* Features */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            Features:
          </h4>
          <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-400 space-y-1 text-sm">
            <li>✅ Preview file changes with before/after comparison</li>
            <li>✅ Individual approval for each file operation</li>
            <li>✅ Bulk approve/reject all operations</li>
            <li>✅ Safe file operations via Electron IPC</li>
            <li>✅ Comprehensive logging of all operations</li>
            <li>✅ Error handling and user feedback</li>
            <li>✅ Support for create, edit, and delete operations</li>
          </ul>
        </div>
      </div>

      {/* File Change Modal */}
      <FileChangeModal
        isOpen={showModal}
        onClose={closeModal}
        fileOperations={fileOperations}
        onApprove={handleApproveWithCallback}
        onApproveAll={handleApproveAll}
        onRejectAll={handleRejectAll}
        isApplying={isApplying}
      />
    </div>
  );
}; 