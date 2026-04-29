import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

const OUTPUT_DIR = path.resolve(ROOT_DIR, 'docs')
const INPUT_CSV_CANDIDATES = [
  path.resolve(ROOT_DIR, 'interneto-links.csv'),
  path.resolve(ROOT_DIR, 'links', 'interneto-links.csv')
]

function resolveInputCsvPath() {
  return INPUT_CSV_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || null
}

const CATEGORY_CONFIG = [
  {
    folder: 'by-Company',
    displayName: 'By Company',
    file: 'by-company.md',
    description: 'Useful services organized by company',
    icon: '🏢'
  },
  {
    folder: 'OS',
    displayName: 'OS',
    file: 'os.md',
    description: 'Operating systems and tools',
    icon: '💻'
  },
  {
    folder: 'AI Tools & Services',
    displayName: 'AI Tools & Services',
    file: 'ai-tools-and-services.md',
    description: 'Artificial Intelligence tools and services',
    icon: '🤖'
  },
  {
    folder: 'Dev',
    displayName: 'Dev',
    file: 'dev.md',
    description: 'Development tools and resources',
    icon: '⚙️'
  },
  {
    folder: 'Education',
    displayName: 'Education',
    file: 'education.md',
    description: 'Educational resources and platforms',
    icon: '📚'
  },
  {
    folder: 'File Management',
    displayName: 'File Management',
    file: 'file-management.md',
    description: 'File storage and management solutions',
    icon: '📁'
  },
  {
    folder: 'Financial assets',
    displayName: 'Financial Assets',
    file: 'financial-assets.md',
    description: 'Financial and investment tools',
    icon: '💰'
  },
  {
    folder: 'Gaming',
    displayName: 'Gaming',
    file: 'gaming.md',
    description: 'Gaming platforms and services',
    icon: '🎮'
  },
  {
    folder: 'Health & Fitness',
    displayName: 'Health & Fitness',
    file: 'health-and-fitness.md',
    description: 'Health and fitness applications',
    icon: '💪'
  },
  {
    folder: 'Home & Family',
    displayName: 'Home & Family',
    file: 'home-and-family.md',
    description: 'Home automation and family services',
    icon: '🏠'
  },
  {
    folder: 'InterComm',
    displayName: 'Internet Communication',
    file: 'intercomm.md',
    description: 'Communication and collaboration tools',
    icon: '💬'
  },
  {
    folder: 'Multimedia',
    displayName: 'Multimedia',
    file: 'multimedia.md',
    description: 'Multimedia and content creation tools',
    icon: '🎬'
  },
  {
    folder: 'News Media',
    displayName: 'News Media',
    file: 'news-media.md',
    description: 'News and media platforms',
    icon: '📰'
  },
  {
    folder: 'Office & Productivity',
    displayName: 'Office & Productivity',
    file: 'office-and-productivity.md',
    description: 'Office and productivity applications',
    icon: '📊'
  },
  {
    folder: 'Online Services',
    displayName: 'Online Services',
    file: 'online-services.md',
    description: 'Online services and utilities',
    icon: '🌐'
  },
  {
    folder: 'Security & Privacy',
    displayName: 'Security & Privacy',
    file: 'security-and-privacy.md',
    description: 'Security and privacy tools',
    icon: '🔒'
  },
  {
    folder: 'Sys Admin',
    displayName: 'Sys Admin',
    file: 'sys-admin.md',
    description: 'System administration tools',
    icon: '🛠️'
  },
  {
    folder: 'Time',
    displayName: 'Time',
    file: 'time.md',
    description: 'Time management and scheduling tools',
    icon: '⏰'
  },
  {
    folder: 'Travel & Location',
    displayName: 'Travel & Location',
    file: 'travel-and-location.md',
    description: 'Travel and location services',
    icon: '✈️'
  },
  {
    folder: 'Utility',
    displayName: 'Utility',
    file: 'utility.md',
    description: 'Utility tools and applications',
    icon: '🔧'
  }
]

const CATEGORY_BY_FOLDER = new Map(
  CATEGORY_CONFIG.map((entry) => [entry.folder, entry])
)

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      field += ch; continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (ch !== '\r') field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? ''])));
}

function cleanText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeMd(text) {
  return cleanText(text).replace(/\[/g, '\\[').replace(/\]/g, '\\]')
}

function normalizeFolder(folder) {
  // Solo limpiar espacios y usar el texto tal cual para todas las partes
  return folder.split('/').map((s) => cleanText(s)).filter(Boolean)
}

