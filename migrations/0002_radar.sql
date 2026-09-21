-- AuctionCarRadar scan history + notification ledger
CREATE TABLE IF NOT EXISTS radar_scans (
  id BIGSERIAL PRIMARY KEY,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER NOT NULL DEFAULT 0,
  fetched INTEGER NOT NULL DEFAULT 0,
  stage1 INTEGER NOT NULL DEFAULT 0,
  grade_a INTEGER NOT NULL DEFAULT 0,
  candidates INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0,
  sources_json JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS radar_listings (
  id TEXT PRIMARY KEY,
  scan_id BIGINT REFERENCES radar_scans(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_name TEXT NOT NULL DEFAULT '',
  case_no TEXT NOT NULL DEFAULT '',
  court_or_dept TEXT NOT NULL DEFAULT '',
  car_name TEXT NOT NULL DEFAULT '',
  year INTEGER,
  mileage INTEGER,
  fuel TEXT NOT NULL DEFAULT '',
  appraisal_price BIGINT,
  min_price BIGINT,
  discount_rate INTEGER,
  auction_date TEXT NOT NULL DEFAULT '',
  detail_url TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT '',
  key_status TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT 'rejected',
  reject_reasons_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  matched_key_keywords_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_text TEXT NOT NULL DEFAULT '',
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS radar_listings_grade_idx ON radar_listings (grade);
CREATE INDEX IF NOT EXISTS radar_listings_scan_id_idx ON radar_listings (scan_id);

CREATE TABLE IF NOT EXISTS radar_notified (
  listing_id TEXT PRIMARY KEY,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radar_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
