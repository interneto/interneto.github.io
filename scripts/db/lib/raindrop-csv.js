// Turns Raindrop REST API objects into the same CSV the app's (Pro-only) export produces,
// so the rest of the pipeline (import.js, raindrop-snapshot.mjs) keeps reading one format.

const HEADERS = ['id', 'title', 'note', 'excerpt', 'url', 'folder', 'tags', 'created', 'cover', 'highlights', 'favorite']

const csvField = (value) => {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** id -> "Root / Child / Leaf", the folder format of the export. */
export function buildFolderPaths(collections) {
  const byId = new Map(collections.map((c) => [c._id, c]))
  const paths = new Map([[-1, 'Unsorted']])
  const pathOf = (id, seen = new Set()) => {
    if (paths.has(id)) return paths.get(id)
    const c = byId.get(id)
    if (!c || seen.has(id)) return null
    seen.add(id)
    const parent = c.parent?.$id != null ? pathOf(c.parent.$id, seen) : null
    const full = parent ? `${parent} / ${c.title}` : c.title
    paths.set(id, full)
    return full
  }
  for (const c of collections) pathOf(c._id)
  return paths
}

/** id -> folder path for every collection a bookmark may be written from; excluded roots' subtrees are left out. */
export function buildIncludedPaths(collections, excludeRootIds = []) {
  const excluded = new Set(excludeRootIds)
  const byId = new Map(collections.map((c) => [c._id, c]))
  const rootOf = (id) => {
    let c = byId.get(id)
    for (let i = 0; c?.parent?.$id != null && byId.has(c.parent.$id) && i < 50; i++) c = byId.get(c.parent.$id)
    return c?._id
  }
  const paths = buildFolderPaths(collections)
  for (const id of [...paths.keys()]) if (excluded.has(rootOf(id))) paths.delete(id)
  return paths
}

/** One API bookmark -> one CSV row object (string values, keyed like the header). */
export function toRow(r, folder) {
  return {
    id: String(r._id),
    title: r.title ?? '',
    note: r.note ?? '',
    excerpt: r.excerpt ?? '',
    url: r.link ?? '',
    folder,
    tags: (r.tags ?? []).join(', '),
    created: r.created ?? '',
    cover: r.cover ?? '',
    highlights: (r.highlights ?? []).map((h) => `Highlight:${h.text ?? ''}`).join('\n'),
    favorite: String(Boolean(r.important)),
  }
}

/** Rows are written oldest first (id breaks ties) so a full and an incremental run give the same file. */
export function rowsToCsv(rows) {
  const sorted = [...rows].sort((a, b) => a.created.localeCompare(b.created) || Number(a.id) - Number(b.id))
  return [HEADERS.join(','), ...sorted.map((row) => HEADERS.map((h) => csvField(row[h])).join(','))].join('\n') + '\n'
}

/** Rows whose collection is unknown (or under an excluded root) are dropped and counted. */
export function raindropsToCsv(collections, raindrops, { excludeRootIds = [] } = {}) {
  const paths = buildIncludedPaths(collections, excludeRootIds)
  const rows = []
  let dropped = 0
  for (const r of raindrops) {
    const folder = paths.get(r.collection?.$id)
    if (folder) rows.push(toRow(r, folder))
    else dropped++
  }
  return { csv: rowsToCsv(rows), rows: rows.length, dropped }
}

/**
 * Applies what changed since the last sync to the previous rows, in place of refetching everything.
 * Returns null when the result cannot be trusted (caller falls back to a full fetch).
 *
 * rows: Map id -> row from the previous CSV. oldPaths/newPaths: Map collection id -> folder path
 * then and now. changed: API bookmarks updated since the last sync. trashedIds: ids moved to Trash.
 */
export function applyChanges({ rows, oldPaths, newPaths, changed, trashedIds }) {
  // Renamed or reparented collections move their bookmarks' folder path without touching the bookmarks.
  const renames = new Map()
  for (const [id, oldPath] of oldPaths) {
    const newPath = newPaths.get(id)
    if (!newPath || newPath === oldPath) continue
    if (renames.has(oldPath) && renames.get(oldPath) !== newPath) return null // two collections shared that path
    renames.set(oldPath, newPath)
  }
  for (const row of rows.values()) if (renames.has(row.folder)) row.folder = renames.get(row.folder)

  for (const r of changed) {
    const id = String(r._id)
    rows.delete(id)
    const folder = newPaths.get(r.collection?.$id)
    if (folder) rows.set(id, toRow(r, folder))
  }
  for (const id of trashedIds) rows.delete(String(id))

  const known = new Set(newPaths.values())
  for (const row of rows.values()) if (!known.has(row.folder)) return null // a folder we could not follow
  return rows
}
