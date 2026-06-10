/**
 * Library Installer
 * Select libraries by language/category and generate install command.
 */

// ============================================================================
// DATA
// ============================================================================

import {
    initConfigData,
    getLibBaseCategories,
    getLibCategoryIcons,
    getLibIcons,
} from '../shared/data-loader';
import { PATHS } from '../shared/paths';

const LIB_LOCAL_BASE = `${PATHS.BASE}img/software/lib/`;

// For a given slug, try the local copy first, then the remote CDN, then the lucide fallback.
// We do this with chained onerror handlers so non-existent locals fall through silently.
function buildIconSrcChain(slug: string | undefined, fallbackIcon: string): { src: string; onerror: string } {
    const { cdn } = getLibIcons();
    const lucideFallback = `${cdn.lucide}/${fallbackIcon}.svg`;
    if (!slug) return { src: lucideFallback, onerror: '' };
    const local = `${LIB_LOCAL_BASE}${slug}.svg`;
    const remote = `${cdn.dashboardIcons}/${slug}.svg`;
    // local 404 → try remote; remote 404 → fall back to lucide package
    const onerror = `this.onerror=function(){this.onerror=null;this.src='${lucideFallback}';};this.src='${remote}';`;
    return { src: local, onerror };
}

function getCategoryIconHtml(catName: string): string {
    const { cdn } = getLibIcons();
    const iconName = getLibCategoryIcons()[catName] ?? 'package';
    return `<img class="category-icon" src="${cdn.lucide}/${iconName}.svg" alt="" width="18" height="18" aria-hidden="true">`;
}

function getLangIconHtml(langKey: string): string {
    const { languages } = getLibIcons();
    const entry = languages[langKey];
    if (entry?.url) {
        return `<img class="lang-icon" src="${entry.url}" alt="" width="16" height="16" aria-hidden="true">`;
    }
    const { src, onerror } = buildIconSrcChain(entry?.slug, 'code');
    const onerrorAttr = onerror ? ` onerror="${onerror}"` : '';
    return `<img class="lang-icon" src="${src}" alt="" width="16" height="16" aria-hidden="true"${onerrorAttr}>`;
}

function getLibIconHtml(libName: string): string {
    const { libraries } = getLibIcons();
    const key = libName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const slug = libraries[key] ?? libraries[key.split(/[-_]/)[0]];
    const { src, onerror } = buildIconSrcChain(slug, 'package');
    const onerrorAttr = onerror ? ` onerror="${onerror}"` : '';
    return `<img class="lib-icon" src="${src}" alt="" width="16" height="16" aria-hidden="true"${onerrorAttr}>`;
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
    getLibBaseCategories().forEach((name, index) => {
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
        // CSS lives under .category.collapsed in generator.css — both classes required.
        column.className = 'column category';

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

    let managerLabel: string;
    let cmd: string;

    if (selectedLang === 'java') {
        if (selectedTool === 'maven') {
            managerLabel = 'Java — Maven (pom.xml)';
            const deps = libs.map(lib => {
                const parts = lib.split(':');
                const groupId = parts[0];
                const artifactId = parts[1] ?? parts[0];
                return `<dependency>\n    <groupId>${groupId}</groupId>\n    <artifactId>${artifactId}</artifactId>\n    <version>LATEST</version>\n</dependency>`;
            });
            cmd = `<!-- Add inside <dependencies> in pom.xml -->\n${deps.join('\n')}`;
        } else {
            managerLabel = 'Java — Gradle (build.gradle)';
            const deps = libs.map(lib => {
                const parts = lib.split(':');
                const groupId = parts[0];
                const artifactId = parts[1] ?? parts[0];
                return `implementation '${groupId}:${artifactId}:+'`;
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

function selectLang(lang: string) {
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

function selectTool(tool: string) {
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

function fallbackCopy(text: string, callback: () => void) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    // execCommand is deprecated but remains the only synchronous clipboard fallback
    // for browsers without the async Clipboard API (which is preferred above).
    const legacyDocument = document as unknown as { execCommand(commandId: string): boolean };
    try { legacyDocument.execCommand('copy'); callback(); } catch { /* noop */ }
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
    await initConfigData();
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