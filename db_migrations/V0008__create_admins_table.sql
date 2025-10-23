CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(100) UNIQUE NOT NULL,
    persona_name VARCHAR(255),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_steam_id ON admins(steam_id);

INSERT INTO admins (steam_id, persona_name) 
VALUES ('YOUR_STEAM_ID', 'Admin') 
ON CONFLICT (steam_id) DO NOTHING;
