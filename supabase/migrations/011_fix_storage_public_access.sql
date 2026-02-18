-- ============================================
-- Migration: Fix Public Storage Access Policy
-- ============================================
-- Issue: Images table uploads fail with 400 error
-- Reason: Storage bucket policies only allow authenticated users
-- but public image URLs need to work for all users/anonymous access
-- ============================================

-- Add policy to allow anonymous users to view public images
CREATE POLICY "Allow public access to images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Verify bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'images';
