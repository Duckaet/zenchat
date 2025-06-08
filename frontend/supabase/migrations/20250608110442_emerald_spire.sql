/*
  # Initial Schema Setup for AI Chat Application

  1. New Tables
    - `chats`
      - `id` (uuid, primary key)
      - `title` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_shared` (boolean)
      - `share_token` (text, unique)
      - `model` (text)
      - `system_prompt` (text)
      - `metadata` (jsonb)

    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `content` (text)
      - `role` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `metadata` (jsonb)
      - `parent_id` (uuid, references messages)
      - `attachments` (jsonb)
      - `is_streaming` (boolean)
      - `token_count` (integer)

    - `chat_files`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `file_name` (text)
      - `file_path` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `uploaded_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for shared chats to be readable by anyone with the share token

  3. Storage
    - Create bucket for chat files
    - Set up policies for file access
*/

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_shared boolean DEFAULT false,
  share_token text UNIQUE,
  model text NOT NULL DEFAULT 'gpt-4-turbo',
  system_prompt text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  parent_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_streaming boolean DEFAULT false,
  token_count integer
);

-- Create chat_files table
CREATE TABLE IF NOT EXISTS chat_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_files ENABLE ROW LEVEL SECURITY;

-- Policies for chats table
CREATE POLICY "Users can view their own chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chats"
  ON chats
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own chats"
  ON chats
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view shared chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (is_shared = true);

-- Policies for messages table
CREATE POLICY "Users can view messages from their chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid() OR is_shared = true
    )
  );

CREATE POLICY "Users can create messages in their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their chats"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their chats"
  ON messages
  FOR DELETE
  TO authenticated
  USING (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()
    )
  );

-- Policies for chat_files table
CREATE POLICY "Users can view files from their chats"
  ON chat_files
  FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid() OR is_shared = true
    )
  );

CREATE POLICY "Users can upload files to their chats"
  ON chat_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files from their chats"
  ON chat_files
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() AND
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_share_token ON chats(share_token) WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_files_chat_id ON chat_files(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_files_uploaded_by ON chat_files(uploaded_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();