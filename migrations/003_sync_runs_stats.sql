-- Полная статистика прогона синка: сколько применено, устарело и отброшено как невалидное
ALTER TABLE sync_runs
  ADD COLUMN applied INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN stale   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN invalid INTEGER NOT NULL DEFAULT 0;
