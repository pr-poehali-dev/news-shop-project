CREATE TABLE IF NOT EXISTS t_p15345778_news_shop_project.leaderboard (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    rating INTEGER NOT NULL DEFAULT 1000,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    kills INTEGER NOT NULL DEFAULT 0,
    deaths INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    rank VARCHAR(50) NOT NULL DEFAULT 'Bronze',
    achievements TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_rating ON t_p15345778_news_shop_project.leaderboard(rating DESC);
CREATE INDEX idx_leaderboard_rank ON t_p15345778_news_shop_project.leaderboard(rank);

INSERT INTO t_p15345778_news_shop_project.leaderboard (player_name, avatar, rating, wins, losses, kills, deaths, level, rank, achievements) VALUES
('DarkKnight', '🎮', 2450, 245, 89, 3250, 1420, 45, 'Diamond', ARRAY['Легенда арены', 'Мастер оружия', 'Непобедимый']),
('ShadowHunter', '⚔️', 2380, 223, 95, 3100, 1380, 43, 'Diamond', ARRAY['Снайпер', 'Охотник', 'Меткий стрелок']),
('MysticMage', '🔮', 2290, 210, 102, 2890, 1350, 41, 'Diamond', ARRAY['Повелитель магии', 'Чародей', 'Маг высшего ранга']),
('ProGamer', '🏆', 2150, 198, 110, 2650, 1420, 39, 'Platinum', ARRAY['Про игрок', 'Чемпион', 'Победитель турниров']),
('TeamLeader', '👥', 2080, 185, 115, 2480, 1390, 38, 'Platinum', ARRAY['Лидер команды', 'Стратег', 'Командир']),
('HeroLover', '🔥', 1950, 172, 128, 2310, 1520, 36, 'Platinum', ARRAY['Любитель героев', 'Универсал', 'Экспериментатор']),
('TankMain', '🛡️', 1880, 165, 135, 2150, 1480, 35, 'Gold', ARRAY['Неуязвимый', 'Защитник', 'Щит команды']),
('BugHunter', '🐛', 1820, 158, 142, 2050, 1550, 34, 'Gold', ARRAY['Охотник за багами', 'Тестировщик', 'Аналитик']),
('SpeedRunner', '⚡', 1750, 145, 155, 1920, 1620, 32, 'Gold', ARRAY['Спидраннер', 'Быстрый', 'Молниеносный']),
('SniperElite', '🎯', 1690, 138, 162, 1850, 1650, 31, 'Gold', ARRAY['Элитный снайпер', 'Точный', 'Хэдшотер']),
('NightOwl', '🦉', 1620, 125, 175, 1720, 1780, 29, 'Silver', ARRAY['Ночной страж', 'Сова', 'Лунный воин']),
('StormBringer', '⛈️', 1580, 118, 182, 1650, 1820, 28, 'Silver', ARRAY['Повелитель бури', 'Громовержец', 'Штормовик']),
('IceQueen', '❄️', 1520, 112, 188, 1580, 1880, 27, 'Silver', ARRAY['Ледяная королева', 'Морозная', 'Хладнокровная']),
('FireDragon', '🐉', 1460, 105, 195, 1510, 1920, 26, 'Silver', ARRAY['Огненный дракон', 'Драконорожденный', 'Пламенный']),
('SilentAssassin', '🗡️', 1400, 98, 202, 1440, 1980, 25, 'Bronze', ARRAY['Тихий убийца', 'Ассасин', 'Призрак']),
('GhostRider', '👻', 1350, 92, 208, 1380, 2020, 24, 'Bronze', ARRAY['Призрачный гонщик', 'Призрак', 'Неуловимый']),
('ThunderStrike', '⚡', 1290, 85, 215, 1310, 2080, 23, 'Bronze', ARRAY['Удар грома', 'Громовой', 'Молниеносная атака']),
('CrystalGuard', '💎', 1230, 78, 222, 1240, 2140, 22, 'Bronze', ARRAY['Хрустальная стража', 'Защитник кристаллов', 'Блестящий']),
('SkyWalker', '🌟', 1180, 72, 228, 1180, 2190, 21, 'Bronze', ARRAY['Небесный странник', 'Ходящий по небу', 'Звездный']),
('RockSolid', '🗿', 1120, 65, 235, 1110, 2250, 20, 'Bronze', ARRAY['Твердый как камень', 'Несокрушимый', 'Каменный']);