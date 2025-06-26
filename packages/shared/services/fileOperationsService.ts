import { FileOp } from '../../app/renderer/agent/chat/fileOpsParser';
import { FileChangeApproval } from '../../app/renderer/ui/FileChangeModal';

export interface FileOperationResult {
  success: boolean;
  filePath: string;
  action: string;
  error?: string;
  timestamp: Date;
}

export interface FileOperationLog {
  timestamp: Date;
  userId: string;
  sessionId: string;
  operations: FileOperationResult[];
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
}

export class FileOperationsService {
  private static readonly LOG_FILE_PATH = 'logs/agent-actions.log';
  
  /**
   * Apply approved file operations
   */
  static async applyFileOperations(approvals: FileChangeApproval[]): Promise<FileOperationResult[]> {
    const results: FileOperationResult[] = [];
    
    for (const approval of approvals) {
      if (!approval.approved) {
        results.push({
          success: false,
          filePath: approval.fileOp.path,
          action: approval.fileOp.action,
          error: 'Operation rejected by user',
          timestamp: new Date()
        });
        continue;
      }
      
      try {
        const result = await this.executeFileOperation(approval.fileOp);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          filePath: approval.fileOp.path,
          action: approval.fileOp.action,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }
    
    // Log the operations
    await this.logOperations(results);
    
    return results;
  }
  
  /**
   * Execute a single file operation
   */
  private static async executeFileOperation(fileOp: FileOp): Promise<FileOperationResult> {
    const timestamp = new Date();
    
    try {
      switch (fileOp.action) {
        case 'create':
          if (!fileOp.content) {
            throw new Error('Create operation requires content');
          }
          const createResult = await window.api?.createNote(fileOp.path, fileOp.content);
          if (!createResult) {
            throw new Error('Failed to create file');
          }
          break;
          
        case 'edit':
          if (!fileOp.content) {
            throw new Error('Edit operation requires content');
          }
          const editResult = await window.api?.writeNote(fileOp.path, fileOp.content);
          if (!editResult) {
            throw new Error('Failed to write file');
          }
          break;
          
        case 'delete':
          const deleteResult = await window.api?.deleteNote(fileOp.path);
          if (!deleteResult) {
            throw new Error('Failed to delete file');
          }
          break;
          
        default:
          throw new Error(`Unknown operation: ${fileOp.action}`);
      }
      
      return {
        success: true,
        filePath: fileOp.path,
        action: fileOp.action,
        timestamp
      };
    } catch (error) {
      return {
        success: false,
        filePath: fileOp.path,
        action: fileOp.action,
        error: error instanceof Error ? error.message : String(error),
        timestamp
      };
    }
  }
  
  /**
   * Log operations to the agent actions log file
   */
  private static async logOperations(results: FileOperationResult[]): Promise<void> {
    try {
      const successfulOperations = results.filter(r => r.success).length;
      const failedOperations = results.length - successfulOperations;
      
      const logEntry: FileOperationLog = {
        timestamp: new Date(),
        userId: 'user', // Could be enhanced to get actual user ID
        sessionId: this.generateSessionId(),
        operations: results,
        totalOperations: results.length,
        successfulOperations,
        failedOperations
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Try to append to log file using IPC
      if (window.electronAPI?.fs?.writeFile) {
        // Read existing log content
        let existingContent = '';
        try {
          const existingResult = await window.electronAPI.fs.readFile(this.LOG_FILE_PATH);
          if (existingResult.success && existingResult.data) {
            existingContent = existingResult.data;
          }
        } catch (error) {
          // Log file doesn't exist yet, which is fine
        }
        
        // Append new log entry
        const newContent = existingContent + logLine;
        await window.electronAPI.fs.writeFile(this.LOG_FILE_PATH, newContent);
      } else {
        console.warn('Cannot access filesystem API for logging');
        console.log('File operations log:', logEntry);
      }
    } catch (error) {
      console.error('Failed to log file operations:', error);
    }
  }
  
  /**
   * Generate a unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Read the agent actions log
   */
  static async readOperationsLog(): Promise<FileOperationLog[]> {
    try {
      if (!window.electronAPI?.fs?.readFile) {
        return [];
      }
      
      const result = await window.electronAPI.fs.readFile(this.LOG_FILE_PATH);
      if (!result.success || !result.data) {
        return [];
      }
      
      const lines = result.data.trim().split('\n').filter(line => line.trim());
      const logs: FileOperationLog[] = [];
      
      for (const line of lines) {
        try {
          const log = JSON.parse(line) as FileOperationLog;
          logs.push(log);
        } catch (error) {
          console.warn('Failed to parse log line:', line);
        }
      }
      
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to read operations log:', error);
      return [];
    }
  }
  
  /**
   * Get operation statistics
   */
  static async getOperationStats(): Promise<{
    totalSessions: number;
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    lastOperationTime?: Date;
  }> {
    const logs = await this.readOperationsLog();
    
    let totalOperations = 0;
    let successfulOperations = 0;
    let failedOperations = 0;
    let lastOperationTime: Date | undefined;
    
    for (const log of logs) {
      totalOperations += log.totalOperations;
      successfulOperations += log.successfulOperations;
      failedOperations += log.failedOperations;
      
      if (!lastOperationTime || new Date(log.timestamp) > lastOperationTime) {
        lastOperationTime = new Date(log.timestamp);
      }
    }
    
    return {
      totalSessions: logs.length,
      totalOperations,
      successfulOperations,
      failedOperations,
      lastOperationTime
    };
  }
} 