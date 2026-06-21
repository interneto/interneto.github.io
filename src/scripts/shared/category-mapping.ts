/**
 * Category Mapping — legacy toolbox category → taxonomy display name.
 *
 * The mapping table now lives in the single source of truth
 * (public/pkgs/taxonomy.json, each node's `aliases`), loaded at runtime by
 * data-loader. This module is a thin wrapper kept for call-site stability.
 * `initConfigData()` must resolve before these are used.
 *
 * Canonical reference: docs/taxonomy.md
 */

import { resolveCategoryName } from './data-loader';

/**
 * Translate a legacy toolbox category to its taxonomy display name
 * (the most specific node — e.g. "Image" → "Photos & Graphics").
 * Returns the original string if no mapping exists.
 */
export function mapCategory(toolboxCategory: string): string {
  return resolveCategoryName(toolboxCategory);
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
