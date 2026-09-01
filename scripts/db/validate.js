import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './connection.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..', '..')
const TAXONOMY_PATH = path.resolve(ROOT_DIR, 'public/pkgs/taxonomy.json')

export function validate(db) {
  const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'))
  const validCategoryIds = new Set(taxonomy.categories.map((c) => c.id))

  const errors = []

  const categoryCounts = db
    .prepare('SELECT category, COUNT(*) AS n FROM bookmarks WHERE removed_at IS NULL GROUP BY category')
    .all()
  for (const row of categoryCounts) {
    if (!validCategoryIds.has(row.category)) {
      errors.push(`${row.n} bookmark(s) reference unknown category "${row.category}"`)
    }
  }

  const orphanTags = db
    .prepare('SELECT COUNT(*) AS n FROM bookmark_tags bt LEFT JOIN bookmarks b ON b.id = bt.bookmark_id WHERE b.id IS NULL')
    .get().n
  if (orphanTags > 0) errors.push(`${orphanTags} orphaned bookmark_tags row(s)`)

  const emptyFields = db
    .prepare("SELECT COUNT(*) AS n FROM bookmarks WHERE removed_at IS NULL AND (title = '' OR url = '')")
    .get().n
  if (emptyFields > 0) errors.push(`${emptyFields} bookmark(s) with empty title/url`)

  return errors
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = getDb()
  const errors = validate(db)
  db.close()
  if (errors.length) {
    console.error('❌ Validation failed:')
    errors.forEach((e) => console.error(`   ${e}`))
    process.exit(1)
  }
  console.log('✅ Database valid')
}
