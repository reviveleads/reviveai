-- Add ai_paused to leads: when true, AI sequence is paused and dealer handles manually
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_paused boolean NOT NULL DEFAULT false;

-- Add sent_by to conversations: 'ai' (default) or 'manual' (dealer typed it)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sent_by text NOT NULL DEFAULT 'ai';
