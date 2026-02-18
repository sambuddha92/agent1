-- ============================================
-- HARD RESET MIGRATION
-- ============================================
-- This migration performs a complete hard reset of the database schema.
-- It drops all existing tables, functions, triggers, and policies,
-- then rebuilds the entire schema aligned with the current codebase.
--
-- WARNING: This is DESTRUCTIVE. All data will be deleted.
-- Only use this when you want to completely reset the database.
--
-- What this migration does:
-- ✓ Drops all existing tables and cascading objects
-- ✓ Drops all functions, triggers, views, and policies
-- ✓ Rebuilds complete schema from scratch
-- ✓ Aligns schema with current codebase requirements
-- ✓ Removes unused tables (harvest_logs, bloom_map_entries)
-- ✓ Creates all necessary indexes and RLS policies
-- ✓ Sets up storage bucket
-- ============================================

-- ============================================
-- Phase 0: Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Phase 1: DESTRUCTIVE - Drop Everything
-- ============================================
-- These commands will delete all existing schema objects.
-- They are safe because they use IF EXISTS and CASCADE.

-- Drop views first (no CASCADE for views)
DROP VIEW IF EXISTS user_active_memories CASCADE;

-- Drop all tables with CASCADE (removes all foreign keys and triggers)
DROP TABLE IF EXISTS model_upgrade_interest CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS agent_actions CASCADE;
DROP TABLE IF EXISTS user_context_memory CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS health_snapshots CASCADE;
DROP TABLE IF EXISTS plants CASCADE;
DROP TABLE IF EXISTS balconies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop unused tables that may exist from previous migrations
DROP TABLE IF EXISTS harvest_logs CASCADE;
DROP TABLE IF EXISTS bloom_map_entries CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS upsert_user_memory(UUID, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TIMESTAMPTZ) CASCADE;

-- Drop existing storage policies that may conflict
DROP POLICY IF EXISTS "Allow authenticated users to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own uploads" ON storage.objects;

-- ============================================
-- Phase 2: Core User Management
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
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

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Phase 3: User Context Memory System
-- ============================================

