# Raindrop SQLite Mirror — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a local SQLite mirror (`data/bookmarks.db`) of the Raindrop.io CSV export, generated via a deterministic importer, and regenerate the site's existing Markdown category pages plus a new richer JSON export from that mirror — without changing `/categories` output or breaking the existing `scripts/convert.js` pipeline until parity is proven.

**Architecture:** CSV → `scripts/db/import.js` (upsert into SQLite, soft-delete missing rows, never hard-delete) → `data/bookmarks.db` → two exporters read the same mirror: `scripts/db/export-markdown.js` (rebuilds `src/content/categories/*.md`, byte-identical to today's `convert.js` output) and `scripts/db/export-json.js` (writes `public/generated/bookmarks.json`, new, richer per-bookmark data for future UI work). `public/pkgs/taxonomy.json` stays the sole category authority; the importer resolves each CSV row's folder against it exactly as `scripts/convert.js` does today.

**Tech Stack:** Plain Node ESM (`"type": "module"`), `node:sqlite` (`DatabaseSync`, confirmed working on the pinned Node 24.15.0 — no new dependency), no test framework (repo has none; verification uses plain `node:assert/strict` scripts run directly, matching the project's existing no-framework script style).

**Spec:** `idea.md` (repo root) — sections A–I of the accompanying architecture proposal (delivered in conversation) narrate the full rationale; this plan implements proposal sections C/D/E/H steps 1–3 only (SQLite mirror + import + validate + export). MCP taxonomy analysis (proposal section G, `H` steps 4–5) is a later plan — it needs the official Raindrop MCP connected first, which is a user action outside this plan's scope.

## Global Constraints

- Node >= 22.12.0, repo pinned to 24.15.0 (`.nvmrc`) — `node:sqlite` confirmed available, use it directly, no new dependency.
- ESM only (`"type": "module"` in `package.json`) — every new file uses `import`/`export`, no `require`.
- No test runner, no lint step exists in this repo and none should be added — verification scripts are plain `node:assert/strict`, run with `node <file>.test.js`, matching the project's existing convention of plain Node scripts under `scripts/`.
- Never hard-delete a bookmark row on import — missing-from-CSV rows get `removed_at` set, never `DELETE`.
- `public/pkgs/taxonomy.json` is the single source of truth for categories — the importer must resolve categories the same way `scripts/convert.js` / `scripts/config/categories.js` already do (folder display name → `CATEGORY_CONFIG` entry), not invent a second resolution path.
- `src/content/categories/*.md` output must stay **byte-identical** to what `scripts/convert.js` produces today until parity is explicitly verified (Task 4) — `/categories` pages, `src/content.config.ts`, and everything under `src/pages/` are out of scope, untouched.
- `data/bookmarks.db` is gitignored (rebuildable from CSV any time). `public/generated/bookmarks.json` is **committed** (per user decision — Git history becomes the diffable changelog).
- Reuse existing modules rather than re-implementing: `scripts/lib/csv-parser.js` (`parseCsv`, `cleanText`, `extractSourceCodeUrls`), `scripts/lib/utils.js` (`normalizeFolder`, `isValidRowFolder`, `resolveInputCsvPath`, `clearOutputDir`), `scripts/lib/markdown-renderer.js` (`renderGroupFile`), `scripts/config/categories.js` (`CATEGORY_CONFIG`, `PATHS`).

---

### Task 1: SQLite schema + connection helper + `db:init`

**Files:**
- Create: `data/db/schema.sql`
- Create: `scripts/db/connection.js`
- Create: `scripts/db/init.js`
- Test: `scripts/db/connection.test.js`

**Interfaces:**
- Produces: `scripts/db/connection.js` exports `getDb(dbPath = DEFAULT_DB_PATH)` → a `node:sqlite` `DatabaseSync` with the schema already applied (idempotent, `CREATE TABLE IF NOT EXISTS`), and `DEFAULT_DB_PATH` (absolute path to `data/bookmarks.db`).
- Consumed by: Tasks 2, 3, 4, 5 via `import { getDb, DEFAULT_DB_PATH } from './connection.js'`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/db/connection.test.js
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { getDb, DEFAULT_DB_PATH } from './connection.js'

const testPath = path.resolve('scripts/db/.test-connection.db')
fs.rmSync(testPath, { force: true })

const db = getDb(testPath)
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((r) => r.name)
db.close()
fs.rmSync(testPath, { force: true })

assert.deepEqual(tables, [
  'bookmark_collections',
  'bookmark_tags',
  'bookmarks',
  'collections',
  'source_code_urls',
  'tags',
])
assert.ok(DEFAULT_DB_PATH.endsWith('bookmarks.db'))

console.log('connection.test.js: PASS')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/db/connection.test.js`
Expected: `ERR_MODULE_NOT_FOUND` (`./connection.js` doesn't exist yet)

- [ ] **Step 3: Write the schema**

```sql
-- data/db/schema.sql
-- Interneto bookmark mirror. Raindrop.io remains the source of truth for
-- structure; this is a local, queryable, rebuildable copy. Never hard-delete
-- a bookmark row — see removed_at.

CREATE TABLE IF NOT EXISTS bookmarks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  raindrop_id   TEXT NOT NULL,
  url           TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  domain        TEXT,
  cover         TEXT,
  note          TEXT,
  favorite      INTEGER NOT NULL DEFAULT 0,
  category      TEXT NOT NULL,
  folder_path   TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT,
  imported_at   TEXT NOT NULL,
  removed_at    TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_raindrop_id ON bookmarks(raindrop_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(category);

CREATE TABLE IF NOT EXISTS collections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  raindrop_id   TEXT UNIQUE,
  name          TEXT NOT NULL,
  parent_id     INTEGER REFERENCES collections(id)
);

CREATE TABLE IF NOT EXISTS bookmark_collections (
  bookmark_id   INTEGER NOT NULL REFERENCES bookmarks(id),
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  PRIMARY KEY (bookmark_id, collection_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmark_tags (
  bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id),
  tag_id      INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (bookmark_id, tag_id)
);

CREATE TABLE IF NOT EXISTS source_code_urls (
  bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id),
  url         TEXT NOT NULL,
  PRIMARY KEY (bookmark_id, url)
);
```

Design notes (why these columns, not idea.md's exact list):
- No `type` column — the Raindrop CSV export has no `type` field (header is `id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite`); adding an always-null column has no value until an API sync exists.
- `collections`/`bookmark_collections` exist now but stay empty in this phase (CSV has no collection IDs, only a folder path string) — so a future API sync can populate them without a schema migration, per idea.md's "don't redesign the database later" requirement.
- `folder_path` (JSON array of subfolder segments, e.g. `["AI Apps","Agentic AI"]`) is what lets `export-markdown.js` reconstruct the same nested tree `convert.js` builds today — required for byte-parity in Task 4.

- [ ] **Step 4: Write the connection helper**

```js
// scripts/db/connection.js
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '../..')
const SCHEMA_PATH = path.resolve(__dirname, '../../data/db/schema.sql')

export const DEFAULT_DB_PATH = path.resolve(ROOT_DIR, 'data/bookmarks.db')

export function getDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  const db = new DatabaseSync(dbPath)
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
  db.exec(schema)
  return db
}
```

- [ ] **Step 5: Write the `db:init` CLI**

```js
// scripts/db/init.js
import { getDb, DEFAULT_DB_PATH } from './connection.js'

