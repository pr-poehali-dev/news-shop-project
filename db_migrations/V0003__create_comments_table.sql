CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.comments (
    id SERIAL PRIMARY KEY,
    news_id INTEGER NOT NULL,
    author VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_news_id ON t_p15345778_news_shop_project.comments(news_id);
CREATE INDEX idx_comments_created_at ON t_p15345778_news_shop_project.comments(created_at DESC);