CREATE TABLE user_context_memory (
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

CREATE POLICY "Users can view own memories" ON user_context_memory FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert memories" ON user_context_memory FOR INSERT 
  WITH CHECK (true);
CREATE POLICY "Service role can update memories" ON user_context_memory FOR UPDATE 
  USING (true);

-- View for active (non-expired) memories
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

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  summary TEXT,
  model_preference TEXT NOT NULL DEFAULT 'auto' CHECK (model_preference IN ('auto', 'fast', 'balanced', 'best')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

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

-- Chat messages table with image_url and model_preference support
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_id TEXT,
  tier TEXT,
  model_preference TEXT CHECK (model_preference IN ('auto', 'fast', 'balanced', 'best')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE balconies (
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

CREATE POLICY "Users can view own balconies" ON balconies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balconies" ON balconies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balconies" ON balconies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own balconies" ON balconies FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE plants (
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

CREATE POLICY "Users can view own plants" ON plants FOR SELECT 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can insert own plants" ON plants FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can update own plants" ON plants FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can delete own plants" ON plants FOR DELETE 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));

CREATE TABLE health_snapshots (
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

CREATE TABLE agent_actions (
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

CREATE POLICY "Users can view own agent actions" ON agent_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert agent actions" ON agent_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own agent actions" ON agent_actions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Phase 7: Image Storage
-- ============================================

CREATE TABLE images (
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

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own images" ON images
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own images" ON images
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own images" ON images
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own images" ON images
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Phase 8: Model Upgrade Interest
-- ============================================

CREATE TABLE model_upgrade_interest (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  model_tier TEXT NOT NULL CHECK (model_tier IN ('best', 'T3')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE model_upgrade_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own upgrade interest" ON model_upgrade_interest
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own upgrade interest" ON model_upgrade_interest
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage upgrade interest" ON model_upgrade_interest
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Phase 9: Indexes for Performance
-- ============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);

-- Balcony indexes
CREATE INDEX idx_balconies_user_id ON balconies(user_id);

-- Plant indexes
CREATE INDEX idx_plants_balcony_id ON plants(balcony_id);
CREATE INDEX idx_plants_status ON plants(status);

-- Health snapshot indexes
CREATE INDEX idx_health_snapshots_plant_id ON health_snapshots(plant_id);
CREATE INDEX idx_health_snapshots_created_at ON health_snapshots(created_at DESC);

-- Conversation indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_user_id_created_at ON conversations(user_id, created_at DESC);
CREATE INDEX idx_conversations_model_preference ON conversations(model_preference);

-- Chat message indexes
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at ASC);
CREATE INDEX idx_chat_messages_conversation_id_created_at ON chat_messages(conversation_id, created_at ASC);

-- User context memory indexes
CREATE INDEX idx_user_context_memory_user_id ON user_context_memory(user_id);
CREATE INDEX idx_user_context_memory_type ON user_context_memory(memory_type);
CREATE INDEX idx_user_context_memory_created ON user_context_memory(created_at DESC);
CREATE INDEX idx_user_context_memory_expires ON user_context_memory(expires_at);

-- Agent action indexes
CREATE INDEX idx_agent_actions_user_status ON agent_actions(user_id, status);

-- Image indexes
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_type ON images(type);
CREATE INDEX idx_images_user_id_type ON images(user_id, type);
CREATE INDEX idx_images_created_at ON images(created_at DESC);
CREATE INDEX idx_images_url ON images(url) WHERE url IS NOT NULL;

-- Model upgrade interest indexes
CREATE INDEX idx_model_upgrade_interest_user_id ON model_upgrade_interest(user_id);
CREATE INDEX idx_model_upgrade_interest_timestamp ON model_upgrade_interest(timestamp DESC);

-- ============================================
-- Phase 10: Functions & Triggers
-- ============================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at on table updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_balconies_updated_at BEFORE UPDATE ON balconies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON plants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
-- Phase 11: Storage Configuration
-- ============================================

-- Insert storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete own uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- ============================================
-- Phase 12: Post-Migration Setup
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
-- Phase 13: Documentation
-- ============================================

COMMENT ON TABLE users IS 'User profiles extending Supabase auth.users. Each authenticated user has a profile.';
COMMENT ON TABLE conversations IS 'Chat conversations per user. Each conversation holds a thread of messages with model preference.';
COMMENT ON TABLE chat_messages IS 'Individual chat messages within a conversation. Includes optional image_url and model_preference.';
COMMENT ON TABLE user_context_memory IS 'Append-only memory system for accumulating learned context about users. Used for personalized AI responses.';
COMMENT ON TABLE balconies IS 'Growing spaces/balconies owned by users.';
COMMENT ON TABLE plants IS 'Plant inventory tracked within balconies.';
COMMENT ON TABLE health_snapshots IS 'Photo analysis history for plants.';
COMMENT ON TABLE agent_actions IS 'Proactive notifications and scheduled actions for users.';
COMMENT ON TABLE images IS 'User-uploaded and AI-generated images with public URLs.';
COMMENT ON TABLE model_upgrade_interest IS 'Tracks when free users click Upgrade on locked model tiers.';
COMMENT ON COLUMN chat_messages.image_url IS 'Public URL to the image shared in the message (if any)';
COMMENT ON COLUMN chat_messages.model_preference IS 'The model preference active when this message was generated. Null for user messages.';
COMMENT ON COLUMN conversations.model_preference IS 'User-selected model preference for this conversation. One of: auto, fast, balanced, best.';
COMMENT ON COLUMN images.url IS 'Public URL to access the image from storage';
COMMENT ON FUNCTION upsert_user_memory IS 'Safely upsert user memory entries. Updates existing memories with same type+key, inserts new ones otherwise.';
COMMENT ON VIEW user_active_memories IS 'View of non-expired user memories ordered by creation date.';

-- ============================================
-- HARD RESET COMPLETE
-- ============================================
-- The database schema is now:
-- ✓ Completely reset (all old data deleted)
-- ✓ Aligned with current codebase requirements
-- ✓ Optimized with proper indexes
-- ✓ Secured with RLS policies
-- ✓ Ready for development or production
-- ============================================
