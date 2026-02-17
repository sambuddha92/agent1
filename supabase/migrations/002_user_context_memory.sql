-- ============================================
-- User Context Memory System
-- ============================================
-- Append-only memory accumulation for personalization
-- Zero breaking changes to existing schema
-- ============================================

-- User Context Memory - stores learned facts about users
CREATE TABLE user_context_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Memory classification
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'preference',        -- User preferences (e.g., "prefers organic methods")
    'constraint',        -- Physical constraints (e.g., "limited time for maintenance")
    'goal',             -- User goals (e.g., "wants to grow herbs for cooking")
    'observation',      -- Agent observations (e.g., "user waters irregularly")
    'success',          -- Successful outcomes (e.g., "tomatoes thrived with weekly feeding")
    'failure',          -- Failed attempts (e.g., "basil died from overwatering")
    'interaction',      -- Interaction patterns (e.g., "prefers brief responses")
    'context'           -- General context (e.g., "travels frequently for work")
  )),
  
  -- Memory content
  memory_key TEXT NOT NULL,           -- Structured key (e.g., "watering_style", "diet_type")
  memory_value TEXT NOT NULL,         -- Human-readable value
  confidence DECIMAL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Metadata
  source TEXT DEFAULT 'conversation', -- 'conversation', 'observation', 'explicit', 'inferred'
  conversation_id TEXT,               -- Optional: link to conversation where learned
  expires_at TIMESTAMPTZ,            -- Optional: for time-sensitive memories
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent exact duplicates
  UNIQUE(user_id, memory_type, memory_key)
);

-- Indexes for efficient queries
CREATE INDEX idx_user_memory_user_id ON user_context_memory(user_id);
CREATE INDEX idx_user_memory_type ON user_context_memory(memory_type);
CREATE INDEX idx_user_memory_created ON user_context_memory(created_at DESC);
CREATE INDEX idx_user_memory_expires ON user_context_memory(expires_at);

-- RLS Policies
ALTER TABLE user_context_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories" ON user_context_memory FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert memories" ON user_context_memory FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role can update memories" ON user_context_memory FOR UPDATE 
  USING (true);

-- Function to upsert memory (update if exists, insert if new)
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
    created_at = now()  -- Update timestamp on conflict
  RETURNING id INTO v_memory_id;
  
  RETURN v_memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Grant permissions
GRANT SELECT ON user_active_memories TO authenticated;
GRANT SELECT ON user_active_memories TO service_role;

-- Comment for documentation
COMMENT ON TABLE user_context_memory IS 
  'Append-only memory system for accumulating learned context about users. Used for personalized AI responses.';

COMMENT ON FUNCTION upsert_user_memory IS
  'Safely upsert user memory entries. Updates existing memories with same type+key, inserts new ones otherwise.';
