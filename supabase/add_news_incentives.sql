-- ============================================================
-- News Feed, Incentives, Inventory, and Intent Schema
-- ============================================================

-- 1. Vehicle news from RSS feeds
CREATE TABLE IF NOT EXISTS vehicle_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealership_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  headline TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  source TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_news_brand ON vehicle_news (brand, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_news_dealership ON vehicle_news (dealership_id, published_at DESC);

-- 2. Manual dealer incentives
CREATE TABLE IF NOT EXISTS dealer_incentives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealership_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  vehicle_model TEXT NOT NULL,
  deal_description TEXT NOT NULL,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dealer_incentives_dealership ON dealer_incentives (dealership_id, expires_at);

-- 3. Dealer inventory (for budget-driven lead matching)
CREATE TABLE IF NOT EXISTS dealer_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealership_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  price NUMERIC,
  mileage INTEGER,
  condition TEXT DEFAULT 'used', -- 'new' | 'used' | 'certified'
  category TEXT,                  -- 'truck' | 'suv' | 'sedan' | 'van' | 'sports'
  stock_number TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dealer_inventory_available ON dealer_inventory (dealership_id, is_available, category);

-- 4. Add brands_we_sell to dealership_settings
ALTER TABLE dealership_settings
  ADD COLUMN IF NOT EXISTS brands_we_sell TEXT DEFAULT '';

-- 5. Add lead_intent to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_intent TEXT; -- 'model_loyal' | 'budget_driven'
