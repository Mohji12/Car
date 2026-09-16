-- CarWebs Motors — PostgreSQL schema
-- Source of truth: lib/db/src/schema/vehicles.ts
-- Usage: psql -U carwebs -d carwebs -f schema.sql

CREATE TABLE IF NOT EXISTS vehicles (
  id                   TEXT PRIMARY KEY,
  make                 TEXT NOT NULL,
  model                TEXT NOT NULL,
  variant              TEXT NOT NULL DEFAULT '',
  year                 INTEGER NOT NULL,
  price                INTEGER NOT NULL,
  mileage              INTEGER NOT NULL,
  fuel                 TEXT NOT NULL,
  transmission         TEXT NOT NULL,
  body_type            TEXT NOT NULL,
  colour               TEXT NOT NULL,
  location             TEXT NOT NULL DEFAULT 'St Albans',
  status               TEXT NOT NULL DEFAULT 'available',
  tags                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured             BOOLEAN NOT NULL DEFAULT FALSE,
  description          TEXT NOT NULL DEFAULT '',
  highlights           JSONB NOT NULL DEFAULT '[]'::jsonb,
  specs                JSONB NOT NULL DEFAULT '[]'::jsonb,
  images               JSONB NOT NULL DEFAULT '[]'::jsonb,
  condition            TEXT NOT NULL DEFAULT 'Used',
  doors                INTEGER,
  engine_size          TEXT,
  registration_date    TEXT,
  registration_plate   TEXT,
  video_url            TEXT,
  view_count           INTEGER NOT NULL DEFAULT 0,
  added_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes for common list filters
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles (status);
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles (make);
CREATE INDEX IF NOT EXISTS idx_vehicles_added_at ON vehicles (added_at DESC);
