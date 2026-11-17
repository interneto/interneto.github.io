import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCHEMA_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/db/schema.sql')

/**
 * A database with the site's bookmark schema (data/db/schema.sql). In memory by default:
 * export-site.js fills one from the Raindrop mirror on every run; nothing is kept on disk.
 */
export function getDb(dbPath = ':memory:') {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'))
  return db
}
