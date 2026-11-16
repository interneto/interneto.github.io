import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { writeRaindropDb } from './raindrop-db.js'

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
