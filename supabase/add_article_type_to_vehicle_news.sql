-- Add article_type classification column to vehicle_news.
-- Run this in the Supabase SQL editor.

ALTER TABLE vehicle_news ADD COLUMN IF NOT EXISTS article_type text NOT NULL DEFAULT 'news';

-- One-time backfill: classify existing articles by headline keywords
-- Deal articles first (higher priority than new_model)
UPDATE vehicle_news SET article_type = 'deal'
WHERE article_type = 'news' AND (
  lower(headline) LIKE '%discount%' OR
  lower(headline) LIKE '%lease%' OR
  lower(headline) LIKE '%finance%' OR
  lower(headline) LIKE '% apr %' OR
  lower(headline) LIKE '%incentive%' OR
  lower(headline) LIKE '%rebate%' OR
  lower(headline) LIKE '% deal%' OR
  lower(headline) LIKE '%offer%' OR
  lower(headline) LIKE '%savings%' OR
  lower(headline) LIKE '%cash back%' OR
  lower(headline) LIKE '%per month%' OR
  lower(headline) LIKE '%off msrp%' OR
  lower(headline) LIKE '%special%'
);

-- New model articles
UPDATE vehicle_news SET article_type = 'new_model'
WHERE article_type = 'news' AND (
  lower(headline) LIKE '%revealed%' OR
  lower(headline) LIKE '%debuts%' OR
  lower(headline) LIKE '%unveiled%' OR
  lower(headline) LIKE '%first look%' OR
  lower(headline) LIKE '%new model%' OR
  lower(headline) LIKE '%next generation%' OR
  lower(headline) LIKE '%next-generation%' OR
  lower(headline) LIKE '%redesign%' OR
  lower(headline) LIKE '%2026%' OR
  lower(headline) LIKE '%2027%'
);
