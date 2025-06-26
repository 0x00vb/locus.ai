/**
 * Prompt Builder for AI Chat System
 * Handles different prompt modes and context formatting
 */

import { detectLanguageFromPath, getLanguageInfoFromPath, areLanguagesCompatible } from '../utils/langDetect';

export interface ContextChunk {
  filePath: string;
  content: string;
  relevanceScore?: number;
  lineStart?: number;
  lineEnd?: number;
}

export type PromptMode = 'ask' | 'agent';

export interface PromptOptions {
  projectFilesBlock?: string;
  activeFileBlock?: string;
  includeAntiHallucination?: boolean;
  activeFilePath?: string;
}

/**
 * Main prompt building function
 * @param mode - The prompt mode ('ask' or 'agent')
 * @param userMessage - The user's message/question
 * @param contextChunks - Array of relevant code context chunks
 * @param options - Additional prompt options
 * @returns Formatted prompt string
 */
export function buildPrompt(
  mode: PromptMode,
  userMessage: string,
  contextChunks: ContextChunk[] = [],
  options: PromptOptions = {}
): string {
  const formattedContext = formatCodeContext(contextChunks);

  switch (mode) {
    case 'ask':
      return buildAskPrompt(userMessage, formattedContext, options);
    case 'agent':
      return buildAgentPrompt(userMessage, formattedContext, options);
    default:
      throw new Error(`Unknown prompt mode: ${mode}`);
  }
}

/**
 * Build ask mode prompt - for direct Q&A interactions
 */
function buildAskPrompt(userMessage: string, codeContext: string, options: PromptOptions): string {
  const antiHallucinationInstructions = options.includeAntiHallucination !== false 
    ? getAntiHallucinationInstructions() : '';

  const activeFileSection = options.activeFileBlock 
    ? `${options.activeFileBlock}\n` : '';
  
  const projectFilesSection = options.projectFilesBlock 
    ? `${options.projectFilesBlock}\n` : '';

  const contextSection = codeContext ? 
    `[CODE CONTEXT]\n${codeContext}\n[/CODE CONTEXT]\n` : '';

  const languageInstructions = options.activeFilePath 
    ? getLanguageSpecificInstructions(options.activeFilePath) 
    : '';

  return `You are a helpful coding assistant. Follow these guidelines:

${antiHallucinationInstructions}${languageInstructions}

${activeFileSection}${projectFilesSection}${contextSection}User: ${userMessage}`;
}

/**
 * Build agent mode prompt - for proactive code suggestions and edits
 */
function buildAgentPrompt(userMessage: string, codeContext: string, options: PromptOptions): string {
  const antiHallucinationInstructions = options.includeAntiHallucination !== false 
    ? getAntiHallucinationInstructions() : '';

  const activeFileSection = options.activeFileBlock 
    ? `${options.activeFileBlock}\n` : '';
  
  const projectFilesSection = options.projectFilesBlock 
    ? `${options.projectFilesBlock}\n` : '';

  const contextSection = codeContext ? 
    `[CODE CONTEXT]\n${codeContext}\n[/CODE CONTEXT]\n` : '';

  const languageInstructions = options.activeFilePath 
    ? getLanguageSpecificInstructions(options.activeFilePath, true) 
    : '';

  const fileOpsInstructions = getFileOperationsInstructions(options.activeFilePath);

  return `You are a coding agent. Your job is to suggest edits to the project.

${antiHallucinationInstructions}${languageInstructions}

${fileOpsInstructions}

${activeFileSection}${projectFilesSection}${contextSection}User: ${userMessage}`;
}

/**
 * Get language-specific instructions based on the active file
 */
function getLanguageSpecificInstructions(filePath: string, isAgent: boolean = false): string {
  const language = detectLanguageFromPath(filePath);
  const langInfo = getLanguageInfoFromPath(filePath);
  
  if (!langInfo) {
    return `\nLANGUAGE CONTEXT:
- You are working with a ${language} file: ${filePath}
- Follow ${language} syntax and conventions strictly
- Do not switch to other programming languages unless explicitly requested
${isAgent ? '- Only propose edits in the same language unless creating new files' : ''}

`;
  }

  const instructions = [`\nLANGUAGE CONTEXT:`];
  instructions.push(`- Current file: ${filePath}`);
  instructions.push(`- Language: ${langInfo.name} (${language})`);
  instructions.push(`- Category: ${langInfo.category}`);
  instructions.push(`- Use ONLY ${langInfo.name} syntax and conventions`);
  
  if (isAgent) {
    instructions.push(`- Only modify files listed in [ACTIVE_FILE] unless the user explicitly requests changes to other files`);
    instructions.push(`- If creating new files, ensure they use appropriate extensions for the language`);
    instructions.push(`- Never switch the programming language of existing files`);
  }

  // Add language-specific guidance
  switch (langInfo.category) {
    case 'web':
      instructions.push(`- Follow modern ${langInfo.name} best practices`);
      if (language === 'typescript' || language === 'javascript') {
        instructions.push(`- Use appropriate TypeScript/JavaScript patterns`);
        instructions.push(`- Include proper imports and exports`);
        if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
          instructions.push(`- Follow React component patterns and hooks conventions`);
        }
      }
      break;
    
    case 'system':
      instructions.push(`- Follow ${langInfo.name} idioms and best practices`);
      instructions.push(`- Include necessary imports and dependencies`);
      break;
    
    case 'data':
      instructions.push(`- Maintain proper ${langInfo.name} structure and format`);
      instructions.push(`- Validate syntax before suggesting changes`);
      break;
      
    case 'config':
      instructions.push(`- Preserve existing configuration structure`);
      instructions.push(`- Validate configuration syntax`);
      break;
  }

  instructions.push('');
  return instructions.join('\n') + '\n';
}

