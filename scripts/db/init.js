import { getDb, DEFAULT_DB_PATH } from './connection.js'

const db = getDb()
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all()
db.close()

console.log(`✅ Initialized ${DEFAULT_DB_PATH}`)
console.log(`   Tables: ${tables.map((t) => t.name).join(', ')}`)
