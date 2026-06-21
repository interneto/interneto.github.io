/**
 * Category Mapping — Toolbox → Taxonomy
 *
 * Maps legacy toolbox category strings to the 19-category standard taxonomy.
 * Used at runtime so JSON data doesn't need immediate migration.
 *
 * Canonical reference: docs/taxonomy.md
 */

export const TOOLBOX_TO_TAXONOMY: Record<string, string> = {
  // Desktop packages
  'File Management': 'File Management',
  'Internet & Communication': 'Social & Communications',
  'Utility': 'OS & Utilities',
  'Office': 'Office & Productivity',
  'Development': 'Development',
  'Gaming': 'Gaming',
  'Audio': 'Multimedia',
  'Video': 'Multimedia',
  'Image': 'Multimedia',
  'System': 'OS & Utilities',
  'Virtualization': 'System Administration',
  'Reading': 'Education & Reference',
  'Science': 'Education & Reference',
  'Education': 'Education & Reference',

  // Browser extensions
  'Privacy and Security': 'Security & Privacy',
  'Appearance': 'Web Browsers',
  'Productivity': 'Office & Productivity',
  'Developer Tools': 'Development',
  'Media': 'Multimedia',

  // VS Code extensions
  'AI': 'AI Tools & Services',
  'Languages': 'Development',
  'Markdown and Docs': 'Development',
  'Databases': 'Development',
  'Formatting and Linting': 'Development',
  'Utilities': 'Development',
  'Web and Frontend': 'Development',
  'DevOps and Cloud': 'Development',
  'Remote Development': 'Development',
};

/**
 * Translate a legacy toolbox category to its taxonomy name.
 * Returns the original string if no mapping exists.
 */
export function mapCategory(toolboxCategory: string): string {
  return TOOLBOX_TO_TAXONOMY[toolboxCategory] ?? toolboxCategory;
}

/**
 * Get unique taxonomy categories from a list of legacy categories.
 * Preserves the order of first occurrence.
 */
export function getUniqueTaxonomyCategories(legacyCategories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const cat of legacyCategories) {
    const mapped = mapCategory(cat);
    if (!seen.has(mapped)) {
      seen.add(mapped);
      result.push(mapped);
    }
  }
  return result;
}