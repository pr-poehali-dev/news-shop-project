-- Create chat_messages table for global chat
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) NOT NULL,
    persona_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast loading of recent messages
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_steam_id ON chat_messages(steam_id);