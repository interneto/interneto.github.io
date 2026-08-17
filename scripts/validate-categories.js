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

// Build, from the taxonomy tree: the set of accepted category strings
// (name/id/aliases) and, per node, the set of subcategories it owns.
const taxonomy = read('public/pkgs/taxonomy.json')
const accepted = new Set()
const subsByCategory = new Map() // accepted category string -> Set of its subcategories
const walk = (node) => {
  const keys = [node.name, node.id, ...(node.aliases ?? [])]
  const subs = new Set(node.subcategories ?? [])
  for (const k of keys) {
    accepted.add(k)
    subsByCategory.set(k, subs)
  }
  node.children?.forEach(walk)
}
taxonomy.categories.forEach(walk)

// Extension axes are a separate classification (own native category names).
const extAccepted = new Set()
for (const axis of Object.values(taxonomy.extensionAxes ?? {})) {
  if (Array.isArray(axis)) for (const e of axis) if (e?.name) extAccepted.add(e.name)
}

// Main catalogs validate against the category tree (+ subcategories);
// extension catalogs validate against their own axis names.
const CATALOGS = [
  ['public/pkgs/desktop-pkgs.json', 'packages', 'main'],
  ['public/pkgs/mobile-pkgs.json', 'packages', 'main'],
  ['public/pkgs/app-directory.json', 'entries', 'main'],
  ['public/pkgs/browser-extensions-pkgs.json', 'extensions', 'ext'],
  ['public/pkgs/vscode-extensions-pkgs.json', 'extensions', 'ext'],
]

const unmapped = new Map()   // category -> count
const badSubcat = new Map()  // "category › subcategory" -> count

for (const [file, key, kind] of CATALOGS) {
  const data = read(file)
  const container = data[key]
  const items = Array.isArray(container) ? container : Object.values(container ?? {})
  for (const item of items) {
    const cat = item?.category
    if (!cat) continue
    if (kind === 'ext') {
      if (!extAccepted.has(cat)) unmapped.set(cat, (unmapped.get(cat) ?? 0) + 1)
      continue
    }
    if (!accepted.has(cat)) {
      unmapped.set(cat, (unmapped.get(cat) ?? 0) + 1)
      continue
    }
    const sub = (item.subcategory ?? '').trim()
    if (sub && !subsByCategory.get(cat).has(sub)) {
      const k = `${cat} › ${sub}`
      badSubcat.set(k, (badSubcat.get(k) ?? 0) + 1)
    }
  }
}

let failed = false
if (unmapped.size) {
  failed = true
  console.error('❌ Unmapped categories (not in taxonomy.json name/id/aliases):')
  for (const [cat, n] of [...unmapped].sort((a, b) => b[1] - a[1])) {
    console.error(`   ${String(n).padStart(4)}  ${JSON.stringify(cat)}`)
  }
  console.error('Fix: add the string to a node\'s "aliases" in public/pkgs/taxonomy.json.\n')
}
if (badSubcat.size) {
  failed = true
  console.error('❌ Subcategories not owned by their category (taxonomy.json "subcategories"):')
  for (const [k, n] of [...badSubcat].sort((a, b) => b[1] - a[1])) {
    console.error(`   ${String(n).padStart(4)}  ${k}`)
  }
  console.error('Fix: add the subcategory under that node, or move/normalize it.\n')
}
if (failed) process.exit(1)

console.log('✅ All toolbox categories + subcategories resolve to taxonomy.json')
