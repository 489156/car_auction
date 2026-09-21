# AuctionCarRadar (`car_auction`)

Master project document for the South Korean high-value eco car auction / public-sale radar.

---

## 1. Purpose

**AuctionCarRadar** finds and ranks “A-grade” environmentally friendly cars from Korean court auction and public-sale channels, then surfaces them in a single UI with optional Telegram alerts.

Target profile (defaults):

| Criterion | Default |
| --- | --- |
| Model year | ≥ 2022 |
| Mileage | ≤ 50,000 km |
| Fuel | Hybrid / EV / related eco types |
| Key / start evidence | Must match at least one 차키 keyword (configurable) |
| Exclusions | Wreck / flood / undriveable / lien / scrap keywords |

**Business goal:** reduce manual hunting across 대법원 경매, 캠코 온비드, and 경매마당 by automating multi-source collection, filtering, dedupe, and “new A-grade” notification.

---

## 2. Design

### 2.1 Product shape

- **Single-page radar UI** (`src/routes/index.tsx`): scan now, source health cards, A / candidate / all tabs, settings.
- **Server-side scrape + filter** (`src/lib/radar/scan.ts`): TanStack Start server functions so listing fetches do not run in the browser.
- **Client preferences** (Zustand + `localStorage`): filter config, chat id, local history ids — **not** the Telegram bot token.
- **Durable history** (Postgres via `DATABASE_URL`, or embedded PGLite in preview): scans, listings, notified ledger (`migrations/0002_radar.sql`).
- **Scheduled runs**: Vercel cron → `GET/POST /api/cron/radar` every 6 hours (`vercel.json`), gated by `CRON_SECRET`.

### 2.2 Source architecture

```
┌─────────────┐   ┌─────────────┐   ┌──────────────────┐
│  madangs.com│   │  onbid.co.kr│   │ courtauction.go.kr│
│  (경매마당)  │   │  (온비드)    │   │ (대법원 / WebSquare)│
└──────┬──────┘   └──────┬──────┘   └────────┬─────────┘
       │ HTML/RSC parse  │ CSRF + AJAX       │ probe only
       ▼                 ▼                   ▼
              src/lib/radar/scrapers/*
                       │
                       ▼
              filter → enrich → grade
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
         UI         Postgres     Telegram
```

| Platform | Module | Role | Health expectation |
| --- | --- | --- | --- |
| 경매마당 | `scrapers/madang.ts` | Primary court-relay + listings; Next.js RSC payload parse via `m_code` windows | `live`, typically dozens of rows |
| 온비드 | `scrapers/onbid.ts` | Public-sale vehicle AJAX search | `live` when CSRF/session OK |
| 대법원 | `scrapers/court.ts` | Connectivity / WebSquare detection only | `blocked` by design (SPA); rely on 경매마당 |

### 2.3 Grading pipeline

1. **Fetch** each source (parallel).
2. **Dedupe** by listing id / case number across platforms.
3. **Prelim filter** (year, mileage, fuel, danger keywords) with key requirement relaxed.
4. **Enrich** detail pages for up to 20 prelim hits (unescape RSC / strip HTML).
5. **Final grade**
   - **A**: stage-1 + key keyword match
   - **Candidate**: stage-1 but missing key evidence
   - **Rejected**: failed year / mileage / fuel / danger rules
6. **Persist** scan + listings; optionally notify **new** A-grade only.

### 2.4 Stack

| Layer | Choice |
| --- | --- |
| App framework | TanStack Start / Router, React 19, Vite 8 |
| UI | Tailwind 4, Radix, Zustand |
| Data | Kysely-ready SQL helper (`src/lib/db.ts`), Neon or PGLite |
| Auth scaffold | Better Auth present but **off** for radar (unowned data OK) |
| Deploy target | Vercel (Nitro preset); Grok App Builder workspace heritage (`AGENTS.md`) |

### 2.5 Secrets & config

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Bot token (preferred; not stored in `localStorage`) |
| `TELEGRAM_CHAT_ID` | Destination chat (env or UI) |
| `CRON_SECRET` | Required bearer/query secret for `/api/cron/radar` when set |
| `DATABASE_URL` | Neon/Postgres in production; omit → PGLite self-migrates in preview |

UI still allows a session-only token override; settings copy documents the env-first policy.

---

## 3. Implementation stages & scope

### Stage 0 — Product scaffold (done upstream)

- Grok App Builder / Vercel workspace, preview on `:8080`, PWA chrome.
- Radar UI, filter defaults, Telegram alert server fn, three scraper stubs/live paths.

### Stage 1 — Live scraper health *(completed 2026-09-21)*

**Scope**

- Make madang/onbid fetch reliably observable.
- Treat court `blocked` as expected, not a failure.
- Fail CI/local smoke when madang/onbid are unhealthy.

**Delivered**

- Madang parser rewrite for Next.js payload (`m_code` before/after field windows, multi-pass unescape, thin-yield retry).
- `scripts/verify-scrapers.mjs` + `npm run check:scrapers` / `check:scrapers:fast`.
- Commit: `4da4847`.

