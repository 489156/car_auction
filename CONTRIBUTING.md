# Contributing to AuctionCarRadar

Thanks for your interest in making the Korean eco-car auction radar better. This document explains how to set up the project locally, the conventions we follow, and what kinds of contributions are most welcome.

---

## Local setup

Requires **Node.js 22+**.

```bash
git clone https://github.com/489156/car_auction.git
cd car_auction
npm install
npm run dev
```

Open <http://localhost:8080> and click **S-Tier 매칭 스캔** to trigger a live scan.

---

## Conventions

### Code style

* **TypeScript strict mode**. Avoid `any`; prefer discriminated unions for response shapes.
* **Tailwind v4** for styling. Component files compose `cn()` (`src/lib/utils.ts`).
* **Lucide React** for icons. Don't introduce a different icon library.
* **Korean + English** — variable / function names are English; user-facing strings are Korean (the primary market).

### File layout

```
src/lib/radar/
  scrapers/<platform>.ts   — one file per source
  parser.ts                — pure text extraction
  filter.ts                — A-grade promotion
  stier.ts                 — S-Tier precision evaluator
  persistence.ts           — DB reads/writes
  scan.ts                  — orchestrator
src/components/radar/      — dashboard UI components
src/routes/                — TanStack Start file-based routes
migrations/                — SQL migrations (zero-padded timestamp + slug)
scripts/                   — CLI utilities, prefixed by purpose
```

### Tests

* Parser / filter / S-Tier tests live next to the source as `*.test.ts` and run via `node --test`.
* UI smoke / E2E tests live in `scripts/verify-*.mjs` and run via `playwright`.

```bash
npm run typecheck
node --test src/lib/radar/parser.test.ts
node --test src/lib/radar/stier.test.ts
node scripts/verify-stier-flow.mjs
```

Before submitting a PR, all four must pass.

---

## What we welcome

| Kind | Examples |
| --- | --- |
| **Bug fixes** | "Madang scraper fails when case_no has a special character" |
| **Scraper accuracy** | "Extract the keeper name from `addr` more reliably" |
| **S-Tier rule tuning** | "Add support for [new Korean keeper brand] in `OFFICIAL_STORAGE_KEYWORDS`" |
| **UI polish** | "Filter bar doesn't wrap nicely on tablets" |
| **i18n** | Translate the dashboard to English / Japanese |
| **Tests** | Add a regression test for an edge case you found |

## What we don't accept

* Anything that **industrializes scraping** of the auction platforms — keep request rates low (default: 1 scan per 6 hours)
* New dependencies without a clear justification (the project intentionally runs on a lean stack)
* Reformatting-only PRs (use `prettier` defaults; don't fight the existing style)
* New features unrelated to the radar's core mission (no game-ification, no AI chat, etc.)

---

## Pull request workflow

1. **Open an issue first** for anything beyond a small fix — design changes need sign-off
2. Fork + branch from `main` (`git checkout -b fix/short-description`)
3. Make your change, write tests if applicable
4. Run `npm run typecheck` + the relevant test files locally
5. Push + open a PR describing **what** and **why**
6. A maintainer will review within ~3 days

---

## Coding conventions — details

### Imports

```ts
import type { StandardListing } from "./types.ts";   // types first
import { evaluateSTier } from "./stier.ts";          // code
import { cn } from "@/lib/utils";                    // aliases via @/
```

### Component shape

```tsx
import { useState } from "react";
import type { Listing } from "@/lib/radar/types";

export function MyComponent({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  return <div>...</div>;
}
```

### Naming

* `kebab-case` for file names (`spotlight-banner.tsx`)
* `PascalCase` for React components (`SpotlightBanner`)
* `camelCase` for variables / functions
* Korean for user-facing copy

---

## Code of conduct

Be kind. This is a small personal project; rudeness or harassment will get your PR closed and your commenting privileges revoked.

---

## License

By contributing, you agree that your contributions are licensed under the project's [MIT License](LICENSE).