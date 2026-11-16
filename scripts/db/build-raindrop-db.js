// Builds data/raindrop.db: a complete, queryable SQLite copy of the Raindrop account
// (collections, every bookmark field incl. raw JSON, tags, media, highlights, stats).
// Unlike data/bookmarks.db (only what the site publishes), this keeps the off-limits root
// `!nfo`; the root `.` and Trash are left out (the maintainer's choice, 2026-11-16). The file
// is local and gitignored. Rebuilt from scratch each run (~15 min for ~47k bookmarks).
//
//   pnpm db:full
//
// Reads RAINDROP_TOKEN like fetch-raindrop.js. Only sends GETs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { createClient, fetchAllRaindrops, requireToken } from './lib/raindrop-api.js'
import { writeRaindropDb } from './lib/raindrop-db.js'

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

const all = await fetchAllRaindrops(get, 0, (n, t) => console.log(`📥 ${n}/${t}`))
if (all.items.length < all.total) {
  console.error(`❌ Incomplete fetch (${all.items.length}/${all.total}). Database left untouched; re-run.`)
  process.exit(1)
}

fs.rmSync(TMP, { force: true })
const db = new DatabaseSync(TMP)
const report = writeRaindropDb(db, {
  collections,
  raindrops: all.items,
  excludeRootIds: [DOT_ROOT_ID],
  meta: {
    fetched_at: fetchedAt,
    source: 'https://api.raindrop.io/rest/v1',
    filters,
    user: { id: user._id, name: user.fullName, pro: user.pro, pro_expire: user.proExpire, registered: user.registered, files: user.files },
    account_total: all.total,
  },
})
db.exec('VACUUM')
db.close()
fs.renameSync(TMP, OUT)

console.log(`✅ ${path.relative(ROOT_DIR, OUT)}: ${report.raindrops} bookmarks, ` +
  `${report.collections} collections, ${report.highlights} highlights, ${report.skipped} skipped (root "." or unknown collection)`)