### Stage 2 — Grade-A / 차키 enrich quality *(completed 2026-09-21)*

**Scope**

- Stop cross-listing field bleed in madang parse.
- Expand key-keyword vocabulary; normalize whitespace matches.
- Enrich more candidates and unescape detail RSC text.

**Delivered**

- Expanded `keywordsMustHave` (e.g. 스마트키, 버튼시동, compact forms).
- `findKeywords` compact matching; enrich limit 20; detail unescape.
- Commit: `3cdca47`.

### Stage 3 — Secrets + durable history *(completed 2026-09-21)*

**Scope**

- Remove bot token persistence from the browser store.
- Persist scans / listings / notified ids in SQL.
- Prefer env-based Telegram resolution on the server.

**Delivered**

- `migrations/0002_radar.sql`, `src/lib/radar/persistence.ts`.
- Scan path persists by default; notify ledger on successful sends.
- Commit: `226c175` (bundled with Stage 4).

### Stage 4 — Scheduled radar *(completed 2026-09-21)*

**Scope**

- Unattended scan every 6 hours.
- Telegram only for **new** A-grade vs notified ledger.
- Secret-gated HTTP entrypoint for Vercel Cron / ops scripts.

**Delivered**

- `runScheduledRadar` server fn, `src/routes/api/cron/radar.ts`, `vercel.json` cron `0 */6 * * *`.
- `npm run radar:cron` helper (`RADAR_BASE_URL` + `CRON_SECRET`).
- Commit: `226c175`.

### Stage 5 — Out of current scope (backlog)

| Item | Why it matters |
| --- | --- |
| Real 대법원 listing scrape (browser/WebSquare or official API) | Removes dependency on 경매마당 relay |
| Stronger madang contract tests / fixture HTML | Catch payload shape changes before production |
| Deploy env wiring confirmation + one live cron cycle | Closes the ops loop on Vercel |
| Multi-user auth + per-user radar profiles | Only if product leaves single-operator mode |
| Onbid NetFunnel / queue resilience | Avoid `blocked` during peak public-sale traffic |
| README-linked runbook for Telegram BotFather setup | Faster onboarding for operators |

---

## 4. Current implementation status

**As of 2026-09-21 — `origin/main` @ `226c175`**

| Area | Status | Notes |
| --- | --- | --- |
| Madang scrape | **Live** | Next.js RSC parse healthy in smoke tests |
| Onbid scrape | **Live** | CSRF + vehicle AJAX |
| Court scrape | **Blocked (expected)** | WebSquare SPA; message points to madang relay |
| Manual UI scan | **Working** | A / candidate / all + settings |
| Grade-A promotion | **Working** | Needs enrich + key keywords; count varies by market day |
| Scraper smoke | **Working** | `npm run check:scrapers` |
| Telegram | **Implemented** | Env-first; needs deploy secrets |
| DB history | **Implemented** | Migration present; needs `DATABASE_URL` in prod |
| Cron | **Implemented** | Every 6h route ready; needs `CRON_SECRET` + Vercel cron enablement |
| Auth | **Off** | Scaffold only |
| Production env verification | **Pending operator** | Set secrets and confirm one cron run |

### Git worktree (this machine)

```text
C:\Users\User\Downloads\cursor\car_auction\car_auction-git
```

Remote: `https://github.com/489156/car_auction`

### Quick commands

```bash
npm install
npm run check:scrapers          # live source health (enrich on)
npm run check:scrapers:fast     # fetch/parse only
npm run typecheck
node scripts/with-app-env.mjs node node_modules/vite/bin/vite.js build
npm run radar:cron              # requires RADAR_BASE_URL (+ CRON_SECRET)
```

### Deploy checklist

1. Set `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET` on Vercel.
2. Deploy `main` (Nitro/Vercel output already buildable locally).
3. Confirm `GET /api/cron/radar` with `Authorization: Bearer $CRON_SECRET` returns `ok: true`.
4. Confirm Vercel Cron job for `/api/cron/radar` is active (every 6 hours).

---

## 5. Repository map (radar-relevant)

```text
src/lib/radar/
  config.ts          # defaults (filters, UA, telegram empty defaults)
  types.ts           # listings, grades, scan result
  filter.ts          # grading rules
  parser.ts          # year/mileage/fuel/keywords
  scan.ts            # runAuctionScan, Telegram, runScheduledRadar
  persistence.ts     # SQL save/load/notify
  store.ts           # client Zustand store
  scrapers/          # madang, onbid, court, http helpers
src/routes/index.tsx             # UI
src/routes/api/cron/radar.ts     # cron HTTP entry
src/components/radar/            # cards + settings
migrations/0002_radar.sql
scripts/verify-scrapers.mjs
scripts/run-scheduled-radar.mjs
vercel.json
```

---

## 6. Document control

| Field | Value |
| --- | --- |
| Document | Master README |
| Project | AuctionCarRadar / `car_auction` |
| Last updated | 2026-09-21 |
| Maintainer context | Senior development partner handoff for company portfolio |

When behavior changes (new source, grading rules, cron cadence), update **§3 stages** and **§4 status** in the same PR.
