/**
 * File utilities
 */

import fs from 'node:fs'
import path from 'node:path'

function resolveInputCsvPath(inputCandidates, rootDir) {
  return inputCandidates.find((candidate) => {
    const resolvedPath = path.resolve(rootDir, candidate)
    return fs.existsSync(resolvedPath)
  }) || null
}

function safeUnlink(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function clearOutputDir(outputDir, filesToRemove) {
  fs.mkdirSync(outputDir, { recursive: true })
  filesToRemove.forEach(file => safeUnlink(path.join(outputDir, file)))
}

// Raindrop nests collections with " / " (space-slash-space), so split only on
// the spaced separator. (The top folder was named "Apps/Services" - a bare
// slash - until it was renamed to "Apps & Services" on 2026-09-22; keep this
// split-on-spaced-separator behavior even though the bare-slash case no
// longer applies, in case a future collection title reintroduces one.)
function normalizeFolder(folder) {
  return folder.split(' / ').map((s) => {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim()
  }).filter(Boolean)
}

function isValidRowFolder(folderParts) {
  return folderParts.length >= 2 && folderParts[0] === 'Apps & Services'
}

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

export {
  resolveInputCsvPath,
  safeUnlink,
  clearOutputDir,
  normalizeFolder,
  isValidRowFolder,
  createNode,
  addToTree
}
