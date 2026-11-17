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
