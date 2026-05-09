/**
 * Convert Raindrop.io CSV export to Markdown
 *
 * Transforms Raindrop.io CSV exports into markdown files with YAML frontmatter
 * for Astro content collections.
 *
 * Usage: node scripts/convert.js
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { CATEGORY_CONFIG, PATHS } from './config/categories.js'
import { parseCsv, buildItemFromRow } from './lib/csv-parser.js'
import { renderGroupFile } from './lib/markdown-renderer.js'
import {
  resolveInputCsvPath,
  clearOutputDir,
  normalizeFolder,
  isValidRowFolder
} from './lib/utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.resolve(ROOT_DIR, PATHS.OUTPUT_DIR)
const INPUT_CSV_CANDIDATES = PATHS.INPUT_CSV_CANDIDATES.map(p => path.resolve(ROOT_DIR, p))

function log(icon, message) {
  console.log(`${icon} ${message}`)
}

// ============================================================================
// Core processing logic
// ============================================================================

function createNode() {
  return { items: [], children: new Map() }
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

function processRowsIntoGroups(rows, groups) {
  let count = 0
  const categoryByFolder = new Map(CATEGORY_CONFIG.map(c => [c.folder, c]))

  for (const row of rows) {
    const folderParts = normalizeFolder(row.folder || '')
    if (!isValidRowFolder(folderParts)) continue

    const category = folderParts[1]
    if (!categoryByFolder.has(category)) continue

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
      category.folder
    )
    fs.writeFileSync(filePath, markdown, 'utf8')
    writtenFiles.push(path.relative(ROOT_DIR, filePath))
    count++
  }

  return { count, writtenFiles }
}

function runLinting(targetFiles = []) {
  log('📋', 'Running markdown lint...')
  const lintArgs = [path.resolve(__dirname, 'lint-markdown.js')]
  if (targetFiles.length > 0) {
    lintArgs.push('--files', ...targetFiles)
  }

  const result = spawnSync('node', lintArgs, {
    stdio: 'inherit',
    cwd: ROOT_DIR
  })

  if (result.error) {
    log('❌', `Lint failed: ${result.error.message}`)
    process.exit(1)
  }

  if (result.status !== 0) {
    log('⚠️', 'Lint warnings found')
  }
}

// ============================================================================
// Main entry point
// ============================================================================

function run() {
  console.log('🔄 Interneto Link Converter v2')
  console.log(`📂 Root: ${ROOT_DIR}\n`)

  // Step 1: Locate CSV file
  const csvCandidateRelative = PATHS.INPUT_CSV_CANDIDATES.map(p => path.join(ROOT_DIR, p))
  const inputCsvPath = csvCandidateRelative.find(p => fs.existsSync(p)) || null

  if (!inputCsvPath) {
    log('❌', `CSV not found. Searched:`)
    csvCandidateRelative.forEach(p => log('  ', `  ${path.relative(ROOT_DIR, p)}`))
    process.exit(1)
  }

  log('📥', `CSV: ${path.relative(ROOT_DIR, inputCsvPath)}`)

  // Step 2: Parse CSV
  const csv = fs.readFileSync(inputCsvPath, 'utf8')
  const rows = parseCsv(csv)
  log('📊', `Parsed ${rows.length} rows`)

  // Step 3: Initialize groups
  const groups = new Map(
    CATEGORY_CONFIG.map((entry) => [entry.folder, createNode()])
  )

  // Step 4: Process rows into category tree
  const included = processRowsIntoGroups(rows, groups)
  log('✅', `Processed ${included} valid items`)

  // Step 5: Clear and write output files
  clearOutputDir(OUTPUT_DIR, CATEGORY_CONFIG.map(c => c.file))
  const { count: filesWritten, writtenFiles } = writeGroupFiles(groups)
  log('📝', `Generated ${filesWritten} markdown files`)
  log('  ', `Output: ${path.relative(ROOT_DIR, OUTPUT_DIR)}\n`)

  // Step 6: Run linting
  runLinting(writtenFiles)

  log('✨', 'Done!')
}

run()
