-- Business metrics for ROI calculations
ALTER TABLE dealership_settings
  ADD COLUMN IF NOT EXISTS avg_deal_value integer NOT NULL DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS avg_lead_cost integer NOT NULL DEFAULT 400,
  ADD COLUMN IF NOT EXISTS monthly_plan_cost integer NOT NULL DEFAULT 1500;

-- Do Not Contact list
CREATE TABLE IF NOT EXISTS do_not_contact (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dealership_id uuid NOT NULL,
  phone       text,
  email       text,
  reason      text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS dnc_dealership_phone_idx ON do_not_contact(dealership_id, phone);
CREATE INDEX IF NOT EXISTS dnc_dealership_email_idx ON do_not_contact(dealership_id, email);