function extractSourceCodeUrls(note) {
  if (!note) return null

  const sourceCodeLabelMatch = String(note).match(/source-code\s*:/i)
  if (!sourceCodeLabelMatch) return null

  // Capture only the contiguous URL list immediately after "Source-code:".
  // This avoids consuming unrelated URLs later in the note text.
  let sourceCodeSegment = String(note).slice(
    sourceCodeLabelMatch.index + sourceCodeLabelMatch[0].length
  )
  const urls = []

  while (true) {
    const urlMatch = sourceCodeSegment.match(/^\s*,?\s*(https?:\/\/[^\s,]+)/i)
    if (!urlMatch) break

    const url = cleanText(urlMatch[1])
    try {
      // Validate URL shape and normalize output.
      urls.push(new URL(url).toString())
    } catch {
      break
    }

    sourceCodeSegment = sourceCodeSegment.slice(urlMatch[0].length)
  }

  if (!urls.length) return null
  return Array.from(new Set(urls))
}

function safeUnlink(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function clearOutputFiles() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  for (const category of CATEGORY_CONFIG) {
    safeUnlink(path.join(OUTPUT_DIR, category.file))
  }
}

function createNode() {
  return { items: [], children: new Map() }
}

function countItems(node) {
  let count = node.items.length
  for (const child of node.children.values()) {
    count += countItems(child)
  }
  return count
}

function addToTree(group, pathParts, item) {
  if (!pathParts.length) {
    group.items.push(item)
    return
  }

  for (const part of pathParts.slice(0, -1)) {
    if (!group.children.has(part)) {
      group.children.set(part, createNode())
    }
    group = group.children.get(part)
  }

  const lastPart = pathParts[pathParts.length - 1]
  if (!group.children.has(lastPart)) {
    group.children.set(lastPart, createNode())
  }
  group.children.get(lastPart).items.push(item)
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

function isValidRowFolder(folderParts) {
  return folderParts.length >= 2 && folderParts[0] === 'Apps'
}

function buildItemFromRow(row) {
  const title = cleanText(row.title)
  const rawUrl = cleanText(row.url)
  if (!title || !rawUrl) return null

  let url
  try {
    url = new URL(rawUrl).toString()
  } catch {
    return null
  }

  return {
    title,
    url,
    favorite: String(row.favorite).toLowerCase() === 'true',
    sourceCodeUrls: extractSourceCodeUrls(row.note)
  }
}

function processRowsIntoGroups(rows, groups) {
  let count = 0
  for (const row of rows) {
    const folderParts = normalizeFolder(row.folder || '')
    if (!isValidRowFolder(folderParts)) continue
    const category = folderParts[1]
    if (!CATEGORY_BY_FOLDER.has(category)) continue
    const item = buildItemFromRow(row)
    if (!item) continue
    addToTree(groups.get(category), folderParts.slice(2), item)
    count++
  }
  return count
}

function writeGroupFiles(groups) {
  let count = 0
  const writtenFiles = []

  for (const category of CATEGORY_CONFIG) {
    const filePath = path.join(OUTPUT_DIR, category.file)
    const markdown = renderGroupFile(
      category.displayName,
      groups.get(category.folder),
      category.description
    )
    fs.writeFileSync(filePath, markdown, 'utf8')
    writtenFiles.push(path.relative(ROOT_DIR, filePath))
    count += 1
  }

  return { count, writtenFiles }
}

function renderGroupFile(groupName, group, description) {
  const lines = [
    `# ${escapeMd(groupName)}`,
    '',
    `**Total Bookmarks:** ${countItems(group)}`,
    ''
  ]

  renderItems(lines, group.items)
  renderChildren(lines, new Map([...group.children].sort(([a], [b]) => a.localeCompare(b))), 2)

  return lines.join('\n').trim() + '\n'
}

function runLinting(targetFiles = []) {
  console.log('\n📋 Running markdown lint...')
  const lintArgs = [path.resolve(__dirname, 'lint-markdown.js')]
  if (targetFiles.length > 0) {
    lintArgs.push('--files', ...targetFiles)
  }

  const result = spawnSync(
    'node',
    lintArgs,
    {
      stdio: 'inherit',
      cwd: ROOT_DIR
    }
  )

  if (result.error) {
    console.error('❌ Lint failed:', result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.warn('⚠️ Lint warnings found')
  }
}

function run() {
  const inputCsvPath = resolveInputCsvPath()

  if (!inputCsvPath) {
    throw new Error(
      `CSV file not found in any known location: ${INPUT_CSV_CANDIDATES.join(', ')}`
    )
  }

  const csv = fs.readFileSync(inputCsvPath, 'utf8')
  const rows = parseCsv(csv)
  const groups = new Map(
    CATEGORY_CONFIG.map((entry) => [entry.folder, createNode()])
  )

  const included = processRowsIntoGroups(rows, groups)
  clearOutputFiles()
  const { count: filesWritten, writtenFiles } = writeGroupFiles(groups)

  console.log(
    `Converted ${included} links into ${filesWritten} markdown files at: ${OUTPUT_DIR}`
  )
  runLinting(writtenFiles)
}

run()
