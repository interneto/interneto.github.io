import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { parseCsv } from '../lib/csv-parser.js'
import { writeRaindropDb } from './lib/raindrop-db.js'
import { mirrorToCsv } from './export-site.js'

test('mirrorToCsv gives export rows for every bookmark except those under !nfo', () => {
  const mirror = new DatabaseSync(':memory:')
  writeRaindropDb(mirror, {
    collections: [{ _id: 1, title: 'Apps & Services' }, { _id: 2, title: 'Development', parent: { $id: 1 } },
      { _id: 7, title: '!nfo' }, { _id: 8, title: 'Notes', parent: { $id: 7 } }],
    raindrops: [
      { _id: 100, title: 'A', link: 'https://a.dev', collection: { $id: 2 }, note: 'Source-code: https://github.com/a/a', created: '2026-01-02' },
      { _id: 101, title: 'B', link: 'https://b.dev', collection: { $id: -1 }, created: '2026-01-01' },
      { _id: 102, title: 'Private', link: 'https://p.dev', collection: { $id: 7 }, created: '2026-01-03' },
      { _id: 103, title: 'Private 2', link: 'https://q.dev', collection: { $id: 8 }, created: '2026-01-04' },
    ],
  })
  const { csv, count } = mirrorToCsv(mirror)
  const rows = parseCsv(csv)
  assert.equal(count, 2)
  assert.deepEqual(rows.map((r) => [r.id, r.folder]), [['101', 'Unsorted'], ['100', 'Apps & Services / Development']])
  assert.equal(rows[1].note, 'Source-code: https://github.com/a/a')
  assert.doesNotMatch(csv, /Private|p\.dev|q\.dev/)
})
