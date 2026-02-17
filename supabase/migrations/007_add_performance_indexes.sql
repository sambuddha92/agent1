-- ============================================
-- Migration: Add Performance Indexes
-- ============================================
-- Purpose: Optimize common queries for better performance
-- Benefits:
--   - Faster conversation lookups by user
--   - Faster message retrieval by conversation
--   - Better overall database query performance
-- ============================================

-- Conversations table indexes
-- Speed up: SELECT * FROM conversations WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Speed up: SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_created_at ON conversations(user_id, created_at DESC);

-- Messages table indexes
-- Speed up: SELECT * FROM messages WHERE conversation_id = ?
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Speed up: SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON messages(conversation_id, created_at ASC);

-- Speed up: SELECT * FROM messages WHERE user_id = ? (for analytics/logging)
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- User context memory indexes
-- Speed up: SELECT * FROM user_context_memory WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_user_context_memory_user_id ON user_context_memory(user_id);

-- Speed up: SELECT * FROM user_context_memory WHERE user_id = ? AND memory_type = ?
CREATE INDEX IF NOT EXISTS idx_user_context_memory_user_id_type ON user_context_memory(user_id, memory_type);

-- Images table indexes (supplements the ones already created in migration 005)
-- Speed up: SELECT * FROM images WHERE user_id = ? AND type = ?
CREATE INDEX IF NOT EXISTS idx_images_user_id_type ON images(user_id, type);

-- Add index for created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);

-- Add comment to document the performance optimization
COMMENT ON INDEX idx_conversations_user_id IS 'Optimizes fetching user conversations';
COMMENT ON INDEX idx_conversations_user_id_created_at IS 'Optimizes fetching and sorting user conversations by date';
COMMENT ON INDEX idx_messages_conversation_id IS 'Optimizes fetching messages within a conversation';
COMMENT ON INDEX idx_messages_conversation_id_created_at IS 'Optimizes fetching and sorting messages by date';
COMMENT ON INDEX idx_messages_user_id IS 'Optimizes fetching user messages for analytics';
COMMENT ON INDEX idx_user_context_memory_user_id IS 'Optimizes fetching user memory context';
COMMENT ON INDEX idx_user_context_memory_user_id_type IS 'Optimizes filtering memory by type';
COMMENT ON INDEX idx_images_user_id_type IS 'Optimizes filtering images by type';
COMMENT ON INDEX idx_images_created_at IS 'Optimizes time-based image queries';
