import { db, LocalChat, LocalMessage } from './database';
import { supabase } from '@/lib/supabase';
import { Chat, Message } from '@/types/chat';

class SyncService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.setupNetworkListeners();
    this.setupRealtimeSync();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncToCloud();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupRealtimeSync() {
   
    supabase
      .channel('chat_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => this.handleRemoteChatChange(payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => this.handleRemoteMessageChange(payload)
      )
      .subscribe();
  }

  
  async syncToCloud() {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    console.log('Syncing to cloud...');

    try {
      await this.syncChatsToCloud();
      await this.syncMessagesToCloud();
      console.log('Sync to cloud completed');
    } catch (error) {
      console.error('Sync to cloud failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync cloud changes to local
  async syncFromCloud(userId: string) {
    if (!this.isOnline) return;

    console.log('Syncing from cloud...');

    try {
      await this.syncChatsFromCloud(userId);
      await this.syncMessagesFromCloud(userId);
      console.log('Sync from cloud completed');
    } catch (error) {
      console.error('Sync from cloud failed:', error);
    }
  }

private async syncChatsToCloud() {
  try {
    const unsyncedChats = await db.chats.where('isSynced').equals(0).toArray();
    
    console.log(`Syncing ${unsyncedChats.length} unsynced chats to cloud`);

    for (const chat of unsyncedChats) {
      try {
        const { isSynced, lastSyncedAt, ...chatData } = chat;
        
        console.log('Syncing chat:', chatData);
        
        // ✅ FIXED: Map camelCase to snake_case for Supabase
        const { data, error } = await supabase
          .from('chats')
          .upsert({
            id: chat.id,
            title: chat.title,
            user_id: chat.userId,           // ✅ userId → user_id
            created_at: chat.createdAt,     // ✅ createdAt → created_at
            updated_at: chat.updatedAt,     // ✅ updatedAt → updated_at
            is_shared: chat.isShared,       // ✅ isShared → is_shared
            share_token: chat.shareToken,   // ✅ shareToken → share_token
            model: chat.model,
            system_prompt: chat.systemPrompt, // ✅ systemPrompt → system_prompt
            metadata: chat.metadata,
          })
          .select();

        if (error) {
          console.error('Supabase upsert error:', error);
          throw error;
        }

        console.log('Chat synced successfully:', data);

        // Mark as synced
        await db.chats.update(chat.id, {
          isSynced: 1,  // ✅ Use 1 for synced
          lastSyncedAt: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Failed to sync chat ${chat.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in syncChatsToCloud:', error);
    throw error;
  }
}

private async syncMessagesToCloud() {
  try {
    const unsyncedMessages = await db.messages.where('isSynced').equals(0).toArray();

    console.log(` Syncing ${unsyncedMessages.length} unsynced messages to cloud`);

    for (const message of unsyncedMessages) {
      try {
        const { isSynced, lastSyncedAt, ...messageData } = message;
        
        // ✅ FIXED: Map camelCase to snake_case for Supabase
        const { error } = await supabase
          .from('messages')
          .upsert({
            id: message.id,
            chat_id: message.chatId,        // ✅ chatId → chat_id
            content: message.content,
            role: message.role,
            created_at: message.createdAt,  // ✅ createdAt → created_at
            updated_at: message.updatedAt,  // ✅ updatedAt → updated_at
            metadata: message.metadata,
            parent_id: message.parentId,    // ✅ parentId → parent_id
            attachments: message.attachments,
            is_streaming: message.isStreaming, // ✅ isStreaming → is_streaming
            token_count: message.tokenCount,   // ✅ tokenCount → token_count
          });

        if (error) throw error;

        // Mark as synced
        await db.messages.update(message.id, {
          isSynced: 1,  // ✅ Use 1 for synced
          lastSyncedAt: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Failed to sync message ${message.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in syncMessagesToCloud:', error);
    throw error;
  }
}

  private async syncChatsFromCloud(userId: string) {
    const lastSync = localStorage.getItem('lastChatSync') || '1970-01-01T00:00:00Z';
    
    const { data: cloudChats, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastSync);

    if (error) throw error;

    for (const cloudChat of cloudChats || []) {
      const localChat: LocalChat = {
        id: cloudChat.id,
        title: cloudChat.title,
        userId: cloudChat.user_id,
        createdAt: cloudChat.created_at,
        updatedAt: cloudChat.updated_at,
        isShared: cloudChat.is_shared,
        shareToken: cloudChat.share_token,
        model: cloudChat.model,
        systemPrompt: cloudChat.system_prompt,
        metadata: cloudChat.metadata,
        isSynced: true,
        lastSyncedAt: new Date().toISOString()
      };

      await db.chats.put(localChat);
    }

    localStorage.setItem('lastChatSync', new Date().toISOString());
  }

  private async syncMessagesFromCloud(userId: string) {
    const lastSync = localStorage.getItem('lastMessageSync') || '1970-01-01T00:00:00Z';
    
    const { data: cloudMessages, error } = await supabase
      .from('messages')
      .select(`
        *,
        chats!inner(user_id)
      `)
      .eq('chats.user_id', userId)
      .gt('updated_at', lastSync);

    if (error) throw error;

    for (const cloudMessage of cloudMessages || []) {
      const localMessage: LocalMessage = {
        id: cloudMessage.id,
        chatId: cloudMessage.chat_id,
        content: cloudMessage.content,
        role: cloudMessage.role,
        createdAt: cloudMessage.created_at,
        updatedAt: cloudMessage.updated_at,
        metadata: cloudMessage.metadata,
        parentId: cloudMessage.parent_id,
        attachments: cloudMessage.attachments || [],
        isStreaming: cloudMessage.is_streaming,
        tokenCount: cloudMessage.token_count,
        isSynced: true,
        lastSyncedAt: new Date().toISOString()
      };

      await db.messages.put(localMessage);
    }

    localStorage.setItem('lastMessageSync', new Date().toISOString());
  }

  private async handleRemoteChatChange(payload: any) {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const cloudChat = payload.new;
      const localChat: LocalChat = {
        id: cloudChat.id,
        title: cloudChat.title,
        userId: cloudChat.user_id,
        createdAt: cloudChat.created_at,
        updatedAt: cloudChat.updated_at,
        isShared: cloudChat.is_shared,
        shareToken: cloudChat.share_token,
        model: cloudChat.model,
        systemPrompt: cloudChat.system_prompt,
        metadata: cloudChat.metadata,
        isSynced: true,
        lastSyncedAt: new Date().toISOString()
      };

      await db.chats.put(localChat);
    } else if (payload.eventType === 'DELETE') {
      await db.chats.delete(payload.old.id);
    }
  }

  private async handleRemoteMessageChange(payload: any) {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const cloudMessage = payload.new;
      const localMessage: LocalMessage = {
        id: cloudMessage.id,
        chatId: cloudMessage.chat_id,
        content: cloudMessage.content,
        role: cloudMessage.role,
        createdAt: cloudMessage.created_at,
        updatedAt: cloudMessage.updated_at,
        metadata: cloudMessage.metadata,
        parentId: cloudMessage.parent_id,
        attachments: cloudMessage.attachments || [],
        isStreaming: cloudMessage.is_streaming,
        tokenCount: cloudMessage.token_count,
        isSynced: true,
        lastSyncedAt: new Date().toISOString()
      };

      await db.messages.put(localMessage);
    } else if (payload.eventType === 'DELETE') {
      await db.messages.delete(payload.old.id);
    }
  }
}

export const syncService = new SyncService();
