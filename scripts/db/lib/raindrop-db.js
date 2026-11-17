import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIncludedPaths } from './raindrop-csv.js'
import { siteOf } from './site.js'

const SCHEMA_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../data/db/raindrop-schema.sql')

const SYSTEM_COLLECTIONS = [{ _id: -1, title: 'Unsorted' }]
const COLLECTION_COLS = ['id', 'title', 'description', 'slug', 'access_level', 'parent_id', 'path', 'depth', 'count', 'public',
  'view', 'sort', 'color', 'cover', 'expanded', 'created', 'last_update', 'raw']

const n = (v) => v ?? null
const bool = (v) => (v ? 1 : 0)

function statements(db) {
  return {
    upsertCollection: db.prepare(`INSERT INTO collections (${COLLECTION_COLS}) VALUES (${COLLECTION_COLS.map(() => '?')})
      ON CONFLICT(id) DO UPDATE SET ${COLLECTION_COLS.slice(1).map((c) => `${c} = excluded.${c}`)}`),
    insertRaindrop: db.prepare(`INSERT INTO raindrops
      (id, collection_id, title, link, domain, site, excerpt, note, type, cover, important, broken, created, last_update,
       reminder, cache_status, cache_size, file_name, file_type, file_size, sort, raw)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    insertTag: db.prepare('INSERT OR IGNORE INTO raindrop_tags (raindrop_id, tag) VALUES (?, ?)'),
    insertMedia: db.prepare('INSERT INTO media (raindrop_id, position, link, type) VALUES (?, ?, ?, ?)'),
    insertHighlight: db.prepare(`INSERT OR IGNORE INTO highlights (id, raindrop_id, text, note, color, created, last_update)
      VALUES (?, ?, ?, ?, ?, ?, ?)`),
    // Children first: they reference the bookmark.
    removeRaindrop: ['raindrop_tags', 'media', 'highlights'].map((t) => db.prepare(`DELETE FROM ${t} WHERE raindrop_id = ?`))
      .concat(db.prepare('DELETE FROM raindrops WHERE id = ?')),
    setMeta: db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
  }
}

/** Inserts or updates every collection outside the excluded roots; returns their id -> path map. */
function writeCollections(s, listed, excludeRootIds) {
  // The API lists roots under both /collections and /collections/childrens.
  const collections = [...new Map(listed.map((c) => [c._id, c])).values()]
  const paths = buildIncludedPaths(collections, excludeRootIds)
  const byId = new Map([...SYSTEM_COLLECTIONS, ...collections].map((c) => [c._id, c]))
  const depthOf = (id) => {
    let depth = 0
    for (let c = byId.get(id); c?.parent?.$id != null && byId.has(c.parent.$id) && depth < 50; c = byId.get(c.parent.$id)) depth++
    return depth
  }
  // Parents before children, so parent_id always points at an existing row.
  const included = [...SYSTEM_COLLECTIONS, ...collections].filter((c) => paths.has(c._id))
  included.sort((a, b) => depthOf(a._id) - depthOf(b._id))
  for (const c of included) {
    s.upsertCollection.run(c._id, c.title, c.description || null, n(c.slug), n(c.access?.level), n(c.parent?.$id), paths.get(c._id),
      depthOf(c._id), n(c.count), bool(c.public), n(c.view), n(c.sort), n(c.color), n(c.cover?.[0]), bool(c.expanded),
      n(c.created), n(c.lastUpdate), c._id < 0 ? null : JSON.stringify(c))
  }
  return { paths, collections, included }
}

const removeRaindrop = (s, id) => s.removeRaindrop.reduce((changes, stmt) => changes + Number(stmt.run(id).changes), 0) > 0

/**
 * Replaces a bookmark's row and child rows. Returns 'written', or, when it is outside the
 * mirror (excluded root), 'removed' if a row for it existed and 'skipped' if not.
 */
function writeRaindrop(s, r, paths) {
  const existed = removeRaindrop(s, r._id)
  const collectionId = r.collection?.$id
  if (!paths.has(collectionId)) return existed ? 'removed' : 'skipped'
  s.insertRaindrop.run(r._id, collectionId, n(r.title), r.link ?? '', n(r.domain), siteOf(r.domain), n(r.excerpt), n(r.note), n(r.type),
    n(r.cover), bool(r.important), bool(r.broken), n(r.created), n(r.lastUpdate), n(r.reminder?.date),
    n(r.cache?.status), n(r.cache?.size), n(r.file?.name), n(r.file?.type), n(r.file?.size), n(r.sort), JSON.stringify(r))
  for (const tag of r.tags ?? []) s.insertTag.run(r._id, tag)
  ;(r.media ?? []).forEach((m, i) => m?.link && s.insertMedia.run(r._id, i, m.link, n(m.type)))
  for (const h of r.highlights ?? []) s.insertHighlight.run(h._id, r._id, n(h.text), n(h.note), n(h.color), n(h.created), n(h.lastUpdate))
  return 'written'
}

const writeMeta = (s, meta) => { for (const [k, v] of Object.entries(meta)) s.setMeta.run(k, typeof v === 'string' ? v : JSON.stringify(v)) }

/**
 * Writes a whole account snapshot into an empty database.
 * Bookmarks in an excluded root's subtree, and those collections, are left out.
 */
export function writeRaindropDb(db, { collections, raindrops, meta = {}, excludeRootIds = [] }) {
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'))
  const s = statements(db)
  const report = { collections: 0, raindrops: 0, skipped: 0, highlights: 0 }
  db.exec('BEGIN')
  writeMeta(s, meta)
  const { paths, included } = writeCollections(s, collections, excludeRootIds)
  report.collections = included.length
  for (const r of raindrops) {
    if (writeRaindrop(s, r, paths) === 'written') {
      report.raindrops++
      report.highlights += r.highlights?.length ?? 0
    } else report.skipped++
  }
  db.exec("INSERT INTO raindrops_fts(raindrops_fts) VALUES ('rebuild')")
  db.exec('COMMIT')
  return report
}

/**
 * Brings an existing mirror up to date with what changed in Raindrop: the current collection
 * list, bookmarks changed since the last run, and ids sent to Trash since then.
 * All in one transaction, rolled back (returning ok: false) when the result does not add up
 * to the account's total, e.g. after Trash was emptied: then only a full rebuild is reliable.
 */
export function applyIncremental(db, { collections, changed, trashedIds, accountTotal, meta = {}, excludeRootIds = [] }) {
  const s = statements(db)
  const report = { changed: 0, removed: 0, collections: 0, removedCollections: 0 }
  db.exec('BEGIN')
  try {
    const { paths, collections: unique, included } = writeCollections(s, collections, excludeRootIds)
    report.collections = included.length
    for (const r of changed) {
      const outcome = writeRaindrop(s, r, paths)
      if (outcome === 'written') report.changed++
      else if (outcome === 'removed') report.removed++
    }
    for (const id of trashedIds) if (removeRaindrop(s, id)) report.removed++

    // Collections deleted in Raindrop, or moved under an excluded root: deepest first.
    const stale = db.prepare('SELECT id FROM collections ORDER BY depth DESC').all().filter((c) => !paths.has(c.id))
    for (const { id } of stale) {
      if (db.prepare('SELECT 1 FROM raindrops WHERE collection_id = ? LIMIT 1').get(id)) {
        throw Object.assign(new Error(`collection ${id} is gone but still holds bookmarks`), { untrusted: true })
      }
      db.prepare('UPDATE collections SET parent_id = NULL WHERE parent_id = ?').run(id)
      db.prepare('DELETE FROM collections WHERE id = ?').run(id)
      report.removedCollections++
    }

    // The account total counts the excluded roots too.
    const excluded = unique.filter((c) => !paths.has(c._id)).reduce((sum, c) => sum + (c.count ?? 0), 0)
    const local = db.prepare('SELECT count(*) AS n FROM raindrops').get().n
    if (local + excluded !== accountTotal) {
      throw Object.assign(new Error(`count mismatch: ${local} local + ${excluded} excluded vs ${accountTotal} in the account`), { untrusted: true })
    }
    writeMeta(s, meta)
    db.exec("INSERT INTO raindrops_fts(raindrops_fts) VALUES ('rebuild')")
    db.exec('COMMIT')
    return { ok: true, report }
  } catch (error) {
    db.exec('ROLLBACK')
    if (!error.untrusted) throw error
    return { ok: false, reason: error.message }
  }
}
