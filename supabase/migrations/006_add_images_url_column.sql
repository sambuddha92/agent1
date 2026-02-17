-- ============================================
-- Migration: Add URL column to images table
-- ============================================
-- Issue: Images table was missing url column
-- This column stores the public URL of the image
-- for fast access without re-computing on every query
-- ============================================

-- Add url column to images table (safe - allows NULL initially)
ALTER TABLE images ADD COLUMN IF NOT EXISTS url TEXT;

-- Create index for url queries
CREATE INDEX IF NOT EXISTS idx_images_url ON images(url) WHERE url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN images.url IS 'Public URL to access the image from storage';