const db = getDb()
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
db.close()

console.log(`✅ Initialized ${DEFAULT_DB_PATH}`)
console.log(`   Tables: ${tables.map((t) => t.name).join(', ')}`)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node scripts/db/connection.test.js`
Expected: `connection.test.js: PASS`

- [ ] **Step 7: Run the CLI manually and confirm the file is created**

Run: `node scripts/db/init.js`
Expected: `✅ Initialized <repo>/data/bookmarks.db` and `data/bookmarks.db` exists on disk.

- [ ] **Step 8: Commit**

```bash
git add data/db/schema.sql scripts/db/connection.js scripts/db/init.js scripts/db/connection.test.js
git commit -m "feat(db): add SQLite schema and connection helper"
```

---

### Task 2: CSV → SQLite importer

**Files:**
- Create: `scripts/db/lib/import-csv.js`
- Create: `scripts/db/import.js`
- Test: `scripts/db/lib/import-csv.test.js`

**Interfaces:**
- Consumes: `getDb` (Task 1); `CATEGORY_CONFIG`, `PATHS` from `../../config/categories.js`; `parseCsv`, `cleanText`, `extractSourceCodeUrls` from `../../lib/csv-parser.js`; `normalizeFolder`, `isValidRowFolder`, `resolveInputCsvPath` from `../../lib/utils.js`.
- Produces: `scripts/db/lib/import-csv.js` exports `importCsv(db, csvText, { runAt } = {})` → report object `{ processed, created, updated, removed, skipped, unmappedCategories: Map<string, number> }`. Consumed by Task 6 (`sync` script) via `scripts/db/import.js`, and directly by tests.

- [ ] **Step 1: Write the failing test**

```js
// scripts/db/lib/import-csv.test.js
import assert from 'node:assert/strict'
import { getDb } from '../connection.js'
import { importCsv } from './import-csv.js'

const csvRun1 = [
  'id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite',
  '1,"Test Tool","Source-code: https://github.com/x/y","A tool","https://example.com/","Apps & Services / AI Tools & Services / AI Apps","Type: Open-Source",2026-01-01T00:00:00.000Z,,,true',
  '2,"Unmapped Row","","","https://example.org/","Apps & Services / Not A Real Category","",2026-01-01T00:00:00.000Z,,,false',
].join('\n')

