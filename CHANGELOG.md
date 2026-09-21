# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **S-Tier Precision Dashboard** — full rewrite of the main UI to match the prototype contract (`src/routes/index.tsx`)
- **5-rule S-Tier evaluator** (`src/lib/radar/stier.ts`) — weighted 0–100 score with per-rule breakdown
- **Spotlight banner + KPI cards + filter bar + listings table + 4 modal components**
- **S-Tier web push notification drawer** (Zustand-backed, threshold-aware)
- **`0003_radar_stier.sql` migration** — `is_stier`, `s_tier_score`, `s_tier_breakdown_json`, `storage_site`, `matched_danger_keywords_json` columns
- **Cross-platform `with-app-env.mjs`** — resolves `vite.cmd` on Windows so `npm run dev` / `npm run build` work end-to-end without manual path wrangling
- **Playwright E2E harness** (`scripts/verify-stier-flow.mjs`) — 10/10 steps, zero console errors, runs against the live dev server
- **Unit tests for the S-Tier detector** (`src/lib/radar/stier.test.ts`) — 11 tests including the 3 prototype benchmark listings

### Changed
- `scan.ts` — sorts S-Tier-first by score, then A-Grade, then candidate
- `config.ts` — added `시동 정상`, `정상 시동`, `스페어키 2개`, `키 2개`, `키 보유` and 5 more key-keyword variants
- `stier.ts` `isOfficialStorage` — widened keyword list from 10 → 28; added platform-aware Onbid/캠코 inference

### Fixed
- **EV6 false negative** — `"인천항 공영 전문보관소"` previously failed rule ④ due to whitespace-split keywords; now passes
- **Mobile scan button wrapping** — hides full label on `<sm` viewports
- **Modal keyboard traps** — Escape closes whichever overlay is on top

### Known limitations
- Live production scrapes rarely surface S-Tier matches because the source platforms don't embed keeper names in their listing text. Detector accuracy is unit-test-verified; data hit rate depends on the source.
- TanStack Router `notFoundComponent` warning in dev logs (no impact on production).

---

## [1.0.0] — Initial public release

### Added
- 3-source scraper (Court / Onbid / Madang) with cross-platform HTML / JSON parsers
- A-grade filtering with key-keyword enrichment
- Telegram alerts via server-side environment variables
- PGLite durable scan history with hourly cron (`vercel.json` `0 */6 * * *`)
- Vercel deployment target with `.vercel/output/` Nitro preset
- React 19 dashboard with Radix UI primitives and Tailwind v4 styling