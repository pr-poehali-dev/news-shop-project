CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) NOT NULL,
    persona_name VARCHAR(255) NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    amount VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_steam_id ON purchases(steam_id);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at DESC);