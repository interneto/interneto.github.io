#!/usr/bin/env node
// Consolidates web-directory.json icons so they all live in /img/software/webs/:
//   1. For every entry pointing into /img/software/apps/ (except no.svg), copy that file
//      into /img/software/webs/ if it isn't there yet. apps/ is left untouched — other
//      installers still depend on it.
//   2. Rewrite each entry's `icon` to a bare filename ("chatgpt.svg"). The renderer
//      always prefixes /img/software/webs/.
//   3. Entries that pointed to no.svg get their `icon` removed entirely — the renderer
//      falls back to the favicon service.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dirPath = resolve(root, 'public/pkgs/web-directory.json');
const appsDir = resolve(root, 'public/img/software/apps');
const websDir = resolve(root, 'public/img/software/webs');

const directory = JSON.parse(readFileSync(dirPath, 'utf8'));

let copied = 0, alreadyThere = 0, dropped = 0, shortened = 0, missing = 0, kept = 0;

for (const entry of directory.entries) {
    const icon = entry.icon;
    if (!icon) continue;

    if (icon === '/img/software/apps/no.svg' || icon.endsWith('/no.svg')) {
        delete entry.icon;
        dropped++;
        continue;
    }

    if (icon.startsWith('/img/software/apps/')) {
        const filename = icon.split('/').pop();
        const src = resolve(appsDir, filename);
        const dst = resolve(websDir, filename);
        if (!existsSync(src)) {
            // Source missing — leave the icon alone for manual review.
            missing++;
            continue;
        }
        if (existsSync(dst)) {
            alreadyThere++;
        } else {
            copyFileSync(src, dst);
            copied++;
        }
        entry.icon = filename;
        shortened++;
        continue;
    }

    if (icon.startsWith('/img/software/webs/')) {
        entry.icon = icon.split('/').pop();
        shortened++;
        continue;
    }

    // Any other shape (external URL, /icon.png, …) we keep as-is.
    kept++;
}

writeFileSync(dirPath, JSON.stringify(directory, null, 4) + '\n', 'utf8');

console.log({ copied, alreadyThere, dropped, shortened, missing, kept });
