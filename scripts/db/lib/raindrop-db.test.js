import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { applyIncremental, writeRaindropDb } from './raindrop-db.js'

test('writeRaindropDb stores the tree, bookmarks and tags, and leaves excluded roots out', () => {
  const db = new DatabaseSync(':memory:')
  const apps = { _id: 1, title: 'Apps', description: 'Software', slug: 'apps', access: { level: 4 } }
  const report = writeRaindropDb(db, {
    collections: [
      apps,
      { _id: 2, title: 'Dev', description: '', parent: { $id: 1 } },
      { ...apps }, // roots come back from /collections/childrens too
      { _id: 9, title: 'Secret' },
      { _id: 10, title: 'Inner', parent: { $id: 9 } },
    ],
    raindrops: [
      { _id: 100, link: 'https://docs.a.dev', domain: 'docs.a.dev', title: 'Rust tools', collection: { $id: 2 }, tags: ['rust', 'cli'], highlights: [{ _id: 'h1', text: 'x' }] },
      { _id: 101, link: 'https://docs.a.dev', title: 'Dup', collection: { $id: -1 } },
      { _id: 102, link: 'https://s.dev', title: 'Hidden', collection: { $id: 10 }, tags: ['private'] },
    ],
    meta: { fetched_at: '2026-11-16' },
    excludeRootIds: [9],
  })

  assert.deepEqual(report, { collections: 3, raindrops: 2, skipped: 1, highlights: 1 })
  assert.equal(db.prepare('SELECT path FROM collections WHERE id = 2').get().path, 'Apps / Dev')
  assert.deepEqual({ ...db.prepare('SELECT description, slug, access_level FROM collections WHERE id = 1').get() }, { description: 'Software', slug: 'apps', access_level: 4 })
  assert.equal(db.prepare('SELECT description FROM collections WHERE id = 2').get().description, null) // '' is stored as NULL
  assert.equal(db.prepare('SELECT count(*) n FROM collections WHERE id IN (9, 10)').get().n, 0)
  assert.equal(db.prepare("SELECT count(*) n FROM raindrop_tags WHERE tag = 'private'").get().n, 0)
  assert.equal(db.prepare('SELECT tags FROM v_bookmarks WHERE id = 100').get().tags, 'cli, rust')
  assert.equal(db.prepare('SELECT site FROM raindrops WHERE id = 100').get().site, 'a.dev')
  assert.equal(db.prepare("SELECT count FROM v_sites WHERE site = 'a.dev'").get().count, 1)
  assert.equal(db.prepare('SELECT count FROM v_duplicates').get().count, 2)
  assert.equal(db.prepare('SELECT total FROM v_collection_stats WHERE id = 1').get().total, 1)
  assert.equal(db.prepare("SELECT rowid FROM raindrops_fts WHERE raindrops_fts MATCH 'rust'").get().rowid, 100)
})

test('applyIncremental applies changes, moves, Trash and collection changes in place', () => {
  const db = new DatabaseSync(':memory:')
  const base = [{ _id: 1, title: 'Apps' }, { _id: 2, title: 'Dev', parent: { $id: 1 } }, { _id: 3, title: 'Old', parent: { $id: 1 } }, { _id: 9, title: 'Secret' }]
  writeRaindropDb(db, { collections: base, excludeRootIds: [9], raindrops: [
    { _id: 100, link: 'https://a.dev', title: 'A', collection: { $id: 2 }, tags: ['x'] },
    { _id: 101, link: 'https://b.dev', title: 'B', collection: { $id: 3 } },
    { _id: 102, link: 'https://c.dev', title: 'C', collection: { $id: -1 } },
  ] })

  const now = [{ _id: 1, title: 'Apps' }, { _id: 2, title: 'Development', parent: { $id: 1 } }, { _id: 4, title: 'New', parent: { $id: 2 } },
    { _id: 9, title: 'Secret', count: 1 }] // 3 was deleted in Raindrop
  const { ok, report } = applyIncremental(db, {
    collections: now, excludeRootIds: [9], accountTotal: 3 + 1,
    changed: [
      { _id: 100, link: 'https://a.dev', title: 'A2', collection: { $id: 4 }, tags: ['y'] }, // renamed, moved, retagged
      { _id: 101, link: 'https://b.dev', title: 'B', collection: { $id: 9 } }, // moved into the excluded root
      { _id: 103, link: 'https://d.dev', title: 'D', collection: { $id: 2 } }, // new
      { _id: 104, link: 'https://e.dev', title: 'E', collection: { $id: -1 } }, // new
    ],
    trashedIds: [102],
    meta: { fetched_at: 'later' },
  })
  assert.equal(ok, true)
  assert.deepEqual(report, { changed: 3, removed: 2, collections: 4, removedCollections: 1 })
  assert.deepEqual({ ...db.prepare('SELECT title, collection_id FROM raindrops WHERE id = 100').get() }, { title: 'A2', collection_id: 4 })
  assert.deepEqual(db.prepare('SELECT tag FROM raindrop_tags WHERE raindrop_id = 100').all().map((r) => r.tag), ['y'])
  assert.equal(db.prepare('SELECT path FROM collections WHERE id = 4').get().path, 'Apps / Development / New')
  assert.deepEqual(db.prepare('SELECT id FROM raindrops ORDER BY id').all().map((r) => r.id), [100, 103, 104])
  assert.equal(db.prepare('SELECT count(*) n FROM collections WHERE id = 3').get().n, 0)
  assert.equal(db.prepare("SELECT value FROM meta WHERE key = 'fetched_at'").get().value, 'later')
  assert.equal(db.prepare("SELECT rowid FROM raindrops_fts WHERE raindrops_fts MATCH 'A2'").get().rowid, 100)
})

test('applyIncremental rolls everything back when the totals do not add up', () => {
  const db = new DatabaseSync(':memory:')
  writeRaindropDb(db, { collections: [{ _id: 1, title: 'Apps' }], raindrops: [{ _id: 100, link: 'https://a.dev', title: 'A', collection: { $id: 1 } }] })
  const result = applyIncremental(db, {
    collections: [{ _id: 1, title: 'Renamed' }], accountTotal: 5, trashedIds: [],
    changed: [{ _id: 100, link: 'https://a.dev', title: 'Changed', collection: { $id: 1 } }],
  })
  assert.equal(result.ok, false)
  assert.match(result.reason, /count mismatch/)
  assert.equal(db.prepare('SELECT title FROM raindrops WHERE id = 100').get().title, 'A')
  assert.equal(db.prepare('SELECT title FROM collections WHERE id = 1').get().title, 'Apps')
})
