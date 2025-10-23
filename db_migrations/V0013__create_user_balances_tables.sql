-- Create user balances table
CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.user_balances (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) UNIQUE NOT NULL,
    persona_name VARCHAR(255) NOT NULL,
    balance INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create balance transactions history table
CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.balance_transactions (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_balances_steam_id ON t_p15345778_news_shop_project.user_balances(steam_id);
CREATE INDEX idx_balance_transactions_steam_id ON t_p15345778_news_shop_project.balance_transactions(steam_id);