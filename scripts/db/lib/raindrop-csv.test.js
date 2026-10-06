import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCsv } from '../../lib/csv-parser.js'
import { applyChanges, buildIncludedPaths, raindropsToCsv, rowsToCsv, toRow } from './raindrop-csv.js'

const collections = [
  { _id: 1, title: 'Apps & Services' },
  { _id: 2, title: 'Development', parent: { $id: 1 } },
  { _id: 3, title: 'Git Client', parent: { $id: 2 } },
  { _id: 9, title: 'Private' },
  { _id: 10, title: 'Deep', parent: { $id: 9 } },
]

test('API objects round-trip through the pipeline CSV parser', () => {
  const raindrops = [
    {
      _id: 100,
      title: 'lazygit, "simple" TUI',
      note: 'source-code: https://github.com/jesseduffield/lazygit\nline two',
      excerpt: 'A git UI',
      link: 'https://example.com/a?b=1,2',
      collection: { $id: 3 },
      tags: ['Software: FOSS', 'OS Compatibility: Linux'],
      created: '2026-10-01T00:00:00.000Z',
      cover: '',
      highlights: [{ text: 'nice' }],
      important: true,
    },
    { _id: 101, title: 'Loose', link: 'https://example.com/u', collection: { $id: -1 } },
    { _id: 102, title: 'Secret', link: 'https://example.com/s', collection: { $id: 10 } },
    { _id: 103, title: 'Gone', link: 'https://example.com/g', collection: { $id: 777 } },
  ]

  const { csv, rows, dropped } = raindropsToCsv(collections, raindrops, { excludeRootIds: [9] })
  assert.equal(rows, 2)
  assert.equal(dropped, 2)

  const parsed = parseCsv(csv)
  const a = parsed.find((row) => row.id === '100')
  const b = parsed.find((row) => row.id === '101')
  assert.equal(a.id, '100')
  assert.equal(a.title, 'lazygit, "simple" TUI')
  assert.equal(a.note, 'source-code: https://github.com/jesseduffield/lazygit\nline two')
  assert.equal(a.url, 'https://example.com/a?b=1,2')
  assert.equal(a.folder, 'Apps & Services / Development / Git Client')
  assert.equal(a.tags, 'Software: FOSS, OS Compatibility: Linux')
  assert.equal(a.highlights, 'Highlight:nice')
  assert.equal(a.favorite, 'true')
  assert.equal(b.folder, 'Unsorted')
  assert.equal(b.favorite, 'false')
})

test('incremental changes give the same CSV as a full rebuild', () => {
  const bm = (id, cid, extra = {}) => ({ _id: id, title: `t${id}`, link: `https://e.com/${id}`, collection: { $id: cid }, created: `2026-01-0${id}`, ...extra })
  const before = [bm(1, 3), bm(2, 3), bm(3, 2), bm(4, 2)]
  const oldPaths = buildIncludedPaths(collections, [9])
  const rows = new Map(before.map((r) => [String(r._id), toRow(r, oldPaths.get(r.collection.$id))]))

  // Since then: "Git Client" renamed, #2 moved, #3 trashed, #4 moved under the excluded root, #5 created.
  const after = collections.map((c) => (c._id === 3 ? { ...c, title: 'Git Tools' } : c))
  const newPaths = buildIncludedPaths(after, [9])
  const changed = [bm(2, 2, { title: 'moved' }), bm(4, 10), bm(5, 3)]
  const result = applyChanges({ rows, oldPaths, newPaths, changed, trashedIds: [3] })

  const full = raindropsToCsv(after, [bm(1, 3), bm(2, 2, { title: 'moved' }), bm(4, 10), bm(5, 3)], { excludeRootIds: [9] })
  assert.equal(rowsToCsv(result.values()), full.csv)
  assert.equal(parseCsv(full.csv)[0].folder, 'Apps & Services / Development / Git Tools')

  // A row left in a folder that no longer exists means we lost track: signal a full fetch.
  const stale = new Map([['1', toRow(bm(1, 3), 'Apps & Services / Gone')]])
  assert.equal(applyChanges({ rows: stale, oldPaths: newPaths, newPaths, changed: [], trashedIds: [] }), null)
})
