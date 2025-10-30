-- Создание таблицы администраторов
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы турниров
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prize_pool INTEGER,
    max_participants INTEGER,
    tournament_type VARCHAR(50) DEFAULT 'solo',
    start_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'upcoming',
    game VARCHAR(100) DEFAULT 'CS2',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавление первого администратора (твой Steam ID)
INSERT INTO admins (steam_id) 
VALUES ('76561198974174275')
ON CONFLICT (steam_id) DO NOTHING;