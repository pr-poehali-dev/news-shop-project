-- Create shop_items table for managing shop products
CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.shop_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial shop items
INSERT INTO t_p15345778_news_shop_project.shop_items (name, amount, price) VALUES
('Стартовый пакет', '500 монет', 199),
('Базовый пакет', '1,200 монет', 399),
('Премиум пакет', '2,800 монет', 799),
('Элитный пакет', '6,000 монет', 1499),
('Мега пакет', '15,000 монет', 2999),
('Легендарный пакет', '50,000 монет', 7999);