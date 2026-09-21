# AuctionCarRadar — Beginner's Guide

> A step-by-step explanation, written for someone who has **no programming experience**.
> If you can install an app and click buttons, you can run this program.

---

## Part 1 — What is this program?

AuctionCarRadar is a **smart shopping assistant** for Korean car auctions.

Every day, three big Korean auction sites list hundreds of used cars:

* 🏛️ **대법원 법원경매** (Court Auctions) — `courtauction.go.kr`
* 🏢 **캠코 온비드** (Korea Asset Management Corp) — `onbid.co.kr`
* 🚗 **경매마당** (Madang) — `madangs.com`

The problem: those sites are slow to browse, full of jargon, and the **really good deals** (newly-listed, low-mileage, big-discount hybrid/EV cars) get buried under hundreds of less-interesting listings.

AuctionCarRadar does the boring part for you:

1. Visits all three sites
2. Pulls every listing
3. **Filters out** cars that are wrecked, flooded, or have no key
4. **Grades** what remains:
   * **A-Grade** — meets all the basic rules (recent year, low mileage, hybrid/EV, has key)
   * **S-Tier** — the "creme de la creme" — a 5-rule precision score that confirms: very low mileage, manufacturer warranty still active, sweet-spot discount (≥30%), stored at a professional keeper (like Automart), and accident history cross-checked
5. **Shows** the best ones in a clean dashboard
6. **Alerts** you the moment a new S-Tier match appears

In short: it's a personal radar that finds hidden-gem auction cars before anyone else.

---

## Part 2 — What you'll see when you open it

The main screen is a **dashboard** (think "car dashboard" but for car-shopping). It has six zones:

```
┌────────────────────────────────────────────────────────────────┐
│ 🔍 AuctionCarRadar      [S-Tier Precision Engine]  🔔  ⚙  ▶ Scan│  ← Header
├────────────────────────────────────────────────────────────────┤
│ ⭐ Spotlight: top deal of the moment                              │  ← Hero
├────────────────────────────────────────────────────────────────┤
│ [ 72 ]   [ 3 ] S-Tier  [ 8 ] A-Grade  [ 33% ] Sweet Discount    │  ← KPI cards
├────────────────────────────────────────────────────────────────┤
│ Search: [____________]  Tier:[S-Tier] Platform:[All] ...       │  ← Filter bar
├────────────────────────────────────────────────────────────────┤
│ Car list (rows and rows of cars, sorted best-first)             │  ← Table
└────────────────────────────────────────────────────────────────┘
```

When you click any row, a **detail window** pops up showing the car's full S-Tier score breakdown, financial details, and a button to the original auction page.

---

## Part 3 — How to run it on your computer (3 minutes)

> You don't need to know any programming. Just install two things and click "go".

### Step 1 — Install two free programs

| Program | Why | Where to get it |
| --- | --- | --- |
| **Node.js** | Runs the AuctionCarRadar program | https://nodejs.org → click the big green button "LTS" |
| **Git** (optional, only if you want to update later) | Downloads source code | https://git-scm.com |

After installing Node.js, **close and reopen** any terminal window so it picks up the new program.

### Step 2 — Open a terminal in the project folder

* **Windows**: Press `Win + R`, type `powershell`, press Enter. In the PowerShell window, paste:
  ```powershell
  cd C:\minimax\car_auction-git
  ```
* **Mac / Linux**: Open "Terminal", paste:
  ```bash
  cd /path/to/car_auction-git
  ```

### Step 3 — Install the parts (one-time, ~30 seconds)

```bash
npm install
```

You'll see lots of text scrolling — that's normal. Wait until it stops and you get the prompt back.

### Step 4 — Start the program

```bash
npm run dev
```

You'll see:

```
  ▲ VITE v8.2.2  ready in 2486 ms

  ▶ Local:   http://localhost:8080/
  ▶ Network: http://192.168.x.x:8080/
```

**Don't close this window.** The program is running. As long as this window is open, the dashboard works.

### Step 5 — Open the dashboard

Open a browser (Chrome, Edge, Firefox — any of them) and go to:

```
http://localhost:8080
```

You'll see the empty dashboard. Click the big yellow **"S-Tier 매칭 스캔"** button on the top-right.

The dashboard will:

