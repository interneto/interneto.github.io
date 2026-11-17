# Scripts

Automation scripts for converting Raindrop.io exports to Astro content.

## Architecture

```
scripts/
├── config/
│   └── categories.js              # Category configuration + descriptions
├── lib/
│   ├── csv-parser.js              # CSV parsing utilities
│   ├── markdown-renderer.js       # Markdown generation utilities
│   └── utils.js                   # File I/O and path utilities
├── data/
│   └── typos.csv                  # Typo data for linting
├── convert.js                     # Main converter (orchestrator)
├── lint-markdown.js               # Markdown linting
└── README.md                      # This file
```

## Usage

### Convert Raindrop.io CSV to Markdown

```bash
node scripts/convert.js
```

**What it does:**
1. Reads `links/interneto-links.csv` (Raindrop.io export)
2. Parses CSV and validates items
3. Generates markdown files in `src/content/categories/`
4. Each markdown file includes YAML frontmatter with title + description
5. Runs markdown linting on output

**Input:** CSV file with structure:
- `folder` - Category path (e.g., `AI Tools & Services/Assistants/...`)
- `title` - Bookmark title
- `url` - Bookmark URL
- `favorite` - Boolean for starred items
- `note` - Optional note (can include source-code URLs)

**Output:** Markdown files in `src/content/categories/` with frontmatter:
```yaml
---
title: By Company
description: Browse services grouped by parent company and ecosystem.
---
```

### Lint Markdown

```bash
node scripts/lint-markdown.js
```

Runs markdown linting on generated files.

### Site data from the mirror (sync)

```bash
pnpm sync      # data/raindrop.db -> categories/*.md, public/generated/*.json, links/interneto-links.csv
pnpm db:pull   # pnpm db:mirror, then pnpm sync
```

There is one database, the Raindrop mirror `data/raindrop.db` (see "Full account mirror"
below). `sync` (`scripts/db/export-site.js`) turns it into the rows of Raindrop's CSV
export, loads them into a throwaway in-memory database with the site schema
(`data/db/schema.sql`), validates every category against `public/pkgs/taxonomy.json`, and
writes the category pages and JSON. It also writes `links/interneto-links.csv`, which
`raindrop-snapshot.mjs` and `convert.js` read. The off-limits root `!nfo` never reaches
any of these files. `public/generated/bookmarks.json` is committed so its Git history is a
diffable changelog of the underlying data.

`scripts/convert.js` (the original CSV -> Markdown converter) still works standalone and its
output stays byte-identical to `sync`'s markdown output — `scripts/db/export-markdown.js`
shares the same tree-building helpers (`scripts/lib/utils.js`) and the same renderer
(`scripts/lib/markdown-renderer.js`).

## Configuration

### `config/categories.js`

Defines:
- **CATEGORY_CONFIG** - Maps Raindrop folders to markdown files
  - `folder` - Raindrop.io category folder name
  - `displayName` - Display name in UI
  - `file` - Output markdown filename
  - `description` - Short description (legacy)
  - `icon` - Emoji icon

- **CATEGORY_DESCRIPTIONS** - Detailed descriptions for UI/frontmatter
  - Maps category folder → full description
  - Used in markdown frontmatter
  - Persists across regenerations

- **PATHS** - File paths
  - `OUTPUT_DIR` - Output directory for markdown
  - `INPUT_CSV_CANDIDATES` - Locations to search for CSV

## Module Structure

### `lib/csv-parser.js`
Functions for parsing Raindrop CSV exports:
- `parseCsv(text)` - Parse CSV string to objects
- `buildItemFromRow(row)` - Convert CSV row to bookmark item
- `extractSourceCodeUrls(note)` - Extract source code URLs from notes

### `lib/markdown-renderer.js`
Functions for rendering markdown output:
- `renderGroupFile(name, group, folder)` - Render complete markdown file
- `renderItems(lines, items)` - Render bookmark list
- `renderChildren(lines, children, level)` - Render nested categories

### `lib/utils.js`
General utilities:
- `resolveInputCsvPath()` - Find CSV file
- `clearOutputDir()` - Clean output directory
- `normalizeFolder()` - Normalize folder paths
- `isValidRowFolder()` - Validate folder structure

