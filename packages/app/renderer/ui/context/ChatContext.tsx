import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ChatMessage, ChatContextType, ModelInfo } from '../../agent/types';
import { chatAgent } from '../../agent/chat/agent';
import { modelManager } from '../../agent/models/modelManager';
import { FileOpsParser, FileOp, ParseResult } from '../../agent/chat/fileOpsParser';
import { FileChangeApproval } from '../FileChangeModal';

// Extended context type with file operations
interface ExtendedChatContextType extends ChatContextType {
  // File operations state
  pendingFileOperations: FileOp[];
  fileOperationErrors: string[];
  fileOperationWarnings: string[];
  showFileModal: boolean;
  
  // Active file state
  activeFilePath?: string;
  includeFileList: boolean;
  
  // Chat control
  stopChat: () => void;
  canStopChat: boolean;
  
  // File operations actions
  setPendingFileOperations: (operations: FileOp[]) => void;
  setFileOperationErrors: (errors: string[]) => void;
  setFileOperationWarnings: (warnings: string[]) => void;
  setShowFileModal: (show: boolean) => void;
  setActiveFilePath: (path?: string) => void;
  setIncludeFileList: (include: boolean) => void;
  
  // File operations handlers
  onApproveFileOperations: (approvals: FileChangeApproval[]) => Promise<void>;
  onApproveAllFileOperations: () => Promise<void>;
  onRejectAllFileOperations: () => void;
}

