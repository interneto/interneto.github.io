import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCsv } from '../../lib/csv-parser.js'
import { raindropsToCsv } from './raindrop-csv.js'

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

  const [a, b] = parseCsv(csv)
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
