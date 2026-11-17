// Regenerates the site's bookmark data from the Raindrop mirror (data/raindrop.db, see
// build-raindrop-db.js): src/content/categories/*.md, public/generated/bookmarks.json,
// category-anchors.json, link-search-index.json, and links/interneto-links.csv (for
// raindrop-snapshot.mjs and convert.js).
//
//   pnpm sync        (pnpm db:pull = db:mirror, then this)
//
// The mirror is turned into the rows of Raindrop's CSV export and loaded into a throwaway
// in-memory database, so the importer, validator and exporters run exactly as they did when
// the site had its own database file.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { PATHS } from '../config/categories.js'
import { getDb } from './connection.js'
import { importCsv } from './lib/import-csv.js'
import { rowsToCsv, toRow } from './lib/raindrop-csv.js'
import { validate } from './validate.js'
import { exportMarkdown } from './export-markdown.js'
import { buildSearchIndex, exportJson } from './export-json.js'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const MIRROR = path.resolve(ROOT_DIR, 'data/raindrop.db')
const CSV_OUT = path.resolve(ROOT_DIR, PATHS.INPUT_CSV_CANDIDATES[0])
const GENERATED = path.resolve(ROOT_DIR, 'public/generated')
const OFF_LIMITS_ROOT = '!nfo' // in the local mirror, never in anything this writes

const log = (icon, message) => console.log(`${icon} ${message}`)

/** The mirror's bookmarks as Raindrop CSV export text (folder = collection path), off-limits root left out. */
export function mirrorToCsv(mirror) {
  const rows = mirror.prepare(`SELECT r.raw, c.path FROM raindrops r JOIN collections c ON c.id = r.collection_id
    WHERE c.path <> ? AND c.path NOT LIKE ? || ' / %'`).all(OFF_LIMITS_ROOT, OFF_LIMITS_ROOT)
    .map(({ raw, path: folder }) => toRow(JSON.parse(raw), folder))
  return { csv: rowsToCsv(rows), count: rows.length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!fs.existsSync(MIRROR)) {
    log('❌', 'data/raindrop.db not found. Run `pnpm db:mirror` (or `pnpm db:full`) first.')
    process.exit(1)
  }
  const mirror = new DatabaseSync(MIRROR, { readOnly: true })
  const { csv, count } = mirrorToCsv(mirror)
  mirror.close()
  fs.mkdirSync(path.dirname(CSV_OUT), { recursive: true })
  fs.writeFileSync(CSV_OUT, csv)
  log('📥', `${count} bookmarks from the mirror -> ${path.relative(ROOT_DIR, CSV_OUT)}`)

  const db = getDb(':memory:')
  const report = importCsv(db, csv)
  log('✅', `${report.created} bookmarks in the site's categories`)
  if (report.skipped) log('⚠️', `${report.skipped} row(s) skipped (missing id/title/url or invalid URL)`)
  for (const [folder, count] of report.unmappedCategories) log('⚠️', `${count}x unmapped category folder "${folder}"`)

  const errors = validate(db)
  if (errors.length) {
    log('❌', 'Validation failed; nothing regenerated:')
    errors.forEach((e) => log('  ', `  ${e}`))
    process.exit(1)
  }

  const outputDir = path.resolve(ROOT_DIR, PATHS.OUTPUT_DIR)
  const { written, anchorsByCategory } = exportMarkdown(db, outputDir)
  log('📝', `Generated ${written.length} markdown files -> ${path.relative(ROOT_DIR, outputDir)}`)
  fs.mkdirSync(GENERATED, { recursive: true })
  fs.writeFileSync(path.join(GENERATED, 'category-anchors.json'), JSON.stringify(anchorsByCategory), 'utf8')

  const data = exportJson(db)
  db.close()
  fs.writeFileSync(path.join(GENERATED, 'bookmarks.json'), JSON.stringify(data, null, 2) + '\n', 'utf8')
  const searchIndex = buildSearchIndex(data, anchorsByCategory)
  fs.writeFileSync(path.join(GENERATED, 'link-search-index.json'), JSON.stringify(searchIndex), 'utf8')
  log('📝', `Wrote ${data.length} bookmarks and a ${searchIndex.length}-entry search index -> ${path.relative(ROOT_DIR, GENERATED)}`)
}
