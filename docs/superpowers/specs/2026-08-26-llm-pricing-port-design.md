# LLM Pricing chart port — design

Status: approved, pending plan
Date: 2026-08-26

## Summary

Port the standalone `llm-pricing` project (a D3/Observable Plot chart comparing
LLM cost vs. quality, currently living at `interneto.github.io/llm-pricing` as
its own repo/site) into `interneto.github.io` as a first-party feature, so it
shares this site's layout/nav/theme instead of being a visually disconnected
page. The port must preserve the ability to refresh the underlying data
(`elo.csv`) from the same upstream source the standalone repo uses
(LMArena leaderboards, scraped via `download.py` + `scripts/update_elo.py` in
`llm-pricing`), without depending on a second toolchain.

## Source material

`C:\Users\tener\Workspaces\repos\llm-pricing` (a fork of `sanand0/llmpricing`):

- `index.html` + `js/main.js` + `css/styles.css` — vanilla ESM, no build step.
  `main.js` imports `@observablehq/plot`, `d3`, `fuzzysort`, and
  `@gramex/ui`'s `num`/`num0` formatters from jsdelivr CDN `+esm` URLs.
- `data/elo.csv` (465 model rows: model, overall/hard/coding ELO, cpmi, launch,
  end, source) + `data/narrative.json` (scrollytelling cards).
- `download.py` (Python, Playwright-via-CDP scraper for the three LMArena
  leaderboard views) + `scripts/update_elo.py` (Python/typer, merges scraped
  TSV into `elo.csv`, backfills pricing/launch metadata from the OpenRouter
  models API) + `update.sh` (runs both for all three views). Requires `uv`.
- CSS theme vars (`--bg`, `--fg`, `--muted`, `--accent`, `--border-rgb`, etc.)
  switched via `@media (prefers-color-scheme: dark)`.

## Target structure (interneto.github.io conventions, per CLAUDE.md)

- `src/features/<name>/` is the established pattern for a self-contained,
  non-Astro-component visualization (see `src/features/bookmark-dashboard/`:
  its own `main.ts`, its own scoped `style.css` with `:root` +
  `html[data-theme='dark']` tokens, mounted into a page via
  `<script>import '../features/x/main'</script>`).
- `scripts/` (repo root) is **build-time Node tooling only**, plain
  `.js`/`.mjs` ESM, run directly with `node scripts/foo.mjs` — explicitly "no
  package.json aliases" per CLAUDE.md. This is distinct from `src/scripts/`
  (client-side TS bundled by Astro) — the pricing chart's data-refresh
  tooling belongs in the former, not the latter.
- Blog (`src/pages/blog/`) is markdown-only today: `posts` content collection
  → `[...slug].astro` renders `<Content />` inside a shared prose+TOC layout.
  There's no precedent for embedding an interactive full-bleed page through
  that pipeline, so the chart page bypasses the collection entirely.

## Design

### 1. Feature module

`src/features/llm-pricing/`:
- `main.ts` — ported `js/main.js` almost 1:1: same DOM structure, D3/Plot
  rendering, scrollytelling logic. Changes: CDN imports become npm imports
  (`import * as Plot from "@observablehq/plot"`, `import fuzzysort from
  "fuzzysort"`); the two `@gramex/ui` formatters (`num`, `num0` — thousands
  separators / no-decimal number formatting) are inlined locally instead of
  adding a dependency for two helpers; `d3.csv("data/elo.csv")` and
  `fetch("data/narrative.json")` paths become `` `${import.meta.env.BASE_URL}data/llm-pricing/elo.csv` `` style
  references (matching how other features/pages here resolve `BASE_URL`).
- `style.css` — ported `css/styles.css`, keeping the same variable names
  (`--bg`, `--fg`, `--muted`, `--accent`, `--border-rgb`, …) but switching the
  dark variant from `@media (prefers-color-scheme: dark)` to
  `html[data-theme='dark']`, matching `bookmark-dashboard/style.css` and the
  site's actual toggle (`BaseLayout.astro` reads `localStorage['theme-preference']`).

### 2. Data files

`src/data/llm-pricing/elo.csv` and `src/data/llm-pricing/narrative.json`,
copied from the source repo's `data/`. `src/data/` already holds
non-collection JSON data for other features (e.g. `bookmarks.json`), so this
is consistent placement. Fetched client-side at runtime, same as today — not
processed at build time, since the chart itself does the CSV parsing.

### 3. Page + nav

`src/pages/blog/llm-pricing.astro`: `VPLayout` with `hasSidebar={false}`
(same shape as the disabled `_map.astro`), a root `<div id="app">` (reusing
the source's existing markup for controls/chart-area/scrolly-section), and
`<script>import '../../features/llm-pricing/main';</script>`.

Blog index (`src/pages/blog/index.astro`) gets a new section — not sourced
from the `posts` collection, since this isn't a markdown post. Add a small
hand-written section (title e.g. "Tools") rendered alongside the
collection-derived `groupedPosts` sections, with one `ContentCard`-equivalent
entry linking to `/blog/llm-pricing/`. This avoids the routing conflict a
content-collection stub would create against `[...slug].astro`'s
`getStaticPaths`.

### 4. Data-refresh tooling (the "don't lose the link to upstream" requirement)

Port `download.py` + `scripts/update_elo.py` to plain ESM under
`scripts/` (flat, matching every other file there — no subfolder, no
TypeScript, no package.json script alias):

- `scripts/llm-pricing-download.mjs` — CDP/Playwright scraper for one LMArena
  leaderboard URL → TSV, using the site's existing `playwright` devDependency
  in place of Playwright-Python. Same CLI contract as `download.py`
  (`--browser auto|cdp|launch`, `--executable`, `LLMPRICING_CHROMIUM` env,
  Windows Chromium auto-detect).
- `scripts/llm-pricing-update-elo.mjs` — merges a scraped TSV into
  `src/data/llm-pricing/elo.csv` for a given column (`overall`/`hard`/
  `coding`), backfilling `cpmi`/`launch`/`source` from OpenRouter's public
  models endpoint when blank — a direct port of `update_elo.py`'s matching
  logic (model-name normalization/alias generation, blank-field backfill,
  score-ordered insertion for new rows).
- `scripts/llm-pricing-update.mjs` — thin orchestrator that runs both scripts
  for all three leaderboard views (mirrors `update.sh`).

Usage: `node scripts/llm-pricing-update.mjs` (optionally
`LLMPRICING_CHROMIUM=... node scripts/llm-pricing-update.mjs`). Documented in
`scripts/README.md` alongside the existing script list, with a line crediting
and linking the original source: `sanand0/llmpricing` (and this project's own
`david7ce/llm-pricing` fork, where the same refresh is also run).

### 5. Verification

No test runner or lint step exists in this repo (per CLAUDE.md). Verify by:
- `pnpm typecheck` (`astro check` — CI gates on this).
- `pnpm dev`, load `/blog/llm-pricing/` in a browser: confirm chart renders,
  no console errors, filter/date-slider/tooltip work, theme toggle switches
  the chart's own colors correctly, and the new "Tools" card appears/links
  correctly from `/blog/`.
- `node scripts/llm-pricing-update.mjs --dry-run` (or equivalent) against one
  leaderboard view to confirm the ported scraper/merger still work, without
  necessarily committing a full data refresh as part of this change.

## Explicitly out of scope

- `intelligence.html` / cost-curves page — not ported (the `llm-pricing` fork
  itself dropped this; no reason to reintroduce it here).
- Deprecating/archiving the standalone `llm-pricing` repo/site — not decided
  here; out of scope for this change.
- Any change to `llm-pricing`'s own repo.
