-- Add 'abandoned' to the leads status check constraint.
-- Abandoned = pending/contacted lead with no outbound activity in 30+ days.

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('pending', 'contacted', 'responded', 'appointed', 'dead', 'abandoned'));
