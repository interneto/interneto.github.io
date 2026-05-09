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

function normalizeFolder(folder) {
  return folder.split('/').map((s) => {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim()
  }).filter(Boolean)
}

function isValidRowFolder(folderParts) {
  return folderParts.length >= 2 && folderParts[0] === 'Apps'
}

export {
  resolveInputCsvPath,
  safeUnlink,
  clearOutputDir,
  normalizeFolder,
  isValidRowFolder
}
