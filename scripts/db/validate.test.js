import assert from 'node:assert/strict'
import { getDb } from './connection.js'
import { validate } from './validate.js'

const db = getDb(':memory:')

db.prepare(`
  INSERT INTO bookmarks (raindrop_id, url, title, favorite, category, imported_at)
  VALUES ('1', 'https://example.com/', 'Valid', 0, 'development', '2026-01-01T00:00:00.000Z')
`).run()

assert.deepEqual(validate(db), [], 'a valid row should produce no errors')

db.prepare(`
  INSERT INTO bookmarks (raindrop_id, url, title, favorite, category, imported_at)
  VALUES ('2', 'https://example.com/', 'Bad Category', 0, 'not-a-real-category', '2026-01-01T00:00:00.000Z')
`).run()

const errors = validate(db)
assert.equal(errors.length, 1)
assert.match(errors[0], /not-a-real-category/)

db.close()
console.log('validate.test.js: PASS')