/**
 * Get file operations instructions with language awareness
 */
function getFileOperationsInstructions(activeFilePath?: string): string {
  const baseInstructions = `FILE OPERATIONS FORMAT:
Use this exact format for file operations:

\`\`\`FILE_OPS
ACTION: edit
PATH: ./relative/path/to/file.ext
CONTENT:
// Your code here - must match the target file's language
\`\`\`

Valid actions: create, edit, delete
- edit: Modify existing files (file must exist in project)
- create: Create new files (will overwrite if exists)
- delete: Remove files (file must exist)`;

  if (activeFilePath) {
    const language = detectLanguageFromPath(activeFilePath);
    const langInfo = getLanguageInfoFromPath(activeFilePath);
    
    const specificInstructions = `

ACTIVE FILE CONSTRAINTS:
- Primary target: ${activeFilePath}
- Language: ${langInfo?.name || language}
- Only edit this file unless user specifically mentions other files
- All edits must use ${langInfo?.name || language} syntax
- Preserve existing code structure and style`;

    return baseInstructions + specificInstructions + '\n';
  }

  return baseInstructions + '\n';
}

/**
 * Get anti-hallucination instructions with enhanced file awareness
 */
function getAntiHallucinationInstructions(): string {
  return `CRITICAL RULES - FOLLOW STRICTLY:
1. FILE EXISTENCE: Only modify files that exist in the [PROJECT_FILES] list
2. LANGUAGE CONSISTENCY: Never change the programming language of existing files
3. PATH VALIDATION: Only use relative paths within the project
4. ACTIVE FILE PRIORITY: Focus on the [ACTIVE_FILE] unless user specifies otherwise
5. NO INVENTION: Do not create variables, functions, or imports that don't exist
6. SYNTAX VALIDATION: Ensure all code follows the target file's language syntax
7. ASK WHEN UNCERTAIN: If unsure about file structure or existence, ask the user

FORBIDDEN ACTIONS:
❌ Editing files not in the project files list
❌ Changing file extensions or language types
❌ Using absolute paths or paths outside project
❌ Mixing different programming languages in the same file
❌ Creating imports for non-existent modules
❌ Assuming file contents without seeing them in context

`;
}

/**
 * Format code context chunks into a readable string
 */
function formatCodeContext(contextChunks: ContextChunk[]): string {
  if (contextChunks.length === 0) {
    return '';
  }

  return contextChunks
    .map((chunk, index) => {
      const lineInfo = chunk.lineStart && chunk.lineEnd 
        ? ` (lines ${chunk.lineStart}-${chunk.lineEnd})` 
        : '';
      
      const relevanceInfo = chunk.relevanceScore 
        ? ` [relevance: ${chunk.relevanceScore.toFixed(2)}]` 
        : '';

      const language = detectLanguageFromPath(chunk.filePath);

      return `File: ${chunk.filePath}${lineInfo}${relevanceInfo}
\`\`\`${language}
${chunk.content}
\`\`\``;
    })
    .join('\n\n');
}

/**
 * Utility function to validate prompt inputs
 */
export function validatePromptInputs(
  mode: PromptMode,
  userMessage: string,
  contextChunks: ContextChunk[] = []
): void {
  if (!mode || !['ask', 'agent'].includes(mode)) {
    throw new Error('Invalid prompt mode. Must be "ask" or "agent"');
  }

  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
    throw new Error('User message is required and must be a non-empty string');
  }

  if (!Array.isArray(contextChunks)) {
    throw new Error('Context chunks must be an array');
  }

  // Validate context chunks
  contextChunks.forEach((chunk, index) => {
    if (!chunk.filePath || typeof chunk.filePath !== 'string') {
      throw new Error(`Context chunk ${index}: filePath is required and must be a string`);
    }
    if (!chunk.content || typeof chunk.content !== 'string') {
      throw new Error(`Context chunk ${index}: content is required and must be a string`);
    }
  });
}

/**
 * Enhanced buildPrompt with validation
 */
export function buildPromptSafe(
  mode: PromptMode,
  userMessage: string,
  contextChunks: ContextChunk[] = [],
  options: PromptOptions = {}
): string {
  validatePromptInputs(mode, userMessage, contextChunks);
  return buildPrompt(mode, userMessage, contextChunks, options);
}

/**
 * Validate that a proposed file operation is compatible with existing files
 */
export function validateFileOperationLanguage(
  targetPath: string,
  sourceContent: string,
  existingFiles: string[]
): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check if target file exists
  const fileExists = existingFiles.includes(targetPath);
  const targetLanguage = detectLanguageFromPath(targetPath);
  const targetLangInfo = getLanguageInfoFromPath(targetPath);

  if (!targetLangInfo) {
    warnings.push(`Unknown file type: ${targetPath}`);
  }

  // If file exists, ensure language compatibility
  if (fileExists) {
    // Additional validation could be added here
    // For example, checking if the content matches the expected language syntax
  }

  // Check for potential language conflicts in the content
  if (sourceContent.includes('```')) {
    const codeBlocks = sourceContent.match(/```(\w+)/g);
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const blockLang = block.replace('```', '');
        if (blockLang !== targetLanguage && !areLanguagesCompatible(`.${blockLang}`, targetPath)) {
          warnings.push(`Code block language (${blockLang}) may not match target file (${targetLanguage})`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
} 