-- Add is_hidden column for chat moderation
ALTER TABLE chat_messages 
ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;

-- Add index for filtering hidden messages
CREATE INDEX idx_chat_messages_is_hidden ON chat_messages(is_hidden);