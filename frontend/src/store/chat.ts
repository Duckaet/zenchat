import { create } from 'zustand';
import { Chat, Message, LLMModel } from '@/types/chat';
import { supabase } from '@/lib/supabase';

interface ChatState {
  // State
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  selectedModel: LLMModel;
  isLoading: boolean;
  streamingMessageId: string | null;

  // Available models
  availableModels: LLMModel[];

  // Actions
  loadChats: () => Promise<void>;
  createChat: (title: string, model: string) => Promise<Chat>;
  selectChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  setSelectedModel: (model: LLMModel) => void;
  shareChat: (chatId: string) => Promise<string>;
  forkChat: (messageId: string) => Promise<Chat>;
  loadSharedChat: (shareToken: string) => Promise<Chat | null>;
}

const defaultModels: LLMModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    maxTokens: 128000,
    supportedFeatures: { vision: true, functionCalling: true, streaming: true },
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 16385,
    supportedFeatures: { vision: false, functionCalling: true, streaming: true },
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    maxTokens: 200000,
    supportedFeatures: { vision: true, functionCalling: false, streaming: true },
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    maxTokens: 200000,
    supportedFeatures: { vision: true, functionCalling: false, streaming: true },
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    maxTokens: 32768,
    supportedFeatures: { vision: true, functionCalling: true, streaming: true },
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    maxTokens: 32768,
    supportedFeatures: { vision: false, functionCalling: true, streaming: true },
  },
];

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  selectedModel: defaultModels[0],
  isLoading: false,
  streamingMessageId: null,
  availableModels: defaultModels,

  loadChats: async () => {
    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      set({
        chats: chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          userId: chat.user_id,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          isShared: chat.is_shared,
          shareToken: chat.share_token,
          model: chat.model,
          systemPrompt: chat.system_prompt,
          metadata: chat.metadata,
        })),
      });
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  },

  createChat: async (title: string, model: string) => {
    try {
      const { data: chat, error } = await supabase
        .from('chats')
        .insert({
          title,
          model,
          user_id: (await supabase.auth.getUser()).data.user?.id!,
        })
        .select()
        .single();

      if (error) throw error;

      const newChat: Chat = {
        id: chat.id,
        title: chat.title,
        userId: chat.user_id,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
        isShared: chat.is_shared,
        shareToken: chat.share_token,
        model: chat.model,
        systemPrompt: chat.system_prompt,
        metadata: chat.metadata,
      };

      set(state => ({
        chats: [newChat, ...state.chats],
        currentChat: newChat,
        messages: [],
      }));

      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  },

  selectChat: async (chatId: string) => {
    try {
      const chat = get().chats.find(c => c.id === chatId);
      if (!chat) return;

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({
        currentChat: chat,
        messages: messages.map(msg => ({
          id: msg.id,
          chatId: msg.chat_id,
          content: msg.content,
          role: msg.role,
          createdAt: msg.created_at,
          updatedAt: msg.updated_at,
          metadata: msg.metadata,
          parentId: msg.parent_id,
          attachments: msg.attachments,
          isStreaming: msg.is_streaming,
          tokenCount: msg.token_count,
        })),
      });
    } catch (error) {
      console.error('Error selecting chat:', error);
    }
  },

  sendMessage: async (content: string, attachments?: File[]) => {
    const { currentChat, selectedModel } = get();
    if (!currentChat) return;

    try {
      set({ isLoading: true });

      // Create user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChat.id,
          content,
          role: 'user',
          attachments: attachments?.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })) || null,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Upload attachments if any
      const uploadedAttachments = [];
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${currentChat.id}/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-files')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('chat-files')
            .getPublicUrl(fileName);

          uploadedAttachments.push({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: publicUrl,
          });
        }
      }

      // Add user message to state
      const newUserMessage: Message = {
        id: userMessage.id,
        chatId: userMessage.chat_id,
        content: userMessage.content,
        role: userMessage.role,
        createdAt: userMessage.created_at,
        updatedAt: userMessage.updated_at,
        metadata: userMessage.metadata,
        parentId: userMessage.parent_id,
        attachments: uploadedAttachments,
        isStreaming: userMessage.is_streaming,
        tokenCount: userMessage.token_count,
      };

      set(state => ({
        messages: [...state.messages, newUserMessage],
      }));

      // Create assistant message placeholder
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChat.id,
          content: '',
          role: 'assistant',
          is_streaming: true,
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      const streamingMessage: Message = {
        id: assistantMessage.id,
        chatId: assistantMessage.chat_id,
        content: '',
        role: assistantMessage.role,
        createdAt: assistantMessage.created_at,
        updatedAt: assistantMessage.updated_at,
        metadata: assistantMessage.metadata,
        parentId: assistantMessage.parent_id,
        attachments: [],
        isStreaming: true,
        tokenCount: assistantMessage.token_count,
      };

      set(state => ({
        messages: [...state.messages, streamingMessage],
        streamingMessageId: assistantMessage.id,
      }));

      // Send to backend API for AI response
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          chatId: currentChat.id,
          messageId: assistantMessage.id,
          model: selectedModel.id,
          messages: get().messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments,
          })),
          attachments: uploadedAttachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message to AI');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      let accumulatedContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedContent += data.content;
                
                // Update message in real-time
                set(state => ({
                  messages: state.messages.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  ),
                }));
              }
            } catch (e) {
              // Ignore malformed JSON
            }
          }
        }
      }

      // Finalize the message
      await supabase
        .from('messages')
        .update({
          content: accumulatedContent,
          is_streaming: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assistantMessage.id);

      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: accumulatedContent, isStreaming: false }
            : msg
        ),
        streamingMessageId: null,
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      set({ streamingMessageId: null });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteChat: async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      set(state => ({
        chats: state.chats.filter(chat => chat.id !== chatId),
        currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
        messages: state.currentChat?.id === chatId ? [] : state.messages,
      }));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  },

  updateChatTitle: async (chatId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', chatId);

      if (error) throw error;

      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId ? { ...chat, title } : chat
        ),
        currentChat: state.currentChat?.id === chatId
          ? { ...state.currentChat, title }
          : state.currentChat,
      }));
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  },

  setSelectedModel: (model: LLMModel) => {
    set({ selectedModel: model });
  },

  shareChat: async (chatId: string) => {
    try {
      const shareToken = crypto.randomUUID();
      
      const { error } = await supabase
        .from('chats')
        .update({
          is_shared: true,
          share_token: shareToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      if (error) throw error;

      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId
            ? { ...chat, isShared: true, shareToken }
            : chat
        ),
      }));

      return shareToken;
    } catch (error) {
      console.error('Error sharing chat:', error);
      throw error;
    }
  },

  forkChat: async (messageId: string) => {
    try {
      const { currentChat, messages } = get();
      if (!currentChat) throw new Error('No current chat');

      // Find the message and get all messages up to this point
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) throw new Error('Message not found');

      const messagesToFork = messages.slice(0, messageIndex + 1);

      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          title: `${currentChat.title} (Fork)`,
          model: currentChat.model,
          user_id: currentChat.userId,
          system_prompt: currentChat.systemPrompt,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Copy messages to new chat
      for (const message of messagesToFork) {
        await supabase
          .from('messages')
          .insert({
            chat_id: newChat.id,
            content: message.content,
            role: message.role,
            attachments: message.attachments,
            metadata: message.metadata,
          });
      }

      const forkedChat: Chat = {
        id: newChat.id,
        title: newChat.title,
        userId: newChat.user_id,
        createdAt: newChat.created_at,
        updatedAt: newChat.updated_at,
        isShared: newChat.is_shared,
        shareToken: newChat.share_token,
        model: newChat.model,
        systemPrompt: newChat.system_prompt,
        metadata: newChat.metadata,
      };

      set(state => ({
        chats: [forkedChat, ...state.chats],
      }));

      return forkedChat;
    } catch (error) {
      console.error('Error forking chat:', error);
      throw error;
    }
  },

  loadSharedChat: async (shareToken: string) => {
    try {
      const { data: chat, error } = await supabase
        .from('chats')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_shared', true)
        .single();

      if (error) throw error;
      if (!chat) return null;

      const sharedChat: Chat = {
        id: chat.id,
        title: chat.title,
        userId: chat.user_id,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
        isShared: chat.is_shared,
        shareToken: chat.share_token,
        model: chat.model,
        systemPrompt: chat.system_prompt,
        metadata: chat.metadata,
      };

      return sharedChat;
    } catch (error) {
      console.error('Error loading shared chat:', error);
      return null;
    }
  },
}));