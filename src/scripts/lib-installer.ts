/**
 * Library Installer
 * Select libraries by language/category and generate install command.
 */

// ============================================================================
// DATA
// ============================================================================

import { BASE_LIB_CATEGORIES, CATEGORY_ICONS } from './lib-categories';

// CDN base URLs
const DASHBOARD_ICONS_CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg';
const LUCIDE_CDN = 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons';

// Language icons (Dashboard Icons slugs)
const LANG_ICONS: Record<string, string> = {
    javascript: 'javascript',
    python: 'python',
    java: 'openjdk',
    csharp: 'dotnet',
    go: 'go',
    rust: 'rust',
    php: 'php',
};

const LANG_ICON_URLS: Record<string, string> = {
    java: `${DASHBOARD_ICONS_CDN}/java.svg`,
    csharp: `${DASHBOARD_ICONS_CDN}/csharp.svg`,
};

// Library icons (Dashboard Icons slugs)
// Keys are display names lowercased with all non-alphanumeric chars removed
const LIB_ICON_SLUGS: Record<string, string> = {
    // Frontend — UI Frameworks
    react: 'react',
    vue: 'vuedotjs',
    svelte: 'svelte',
    angular: 'angular',
    solidjs: 'solid',
    preact: 'preact',
    // Frontend — Meta-Frameworks
    nextjs: 'nextdotjs',
    nuxt: 'nuxtdotjs',
    astro: 'astro',
    remix: 'remix',
    sveltekit: 'svelte',
    vite: 'vite',
    // Frontend — State
    reduxtoolkit: 'redux',
    redux: 'redux',
    mobx: 'mobx',
    pinia: 'pinia',
    // Frontend — Data Fetching
    tanstackquery: 'reactquery',
    swr: 'swr',
    axios: 'axios',
    apolloclient: 'apollographql',
    // Frontend — Styling
    tailwindcss: 'tailwindcss',
    sass: 'sass',
    styledcomponents: 'styledcomponents',
    emotion: 'emotion',
    unocss: 'unocss',
    // Frontend — UI Components
    antdesign: 'antdesign',
    lucidereact: 'lucide',
    framermotion: 'framer',
    // Frontend — Testing
    testinglibrary: 'testinglibrary',
    playwright: 'playwright',
    cypress: 'cypress',
    vitest: 'vitest',
    storybook: 'storybook',
    // Frontend — Build Tools
    webpack: 'webpack',
    esbuild: 'esbuild',
    rollup: 'rollupdotjs',
    parcel: 'parcel',
    // JavaScript backend
    express: 'express',
    fastify: 'fastify',
    hono: 'hono',
    nestjs: 'nestjs',
    koa: 'koa',
    prisma: 'prisma',
    drizzleorm: 'drizzle',
    typeorm: 'typeorm',
    sequelize: 'sequelize',
    mongoose: 'mongoose',
    jest: 'jest',
    mocha: 'mocha',
    winston: 'winston',
    zod: 'zod',
    passport: 'passport',
    jsonwebtoken: 'jsonwebtokens',
    // Python
    fastapi: 'fastapi',
    flask: 'flask',
    django: 'django',
    sqlalchemy: 'sqlalchemy',
    pytest: 'pytest',
    pydantic: 'pydantic',
    rich: 'rich',
    // Java
    springbootweb: 'spring',
    spring: 'spring',
    quarkusresteasy: 'quarkus',
    quarkus: 'quarkus',
    hibernateorm: 'hibernate',
    hibernate: 'hibernate',
    junit5: 'junit5',
    // PHP
    laravel: 'laravel',
    symfony: 'symfony',
    guzzle: 'guzzle',
    // Rust
    actixweb: 'actix',
    rocket: 'rocket',
    // Go
    gin: 'gin',
    fiber: 'gofiber',
    // C#
    serilog: 'serilog',
};

function getCategoryIconHtml(catName: string): string {
    const iconName = CATEGORY_ICONS[catName] ?? 'package';
    return `<img class="category-icon" src="${LUCIDE_CDN}/${iconName}.svg" alt="" width="18" height="18" aria-hidden="true">`;
}

function getLangIconHtml(langKey: string): string {
    const directUrl = LANG_ICON_URLS[langKey];
    const slug = LANG_ICONS[langKey];
    const src = directUrl ?? (slug ? `${DASHBOARD_ICONS_CDN}/${slug}.svg` : `${LUCIDE_CDN}/code.svg`);
    return `<img class="lang-icon" src="${src}" alt="" width="16" height="16" aria-hidden="true">`;
}

