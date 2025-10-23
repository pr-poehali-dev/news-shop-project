CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    logo VARCHAR(50) NOT NULL DEFAULT '🤝',
    website VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Общее',
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active);
CREATE INDEX IF NOT EXISTS idx_partners_order ON partners(order_position);

INSERT INTO partners (name, description, logo, website, category, is_active, order_position) VALUES
('Steam', 'Платформа цифровой дистрибуции игр', '🎮', 'https://store.steampowered.com', 'Игровые платформы', true, 1),
('Discord', 'Платформа для голосового и текстового общения', '💬', 'https://discord.com', 'Коммуникации', true, 2);
