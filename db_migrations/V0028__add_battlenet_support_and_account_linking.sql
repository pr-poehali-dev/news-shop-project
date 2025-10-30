-- Добавляем поля для Battle.net и связки аккаунтов
ALTER TABLE t_p15345778_news_shop_project.users 
ADD COLUMN battlenet_id VARCHAR(255) NULL,
ADD COLUMN battlenet_battletag VARCHAR(255) NULL,
ADD COLUMN primary_auth_provider VARCHAR(50) NULL DEFAULT 'steam';

-- Индексы для поиска по Battle.net ID
CREATE INDEX idx_users_battlenet_id ON t_p15345778_news_shop_project.users(battlenet_id);

-- Обновляем существующих пользователей
UPDATE t_p15345778_news_shop_project.users 
SET primary_auth_provider = 'steam' 
WHERE primary_auth_provider IS NULL;