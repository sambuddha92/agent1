-- Add summary column to existing conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Update comment
COMMENT ON COLUMN conversations.summary IS 'Brief summary of conversation content';
