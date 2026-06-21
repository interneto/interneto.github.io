/**
 * Category Configuration
 *
 * Derived from the single source of truth: public/pkgs/taxonomy.json.
 * Only top-level categories map to content collections (one .md per category);
 * children (e.g. Multimedia sons) and `aliases` are for the runtime toolbox.
 *
 * Canonical reference: docs/taxonomy.md
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TAXONOMY_PATH = path.resolve(__dirname, '../../public/pkgs/taxonomy.json')

const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'))

export const CATEGORY_CONFIG = taxonomy.categories.map((c) => ({
  folder: c.name,
  displayName: c.name,
  file: `${c.id}.md`,
  description: c.description ?? '',
  icon: c.emoji ?? '📚',
}))

/**
 * Detailed UI descriptions keyed by folder (display) name.
 * Same source as CATEGORY_CONFIG.description — kept as a separate export
 * for the markdown renderer's frontmatter.
 */
export const CATEGORY_DESCRIPTIONS = Object.fromEntries(
  taxonomy.categories.map((c) => [c.name, c.description ?? '']),
)

export const PATHS = {
  OUTPUT_DIR: 'src/content/categories',
  INPUT_CSV_CANDIDATES: [
    'links/interneto-links.csv',
    'interneto-links.csv'
  ]
}
