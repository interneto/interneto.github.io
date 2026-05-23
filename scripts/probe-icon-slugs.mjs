#!/usr/bin/env node
// Probes slug variants for each missing icon across simple-icons and dashboard-icons,
// printing the first working URL per slug. Use the output to fix lib-icons.json.

const candidates = {
    playwright: ['playwright', 'playwright-test'],
    imagemin: ['imagemin'],
    parcel: ['parcel'],
    winston: ['winston'],
    nuxtdotjs: ['nuxt', 'nuxtdotjs', 'nuxtjs', 'nuxt-js'],
    emotion: ['emotion', 'styled'],
    husky: ['husky'],
    'lint-staged': ['lintstaged', 'lint-staged', 'eslint'],
    commander: ['commander', 'commanderjs'],
    dayjs: ['dayjs', 'day-js', 'momentjs'],
    estoolkit: ['estoolkit', 'es-toolkit', 'lodash'],
    uuid: ['uuid'],
    nanoid: ['nanoid'],
    mypy: ['mypy', 'python'],
    serilog: ['serilog'],
    gofiber: ['gofiber', 'fiber', 'gofiberio'],
    guzzle: ['guzzle', 'guzzlephp', 'php'],
};

const SIMPLE = 'https://cdn.simpleicons.org';
const DASHBOARD = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg';

async function probe(url) {
    try {
        const res = await fetch(url, { redirect: 'follow' });
        if (!res.ok) return false;
        const txt = await res.text();
        return txt.includes('<svg');
    } catch { return false; }
}

const results = {};
for (const [originalSlug, alts] of Object.entries(candidates)) {
    for (const alt of alts) {
        const si = `${SIMPLE}/${alt}`;
        const di = `${DASHBOARD}/${alt}.svg`;
        if (await probe(si)) { results[originalSlug] = { source: 'simple', url: si, slug: alt }; break; }
        if (await probe(di)) { results[originalSlug] = { source: 'dashboard', url: di, slug: alt }; break; }
    }
    if (!results[originalSlug]) results[originalSlug] = { source: 'NONE', slug: null };
}

for (const [k, v] of Object.entries(results)) {
    console.log(k.padEnd(15), '→', v.source.padEnd(12), v.slug || '(no match)');
}
