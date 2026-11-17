// scripts/db/export-markdown.js (run by export-site.js)
import fs from 'node:fs'
import path from 'node:path'
import { CATEGORY_CONFIG } from '../config/categories.js'
import { renderGroupFile, buildAnchorMap } from '../lib/markdown-renderer.js'
import { createNode, addToTree, clearOutputDir } from '../lib/utils.js'

export function exportMarkdown(db, outputDir) {
  const groups = new Map(CATEGORY_CONFIG.map((c) => [c.folder, createNode()]))
  const categoryById = new Map(CATEGORY_CONFIG.map((c) => [c.file.replace(/\.md$/, ''), c]))

  // source_urls: a correlated subquery ordered by rowid (insertion order), not a
  // GROUP_CONCAT+JOIN — SQLite satisfies that join via the (bookmark_id, url)
  // primary key index and returns urls alphabetically, which silently reorders
  // them relative to import order and breaks parity with convert.js's parse-order.
  // ORDER BY b.id: without an explicit order, row order is whatever SQLite's
  // query planner picks (currently a rowid scan, but that's incidental — an
  // index added later on removed_at could change it) and would silently
  // reorder subheadings between runs. Same class of bug as the GROUP_CONCAT
  // fix above, just for the outer query instead of the source-urls subquery.
  const rows = db
    .prepare(`
      SELECT b.*, (
        SELECT GROUP_CONCAT(url, char(1)) FROM (
          SELECT url FROM source_code_urls WHERE bookmark_id = b.id ORDER BY rowid
        )
      ) AS source_urls
      FROM bookmarks b
      WHERE b.removed_at IS NULL
      ORDER BY b.id
    `)
    .all()

  for (const row of rows) {
    const category = categoryById.get(row.category)
    if (!category) continue
    const pathParts = JSON.parse(row.folder_path || '[]')
    addToTree(groups.get(category.folder), pathParts, {
      title: row.title,
      url: row.url,
      favorite: !!row.favorite,
      sourceCodeUrls: row.source_urls ? row.source_urls.split('\x01') : null,
    })
  }

  clearOutputDir(outputDir, CATEGORY_CONFIG.map((c) => c.file))
  const written = []
  const anchorsByCategory = {}
  for (const category of CATEGORY_CONFIG) {
    const group = groups.get(category.folder)
    const markdown = renderGroupFile(category.displayName, group, category.folder)
    fs.writeFileSync(path.join(outputDir, category.file), markdown, 'utf8')
    written.push(category.file)
    anchorsByCategory[category.file.replace(/\.md$/, '')] = Object.fromEntries(buildAnchorMap(group))
  }
  return { written, anchorsByCategory }
}
