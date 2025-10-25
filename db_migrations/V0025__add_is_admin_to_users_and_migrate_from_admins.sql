-- Добавляем колонку is_admin в таблицу users
ALTER TABLE t_p15345778_news_shop_project.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Переносим данные из admins в users (устанавливаем is_admin = true)
UPDATE t_p15345778_news_shop_project.users
SET is_admin = true
WHERE steam_id IN (
    SELECT steam_id FROM t_p15345778_news_shop_project.admins
);
