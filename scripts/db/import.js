import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './connection.js'
import { importCsv } from './lib/import-csv.js'
import { PATHS } from '../config/categories.js'
import { resolveInputCsvPath } from '../lib/utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '../..')

function log(icon, message) {
  console.log(`${icon} ${message}`)
}

const csvRelative = resolveInputCsvPath(PATHS.INPUT_CSV_CANDIDATES, ROOT_DIR)
if (!csvRelative) {
  log('❌', 'CSV not found. Searched:')
  PATHS.INPUT_CSV_CANDIDATES.forEach((p) => log('  ', `  ${p}`))
  process.exit(1)
}

const csvPath = path.resolve(ROOT_DIR, csvRelative)
log('📥', `CSV: ${path.relative(ROOT_DIR, csvPath)}`)

const csvText = fs.readFileSync(csvPath, 'utf8')
const db = getDb()
const report = importCsv(db, csvText)
db.close()

log('✅', `${report.created} new, ${report.updated} updated, ${report.removed} removed (soft)`)
if (report.skipped) log('⚠️', `${report.skipped} row(s) skipped (missing id/title/url or invalid URL)`)
if (report.unmappedCategories.size) {
  log('⚠️', `${report.unmappedCategories.size} unmapped category folder(s):`)
  for (const [folder, count] of report.unmappedCategories) {
    log('  ', `  ${count}x "${folder}"`)
  }
}
