-- Таблица для хранения турнирной сетки
CREATE TABLE IF NOT EXISTS tournament_brackets (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    player1_steam_id VARCHAR(255),
    player2_steam_id VARCHAR(255),
    winner_steam_id VARCHAR(255),
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, round_number, match_number)
);

CREATE INDEX idx_tournament_brackets_tournament ON tournament_brackets(tournament_id);
CREATE INDEX idx_tournament_brackets_round ON tournament_brackets(tournament_id, round_number);
