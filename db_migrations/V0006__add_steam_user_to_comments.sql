ALTER TABLE t_p15345778_news_shop_project.comments 
ADD COLUMN steam_id VARCHAR(255),
ADD COLUMN avatar_url TEXT;

UPDATE t_p15345778_news_shop_project.comments
SET steam_id = NULL, avatar_url = NULL;