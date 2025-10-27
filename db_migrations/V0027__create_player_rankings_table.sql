CREATE TABLE IF NOT EXISTS player_rankings (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) NOT NULL,
    persona_name VARCHAR(255) NOT NULL,
    game VARCHAR(50) NOT NULL CHECK (game IN ('hearthstone', 'dota2', 'cs2')),
    points INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(steam_id, game)
);

CREATE INDEX idx_player_rankings_game_points ON player_rankings(game, points DESC);
CREATE INDEX idx_player_rankings_steam_id ON player_rankings(steam_id);

INSERT INTO player_rankings (steam_id, persona_name, game, points, wins, losses) VALUES
('76561198000000001', 'CardMaster', 'hearthstone', 8200, 412, 88),
('76561198000000002', 'DeckBuilder', 'hearthstone', 7950, 389, 111),
('76561198000000003', 'ManaKing', 'hearthstone', 7780, 356, 144),
('76561198000000004', 'SpellWeaver', 'hearthstone', 7610, 334, 166),
('76561198000000005', 'RNGLord', 'hearthstone', 7440, 312, 188),
('76561198000000006', 'LegendPlayer', 'hearthstone', 7280, 290, 210),
('76561198000000007', 'ArenaChamp', 'hearthstone', 7120, 268, 232),
('76561198000000008', 'TavernBrawler', 'hearthstone', 6960, 246, 254),
('76561198000000011', 'Miracle-', 'dota2', 9850, 542, 158),
('76561198000000012', 'Puppey', 'dota2', 9640, 498, 202),
('76561198000000013', 'SumaiL', 'dota2', 9420, 476, 224),
('76561198000000014', 'Arteezy', 'dota2', 9200, 454, 246),
('76561198000000015', 'N0tail', 'dota2', 8980, 432, 268),
('76561198000000016', 'Dendi', 'dota2', 8760, 410, 290),
('76561198000000017', 'KuroKy', 'dota2', 8540, 388, 312),
('76561198000000018', 'Topson', 'dota2', 8320, 366, 334),
('76561198000000021', 's1mple', 'cs2', 28400, 1242, 458),
('76561198000000022', 'ZywOo', 'cs2', 27800, 1198, 502),
('76561198000000023', 'NiKo', 'cs2', 27200, 1156, 544),
('76561198000000024', 'device', 'cs2', 26600, 1114, 586),
('76561198000000025', 'electronic', 'cs2', 26000, 1072, 628),
('76561198000000026', 'Twistzz', 'cs2', 25400, 1030, 670),
('76561198000000027', 'ropz', 'cs2', 24800, 988, 712),
('76561198000000028', 'b1t', 'cs2', 24200, 946, 754);
