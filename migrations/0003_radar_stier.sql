-- AuctionCarRadar: S-Tier precision persistence (added in 2026-09-21 rewrite).
-- Adds the S-Tier rule checklist + score to the durable listing ledger so the
-- dashboard can show score/breakdown across reloads and Vercel cron restarts.
ALTER TABLE radar_listings
  ADD COLUMN IF NOT EXISTS storage_site TEXT,
  ADD COLUMN IF NOT EXISTS is_stier BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS s_tier_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS s_tier_breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS matched_danger_keywords_json JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS radar_listings_is_stier_idx
  ON radar_listings (is_stier, s_tier_score DESC);