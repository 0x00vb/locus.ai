import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Send, MessageSquare, X, ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff, File, FolderOpen, List, Square } from 'lucide-react';
import { useChatContext } from './context/ChatContext';
import { OllamaUtils } from '../agent/models/ollamaService';
import { FileChangeModal } from './FileChangeModal';

interface AgentChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AgentChatPanel: React.FC<AgentChatPanelProps> = ({ isOpen, onToggle }) => {
  const {
    messages,
    isLoading,
    selectedModel,
    mode,
    availableModels,
    error,
    isLoadingModels,
    sendMessage,
    sendMessageStream,
    setSelectedModel,
    setMode,
    refreshModels,
    
    // File operations state and handlers
    pendingFileOperations,
    fileOperationErrors,
    fileOperationWarnings,
    showFileModal,
    activeFilePath,
    includeFileList,
    setShowFileModal,
    setActiveFilePath,
    setIncludeFileList,
    onApproveFileOperations,
    onApproveAllFileOperations,
    onRejectAllFileOperations,
    
    // Chat control
    stopChat,
    canStopChat,
  } = useChatContext();

  const [inputValue, setInputValue] = React.useState('');
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Use the context's sendMessageStream function for real-time streaming
    await sendMessageStream(message, selectedModel, mode);
  };

  const handleRefreshModels = async () => {
    try {
      await refreshModels();
    } catch (error) {
      console.error('Failed to refresh models:', error);
      // The error will be displayed via the context's error state
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getModelStatusIcon = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (!model) return <WifiOff className="w-3 h-3 text-red-500" />;
    return model.available ? 
      <Wifi className="w-3 h-3 text-green-500" /> : 
      <WifiOff className="w-3 h-3 text-red-500" />;
  };

  const getModelDisplayInfo = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (!model) return { name: modelId, info: '' };
    
    const name = model.displayName || model.name;
    const info = [];
    
    // Always local Ollama models
    info.push('Local');
    
    if (model.size) {
      info.push(OllamaUtils.formatSize(model.size));
    }
    
    return {
      name,
      info: info.join(' • ')
    };
  };

  const panelVariants: Variants = {
    open: {
      width: isCollapsed ? 24 : 384, // w-6 (24px) when collapsed, w-96 (384px) when open
    },
    closed: {
      width: 0,
    }
  };

  const contentVariants: Variants = {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-[40px] h-[calc(100vh-40px)] bg-background border-l border-border z-50 flex flex-col overflow-hidden"
          >
            {/* Collapse/Expand Toggle */}
            {isCollapsed && (
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="h-full flex items-center justify-center"
              >
                <button
                  onClick={toggleCollapse}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Expand chat panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {!isCollapsed && (
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="h-full flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-sm">AI Assistant</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleRefreshModels}
                      disabled={isLoadingModels}
                      className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                      title="Refresh models"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={toggleCollapse}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Collapse panel"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onToggle}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Close chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="px-3 py-2 bg-destructive/10 border-b border-border">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                {/* Context Configuration */}
                <div className="px-3 py-2 border-b border-border bg-muted/20">
                  <div className="space-y-2">
                    {/* Active File Path */}
                    <div className="flex items-center gap-2">
                      <File className="w-3 h-3 text-muted-foreground" />
                      <input
                        type="text"
                        value={activeFilePath || ''}
                        onChange={(e) => setActiveFilePath(e.target.value || undefined)}
                        placeholder="Active file path (optional)"
                        className="flex-1 text-xs px-2 py-1 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    
                    {/* Include File List Toggle */}
                    <div className="flex items-center gap-2">
                      <List className="w-3 h-3 text-muted-foreground" />
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeFileList}
                          onChange={(e) => setIncludeFileList(e.target.checked)}
                          className="w-3 h-3"
                        />
                        Include project file list in context
                      </label>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      {availableModels.length === 0 && !isLoadingModels ? (
                        <>
                          <p>No Ollama models installed</p>
                          <p className="text-xs mt-1">Install models with: <code className="bg-muted px-1 rounded">ollama pull llama3</code></p>
                          <p className="text-xs mt-1">Make sure Ollama is running on localhost:11434</p>
                        </>
                      ) : (
                        <>
                          <p>Start a conversation with AI</p>
                          <p className="text-xs mt-1">Choose your model and mode below</p>
                          {mode === 'agent' && (
                            <p className="text-xs mt-1 text-blue-600">Agent mode can suggest file edits</p>
                          )}
                        </>
                      )}
                      {isLoadingModels && (
                        <p className="text-xs mt-2 flex items-center justify-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Loading models...
                        </p>
                      )}
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-4'
                            : 'bg-muted mr-4'
                        }`}
                      >
                        <div className="text-sm">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              code: ({ children }) => (
                                <code className="bg-muted/50 px-1 py-0.5 rounded text-xs">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto mt-2 mb-2">
                                  {children}
                                </pre>
                              )
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 mr-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <span>AI is responding...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Controls */}
                <div className="p-3 border-t border-border bg-muted/30">
                  {/* Model and Mode Selection */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 relative">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={isLoadingModels}
                        className="w-full text-xs px-2 py-1 pr-6 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                      >
                        {isLoadingModels ? (
                          <option>Loading models...</option>
                        ) : availableModels.length === 0 ? (
                          <option>No Ollama models installed</option>
                        ) : (
                          availableModels.map((model) => {
                            const { name, info } = getModelDisplayInfo(model.id);
                            return (
                              <option key={model.id} value={model.id}>
                                {name} {info && `(${info})`}
                              </option>
                            );
                          })
                        )}
                      </select>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {getModelStatusIcon(selectedModel)}
                      </div>
                    </div>
                    
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as 'agent' | 'ask')}
                      className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="agent">Agent</option>
                      <option value="ask">Ask</option>
                    </select>
                  </div>

                  {/* Model Info */}
                  {selectedModel && !isLoadingModels && (
                    <div className="text-xs text-muted-foreground mb-2 px-1">
                      {(() => {
                        const model = availableModels.find(m => m.id === selectedModel);
                        if (!model) return `Model: ${selectedModel}`;
                        
                        const parts = [];
                        parts.push('OLLAMA');
                        if (model.description) {
                          parts.push(model.description);
                        }
                        
                        return parts.join(' • ');
                      })()}
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex gap-2">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message... (streaming enabled, Shift+Enter for new line)"
                      disabled={!selectedModel || isLoadingModels}
                      className="flex-1 min-h-[2.5rem] max-h-[7.5rem] px-3 py-2 text-sm rounded border border-border bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                      style={{ height: '2.5rem' }}
                    />
                    
                    {canStopChat ? (
                      <button
                        onClick={stopChat}
                        className="px-3 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors flex items-center justify-center"
                        title="Stop AI response"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading || !selectedModel || isLoadingModels}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Change Modal */}
      <FileChangeModal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        fileOperations={pendingFileOperations}
        operationErrors={fileOperationErrors}
        operationWarnings={fileOperationWarnings}
        onApprove={onApproveFileOperations}
        onApproveAll={onApproveAllFileOperations}
        onRejectAll={onRejectAllFileOperations}
        isApplying={isLoading}
      />
    </>
  );
};

export default AgentChatPanel; 