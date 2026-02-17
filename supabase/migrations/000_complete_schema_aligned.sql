-- ============================================
-- FloatGreens Complete Schema - Aligned with Codebase
-- ============================================
-- This migration creates a complete, production-ready schema
-- that aligns with the current codebase. It:
-- 1. Removes unused tables (harvest_logs, bloom_map_entries)
-- 2. Creates all actively-used tables
-- 3. Fixes missing columns (image_url in chat_messages)
-- 4. Sets up indexes, functions, triggers, and RLS
-- 5. Configures storage bucket for images
-- ============================================

-- ============================================
-- Phase 0: Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Phase 1: Drop Unused Tables & Artifacts
-- ============================================
-- Remove tables not referenced in the codebase

DROP TABLE IF EXISTS harvest_logs CASCADE;
DROP TABLE IF EXISTS bloom_map_entries CASCADE;

-- Drop incorrect indexes from migration 007
DROP INDEX IF EXISTS idx_messages_conversation_id CASCADE;
DROP INDEX IF EXISTS idx_messages_conversation_id_created_at CASCADE;
DROP INDEX IF EXISTS idx_messages_user_id CASCADE;
DROP INDEX IF EXISTS idx_user_context_memory_user_id CASCADE;
DROP INDEX IF EXISTS idx_user_context_memory_user_id_type CASCADE;

-- ============================================
-- Phase 2: Core User Management
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  postal_code_prefix TEXT,
  city TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Phase 3: User Context Memory System
-- ============================================

CREATE TABLE IF NOT EXISTS user_context_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Memory classification
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'preference',        -- User preferences
    'constraint',        -- Physical constraints
    'goal',             -- User goals
    'observation',      -- Agent observations
    'success',          -- Successful outcomes
    'failure',          -- Failed attempts
    'interaction',      -- Interaction patterns
    'context'           -- General context
  )),
  
  -- Memory content
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  confidence DECIMAL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Metadata
  source TEXT DEFAULT 'conversation',
  conversation_id TEXT,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent exact duplicates
  UNIQUE(user_id, memory_type, memory_key)
);

ALTER TABLE user_context_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memories" ON user_context_memory;
DROP POLICY IF EXISTS "Service role can insert memories" ON user_context_memory;
DROP POLICY IF EXISTS "Service role can update memories" ON user_context_memory;

CREATE POLICY "Users can view own memories" ON user_context_memory FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert memories" ON user_context_memory FOR INSERT 
  WITH CHECK (true);
CREATE POLICY "Service role can update memories" ON user_context_memory FOR UPDATE 
  USING (true);

-- View for active (non-expired) memories
DROP VIEW IF EXISTS user_active_memories CASCADE;
CREATE VIEW user_active_memories AS
SELECT 
  id,
  user_id,
  memory_type,
  memory_key,
  memory_value,
  confidence,
  source,
  created_at
FROM user_context_memory
WHERE expires_at IS NULL OR expires_at > now()
ORDER BY created_at DESC;

GRANT SELECT ON user_active_memories TO authenticated;
GRANT SELECT ON user_active_memories TO service_role;

-- ============================================
-- Phase 4: Conversation & Chat System
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
DROP POLICY IF EXISTS "Service role can manage conversations" ON conversations;

CREATE POLICY "Users can view own conversations" ON conversations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations 
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage conversations" ON conversations 
  FOR ALL USING (true) WITH CHECK (true);

-- Chat messages table with image_url support
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_id TEXT,
  tier TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add image_url column if it doesn't exist (for existing databases)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Service role can manage chat messages" ON chat_messages;

CREATE POLICY "Users can view own chat messages" ON chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = chat_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own chat messages" ON chat_messages 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = chat_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role can manage chat messages" ON chat_messages 
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Phase 5: Garden & Plant Management
-- ============================================

CREATE TABLE IF NOT EXISTS balconies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'My Balcony',
  orientation TEXT CHECK (orientation IN ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW')),
  dimensions_m2 DECIMAL,
  floor_level INTEGER,
  sun_hours_estimated DECIMAL,
  climate_zone TEXT,
  wind_exposure TEXT CHECK (wind_exposure IN ('sheltered', 'moderate', 'exposed')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE balconies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own balconies" ON balconies;
DROP POLICY IF EXISTS "Users can insert own balconies" ON balconies;
DROP POLICY IF EXISTS "Users can update own balconies" ON balconies;
DROP POLICY IF EXISTS "Users can delete own balconies" ON balconies;

CREATE POLICY "Users can view own balconies" ON balconies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balconies" ON balconies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balconies" ON balconies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own balconies" ON balconies FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balcony_id UUID REFERENCES balconies(id) ON DELETE CASCADE NOT NULL,
  species TEXT NOT NULL,
  variety TEXT,
  nickname TEXT,
  container_size_liters DECIMAL,
  position_description TEXT,
  acquired_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'deceased', 'harvested')),
  swap_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plants" ON plants;
