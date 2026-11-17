// scripts/db/export-json.js (run by export-site.js)

export function exportJson(db) {
  const rows = db
    .prepare(`
      SELECT b.*,
        (SELECT GROUP_CONCAT(name, char(1)) FROM (SELECT t.name FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = b.id ORDER BY bt.rowid)) AS tag_names,
        (SELECT GROUP_CONCAT(url, char(1)) FROM (SELECT url FROM source_code_urls WHERE bookmark_id = b.id ORDER BY rowid)) AS source_urls
      FROM bookmarks b
      WHERE b.removed_at IS NULL
      ORDER BY b.category, b.title COLLATE NOCASE, b.raindrop_id
    `)
    .all()

  return rows.map((row) => ({
    id: row.raindrop_id,
    title: row.title,
    url: row.url,
    description: row.description,
    domain: row.domain,
    cover: row.cover,
    favorite: !!row.favorite,
    category: row.category,
    subcategory: JSON.parse(row.folder_path || '[]'),
    tags: row.tag_names ? row.tag_names.split('\x01') : [],
    sourceCodeUrls: row.source_urls ? row.source_urls.split('\x01') : [],
    createdAt: row.created_at,
  }))
}

// A minimal sibling of bookmarks.json (short keys) for the client-side site search on
// /categories/ — the full file is ~18MB, too heavy to fetch for a search box. Clicking
// a result goes to the bookmark's own subcategory heading on its category page (`h`,
// from category-anchors.json — see buildAnchorMap in lib/markdown-renderer.js), not
// out to the external site; `u` is kept only for a secondary "open externally" link.
export function buildSearchIndex(data, anchorsByCategory = {}) {
  return data.map((b) => ({
    t: b.title,
    u: b.url,
    c: b.category,
    h: anchorsByCategory[b.category]?.[b.subcategory.join('\x01')] ?? '',
  }))
}
