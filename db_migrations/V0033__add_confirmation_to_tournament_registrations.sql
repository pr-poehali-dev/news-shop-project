-- Добавляем поле confirmed_at для подтверждения участия
ALTER TABLE tournament_registrations
ADD COLUMN confirmed_at TIMESTAMP DEFAULT NULL;

-- Добавляем индекс для быстрого поиска неподтвержденных регистраций
CREATE INDEX idx_tournament_registrations_confirmed ON tournament_registrations(tournament_id, confirmed_at);