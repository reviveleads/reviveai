-- Vehicle intel table for caching real-time manufacturer incentives and news
CREATE TABLE IF NOT EXISTS vehicle_intel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealership_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  make TEXT,
  model TEXT,
  year INTEGER,
  intel_type TEXT NOT NULL DEFAULT 'general', -- 'incentive' | 'news' | 'redesign' | 'recall' | 'general'
  summary TEXT NOT NULL,
  source_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_intel_make_model ON vehicle_intel (make, model, year);
CREATE INDEX IF NOT EXISTS idx_vehicle_intel_fetched_at ON vehicle_intel (fetched_at DESC);

-- Auto-expire old intel (keep last 7 days)
-- Run periodically: DELETE FROM vehicle_intel WHERE fetched_at < NOW() - INTERVAL '7 days';
