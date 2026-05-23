#!/usr/bin/env node
// For each missing icon, try a list of (collection, slug-variant) combinations and
// report the first match. The user can copy the winning URL into the local SVG file.

const slugs = [
    'playwright', 'imagemin', 'parcel', 'winston',
    'emotion', 'husky', 'commander', 'dayjs',
    'estoolkit', 'uuid', 'nanoid', 'serilog',
    'gofiber', 'lintstaged', 'mypy', 'nuxtdotjs',
];

const collections = [
    'logos', 'logos-fill', 'skill-icons', 'devicon', 'devicon-plain',
    'simple-icons', 'vscode-icons-file', 'mdi', 'material-symbols',
    'tabler', 'lucide',
];

// Per-slug alternative spellings to try.
const aliases = {
    nuxtdotjs: ['nuxt'],
    estoolkit: ['lodash', 'es-toolkit'],
    gofiber: ['fiber', 'go-fiber'],
    lintstaged: ['lint-staged'],
    emotion: ['styled-components', 'emotion-js'],
    dayjs: ['dayjs', 'momentjs', 'moment'],
};

async function probe(collection, slug) {
    try {
        const url = `https://api.iconify.design/${collection}:${slug}.svg`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const txt = await res.text();
        if (txt === 'Not found' || !txt.includes('<svg')) return null;
        return url;
    } catch { return null; }
}

for (const slug of slugs) {
    const variants = [slug, ...(aliases[slug] || [])];
    let hit = null;
    outer: for (const v of variants) {
        for (const col of collections) {
            const url = await probe(col, v);
            if (url) { hit = { col, v, url }; break outer; }
        }
    }
    if (hit) console.log(slug.padEnd(15), '->', `${hit.col}:${hit.v}`.padEnd(35), hit.url);
    else console.log(slug.padEnd(15), '-> NONE');
}
