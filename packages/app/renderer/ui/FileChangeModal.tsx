import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, FileText, Plus, Trash2, Edit3, AlertTriangle, XCircle } from 'lucide-react';
import { FileOp } from '../agent/chat/fileOpsParser';
import { AgentClient } from '../agent';

export interface FileChangeApproval {
  fileOp: FileOp;
  approved: boolean;
  reason?: string;
}

export interface FileChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileOperations: FileOp[];
  operationErrors?: string[];
  operationWarnings?: string[];
  onApprove: (approvals: FileChangeApproval[]) => Promise<void>;
  onApproveAll: () => Promise<void>;
  onRejectAll: () => void;
  isApplying?: boolean;
}

interface FileChangePreview {
  fileOp: FileOp;
  originalContent: string | null;
  newContent: string;
  diffText: string;
  fileExists: boolean;
  validationError?: string;
  validationWarning?: string;
}

interface FileValidationStatus {
  exists: boolean;
  isValid: boolean;
  error?: string;
  warning?: string;
}

export const FileChangeModal: React.FC<FileChangeModalProps> = ({
  isOpen,
  onClose,
  fileOperations,
  operationErrors = [],
  operationWarnings = [],
  onApprove,
  onApproveAll,
  onRejectAll,
  isApplying = false
}) => {
  const [selectedFile, setSelectedFile] = useState<number>(0);
  const [approvals, setApprovals] = useState<Map<string, boolean>>(new Map());
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(true);
  const [previews, setPreviews] = useState<FileChangePreview[]>([]);

  // Validate file operations using agent client
  const validateFileOperation = async (fileOp: FileOp): Promise<FileValidationStatus> => {
    try {
      const agentClient = new AgentClient();
      
      // Check if file exists by trying to read it
      let fileExists = false;
      try {
        const content = await agentClient.readFileContent(fileOp.path);
        fileExists = content !== null;
      } catch (error) {
        fileExists = false;
      }

      // Basic project path validation
      const isWithinProject = isValidProjectPath(fileOp.path);
      if (!isWithinProject) {
        return {
          exists: false,
          isValid: false,
          error: 'File path is outside project root or uses invalid path'
        };
      }

      switch (fileOp.action) {
        case 'edit':
        case 'delete':
          if (!fileExists) {
            return {
              exists: false,
              isValid: false,
              error: `Cannot ${fileOp.action} file that does not exist`
            };
          }
          return { exists: true, isValid: true };

        case 'create':
          if (fileExists) {
            return {
              exists: true,
              isValid: true,
              warning: 'File already exists - will be overwritten'
            };
          }
          return { exists: false, isValid: true };

        default:
          return {
            exists: fileExists,
            isValid: false,
            error: `Unknown action: ${fileOp.action}`
          };
      }
    } catch (error) {
      return {
        exists: false,
        isValid: false,
        error: `Validation error: ${error}`
      };
    }
  };

  // Basic project path validation
  const isValidProjectPath = (filePath: string): boolean => {
    // Reject absolute paths
    if (filePath.startsWith('/') || filePath.includes(':\\')) {
      return false;
    }
    // Reject paths that try to escape the project directory
    if (filePath.includes('..')) {
      return false;
    }
    // Reject empty or invalid paths
    if (!filePath || filePath.trim().length === 0) {
      return false;
    }
    return true;
  };

  // Load file previews with diffs
  React.useEffect(() => {
    if (!isOpen || fileOperations.length === 0) return;

    const loadPreviews = async () => {
      setIsLoadingPreviews(true);
      const newPreviews: FileChangePreview[] = [];

      for (const fileOp of fileOperations) {
        try {
          let originalContent = '';
          let newContent = fileOp.content || '';
          
          // Validate the file operation
          const validation = await validateFileOperation(fileOp);
          
          // For edit operations, try to read the existing file
          if (fileOp.action === 'edit' && validation.exists) {
            try {
              const existingContent = await window.api?.readNote(fileOp.path);
              originalContent = existingContent || '';
            } catch (error) {
              console.warn(`Could not read existing file ${fileOp.path}:`, error);
            }
          }

          // Generate diff text
          let diffText = '';
          if (fileOp.action === 'create') {
            diffText = `--- /dev/null\n+++ ${fileOp.path}\n@@ -0,0 +1,${newContent.split('\n').length} @@\n${newContent.split('\n').map(line => `+${line}`).join('\n')}`;
          } else if (fileOp.action === 'edit') {
            diffText = generateUnifiedDiff(originalContent, newContent, fileOp.path);
          } else if (fileOp.action === 'delete') {
            diffText = `--- ${fileOp.path}\n+++ /dev/null\n@@ -1,${originalContent.split('\n').length} +0,0 @@\n${originalContent.split('\n').map(line => `-${line}`).join('\n')}`;
          }

          newPreviews.push({
            fileOp,
            originalContent: fileOp.action === 'delete' ? originalContent : null,
            newContent,
            diffText,
            fileExists: validation.exists,
            validationError: validation.error,
            validationWarning: validation.warning
          });
        } catch (error) {
          console.error(`Error generating preview for ${fileOp.path}:`, error);
          newPreviews.push({
            fileOp,
            originalContent: null,
            newContent: fileOp.content || '',
            diffText: `Error: Could not generate preview - ${error}`,
            fileExists: false,
            validationError: `Preview generation failed: ${error}`
          });
        }
      }

      setPreviews(newPreviews);
      setIsLoadingPreviews(false);
    };

    loadPreviews();
  }, [isOpen, fileOperations]);

  // Generate unified diff
  const generateUnifiedDiff = (oldStr: string, newStr: string, filename: string): string => {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    
    // Simple diff generation - in production, you'd use a proper diff library
    const header = `--- ${filename}\n+++ ${filename}\n@@ -1,${oldLines.length} +1,${newLines.length} @@`;
    const removedLines = oldLines.map(line => `-${line}`).join('\n');
    const addedLines = newLines.map(line => `+${line}`).join('\n');
    
    return `${header}\n${removedLines}\n${addedLines}`;
  };

  // Handle individual file approval
  const handleFileApproval = (filePath: string, approved: boolean) => {
    const newApprovals = new Map(approvals);
    newApprovals.set(filePath, approved);
    setApprovals(newApprovals);
  };

  // Handle approve only valid edits
  const handleApproveValidOnly = async () => {
    const validApprovals: FileChangeApproval[] = fileOperations
      .map((fileOp, index) => {
        const preview = previews[index];
        const isValid = !preview?.validationError;
        return {
          fileOp,
          approved: isValid,
          reason: isValid ? 'Valid operation auto-approved' : `Rejected: ${preview?.validationError}`
        };
      });

    await onApprove(validApprovals);
  };

  // Handle approve selected
  const handleApproveSelected = async () => {
    const selectedApprovals: FileChangeApproval[] = fileOperations.map(fileOp => ({
      fileOp,
      approved: approvals.get(fileOp.path) ?? false,
      reason: approvals.get(fileOp.path) ? 'User approved' : 'User rejected'
    }));

    await onApprove(selectedApprovals);
  };

  // Get file status display
  const getFileStatusBadge = (preview: FileChangePreview) => {
    if (preview.validationError) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
          <XCircle className="w-3 h-3 mr-1" />
          Invalid
        </span>
      );
    }
    
    if (preview.validationWarning) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Warning
        </span>
      );
    }

    if (preview.fileOp.action === 'create' && !preview.fileExists) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
          <Plus className="w-3 h-3 mr-1" />
          New File
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
        <Check className="w-3 h-3 mr-1" />
        Valid
      </span>
    );
  };

  // Get icon for file operation
  const getOperationIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="w-4 h-4 text-green-500" />;
      case 'edit': return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Get operation color
  const getOperationColor = (action: string, hasError: boolean = false) => {
    if (hasError) return 'border-red-200 bg-red-50';
    
    switch (action) {
      case 'create': return 'border-green-200 bg-green-50';
      case 'edit': return 'border-blue-200 bg-blue-50';
      case 'delete': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  const currentPreview = previews[selectedFile];
  const approvedCount = Array.from(approvals.values()).filter(Boolean).length;
  const hasSelections = approvals.size > 0;
  const validOperationsCount = previews.filter(p => !p.validationError).length;
  const invalidOperationsCount = previews.filter(p => p.validationError).length;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 h-5/6 max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preview & Approve File Changes
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({validOperationsCount} valid, {invalidOperationsCount} invalid)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRejectAll}
              disabled={isApplying}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Reject All
            </button>
            {validOperationsCount > 0 && (
              <button
                onClick={handleApproveValidOnly}
                disabled={isApplying}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Apply All Valid ({validOperationsCount})
              </button>
            )}
            <button
              onClick={onApproveAll}
              disabled={isApplying || invalidOperationsCount > 0}
              className="px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Approve All
            </button>
            <button
              onClick={handleApproveSelected}
              disabled={isApplying || !hasSelections}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Apply Selected ({approvedCount})
            </button>
            <button
              onClick={onClose}
              disabled={isApplying}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation Summary */}
        {(operationErrors.length > 0 || operationWarnings.length > 0) && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
            {operationErrors.length > 0 && (
              <div className="mb-2">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Errors:</h4>
                <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                  {operationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {operationWarnings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">Warnings:</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  {operationWarnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* File List Sidebar */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                File Operations ({fileOperations.length})
              </h3>
              <div className="space-y-2">
                {fileOperations.map((fileOp, index) => {
                  const preview = previews[index];
                  const isSelected = selectedFile === index;
                  const isApproved = approvals.get(fileOp.path) ?? false;
                  const hasError = preview?.validationError;

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedFile(index)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : getOperationColor(fileOp.action, !!hasError)
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1">
                          {getOperationIcon(fileOp.action)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {fileOp.path}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {fileOp.action}
                            </p>
                            {preview && (
                              <div className="mt-1">
                                {getFileStatusBadge(preview)}
                              </div>
                            )}
                            {preview?.validationError && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {preview.validationError}
                              </p>
                            )}
                            {preview?.validationWarning && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                {preview.validationWarning}
                              </p>
                            )}
                          </div>
                        </div>
                        {!hasError && (
                          <input
                            type="checkbox"
                            checked={isApproved}
                            onChange={(e) => handleFileApproval(fileOp.path, e.target.checked)}
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diff Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isLoadingPreviews ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">Loading previews...</div>
              </div>
            ) : currentPreview ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* File Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    {getOperationIcon(currentPreview.fileOp.action)}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentPreview.fileOp.path}
                    </span>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${currentPreview.fileOp.action === 'create' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        currentPreview.fileOp.action === 'edit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }
                    `}>
                      {currentPreview.fileOp.action}
                    </span>
                  </div>
                </div>

                {/* Diff Content */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
                  {currentPreview.fileOp.action === 'delete' ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="text-red-800 dark:text-red-300 font-medium mb-2">
                        This file will be deleted
                      </div>
                      <pre className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">
                        {currentPreview.originalContent}
                      </pre>
                    </div>
                  ) : currentPreview.fileOp.action === 'edit' && currentPreview.originalContent !== null ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-4">Changes Preview</div>
                        <div className="space-y-4">
                          {/* Before */}
                          <div className="border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 border-b border-red-200 dark:border-red-800">
                              <span className="text-sm font-medium text-red-800 dark:text-red-300">- Before</span>
                            </div>
                            <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono p-3 max-h-64 overflow-auto">
                              {currentPreview.originalContent}
                            </pre>
                          </div>
                          {/* After */}
                          <div className="border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 border-b border-green-200 dark:border-green-800">
                              <span className="text-sm font-medium text-green-800 dark:text-green-300">+ After</span>
                            </div>
                            <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono p-3 max-h-64 overflow-auto">
                              {currentPreview.newContent}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {currentPreview.fileOp.action === 'create' ? 'New File Content' : 'File Content'}
                      </div>
                      <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono">
                        {currentPreview.newContent}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">Select a file to preview</div>
              </div>
            )}
          </div>
        </div>

        {isApplying && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-900 dark:text-white">Applying changes...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}; 