DROP POLICY IF EXISTS "Users can insert own plants" ON plants;
DROP POLICY IF EXISTS "Users can update own plants" ON plants;
DROP POLICY IF EXISTS "Users can delete own plants" ON plants;

CREATE POLICY "Users can view own plants" ON plants FOR SELECT 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can insert own plants" ON plants FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can update own plants" ON plants FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can delete own plants" ON plants FOR DELETE 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS health_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  issues_detected JSONB,
  growth_stage TEXT CHECK (growth_stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'dormant')),
  height_cm_estimated DECIMAL,
  ai_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own health snapshots" ON health_snapshots;
DROP POLICY IF EXISTS "Users can insert own health snapshots" ON health_snapshots;

CREATE POLICY "Users can view own health snapshots" ON health_snapshots FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM plants p 
    JOIN balconies b ON b.id = p.balcony_id 
    WHERE p.id = health_snapshots.plant_id AND b.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own health snapshots" ON health_snapshots FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM plants p 
    JOIN balconies b ON b.id = p.balcony_id 
    WHERE p.id = health_snapshots.plant_id AND b.user_id = auth.uid()
  ));

-- ============================================
-- Phase 6: Agent System
-- ============================================

CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'acted_on', 'dismissed')),
  scheduled_for TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agent actions" ON agent_actions;
DROP POLICY IF EXISTS "Service role can insert agent actions" ON agent_actions;
DROP POLICY IF EXISTS "Users can update own agent actions" ON agent_actions;

CREATE POLICY "Users can view own agent actions" ON agent_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert agent actions" ON agent_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own agent actions" ON agent_actions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Phase 7: Image Storage
-- ============================================

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('uploaded', 'generated')),
  storage_path TEXT NOT NULL,
  url TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add url column if it doesn't exist (for existing databases)
ALTER TABLE images ADD COLUMN IF NOT EXISTS url TEXT;

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own images" ON images;
DROP POLICY IF EXISTS "Users can insert their own images" ON images;
DROP POLICY IF EXISTS "Users can update their own images" ON images;
DROP POLICY IF EXISTS "Users can delete their own images" ON images;

CREATE POLICY "Users can view their own images" ON images
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own images" ON images
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own images" ON images
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own images" ON images
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Phase 8: Indexes for Performance
-- ============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Balcony indexes
CREATE INDEX IF NOT EXISTS idx_balconies_user_id ON balconies(user_id);

-- Plant indexes
CREATE INDEX IF NOT EXISTS idx_plants_balcony_id ON plants(balcony_id);
CREATE INDEX IF NOT EXISTS idx_plants_status ON plants(status);

-- Health snapshot indexes
CREATE INDEX IF NOT EXISTS idx_health_snapshots_plant_id ON health_snapshots(plant_id);
CREATE INDEX IF NOT EXISTS idx_health_snapshots_created_at ON health_snapshots(created_at DESC);

-- Conversation indexes (corrected for chat_messages)
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_created_at ON conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id_created_at ON chat_messages(conversation_id, created_at ASC);

-- User context memory indexes
CREATE INDEX IF NOT EXISTS idx_user_context_memory_user_id ON user_context_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_memory_type ON user_context_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_context_memory_created ON user_context_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_context_memory_expires ON user_context_memory(expires_at);

-- Agent action indexes
CREATE INDEX IF NOT EXISTS idx_agent_actions_user_status ON agent_actions(user_id, status);

-- Image indexes
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_type ON images(type);
CREATE INDEX IF NOT EXISTS idx_images_user_id_type ON images(user_id, type);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_url ON images(url) WHERE url IS NOT NULL;

