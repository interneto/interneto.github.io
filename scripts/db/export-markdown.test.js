import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getDb } from './connection.js'
import { importCsv } from './lib/import-csv.js'
import { exportMarkdown } from './export-markdown.js'

const csv = [
  'id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite',
  '1,"Test Tool","","","https://example.com/","Apps/Services / AI Tools & Services / AI Apps","",2026-01-01T00:00:00.000Z,,,true',
].join('\n')

const db = getDb(':memory:')
importCsv(db, csv, { runAt: '2026-01-01T00:00:00.000Z' })

const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-md-test-'))
const written = exportMarkdown(db, outputDir)
db.close()

assert.ok(written.includes('ai-tools-and-services.md'))
const content = fs.readFileSync(path.join(outputDir, 'ai-tools-and-services.md'), 'utf8')
assert.match(content, /## AI Apps/)
assert.match(content, /⭐ \*\*\[Test Tool\]\(https:\/\/example\.com\/\)\*\*/)

fs.rmSync(outputDir, { recursive: true, force: true })
console.log('export-markdown.test.js: PASS')
