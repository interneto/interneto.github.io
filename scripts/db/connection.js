import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '../..')
const SCHEMA_PATH = path.resolve(__dirname, '../../data/db/schema.sql')

export const DEFAULT_DB_PATH = path.resolve(ROOT_DIR, 'data/bookmarks.db')

export function getDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON')
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
  db.exec(schema)
  return db
}
