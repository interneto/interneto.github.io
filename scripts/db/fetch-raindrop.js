// Rebuilds links/interneto-links.csv from the Raindrop REST API, replacing the
// Pro-only "Export" download. The API is available on free accounts.
//
//   pnpm db:fetch        (reads RAINDROP_TOKEN from the environment or a gitignored .env)
//
// Token: app.raindrop.io -> Settings -> Integrations -> "For Developers" ->
// create an app -> "Create test token". Read-only use; this script only sends GETs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PATHS } from '../config/categories.js'
import { raindropsToCsv } from './lib/raindrop-csv.js'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.resolve(ROOT_DIR, PATHS.INPUT_CSV_CANDIDATES[0])
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
    const res = await fetch(`${API}${route}`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) return res.json()
    // 120 requests/minute; the reset header is a unix timestamp.
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000 - Date.now()
      await sleep(Math.min(Math.max(reset, 2000), 65000))
      continue
    }
    throw new Error(`GET ${route} -> ${res.status} ${res.statusText}`)
  }
}

const collections = [...(await get('/collections')).items, ...(await get('/collections/childrens')).items]
console.log(`📁 ${collections.length} collections`)

// Collection 0 = everything except Trash.
const raindrops = []
let total = Infinity
for (let page = 0; raindrops.length < total; page++) {
  const body = await get(`/raindrops/0?perpage=${PER_PAGE}&page=${page}&sort=created`)
  total = body.count
  if (!body.items.length) break
  raindrops.push(...body.items)
  if (page % 20 === 0) console.log(`📥 ${raindrops.length}/${total}`)
}

// A short fetch must never reach the importer: it soft-removes every bookmark missing from the CSV.
const unique = new Map(raindrops.map((r) => [r._id, r]))
if (unique.size < total) {
  console.error(`❌ Incomplete fetch: ${unique.size} of ${total} bookmarks. CSV left untouched; re-run.`)
  process.exit(1)
}

const { csv, rows, dropped } = raindropsToCsv(collections, [...unique.values()], { excludeRootIds: EXCLUDED_ROOT_IDS })
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(`${OUT}.tmp`, csv)
fs.renameSync(`${OUT}.tmp`, OUT)
console.log(`✅ ${rows} bookmarks -> ${path.relative(ROOT_DIR, OUT)}${dropped ? ` (${dropped} skipped: excluded root or unknown collection)` : ''}`)
