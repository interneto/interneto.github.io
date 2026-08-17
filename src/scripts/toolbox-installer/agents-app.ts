/**
 * Agents App — AI Agents Installer
 *
 * Reuses the desktop installer UI patterns (checkboxes, category toggles,
 * search, CommandFooter with copy buttons) but generates agent install
 * commands (Claude Code / Codex CLI) from each agent entry's `installs[]`.
 */

import { initConfigData, getCategoryEmojis } from '../shared/data-loader';
import { initFavoritesData, getFavoritesForCurrentPage } from '../shared/favorites-store';
import { CLASS_NAMES, EVENT_NAMES } from '../shared/dom-constants';
import { getElement, onDOMReady } from '../shared/dom-utils';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const JSON_URL = `${BASE}pkgs/agents-pkgs.json`;

interface AgentInstall {
    agent: string;
    cmd: string;
}

interface AgentEntry {
    name: string;
    type: string;
    category: string;
    description: string;
    agent_compat: { claude: boolean; codex: boolean };
    installs: AgentInstall[];
    url: string;
}

interface AgentsData {
    agents: Record<string, AgentEntry>;
}

// ---- State ----
let allAgents: Array<{ id: string } & AgentEntry> = [];
let searchTerm = '';
let favorites: string[] = [];

// ─── Data Loading ───────────────────────────────────────────────────────────

async function loadData(): Promise<void> {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(`Failed to load agents: ${res.statusText}`);
    const data: AgentsData = await res.json();
    allAgents = Object.entries(data.agents).map(([id, entry]) => ({ id, ...entry }));
}

// ─── Category Emoji ──────────────────────────────────────────────────────────

function getCatEmoji(cat: string): string {
    const map: Record<string, string> = {
        'Core': '🔧', 'Development': '💻', 'Cloud/DevOps': '☁️', 'Creative': '🎨',
        'DAW/Music': '🎵', 'Design': '🖌️', 'Productivity': '📋', 'Search': '🔍',
        'Research': '📚', 'Marketing': '📢', 'Bookmarks': '🔖', 'Services': '⚡',
        'MCP': '🔌', 'Plugin/Agent': '🧩',
    };
    return map[cat] || '📦';
}

// ─── UI Builder ──────────────────────────────────────────────────────────────

function generatePackages(): void {
    const container = getElement('PACKAGE_CONTAINER');
    if (!container) return;

    // Show ALL agents (no agent filter)
    let items = allAgents;
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        items = items.filter(a => `${a.name} ${a.category} ${a.type}`.toLowerCase().includes(q));
    }

    // Group by category
    const grouped: Record<string, typeof items> = {};
    for (const a of items) {
        const cat = a.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(a);
    }

    const sortedCats = Object.keys(grouped).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    const favSet = new Set(favorites);

    let html = '';
    for (const cat of sortedCats) {
        const agents = grouped[cat];

        html += `
        <div class="${CLASS_NAMES.CATEGORY}">
            <div class="${CLASS_NAMES.CATEGORY_HEADER}" role="button" tabindex="0" aria-expanded="true">
                <input type="checkbox" class="${CLASS_NAMES.CATEGORY_CHECKBOX}" data-category="${escapeHtml(cat)}">
                <span class="${CLASS_NAMES.CATEGORY_EMOJI}">${getCatEmoji(cat)}</span>
                <h4>${escapeHtml(cat)}</h4>
                <span class="${CLASS_NAMES.CATEGORY_BADGE}">${agents.length}</span>
            </div>
            <div class="${CLASS_NAMES.CATEGORY_CONTENT}">
                ${agents.map(a => renderPackage(a.id, a, favSet)).join('')}
            </div>
        </div>`;
    }

    container.innerHTML = html || '<p class="no-results" style="text-align:center;padding:2rem;color:var(--text-secondary);">No agents match your filters.</p>';

    // Wire category checkboxes
    setupCategoryCheckboxes();
    updateAllCategoryCheckboxes();
    updateSelectAllState();
    autoGenerateCommand();
}

function renderPackage(id: string, agent: typeof allAgents[0], favSet: Set<string>): string {
    const isFav = favSet.has(id);
    const isMcp = agent.type === 'MCP Server';
    const icon = isMcp ? '🔌' : '🧩';
    const tag = isMcp ? 'MCP' : 'Plugin';
    const tagClass = isMcp ? 'mcp' : 'plugin';

    return `
    <label class="pkg-label" data-id="${id}" data-search="${escapeHtml((agent.name + ' ' + agent.category + ' ' + tag).toLowerCase())}">
        <input type="checkbox" name="pkg" value="${id}" class="${CLASS_NAMES.PACKAGE_CHECKBOX}" ${isFav ? 'checked' : ''}>
        <span class="pkg-icon-wrap">${icon}</span>
        <span class="pkg-name-label">${escapeHtml(agent.name)}</span>
        <span class="pkg-type-tag ${tagClass}">${tag}</span>
    </label>`;
}

