
CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.chat_settings (
    id SERIAL PRIMARY KEY,
    is_frozen BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p15345778_news_shop_project.chat_settings (is_frozen) VALUES (FALSE);
