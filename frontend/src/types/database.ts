export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string
          title: string
          user_id: string
          created_at: string
          updated_at: string
          is_shared: boolean
          share_token: string | null
          model: string
          system_prompt: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          title: string
          user_id: string
          created_at?: string
          updated_at?: string
          is_shared?: boolean
          share_token?: string | null
          model: string
          system_prompt?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          title?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          is_shared?: boolean
          share_token?: string | null
          model?: string
          system_prompt?: string | null
          metadata?: Json | null
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          content: string
          role: 'user' | 'assistant' | 'system'
          created_at: string
          updated_at: string
          metadata: Json | null
          parent_id: string | null
          attachments: Json | null
          is_streaming: boolean
          token_count: number | null
        }
        Insert: {
          id?: string
          chat_id: string
          content: string
          role: 'user' | 'assistant' | 'system'
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          parent_id?: string | null
          attachments?: Json | null
          is_streaming?: boolean
          token_count?: number | null
        }
        Update: {
          id?: string
          chat_id?: string
          content?: string
          role?: 'user' | 'assistant' | 'system'
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          parent_id?: string | null
          attachments?: Json | null
          is_streaming?: boolean
          token_count?: number | null
        }
      }
      chat_files: {
        Row: {
          id: string
          chat_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          uploaded_by: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          chat_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          uploaded_by: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          chat_id?: string
          file_name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          uploaded_by?: string
          created_at?: string
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}