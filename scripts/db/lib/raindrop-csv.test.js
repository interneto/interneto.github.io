import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCsv } from '../../lib/csv-parser.js'
import { buildIncludedPaths, rowsToCsv, toRow } from './raindrop-csv.js'

const collections = [
  { _id: 1, title: 'Apps & Services' },
  { _id: 2, title: 'Development', parent: { $id: 1 } },
  { _id: 3, title: 'Git Client', parent: { $id: 2 } },
  { _id: 9, title: 'Private' },
  { _id: 10, title: 'Deep', parent: { $id: 9 } },
]

test('buildIncludedPaths gives folder paths and leaves excluded roots out', () => {
  const paths = buildIncludedPaths(collections, [9])
  assert.equal(paths.get(3), 'Apps & Services / Development / Git Client')
  assert.equal(paths.get(-1), 'Unsorted')
  assert.equal(paths.has(10), false)
})

test('API objects round-trip through the pipeline CSV parser', () => {
  const paths = buildIncludedPaths(collections, [9])
  const a = {
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
  }
  const b = { _id: 101, title: 'Loose', link: 'https://example.com/u', collection: { $id: -1 }, created: '2026-09-01T00:00:00.000Z' }
  const parsed = parseCsv(rowsToCsv([a, b].map((r) => toRow(r, paths.get(r.collection.$id)))))

  assert.deepEqual(parsed.map((row) => row.id), ['101', '100'], 'oldest first')
  const [rowB, rowA] = parsed
  assert.equal(rowA.title, 'lazygit, "simple" TUI')
  assert.equal(rowA.note, 'source-code: https://github.com/jesseduffield/lazygit\nline two')
  assert.equal(rowA.url, 'https://example.com/a?b=1,2')
  assert.equal(rowA.folder, 'Apps & Services / Development / Git Client')
  assert.equal(rowA.tags, 'Software: FOSS, OS Compatibility: Linux')
  assert.equal(rowA.highlights, 'Highlight:nice')
  assert.equal(rowA.favorite, 'true')
  assert.equal(rowB.folder, 'Unsorted')
  assert.equal(rowB.favorite, 'false')
})
