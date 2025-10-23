-- Создание таблицы для турниров
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prize_pool INTEGER NOT NULL,
    max_participants INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    tournament_type VARCHAR(50) NOT NULL,
    start_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для регистраций на турниры
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
    steam_id VARCHAR(255) NOT NULL,
    persona_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, steam_id)
);

-- Индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_steam_id ON tournament_registrations(steam_id);

-- Вставка турниров по умолчанию
INSERT INTO tournaments (name, description, prize_pool, max_participants, status, tournament_type, start_date) VALUES
('Чемпионат Осени 2025', 'Главный турнир сезона с максимальным призовым фондом', 100000, 500, 'active', 'vip', '2025-10-25 18:00:00'),
('Еженедельный турнир', 'Быстрый формат для всех желающих', 15000, 128, 'open', 'weekly', '2025-10-28 20:00:00'),
('Зимний Кубок 2025', 'Командный турнир 5 на 5', 50000, 32, 'upcoming', 'team', '2025-12-15 15:00:00');