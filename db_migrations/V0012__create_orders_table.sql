-- Create orders table for payment tracking
CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.orders (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) NOT NULL,
    persona_name VARCHAR(255) NOT NULL,
    shop_item_id INTEGER NOT NULL REFERENCES t_p15345778_news_shop_project.shop_items(id),
    amount INTEGER NOT NULL,
    price INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE INDEX idx_orders_steam_id ON t_p15345778_news_shop_project.orders(steam_id);
CREATE INDEX idx_orders_status ON t_p15345778_news_shop_project.orders(status);
CREATE INDEX idx_orders_payment_id ON t_p15345778_news_shop_project.orders(payment_id);