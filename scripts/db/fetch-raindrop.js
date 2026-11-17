// Rebuilds links/interneto-links.csv from the Raindrop REST API, replacing the
// Pro-only "Export" download. The API is available on free accounts.
//
//   pnpm db:fetch            only what changed since the last run (seconds)
//   pnpm db:fetch --full     everything (~15 min); also the automatic fallback
//
// Reads RAINDROP_TOKEN from the environment or a gitignored .env.
// Incremental runs need links/raindrop-state.json, written by every successful run.
//
// Token: app.raindrop.io -> Settings -> Integrations -> "For Developers" ->
// create an app -> "Create test token". Read-only use; this script only sends GETs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PATHS } from '../config/categories.js'
import { parseCsv } from '../lib/csv-parser.js'
import { applyChanges, buildIncludedPaths, raindropsToCsv, rowsToCsv } from './lib/raindrop-csv.js'
import { EXCLUDED_ROOT_IDS, changedSince, createClient, fetchAllRaindrops, requireToken } from './lib/raindrop-api.js'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.resolve(ROOT_DIR, PATHS.INPUT_CSV_CANDIDATES[0])
const STATE = path.resolve(ROOT_DIR, 'links/raindrop-state.json')

const get = createClient(requireToken())

const startedAt = new Date()
const collections = [...(await get('/collections')).items, ...(await get('/collections/childrens')).items]
const paths = buildIncludedPaths(collections, EXCLUDED_ROOT_IDS)
console.log(`📁 ${collections.length} collections`)

function save(csv, rowCount, note) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(`${OUT}.tmp`, csv)
  fs.renameSync(`${OUT}.tmp`, OUT)
  fs.writeFileSync(STATE, JSON.stringify({ syncedAt: startedAt.toISOString(), paths: [...paths] }))
  console.log(`✅ ${rowCount} bookmarks -> ${path.relative(ROOT_DIR, OUT)} (${note})`)
}

// Returns false when the result cannot be trusted, so the caller refetches everything.
async function incremental() {
  if (!fs.existsSync(STATE) || !fs.existsSync(OUT)) return false
  const state = JSON.parse(fs.readFileSync(STATE, 'utf8'))
  // Overlap the previous run a little: its own requests were not instantaneous.
  const since = new Date(new Date(state.syncedAt).getTime() - 5 * 60 * 1000).toISOString()

  const { items: changed, total } = await changedSince(get, 0, since)
  const { items: trashed } = await changedSince(get, -99, since)
  const rows = applyChanges({
    rows: new Map(parseCsv(fs.readFileSync(OUT, 'utf8')).map((row) => [row.id, row])),
    oldPaths: new Map(state.paths),
    newPaths: paths,
    changed,
    trashedIds: trashed.map((r) => r._id),
  })
  if (!rows) {
    console.log('↩️  A collection change could not be followed incrementally.')
    return false
  }
  // Everything the API counts must be either a row or under an off-limits root; otherwise something
  // disappeared without a trace (e.g. Trash was emptied) and only a full fetch can tell what.
  const offLimits = collections.filter((c) => !paths.has(c._id)).reduce((sum, c) => sum + (c.count ?? 0), 0)
  if (rows.size + offLimits !== total) {
    console.log(`↩️  Count mismatch (${rows.size} rows + ${offLimits} off-limits vs ${total} in the account).`)
    return false
  }
  save(rowsToCsv(rows.values()), rows.size, `incremental: ${changed.length} changed, ${trashed.length} trashed since ${since}`)
  return true
}

if (process.argv.includes('--full') || !(await incremental())) {
  console.log('📥 Full fetch…')
  // Collection 0 = everything except Trash.
  const { items, total } = await fetchAllRaindrops(get, 0, (n, t) => console.log(`📥 ${n}/${t}`))

  // A short fetch must never reach the importer: it soft-removes every bookmark missing from the CSV.
  if (items.length < total) {
    console.error(`❌ Incomplete fetch: ${items.length} of ${total} bookmarks. CSV left untouched; re-run.`)
    process.exit(1)
  }

  const { csv, rows, dropped } = raindropsToCsv(collections, items, { excludeRootIds: EXCLUDED_ROOT_IDS })
  save(csv, rows, `full${dropped ? `, ${dropped} skipped: excluded root or unknown collection` : ''}`)
}
