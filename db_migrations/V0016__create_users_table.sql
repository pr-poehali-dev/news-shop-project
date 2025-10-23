CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.users (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) UNIQUE NOT NULL,
    persona_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    profile_url TEXT,
    balance INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    last_login TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_steam_id ON t_p15345778_news_shop_project.users(steam_id);
CREATE INDEX idx_users_is_blocked ON t_p15345778_news_shop_project.users(is_blocked);
