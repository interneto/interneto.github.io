#!/usr/bin/env node
// Runs svgo on every real SVG under public/img/software/ — files that have a .svg
// extension but PNG/other binary content (we have a couple) are skipped so they
// don't blow up the pass.
//
// svgo is invoked as a library (not the CLI) so we can filter file-by-file and
// also report total bytes saved.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const target = resolve(root, 'public/img/software');

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) yield* walk(full);
        else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) yield full;
    }
}

function looksLikeSvg(buf) {
    // Skip BOM / whitespace; accept '<?xml' or '<svg' or '<!--' as the first non-blank token.
    let i = 0;
    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) i = 3;
    while (i < buf.length && (buf[i] === 0x20 || buf[i] === 0x09 || buf[i] === 0x0a || buf[i] === 0x0d)) i++;
    if (i >= buf.length) return false;
    return buf[i] === 0x3c; // '<'
}

// svgo 4: removeViewBox moved out of preset-default. Disable it explicitly via the
// top-level plugin list so icons keep their viewBox (essential for scaling).
const svgoConfig = {
    multipass: true,
    plugins: [
        'preset-default',
        {
            name: 'removeViewBox',
            active: false,
        },
    ],
};

let beforeBytes = 0, afterBytes = 0;
let ok = 0, skippedNonSvg = 0, errored = 0, unchanged = 0;

for (const file of walk(target)) {
    const buf = readFileSync(file);
    if (!looksLikeSvg(buf)) {
        skippedNonSvg++;
        continue;
    }
    const src = buf.toString('utf8');
    let result;
    try {
        result = optimize(src, { path: file, ...svgoConfig });
    } catch (e) {
        errored++;
        console.warn('  ! error', file, '-', e.message);
        continue;
    }
    if (result.error) {
        errored++;
        console.warn('  ! error', file, '-', result.error);
        continue;
    }
    const optimized = result.data;
    beforeBytes += src.length;
    afterBytes += optimized.length;
    if (optimized === src) {
        unchanged++;
    } else {
        writeFileSync(file, optimized, 'utf8');
        ok++;
    }
}

const saved = beforeBytes - afterBytes;
const pct = beforeBytes ? ((saved / beforeBytes) * 100).toFixed(1) : '0';
console.log(`optimized:   ${ok}`);
console.log(`unchanged:   ${unchanged}`);
console.log(`errored:     ${errored}`);
console.log(`skipped (not real SVG): ${skippedNonSvg}`);
console.log(`bytes before: ${beforeBytes.toLocaleString()}`);
console.log(`bytes after:  ${afterBytes.toLocaleString()}`);
console.log(`saved:        ${saved.toLocaleString()} (${pct}%)`);