function getLibIconHtml(libName: string): string {
    const key = libName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const slug = LIB_ICON_SLUGS[key] ?? LIB_ICON_SLUGS[key.split(/[-_]/)[0]];
    const src = slug ? `${DASHBOARD_ICONS_CDN}/${slug}.svg` : `${LUCIDE_CDN}/package.svg`;
    return `<img class="lib-icon" src="${src}" alt="" width="16" height="16" aria-hidden="true" onerror="this.src='${LUCIDE_CDN}/package.svg'">`;
}

type LibEntry = { name: string; display?: string; badges: string[]; internal?: boolean };
type LangEntry = {
    label: string;
    emoji: string;
    manager: { name: string; cmd: string };
    categories: Record<string, LibEntry[]>;
};
type LangDataType = Record<string, LangEntry>;

let LANG_DATA: LangDataType = {};
// ============================================================================
// STATE
// ============================================================================

let selectedLang: string = 'javascript';
let selectedTool = 'maven';
let selectedLibs = new Set<string>();
let showInternalLibs = localStorage.getItem('lib-show-internal') === 'true';

// ============================================================================
// RENDER
// ============================================================================

function renderLangButtons() {
    const container = document.getElementById('langSelector');
    if (!container) return;
    container.innerHTML = '';
    for (const [key, lang] of Object.entries(LANG_DATA)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `os-btn${key === selectedLang ? ' active' : ''}`;
        btn.dataset.lang = key;
        btn.innerHTML = `${getLangIconHtml(key)} ${lang.label}`;
        btn.addEventListener('click', () => selectLang(key));
        container.appendChild(btn);
    }
}

function renderJavaToolSelector() {
    const selector = document.getElementById('javaToolSelector');
    if (!selector) return;
    selector.style.display = selectedLang === 'java' ? 'flex' : 'none';
    const btns = selector.querySelectorAll('.distro-btn');
    btns.forEach(btn => btn.classList.toggle('active', (btn as HTMLElement).dataset.tool === selectedTool));
}

function getOrderedCategories(categories: Record<string, LibEntry[]>): Array<[string, LibEntry[]]> {
    const entries = Object.entries(categories);
    const baseOrder: Record<string, number> = {};
    BASE_LIB_CATEGORIES.forEach((name, index) => {
        baseOrder[name] = index;
    });

    return entries.sort(([a], [b]) => {
        const ia = Object.prototype.hasOwnProperty.call(baseOrder, a) ? baseOrder[a] : Number.MAX_SAFE_INTEGER;
        const ib = Object.prototype.hasOwnProperty.call(baseOrder, b) ? baseOrder[b] : Number.MAX_SAFE_INTEGER;
        if (ia !== ib) return ia - ib;
        return a.localeCompare(b);
    });
}

function renderInternalToggleLabel() {
    const label = document.getElementById('internalToggleLabel');
    if (!label) return;
    label.textContent = showInternalLibs ? 'Hide internal' : 'Show internal';
}

