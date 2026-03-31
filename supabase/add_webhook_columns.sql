-- Add webhook_api_key to dealership_settings
ALTER TABLE dealership_settings
  ADD COLUMN IF NOT EXISTS webhook_api_key text;

-- Add lead_source_raw to leads (stores raw source label from webhook sender)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_source_raw text;

-- Create webhook_attempts log table
CREATE TABLE IF NOT EXISTS webhook_attempts (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dealership_id uuid NOT NULL,
  received_at timestamptz DEFAULT now() NOT NULL,
  source_ip   text,
  payload     text,
  status      text NOT NULL, -- 'accepted' | 'duplicate' | 'skipped_fresh' | 'error'
  lead_id     uuid,
  error_msg   text
);
