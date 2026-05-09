/**
 * Markdown Renderer utilities
 */

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
    lines.push(`${'#'.repeat(level)} ${escapeMd(name)}`)
    renderItems(lines, node.items)
    renderChildren(lines, node.children, level + 1)
  }
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

export { renderGroupFile, renderItems, renderChildren, countItems, escapeMd }
