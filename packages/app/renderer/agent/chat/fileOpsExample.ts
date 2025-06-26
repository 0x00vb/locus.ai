import { FileOpsParser, FileOp } from './fileOpsParser';
import { ChatAgent } from './agent';

/**
 * Example integration of FileOpsParser with ChatAgent
 */

export interface ProcessedAgentResponse {
  textResponse: string;
  fileOperations: FileOp[];
  errors: string[];
  hasFileOps: boolean;
}

/**
 * Process an agent response to extract both text and file operations
 */
export function processAgentResponse(response: string): ProcessedAgentResponse {
  // Parse file operations from the response
  const parseResult = FileOpsParser.parseResponse(response);
  
  // Extract the text response (everything outside FILE_OPS blocks)
  const textResponse = extractTextResponse(response);
  
  // Validate operations for conflicts
  const validationErrors = FileOpsParser.validateOperations(parseResult.operations);
  
  return {
    textResponse,
    fileOperations: parseResult.operations,
    errors: [...parseResult.errors, ...validationErrors],
    hasFileOps: parseResult.operations.length > 0
  };
}

/**
 * Extract text content excluding FILE_OPS blocks
 */
function extractTextResponse(response: string): string {
  let cleaned = response;
  
  // Remove FILE_OPS blocks
  const fileOpsRegex = /```FILE_OPS[\s\S]*?```/g;
  cleaned = cleaned.replace(fileOpsRegex, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Example: Process chat agent response and handle file operations
 */
export async function handleAgentResponseWithFileOps(
  userMessage: string,
  projectRoot: string
): Promise<ProcessedAgentResponse> {
  // Create chat agent instance with appropriate config
  const agent = new ChatAgent({
    maxContextTokens: 4000,
    temperature: 0.7,
    topK: 5
  });

  try {
    // Get response from agent using correct SendMessageParams interface
    const agentResponse = await agent.sendMessage({
      message: userMessage,
      modelId: 'llama3.2:latest',
      mode: 'agent' // Use agent mode to get FILE_OPS
    });

    // Process the response to extract file operations
    // agentResponse is a ChatMessage, so we need the content property
    const processed = processAgentResponse(agentResponse.content);
    
    return processed;
  } catch (error) {
    return {
      textResponse: `Error: ${error}`,
      fileOperations: [],
      errors: [`Agent error: ${error}`],
      hasFileOps: false
    };
  }
}

/**
 * Example: Simulate file operation approval workflow
 */
export interface FileOpApproval {
  operation: FileOp;
  approved: boolean;
  reason?: string;
}

export function simulateFileOpApproval(operations: FileOp[]): FileOpApproval[] {
  return operations.map(operation => {
    // Simulate approval logic
    const approved = !operation.path.includes('important') && 
                    !operation.path.includes('config') &&
                    operation.action !== 'delete';
    
    return {
      operation,
      approved,
      reason: approved ? 'Auto-approved' : 'Requires manual review'
    };
  });
}

/**
 * Example: Generate diff preview for file operations
 */
export interface FileOpPreview {
  operation: FileOp;
  preview: string;
  status: 'create' | 'edit' | 'delete';
}

export async function generateFileOpPreviews(
  operations: FileOp[],
  projectRoot: string
): Promise<FileOpPreview[]> {
  const previews: FileOpPreview[] = [];
  
  for (const operation of operations) {
    const fullPath = `${projectRoot}/${operation.path}`;
    let preview = '';
    
    switch (operation.action) {
      case 'create':
        preview = `+++ New file: ${operation.path}\n${operation.content || ''}`;
        break;
        
      case 'edit':
        try {
          // In a real implementation, you'd read the existing file
          // and generate a proper diff
          preview = `@@@ ${operation.path}\n${operation.content || ''}`;
        } catch (error) {
          preview = `Error reading file: ${error}`;
        }
        break;
        
      case 'delete':
        preview = `--- Delete file: ${operation.path}`;
        break;
    }
    
    previews.push({
      operation,
      preview,
      status: operation.action
    });
  }
  
  return previews;
}

/**
 * Example workflow: Complete file operations processing
 */
export async function completeFileOpsWorkflow(
  userMessage: string,
  projectRoot: string
): Promise<{
  response: ProcessedAgentResponse;
  approvals: FileOpApproval[];
  previews: FileOpPreview[];
}> {
  // Step 1: Get agent response and parse file operations
  const response = await handleAgentResponseWithFileOps(userMessage, projectRoot);
  
  // Step 2: Generate approval decisions
  const approvals = simulateFileOpApproval(response.fileOperations);
  
  // Step 3: Generate diff previews
  const previews = await generateFileOpPreviews(response.fileOperations, projectRoot);
  
  return {
    response,
    approvals,
    previews
  };
}

// Example usage
export async function exampleUsage() {
  const userMessage = "Create a simple React button component with TypeScript";
  const projectRoot = "/path/to/project";
  
  try {
    const result = await completeFileOpsWorkflow(userMessage, projectRoot);
    
    console.log('Agent Response:', result.response.textResponse);
    console.log('\nFile Operations:');
    
    result.response.fileOperations.forEach((op, index) => {
      const approval = result.approvals[index];
      const preview = result.previews[index];
      
      console.log(`\n${index + 1}. ${op.action.toUpperCase()}: ${op.path}`);
      console.log(`   Approved: ${approval.approved} (${approval.reason})`);
      console.log(`   Preview: ${preview.preview.slice(0, 100)}...`);
    });
    
    if (result.response.errors.length > 0) {
      console.log('\nErrors:', result.response.errors);
    }
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Uncomment to run example
// exampleUsage().catch(console.error); 