-- Добавляем поле для сортировки товаров
ALTER TABLE shop_items ADD COLUMN order_position INTEGER NOT NULL DEFAULT 0;

-- Устанавливаем начальные позиции на основе id
UPDATE shop_items SET order_position = id * 10;

-- Создаем индекс для быстрой сортировки
CREATE INDEX idx_shop_items_order ON shop_items(order_position);