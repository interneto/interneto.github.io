// scripts/lib/markdown-renderer.test.js
// Run with: node --test scripts/lib/markdown-renderer.test.js
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitTitle, sourceHostIcon, sourceCodeLink, buildItemLine } from './markdown-renderer.js'

test('splitTitle: splits on the earliest separator, keeps later ones in the description', () => {
  assert.deepEqual(splitTitle('WindowSwap - Watch windows around the world'), {
    name: 'WindowSwap',
    description: 'Watch windows around the world',
  })
  assert.deepEqual(splitTitle('Humata: AI meets your knowledge base'), {
    name: 'Humata',
    description: 'AI meets your knowledge base',
  })
  assert.deepEqual(splitTitle('ChatPDF AI | Chat with any PDF'), {
    name: 'ChatPDF AI',
    description: 'Chat with any PDF',
  })
  // Dash comes before the colon in the raw string — must split on the dash,
  // not the later colon, or "WindowSwap - Watch" would wrongly become the name.
  assert.deepEqual(splitTitle('WindowSwap - Watch: windows around the world'), {
    name: 'WindowSwap',
    description: 'Watch: windows around the world',
  })
})

test('splitTitle: a bare hyphen inside a word never splits', () => {
  assert.deepEqual(splitTitle('Self-Hosted Git Server'), { name: 'Self-Hosted Git Server', description: '' })
  assert.deepEqual(splitTitle('AI-Powered Tool'), { name: 'AI-Powered Tool', description: '' })
  assert.deepEqual(splitTitle('co-pilot for writers'), { name: 'co-pilot for writers', description: '' })
})

test('splitTitle: a bare colon with no following space never splits (ratios, times)', () => {
  assert.deepEqual(splitTitle('Aspect Ratio 16:9 Calculator'), { name: 'Aspect Ratio 16:9 Calculator', description: '' })
  assert.deepEqual(splitTitle('Meeting at 10:30'), { name: 'Meeting at 10:30', description: '' })
})

test('splitTitle: no separator at all leaves the title whole', () => {
  assert.deepEqual(splitTitle('VirtualBox'), { name: 'VirtualBox', description: '' })
})

test('splitTitle: a GitHub-style "owner/repo: description" title', () => {
  assert.deepEqual(splitTitle('oso95/scroll-world: Claude Code skill/plugin'), {
    name: 'oso95/scroll-world',
    description: 'Claude Code skill/plugin',
  })
})

test('sourceHostIcon: known hosts get their brand icon; unknown hosts get none', () => {
  assert.deepEqual(sourceHostIcon('https://github.com/x/y'), { name: 'GitHub', icon: '/img/software/apps/github.svg', invert: true })
  assert.equal(sourceHostIcon('https://gitlab.com/x/y').name, 'GitLab')
  assert.equal(sourceHostIcon('https://gitlab.example.org/x/y').name, 'GitLab') // self-hosted GitLab
  assert.equal(sourceHostIcon('https://codeberg.org/x/y').name, 'Codeberg')
  assert.equal(sourceHostIcon('https://git.sr.ht/~x/y').name, 'SourceHut')
  assert.equal(sourceHostIcon('https://example.com/x/y'), null)
  assert.equal(sourceHostIcon('not a url'), null)
})

test('sourceCodeLink: known host renders an <img>, unknown host falls back to 🔗', () => {
  assert.match(sourceCodeLink('https://github.com/x/y'), /^<a href="https:\/\/github\.com\/x\/y"><img class="source-host-icon source-host-icon-invert"/)
  assert.equal(sourceCodeLink('https://example.com/x/y'), '[🔗](https://example.com/x/y)')
})

test('buildItemLine: full line with a split title and a GitHub source link', () => {
  const line = buildItemLine({
    title: 'ClaudePluginHub - The Largest Claude Code Plugin Directory',
    url: 'https://claudepluginhub.com/',
    favorite: false,
    sourceCodeUrls: ['https://github.com/x/claudepluginhub'],
  })
  assert.equal(
    line,
    '- [ClaudePluginHub](https://claudepluginhub.com/) / <a href="https://github.com/x/claudepluginhub"><img class="source-host-icon source-host-icon-invert" src="/img/software/apps/github.svg" alt="GitHub" title="GitHub" width="14" height="14" loading="lazy"></a> — The Largest Claude Code Plugin Directory'
  )
})

console.log('markdown-renderer.test.js: PASS')
