#!/usr/bin/env node
// Validates that every `category` used by the toolbox pkg catalogs resolves to a
// node in the single source of truth (public/pkgs/taxonomy.json) — via the node's
// name, id, or one of its aliases. Fails (exit 1) on any unmapped category so CI
// catches taxonomy drift. Libraries are a separate axis and are not checked here.
//
// Run with:  node scripts/validate-categories.js

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'))

// Build the set of accepted category strings from the taxonomy tree.
const taxonomy = read('public/pkgs/taxonomy.json')
const accepted = new Set()
const walk = (node) => {
  accepted.add(node.name)
  accepted.add(node.id)
  for (const a of node.aliases ?? []) accepted.add(a)
  node.children?.forEach(walk)
}
taxonomy.categories.forEach(walk)

// Catalogs that carry a per-item `category`, and the key holding the item map.
const CATALOGS = [
  ['public/pkgs/desktop-pkgs.json', 'packages'],
  ['public/pkgs/mobile-pkgs.json', 'packages'],
  ['public/pkgs/browser-extensions-pkgs.json', 'extensions'],
  ['public/pkgs/vscode-extensions-pkgs.json', 'extensions'],
  ['public/pkgs/web-directory.json', 'entries'],
]

const unmapped = new Map() // category -> count

for (const [file, key] of CATALOGS) {
  const data = read(file)
  const container = data[key]
  const items = Array.isArray(container) ? container : Object.values(container ?? {})
  for (const item of items) {
    const cat = item?.category
    if (cat && !accepted.has(cat)) {
      unmapped.set(cat, (unmapped.get(cat) ?? 0) + 1)
    }
  }
}

if (unmapped.size) {
  console.error('❌ Unmapped categories (not in taxonomy.json name/id/aliases):')
  for (const [cat, n] of [...unmapped].sort((a, b) => b[1] - a[1])) {
    console.error(`   ${String(n).padStart(4)}  ${JSON.stringify(cat)}`)
  }
  console.error('\nFix: add the string to a node\'s "aliases" in public/pkgs/taxonomy.json.')
  process.exit(1)
}

console.log('✅ All toolbox categories resolve to taxonomy.json')
