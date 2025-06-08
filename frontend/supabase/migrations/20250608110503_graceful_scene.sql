/*
  # Storage Setup for AI Chat Application

  1. Storage Buckets
    - `chat-files` - For user uploaded files (images, PDFs, etc.)
    - `generated-images` - For AI generated images

  2. Storage Policies
    - Users can upload files to their own chats
    - Users can view files from chats they have access to
    - Public access for shared chat files
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('chat-files', 'chat-files', false),
  ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for chat-files bucket
CREATE POLICY "Users can upload files to their chats"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view files from accessible chats"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-files' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM chats 
        WHERE id::text = (storage.foldername(name))[2] 
        AND is_shared = true
      )
    )
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policies for generated-images bucket (public read)
CREATE POLICY "Anyone can view generated images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'generated-images');

CREATE POLICY "Authenticated users can upload generated images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Users can delete their generated images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );