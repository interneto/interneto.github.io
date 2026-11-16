import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIncludedPaths } from './raindrop-csv.js'

const SCHEMA_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../data/db/raindrop-schema.sql')

const SYSTEM_COLLECTIONS = [{ _id: -1, title: 'Unsorted' }]

/**
 * Writes a whole account snapshot into an empty database.
 * Bookmarks in an excluded root's subtree, and those collections, are left out.
 */
export function writeRaindropDb(db, { collections: listed, raindrops, meta = {}, excludeRootIds = [] }) {
  // The API lists roots under both /collections and /collections/childrens.
  const collections = [...new Map(listed.map((c) => [c._id, c])).values()]
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'))
  const paths = buildIncludedPaths(collections, excludeRootIds)
  const byId = new Map([...SYSTEM_COLLECTIONS, ...collections].map((c) => [c._id, c]))
  const depthOf = (id) => {
    let depth = 0
    for (let c = byId.get(id); c?.parent?.$id != null && byId.has(c.parent.$id) && depth < 50; c = byId.get(c.parent.$id)) depth++
    return depth
  }

  const insertMeta = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)')
  const insertCollection = db.prepare(`INSERT INTO collections
    (id, title, parent_id, path, depth, count, public, view, sort, color, cover, expanded, created, last_update, raw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertRaindrop = db.prepare(`INSERT INTO raindrops
    (id, collection_id, title, link, domain, excerpt, note, type, cover, important, broken, created, last_update,
     reminder, cache_status, cache_size, file_name, file_type, file_size, sort, raw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertTag = db.prepare('INSERT OR IGNORE INTO raindrop_tags (raindrop_id, tag) VALUES (?, ?)')
  const insertMedia = db.prepare('INSERT INTO media (raindrop_id, position, link, type) VALUES (?, ?, ?, ?)')
  const insertHighlight = db.prepare(`INSERT OR IGNORE INTO highlights (id, raindrop_id, text, note, color, created, last_update)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)

  const n = (v) => v ?? null
  const bool = (v) => (v ? 1 : 0)
  const report = { collections: 0, raindrops: 0, skipped: 0, highlights: 0 }

  db.exec('BEGIN')
  for (const [key, value] of Object.entries(meta)) insertMeta.run(key, typeof value === 'string' ? value : JSON.stringify(value))

  // Parents before children, so parent_id always points at an existing row.
  const included = [...SYSTEM_COLLECTIONS, ...collections].filter((c) => paths.has(c._id))
  included.sort((a, b) => depthOf(a._id) - depthOf(b._id))
  for (const c of included) {
    const isSystem = c._id < 0
    insertCollection.run(c._id, c.title, n(c.parent?.$id), paths.get(c._id), depthOf(c._id), n(c.count), bool(c.public),
      n(c.view), n(c.sort), n(c.color), n(c.cover?.[0]), bool(c.expanded), n(c.created), n(c.lastUpdate),
      isSystem ? null : JSON.stringify(c))
    report.collections++
  }

  for (const r of raindrops) {
    const collectionId = r.collection?.$id
    if (!paths.has(collectionId)) {
      report.skipped++
      continue
    }
    insertRaindrop.run(r._id, collectionId, n(r.title), r.link ?? '', n(r.domain), n(r.excerpt), n(r.note), n(r.type),
      n(r.cover), bool(r.important), bool(r.broken), n(r.created), n(r.lastUpdate), n(r.reminder?.date),
      n(r.cache?.status), n(r.cache?.size), n(r.file?.name), n(r.file?.type), n(r.file?.size), n(r.sort), JSON.stringify(r))
    for (const tag of r.tags ?? []) insertTag.run(r._id, tag)
    ;(r.media ?? []).forEach((m, i) => m?.link && insertMedia.run(r._id, i, m.link, n(m.type)))
    for (const h of r.highlights ?? []) {
      insertHighlight.run(h._id, r._id, n(h.text), n(h.note), n(h.color), n(h.created), n(h.lastUpdate))
      report.highlights++
    }
    report.raindrops++
  }
  db.exec("INSERT INTO raindrops_fts(raindrops_fts) VALUES ('rebuild')")
  db.exec('COMMIT')
  return report
}