## Workflow

1. **Export from Raindrop.io**
   - Download CSV export from Raindrop settings
   - Place in `links/interneto-links.csv`

2. **Run converter**
   ```bash
   node scripts/convert.js
   ```

3. **Review generated markdown**
   - Check output in `src/content/categories/`
   - Frontmatter should include title + description

4. **Commit changes**
   - Converted markdown files are ready for Astro build

## Category Mapping

### Raindrop → Markdown

The converter maps Raindrop folder paths to markdown files using `config/categories.js`. Each top-level folder becomes a separate markdown file with nested items rendered as subheadings.

---

## ClaudePluginHub API — Agent install commands

The AI Agents installer (`public/pkgs/agents-pkgs.json`) uses the [ClaudePluginHub](https://www.claudepluginhub.com) API to source standardized install commands for Claude Code plugins and MCP servers.

### API endpoint

```
POST https://www.claudepluginhub.com/api/recommend
Content-Type: application/json

{
  "dependencies": ["react", "typescript", "node"],
  "files": ["package.json", "tsconfig.json"]
}
```

Returns a `sections[].results[]` array where each result has:

```json
{
  "name": "typescript-lsp",
  "install": {
    "command": "npx claudepluginhub p/anthropics-typescript-lsp-plugins-typescript-lsp",
    "claude": {
      "addCommand": "/plugin marketplace add https://.../marketplace.json",
      "installCommand": "/plugin install ...@cpd-..."
    }
  }
}
```

### How to update entries

1. Query the API with relevant dependencies to find matching entries
2. Map the CPH `install.claude` commands to `installs[].cmd` in `agents-pkgs.json`
3. Add a generic `npx` install entry: `npx claudepluginhub p/<slug>`
4. Set `agent_compat.npx: true` for entries that have a generic command

The API is rate-limited per IP. Use `curl` (not Python) to avoid Cloudflare blocks:

```bash
curl -sL -X POST "https://www.claudepluginhub.com/api/recommend" \
  -H "Content-Type: application/json" \
  -d '{"dependencies":["react","typescript"],"files":["package.json"]}'
```

The converter recognizes items in paths: `Apps/{category}/...`

Current categories (19 total):
- AI Tools & Services, Business & Commerce, Development
- Education & Reference, File Management, Gaming
- Health & Fitness, Home & Family, Money & Finance
- Multimedia, News & Books, Office & Productivity
- Online Services, OS & Utilities, Security & Privacy
- Social & Communications, System Administration
- Travel & Location, Web Browsers

## Notes

- Categories come from Raindrop.io folder structure
- Items must be under `Apps/` folder to be processed
- Descriptions in CATEGORY_DESCRIPTIONS are preserved across regenerations
- Linting checks markdown formatting and typos

## Full account mirror (db:mirror, db:full, db:push)

```bash
pnpm db:mirror                   # Raindrop -> data/raindrop.db: only what changed since the last run (seconds)
pnpm db:full                     # rebuild data/raindrop.db from scratch (~15 min)
pnpm db:push plan.json           # show what a plan of changes would do; sends nothing
pnpm db:push plan.json --apply   # send it to Raindrop, then db:mirror and check every change
```

`data/raindrop.db` is the local copy of the Raindrop account: the site is generated
from it (`pnpm sync`, above) and it is queried to prepare changes. Raindrop's CSV export
needs a Pro plan; the REST API used here does not. The mirror includes the off-limits root
`!nfo`, so it is gitignored and never published; the root `.` and Trash are left out.
`--without-nfo` leaves `!nfo` out too, for copies that leave the machine: the daily
workflow's cache. Schema: `data/db/raindrop-schema.sql`.

`RAINDROP_TOKEN` comes from the environment or a gitignored `.env` in the repo root. Get
it at app.raindrop.io -> Settings -> Integrations -> For Developers -> create an app ->
"Create test token". `db:mirror` and `db:full` only send GET requests; `db:push` writes.

Raindrop stays the source of truth. The working loop is:

1. `pnpm db:mirror` to bring the mirror up to date.
2. Query the mirror and write a plan: a JSON array of operations in the shape of
   the MCP `update_bookmarks` tool (`bookmark_ids` plus any of `collection_id`,
   `title`, `note`, `tags: { add, remove }`, `favorite`):

   ```json
   [{ "bookmark_ids": [1932154497, 1932151601], "collection_id": 66230045 },
    { "bookmark_ids": [1930784160], "note": "Source-code: https://github.com/a/b", "tags": { "add": ["Type: Open-Source"] } }]
   ```

3. `pnpm db:push plan.json` to review it, then again with `--apply`.
4. `pnpm db:pull` (or the daily workflow) regenerates the site's Markdown from Raindrop.

`db:push` refuses the whole plan, sending nothing, if any operation names an unknown
field, a bookmark or collection the mirror does not have, or anything under `!nfo`.
It writes through Raindrop's MCP server, whose tools cannot delete or merge, in calls
of at most 150 bookmarks, and stops at the first failed call. Editing the `.db` file
itself never reaches Raindrop.

`db:mirror` asks for bookmarks changed since the last run (plus Trash) and applies
them in one transaction. When the result does not add up to the account's total (for
example after Trash was emptied) it rolls back and rebuilds from scratch on its own.

