-- Create payments table for tracking real money deposits
CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.payments (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) NOT NULL,
    persona_name VARCHAR(255) NOT NULL,
    amount_rubles INTEGER NOT NULL,
    amount_coins INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE INDEX idx_payments_steam_id ON t_p15345778_news_shop_project.payments(steam_id);
CREATE INDEX idx_payments_status ON t_p15345778_news_shop_project.payments(status);
CREATE INDEX idx_payments_payment_id ON t_p15345778_news_shop_project.payments(payment_id);