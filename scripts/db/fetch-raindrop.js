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

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.resolve(ROOT_DIR, PATHS.INPUT_CSV_CANDIDATES[0])
const STATE = path.resolve(ROOT_DIR, 'links/raindrop-state.json')
const API = 'https://api.raindrop.io/rest/v1'
const PER_PAGE = 50 // API maximum
// Off-limits roots (docs/RAINDROP-CLEANUP.md): never written to the snapshot.
const EXCLUDED_ROOT_IDS = [19044358, 71411789]

const token = process.env.RAINDROP_TOKEN
if (!token) {
  console.error('❌ RAINDROP_TOKEN is not set. Put RAINDROP_TOKEN=... in .env (gitignored); see the header of this script.')
  process.exit(1)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function get(route) {
  for (let attempt = 0; ; attempt++) {
    let res
    try {
      res = await fetch(`${API}${route}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) return await res.json()
    } catch (error) {
      // Dropped connections (ECONNRESET) happen over ~950 requests; retry rather than lose the run.
      if (attempt >= 5) throw error
      await sleep(3000 * (attempt + 1))
      continue
    }
    // 120 requests/minute; the reset header is a unix timestamp.
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000 - Date.now()
      // No usable header -> wait out a full rate-limit window.
      await sleep(reset > 0 && reset < 120000 ? reset + 1000 : 61000)
      continue
    }
    throw new Error(`GET ${route} -> ${res.status} ${res.statusText}`)
  }
}

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

// Bookmarks of `collectionId` touched at or after `since`, newest change first.
async function changedSince(collectionId, since) {
  const items = []
  let total = 0
  for (let page = 0; ; page++) {
    const body = await get(`/raindrops/${collectionId}?perpage=${PER_PAGE}&page=${page}&sort=-lastUpdate`)
    total = body.count
    const fresh = body.items.filter((r) => r.lastUpdate >= since)
    items.push(...fresh)
    if (fresh.length < PER_PAGE) break
    await sleep(550)
  }
  return { items, total }
}

// Returns false when the result cannot be trusted, so the caller refetches everything.
async function incremental() {
  if (!fs.existsSync(STATE) || !fs.existsSync(OUT)) return false
  const state = JSON.parse(fs.readFileSync(STATE, 'utf8'))
  // Overlap the previous run a little: its own requests were not instantaneous.
  const since = new Date(new Date(state.syncedAt).getTime() - 5 * 60 * 1000).toISOString()

  const { items: changed, total } = await changedSince(0, since)
  const { items: trashed } = await changedSince(-99, since)
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
  const raindrops = []
  let total = Infinity
  for (let page = 0; raindrops.length < total; page++) {
    const body = await get(`/raindrops/0?perpage=${PER_PAGE}&page=${page}&sort=created`)
    total = body.count
    if (!body.items.length) break
    raindrops.push(...body.items)
    await sleep(550) // stay under the 120 requests/minute limit instead of running into it
    if (page % 20 === 0) console.log(`📥 ${raindrops.length}/${total}`)
  }

  // A short fetch must never reach the importer: it soft-removes every bookmark missing from the CSV.
  const unique = new Map(raindrops.map((r) => [r._id, r]))
  if (unique.size < total) {
    console.error(`❌ Incomplete fetch: ${unique.size} of ${total} bookmarks. CSV left untouched; re-run.`)
    process.exit(1)
  }

  const { csv, rows, dropped } = raindropsToCsv(collections, [...unique.values()], { excludeRootIds: EXCLUDED_ROOT_IDS })
  save(csv, rows, `full${dropped ? `, ${dropped} skipped: excluded root or unknown collection` : ''}`)
}
