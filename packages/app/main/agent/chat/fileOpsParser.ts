import { ProjectPaths } from '../fs/projectPaths';
import { detectLanguageFromPath, getLanguageInfoFromPath, areLanguagesCompatible } from '../utils/langDetect';

// Custom path utilities to replace Node.js path module
class PathUtils {
  static join(...parts: string[]): string {
    return parts
      .filter(part => part && part.length > 0)
      .map(part => part.replace(/[/\\]+$/, '')) // Remove trailing slashes
      .join('/')
      .replace(/\/+/g, '/'); // Replace multiple slashes with single slash
  }

  static normalize(filePath: string): string {
    const parts = filePath.split('/').filter(part => part && part !== '.');
    const normalizedParts: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        if (normalizedParts.length > 0) {
          normalizedParts.pop();
        }
      } else {
        normalizedParts.push(part);
      }
    }
    
    return normalizedParts.join('/');
  }

  static extname(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    
    if (lastDot > lastSlash && lastDot !== -1) {
      return filePath.slice(lastDot);
    }
    return '';
  }
}

export interface FileOp {
  path: string;
  action: "edit" | "create" | "delete";
  content?: string;
}

export interface ParseResult {
  operations: FileOp[];
  errors: string[];
  warnings: string[];
  rawBlock?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  exists: boolean;
  error?: string;
  warning?: string;
  languageMismatch?: boolean;
  expectedLanguage?: string;
  detectedLanguage?: string;
}

export class FileOpsParser {
  private static readonly FILE_OPS_START = '```FILE_OPS';
  private static readonly FILE_OPS_END = '```';
  private static readonly OPERATION_SEPARATORS = ['---', '===', '###'];
  
