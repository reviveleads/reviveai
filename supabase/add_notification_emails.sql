-- Add notification email columns to dealership_settings
ALTER TABLE dealership_settings
  ADD COLUMN IF NOT EXISTS sales_manager_email text,
  ADD COLUMN IF NOT EXISTS gm_email text,
  ADD COLUMN IF NOT EXISTS additional_emails text;
