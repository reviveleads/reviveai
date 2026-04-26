-- Add optional business_name field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_name TEXT;
