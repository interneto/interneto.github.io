#!/usr/bin/env node
// One-time-ish migration: rewrite each toolbox catalog so `category` holds the
// canonical taxonomy node id and `subcategory` holds a canonical value.
//
// Rules (source of truth: public/pkgs/taxonomy.json):
//   - normalize subcategory spelling via SUBCAT_ALIASES
//   - if the (normalized) subcategory is OWNED by a node, that node wins the
//     category (re-homes mis-binned items, e.g. "Password Manager" -> security)
//   - DROP subcategories are cleared; category falls back to the legacy
//     category mapped through node aliases
//   - media items resolve to the Multimedia *son* node id
//
// Idempotent: re-running on already-migrated data is a no-op.
// Run with:  node scripts/migrate-pkg-categories.js

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const abs = (p) => resolve(root, p)

const taxonomy = JSON.parse(readFileSync(abs('public/pkgs/taxonomy.json'), 'utf8'))

// alias/name/id -> node id ; canonical subcategory -> node id
const aliasToId = new Map()
const subcatToNode = new Map()
const walk = (n) => {
  for (const k of [n.id, n.name, ...(n.aliases ?? [])]) aliasToId.set(k, n.id)
  for (const s of n.subcategories ?? []) subcatToNode.set(s, n.id)
  n.children?.forEach(walk)
}
taxonomy.categories.forEach(walk)

// Legacy / duplicate spellings -> canonical subcategory name.
const SUBCAT_ALIASES = {
  'Modeling': '3D Modeling', 'Raw Converter': 'Raw Photo Editor',
  'Music Player': 'Audio Player', 'Audio Streaming': 'Music Streaming',
  'Sheet Music': 'Music Notation', 'Music Theory': 'Music Notation', 'Music Tools': 'Audio Processing',
  'Video Player': 'Media Player', 'Client / Media Server': 'Media Server',
  'Notes': 'Note Taking', 'Mind Map Editor': 'Mind Map', 'Bookmarks': 'Bookmark Manager',
  'Cms': 'CMS', 'Nosql': 'NoSQL', 'Ai Client': 'AI Assistant',
  'RSS': 'RSS Reader', 'Geography Map': 'Geography', 'Gps Viewer': 'GPS', 'Outdoor Maps': 'Maps',
  'Client Cloud Storage': 'Cloud Storage', 'Archive Utility': 'Compressor', 'Disk Imagering': 'Disk Imaging',
  'Email Client': 'Email', 'Remote Connectivity': 'Remote Desktop',
  'Network Analysis': 'Network Analyzer', 'Http Server': 'HTTP Server',
  'Container Engine': 'Containerization', 'Windows Compatibility Layer': 'Compatibility Layer',
  'Wrapping Layer': 'Compatibility Layer', 'Proxy / Network Debugger': 'Network Debugger',
  'Finance': 'Finance Manager', 'Shopping List': 'Shopping', 'Device Cleanup': 'System Cleaner',
}

// Subcategories with no meaningful home -> cleared (category keeps legacy mapping).
const DROP = new Set(['Security', 'Productivity', 'Learning', 'Tracking', '(none)', ''])

// Browser/VS Code extensions are a separate axis (taxonomy.extensionAxes) and
// keep their own native categories — not migrated here.
const CATALOGS = [
  ['public/pkgs/desktop-pkgs.json', 'packages'],
  ['public/pkgs/mobile-pkgs.json', 'packages'],
  ['public/pkgs/web-directory.json', 'entries'],
]

const detectIndent = (text) => {
  const m = text.match(/\n([ \t]+)\S/)
  return m ? m[1].length : 2
}

let moved = 0, cleared = 0, unknown = new Map()

for (const [file, key] of CATALOGS) {
  const text = readFileSync(abs(file), 'utf8')
  const indent = detectIndent(text)
  const data = JSON.parse(text)
  const container = data[key]
  const isArray = Array.isArray(container)
  const items = isArray ? container : Object.values(container ?? {})

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const legacyCat = item.category ?? ''
    const rawSub = (item.subcategory ?? '').trim()
    const canonSub = SUBCAT_ALIASES[rawSub] ?? rawSub

    let nodeId, sub
    if (DROP.has(canonSub)) {
      nodeId = aliasToId.get(legacyCat) ?? legacyCat
      sub = ''
      if (rawSub && rawSub !== '(none)') cleared++
    } else if (subcatToNode.has(canonSub)) {
      nodeId = subcatToNode.get(canonSub)
      sub = canonSub
      if (aliasToId.get(legacyCat) !== nodeId) moved++
    } else {
      nodeId = aliasToId.get(legacyCat) ?? legacyCat
      sub = canonSub
      unknown.set(canonSub, (unknown.get(canonSub) ?? 0) + 1)
    }

    if ('category' in item) item.category = nodeId
    // Only write subcategory back where the field already existed.
    if ('subcategory' in item) item.subcategory = sub
  }

  writeFileSync(abs(file), JSON.stringify(data, null, indent) + '\n', 'utf8')
  console.log(`✏️  ${file} (${items.length} items, indent ${indent})`)
}

console.log(`\n↪️  re-homed: ${moved}   🧹 cleared subcategory: ${cleared}`)
if (unknown.size) {
  console.log('\n⚠️  unknown subcategories (kept as-is, will fail validation):')
  for (const [s, n] of [...unknown].sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(3)}  ${JSON.stringify(s)}`)
}
