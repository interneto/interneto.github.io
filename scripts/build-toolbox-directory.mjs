#!/usr/bin/env node
// One-shot script that rebuilds public/pkgs/toolbox-directory.json by:
//  - keeping existing curated entries
//  - adding override entries for desktop/mobile legacy packages that currently
//    fall back to a duckduckgo search link, using URLs found in src/data/bookmarks.json
//  - importing every leaf from the "Web Platforms" and "Web Database" toolbar folders
//    of src/data/bookmarks.json as web entries
//
// Run with:  node scripts/build-toolbox-directory.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const bookmarksPath = resolve(root, 'src/data/bookmarks.json');
const desktopPath = resolve(root, 'public/pkgs/desktop-pkgs.json');
const mobilePath = resolve(root, 'public/pkgs/mobile-pkgs.json');
const directoryPath = resolve(root, 'public/pkgs/toolbox-directory.json');
const iconsDir = resolve(root, 'public/img/apps');

const bookmarks = JSON.parse(readFileSync(bookmarksPath, 'utf8'));
const desktopPkgs = JSON.parse(readFileSync(desktopPath, 'utf8'));
const mobilePkgs = JSON.parse(readFileSync(mobilePath, 'utf8'));
const directory = JSON.parse(readFileSync(directoryPath, 'utf8'));

const availableIcons = new Set(
    readdirSync(iconsDir).filter((f) => f.endsWith('.svg')).map((f) => f.toLowerCase()),
);
const iconFor = (key) => {
    const name = `${key}.svg`.toLowerCase();
    return availableIcons.has(name) ? `/img/apps/${key}.svg` : '/img/apps/no.svg';
};

const normalize = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

// Strip noisy suffixes from bookmark titles like " · GitHub", " - Wikipedia", parenthetical tags.
function cleanTitle(title) {
    return title
        .replace(/\s+[·\-|–]\s+(GitHub|Wikipedia|YouTube|Reddit|Twitter|X|Official.*)$/i, '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .trim();
}

// Walk bookmark tree, yielding { title, uri, folderPath[] } for each leaf.
function* walk(node, path = []) {
    if (!node) return;
    if (node.type === 'text/x-moz-place' && node.uri) {
        yield { title: node.title || node.uri, uri: node.uri, path };
        return;
    }
    if (node.type === 'text/x-moz-place-container' && Array.isArray(node.children)) {
        const nextPath = node.title ? [...path, node.title] : path;
        for (const child of node.children) {
            yield* walk(child, nextPath);
        }
    }
}

// Build name→uri lookup from ALL bookmarks (first occurrence wins). Used by the
// legacy-package URL fix.
const nameLookup = new Map();
for (const leaf of walk(bookmarks)) {
    const key = normalize(cleanTitle(leaf.title));
    if (!key) continue;
    if (!nameLookup.has(key)) nameLookup.set(key, leaf.uri);
    // also index by exact title without normalization tweak — handled by normalize already
}

// Set of normalized names already present in directory.entries — we won't duplicate.
const existingKeys = new Set(directory.entries.map((e) => normalize(e.name)));

function pkgLink(name) {
    const k = normalize(name);
    return nameLookup.get(k);
}

function addOverride(pkgKey, pkg, tag) {
    const name = (pkg.name ?? pkgKey).trim();
    const key = normalize(name);
    if (existingKeys.has(key)) return false;
    const link = pkgLink(name);
    if (!link) return false; // leave it as DDG fallback for now
    directory.entries.push({
        category: (pkg.category ?? 'Other').trim(),
        name,
        icon: iconFor(pkgKey),
        link,
        tags: [tag],
    });
    existingKeys.add(key);
    return true;
}

let addedDesktop = 0;
for (const [key, pkg] of Object.entries(desktopPkgs.packages ?? {})) {
    if (addOverride(key, pkg, 'desktop')) addedDesktop++;
}

let addedMobile = 0;
for (const [key, pkg] of Object.entries(mobilePkgs.packages ?? {})) {
    if (addOverride(key, pkg, 'mobile')) addedMobile++;
}

// Now import Web Platforms + Web Database bookmark leaves.
const WEB_SECTIONS = new Set(['Web Platforms', 'Web Database']);

function categoryFor(path) {
    // path looks like ['toolbar', 'Web Platforms', 'Maps'] → "Maps"
    const last = path[path.length - 1];
    return last || 'Other';
}

let addedBookmarks = 0;
for (const leaf of walk(bookmarks)) {
    if (!leaf.path.some((p) => WEB_SECTIONS.has(p))) continue;
    const cleanName = cleanTitle(leaf.title);
    if (!cleanName) continue;
    const key = normalize(cleanName);
    if (existingKeys.has(key)) continue;
    directory.entries.push({
        category: categoryFor(leaf.path),
        name: cleanName,
        icon: iconFor(key),
        link: leaf.uri,
        tags: ['web'],
    });
    existingKeys.add(key);
    addedBookmarks++;
}

// Sort entries for stable diff: by category then name.
directory.entries.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

writeFileSync(directoryPath, JSON.stringify(directory, null, 4) + '\n', 'utf8');

console.log(`desktop overrides added: ${addedDesktop}`);
console.log(`mobile overrides added:  ${addedMobile}`);
console.log(`bookmark entries added:  ${addedBookmarks}`);
console.log(`total entries:           ${directory.entries.length}`);
