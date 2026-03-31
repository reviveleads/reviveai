-- ============================================================
-- Contextual Intelligence Engine — Schema Migration
-- ============================================================

-- 1. Add trade-in and budget context fields to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS trade_in_make TEXT,
  ADD COLUMN IF NOT EXISTS trade_in_model TEXT,
  ADD COLUMN IF NOT EXISTS trade_in_year INTEGER,
  ADD COLUMN IF NOT EXISTS trade_in_mileage INTEGER,
  ADD COLUMN IF NOT EXISTS budget_notes TEXT,
  ADD COLUMN IF NOT EXISTS mileage_milestone_triggered BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Expand vehicle_intel table with structured incentive fields
ALTER TABLE vehicle_intel
  ADD COLUMN IF NOT EXISTS incentive_type TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS incentive_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS incentive_expiry DATE,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Update the old intel_type column values to match new incentive_type where sensible
UPDATE vehicle_intel
  SET incentive_type = intel_type
  WHERE incentive_type IS NULL OR incentive_type = 'general';

-- Index for active intel lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_intel_is_active ON vehicle_intel (is_active, fetched_at DESC);

-- ============================================================
-- Sample: Update seed lead with trade-in data (optional)
-- UPDATE leads
--   SET trade_in_make = 'Ford', trade_in_model = 'F-150', trade_in_year = 2019, trade_in_mileage = 82000
--   WHERE first_name = 'Joe' AND last_name = 'Test';
-- ============================================================
