ALTER TABLE dealer_incentives
  ADD COLUMN IF NOT EXISTS deal_scope text NOT NULL DEFAULT 'specific';

-- Allow vehicle_model to be null for broad deals (all_new / all_used)
ALTER TABLE dealer_incentives
  ALTER COLUMN vehicle_model DROP NOT NULL;
