-- Create images table
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('uploaded', 'generated')),
  storage_path TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT - Users can view their own images
CREATE POLICY "Users can view their own images" ON images
FOR SELECT USING (auth.uid() = user_id);

-- INSERT - Users can insert their own images
CREATE POLICY "Users can insert their own images" ON images
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE - Users can update their own images
CREATE POLICY "Users can update their own images" ON images
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE - Users can delete their own images
CREATE POLICY "Users can delete their own images" ON images
FOR DELETE USING (auth.uid() = user_id);
REPLACE

-- Create index for faster queries
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_type ON images(type);

-- Add storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Bucket security
-- Allow authenticated users to view/download images
CREATE POLICY "Allow authenticated users to view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
REPLACE