const db = getDb(':memory:')

const report1 = importCsv(db, csvRun1, { runAt: '2026-01-01T00:00:00.000Z' })
assert.equal(report1.created, 1)
assert.equal(report1.updated, 0)
assert.equal(report1.unmappedCategories.get('Not A Real Category'), 1)

const row = db.prepare('SELECT * FROM bookmarks WHERE raindrop_id = :id').get({ id: '1' })
assert.equal(row.title, 'Test Tool')
assert.equal(row.favorite, 1)
assert.equal(row.category, 'ai-tools-and-services')
assert.deepEqual(JSON.parse(row.folder_path), ['AI Apps'])

const sourceUrls = db.prepare('SELECT url FROM source_code_urls WHERE bookmark_id = :id').all({ id: row.id })
assert.deepEqual(sourceUrls.map((r) => r.url), ['https://github.com/x/y'])

const tagRow = db.prepare(`
  SELECT t.name FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = :id
`).get({ id: row.id })
assert.equal(tagRow.name, 'Type: Open-Source')

// Second run: row 1 is gone from the CSV, row 2's folder is now valid.
const csvRun2 = [
  'id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite',
  '2,"Now Mapped","","","https://example.org/","Apps & Services / AI Tools & Services","",2026-01-02T00:00:00.000Z,,,false',
].join('\n')

const report2 = importCsv(db, csvRun2, { runAt: '2026-01-02T00:00:00.000Z' })
assert.equal(report2.created, 1)
assert.equal(report2.removed, 1)

const removedRow = db.prepare('SELECT removed_at FROM bookmarks WHERE raindrop_id = :id').get({ id: '1' })
assert.ok(removedRow.removed_at, 'row 1 should be soft-deleted, not gone')

const stillThere = db.prepare('SELECT COUNT(*) AS n FROM bookmarks WHERE raindrop_id = :id').get({ id: '1' })
assert.equal(stillThere.n, 1, 'row 1 must still exist (soft delete, never hard delete)')

db.close()
console.log('import-csv.test.js: PASS')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/db/lib/import-csv.test.js`
Expected: `ERR_MODULE_NOT_FOUND` (`./import-csv.js` doesn't exist yet)

- [ ] **Step 3: Write the importer**

```js
// scripts/db/lib/import-csv.js
import { CATEGORY_CONFIG } from '../../config/categories.js'
import { parseCsv, cleanText, extractSourceCodeUrls } from '../../lib/csv-parser.js'
import { normalizeFolder, isValidRowFolder } from '../../lib/utils.js'

const categoryByFolder = new Map(
  CATEGORY_CONFIG.map((c) => [c.folder, { ...c, id: c.file.replace(/\.md$/, '') }])
)

