-- Fix vehicle_news to support one row per (url, brand) pair.
-- This allows the same article to appear under multiple brands.
-- Run this in the Supabase SQL editor when convenient.
--
-- After running this migration, the #_b= URL fragment workaround in
-- rssScraper.ts is no longer needed — re-scraping will populate clean rows.

-- Drop the single-column unique constraint
ALTER TABLE vehicle_news DROP CONSTRAINT IF EXISTS vehicle_news_url_key;

-- Add composite unique constraint on (url, brand)
ALTER TABLE vehicle_news ADD CONSTRAINT vehicle_news_url_brand_key UNIQUE (url, brand);

-- Remove any stale #_b= fragment URLs inserted by the workaround
-- (strip the fragment and re-dedupe)
DELETE FROM vehicle_news a
USING vehicle_news b
WHERE a.url LIKE '%#_b=%'
  AND b.url = regexp_replace(a.url, '#_b=.*$', '')
  AND b.brand = a.brand;

UPDATE vehicle_news
SET url = regexp_replace(url, '#_b=.*$', '')
WHERE url LIKE '%#_b=%';
