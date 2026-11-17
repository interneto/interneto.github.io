// Sends a plan of bookmark changes, prepared against the local mirror (data/raindrop.db),
// to Raindrop, then pulls and checks that every change shows up.
//
//   pnpm db:push plan.json            show what would change; sends nothing
//   pnpm db:push plan.json --apply    send it, then `pnpm db:mirror` and verify
//
// Plan format: scripts/db/lib/push-plan.js (move, title, note, tags, favorite).
// Writes go through Raindrop's MCP `update_bookmarks` tool, which cannot delete or merge.
// Needs RAINDROP_TOKEN.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { createMcpClient, requireToken, sleep } from './lib/raindrop-api.js'
import { describe, toCalls, validatePlan, verify } from './lib/push-plan.js'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(SCRIPT_DIR, '../../data/raindrop.db')
const planPath = process.argv[2]
const apply = process.argv.includes('--apply')

if (!planPath || planPath.startsWith('--')) {
  console.error('Usage: pnpm db:push <plan.json> [--apply]')
  process.exit(1)
}
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ data/raindrop.db not found. Run `pnpm db:full` first.')
  process.exit(1)
}

let plan
try {
  plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
} catch (error) {
  console.error(`❌ Cannot read ${planPath}: ${error.message}`)
  process.exit(1)
}

let db = new DatabaseSync(DB_PATH, { readOnly: true })
const { ops, errors } = validatePlan(db, plan)
if (errors.length) {
  console.error(`❌ The plan was refused; nothing was sent:\n${errors.map((e) => `   - ${e}`).join('\n')}`)
  process.exit(1)
}
const calls = toCalls(ops)
const total = ops.reduce((sum, op) => sum + op.bookmark_ids.length, 0)
console.log(`📝 ${ops.length} operation(s), ${total} bookmark update(s), ${calls.length} call(s):`)
for (const op of ops) console.log(`   - ${describe(db, op)}`)
db.close()

if (!apply) {
  console.log('Dry run: nothing was sent. Re-run with --apply to send it.')
  process.exit(0)
}

const callTool = createMcpClient(requireToken())
let updated = 0
let failed = false
for (const [i, args] of calls.entries()) {
  const expected = args.updates[0].bookmark_ids.length
  try {
    const reply = await callTool('update_bookmarks', args)
    updated += reply.updated ?? 0
    if (reply.updated !== expected) console.log(`⚠️  call ${i + 1}: Raindrop reports ${reply.updated} updated of ${expected}`)
  } catch (error) {
    // Stop at the first failure: the rest of the plan may depend on it.
    console.error(`❌ call ${i + 1}/${calls.length} failed: ${error.message}`)
    failed = true
    break
  }
  if (i < calls.length - 1) await sleep(500) // Raindrop allows 120 requests a minute
}
console.log(`📤 Raindrop reports ${updated} bookmark update(s)${failed ? ' before the failure' : ''}. Pulling to check…`)

execFileSync(process.execPath, [path.join(SCRIPT_DIR, 'build-raindrop-db.js')], { stdio: 'inherit', env: process.env })

db = new DatabaseSync(DB_PATH, { readOnly: true })
const problems = verify(db, ops)
db.close()
if (problems.length) {
  console.log(`⚠️  ${problems.length} bookmark(s) do not show the change${failed ? ' (expected for the calls not sent)' : ''}:`)
  for (const p of problems.slice(0, 20)) console.log(`   - ${p}`)
  if (problems.length > 20) console.log(`   … and ${problems.length - 20} more`)
} else {
  console.log('✅ Every change shows up in the refreshed mirror.')
}
process.exit(failed || problems.length ? 1 : 0)