| Table / view | Contents |
|---|---|
| `collections` | Every collection plus Unsorted (-1): `description`, `slug`, `access_level`, `path`, `depth`, `parent_id`, counts, `raw` JSON |
| `raindrops` | Every bookmark: link, domain, `site` (domain grouped by site, e.g. `en.wikipedia.org` -> `wikipedia.org`), excerpt, note, type, cover, favorite, broken, reminder, cache, file, `raw` JSON |
| `raindrop_tags`, `media`, `highlights` | One row per tag, media item, highlight |
| `meta` | `fetched_at`, account stats (`filters`), user plan and storage |
| `raindrops_fts` | Full-text search over title, excerpt, note, link |
| `v_bookmarks`, `v_tags`, `v_domains`, `v_sites`, `v_duplicates`, `v_collection_stats` | Ready-made views |

```sql
SELECT title, link, folder FROM v_bookmarks WHERE id IN
  (SELECT rowid FROM raindrops_fts WHERE raindrops_fts MATCH 'docker');
```

It is written to `data/raindrop.db.tmp` and renamed only after a complete fetch,
so a failed run leaves the previous file intact.

The mirror holds the fields Raindrop stores, not the content of the bookmarked pages.
API fields without a column of their own (`creatorRef`, `user`, `lastAction`, ...) are
still in `raw`; read them with `json_extract(raw, '$.field')`.

## Refresh the LLM Pricing chart data

```bash
node scripts/llm-pricing-update.mjs
```

**What it does:**
1. Scrapes the Overall, Hard, and Coding LMArena leaderboards
   (`https://lmarena.ai/leaderboard/text*`) via Chrome DevTools Protocol
   (or a launched headless Chromium if no CDP browser is available on
   `localhost:9222`).
2. Merges each into `src/data/llm-pricing/elo.csv`, backfilling
   `cpmi`/`launch`/`source` from OpenRouter's public models API when blank.

Set `LLMPRICING_CHROMIUM` to a Chrome/Chromium executable path if Playwright
can't find one automatically. To update a single leaderboard view instead of
all three:

```bash
node scripts/llm-pricing-download.mjs https://lmarena.ai/leaderboard/text /tmp/overall.tsv
node scripts/llm-pricing-update-elo.mjs /tmp/overall.tsv --column overall
```

The update only fills blank prices. To overwrite existing `cpmi` values with
current OpenRouter prices (retired models and >10x jumps are left alone):

```bash
node scripts/llm-pricing-reprice.mjs [--dry-run]
```

This is a Node port of the update tooling from
[sanand0/llmpricing](https://github.com/sanand0/llmpricing) (specifically
`download.py` and `scripts/update_elo.py`), the original source for this
chart's data. See also
[david7ce/llm-pricing](https://github.com/david7ce/llm-pricing), a fork that
runs the same refresh independently.
