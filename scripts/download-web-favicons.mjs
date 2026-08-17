#!/usr/bin/env node
// Downloads favicons for entries in public/pkgs/app-directory.json into
// public/img/software/webs/{slug}.{ext}. Preference: svg > ico > png > webp.
// Only processes entries whose icon is the no.svg placeholder or an external URL —
// curated SVGs in /img/software/apps/ are left untouched.
//
// Updates app-directory.json icon paths in place for successful downloads.
//
// Run with:  node scripts/download-web-favicons.mjs [--limit N] [--retry]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dirPath = resolve(root, 'public/pkgs/app-directory.json');
const outDir = resolve(root, 'public/img/software/webs');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const RETRY_FAILED = args.has('--retry');

const CONCURRENCY = 10;
const TIMEOUT_MS = 8000;
const UA = 'Mozilla/5.0 (compatible; InternetoFaviconBot/1.0; +https://interneto.github.io)';

const FORMAT_RANK = { svg: 0, ico: 1, png: 2, webp: 3, jpg: 4, jpeg: 4, gif: 5 };
const EXT_BY_MIME = {
    'image/svg+xml': 'svg',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
};

const directory = JSON.parse(readFileSync(dirPath, 'utf8'));

const slug = (s) => s
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// In the new schema, entries either have a curated `icon` (bare filename in /img/software/webs/,
// or an absolute path, or http URL) or no `icon` at all. We process the latter unless --retry.
const needsDownload = (icon) => !icon;

async function fetchWithTimeout(url, init = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': UA, ...(init.headers || {}) } });
    } finally {
        clearTimeout(timer);
    }
}

function extFromUrl(href) {
    try {
        const u = new URL(href);
        const m = u.pathname.match(/\.([a-z0-9]+)(?:$|\?)/i);
        return m ? m[1].toLowerCase() : null;
    } catch { return null; }
}

// Parse <link rel="..." href="..." sizes="..." type="..."> tags from HTML head.
function parseIconLinks(html, baseUrl) {
    const out = [];
    const linkRe = /<link\b[^>]*>/gi;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
        const tag = m[0];
        const rel = (tag.match(/\brel=["']([^"']+)["']/i) || [])[1] || '';
        const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
        const type = (tag.match(/\btype=["']([^"']+)["']/i) || [])[1] || '';
        const sizes = (tag.match(/\bsizes=["']([^"']+)["']/i) || [])[1] || '';
        if (!href) continue;
        const rels = rel.toLowerCase().split(/\s+/);
        if (!rels.some((r) => /^(shortcut icon|icon|apple-touch-icon|mask-icon|fluid-icon)$/.test(r))) continue;
        let absolute;
        try { absolute = new URL(href, baseUrl).toString(); } catch { continue; }
        const ext = type.toLowerCase().includes('svg') ? 'svg'
            : type.toLowerCase().includes('png') ? 'png'
            : type.toLowerCase().includes('webp') ? 'webp'
            : type.toLowerCase().includes('icon') ? 'ico'
            : extFromUrl(absolute) || 'png';
        // size = max of "WxH" values, e.g. "32x32 16x16" → 32
        const sizeNums = sizes.split(/\s+/).map((s) => parseInt((s.split('x')[0] || '0'), 10) || 0);
        const size = sizeNums.length ? Math.max(...sizeNums) : 0;
        out.push({ href: absolute, ext, size, isApple: rels.includes('apple-touch-icon') });
    }
    return out;
}

async function discoverFavicons(siteUrl) {
    let html = '';
    try {
        const res = await fetchWithTimeout(siteUrl);
        if (res.ok) {
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('html')) {
                html = (await res.text()).slice(0, 200_000);
            }
        }
    } catch { /* offline / blocked / etc. */ }

    const candidates = html ? parseIconLinks(html, siteUrl) : [];

    // Always also try the conventional fallbacks at site root.
    try {
        const origin = new URL(siteUrl).origin;
        candidates.push({ href: `${origin}/favicon.svg`, ext: 'svg', size: 0 });
        candidates.push({ href: `${origin}/favicon.ico`, ext: 'ico', size: 0 });
        candidates.push({ href: `${origin}/apple-touch-icon.png`, ext: 'png', size: 180, isApple: true });
    } catch { /* unparseable url */ }
    return candidates;
}

