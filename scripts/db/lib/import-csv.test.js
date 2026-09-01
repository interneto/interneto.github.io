import assert from 'node:assert/strict'
import { getDb } from '../connection.js'
import { importCsv } from './import-csv.js'

const csvRun1 = [
  'id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite',
  '1,"Test Tool","Source-code: https://github.com/x/y","A tool","https://example.com/","Apps/Services / AI Tools & Services / AI Apps","Type: Open-Source",2026-01-01T00:00:00.000Z,,,true',
  '2,"Unmapped Row","","","https://example.org/","Apps/Services / Not A Real Category","",2026-01-01T00:00:00.000Z,,,false',
].join('\n')

const db = getDb(':memory:')

const report1 = importCsv(db, csvRun1, { runAt: '2026-01-01T00:00:00.000Z' })
assert.equal(report1.created, 1)
assert.equal(report1.updated, 0)
assert.equal(report1.unmappedCategories.get('Not A Real Category'), 1)

const row = db.prepare('SELECT * FROM bookmarks WHERE raindrop_id = :id').get({ id: '1' })
assert.equal(row.title, 'Test Tool')
assert.equal(row.favorite, 1)
assert.equal(row.category, 'ai-tools-and-services')
assert.deepEqual(JSON.parse(row.folder_path), ['AI Apps'])

const sourceUrls = db.prepare('SELECT url FROM source_code_urls WHERE bookmark_id = :id').all({ id: row.id })
assert.deepEqual(sourceUrls.map((r) => r.url), ['https://github.com/x/y'])

const tagRow = db.prepare(`
  SELECT t.name FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = :id
`).get({ id: row.id })
assert.equal(tagRow.name, 'Type: Open-Source')

// Second run: row 1 is gone from the CSV, row 2's folder is now valid.
const csvRun2 = [
  'id,title,note,excerpt,url,folder,tags,created,cover,highlights,favorite',
  '2,"Now Mapped","","","https://example.org/","Apps/Services / AI Tools & Services","",2026-01-02T00:00:00.000Z,,,false',
].join('\n')

const report2 = importCsv(db, csvRun2, { runAt: '2026-01-02T00:00:00.000Z' })
assert.equal(report2.created, 1)
assert.equal(report2.removed, 1)

const removedRow = db.prepare('SELECT removed_at FROM bookmarks WHERE raindrop_id = :id').get({ id: '1' })
assert.ok(removedRow.removed_at, 'row 1 should be soft-deleted, not gone')

const stillThere = db.prepare('SELECT COUNT(*) AS n FROM bookmarks WHERE raindrop_id = :id').get({ id: '1' })
assert.equal(stillThere.n, 1, 'row 1 must still exist (soft delete, never hard delete)')

db.close()
console.log('import-csv.test.js: PASS')
