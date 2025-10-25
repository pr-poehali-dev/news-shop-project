-- Create menu_items table for managing navigation menu
CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    route VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default menu items
INSERT INTO t_p15345778_news_shop_project.menu_items (name, label, route, icon, is_visible, order_position) VALUES
('news', 'Новости', '/news', 'Newspaper', true, 1),
('shop', 'Магазин', '/shop', 'ShoppingBag', true, 2),
('servers', 'Наши сервера', '/servers', 'Server', true, 3),
('tournaments', 'Турниры', '/tournaments', 'Trophy', true, 4),
('partners', 'Партнёры', '/partners', 'Handshake', true, 5);