function renderCategories() {
    const container = document.getElementById('libContainer');
    if (!container) return;
    const langData = LANG_DATA[selectedLang];
    container.innerHTML = '';

    for (const [catName, libs] of getOrderedCategories(langData.categories)) {
        const visibleLibs = libs.filter(lib => showInternalLibs || !lib.internal);
        if (visibleLibs.length === 0) continue;

        const column = document.createElement('div');
        column.className = 'column';

        const header = document.createElement('div');
        header.className = 'category-header';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'true');
        header.innerHTML = `
            <span class="category-icon-wrap">${getCategoryIconHtml(catName)}</span>
            <h4>${catName}</h4>
            <span class="toggle-arrow">▼</span>
        `;
        const toggleCollapse = () => {
            const collapsed = column.classList.toggle('collapsed');
            header.setAttribute('aria-expanded', String(!collapsed));
        };
        header.addEventListener('click', toggleCollapse);
        header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapse(); } });
        column.appendChild(header);

        const content = document.createElement('div');
        content.className = 'category-content';

        for (const lib of visibleLibs) {
            const label = document.createElement('label');
            label.className = 'lib-item';
            if (lib.internal) label.classList.add('lib-item-internal');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = lib.name;
            checkbox.checked = selectedLibs.has(lib.name);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) selectedLibs.add(lib.name);
                else selectedLibs.delete(lib.name);
                updateSelectAllState();
                updateCommand();
            });

            const nameSpan = document.createElement('span');
            nameSpan.className = 'lib-name';
            const displayName = (lib as { name: string; badges: string[]; display?: string }).display ?? lib.name;
            nameSpan.innerHTML = getLibIconHtml(displayName);
            nameSpan.appendChild(document.createTextNode(` ${displayName}`));

            const badgesDiv = document.createElement('div');
            badgesDiv.className = 'lib-badges';
            for (const badge of lib.badges) {
                const badgeSpan = document.createElement('span');
                badgeSpan.className = `badge badge-${badge}`;
                badgeSpan.textContent = badge;
                badgesDiv.appendChild(badgeSpan);
            }
            if (lib.internal) {
                const badgeSpan = document.createElement('span');
                badgeSpan.className = 'badge badge-internal';
                badgeSpan.textContent = 'internal';
                badgesDiv.appendChild(badgeSpan);
            }

            label.appendChild(checkbox);
            label.appendChild(nameSpan);
            label.appendChild(badgesDiv);
            content.appendChild(label);
        }

        column.appendChild(content);
        container.appendChild(column);
    }
}

function updateCommand() {
    const langData = LANG_DATA[selectedLang];
    const libs = Array.from(selectedLibs);
    const cmdEl = document.getElementById('installation-command');
    const langEl = document.getElementById('commandLanguage');
    const commandFooter = document.getElementById('commandFooter');
    if (!cmdEl || !langEl) return;

    if (libs.length === 0) {
        langEl.textContent = 'Install command:';
        cmdEl.textContent = 'Select libraries to generate install command...';
        if (commandFooter) commandFooter.hidden = true;
        return;
    }

    let managerLabel, cmd;

    if (selectedLang === 'java') {
        if (selectedTool === 'maven') {
            managerLabel = 'Java — Maven (pom.xml)';
            const deps = libs.map(lib => {
                const parts = lib.split(':');
                const groupId = parts[0];
                const artifactId = parts[1] ?? parts[0];
                return `<dependency>\n    <groupId>${groupId}</groupId>\n    <artifactId>${artifactId}</artifactId>\n</dependency>`;
            });
            cmd = `<!-- Add inside <dependencies> in pom.xml -->\n${deps.join('\n')}`;
        } else {
            managerLabel = 'Java — Gradle (build.gradle)';
            const deps = libs.map(lib => {
                const parts = lib.split(':');
                const groupId = parts[0];
                const artifactId = parts[1] ?? parts[0];
                return `implementation '${groupId}:${artifactId}'`;
            });
            cmd = `// Add inside dependencies { } in build.gradle\n${deps.join('\n')}`;
        }
    } else if (selectedLang === 'csharp') {
        managerLabel = 'C# — dotnet';
        cmd = libs.map(l => `dotnet add package ${l}`).join('\n');
    } else if (selectedLang === 'go') {
        managerLabel = 'Go — go get';
        cmd = `go get ${libs.map(l => `${l}@latest`).join(' ')}`;
    } else {
        managerLabel = `${langData.label} — ${langData.manager.name}`;
        cmd = `${langData.manager.cmd} ${libs.join(' ')}`;
    }

    langEl.textContent = managerLabel;
    cmdEl.textContent = cmd;
    if (commandFooter) commandFooter.hidden = false;
}

// ============================================================================
// ACTIONS
// ============================================================================

function selectLang(lang) {
    selectedLang = lang;
    selectedLibs.clear();
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    if (searchInput) searchInput.value = '';
    renderLangButtons();
    renderJavaToolSelector();
    renderCategories();
    updateSelectAllState();
    updateCommand();
}

function selectTool(tool) {
    selectedTool = tool;
    renderJavaToolSelector();
    updateCommand();
}

function setupSearch() {
    const input = document.getElementById('searchInput') as HTMLInputElement | null;
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        document.querySelectorAll('.lib-item').forEach(label => {
            const name = label.querySelector('.lib-name')?.textContent?.toLowerCase() ?? '';
            label.classList.toggle('search-hidden', q !== '' && !name.includes(q));
        });
        updateSelectAllState();
    });
}

