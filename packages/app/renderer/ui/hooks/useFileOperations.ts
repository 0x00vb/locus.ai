import { useState, useCallback } from 'react';
import { FileOp } from '../../agent/chat/fileOpsParser';
import { FileChangeApproval } from '../FileChangeModal';
import { FileOperationsService, FileOperationResult } from '../../../../shared/services/fileOperationsService';

export interface UseFileOperationsReturn {
  showModal: boolean;
  isApplying: boolean;
  fileOperations: FileOp[];
  operationResults: FileOperationResult[];
  openModal: (operations: FileOp[]) => void;
  closeModal: () => void;
  handleApprove: (approvals: FileChangeApproval[]) => Promise<void>;
  handleApproveAll: () => Promise<void>;
  handleRejectAll: () => void;
  clearResults: () => void;
}

export const useFileOperations = (): UseFileOperationsReturn => {
  const [showModal, setShowModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [fileOperations, setFileOperations] = useState<FileOp[]>([]);
  const [operationResults, setOperationResults] = useState<FileOperationResult[]>([]);

  const openModal = useCallback((operations: FileOp[]) => {
    setFileOperations(operations);
    setShowModal(true);
    setOperationResults([]);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setFileOperations([]);
    setIsApplying(false);
  }, []);

  const handleApprove = useCallback(async (approvals: FileChangeApproval[]) => {
    setIsApplying(true);
    try {
      const results = await FileOperationsService.applyFileOperations(approvals);
      setOperationResults(results);
      
      // Show results briefly, then close modal
      setTimeout(() => {
        setShowModal(false);
        setIsApplying(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to apply file operations:', error);
      setIsApplying(false);
    }
  }, []);

  const handleApproveAll = useCallback(async () => {
    const allApprovals: FileChangeApproval[] = fileOperations.map(fileOp => ({
      fileOp,
      approved: true,
      reason: 'User approved all'
    }));
    
    await handleApprove(allApprovals);
  }, [fileOperations, handleApprove]);

  const handleRejectAll = useCallback(() => {
    setShowModal(false);
    setFileOperations([]);
    setIsApplying(false);
  }, []);

  const clearResults = useCallback(() => {
    setOperationResults([]);
  }, []);

  return {
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
  };
}; 