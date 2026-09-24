-- Add Features / Spec / Running costs columns to existing MySQL vehicles table.
-- Run against the Car database, e.g.:
--   mysql -h HOST -u USER -p Car < lib/db/migrations/2026_03_24_vehicle_details.sql

ALTER TABLE vehicles
  ADD COLUMN feature_categories JSON NOT NULL DEFAULT (JSON_ARRAY()),
  ADD COLUMN spec_categories JSON NOT NULL DEFAULT (JSON_ARRAY()),
  ADD COLUMN running_costs JSON NULL;
