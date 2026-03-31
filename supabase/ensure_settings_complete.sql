-- Idempotent: ensures dealership_settings has all required columns.
-- Safe to run even if some or all already exist.
-- Run this if Settings page is not saving data.

CREATE TABLE IF NOT EXISTS dealership_settings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID        NOT NULL UNIQUE,
  dealership_name TEXT      NOT NULL DEFAULT 'My Dealership',
  dealership_phone TEXT,
  salesperson_name TEXT,
  sending_email TEXT,
  reply_to_email TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compliance fields (from add_compliance_fields.sql)
ALTER TABLE dealership_settings ADD COLUMN IF NOT EXISTS legal_business_name TEXT;
ALTER TABLE dealership_settings ADD COLUMN IF NOT EXISTS state_of_operation   TEXT;
ALTER TABLE dealership_settings ADD COLUMN IF NOT EXISTS consent_confirmed    BOOLEAN NOT NULL DEFAULT false;

-- Brands (from add_news_incentives.sql)
ALTER TABLE dealership_settings ADD COLUMN IF NOT EXISTS brands_we_sell TEXT DEFAULT '';

-- Ensure the demo dealership row exists
INSERT INTO dealership_settings (dealership_id, dealership_name, salesperson_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'My Dealership', '')
ON CONFLICT (dealership_id) DO NOTHING;
