#!/usr/bin/env node
// Downloads library + language icons used by the Library Installer from the
// dashboard-icons CDN into public/img/software/lib/. The runtime keeps the CDN
// as a fallback, but local files load faster and survive CDN outages.
//
// Sources of truth:
//   - public/pkgs/lib-pkgs.json    — what libraries exist per language
//   - public/pkgs/config.json      — libIcons: name→slug mapping (and language slugs)
//
// Run with:  node scripts/download-lib-icons.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const libPkgsPath = resolve(root, 'public/pkgs/lib-pkgs.json');
const configPath = resolve(root, 'public/pkgs/config.json');
const outDir = resolve(root, 'public/img/software/lib');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const libPkgs = JSON.parse(readFileSync(libPkgsPath, 'utf8'));
const libIcons = JSON.parse(readFileSync(configPath, 'utf8')).libIcons;

// Three CDNs in cascade because no single source covers everything:
//   1. simple-icons       — brand monochrome icons (react, vue, prettier, eslint, jest…)
//                            The existing slugs follow this convention (vuedotjs, nextdotjs…).
//   2. dashboard-icons    — Homarr's full-colour app icons (tailwind, docker, astro…)
//   3. Iconify `logos`    — covers gaps that simple-icons doesn't (playwright, parcel, imagemin…)
//   4. Iconify `devicon`  — final brand fallback (gofiber via `fiber`, etc.)
const SIMPLE_ICONS_BASE = 'https://cdn.simpleicons.org';
const DASHBOARD_ICONS_BASE = libIcons.cdn?.dashboardIcons ?? 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg';
const ICONIFY_BASE = 'https://api.iconify.design';
const CONCURRENCY = 10;
const TIMEOUT_MS = 15_000;

// Same normalization the runtime uses (lib-installer.ts:32).
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// Collect every slug we need to download. Set of strings.
const wantedSlugs = new Set();

// Language icons.
for (const lang of Object.values(libIcons.languages ?? {})) {
    if (lang.slug) wantedSlugs.add(lang.slug);
}

// Library icons — resolved by normalized name. Track which libraries had no mapping.
const unmapped = [];
for (const lang of Object.values(libPkgs)) {
    for (const cat of Object.values(lang.categories ?? {})) {
        for (const lib of cat) {
            const display = lib.display ?? lib.name;
            const key = normalize(display);
            const slug = libIcons.libraries[key] ?? libIcons.libraries[key.split(/[-_]/)[0]];
            if (slug) wantedSlugs.add(slug);
            else unmapped.push(display);
        }
    }
}

async function fetchWithTimeout(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        return await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    } finally {
        clearTimeout(t);
    }
}

async function tryFetch(url) {
    try {
        const res = await fetchWithTimeout(url);
        if (!res.ok) return null;
        const txt = await res.text();
        if (!txt.includes('<svg')) return null;
        return txt;
    } catch { return null; }
}

async function downloadSlug(slug) {
    const dst = resolve(outDir, `${slug}.svg`);
    if (existsSync(dst)) return { slug, status: 'cached' };
    // Try simple-icons first (existing lib-icons.json slugs follow its conventions),
    // then dashboard-icons. Whichever returns valid SVG content first wins.
    const sources = [
        { name: 'simple-icons', url: `${SIMPLE_ICONS_BASE}/${slug}` },
        { name: 'dashboard-icons', url: `${DASHBOARD_ICONS_BASE}/${slug}.svg` },
        { name: 'iconify-logos', url: `${ICONIFY_BASE}/logos:${slug}.svg` },
        { name: 'iconify-devicon', url: `${ICONIFY_BASE}/devicon:${slug}.svg` },
    ];
    for (const src of sources) {
        const txt = await tryFetch(src.url);
        if (txt) {
            writeFileSync(dst, txt, 'utf8');
            return { slug, status: 'ok', source: src.name, bytes: txt.length };
        }
    }
    return { slug, status: 'not-found' };
}

async function runWithConcurrency(items, worker, concurrency) {
    const results = [];
    let i = 0;
    const workers = Array.from({ length: concurrency }, async () => {
        while (true) {
            const idx = i++;
            if (idx >= items.length) return;
            results[idx] = await worker(items[idx]);
        }
    });
    await Promise.all(workers);
    return results;
}

console.log(`Downloading ${wantedSlugs.size} unique icons → ${outDir}`);
if (unmapped.length) {
    console.log(`Unmapped libraries (no slug, will render as package fallback at runtime):`);
    for (const name of unmapped) console.log(`  · ${name}`);
}

const startedAt = Date.now();
const results = await runWithConcurrency(Array.from(wantedSlugs), downloadSlug, CONCURRENCY);
const tally = {};
for (const r of results) tally[r.status] = (tally[r.status] || 0) + 1;

console.log(`Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
console.log('Status:', tally);

const failed = results.filter((r) => !['ok', 'cached'].includes(r.status));
if (failed.length) {
    console.log('Failed slugs (no local copy — runtime falls back to CDN, then lucide package):');
    for (const f of failed) console.log(`  · ${f.slug}  (${f.status})`);
}
