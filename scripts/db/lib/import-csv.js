import { CATEGORY_CONFIG } from '../../config/categories.js'
import { parseCsv, cleanText, extractSourceCodeUrls } from '../../lib/csv-parser.js'
import { normalizeFolder, isValidRowFolder } from '../../lib/utils.js'

const categoryByFolder = new Map(
  CATEGORY_CONFIG.map((c) => [c.folder, { ...c, id: c.file.replace(/\.md$/, '') }])
)

function resolveDomain(url) {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function upsertTagId(db, name) {
  const trimmed = name.trim()
  if (!trimmed) return null
  db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (:name)').run({ name: trimmed })
  return db.prepare('SELECT id FROM tags WHERE name = :name').get({ name: trimmed }).id
}

export function importCsv(db, csvText, { runAt = new Date().toISOString() } = {}) {
  const rows = parseCsv(csvText)

  const upsertStmt = db.prepare(`
    INSERT INTO bookmarks (raindrop_id, url, title, description, domain, cover, note, favorite, category, folder_path, created_at, imported_at, removed_at)
    VALUES (:raindrop_id, :url, :title, :description, :domain, :cover, :note, :favorite, :category, :folder_path, :created_at, :imported_at, NULL)
    ON CONFLICT(raindrop_id) DO UPDATE SET
      url = excluded.url, title = excluded.title, description = excluded.description, domain = excluded.domain,
      cover = excluded.cover, note = excluded.note, favorite = excluded.favorite, category = excluded.category,
      folder_path = excluded.folder_path, created_at = excluded.created_at, imported_at = excluded.imported_at, removed_at = NULL
  `)
  const selectByRaindropId = db.prepare('SELECT id FROM bookmarks WHERE raindrop_id = :raindrop_id')
  const deleteTags = db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = :bookmark_id')
  const insertTagLink = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (:bookmark_id, :tag_id)')
  const deleteSourceUrls = db.prepare('DELETE FROM source_code_urls WHERE bookmark_id = :bookmark_id')
  const insertSourceUrl = db.prepare('INSERT OR IGNORE INTO source_code_urls (bookmark_id, url) VALUES (:bookmark_id, :url)')

  const report = { processed: 0, created: 0, updated: 0, removed: 0, skipped: 0, unmappedCategories: new Map() }

  for (const row of rows) {
    const folderParts = normalizeFolder(row.folder || '')
    if (!isValidRowFolder(folderParts)) continue

    const categoryFolder = folderParts[1]
    const categoryConfig = categoryByFolder.get(categoryFolder)
    if (!categoryConfig) {
      report.unmappedCategories.set(categoryFolder, (report.unmappedCategories.get(categoryFolder) ?? 0) + 1)
      continue
    }

    const raindropId = cleanText(row.id)
    const title = cleanText(row.title)
    const rawUrl = cleanText(row.url)
    if (!raindropId || !title || !rawUrl) {
      report.skipped++
      continue
    }

    let url
    try {
      url = new URL(rawUrl).toString()
    } catch {
      report.skipped++
      continue
    }

    const existing = selectByRaindropId.get({ raindrop_id: raindropId })

    upsertStmt.run({
      raindrop_id: raindropId,
      url,
      title,
      description: cleanText(row.excerpt) || null,
      domain: resolveDomain(url),
      cover: cleanText(row.cover) || null,
      note: cleanText(row.note) || null,
      favorite: String(row.favorite).toLowerCase() === 'true' ? 1 : 0,
      category: categoryConfig.id,
      folder_path: JSON.stringify(folderParts.slice(2)),
      created_at: cleanText(row.created) || null,
      imported_at: runAt,
    })

    const bookmarkId = existing ? existing.id : selectByRaindropId.get({ raindrop_id: raindropId }).id
    existing ? report.updated++ : report.created++
    report.processed++

    deleteSourceUrls.run({ bookmark_id: bookmarkId })
    for (const sourceUrl of extractSourceCodeUrls(row.note) ?? []) {
      insertSourceUrl.run({ bookmark_id: bookmarkId, url: sourceUrl })
    }

    deleteTags.run({ bookmark_id: bookmarkId })
    for (const tagName of String(row.tags || '').split(',')) {
      const tagId = upsertTagId(db, tagName)
      if (tagId) insertTagLink.run({ bookmark_id: bookmarkId, tag_id: tagId })
    }
  }

  const removedResult = db
    .prepare('UPDATE bookmarks SET removed_at = :removed_at WHERE removed_at IS NULL AND imported_at != :run_at')
    .run({ removed_at: runAt, run_at: runAt })
  report.removed = removedResult.changes

  return report
}
