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

function countItems(node) {
  let count = node.items.length
  for (const child of node.children.values()) {
    count += countItems(child)
  }
  return count
}

function buildItemLine(item) {
  const titleLink = `[${escapeMd(item.title)}](${item.url})`
  let line = item.favorite ? `- ⭐ **${titleLink}**` : `- ${titleLink}`

  if (item.sourceCodeUrls?.length > 0) {
    line += ` / ${item.sourceCodeUrls.map((url) => `[🔗](${url})`).join(', ')}`
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

export { renderGroupFile, renderItems, renderChildren, countItems, escapeMd, buildAnchorMap }
