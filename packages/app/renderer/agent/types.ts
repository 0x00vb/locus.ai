export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatHistory {
  messages: ChatMessage[];
  currentSessionId: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  displayName?: string;
  provider: 'ollama';
  available: boolean;
  size?: number;
  family?: string;
  parameterSize?: string;
  lastModified?: string;
  description?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  selectedModel: string;
  mode: 'ask' | 'agent';
  availableModels: ModelInfo[];
  error?: string;
  isLoadingModels: boolean;
}

export interface ChatActions {
  sendMessage: (message: string, modelId: string, mode: 'ask' | 'agent') => Promise<void>;
  sendMessageStream: (message: string, modelId: string, mode: 'ask' | 'agent') => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, content: string) => void;
  clearMessages: () => void;
  setSelectedModel: (modelId: string) => void;
  setMode: (mode: 'ask' | 'agent') => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  refreshModels: () => Promise<void>;
}

export type ChatContextType = ChatState & ChatActions; 