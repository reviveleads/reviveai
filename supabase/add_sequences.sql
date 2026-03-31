-- Add lead tier and sequence pause to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_tier TEXT
  CHECK (lead_tier IN ('hot', 'warm', 'cold'));

ALTER TABLE leads ADD COLUMN IF NOT EXISTS sequence_paused BOOLEAN NOT NULL DEFAULT false;

-- Campaign sequences table
CREATE TABLE IF NOT EXISTS campaign_sequences (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  dealership_id UUID        NOT NULL,
  channel       TEXT        NOT NULL CHECK (channel IN ('sms', 'email')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  touch_number  INTEGER     NOT NULL,
  sent_at       TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent duplicate sequence entries for the same lead+touch
  CONSTRAINT uq_campaign_sequence_lead_touch UNIQUE (lead_id, touch_number)
);

-- Cron query index: all pending touches due now
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_status_scheduled
  ON campaign_sequences (status, scheduled_for);

-- Per-lead sequence lookup
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_lead_id
  ON campaign_sequences (lead_id);

-- Dealership-scoped lookup
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_dealership
  ON campaign_sequences (dealership_id, status);