function escapeHtml(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// ─── Search ──────────────────────────────────────────────────────────────────

function setupSearchInput(): void {
    const input = getElement('SEARCH_INPUT') as HTMLInputElement | null;
    const container = getElement('PACKAGE_CONTAINER');
    if (!input || !container) return;

    let timer: ReturnType<typeof setTimeout>;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            searchTerm = input.value.trim().toLowerCase();

            if (!searchTerm) {
                const labels = container.querySelectorAll<HTMLLabelElement>('label.pkg-label');
                labels.forEach(l => l.classList.remove(CLASS_NAMES.SEARCH_HIDDEN));
            } else {
                const labels = container.querySelectorAll<HTMLLabelElement>('label.pkg-label');
                labels.forEach(l => {
                    const text = l.dataset.search || '';
                    l.classList.toggle(CLASS_NAMES.SEARCH_HIDDEN, !text.includes(searchTerm));
                });
            }

            updateSearchGroupVisibility();
            updateAllCategoryCheckboxes();
            updateSelectAllState();
            autoGenerateCommand();
        }, 150);
    });
}

function updateSearchGroupVisibility(): void {
    const container = getElement('PACKAGE_CONTAINER');
    if (!container) return;
    const visibleLabel = 'label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + ')';
    const cats = container.querySelectorAll<HTMLElement>('.' + CLASS_NAMES.CATEGORY);
    cats.forEach(cat => {
        const hasVisible = !!cat.querySelector(visibleLabel);
        cat.classList.toggle(CLASS_NAMES.SEARCH_HIDDEN, !hasVisible);
    });
}

// ─── Checkbox Manager (inline, self-contained) ──────────────────────────────

function setupCategoryCheckboxes(): void {
    document.querySelectorAll<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX).forEach(cb => {
        // Remove old listeners by replacing
        const newCb = cb.cloneNode(true) as HTMLInputElement;
        cb.parentNode?.replaceChild(newCb, cb);
        newCb.addEventListener('click', (e) => {
            e.stopPropagation();
            const cat = newCb.dataset.category;
            const pkgs = document.querySelectorAll<HTMLInputElement>('label.pkg-label[' + attrEsc('data-id') + '] input.' + CLASS_NAMES.PACKAGE_CHECKBOX);
            const inCat: HTMLInputElement[] = [];
            pkgs.forEach(p => {
                const label = p.closest<HTMLElement>('.' + CLASS_NAMES.CATEGORY);
                if (label && label.querySelector('.' + CLASS_NAMES.CATEGORY_HEADER + ' input')?.dataset.category === cat) {
                    inCat.push(p);
                }
            });
            inCat.forEach(p => p.checked = newCb.checked);
            updateCategoryCheckbox(cat);
            updateSelectAllState();
            document.dispatchEvent(new CustomEvent(EVENT_NAMES.SELECTION_CHANGED));
            autoGenerateCommand();
        });
    });
}

function updateCategoryCheckbox(category?: string): void {
    const cb = document.querySelector<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX + '[data-category="' + attrEsc(category || '') + '"]');
    if (!cb) return;
    const catEl = cb.closest('.' + CLASS_NAMES.CATEGORY);
    if (!catEl) return;
    const checkboxes = catEl.querySelectorAll<HTMLInputElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + ') input.' + CLASS_NAMES.PACKAGE_CHECKBOX);
    const checked = Array.from(checkboxes).filter(c => c.checked);
    if (checked.length === 0) { cb.checked = false; cb.indeterminate = false; }
    else if (checked.length === checkboxes.length) { cb.checked = true; cb.indeterminate = false; }
    else { cb.checked = false; cb.indeterminate = true; }
}

function updateAllCategoryCheckboxes(): void {
    document.querySelectorAll<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX).forEach(cb => updateCategoryCheckbox(cb.dataset.category));
}

function updateSelectAllState(): void {
    const selectAll = getElement('SELECT_ALL_CHECKBOX') as HTMLInputElement | null;
    const label = getElement('SELECT_ALL_LABEL');
    if (!selectAll || !label) return;
    const visible = document.querySelectorAll<HTMLInputElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + ') input.' + CLASS_NAMES.PACKAGE_CHECKBOX);
    const checked = Array.from(visible).filter(c => c.checked);
    if (checked.length === 0) { selectAll.indeterminate = false; selectAll.checked = false; label.textContent = 'Select'; }
    else if (checked.length === visible.length) { selectAll.indeterminate = false; selectAll.checked = true; label.textContent = 'Deselect'; }
    else { selectAll.indeterminate = true; label.textContent = 'Selected'; }
}

