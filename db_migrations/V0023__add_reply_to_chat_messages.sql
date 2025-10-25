-- Add reply_to_message_id column to chat_messages table
ALTER TABLE t_p15345778_news_shop_project.chat_messages 
ADD COLUMN reply_to_message_id INTEGER NULL;