-- ============================================
-- Add Model Preference to Conversations
-- ============================================
-- Stores the user's selected model preference per conversation.
-- Defaults to 'auto' — fully backward compatible.
-- All existing conversations will get 'auto' as their preference.
-- ============================================

-- Add model_preference column to conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS model_preference TEXT NOT NULL DEFAULT 'auto'
  CHECK (model_preference IN ('auto', 'fast', 'balanced', 'best'));

-- Add model_preference to chat_messages to track which preference was
-- active at the time each assistant message was generated.
-- model_id already stores the raw Bedrock model ID.
-- This column stores the human-facing preference that produced it.
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS model_preference TEXT
  CHECK (model_preference IN ('auto', 'fast', 'balanced', 'best'));

-- Index for efficiently filtering conversations by model preference
-- Useful for analytics on which models users prefer
CREATE INDEX IF NOT EXISTS idx_conversations_model_preference
  ON conversations(model_preference);

-- Comment for documentation
COMMENT ON COLUMN conversations.model_preference IS
  'User-selected model preference for this conversation. One of: auto, fast, balanced, best. Defaults to auto.';

COMMENT ON COLUMN chat_messages.model_preference IS
  'The model preference active when this message was generated. Null for user messages.';
