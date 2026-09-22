/**
 * Build a local, read-only snapshot of the Raindrop library for classification work.
 *
 *   node scripts/raindrop-snapshot.mjs <collections.raw.json> [links/interneto-links.csv]
 *
 * <collections.raw.json> is the saved output of the Raindrop MCP `find_collections` call
 * (no arguments). It is too large for the chat, so the harness writes it to a file; pass that path.
 *
 * Writes to links/snapshot/ (gitignored, regenerable):
 *   collections.tsv  id, parent_id, depth, own, total, path (joined with " > ")
 *   tree.md          indented tree with ids and own/total counts
 *   orphans.tsv      collections with 0 bookmarks in their whole subtree
 *   bookmarks.tsv    id, collection_id, folder, title  (from the CSV export; only if the CSV exists)
 *
 * Paths use " > " because collection titles can contain "/" (e.g. "Apps & Services").
 * CSV folder paths use " / ", which is how bookmarks are matched back to collection ids.
 */

import fs from 'node:fs'
import path from 'node:path'
import { parseCsv, cleanText } from './lib/csv-parser.js'

const [rawPath, csvPath = 'links/interneto-links.csv'] = process.argv.slice(2)
if (!rawPath) {
  console.error('usage: node scripts/raindrop-snapshot.mjs <collections.raw.json> [csv]')
  process.exit(1)
}

const OUT = 'links/snapshot'
const RESERVED = new Set(['TEST', 'REVIEW'])

const { collections } = JSON.parse(fs.readFileSync(rawPath, 'utf8'))
const byId = new Map(collections.map((c) => [c.collection_id, c]))
const kids = new Map()
for (const c of collections) {
  const parent = byId.has(c.parent_id) ? c.parent_id : null
  if (!kids.has(parent)) kids.set(parent, [])
  kids.get(parent).push(c)
}
const byTitle = (a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase())

const tsv = ['id\tparent_id\tdepth\town\ttotal\tpath']
const tree = ['# Raindrop collection tree: title `id` (own/total)', '']
const csvPaths = new Map() // "A / B / C" -> collection id
const pathOf = new Map() // id -> "A > B > C"

function walk(parentId, trail, depth) {
  for (const c of (kids.get(parentId) ?? []).sort(byTitle)) {
    const next = [...trail, c.title]
    csvPaths.set(next.join(' / '), c.collection_id)
    pathOf.set(c.collection_id, next.join(' > '))
    tsv.push([c.collection_id, parentId ?? '', depth, c.bookmarks_count, c.total_bookmarks_count, next.join(' > ')].join('\t'))
    tree.push(`${'  '.repeat(depth)}- ${c.title} \`${c.collection_id}\` (${c.bookmarks_count}/${c.total_bookmarks_count})`)
    walk(c.collection_id, next, depth + 1)
  }
}
walk(null, [], 0)

const orphans = collections.filter(
  (c) => c.collection_id > 0 && c.total_bookmarks_count === 0 && !RESERVED.has(c.title),
)

fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'collections.tsv'), tsv.join('\n') + '\n')
fs.writeFileSync(path.join(OUT, 'tree.md'), tree.join('\n') + '\n')
fs.writeFileSync(
  path.join(OUT, 'orphans.tsv'),
  ['id\tparent_id\tpath', ...orphans.map((c) => `${c.collection_id}\t${c.parent_id ?? ''}\t${pathOf.get(c.collection_id)}`)].join('\n') + '\n',
)
console.log(`${collections.length} collections, ${orphans.length} empty subtrees`)

if (fs.existsSync(csvPath)) {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  let unmatched = 0
  const out = ['id\tcollection_id\tfolder\ttitle']
  for (const r of rows) {
    const cid = csvPaths.get(r.folder) ?? ''
    if (!cid) unmatched++
    out.push(`${r.id}\t${cid}\t${r.folder}\t${cleanText(r.title)}`)
  }
  fs.writeFileSync(path.join(OUT, 'bookmarks.tsv'), out.join('\n') + '\n')
  console.log(`${rows.length} bookmarks, ${unmatched} without a matching collection (stale CSV: re-export it)`)
}
