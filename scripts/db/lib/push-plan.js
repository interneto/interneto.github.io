// A push plan is a JSON array of operations, the shape of the Raindrop MCP `update_bookmarks` tool:
//   [{ "bookmark_ids": [1, 2], "collection_id": 123 },
//    { "bookmark_ids": [3], "note": "Source-code: https://github.com/a/b", "tags": { "add": ["x"], "remove": ["y"] } }]
// Validated against the local mirror before anything is sent. Nothing here can delete.

const FIELDS = ['bookmark_ids', 'collection_id', 'title', 'note', 'tags', 'favorite']
export const MAX_IDS_PER_CALL = 150 // MCP update_bookmarks limit
const OFF_LIMITS_ROOT = '!nfo' // the other off-limits root, ".", is not in the mirror at all

const isId = (v) => Number.isSafeInteger(v) && v !== 0
const strings = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string' && s.trim())

/** Returns { ops, errors }. ops are the plan's operations, checked against `db`; errors are human-readable. */
export function validatePlan(db, plan) {
  const errors = []
  if (!Array.isArray(plan) || !plan.length) return { ops: [], errors: ['the plan must be a non-empty JSON array of operations'] }
  const bookmark = db.prepare(`SELECT r.id, c.path FROM raindrops r JOIN collections c ON c.id = r.collection_id WHERE r.id = ?`)
  const collection = db.prepare('SELECT id, path FROM collections WHERE id = ?')
  const offLimits = (p) => p === OFF_LIMITS_ROOT || p.startsWith(`${OFF_LIMITS_ROOT} / `)

  plan.forEach((op, i) => {
    const at = `operation ${i + 1}`
    if (!op || typeof op !== 'object' || Array.isArray(op)) return errors.push(`${at}: not an object`)
    const unknown = Object.keys(op).filter((k) => !FIELDS.includes(k))
    if (unknown.length) errors.push(`${at}: unsupported field(s) ${unknown.join(', ')} (allowed: ${FIELDS.join(', ')})`)
    if (!Array.isArray(op.bookmark_ids) || !op.bookmark_ids.length || !op.bookmark_ids.every(isId)) {
      return errors.push(`${at}: bookmark_ids must be a non-empty array of bookmark ids`)
    }
    if (new Set(op.bookmark_ids).size !== op.bookmark_ids.length) errors.push(`${at}: repeated bookmark ids`)
    if (Object.keys(op).length < 2) errors.push(`${at}: nothing to change`)
    for (const id of op.bookmark_ids) {
      const b = bookmark.get(id)
      if (!b) errors.push(`${at}: bookmark ${id} is not in the local mirror (run pnpm db:mirror?)`)
      else if (offLimits(b.path)) errors.push(`${at}: bookmark ${id} is under the off-limits root ${OFF_LIMITS_ROOT}`)
    }
    if ('collection_id' in op) {
      const c = isId(op.collection_id) && collection.get(op.collection_id)
      if (!c) errors.push(`${at}: collection_id ${op.collection_id} is not a collection in the local mirror`)
      else if (offLimits(c.path)) errors.push(`${at}: collection ${op.collection_id} is under the off-limits root ${OFF_LIMITS_ROOT}`)
    }
    if ('title' in op && (typeof op.title !== 'string' || !op.title.trim() || op.title.length > 1000)) errors.push(`${at}: title must be 1-1000 characters`)
    if ('note' in op && (typeof op.note !== 'string' || op.note.length > 10000)) errors.push(`${at}: note must be a string of at most 10000 characters`)
    if ('favorite' in op && typeof op.favorite !== 'boolean') errors.push(`${at}: favorite must be true or false`)
    if ('tags' in op) {
      const t = op.tags
      const keys = t && typeof t === 'object' && !Array.isArray(t) ? Object.keys(t) : null
      if (!keys?.length || keys.some((k) => !['add', 'remove'].includes(k)) || keys.some((k) => !strings(t[k]))) {
        errors.push(`${at}: tags must be { "add": [...], "remove": [...] } with non-empty tag names`)
      }
    }
  })
  return { ops: errors.length ? [] : plan, errors }
}

/** One MCP call per slice of at most 150 ids, each carrying a single operation's changes. */
export function toCalls(ops) {
  return ops.flatMap((op) => {
    const { bookmark_ids: ids, ...changes } = op
    return Array.from({ length: Math.ceil(ids.length / MAX_IDS_PER_CALL) }, (_, i) => ({
      updates: [{ bookmark_ids: ids.slice(i * MAX_IDS_PER_CALL, (i + 1) * MAX_IDS_PER_CALL), ...changes }],
    }))
  })
}

/** Plain-language lines describing what an operation will do. */
export function describe(db, op) {
  const parts = []
  if ('collection_id' in op) parts.push(`move to "${db.prepare('SELECT path FROM collections WHERE id = ?').get(op.collection_id).path}"`)
  if ('title' in op) parts.push(`title -> "${op.title}"`)
  if ('note' in op) parts.push(op.note ? `note -> "${op.note.slice(0, 80)}${op.note.length > 80 ? '…' : ''}"` : 'clear note')
  if (op.tags?.add?.length) parts.push(`add tags ${op.tags.add.join(', ')}`)
  if (op.tags?.remove?.length) parts.push(`remove tags ${op.tags.remove.join(', ')}`)
  if ('favorite' in op) parts.push(op.favorite ? 'mark favorite' : 'unmark favorite')
  const titles = op.bookmark_ids.slice(0, 3).map((id) => db.prepare('SELECT title FROM raindrops WHERE id = ?').get(id)?.title ?? id)
  const more = op.bookmark_ids.length > 3 ? `, +${op.bookmark_ids.length - 3} more` : ''
  return `${op.bookmark_ids.length} bookmark(s): ${parts.join('; ')}  [${titles.map((t) => String(t).slice(0, 40)).join(' | ')}${more}]`
}

/** After pulling: bookmarks whose local row does not show the change that was sent. */
export function verify(db, ops) {
  const row = db.prepare('SELECT collection_id, title, note, important FROM raindrops WHERE id = ?')
  const hasTag = db.prepare('SELECT 1 FROM raindrop_tags WHERE raindrop_id = ? AND tag = ?')
  const problems = []
  for (const op of ops) {
    for (const id of op.bookmark_ids) {
      const r = row.get(id)
      const bad = []
      if (!r) bad.push('not in the mirror any more')
      else {
        if ('collection_id' in op && r.collection_id !== op.collection_id) bad.push(`collection is ${r.collection_id}`)
        if ('title' in op && r.title !== op.title) bad.push('title differs')
        if ('note' in op && (r.note ?? '') !== op.note) bad.push('note differs')
        if ('favorite' in op && Boolean(r.important) !== op.favorite) bad.push('favorite differs')
        for (const t of op.tags?.add ?? []) if (!hasTag.get(id, t)) bad.push(`tag ${t} missing`)
        for (const t of op.tags?.remove ?? []) if (hasTag.get(id, t)) bad.push(`tag ${t} still there`)
      }
      if (bad.length) problems.push(`${id}: ${bad.join(', ')}`)
    }
  }
  return problems
}
