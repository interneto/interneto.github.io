/**
 * Markdown Renderer utilities
 */

import GithubSlugger from 'github-slugger'
import { CATEGORY_DESCRIPTIONS } from '../config/categories.js'

function escapeMd(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

// Splits a raw bookmark title into the site/project name (what the hyperlink
// text becomes) and a trailing tagline (rendered as plain text after the
// link). Many titles are "Name - Description", "Name: Description" or
// "Name | Description" verbatim from the source page's own <title>. Finds
// whichever of those three separators occurs earliest — ':' needs a following
// space (so "16:9"/"10:30" don't split), '-' (or –/—) needs spaces on both
// sides (so a hyphen inside a word, "Self-Hosted"/"AI-Powered", never
// splits), '|' needs spaces on both sides too. No match -> the title is used
// whole, same as before this existed.
const TITLE_SPLIT_RE = /^(.+?)(?:\s\|\s|:\s+|\s[-–—]\s)(.+)$/
function splitTitle(title) {
  const t = String(title || '').trim()
  const m = t.match(TITLE_SPLIT_RE)
  return m ? { name: m[1].trim(), description: m[2].trim() } : { name: t, description: '' }
}

// Known source-code hosts get their own brand icon instead of the generic 🔗;
// github.com's icon is already downloaded for the site footer, reused here.
// Exact hostname match first, then a looser pattern for the common
// self-hosted case (gitlab.example.org, git.example.org running Gitea, etc).
const SOURCE_HOST_BY_HOSTNAME = {
  'github.com': { name: 'GitHub', icon: '/img/software/apps/github.svg', invert: true },
  'gitlab.com': { name: 'GitLab', icon: '/img/source-hosts/gitlab.svg' },
  'codeberg.org': { name: 'Codeberg', icon: '/img/source-hosts/codeberg.svg' },
  'sourceforge.net': { name: 'SourceForge', icon: '/img/source-hosts/sourceforge.svg' },
  'huggingface.co': { name: 'Hugging Face', icon: '/img/source-hosts/huggingface.svg' },
  'bitbucket.org': { name: 'Bitbucket', icon: '/img/source-hosts/bitbucket.svg' },
}
const SOURCE_HOST_BY_PATTERN = [
  [/gitlab/, { name: 'GitLab', icon: '/img/source-hosts/gitlab.svg' }],
  [/gitea/, { name: 'Gitea', icon: '/img/source-hosts/gitea.svg' }],
  [/(^|\.)sr\.ht$/, { name: 'SourceHut', icon: '/img/source-hosts/sourcehut.svg', invert: true }],
]

function sourceHostIcon(url) {
  let hostname
  try {
    hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  if (SOURCE_HOST_BY_HOSTNAME[hostname]) return SOURCE_HOST_BY_HOSTNAME[hostname]
  for (const [pattern, info] of SOURCE_HOST_BY_PATTERN) {
    if (pattern.test(hostname)) return info
  }
  return null
}

// Raw <a><img></a> (not markdown [text](url)) — simpler than smuggling an
// <img> through markdown's own link-text parsing, and Astro's markdown
// passes raw HTML through untouched.
function sourceCodeLink(url) {
  const host = sourceHostIcon(url)
  if (!host) return `[🔗](${url})`
  const cls = host.invert ? 'source-host-icon source-host-icon-invert' : 'source-host-icon'
  return `<a href="${url}"><img class="${cls}" src="${host.icon}" alt="${host.name}" title="${host.name}" width="14" height="14" loading="lazy"></a>`
}

function countItems(node) {
  let count = node.items.length
  for (const child of node.children.values()) {
    count += countItems(child)
  }
  return count
}

function buildItemLine(item) {
  const { name, description } = splitTitle(item.title)
  const titleLink = `[${escapeMd(name)}](${item.url})`
  let line = item.favorite ? `- ⭐ **${titleLink}**` : `- ${titleLink}`

  if (item.sourceCodeUrls?.length > 0) {
    line += ` / ${item.sourceCodeUrls.map(sourceCodeLink).join(', ')}`
  }

  if (description) {
    line += ` — ${escapeMd(description)}`
  }

  return line
}

function renderItems(lines, items) {
  const sorted = [...items].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
    return a.title.localeCompare(b.title, undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  })

  sorted.forEach((item) => lines.push(buildItemLine(item).trim()))
}

function renderChildren(lines, children, level) {
  for (const [name, node] of children) {
    lines.push('')
    // Markdown supports at most 6 heading levels; deeper nesting falls back to bold.
    lines.push(level <= 6 ? `${'#'.repeat(level)} ${escapeMd(name)}` : `**${escapeMd(name)}**`)
    renderItems(lines, node.items)
    renderChildren(lines, node.children, level + 1)
  }
}

// Maps each subcategory's full path (joined with \x01, matching a bookmark's own
// `subcategory` array) to the #anchor Astro's markdown pipeline will give that
// heading — same traversal order renderChildren uses, through one GithubSlugger
// instance per category so dedup (repeated heading names) matches a real render.
function buildAnchorMap(group) {
  const slugger = new GithubSlugger()
  const anchors = new Map()

  function walk(children, trail) {
    for (const [name, node] of [...children].sort(([a], [b]) => a.localeCompare(b))) {
      const path = [...trail, name]
      anchors.set(path.join('\x01'), slugger.slug(name))
      walk(node.children, path)
    }
  }

  walk(group.children, [])
  return anchors
}

function renderGroupFile(groupName, group, categoryFolder) {
  const detailedDescription = CATEGORY_DESCRIPTIONS[categoryFolder] || ''
  const lines = [
    '---',
    `title: ${groupName}`,
    `description: ${detailedDescription}`,
    '---',
    '',
    `# ${escapeMd(groupName)}`,
    '',
    `**Total Bookmarks:** ${countItems(group)}`,
    ''
  ]

  renderItems(lines, group.items)
  renderChildren(lines, new Map([...group.children].sort(([a], [b]) => a.localeCompare(b))), 2)

  return lines.join('\n').trim() + '\n'
}

export { renderGroupFile, renderItems, renderChildren, countItems, escapeMd, buildAnchorMap, splitTitle, sourceHostIcon, sourceCodeLink, buildItemLine }
