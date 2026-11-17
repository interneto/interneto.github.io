import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { writeRaindropDb } from './raindrop-db.js'
import { MAX_IDS_PER_CALL, toCalls, validatePlan, verify } from './push-plan.js'

function mirror() {
  const db = new DatabaseSync(':memory:')
  writeRaindropDb(db, {
    collections: [{ _id: 1, title: 'Apps' }, { _id: 2, title: 'Dev', parent: { $id: 1 } }, { _id: 7, title: '!nfo' }, { _id: 8, title: 'Inner', parent: { $id: 7 } }],
    raindrops: [
      { _id: 100, link: 'https://a.dev', title: 'A', collection: { $id: 1 }, tags: ['old'] },
      { _id: 101, link: 'https://b.dev', title: 'B', collection: { $id: -1 } },
      { _id: 102, link: 'https://c.dev', title: 'C', collection: { $id: 8 } },
    ],
  })
  return db
}

test('validatePlan accepts supported changes to known bookmarks', () => {
  const plan = [{ bookmark_ids: [100, 101], collection_id: 2 }, { bookmark_ids: [100], note: 'Source-code: https://github.com/a/b', tags: { add: ['x'], remove: ['old'] }, favorite: true }]
  assert.deepEqual(validatePlan(mirror(), plan), { ops: plan, errors: [] })
})

test('validatePlan refuses unknown fields, unknown ids, the off-limits root and malformed values', () => {
  const db = mirror()
  const errors = (plan) => validatePlan(db, plan).errors.join('\n')
  assert.match(errors([]), /non-empty JSON array/)
  assert.match(errors([{ bookmark_ids: [100], link: 'https://x' }]), /unsupported field\(s\) link/)
  assert.match(errors([{ bookmark_ids: [100], delete: true }]), /unsupported field\(s\) delete/)
  assert.match(errors([{ bookmark_ids: [999], title: 'X' }]), /999 is not in the local mirror/)
  assert.match(errors([{ bookmark_ids: [102], title: 'X' }]), /off-limits root/)
  assert.match(errors([{ bookmark_ids: [100], collection_id: 8 }]), /off-limits root/)
  assert.match(errors([{ bookmark_ids: [100], collection_id: 55 }]), /not a collection/)
  assert.match(errors([{ bookmark_ids: [100] }]), /nothing to change/)
  assert.match(errors([{ bookmark_ids: [100, 100], title: 'X' }]), /repeated/)
  assert.match(errors([{ bookmark_ids: [100], tags: ['x'] }]), /tags must be/)
  assert.match(errors([{ bookmark_ids: [100], favorite: 'yes' }]), /favorite must be/)
  assert.deepEqual(validatePlan(db, [{ bookmark_ids: [100], title: 'X' }, { bookmark_ids: [999], title: 'Y' }]).ops, [], 'one bad operation blocks the whole plan')
})

test('toCalls splits large operations into calls of at most 150 ids', () => {
  const ids = Array.from({ length: 320 }, (_, i) => i + 1)
  const calls = toCalls([{ bookmark_ids: ids, collection_id: 2 }, { bookmark_ids: [5], title: 'T' }])
  assert.deepEqual(calls.map((c) => c.updates[0].bookmark_ids.length), [MAX_IDS_PER_CALL, MAX_IDS_PER_CALL, 20, 1])
  assert.equal(calls[2].updates[0].collection_id, 2)
})

test('verify reports bookmarks that do not show the change after a pull', () => {
  const db = mirror()
  assert.deepEqual(verify(db, [{ bookmark_ids: [100], collection_id: 1, tags: { add: ['old'] } }]), [])
  assert.deepEqual(verify(db, [{ bookmark_ids: [100, 999], collection_id: 2 }]), ['100: collection is 1', '999: not in the mirror any more'])
})
