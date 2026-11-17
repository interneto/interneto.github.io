import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { getDb } from './connection.js'

const testPath = path.resolve('scripts/db/.test-connection.db')
fs.rmSync(testPath, { force: true })

const db = getDb(testPath)
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all()
  .map((r) => r.name)
db.close()
fs.rmSync(testPath, { force: true })

assert.deepEqual(tables, [
  'bookmark_collections',
  'bookmark_tags',
  'bookmarks',
  'collections',
  'source_code_urls',
  'tags',
])

console.log('connection.test.js: PASS')