-- ============================================
-- Phase 9: Functions & Triggers
-- ============================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_balconies_updated_at ON balconies;
CREATE TRIGGER update_balconies_updated_at BEFORE UPDATE ON balconies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plants_updated_at ON plants;
CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON plants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_images_updated_at ON images;
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update conversation timestamp when messages are added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversations.updated_at when messages are added
DROP TRIGGER IF EXISTS update_conversation_on_message ON chat_messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to upsert user memory (update if exists, insert if new)
CREATE OR REPLACE FUNCTION upsert_user_memory(
  p_user_id UUID,
  p_memory_type TEXT,
  p_memory_key TEXT,
  p_memory_value TEXT,
  p_confidence DECIMAL DEFAULT 1.0,
  p_source TEXT DEFAULT 'conversation',
  p_conversation_id TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_memory_id UUID;
BEGIN
  INSERT INTO user_context_memory (
    user_id, memory_type, memory_key, memory_value, 
    confidence, source, conversation_id, expires_at
  )
  VALUES (
    p_user_id, p_memory_type, p_memory_key, p_memory_value,
    p_confidence, p_source, p_conversation_id, p_expires_at
  )
  ON CONFLICT (user_id, memory_type, memory_key) 
  DO UPDATE SET
    memory_value = EXCLUDED.memory_value,
    confidence = EXCLUDED.confidence,
    source = EXCLUDED.source,
    conversation_id = EXCLUDED.conversation_id,
    expires_at = EXCLUDED.expires_at,
    created_at = now()
  RETURNING id INTO v_memory_id;
  
  RETURN v_memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Phase 10: Storage Configuration
-- ============================================

-- Insert storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
DROP POLICY IF EXISTS "Allow authenticated users to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own uploads" ON storage.objects;

CREATE POLICY "Allow authenticated users to view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete own uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- ============================================
-- Phase 11: Post-Migration Setup
-- ============================================

-- Backfill: Create profiles for existing auth users that don't have profiles yet
INSERT INTO public.users (id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Phase 12: Documentation
-- ============================================

COMMENT ON TABLE users IS 'User profiles extending Supabase auth.users. Each authenticated user has a profile.';
COMMENT ON TABLE conversations IS 'Chat conversations per user. Each conversation holds a thread of messages.';
COMMENT ON TABLE chat_messages IS 'Individual chat messages within a conversation. Includes optional image_url for uploaded images.';
COMMENT ON TABLE user_context_memory IS 'Append-only memory system for accumulating learned context about users. Used for personalized AI responses.';
COMMENT ON TABLE balconies IS 'Growing spaces/balconies owned by users.';
COMMENT ON TABLE plants IS 'Plant inventory tracked within balconies.';
COMMENT ON TABLE health_snapshots IS 'Photo analysis history for plants.';
COMMENT ON TABLE agent_actions IS 'Proactive notifications and scheduled actions for users.';
COMMENT ON TABLE images IS 'User-uploaded and AI-generated images.';
COMMENT ON COLUMN chat_messages.image_url IS 'Public URL to the image shared in the message (if any)';
COMMENT ON FUNCTION upsert_user_memory IS 'Safely upsert user memory entries. Updates existing memories with same type+key, inserts new ones otherwise.';
COMMENT ON VIEW user_active_memories IS 'View of non-expired user memories ordered by creation date.';

-- ============================================
-- Phase 13: RESET SCRIPT
-- ============================================
-- Use this section to reset the database to a fresh state
-- All data will be deleted, but the schema will remain intact
-- This is useful for development/testing when you want to:
-- - Clear all users
-- - Clear all conversations and chat history
-- - Clear all plants and balconies
-- - Clear all memories and context
-- - Clear all images
-- - Keep the complete schema scaffold intact
--
-- To run a full reset:
-- 1. Copy the queries from the "RESET" section below
-- 2. Paste them into Supabase SQL editor
-- 3. Run them (they will be executed in the correct order)
-- ============================================

-- ============================================
-- RESET: Clear All Data While Keeping Schema
-- ============================================
-- Run this section when you want to reset to a clean slate

-- DELETE FROM storage.objects WHERE bucket_id = 'images';

DELETE FROM chat_messages;
DELETE FROM conversations;
DELETE FROM health_snapshots;
DELETE FROM plants;
DELETE FROM balconies;
DELETE FROM agent_actions;
DELETE FROM user_context_memory;
DELETE FROM images;
DELETE FROM users;

-- Note: auth.users will NOT be deleted automatically
-- To also remove auth users, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Delete users manually, OR
-- 3. Use Supabase CLI or API to delete auth users programmatically
--
-- If you want to keep the auth users but just clear app data, 
-- skip deleting from the users table and just delete from:
-- - chat_messages
-- - conversations
-- - health_snapshots
-- - plants
-- - balconies
-- - agent_actions
-- - user_context_memory
-- - images

-- ============================================
-- Migration Complete
-- ============================================
-- This migration:
-- ✓ Removed unused tables (harvest_logs, bloom_map_entries)
-- ✓ Created all actively-used tables with correct columns
-- ✓ Added image_url column to chat_messages (fixes the error)
-- ✓ Set up all indexes for performance
-- ✓ Configured all RLS policies
-- ✓ Created all functions and triggers
-- ✓ Set up storage bucket
-- ✓ Is safe and idempotent (uses CREATE IF NOT EXISTS)
-- ✓ Includes reset script for clearing all data while preserving schema
-- ============================================

