// scripts/db/export-json.test.js
import assert from 'node:assert/strict'
import { getDb } from './connection.js'
import { importCsv } from './lib/import-csv.js'
import { exportJson } from './export-json.js'

const csv = [
  'id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite',
  '1,"Test Tool","Source-code: https://github.com/x/y","A tool","https://example.com/","Apps/Services / AI Tools & Services / AI Apps","Type: Open-Source",2026-01-01T00:00:00.000Z,https://example.com/cover.png,,true',
].join('\n')

const db = getDb(':memory:')
importCsv(db, csv, { runAt: '2026-01-01T00:00:00.000Z' })

const data = exportJson(db)
db.close()

assert.equal(data.length, 1)
assert.deepEqual(data[0], {
  id: '1',
  title: 'Test Tool',
  url: 'https://example.com/',
  description: 'A tool',
  domain: 'example.com',
  cover: 'https://example.com/cover.png',
  favorite: true,
  category: 'ai-tools-and-services',
  subcategory: ['AI Apps'],
  tags: ['Type: Open-Source'],
  sourceCodeUrls: ['https://github.com/x/y'],
  createdAt: '2026-01-01T00:00:00.000Z',
})

console.log('export-json.test.js: PASS')
