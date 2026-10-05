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

/** Rows whose collection is unknown (or under an excluded root) are dropped and counted. */
export function raindropsToCsv(collections, raindrops, { excludeRootIds = [] } = {}) {
  const excluded = new Set(excludeRootIds)
  const byId = new Map(collections.map((c) => [c._id, c]))
  const rootOf = (id) => {
    let c = byId.get(id)
    for (let i = 0; c?.parent?.$id != null && byId.has(c.parent.$id) && i < 50; i++) c = byId.get(c.parent.$id)
    return c?._id
  }
  const paths = buildFolderPaths(collections)

  const lines = [HEADERS.join(',')]
  let dropped = 0
  for (const r of raindrops) {
    const collectionId = r.collection?.$id
    const folder = paths.get(collectionId)
    if (!folder || excluded.has(rootOf(collectionId))) {
      dropped++
      continue
    }
    lines.push(
      [
        r._id,
        r.title,
        r.note,
        r.excerpt,
        r.link,
        folder,
        (r.tags ?? []).join(', '),
        r.created,
        r.cover,
        (r.highlights ?? []).map((h) => `Highlight:${h.text ?? ''}`).join('\n'),
        Boolean(r.important),
      ]
        .map(csvField)
        .join(','),
    )
  }
  return { csv: lines.join('\n') + '\n', rows: lines.length - 1, dropped }
}