  /**
   * Parse agent response and extract file operations
   */
  static async parseResponse(response: string): Promise<ParseResult> {
    const result: ParseResult = {
      operations: [],
      errors: [],
      warnings: []
    };

    try {
      // Extract FILE_OPS block
      const fileOpsBlock = this.extractFileOpsBlock(response);
      if (!fileOpsBlock) {
        return result; // No FILE_OPS block found
      }

      result.rawBlock = fileOpsBlock;

      // Parse operations from the block
      const operations = this.parseOperations(fileOpsBlock);
      
      // Validate and sanitize each operation
      for (const op of operations) {
        try {
          const validatedOp = this.validateAndSanitizeOperation(op);
          
          // NEW: Validate file existence and conflicts (now async)
          const fileValidation = await this.validateFileOperation(validatedOp);
          
          if (fileValidation.isValid) {
            result.operations.push(validatedOp);
            if (fileValidation.warning) {
              result.warnings.push(`${validatedOp.path}: ${fileValidation.warning}`);
            }
          } else {
            result.errors.push(`${validatedOp.path}: ${fileValidation.error || 'Invalid file operation'}`);
          }
        } catch (error) {
          result.errors.push(`Invalid operation: ${error}`);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Parse error: ${error}`);
      return result;
    }
  }

  /**
   * Extract the FILE_OPS block from the response
   */
  private static extractFileOpsBlock(response: string): string | null {
    const startIdx = response.indexOf(this.FILE_OPS_START);
    if (startIdx === -1) {
      return null;
    }

    const contentStart = startIdx + this.FILE_OPS_START.length;
    const endIdx = response.indexOf(this.FILE_OPS_END, contentStart);
    
    if (endIdx === -1) {
      throw new Error('Unclosed FILE_OPS block');
    }

    return response.slice(contentStart, endIdx).trim();
  }

  /**
   * Parse individual operations from the FILE_OPS block
   */
  private static parseOperations(block: string): Partial<FileOp>[] {
    const operations: Partial<FileOp>[] = [];
    
    // Split by operation separators or by double newlines
    const sections = this.splitIntoSections(block);
    
    for (const section of sections) {
      if (section.trim().length === 0) continue;
      
      try {
        const operation = this.parseOperation(section);
        if (operation) {
          operations.push(operation);
        }
      } catch (error) {
        // Continue parsing other operations even if one fails
        console.warn(`Failed to parse operation section: ${error}`);
      }
    }

    return operations;
  }

  /**
   * Split block into individual operation sections
   */
  private static splitIntoSections(block: string): string[] {
    // Try splitting by separators first
    for (const separator of this.OPERATION_SEPARATORS) {
      if (block.includes(separator)) {
        return block.split(separator).filter(s => s.trim().length > 0);
      }
    }

    // Fall back to splitting by double newlines
    return block.split(/\n\s*\n/).filter(s => s.trim().length > 0);
  }

  /**
   * Parse a single operation section
   */
  private static parseOperation(section: string): Partial<FileOp> | null {
    const lines = section.trim().split('\n');
    const operation: Partial<FileOp> = {};

    // Look for operation indicators
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Match patterns like:
      // ACTION: edit src/components/MyComponent.tsx
      // EDIT: src/components/MyComponent.tsx
      // CREATE: src/utils/helper.ts
      // DELETE: src/old-file.js
      const actionMatch = trimmedLine.match(/^(ACTION|EDIT|CREATE|DELETE):\s*(.+)$/i);
      if (actionMatch) {
        const actionType = actionMatch[1].toLowerCase();
        operation.path = actionMatch[2].trim();
        
        if (actionType === 'action') {
          // Need to determine action from context
          operation.action = this.inferAction(section);
        } else {
          operation.action = actionType as "edit" | "create" | "delete";
        }
        break;
      }

      // Match patterns like:
      // File: src/components/MyComponent.tsx (edit)
      // Path: src/utils/helper.ts (create)
      const fileMatch = trimmedLine.match(/^(FILE|PATH):\s*(.+?)\s*\((\w+)\)$/i);
      if (fileMatch) {
        operation.path = fileMatch[2].trim();
        operation.action = fileMatch[3].toLowerCase() as "edit" | "create" | "delete";
        break;
      }

      // Match simple patterns like:
      // src/components/MyComponent.tsx
      // When followed by content
      const pathMatch = trimmedLine.match(/^([a-zA-Z0-9_\-\/\.]+\.(ts|tsx|js|jsx|json|md|txt|css|scss|html|py|java|go|rs|php|rb|kt|swift))$/);
      if (pathMatch && !operation.path) {
        operation.path = pathMatch[1];
        operation.action = this.inferAction(section);
        break;
      }
    }

    if (!operation.path) {
      return null; // Invalid operation without path
    }

    // Extract content for edit/create operations
    if (operation.action === 'edit' || operation.action === 'create') {
      operation.content = this.extractContent(section);
    }

    return operation;
  }

  /**
   * Infer action type from operation context
   */
  private static inferAction(section: string): "edit" | "create" | "delete" {
    const lowerSection = section.toLowerCase();
    
    if (lowerSection.includes('delete') || lowerSection.includes('remove')) {
      return 'delete';
    }
    
    if (lowerSection.includes('create') || lowerSection.includes('new')) {
      return 'create';
    }
    
    // Default to edit
    return 'edit';
  }

  /**
   * Extract content from operation section
   */
  private static extractContent(section: string): string {
    const lines = section.split('\n');
    const contentLines: string[] = [];
    let inContent = false;
    let codeBlockStarted = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip operation declaration lines
      if (trimmedLine.match(/^(ACTION|EDIT|CREATE|DELETE|FILE|PATH):/i)) {
        continue;
      }

      // Detect code block start
      if (trimmedLine.startsWith('```')) {
        codeBlockStarted = !codeBlockStarted;
        inContent = codeBlockStarted;
        continue;
      }

      // If we're in a code block, capture everything
      if (codeBlockStarted) {
        contentLines.push(line);
        continue;
      }

      // If not in code block, look for content indicators
      if (!inContent && trimmedLine.length > 0 && !trimmedLine.match(/^(ACTION|EDIT|CREATE|DELETE|FILE|PATH):/i)) {
        inContent = true;
      }

      if (inContent) {
        contentLines.push(line);
      }
    }

    return contentLines.join('\n').trim();
  }

  /**
   * Validate and sanitize a parsed operation
   */
  private static validateAndSanitizeOperation(op: Partial<FileOp>): FileOp {
    if (!op.path) {
      throw new Error('Missing file path');
    }

    if (!op.action) {
      throw new Error('Missing action type');
    }

    if (!['edit', 'create', 'delete'].includes(op.action)) {
      throw new Error(`Invalid action: ${op.action}`);
    }

    // Sanitize file path
    const sanitizedPath = this.sanitizePath(op.path);
    
    // Validate required content for edit/create operations
    if ((op.action === 'edit' || op.action === 'create') && !op.content) {
      throw new Error(`${op.action} operation requires content`);
    }

    return {
      path: sanitizedPath,
      action: op.action,
      content: op.content
    };
  }

  /**
   * Sanitize file path to prevent directory traversal and other security issues
   */
  private static sanitizePath(filePath: string): string {
    // Remove any leading/trailing whitespace
    let sanitized = filePath.trim();

    // Remove quotes if wrapped
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) ||
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
      sanitized = sanitized.slice(1, -1);
    }

