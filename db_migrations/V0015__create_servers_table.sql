CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(100) NOT NULL,
    port INTEGER NOT NULL,
    game_type VARCHAR(100) NOT NULL,
    map VARCHAR(100),
    max_players INTEGER NOT NULL DEFAULT 32,
    current_players INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'online',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_servers_is_active ON t_p15345778_news_shop_project.servers(is_active);
CREATE INDEX IF NOT EXISTS idx_servers_order_position ON t_p15345778_news_shop_project.servers(order_position);