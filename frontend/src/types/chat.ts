export interface Chat {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  shareToken?: string;
  model: string;
  systemPrompt?: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  parentId?: string;
  attachments?: FileAttachment[];
  isStreaming?: boolean;
  tokenCount?: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  metadata?: Record<string, any>;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: 'openai' | 'meta' | 'google' | 'deepseek' | 'sarvamai';
  maxTokens: number;
  supportedFeatures: {
    vision: boolean;
    functionCalling: boolean;
    streaming: boolean;
  };
}

export interface ChatBranch {
  messageId: string;
  children: string[];
  depth: number;
}