import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('meta-llama/llama-3.1-8b-instruct:free');

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);


    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);


    const apiMessages = [...messages, userMessage].map(msg => ({
      role: msg.role,
      content: msg.content,
    }));


    await apiClient.streamChatCompletion(
      apiMessages,
      currentModel,
  
      (chunk: string) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      },

      () => {
        setIsLoading(false);
      },

      (error: string) => {
        setIsLoading(false);
        console.error('Chat error:', error);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: 'Error: Failed to get response' }
              : msg
          )
        );
      }
    );
  }, [messages, currentModel]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    currentModel,
    setCurrentModel,
    sendMessage,
    clearChat,
  };
}