function setupSelectAll() {
    const checkbox = document.getElementById('selectAllCheckbox') as HTMLInputElement | null;
    const labelSpan = document.getElementById('selectAllLabel');
    if (!checkbox) return;
    checkbox.addEventListener('change', () => {
        const visible = getVisibleLibCheckboxes();
        visible.forEach(cb => {
            cb.checked = checkbox.checked;
            if (cb.checked) selectedLibs.add(cb.value);
            else selectedLibs.delete(cb.value);
        });
        if (labelSpan) labelSpan.textContent = checkbox.checked ? 'Deselect' : 'Select';
        updateCommand();
    });
}

function updateSelectAllState() {
    const checkbox = document.getElementById('selectAllCheckbox') as HTMLInputElement | null;
    const labelSpan = document.getElementById('selectAllLabel');
    if (!checkbox) return;
    const visible = getVisibleLibCheckboxes();
    const allChecked = visible.length > 0 && visible.every(cb => cb.checked);
    checkbox.checked = allChecked;
    checkbox.indeterminate = !allChecked && visible.some(cb => cb.checked);
    if (labelSpan) labelSpan.textContent = allChecked ? 'Deselect' : 'Select';
}

function getVisibleLibCheckboxes(): HTMLInputElement[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>('.lib-item:not(.search-hidden) input[type="checkbox"]'));
}

function setupToggleAll() {
    const btn = document.getElementById('toggleAllBtn');
    const icon = document.getElementById('toggleAllIcon');
    const label = document.getElementById('toggleAllLabel');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const columns = document.querySelectorAll('#libContainer .column');
        const anyExpanded = Array.from(columns).some(col => !col.classList.contains('collapsed'));
        columns.forEach(col => col.classList.toggle('collapsed', anyExpanded));
        if (icon) icon.style.transform = anyExpanded ? 'rotate(-90deg)' : '';
        if (label) label.textContent = anyExpanded ? 'Expand' : 'Collapse';
    });
}

function setupOptionsSelect() {
    const sel = document.getElementById('optionsSelect') as HTMLSelectElement | null;
    if (!sel) return;
    sel.addEventListener('change', () => {
        const val = sel.value;
        sel.value = '';
        if (val === 'exportPackages') exportLibraries();
    });
}

function setupInternalToggle() {
    const btn = document.getElementById('internalToggleBtn');
    if (!btn) return;
    renderInternalToggleLabel();
    btn.addEventListener('click', () => {
        showInternalLibs = !showInternalLibs;
        localStorage.setItem('lib-show-internal', String(showInternalLibs));
        if (!showInternalLibs) {
            const selected = new Set<string>();
            for (const lang of Object.values(LANG_DATA)) {
                for (const libs of Object.values(lang.categories)) {
                    for (const lib of libs) {
                        if (lib.internal) selected.add(lib.name);
                    }
                }
            }
            selectedLibs = new Set(Array.from(selectedLibs).filter(lib => !selected.has(lib)));
        }
        renderInternalToggleLabel();
        renderCategories();
        updateSelectAllState();
        updateCommand();
    });
}

function exportLibraries() {
    const data = { language: selectedLang, libraries: Array.from(selectedLibs) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedLang}-libraries.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function setupCopyButton() {
    const btn = document.getElementById('copyCommandBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const text = document.getElementById('installation-command')?.textContent?.trim() ?? '';
        if (!text || text.startsWith('Select')) return;
        const doFeedback = () => {
            btn.textContent = '✅ Copied!';
            btn.classList.add('copied');
            setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
        };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(doFeedback).catch(() => fallbackCopy(text, doFeedback));
        } else {
            fallbackCopy(text, doFeedback);
        }
    });
}

function fallbackCopy(text, callback) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); callback(); } catch (_) { /* noop */ }
    document.body.removeChild(ta);
}

function setupJavaToolButtons() {
    document.querySelectorAll('#javaToolSelector .distro-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTool((btn as HTMLElement).dataset.tool ?? ''));
    });
}

// ============================================================================
// INIT
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
    const res = await fetch(`${base}pkgs/lib-pkgs.json`);
    LANG_DATA = await res.json();
    renderLangButtons();
    renderJavaToolSelector();
    renderCategories();
    updateCommand();
    setupCopyButton();
    setupJavaToolButtons();
    setupSearch();
    setupSelectAll();
    setupToggleAll();
    setupOptionsSelect();
    setupInternalToggle();
});