1. Show a fake "loading" animation (so you know what's happening)
2. Actually visit the three auction sites in the background
3. Pull listings (typically 50-80 cars in a couple of minutes)
4. Populate the table

When you see rows in the table, you're done. Click any row to see its S-Tier scorecard.

### Step 6 — Stop the program

Click into the terminal window and press `Ctrl + C`. That's it.

---

## Part 4 — What each button does

| Button | What happens when you click it |
| --- | --- |
| **S-Tier 매칭 스캔** (top-right, big yellow) | Visits all three auction sites and pulls fresh listings. Takes 30s-3min. |
| **🔔 Bell icon** | Opens a panel showing recent S-Tier alerts. New S-Tier matches appear here automatically. |
| **⚙ 알림 규칙** (Alert Rules) | Lets you set the S-Tier score threshold (only pings you when score ≥ 70-95), choose scan frequency (6h/12h/realtime), and toggle browser popups. |
| **검색 box** | Type a model name (e.g. "RAV4"), a case number, or a court name to filter the table. |
| **전체 티어 dropdown** | Switch between "all cars", "S-Tier only", or "A-Grade only". |
| **Bookmark ⭐ icon** | Saves a car to your "favorites" list. Toggle on to save, off to remove. |
| **저장됨 toggle** | When on, hides everything except your bookmarks. |
| **상세 button (in row)** | Opens the detail scorecard for that car. |
| **External link icon** | Opens the original auction page on the official site. |

---

## Part 5 — How the program actually works (no jargon, promise)

The program is built in layers, like an onion:

```
┌─────────────────────────────────────────────────────────────┐
│ Browser (your screen)                                       │
│ What you see: dashboard, table, modals                      │
└───────────────┬─────────────────────────────────────────────┘
                │  When you click "Scan", it asks:
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Server (Node.js running on your computer)                   │
│                                                             │
│  Step 1: Scraper                                            │
│    → "Hey court site, give me your car list"                │
│    → "Hey Onbid, give me your AJAX car list"                │
│    → "Hey Madang, give me your search feed"                 │
│                                                             │
│  Step 2: Filter                                             │
│    → Throw away: wrecked, flooded, no-key, too-old, ICE     │
│    → Keep: recent, low-mileage, hybrid/EV, has-key          │
│                                                             │
│  Step 3: S-Tier scorer                                      │
│    → For each kept listing, check 5 rules:                  │
│       ① mileage ≤ 15,000 km?                                │
│       ② year ≥ 2024 (warranty still valid)?                 │
│       ③ discount ≥ 30% (sweet spot)?                        │
│       ④ stored at official keeper (오토마트, 캠코, ...)?     │
│       ⑤ accident history + mileage cross-verified?          │
│    → If all 5 ✅ → S-Tier (rare, ~1% of listings)           │
│    → Else → A-Grade with a partial score                    │
│                                                             │
│  Step 4: Database                                           │
│    → Save everything to a local database file                │
│    → So next time you reload, history is preserved          │
└───────────────┬─────────────────────────────────────────────┘
                │  Returns: list of cars with their scores
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Browser renders the result                                  │
│  → Renders the dashboard, sorted S-Tier first               │
└─────────────────────────────────────────────────────────────┘
```

That's it. No magic — just three steps: ask → filter → display.

### A note on "why is S-Tier so rare?"

The system is **strict on purpose**. It's looking for cars where:

* Very low mileage AND
* Still under warranty AND
* Priced below market by 30%+ AND
* Stored at a professional keeper AND
* Confirmed accident-free

In real Korean auctions, maybe 1 in 100 cars meets all 5. That's the point: when you see an S-Tier badge, it means **"this is genuinely special, look at it first"**, not "look at all 80 cars I found".

---

## Part 6 — Where your data lives

Everything the program saves goes into a single folder inside the project:

```
car_auction-git/
  └─ .data/
      └─ pglite/      ← the database file
```

Delete that folder to reset the database. Otherwise, it persists between runs.

---

## Part 7 — Optional: get alerts on your phone (Telegram)

By default the program shows alerts in the bell-icon panel. If you also want alerts on your phone via Telegram:

1. Open Telegram, message **@BotFather**, send `/newbot`, follow the prompts. You'll get a **bot token**.
2. Open Telegram, message **@userinfobot**, get your **chat ID**.
3. When you start the program, set these two values:
   ```bash
   TELEGRAM_BOT_TOKEN=1234567:abc... TELEGRAM_CHAT_ID=987654 npm run dev
   ```
4. Open the dashboard, click **알림 규칙**, enable Telegram, paste the values, save.

From then on, every new S-Tier match also pings your phone.

> Don't paste real tokens into public chats — they're like passwords.

---

## Part 8 — Optional: deploy to the internet (so it runs 24/7)

If you want the radar to run continuously without keeping your laptop on, push it to **Vercel** (free tier is enough):

1. Sign up at https://vercel.com
2. Install their CLI: `npm install -g vercel`
3. From the project folder: `vercel --prod`
4. They'll ask you to log in, then deploy. Done.

Vercel gives you a URL like `https://auction-car-radar.vercel.app`. Every 6 hours it auto-runs the scan (because there's a `vercel.json` cron entry).

You can also add a free Postgres database at https://neon.tech and connect it via `DATABASE_URL` env var.

---

## Part 9 — Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `npm install` complains | Old Node version | Reinstall Node.js LTS from nodejs.org |
| "Port 8080 already in use" | Another program is using 8080 | Close other dev tools, or change the port: edit `vite.config.ts` |
| "0 S-Tier matches" after a scan | Real data has no S-Tier listings today | That's expected — S-Tier is rare by design. Try again in a few hours. |
| Dashboard loads but scan returns no rows | Auction site blocked scraper | Some sites block bots. The scraper logs which one failed; check the terminal. |
| Bell icon doesn't show new alerts | You might have notifications muted | Click 알림 규칙 and re-enable browser push, then allow notifications in your browser's permission dialog. |

---

## Part 10 — Quick reference card

```
┌────────────────────────────────────────────────────────────┐
│  Start:   npm run dev                                       │
│  Stop:    Ctrl + C in the terminal                          │
│  Visit:   http://localhost:8080                             │
│  Scan:    click S-Tier 매칭 스캔 (yellow button, top-right) │
│  Reset:   delete ./.data/pglite                             │
│  Tests:   npm run typecheck                                 │
│  Build:   npm run build                                     │
└────────────────────────────────────────────────────────────┘
```

---

That's everything. If something feels confusing or a step doesn't work on your machine, just describe what you see — error messages, weird screens, anything — and we'll work through it.