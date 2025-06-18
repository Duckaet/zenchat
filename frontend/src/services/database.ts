import Dexie, { Table } from 'dexie';
import { Chat, Message } from '@/types/chat';

export interface LocalChat extends Omit<Chat, 'userId'> {
  userId: string;
  isSynced: number; 
  lastSyncedAt?: string;
}

export interface LocalMessage extends Message {
  isSynced: number; 
  lastSyncedAt?: string;
}

export class ChatDatabase extends Dexie {
  chats!: Table<LocalChat>;
  messages!: Table<LocalMessage>;
  syncQueue!: Table<{
    id?: number;
    tableName: string;
    recordId: string;
    operation: 'insert' | 'update' | 'delete';
    data?: any;
    timestamp: string;
  }>;

  constructor() {
    super('ChatAppDB');
    
    
    this.version(2).stores({
      chats: '&id, userId, title, createdAt, updatedAt, isSynced, lastSyncedAt',
      messages: '&id, chatId, role, createdAt, updatedAt, isSynced, lastSyncedAt',
      syncQueue: '++id, tableName, recordId, operation, timestamp'
    });
  }
}

export const db = new ChatDatabase();