function resolveDomain(url) {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function upsertTagId(db, name) {
  const trimmed = name.trim()
  if (!trimmed) return null
  db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (:name)').run({ name: trimmed })
  return db.prepare('SELECT id FROM tags WHERE name = :name').get({ name: trimmed }).id
}

export function importCsv(db, csvText, { runAt = new Date().toISOString() } = {}) {
  const rows = parseCsv(csvText)

  const upsertStmt = db.prepare(`
    INSERT INTO bookmarks (raindrop_id, url, title, description, domain, cover, note, favorite, category, folder_path, created_at, imported_at, removed_at)
    VALUES (:raindrop_id, :url, :title, :description, :domain, :cover, :note, :favorite, :category, :folder_path, :created_at, :imported_at, NULL)
    ON CONFLICT(raindrop_id) DO UPDATE SET
      url = excluded.url, title = excluded.title, description = excluded.description, domain = excluded.domain,
      cover = excluded.cover, note = excluded.note, favorite = excluded.favorite, category = excluded.category,
      folder_path = excluded.folder_path, created_at = excluded.created_at, imported_at = excluded.imported_at, removed_at = NULL
  `)
  const selectByRaindropId = db.prepare('SELECT id FROM bookmarks WHERE raindrop_id = :raindrop_id')
  const deleteTags = db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = :bookmark_id')
  const insertTagLink = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (:bookmark_id, :tag_id)')
  const deleteSourceUrls = db.prepare('DELETE FROM source_code_urls WHERE bookmark_id = :bookmark_id')
  const insertSourceUrl = db.prepare('INSERT OR IGNORE INTO source_code_urls (bookmark_id, url) VALUES (:bookmark_id, :url)')

  const report = { processed: 0, created: 0, updated: 0, removed: 0, skipped: 0, unmappedCategories: new Map() }

  for (const row of rows) {
    const folderParts = normalizeFolder(row.folder || '')
    if (!isValidRowFolder(folderParts)) continue

    const categoryFolder = folderParts[1]
    const categoryConfig = categoryByFolder.get(categoryFolder)
    if (!categoryConfig) {
      report.unmappedCategories.set(categoryFolder, (report.unmappedCategories.get(categoryFolder) ?? 0) + 1)
      continue
    }

    const raindropId = cleanText(row.id)
    const title = cleanText(row.title)
    const rawUrl = cleanText(row.url)
    if (!raindropId || !title || !rawUrl) {
      report.skipped++
      continue
    }

    let url
    try {
      url = new URL(rawUrl).toString()
    } catch {
      report.skipped++
      continue
    }

    const existing = selectByRaindropId.get({ raindrop_id: raindropId })

    upsertStmt.run({
      raindrop_id: raindropId,
      url,
      title,
      description: cleanText(row.excerpt) || null,
      domain: resolveDomain(url),
      cover: cleanText(row.cover) || null,
      note: cleanText(row.note) || null,
      favorite: String(row.favorite).toLowerCase() === 'true' ? 1 : 0,
      category: categoryConfig.id,
      folder_path: JSON.stringify(folderParts.slice(2)),
      created_at: cleanText(row.created) || null,
      imported_at: runAt,
    })

    const bookmarkId = existing ? existing.id : selectByRaindropId.get({ raindrop_id: raindropId }).id
    existing ? report.updated++ : report.created++
    report.processed++

    deleteSourceUrls.run({ bookmark_id: bookmarkId })
    for (const sourceUrl of extractSourceCodeUrls(row.note) ?? []) {
      insertSourceUrl.run({ bookmark_id: bookmarkId, url: sourceUrl })
    }

    deleteTags.run({ bookmark_id: bookmarkId })
    for (const tagName of String(row.tags || '').split(',')) {
      const tagId = upsertTagId(db, tagName)
      if (tagId) insertTagLink.run({ bookmark_id: bookmarkId, tag_id: tagId })
    }
  }

  const removedResult = db
    .prepare('UPDATE bookmarks SET removed_at = :removed_at WHERE removed_at IS NULL AND imported_at != :run_at')
    .run({ removed_at: runAt, run_at: runAt })
  report.removed = removedResult.changes

  return report
}
```

- [ ] **Step 4: Write the CLI wrapper**

```js
// scripts/db/import.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './connection.js'
import { importCsv } from './lib/import-csv.js'
import { PATHS } from '../config/categories.js'
import { resolveInputCsvPath } from '../lib/utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..', '..')

function log(icon, message) {
  console.log(`${icon} ${message}`)
}

const csvRelative = resolveInputCsvPath(PATHS.INPUT_CSV_CANDIDATES, ROOT_DIR)
if (!csvRelative) {
  log('❌', 'CSV not found. Searched:')
  PATHS.INPUT_CSV_CANDIDATES.forEach((p) => log('  ', `  ${p}`))
  process.exit(1)
}

const csvPath = path.resolve(ROOT_DIR, csvRelative)
log('📥', `CSV: ${path.relative(ROOT_DIR, csvPath)}`)

const csvText = fs.readFileSync(csvPath, 'utf8')
const db = getDb()
const report = importCsv(db, csvText)
db.close()