const ChatContext = createContext<ExtendedChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModelState] = useState<string>('');
  const [mode, setMode] = useState<'ask' | 'agent'>('agent');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // File operations state
  const [pendingFileOperations, setPendingFileOperations] = useState<FileOp[]>([]);
  const [fileOperationErrors, setFileOperationErrors] = useState<string[]>([]);
  const [fileOperationWarnings, setFileOperationWarnings] = useState<string[]>([]);
  const [showFileModal, setShowFileModal] = useState(false);
  
  // Active file state
  const [activeFilePath, setActiveFilePath] = useState<string | undefined>();
  const [includeFileList, setIncludeFileList] = useState(true);

  // Abort controller for stopping chat streams
  const [currentAbortController, setCurrentAbortController] = useState<AbortController | null>(null);

  // Initialize models on mount
  useEffect(() => {
    initializeModels();
    
    // Add listener for model updates
    const handleModelUpdate = (models: ModelInfo[]) => {
      setAvailableModels(models);
    };
    
    modelManager.addListener(handleModelUpdate);
    
    // Cleanup on unmount
    return () => {
      modelManager.removeListener(handleModelUpdate);
    };
  }, []);

  const initializeModels = async () => {
    try {
      setIsLoadingModels(true);
      
      // Initialize model manager and get available models
      const models = await modelManager.initialize();
      setAvailableModels(models);
      
      // Get saved model from localStorage or use default
      let savedModelId = modelManager.getSelectedModelId();
      
      if (!savedModelId || !models.find(m => m.id === savedModelId)) {
        // No saved model or saved model not available, get default
        const defaultModel = await modelManager.getDefaultModel();
        savedModelId = defaultModel?.id || models[0]?.id || '';
      }
      
      if (savedModelId) {
        setSelectedModelState(savedModelId);
      }
      
    } catch (error) {
      console.error('Failed to initialize models:', error);
      setError('Failed to load available models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Wrapper for setSelectedModel that persists to localStorage
  const setSelectedModel = useCallback((modelId: string) => {
    setSelectedModelState(modelId);
    modelManager.setSelectedModelId(modelId);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: string, content: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content } 
          : msg
      )
    );
  }, []);

  // Enhanced sendMessage with file operations support
  const sendMessage = useCallback(async (message: string, modelId: string, mode: 'ask' | 'agent') => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(undefined);
    
    // Clear any previous file operations
    setPendingFileOperations([]);
    setFileOperationErrors([]);
    setFileOperationWarnings([]);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message.trim(),
      timestamp: Date.now()
    };

    addMessage(userMessage);

    try {
      // Use the chat agent to get response with file awareness
      const aiMessage = await chatAgent.sendMessage({
        message: message.trim(),
        modelId,
        mode,
        activeFilePath,
        includeFileList
      });

      addMessage(aiMessage);

      // Parse the response for file operations (only in agent mode)
      if (mode === 'agent') {
        const parseResult: ParseResult = await FileOpsParser.parseResponse(aiMessage.content);
        
        if (parseResult.operations.length > 0) {
          setPendingFileOperations(parseResult.operations);
          setFileOperationErrors(parseResult.errors);
          setFileOperationWarnings(parseResult.warnings);
          setShowFileModal(true);
        } else if (parseResult.errors.length > 0) {
          // Show parse errors as warnings
          console.warn('File operation parse errors:', parseResult.errors);
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: Date.now()
      };

      addMessage(errorMessage);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, addMessage, activeFilePath, includeFileList]);

  // Enhanced sendMessageStream with file operations support
  const sendMessageStream = useCallback(async (message: string, modelId: string, mode: 'ask' | 'agent') => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(undefined);
    
    // Create abort controller for this request
    const abortController = new AbortController();
    setCurrentAbortController(abortController);
    
    // Clear any previous file operations
    setPendingFileOperations([]);
    setFileOperationErrors([]);
    setFileOperationWarnings([]);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message.trim(),
      timestamp: Date.now()
    };

    addMessage(userMessage);

    // Add an empty AI message that will be updated with streaming content
    const aiMessageId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const initialAiMessage: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };

    addMessage(initialAiMessage);

    try {
      // Use the chat agent to get response with streaming
      const aiMessage = await chatAgent.sendMessageStream({
        message: message.trim(),
        modelId,
        mode,
        activeFilePath,
        includeFileList,
        abortSignal: abortController.signal,
        onChunk: (chunk: string) => {
          // Update the message content with each chunk
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: msg.content + chunk } 
                : msg
            )
          );
        }
      });

      // Update with final content (in case there are any differences)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: aiMessage.content } 
            : msg
        )
      );

      // Parse the response for file operations (only in agent mode)
      if (mode === 'agent') {
        const parseResult: ParseResult = await FileOpsParser.parseResponse(aiMessage.content);
        
        if (parseResult.operations.length > 0) {
          setPendingFileOperations(parseResult.operations);
          setFileOperationErrors(parseResult.errors);
          setFileOperationWarnings(parseResult.warnings);
          setShowFileModal(true);
        } else if (parseResult.errors.length > 0) {
          // Show parse errors as warnings
          console.warn('File operation parse errors:', parseResult.errors);
        }
      }

    } catch (error) {
      console.error('Failed to send message with streaming:', error);
      
      // Check if the error was due to abortion
      if (error instanceof Error && (error.message.includes('aborted') || error.message.includes('cancelled'))) {
        // Update the AI message with cancellation notice
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: msg.content + '\n\n_[Response was stopped by user]_' } 
              : msg
          )
        );
      } else {
        // Update the AI message with error content
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: 'Sorry, I encountered an error while processing your request. Please try again.' } 
              : msg
          )
        );
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
      setCurrentAbortController(null);
    }
  }, [isLoading, addMessage, setMessages, activeFilePath, includeFileList]);

  // Function to stop the current chat stream
  const stopChat = useCallback(() => {
    if (currentAbortController) {
      currentAbortController.abort();
      setCurrentAbortController(null);
    }
  }, [currentAbortController]);

  // File operations handlers
  const onApproveFileOperations = useCallback(async (approvals: FileChangeApproval[]) => {
    try {
      setIsLoading(true);
      
      const approvedOperations = approvals.filter(approval => approval.approved);
      
      if (approvedOperations.length === 0) {
        setShowFileModal(false);
        return;
      }

      // Apply the approved operations via IPC
      for (const approval of approvedOperations) {
        const { fileOp } = approval;
        
        try {
          switch (fileOp.action) {
            case 'create':
            case 'edit':
              if (window.api?.writeNote) {
                await window.api.writeNote(fileOp.path, fileOp.content || '');
              }
              break;
            case 'delete':
              if (window.api?.deleteNote) {
                await window.api.deleteNote(fileOp.path);
              }
              break;
          }
        } catch (operationError) {
          console.error(`Failed to apply operation on ${fileOp.path}:`, operationError);
          // Continue with other operations even if one fails
        }
      }

      // Add confirmation message
      const confirmationMessage: ChatMessage = {
        id: `confirmation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: `✅ Applied ${approvedOperations.length} file operation(s) successfully.`,
        timestamp: Date.now()
      };

      addMessage(confirmationMessage);
      
    } catch (error) {
      console.error('Failed to apply file operations:', error);
      setError('Failed to apply file operations');
    } finally {
      setIsLoading(false);
      setShowFileModal(false);
      setPendingFileOperations([]);
      setFileOperationErrors([]);
      setFileOperationWarnings([]);
    }
  }, [addMessage]);

  const onApproveAllFileOperations = useCallback(async () => {
    const allApprovals: FileChangeApproval[] = pendingFileOperations.map(fileOp => ({
      fileOp,
      approved: true,
      reason: 'Approved all operations'
    }));
    
    await onApproveFileOperations(allApprovals);
  }, [pendingFileOperations, onApproveFileOperations]);

  const onRejectAllFileOperations = useCallback(() => {
    setShowFileModal(false);
    setPendingFileOperations([]);
    setFileOperationErrors([]);
    setFileOperationWarnings([]);
    
    // Add rejection message
    const rejectionMessage: ChatMessage = {
      id: `rejection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: '❌ All file operations were rejected.',
      timestamp: Date.now()
    };

    addMessage(rejectionMessage);
  }, [addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(undefined);
  }, []);

  const setLoadingWrapper = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setErrorWrapper = useCallback((err?: string) => {
    setError(err);
  }, []);

  // Refresh models manually
  const refreshModels = useCallback(async () => {
    try {
      setIsLoadingModels(true);
      const models = await modelManager.refreshModels();
      setAvailableModels(models);
      
      // Check if currently selected model is still available
      if (selectedModel && !models.find(m => m.id === selectedModel)) {
        const defaultModel = await modelManager.getDefaultModel();
        if (defaultModel) {
          setSelectedModel(defaultModel.id);
        }
      }
    } catch (error) {
      console.error('Failed to refresh models:', error);
      setError('Failed to refresh models');
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel, setSelectedModel]);

  const contextValue: ExtendedChatContextType = {
    // State
    messages,
    isLoading,
    selectedModel,
    mode,
    availableModels,
    error,
    isLoadingModels,
    
    // File operations state
    pendingFileOperations,
    fileOperationErrors,
    fileOperationWarnings,
    showFileModal,
    
    // Active file state
    activeFilePath,
    includeFileList,
    
    // Actions
    sendMessage,
    sendMessageStream,
    addMessage,
    updateMessage,
    clearMessages,
    setSelectedModel,
    setMode,
    setLoading: setLoadingWrapper,
    setError: setErrorWrapper,
    refreshModels,
    
    // File operations actions
    setPendingFileOperations,
    setFileOperationErrors,
    setFileOperationWarnings,
    setShowFileModal,
    setActiveFilePath,
    setIncludeFileList,
    
    // File operations handlers
    onApproveFileOperations,
    onApproveAllFileOperations,
    onRejectAllFileOperations,
    
    // Chat control
    stopChat,
    canStopChat: currentAbortController !== null,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ExtendedChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 