async function downloadIcon(candidate) {
    try {
        const res = await fetchWithTimeout(candidate.href);
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 70) return null; // 70 bytes is below any real icon
        const ct = (res.headers.get('content-type') || '').toLowerCase().split(';')[0];
        const extFromCt = EXT_BY_MIME[ct];
        const ext = extFromCt || candidate.ext;
        // Sanity-check: SVG content must contain <svg, ICO must start with 00 00 01 00, PNG with 89 50 4e 47
        if (ext === 'svg' && !buf.toString('utf8', 0, 2000).includes('<svg')) return null;
        if (ext === 'png' && !(buf[0] === 0x89 && buf[1] === 0x50)) return null;
        if (ext === 'ico' && !(buf[0] === 0 && buf[1] === 0 && (buf[2] === 1 || buf[2] === 2))) return null;
        return { buffer: buf, ext };
    } catch { return null; }
}

async function processEntry(entry) {
    if (!entry.link) return { status: 'no-link' };

    let siteUrl;
    try { siteUrl = new URL(entry.link).toString(); }
    catch { return { status: 'bad-url' }; }

    const name = slug(entry.name);
    if (!name) return { status: 'bad-slug' };

    // Find best candidate by trying them in preference order; the first that downloads wins.
    const candidates = await discoverFavicons(siteUrl);
    if (candidates.length === 0) return { status: 'no-candidates' };

    const sorted = [...candidates].sort((a, b) => {
        const ra = FORMAT_RANK[a.ext] ?? 99;
        const rb = FORMAT_RANK[b.ext] ?? 99;
        if (ra !== rb) return ra - rb;
        return (b.size || 0) - (a.size || 0);
    });

    for (const c of sorted) {
        const got = await downloadIcon(c);
        if (!got) continue;
        const outPath = resolve(outDir, `${name}.${got.ext}`);
        writeFileSync(outPath, got.buffer);
        // Store bare filename — the renderer prefixes /img/software/webs/ automatically.
        entry.icon = `${name}.${got.ext}`;
        return { status: 'ok', ext: got.ext, from: c.href };
    }
    return { status: 'all-failed' };
}

async function runWithConcurrency(items, worker, concurrency) {
    const results = new Array(items.length);
    let i = 0;
    const workers = Array.from({ length: concurrency }, async () => {
        while (true) {
            const idx = i++;
            if (idx >= items.length) return;
            results[idx] = await worker(items[idx], idx);
        }
    });
    await Promise.all(workers);
    return results;
}

const todo = directory.entries.slice(0, LIMIT).filter((e) =>
    RETRY_FAILED ? true : needsDownload(e.icon),
);

console.log(`Processing ${todo.length} entries (of ${directory.entries.length} total)...`);

const startedAt = Date.now();
const stats = {};

let done = 0;
const results = await runWithConcurrency(todo, async (entry) => {
    const r = await processEntry(entry);
    stats[r.status] = (stats[r.status] || 0) + 1;
    done++;
    if (done % 25 === 0 || done === todo.length) {
        process.stdout.write(`  ${done}/${todo.length}  ok=${stats.ok || 0}  failed=${(stats['all-failed'] || 0) + (stats['no-candidates'] || 0)}\r`);
    }
    return r;
}, CONCURRENCY);

writeFileSync(dirPath, JSON.stringify(directory, null, 4) + '\n', 'utf8');

console.log('\nDone in', ((Date.now() - startedAt) / 1000).toFixed(1), 's');
console.log('Status:', stats);

// Breakdown by ext for successful downloads.
const byExt = {};
for (const r of results) {
    if (r && r.status === 'ok') byExt[r.ext] = (byExt[r.ext] || 0) + 1;
}
console.log('Saved formats:', byExt);