log('✅', `${report.created} new, ${report.updated} updated, ${report.removed} removed (soft)`)
if (report.skipped) log('⚠️', `${report.skipped} row(s) skipped (missing id/title/url or invalid URL)`)
if (report.unmappedCategories.size) {
  log('⚠️', `${report.unmappedCategories.size} unmapped category folder(s):`)
  for (const [folder, count] of report.unmappedCategories) {
    log('  ', `  ${count}x "${folder}"`)
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node scripts/db/lib/import-csv.test.js`
Expected: `import-csv.test.js: PASS`

- [ ] **Step 6: Run the CLI against the real CSV**

Run: `node scripts/db/import.js`
Expected: a `N new, 0 updated, 0 removed (soft)` line (first run against the real 47k-row CSV — no unmapped categories expected, since `CATEGORY_CONFIG` already covers every folder `convert.js` handles today).

- [ ] **Step 7: Commit**

```bash
git add scripts/db/lib/import-csv.js scripts/db/lib/import-csv.test.js scripts/db/import.js
git commit -m "feat(db): add CSV to SQLite importer with soft-delete"
```

---

### Task 3: Validation

**Files:**
- Create: `scripts/db/validate.js`
- Test: `scripts/db/validate.test.js`

**Interfaces:**
- Consumes: `getDb` (Task 1).
- Produces: `scripts/db/validate.js` exports `validate(db)` → `string[]` of error messages (empty = valid). CLI exits 1 if non-empty. Consumed by Task 6 (`sync` script).

- [ ] **Step 1: Write the failing test**

```js
// scripts/db/validate.test.js
import assert from 'node:assert/strict'
import { getDb } from './connection.js'
import { validate } from './validate.js'

const db = getDb(':memory:')

db.prepare(`
  INSERT INTO bookmarks (raindrop_id, url, title, favorite, category, imported_at)
  VALUES ('1', 'https://example.com/', 'Valid', 0, 'development', '2026-01-01T00:00:00.000Z')
`).run()

assert.deepEqual(validate(db), [], 'a valid row should produce no errors')

db.prepare(`
  INSERT INTO bookmarks (raindrop_id, url, title, favorite, category, imported_at)
  VALUES ('2', 'https://example.com/', 'Bad Category', 0, 'not-a-real-category', '2026-01-01T00:00:00.000Z')
`).run()

const errors = validate(db)
assert.equal(errors.length, 1)
assert.match(errors[0], /not-a-real-category/)

db.close()
console.log('validate.test.js: PASS')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/db/validate.test.js`
Expected: `ERR_MODULE_NOT_FOUND` (`./validate.js` doesn't exist yet)

- [ ] **Step 3: Write validate.js**

```js
// scripts/db/validate.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './connection.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..', '..')
const TAXONOMY_PATH = path.resolve(ROOT_DIR, 'public/pkgs/taxonomy.json')

export function validate(db) {
  const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'))
  const validCategoryIds = new Set(taxonomy.categories.map((c) => c.id))

  const errors = []

  const categoryCounts = db
    .prepare('SELECT category, COUNT(*) AS n FROM bookmarks WHERE removed_at IS NULL GROUP BY category')
    .all()
  for (const row of categoryCounts) {
    if (!validCategoryIds.has(row.category)) {
      errors.push(`${row.n} bookmark(s) reference unknown category "${row.category}"`)
    }
  }

  const orphanTags = db
    .prepare('SELECT COUNT(*) AS n FROM bookmark_tags bt LEFT JOIN bookmarks b ON b.id = bt.bookmark_id WHERE b.id IS NULL')
    .get().n
  if (orphanTags > 0) errors.push(`${orphanTags} orphaned bookmark_tags row(s)`)

  const emptyFields = db
    .prepare("SELECT COUNT(*) AS n FROM bookmarks WHERE removed_at IS NULL AND (title = '' OR url = '')")
    .get().n
  if (emptyFields > 0) errors.push(`${emptyFields} bookmark(s) with empty title/url`)

  return errors
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = getDb()
  const errors = validate(db)
  db.close()
  if (errors.length) {
    console.error('❌ Validation failed:')
    errors.forEach((e) => console.error(`   ${e}`))
    process.exit(1)
  }
  console.log('✅ Database valid')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/db/validate.test.js`
Expected: `validate.test.js: PASS`

- [ ] **Step 5: Run the CLI against the imported database**

Run: `node scripts/db/validate.js`
Expected: `✅ Database valid`

- [ ] **Step 6: Commit**

```bash
git add scripts/db/validate.js scripts/db/validate.test.js
git commit -m "feat(db): add taxonomy validation over the SQLite mirror"
```

---

### Task 4: Extract tree helpers + Markdown export (byte-parity with `convert.js`)

**Files:**
- Modify: `scripts/lib/utils.js` (add `createNode`, `addToTree`)
- Modify: `scripts/convert.js` (use the extracted helpers instead of local copies — no behavior change)
- Create: `scripts/db/export-markdown.js`
- Test: `scripts/db/export-markdown.test.js`

**Interfaces:**
- Produces: `scripts/lib/utils.js` additionally exports `createNode()` → `{ items: [], children: Map }` and `addToTree(group, pathParts, item)` (mutates `group`). `scripts/db/export-markdown.js` exports `exportMarkdown(db, outputDir)` → `string[]` of written filenames.
- Consumed by: `scripts/convert.js` (existing, now imports instead of defining locally) and `scripts/db/export-markdown.js` (new).

This task is split into two parts: first extract the tree helpers with zero behavior change and prove `convert.js`'s output is unaffected, **then** build the DB-backed exporter on top of the same helpers so parity is structural, not coincidental.

#### Part A — extract `createNode`/`addToTree`, verify `convert.js` unchanged

- [ ] **Step 1: Capture the current baseline**

Run: `node scripts/convert.js` then `git status --short src/content/categories`
Expected: no output (working tree already matches the committed generated files for the current CSV).

- [ ] **Step 2: Move the two functions into `scripts/lib/utils.js`**

Add to `scripts/lib/utils.js` (after the existing exports' function bodies, before the final `export { ... }`):

```js
function createNode() {
  return { items: [], children: new Map() }
}

function addToTree(group, pathParts, item) {
  if (!pathParts.length) {
    group.items.push(item)
    return
  }

  for (const part of pathParts.slice(0, -1)) {
    if (!group.children.has(part)) {
      group.children.set(part, createNode())
    }
    group = group.children.get(part)
  }

  const lastPart = pathParts[pathParts.length - 1]
  if (!group.children.has(lastPart)) {
    group.children.set(lastPart, createNode())
  }
  group.children.get(lastPart).items.push(item)
}
```

Update the file's final export statement to:

```js
export {
  resolveInputCsvPath,
  safeUnlink,
  clearOutputDir,
  normalizeFolder,
  isValidRowFolder,
  createNode,
  addToTree
}
```

- [ ] **Step 3: Update `scripts/convert.js` to use them**

In `scripts/convert.js`, change the import:

```js
import {
  clearOutputDir,
  normalizeFolder,
  isValidRowFolder,
  createNode,
  addToTree
} from './lib/utils.js'
```

Delete the local `function createNode() { ... }` and `function addToTree(...) { ... }` definitions (currently lines 36–58) — they're now imported.

- [ ] **Step 4: Verify zero behavior change**

Run: `node scripts/convert.js` then `git status --short src/content/categories`
Expected: no output — regenerated files are byte-identical to the committed ones. If anything shows as changed, stop and fix the extraction before continuing (do not proceed to Part B on a broken baseline).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/utils.js scripts/convert.js
git commit -m "refactor: extract createNode/addToTree into lib/utils.js"
```

#### Part B — SQLite-backed Markdown exporter

- [ ] **Step 6: Write the failing test**

```js
// scripts/db/export-markdown.test.js
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getDb } from './connection.js'
import { importCsv } from './lib/import-csv.js'
import { exportMarkdown } from './export-markdown.js'

const csv = [
  'id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite',
  '1,"Test Tool","","","https://example.com/","Apps & Services / AI Tools & Services / AI Apps","",2026-01-01T00:00:00.000Z,,,true',
].join('\n')

const db = getDb(':memory:')
importCsv(db, csv, { runAt: '2026-01-01T00:00:00.000Z' })

const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-md-test-'))
const written = exportMarkdown(db, outputDir)
db.close()

assert.ok(written.includes('ai-tools-and-services.md'))
const content = fs.readFileSync(path.join(outputDir, 'ai-tools-and-services.md'), 'utf8')
assert.match(content, /## AI Apps/)
assert.match(content, /⭐ \*\*\[Test Tool\]\(https:\/\/example\.com\/\)\*\*/)

fs.rmSync(outputDir, { recursive: true, force: true })
console.log('export-markdown.test.js: PASS')
```

- [ ] **Step 7: Run test to verify it fails**

Run: `node scripts/db/export-markdown.test.js`
Expected: `ERR_MODULE_NOT_FOUND` (`./export-markdown.js` doesn't exist yet)

- [ ] **Step 8: Write export-markdown.js**

```js
// scripts/db/export-markdown.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './connection.js'
import { CATEGORY_CONFIG, PATHS } from '../config/categories.js'
import { renderGroupFile } from '../lib/markdown-renderer.js'
import { createNode, addToTree, clearOutputDir } from '../lib/utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..', '..')

function log(icon, message) {
  console.log(`${icon} ${message}`)
}

export function exportMarkdown(db, outputDir) {
  const groups = new Map(CATEGORY_CONFIG.map((c) => [c.folder, createNode()]))
  const categoryById = new Map(CATEGORY_CONFIG.map((c) => [c.file.replace(/\.md$/, ''), c]))

  const rows = db
    .prepare(`
      SELECT b.*, GROUP_CONCAT(s.url, char(1)) AS source_urls
      FROM bookmarks b
      LEFT JOIN source_code_urls s ON s.bookmark_id = b.id
      WHERE b.removed_at IS NULL
      GROUP BY b.id
    `)
    .all()

  for (const row of rows) {
    const category = categoryById.get(row.category)
    if (!category) continue
    const pathParts = JSON.parse(row.folder_path || '[]')
    addToTree(groups.get(category.folder), pathParts, {
      title: row.title,
      url: row.url,
      favorite: !!row.favorite,
      sourceCodeUrls: row.source_urls ? row.source_urls.split('\x01') : null,
    })
  }

  clearOutputDir(outputDir, CATEGORY_CONFIG.map((c) => c.file))
  const written = []
  for (const category of CATEGORY_CONFIG) {
    const markdown = renderGroupFile(category.displayName, groups.get(category.folder), category.folder)
    fs.writeFileSync(path.join(outputDir, category.file), markdown, 'utf8')
    written.push(category.file)
  }
  return written
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = getDb()
  const outputDir = path.resolve(ROOT_DIR, PATHS.OUTPUT_DIR)
  const written = exportMarkdown(db, outputDir)
  db.close()
  log('📝', `Generated ${written.length} markdown files`)
  log('  ', `Output: ${path.relative(ROOT_DIR, outputDir)}`)
}
```

Note: `GROUP_CONCAT(s.url, char(1))` uses `char(1)` (a SQLite core function producing a control character) as the join separator instead of a comma, since URLs never contain it — avoids ambiguity if a URL somehow contained a comma.

- [ ] **Step 9: Run test to verify it passes**

Run: `node scripts/db/export-markdown.test.js`
Expected: `export-markdown.test.js: PASS`

- [ ] **Step 10: Verify byte-parity against the real data**

```bash
node scripts/db/import.js
mkdir -p /tmp/export-md-parity
node -e "
import('./scripts/db/connection.js').then(async ({ getDb }) => {
  const { exportMarkdown } = await import('./scripts/db/export-markdown.js')
  const db = getDb()
  exportMarkdown(db, '/tmp/export-md-parity')
  db.close()
})
"
diff -rq src/content/categories /tmp/export-md-parity
```

Expected: `diff -rq` prints nothing (directories identical). If it reports differences, inspect them — the two most likely causes are a CSV row whose folder resolves to a category not in `CATEGORY_CONFIG` (check the `import.js` unmapped-categories report) or a subtle mismatch in `folder_path` reconstruction; fix before proceeding.

- [ ] **Step 11: Commit**

```bash
git add scripts/db/export-markdown.js scripts/db/export-markdown.test.js
git commit -m "feat(db): add SQLite-backed markdown exporter with verified byte-parity"
```

---

### Task 5: JSON export

**Files:**
- Create: `scripts/db/export-json.js`
- Test: `scripts/db/export-json.test.js`

**Interfaces:**
- Consumes: `getDb` (Task 1).
- Produces: `scripts/db/export-json.js` exports `exportJson(db)` → array of bookmark objects (shape below). CLI writes `public/generated/bookmarks.json`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/db/export-json.test.js
import assert from 'node:assert/strict'
import { getDb } from './connection.js'
import { importCsv } from './lib/import-csv.js'
import { exportJson } from './export-json.js'

const csv = [
  'id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite',
  '1,"Test Tool","Source-code: https://github.com/x/y","A tool","https://example.com/","Apps & Services / AI Tools & Services / AI Apps","Type: Open-Source",2026-01-01T00:00:00.000Z,https://example.com/cover.png,,true',
].join('\n')

const db = getDb(':memory:')
importCsv(db, csv, { runAt: '2026-01-01T00:00:00.000Z' })

const data = exportJson(db)
db.close()

assert.equal(data.length, 1)
assert.deepEqual(data[0], {
  id: '1',
  title: 'Test Tool',
  url: 'https://example.com/',
  description: 'A tool',
  domain: 'example.com',
  cover: 'https://example.com/cover.png',
  favorite: true,
  category: 'ai-tools-and-services',
  subcategory: ['AI Apps'],
  tags: ['Type: Open-Source'],
  sourceCodeUrls: ['https://github.com/x/y'],
  createdAt: '2026-01-01T00:00:00.000Z',
})

console.log('export-json.test.js: PASS')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/db/export-json.test.js`
Expected: `ERR_MODULE_NOT_FOUND` (`./export-json.js` doesn't exist yet)

- [ ] **Step 3: Write export-json.js**

```js
// scripts/db/export-json.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './connection.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..', '..')
const OUTPUT_PATH = path.resolve(ROOT_DIR, 'public/generated/bookmarks.json')

export function exportJson(db) {
  const rows = db
    .prepare(`
      SELECT b.*,
        (SELECT GROUP_CONCAT(t.name, char(1)) FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = b.id) AS tag_names,
        (SELECT GROUP_CONCAT(s.url, char(1)) FROM source_code_urls s WHERE s.bookmark_id = b.id) AS source_urls
      FROM bookmarks b
      WHERE b.removed_at IS NULL
      ORDER BY b.category, b.title COLLATE NOCASE
    `)
    .all()

  return rows.map((row) => ({
    id: row.raindrop_id,
    title: row.title,
    url: row.url,
    description: row.description,
    domain: row.domain,
    cover: row.cover,
    favorite: !!row.favorite,
    category: row.category,
    subcategory: JSON.parse(row.folder_path || '[]'),
    tags: row.tag_names ? row.tag_names.split('\x01') : [],
    sourceCodeUrls: row.source_urls ? row.source_urls.split('\x01') : [],
    createdAt: row.created_at,
  }))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = getDb()
  const data = exportJson(db)
  db.close()
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`📝 Wrote ${data.length} bookmarks -> ${path.relative(ROOT_DIR, OUTPUT_PATH)}`)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/db/export-json.test.js`
Expected: `export-json.test.js: PASS`

- [ ] **Step 5: Run the CLI against the real database**

Run: `node scripts/db/export-json.js`
Expected: `📝 Wrote <N> bookmarks -> public/generated/bookmarks.json`, file exists and is valid JSON (`node -e "JSON.parse(require('fs').readFileSync('public/generated/bookmarks.json','utf8'))"` — wrap in `node --input-type=module -e "import('node:fs').then(fs=>JSON.parse(fs.readFileSync('public/generated/bookmarks.json','utf8')))"` given ESM, or simply open it and eyeball the first few entries).

- [ ] **Step 6: Commit**

```bash
git add scripts/db/export-json.js scripts/db/export-json.test.js public/generated/bookmarks.json
git commit -m "feat(db): add JSON export for future UI work"
```

---

### Task 6: Wire up `package.json` scripts, `.gitignore`, docs

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `scripts/README.md`

**Interfaces:** none (glue only).

- [ ] **Step 1: Add scripts to `package.json`**

In the `"scripts"` block, add (after `"typecheck": "astro check"`):

```json
    "db:init": "node scripts/db/init.js",
    "db:import": "node scripts/db/import.js",
    "db:validate": "node scripts/db/validate.js",
    "db:export": "node scripts/db/export-markdown.js && node scripts/db/export-json.js",
    "sync": "node scripts/db/import.js && node scripts/db/validate.js && node scripts/db/export-markdown.js && node scripts/db/export-json.js"
```

- [ ] **Step 2: Gitignore the database file**

Add to `.gitignore` (near the other data-file entries):

```
data/bookmarks.db
```

- [ ] **Step 3: Verify it's actually ignored**

Run: `git check-ignore -v data/bookmarks.db`
Expected: prints the matching `.gitignore` line (confirms the rule takes effect); `git status --short` shows no `data/bookmarks.db` entry.

- [ ] **Step 4: Document the new workflow in `scripts/README.md`**

Add a new section after the existing "### Lint Markdown" section:

```markdown
### SQLite mirror (db:*, sync)

```bash
pnpm run db:init      # create data/bookmarks.db + apply schema (idempotent)
pnpm run db:import    # CSV -> SQLite upsert; soft-deletes rows missing from the CSV, never hard-deletes
pnpm run db:validate  # check every bookmark's category resolves in public/pkgs/taxonomy.json
pnpm run db:export    # SQLite -> src/content/categories/*.md + public/generated/bookmarks.json
pnpm run sync         # import -> validate -> export, in order
```

`data/bookmarks.db` is gitignored and fully rebuildable from the CSV — delete it and re-run
`db:import` any time. `public/generated/bookmarks.json` is committed so its Git history is a
diffable changelog of the underlying data.

`scripts/convert.js` (the original CSV -> Markdown converter) still works standalone and its
output stays byte-identical to `db:export`'s markdown output — `scripts/db/export-markdown.js`
shares the same tree-building helpers (`scripts/lib/utils.js`) and the same renderer
(`scripts/lib/markdown-renderer.js`).
```

- [ ] **Step 5: Run the full chain end to end**

Run: `pnpm run sync`
Expected: import report, `✅ Database valid`, `Generated 23 markdown files`, `Wrote <N> bookmarks -> public/generated/bookmarks.json` — no errors. Then `git status --short` should show only `public/generated/bookmarks.json` as new/changed (Markdown files unchanged, per Task 4's parity check).

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore scripts/README.md
git commit -m "chore(db): wire up db:* / sync scripts and document the SQLite mirror workflow"
```

---

## Self-Review

**Spec coverage** (against proposal sections C/D/E/H steps 1–3):
- SQLite schema with bookmarks/collections/tags/join tables + hierarchy support — Task 1. ✅
- CSV importer: new/updated/removed bookmarks, deterministic IDs (`raindrop_id` from the CSV's own `id` column), never destroys data — Task 2. ✅
- Validation against `taxonomy.json` — Task 3. ✅
- Markdown export, byte-parity with `convert.js` — Task 4. ✅
- JSON export (richer than current UI, per idea.md's "data model richer than the UI" principle) — Task 5. ✅
- `npm run sync` single command — Task 6. ✅
- Backup/versioning decision (DB gitignored, JSON committed) — Task 6, Step 2. ✅
- MCP / live Raindrop analysis (proposal section G) — explicitly **out of scope**, deferred to a follow-up plan once the Raindrop MCP is connected.

**Placeholder scan:** no TBD/TODO, every step has real code, every test has real assertions.

**Type/signature consistency:** `importCsv(db, csvText, { runAt })` used identically in Task 2's CLI, Task 4's test, and Task 5's test. `exportMarkdown(db, outputDir)` and `exportJson(db)` signatures match between definition and all call sites. `createNode`/`addToTree` signatures match their original `convert.js` versions exactly (pure extraction, Task 4 Part A step 4 proves this empirically via `diff`).

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-02-raindrop-sqlite-mirror-phase1.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