    // Normalize path separators
    sanitized = sanitized.replace(/\\/g, '/');

    // Remove leading slashes to make it relative
    sanitized = sanitized.replace(/^\/+/, '');

    // Resolve relative path components
    const parts = sanitized.split('/');
    const resolvedParts: string[] = [];

    for (const part of parts) {
      if (part === '' || part === '.') {
        continue; // Skip empty or current directory
      }
      
      if (part === '..') {
        // Prevent directory traversal above project root
        if (resolvedParts.length > 0) {
          resolvedParts.pop();
        }
        continue;
      }

      // Validate part doesn't contain dangerous characters
      if (part.match(/[<>:"|?*\x00-\x1f]/)) {
        throw new Error(`Invalid characters in path component: ${part}`);
      }

      resolvedParts.push(part);
    }

    const result = resolvedParts.join('/');

    // Ensure we have a valid file path
    if (result.length === 0) {
      throw new Error('Empty path after sanitization');
    }

    // Ensure it's not trying to access system directories
    const firstPart = resolvedParts[0]?.toLowerCase();
    const forbiddenParts = ['windows', 'system32', 'etc', 'usr', 'bin', 'boot', 'dev', 'proc', 'sys'];
    if (forbiddenParts.includes(firstPart)) {
      throw new Error(`Access to system directory not allowed: ${firstPart}`);
    }

    return result;
  }

  /**
   * Parse multiple FILE_OPS blocks from a response
   */
  static async parseMultipleBlocks(response: string): Promise<ParseResult> {
    const allResults: ParseResult = {
      operations: [],
      errors: [],
      warnings: []
    };

    let searchStart = 0;
    let blockCount = 0;

    while (true) {
      const blockStart = response.indexOf(this.FILE_OPS_START, searchStart);
      if (blockStart === -1) break;

      const contentStart = blockStart + this.FILE_OPS_START.length;
      const blockEnd = response.indexOf(this.FILE_OPS_END, contentStart);
      
      if (blockEnd === -1) {
        allResults.errors.push(`Unclosed FILE_OPS block #${blockCount + 1}`);
        break;
      }

      const blockContent = response.slice(contentStart, blockEnd).trim();
      const blockResult = await this.parseResponse(`${this.FILE_OPS_START}\n${blockContent}\n${this.FILE_OPS_END}`);
      
      allResults.operations.push(...blockResult.operations);
      allResults.errors.push(...blockResult.errors.map(err => `Block #${blockCount + 1}: ${err}`));
      allResults.warnings.push(...blockResult.warnings.map(warn => `Block #${blockCount + 1}: ${warn}`));
      
      searchStart = blockEnd + this.FILE_OPS_END.length;
      blockCount++;
    }

    return allResults;
  }

  /**
   * Validate that operations don't conflict with each other
   */
  static validateOperations(operations: FileOp[]): string[] {
    const errors: string[] = [];
    const pathOperations = new Map<string, FileOp[]>();

    // Group operations by path
    for (const op of operations) {
      if (!pathOperations.has(op.path)) {
        pathOperations.set(op.path, []);
      }
      pathOperations.get(op.path)!.push(op);
    }

    // Check for conflicts
    for (const [filePath, ops] of pathOperations) {
      if (ops.length > 1) {
        const actions = ops.map(op => op.action);
        
        // Check for conflicting operations on same file
        if (actions.includes('delete') && (actions.includes('edit') || actions.includes('create'))) {
          errors.push(`Conflicting operations on ${filePath}: delete with edit/create`);
        }
        
        if (actions.includes('create') && actions.includes('edit')) {
          errors.push(`Conflicting operations on ${filePath}: create with edit`);
        }
        
        if (actions.filter(a => a === 'create').length > 1) {
          errors.push(`Multiple create operations on ${filePath}`);
        }
      }
    }

    return errors;
  }

  /**
   * Validate file operation against file system with enhanced language checking
   */
  private static async validateFileOperation(op: FileOp): Promise<FileValidationResult> {
    try {
      const fileExists = await ProjectPaths.exists(op.path);
      const isWithinProject = ProjectPaths.isWithinProject(op.path);

      if (!isWithinProject) {
        return {
          isValid: false,
          exists: false,
          error: 'File path is outside project root'
        };
      }

      // Language detection and validation
      const expectedLanguage = detectLanguageFromPath(op.path);
      const langInfo = getLanguageInfoFromPath(op.path);
      
      // Enhanced validation based on action type
      switch (op.action) {
        case 'edit':
          if (!fileExists) {
            return {
              isValid: false,
              exists: false,
              error: 'Cannot edit file that does not exist',
              expectedLanguage
            };
          }

          // Validate content language compatibility for edits
          if (op.content && langInfo) {
            const validation = this.validateContentLanguage(op.content, expectedLanguage, langInfo.name);
            if (!validation.isValid) {
              return {
                isValid: false,
                exists: true,
                error: validation.error,
                languageMismatch: true,
                expectedLanguage,
                detectedLanguage: validation.detectedLanguage
              };
            }
            if (validation.warning) {
              return {
                isValid: true,
                exists: true,
                warning: validation.warning,
                expectedLanguage
              };
            }
          }

          return { 
            isValid: true, 
            exists: true,
            expectedLanguage
          };

        case 'delete':
          if (!fileExists) {
            return {
              isValid: false,
              exists: false,
              error: 'Cannot delete file that does not exist',
              expectedLanguage
            };
          }
          return { 
            isValid: true, 
            exists: true,
            expectedLanguage
          };

        case 'create':
          // Validate content language for new files
          if (op.content && langInfo) {
            const validation = this.validateContentLanguage(op.content, expectedLanguage, langInfo.name);
            if (!validation.isValid) {
              return {
                isValid: false,
                exists: fileExists,
                error: validation.error,
                languageMismatch: true,
                expectedLanguage,
                detectedLanguage: validation.detectedLanguage
              };
            }
          }

          if (fileExists) {
            return {
              isValid: true,
              exists: true,
              warning: 'File already exists - operation will overwrite existing file',
              expectedLanguage
            };
          }
          return { 
            isValid: true, 
            exists: false,
            expectedLanguage
          };

        default:
          return {
            isValid: false,
            exists: fileExists,
            error: `Unknown action: ${op.action}`,
            expectedLanguage
          };
      }
    } catch (error) {
      return {
        isValid: false,
        exists: false,
        error: `File validation error: ${error}`,
        expectedLanguage: detectLanguageFromPath(op.path)
      };
    }
  }

  /**
   * Validate that file content matches the expected language
   */
  private static validateContentLanguage(
    content: string,
    expectedLanguage: string,
    languageName: string
  ): {
    isValid: boolean;
    error?: string;
    warning?: string;
    detectedLanguage?: string;
  } {
    // Basic syntax validation based on language
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      return { isValid: true }; // Empty content is generally acceptable
    }

    // Check for obvious language mismatches
    const languageChecks = this.getLanguageSpecificChecks(expectedLanguage);
    
    for (const check of languageChecks) {
      const result = check(trimmedContent);
      if (result.error) {
        return {
          isValid: false,
          error: `Content doesn't match ${languageName} syntax: ${result.error}`,
          detectedLanguage: result.detectedLanguage
        };
      }
      if (result.warning) {
        return {
          isValid: true,
          warning: `Content warning for ${languageName}: ${result.warning}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get language-specific validation checks
   */
  private static getLanguageSpecificChecks(language: string): Array<(content: string) => {
    error?: string;
    warning?: string;
    detectedLanguage?: string;
  }> {
    const checks: Array<(content: string) => {
      error?: string;
      warning?: string;
      detectedLanguage?: string;
    }> = [];

    switch (language) {
      case 'typescript':
      case 'javascript':
        checks.push((content) => {
          // Check for Python-style syntax in JS/TS files
          if (content.includes('def ') || content.includes('import ') && content.includes(' from ') === false) {
            return { error: 'Contains Python syntax', detectedLanguage: 'python' };
          }
          // Check for PHP syntax
          if (content.includes('<?php') || content.includes('$')) {
            return { error: 'Contains PHP syntax', detectedLanguage: 'php' };
          }
          // Check for Java syntax
          if (content.includes('public class ') || content.includes('public static void main')) {
            return { error: 'Contains Java syntax', detectedLanguage: 'java' };
          }
          return {};
        });
        break;

      case 'python':
        checks.push((content) => {
          // Check for JS/TS syntax in Python files
          if (content.includes('function ') || content.includes('const ') || content.includes('let ')) {
            return { error: 'Contains JavaScript syntax', detectedLanguage: 'javascript' };
          }
          // Check for Java syntax
          if (content.includes('public class ') || content.includes('{') && content.includes('}')) {
            return { error: 'Contains Java-style syntax', detectedLanguage: 'java' };
          }
          return {};
        });
        break;

      case 'json':
        checks.push((content) => {
          try {
            JSON.parse(content);
            return {};
          } catch (error) {
            return { error: 'Invalid JSON syntax' };
          }
        });
        break;

      case 'css':
      case 'scss':
        checks.push((content) => {
          // Check for JS/TS syntax in CSS
          if (content.includes('function ') || content.includes('const ') || content.includes('import ')) {
            return { error: 'Contains JavaScript syntax', detectedLanguage: 'javascript' };
          }
          return {};
        });
        break;

      case 'html':
        checks.push((content) => {
          // Basic HTML structure check
          if (!content.includes('<') && !content.includes('>')) {
            return { warning: 'Content may not be valid HTML (no HTML tags found)' };
          }
          return {};
        });
        break;
    }

    return checks;
  }

  /**
   * Enhanced operation validation with language awareness
   */
  static async validateOperationLanguageCompatibility(
    operations: FileOp[],
    activeFilePath?: string
  ): Promise<string[]> {
    const errors: string[] = [];
    
    // If there's an active file, ensure operations respect its language
    if (activeFilePath) {
      const activeLanguage = detectLanguageFromPath(activeFilePath);
      const activeLangInfo = getLanguageInfoFromPath(activeFilePath);
      
      for (const op of operations) {
        if (op.path === activeFilePath) {
          // Operation targets the active file - must maintain language
          const opLanguage = detectLanguageFromPath(op.path);
          if (opLanguage !== activeLanguage) {
            errors.push(`Operation would change language of active file from ${activeLangInfo?.name || activeLanguage} to ${opLanguage}`);
          }
        } else {
          // Operation targets a different file - check if compatible or explicitly requested
          const opLanguage = detectLanguageFromPath(op.path);
          if (!areLanguagesCompatible(activeFilePath, op.path)) {
            // This could be a warning rather than error, depending on use case
            // For now, we'll allow it but could add stricter validation
          }
        }
      }
    }
    
    return errors;
  }
} 