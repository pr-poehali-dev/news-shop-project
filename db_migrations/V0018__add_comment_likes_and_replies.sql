-- Добавить поле parent_comment_id для ответов на комментарии
ALTER TABLE comments ADD COLUMN parent_comment_id INTEGER NULL;
ALTER TABLE comments ADD CONSTRAINT fk_parent_comment 
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id);

-- Создать таблицу для лайков комментариев
CREATE TABLE comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL,
    steam_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id),
    UNIQUE(comment_id, steam_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_steam_id ON comment_likes(steam_id);