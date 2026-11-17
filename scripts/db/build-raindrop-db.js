// Builds data/raindrop.db: a complete, queryable SQLite copy of the Raindrop account
// (collections, every bookmark field incl. raw JSON, tags, media, highlights, stats).
// Unlike data/bookmarks.db (only what the site publishes), this keeps the off-limits root
// `!nfo`; the root `.` and Trash are left out (the maintainer's choice, 2026-11-16). The file
// is local and gitignored.
//
//   pnpm db:mirror   only what changed since the last run (seconds); rebuilds when that cannot be trusted
//   pnpm db:full     rebuild from scratch (~15 min for ~47k bookmarks)
//
// Reads RAINDROP_TOKEN like fetch-raindrop.js. Only sends GETs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { changedSince, createClient, fetchAllRaindrops, requireToken } from './lib/raindrop-api.js'
import { applyIncremental, writeRaindropDb } from './lib/raindrop-db.js'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.resolve(ROOT_DIR, 'data/raindrop.db')
const TMP = `${OUT}.tmp`
const DOT_ROOT_ID = 71411789 // the root titled "." (docs/RAINDROP-CLEANUP.md); `!nfo` stays in

const get = createClient(requireToken())
const fetchedAt = new Date().toISOString()

const { user } = await get('/user')
const collections = [...(await get('/collections')).items, ...(await get('/collections/childrens')).items]
const { result: _ok, ...filters } = await get('/filters/0')
console.log(`📁 ${collections.length} collections`)

const meta = (accountTotal) => ({
  fetched_at: fetchedAt,
  source: 'https://api.raindrop.io/rest/v1',
  filters,
  user: { id: user._id, name: user.fullName, pro: user.pro, pro_expire: user.proExpire, registered: user.registered, files: user.files },
  account_total: accountTotal,
})

// Returns false when only a full rebuild can be trusted.
async function incremental() {
  if (!fs.existsSync(OUT)) return false
  const db = new DatabaseSync(OUT)
  try {
    const last = db.prepare("SELECT value FROM meta WHERE key = 'fetched_at'").get()?.value
    if (!last) return false
    // Overlap the previous run a little: its own requests were not instantaneous.
    const since = new Date(Date.parse(last) - 5 * 60 * 1000).toISOString()
    const { items: changed, total } = await changedSince(get, 0, since)
    const { items: trashed } = await changedSince(get, -99, since)
    const result = applyIncremental(db, {
      collections, changed, trashedIds: trashed.map((r) => r._id), accountTotal: total, excludeRootIds: [DOT_ROOT_ID], meta: meta(total),
    })
    if (!result.ok) {
      console.log(`↩️  ${result.reason}; rebuilding from scratch.`)
      return false
    }
    const { changed: c, removed, removedCollections } = result.report
    console.log(`✅ ${path.relative(ROOT_DIR, OUT)} updated since ${since}: ${c} bookmarks changed or added, ${removed} removed, ` +
      `${removedCollections} collections removed`)
    return true
  } catch (error) {
    console.log(`↩️  Incremental update failed (${error.message}); rebuilding from scratch.`)
    return false
  } finally {
    db.close()
  }
}

if (!process.argv.includes('--full') && (await incremental())) process.exit(0)

const all = await fetchAllRaindrops(get, 0, (n, t) => console.log(`📥 ${n}/${t}`))
if (all.items.length < all.total) {
  console.error(`❌ Incomplete fetch (${all.items.length}/${all.total}). Database left untouched; re-run.`)
  process.exit(1)
}

fs.rmSync(TMP, { force: true })
const db = new DatabaseSync(TMP)
const report = writeRaindropDb(db, { collections, raindrops: all.items, excludeRootIds: [DOT_ROOT_ID], meta: meta(all.total) })
db.exec('VACUUM')
db.close()
fs.renameSync(TMP, OUT)

console.log(`✅ ${path.relative(ROOT_DIR, OUT)}: ${report.raindrops} bookmarks, ` +
  `${report.collections} collections, ${report.highlights} highlights, ${report.skipped} skipped (root "." or unknown collection)`)
