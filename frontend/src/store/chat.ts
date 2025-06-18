import { db, LocalChat, LocalMessage } from '@/services/database';
import { syncService } from '@/services/sync';
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
  messageCache: Map<string, Message[]>;
  loadedMessageCount: number;

  // Available models
  availableModels: LLMModel[];

  // IndexedDB + Sync
  isOffline: boolean;
  lastSyncTime: string | null;

  // Actions
  loadChats: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncData: () => Promise<void>;
  createChat: (title: string, model: string) => Promise<Chat>;
  selectChat: (chatId: string) => Promise<void>;
 sendMessage: (content: string, attachments?: File[], options?: { needsSearch?: boolean; searchQuery?: string }) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  setSelectedModel: (model: LLMModel) => void;
  shareChat: (chatId: string) => Promise<string>;
  forkChat: (messageId: string) => Promise<Chat>;
  loadSharedChat: (shareToken: string) => Promise<Chat | null>;
   loadMoreMessages: (chatId: string, offset?: number) => Promise<void>;
  clearMessageCache: () => void;
}

const defaultModels: LLMModel[] = [
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (Free)',
    provider: 'openai',
    maxTokens: 8192,
    supportedFeatures: { vision: false, functionCalling: false, streaming: true },
  },
  {
    id: 'deepseek/deepseek-chat:free',
    name: 'DeepSeek Chat (Free) - 200 daily msgs',
    provider: 'openai',
    maxTokens: 4096,
    supportedFeatures: { vision: false, functionCalling: false, streaming: true },
  },
  {
    id: 'microsoft/phi-3-mini-128k-instruct:free',
    name: 'Phi-3 Mini (Free) - Backup',
    provider: 'openai',
    maxTokens: 4096,
    supportedFeatures: { vision: false, functionCalling: false, streaming: true },
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
  isOffline: !navigator.onLine,
  lastSyncTime: null,
  messageCache: new Map(),
  loadedMessageCount: 50,

  
  loadFromLocal: async () => {
    try {
      console.log('Loading from IndexedDB...');
      
      
      const localChats = await db.chats
        .orderBy('updatedAt')
        .reverse()
        .toArray();
      
      const chats: Chat[] = localChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        userId: chat.userId,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        isShared: chat.isShared,
        shareToken: chat.shareToken,
        model: chat.model,
        systemPrompt: chat.systemPrompt,
        metadata: chat.metadata,
      }));

      set({ chats });
      console.log(`Loaded ${chats.length} chats from IndexedDB`);

     
      const { currentChat } = get();
      if (currentChat) {
       
        const localMessages = await db.messages
          .where('chatId')
          .equals(currentChat.id)
          .sortBy('createdAt');

        const messages: Message[] = localMessages.map(msg => ({
          id: msg.id,
          chatId: msg.chatId,
          content: msg.content,
          role: msg.role,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          metadata: msg.metadata,
          parentId: msg.parentId,
          attachments: msg.attachments,
          isStreaming: msg.isStreaming,
          tokenCount: msg.tokenCount,
        }));

        set({ messages });
      }
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
    }
  },

  
  syncData: async () => {
  try {
    console.log('Starting sync...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('Auth error:', error);
      return;
    }
    
    if (!user || !user.id) {
      console.log('No user found or user.id missing');
      return;
    }

    console.log('User found:', user.id);

    
    await syncService.syncToCloud();
    
    
    await syncService.syncFromCloud(user.id);
    
    
    await get().loadFromLocal();
    
    set({ lastSyncTime: new Date().toISOString() });
    console.log('Sync completed');
  } catch (error) {
    console.error('Sync failed:', error);
  }
},


 
  loadChats: async () => {
    try {
     
      await get().loadFromLocal();

     
      if (navigator.onLine) {
        await get().syncData();
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  },

  createChat: async (title: string, model: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newChat: Chat = {
        id: crypto.randomUUID(),
        title,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isShared: false,
        model,
      };

      // Save to IndexedDB first (offline-first)
      const localChat: LocalChat = {
        ...newChat,
        isSynced: 0,
      };

      await db.chats.add(localChat);
      console.log('Chat saved to IndexedDB');

      // Update state immediately
      set(state => ({
        chats: [newChat, ...state.chats],
        currentChat: newChat,
        messages: [],
      }));

      // Sync to cloud in background if online
      if (navigator.onLine) {
        syncService.syncToCloud();
      }

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

   
      const localMessages = await db.messages
        .where('chatId')
        .equals(chatId)
        .sortBy('createdAt');

      const messages: Message[] = localMessages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        metadata: msg.metadata,
        parentId: msg.parentId,
        attachments: msg.attachments,
        isStreaming: msg.isStreaming,
        tokenCount: msg.tokenCount,
      }));

      set({
        currentChat: chat,
        messages,
      });

     
      if (navigator.onLine) {
        get().syncData();
      }
    } catch (error) {
      console.error('Error selecting chat:', error);
    }
  },
  sendMessage: async (content: string, attachments?: File[], options?: { needsSearch?: boolean; searchQuery?: string }) => {
      const { currentChat, selectedModel } = get();
      if (!currentChat) return;

      try {
        set({ isLoading: true });

        // Create user message
        const userMessage: Message = {
          id: crypto.randomUUID(),
          chatId: currentChat.id,
          content,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attachments: attachments?.map(file => ({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
          })) || [],
          isStreaming: false,
        };

        // Save to IndexedDB first
        const localUserMessage: LocalMessage = {
          ...userMessage,
          isSynced: 0,
        };

        await db.messages.add(localUserMessage);

        // Update state immediately
        set(state => ({
          messages: [...state.messages, userMessage],
        }));

        // Create assistant message placeholder
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          chatId: currentChat.id,
          content: '',
          role: 'assistant',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attachments: [],
          isStreaming: true,
        };

        const localAssistantMessage: LocalMessage = {
          ...assistantMessage,
          isSynced: 0,
        };

        await db.messages.add(localAssistantMessage);

        set(state => ({
          messages: [...state.messages, assistantMessage],
          streamingMessageId: assistantMessage.id,
        }));

        // Prepare messages for API
        const apiMessages = [...get().messages].map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        // Send to backend with search parameters
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/completion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: selectedModel.id,
            needsSearch: options?.needsSearch || false,
            searchQuery: options?.searchQuery
          }),
        });

        if (!response.ok) throw new Error('Failed to send message to AI');

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        let accumulatedContent = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // Update final message in IndexedDB
                await db.messages.update(assistantMessage.id, {
                  content: accumulatedContent,
                  isStreaming: false,
                  updatedAt: new Date().toISOString(),
                  isSynced: 0, // Mark for sync
                });

                set(state => ({
                  messages: state.messages.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: accumulatedContent, isStreaming: false }
                      : msg
                  ),
                  streamingMessageId: null,
                }));

                // Sync to cloud in background
                if (navigator.onLine) {
                  syncService.syncToCloud();
                }
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  
                  // Update IndexedDB in real-time
                  await db.messages.update(assistantMessage.id, {
                    content: accumulatedContent,
                    updatedAt: new Date().toISOString(),
                  });

                  // Update state
                  set(state => ({
                    messages: state.messages.map(msg =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    ),
                  }));
                }
              } catch (e) {
                console.error('Error parsing AI response:', e);
              }
            }
          }
        }

      } catch (error) {
        console.error('Error sending message:', error);
        set({ streamingMessageId: null });
        
        // Remove the failed assistant message
        set(state => ({
          messages: state.messages.filter(msg => msg.id !== assistantMessage.id)
        }));
        
        throw error;
      } finally {
        set({ isLoading: false });
      }
  },


  deleteChat: async (chatId: string) => {
    try {
     
      await db.messages.where('chatId').equals(chatId).delete();
      await db.chats.delete(chatId);

      set(state => ({
        chats: state.chats.filter(chat => chat.id !== chatId),
        currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
        messages: state.currentChat?.id === chatId ? [] : state.messages,
      }));

      
      if (navigator.onLine) {
        const { error } = await supabase.from('chats').delete().eq('id', chatId);
        if (error) console.error('Failed to delete chat from cloud:', error);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  },

  updateChatTitle: async (chatId: string, title: string) => {
    try {
    
      await db.chats.update(chatId, {
        title,
        updatedAt: new Date().toISOString(),
        isSynced: 0,
      });

      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId ? { ...chat, title } : chat
        ),
        currentChat: state.currentChat?.id === chatId
          ? { ...state.currentChat, title }
          : state.currentChat,
      }));

   
      if (navigator.onLine) {
        syncService.syncToCloud();
      }
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
      
    
      await db.chats.update(chatId, {
        isShared: true,
        shareToken,
        updatedAt: new Date().toISOString(),
        isSynced: 0,
      });

      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId
            ? { ...chat, isShared: true, shareToken }
            : chat
        ),
      }));

      
      if (navigator.onLine) {
        syncService.syncToCloud();
      }

      return shareToken;
    } catch (error) {
      console.error('Error sharing chat:', error);
      throw error;
    }
  },

  forkChat: async (messageId: string) => {
  try {
    const { currentChat } = get();
    if (!currentChat) throw new Error('No current chat');

    console.log('Forking from message:', messageId);

  
    const allMessages = await db.messages
      .where('chatId')
      .equals(currentChat.id)
      .sortBy('createdAt');

    const allMessagesConverted: Message[] = allMessages.map(msg => ({
      id: msg.id,
      chatId: msg.chatId,
      content: msg.content,
      role: msg.role,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      metadata: msg.metadata,
      parentId: msg.parentId,
      attachments: msg.attachments,
      isStreaming: msg.isStreaming,
      tokenCount: msg.tokenCount,
    }));

    console.log(`Loaded ${allMessagesConverted.length} total messages for forking`);

  
    const messageIndex = allMessagesConverted.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      console.error('Message not found in database:', messageId);
      throw new Error('Message not found');
    }

    const messagesToFork = allMessagesConverted.slice(0, messageIndex + 1);
    console.log(`Forking ${messagesToFork.length} messages (up to index ${messageIndex})`);

   
    const forkedChat: Chat = {
      id: crypto.randomUUID(),
      title: `${currentChat.title} (Fork)`,
      userId: currentChat.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isShared: false,
      model: currentChat.model,
      systemPrompt: currentChat.systemPrompt,
    };

  
    const localForkedChat: LocalChat = {
      ...forkedChat,
      isSynced: 0,
    };

    await db.chats.add(localForkedChat);
    console.log('Forked chat saved to IndexedDB');

   
    for (const message of messagesToFork) {
      const forkedMessage: LocalMessage = {
        ...message,
        id: crypto.randomUUID(),
        chatId: forkedChat.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSynced: 0,
      };
      await db.messages.add(forkedMessage);
    }

    console.log(' Forked messages saved to IndexedDB');

  
    set(state => ({
      chats: [forkedChat, ...state.chats],
    }));

   
    if (navigator.onLine) {
      syncService.syncToCloud();
    }

    console.log('Fork completed successfully');
    return forkedChat;
  } catch (error) {
    console.error('Error forking chat:', error);
    throw error;
  }
},


