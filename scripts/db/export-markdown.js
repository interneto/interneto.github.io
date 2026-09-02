// scripts/db/export-markdown.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './connection.js'
import { CATEGORY_CONFIG, PATHS } from '../config/categories.js'
import { renderGroupFile } from '../lib/markdown-renderer.js'
import { createNode, addToTree, clearOutputDir } from '../lib/utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..', '..')

function log(icon, message) {
  console.log(`${icon} ${message}`)
}

export function exportMarkdown(db, outputDir) {
  const groups = new Map(CATEGORY_CONFIG.map((c) => [c.folder, createNode()]))
  const categoryById = new Map(CATEGORY_CONFIG.map((c) => [c.file.replace(/\.md$/, ''), c]))

  // source_urls: a correlated subquery ordered by rowid (insertion order), not a
  // GROUP_CONCAT+JOIN — SQLite satisfies that join via the (bookmark_id, url)
  // primary key index and returns urls alphabetically, which silently reorders
  // them relative to import order and breaks parity with convert.js's parse-order.
  const rows = db
    .prepare(`
      SELECT b.*, (
        SELECT GROUP_CONCAT(url, char(1)) FROM (
          SELECT url FROM source_code_urls WHERE bookmark_id = b.id ORDER BY rowid
        )
      ) AS source_urls
      FROM bookmarks b
      WHERE b.removed_at IS NULL
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
  for (const category of CATEGORY_CONFIG) {
    const markdown = renderGroupFile(category.displayName, groups.get(category.folder), category.folder)
    fs.writeFileSync(path.join(outputDir, category.file), markdown, 'utf8')
    written.push(category.file)
  }
  return written
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = getDb()
  const outputDir = path.resolve(ROOT_DIR, PATHS.OUTPUT_DIR)
  const written = exportMarkdown(db, outputDir)
  db.close()
  log('📝', `Generated ${written.length} markdown files`)
  log('  ', `Output: ${path.relative(ROOT_DIR, outputDir)}`)
}