function attrEsc(s: string): string {
    return s.replace(/["\\]/g, '');
}

// ─── Command Generation ─────────────────────────────────────────────────────

function autoGenerateCommand(): void {
    const footer = document.getElementById('commandFooter');
    const cmdEl = getElement('INSTALLATION_COMMAND');
    const countEl = document.getElementById('pkgCount');
    if (!cmdEl) return;

    const visible = document.querySelectorAll<HTMLInputElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + ') input[name="pkg"]:checked');
    const ids = Array.from(visible).map(c => c.value);
    const totalChecked = document.querySelectorAll<HTMLInputElement>('input[name="pkg"]:checked').length;

    if (countEl) countEl.textContent = totalChecked > 0 ? `${totalChecked} selected` : '';

    if (ids.length === 0) {
        cmdEl.textContent = 'Select tools to generate install commands...';
        if (footer) footer.hidden = true;
        return;
    }

    // Build commands: prefer claude, then codex, then any
    const lines: string[] = [];
    for (const id of ids) {
        const entry = allAgents.find(a => a.id === id);
        if (!entry) continue;
        const install = entry.installs?.find(i => i.agent === 'claude')
            || entry.installs?.find(i => i.agent === 'codex')
            || entry.installs?.[0];
        if (install?.cmd) {
            lines.push(`# ${entry.name}\n${install.cmd}`);
        } else {
            lines.push(`# ${entry.name}\n# No install command available`);
        }
    }

    cmdEl.textContent = lines.join('\n\n');
    if (footer) footer.hidden = false;
}

function setupAutoCommandGeneration(): void {
    document.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement | null;
        if (target?.type === 'checkbox' && target.classList.contains(CLASS_NAMES.PACKAGE_CHECKBOX)) {
            const cat = target.closest('.' + CLASS_NAMES.CATEGORY);
            if (cat) {
                const cbInput = cat.querySelector<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX);
                if (cbInput) updateCategoryCheckbox(cbInput.dataset.category);
            }
            updateSelectAllState();
            autoGenerateCommand();
        }
    });
}

function setupSelectAllCheckbox(): void {
    const selectAll = getElement('SELECT_ALL_CHECKBOX') as HTMLInputElement | null;
    if (!selectAll) return;
    selectAll.addEventListener('change', () => {
        const checked = selectAll.checked;
        document.querySelectorAll<HTMLInputElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + ') input.' + CLASS_NAMES.PACKAGE_CHECKBOX).forEach(cb => cb.checked = checked);
        updateAllCategoryCheckboxes();
        updateSelectAllState();
        autoGenerateCommand();
    });
}

function setupToggleAllButton(): void {
    const btn = getElement('TOGGLE_ALL_BTN');
    const label = getElement('TOGGLE_ALL_LABEL');
    if (!btn) return;
    let allCollapsed = false;
    btn.addEventListener('click', () => {
        allCollapsed = !allCollapsed;
        document.querySelectorAll('.' + CLASS_NAMES.CATEGORY).forEach(c => c.classList.toggle(CLASS_NAMES.COLLAPSED, allCollapsed));
        if (label) label.textContent = allCollapsed ? 'Expand' : 'Collapse';
    });
}

function setupCopyButton(): void {
    const copyBtn = getElement('COPY_COMMAND_BTN');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', async () => {
        const cmdEl = getElement('INSTALLATION_COMMAND');
        const text = cmdEl?.textContent;
        if (!text || text.startsWith('Select')) return;
        try {
            await navigator.clipboard.writeText(text);
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
        } catch { /* ignore */ }
    });
}

function setupCopyListButton(): void {
    const btn = document.getElementById('copyListBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const ids = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="pkg"]:checked')).map(c => c.value);
        const names = ids.map(id => allAgents.find(a => a.id === id)?.name || id).join('\n');
        if (!names) return;
        try {
            await navigator.clipboard.writeText(names);
            btn.textContent = '✓ Copied!';
            setTimeout(() => { btn.textContent = '📝 Names'; }, 2000);
        } catch { /* ignore */ }
    });
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
    try {
        await initConfigData();
        await initFavoritesData();
        favorites = getFavoritesForCurrentPage();
        await loadData();

        generatePackages();
        setupSearchInput();
        setupSelectAllCheckbox();
        setupToggleAllButton();
        setupAutoCommandGeneration();
        setupCopyButton();
        setupCopyListButton();

        // Collapse all categories on load for compact view
        setTimeout(() => {
            document.querySelectorAll('.' + CLASS_NAMES.CATEGORY).forEach(c => c.classList.add(CLASS_NAMES.COLLAPSED));
            const toggleLabel = getElement('TOGGLE_ALL_LABEL');
            if (toggleLabel) toggleLabel.textContent = 'Expand';
        }, 100);
    } catch (err) {
        console.error('Agents installer init failed:', err);
        const container = getElement('PACKAGE_CONTAINER');
        if (container) container.innerHTML = '<p class="error-message">Failed to load agents data. Please refresh the page.</p>';
    }
}

onDOMReady(init);