loadSharedChat: async (shareToken: string) => {
  try {
    console.log('Loading shared chat with token:', shareToken);
    
   
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_shared', true)
      .single();

    if (error) {
      console.error('Error loading shared chat:', error);
      throw error;
    }
    
    if (!chat) {
      console.log('No chat found with token:', shareToken);
      return null;
    }

    console.log('Found shared chat:', chat.title);

   
    const { data: chatMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Failed to load shared chat messages:', messagesError);
    }

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

    const messages: Message[] = (chatMessages || []).map(msg => ({
      id: msg.id,
      chatId: msg.chat_id,
      content: msg.content,
      role: msg.role,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      metadata: msg.metadata,
      parentId: msg.parent_id,
      attachments: msg.attachments || [],
      isStreaming: msg.is_streaming,
      tokenCount: msg.token_count,
    }));

   w
    set({ 
      currentChat: sharedChat,
      messages,
    });

    console.log('Loaded shared chat with', messages.length, 'messages');
    return sharedChat;
  } catch (error) {
    console.error('Error loading shared chat:', error);
    return null;
  }
},

loadMoreMessages: async (chatId: string, offset = 0) => {
    try {
      const CHUNK_SIZE = 50;
      
      const localMessages = await db.messages
        .where('chatId')
        .equals(chatId)
        .offset(offset)
        .limit(CHUNK_SIZE)
        .sortBy('createdAt');

      const messages: Message[] = localMessages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        metadata: msg.metadata,
        parentId: msg.parentId,
        attachments: msg.attachments,
        isStreaming: msg.isStreaming,
        tokenCount: msg.tokenCount,
      }));

      
      const { messageCache } = get();
      const existingMessages = messageCache.get(chatId) || [];
      const updatedMessages = [...existingMessages, ...messages];
      
      messageCache.set(chatId, updatedMessages);
      
      set({ 
        messages: updatedMessages,
        messageCache: new Map(messageCache)
      });

    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  },

  clearMessageCache: () => {
    set({ 
      messageCache: new Map(),
      messages: []
    });
  },


}));


