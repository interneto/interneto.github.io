/**
 * Agents App — AI Agents Installer
 *
 * Shows all MCP servers, plugins, and skills filtered by agent + type.
 * Checkboxes + CommandFooter generate a single bulk install command
 * for the selected agent (Claude Code / Codex CLI).
 */

import { initConfigData } from '../shared/data-loader';
import { CLASS_NAMES, EVENT_NAMES } from '../shared/dom-constants';
import { getElement, onDOMReady } from '../shared/dom-utils';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const JSON_URL = `${BASE}pkgs/agents-pkgs.json`;

interface AgentInstall { agent: string; cmd: string; }
interface AgentEntry {
    name: string; type: string; category: string; description: string;
    agent_compat: { claude: boolean; codex: boolean; copilot?: boolean; npx?: boolean };
    installs: AgentInstall[]; url: string;
}
interface AgentsData { agents: Record<string, AgentEntry>; }

let allAgents: Array<{ id: string } & AgentEntry> = [];
let activeAgent: 'claude' | 'codex' | 'copilot' | 'npx' = 'claude';
let activeFilter: 'all' | 'mcp' | 'plugin' = 'all';
let searchTerm = '';
let checkedIds: Set<string> = new Set();

async function loadData(): Promise<void> {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
    const data: AgentsData = await res.json();
    allAgents = Object.entries(data.agents).map(([id, entry]) => ({ id, ...entry }));
}

function getCatEmoji(cat: string): string {
    const m: Record<string, string> = {
        Core: '🔧', Development: '💻', 'Cloud/DevOps': '☁️', Creative: '🎨',
        'DAW/Music': '🎵', Design: '🖌️', Productivity: '📋', Search: '🔍',
        Research: '📚', Marketing: '📢', Bookmarks: '🔖', Services: '⚡',
        'Plugin/Agent': '🧩',
    };
    return m[cat] || '📦';
}

function renderLabel(id: string, agent: typeof allAgents[0], available: boolean): string {
    const isMcp = agent.type === 'MCP Server';
    const icon = isMcp ? '🔌' : '🧩';
    const tag = isMcp ? 'MCP' : 'Plugin';
    const tagCls = isMcp ? 'mcp' : 'plugin';
    const labelCls = available ? 'pkg-label' : `pkg-label ${CLASS_NAMES.DISTRO_HIDDEN}`;
    return `
    <label class="${labelCls}" data-id="${id}" data-search="${esc((agent.name + ' ' + agent.category + ' ' + tag).toLowerCase())}">
        <input type="checkbox" name="pkg" value="${id}" class="${CLASS_NAMES.PACKAGE_CHECKBOX}" ${available ? '' : 'disabled'}>
        <span class="pkg-icon-wrap">${icon}</span>
        <span class="pkg-name-label">${esc(agent.name)}</span>
        <span class="pkg-type-tag ${tagCls}">${tag}</span>
    </label>`;
}

function esc(s: string): string { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function generatePackages(): void {
    const container = getElement('PACKAGE_CONTAINER');
    if (!container) return;

    // Save checked state before re-render
    checkedIds = new Set(
        Array.from(document.querySelectorAll<HTMLInputElement>('input[name="pkg"]:checked')).map(c => c.value)
    );

    let items = allAgents.slice();
    if (activeFilter === 'mcp') items = items.filter(a => a.type === 'MCP Server');
    else if (activeFilter === 'plugin') items = items.filter(a => a.type !== 'MCP Server');
    if (searchTerm) {
        const q = searchTerm;
        items = items.filter(a => `${a.name} ${a.category} ${a.type}`.toLowerCase().includes(q));
    }

    const grouped: Record<string, typeof items> = {};
    for (const a of items) {
        const cat = a.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(a);
    }
    const sortedCats = Object.keys(grouped).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    let html = '';
    for (const cat of sortedCats) {
        const agents = grouped[cat];
        html += `<div class="${CLASS_NAMES.CATEGORY}">
            <div class="${CLASS_NAMES.CATEGORY_HEADER}" role="button" tabindex="0" aria-expanded="true">
                <span class="toggle-arrow">▼</span>
                <input type="checkbox" class="${CLASS_NAMES.CATEGORY_CHECKBOX}" data-category="${esc(cat)}">
                <span class="${CLASS_NAMES.CATEGORY_EMOJI}">${getCatEmoji(cat)}</span>
                <h4>${esc(cat)}</h4>
                <span class="${CLASS_NAMES.CATEGORY_BADGE}">${agents.length}</span>
            </div>
            <div class="${CLASS_NAMES.CATEGORY_CONTENT}">
                ${agents.map(a => renderLabel(a.id, a, !!a.agent_compat?.[activeAgent])).join('')}
            </div>
        </div>`;
    }
    container.innerHTML = html || '<p class="no-results" style="text-align:center;padding:2rem;color:var(--text-secondary);">No agents match your filters.</p>';

    // Restore checked state (skip items disabled for the active agent)
    document.querySelectorAll<HTMLInputElement>('input[name="pkg"]').forEach(c => {
        if (checkedIds.has(c.value) && !c.disabled) c.checked = true;
    });

    setupCategoryCheckboxes();
    updateAllCategoryCheckboxes();
    updateSelectAllState();
    autoGenerateCommand();
}

function setupAgentSelector(): void {
    const selector = document.querySelector('.primary-os-selector');
    if (!selector) return;
    const btns = selector.querySelectorAll<HTMLElement>('.os-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const agent = btn.dataset.agent as 'claude' | 'codex' | 'copilot' | 'npx';
            if (!agent) return;
            activeAgent = agent;
            btns.forEach(b => { b.classList.remove(CLASS_NAMES.ACTIVE); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add(CLASS_NAMES.ACTIVE);
            btn.setAttribute('aria-pressed', 'true');
            generatePackages();
        });
    });
}

function setupFilterChips(): void {
    const chips = document.querySelectorAll<HTMLElement>('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filter = chip.dataset.filter as 'all' | 'mcp' | 'plugin';
            if (!filter) return;
            activeFilter = filter;
            chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
            chip.classList.add('active');
            chip.setAttribute('aria-pressed', 'true');
            generatePackages();
        });
    });
}

function setupSearchInput(): void {
    const input = getElement('SEARCH_INPUT') as HTMLInputElement | null;
    const container = getElement('PACKAGE_CONTAINER');
    if (!input || !container) return;
    let timer: ReturnType<typeof setTimeout>;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            searchTerm = input.value.trim().toLowerCase();
            container.querySelectorAll<HTMLLabelElement>('label.pkg-label').forEach(l => {
                const txt = l.dataset.search || '';
                l.classList.toggle(CLASS_NAMES.SEARCH_HIDDEN, !!searchTerm && !txt.includes(searchTerm));
            });
            const vl = 'label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + ')';
            container.querySelectorAll<HTMLElement>('.' + CLASS_NAMES.CATEGORY).forEach(c => {
                c.classList.toggle(CLASS_NAMES.SEARCH_HIDDEN, !c.querySelector(vl));
            });
            updateAllCategoryCheckboxes();
            updateSelectAllState();
            autoGenerateCommand();
        }, 150);
    });
}

function setupCategoryCheckboxes(): void {
    document.querySelectorAll<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX).forEach(cb => {
        const nc = cb.cloneNode(true) as HTMLInputElement;
        cb.parentNode?.replaceChild(nc, cb);
        nc.addEventListener('click', (e) => {
            e.stopPropagation();
            const cat = nc.dataset.category;
            document.querySelectorAll<HTMLLabelElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + '):not(.' + CLASS_NAMES.DISTRO_HIDDEN + ')').forEach(l => {
                const p = l.closest('.' + CLASS_NAMES.CATEGORY);
                if (p) {
                    const cc = p.querySelector<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX);
                    if (cc?.dataset.category === cat) {
                        const c = l.querySelector<HTMLInputElement>('.' + CLASS_NAMES.PACKAGE_CHECKBOX);
                        if (c) c.checked = nc.checked;
                    }
                }
            });
            updateCategoryCheckbox(cat);
            updateSelectAllState();
            document.dispatchEvent(new CustomEvent(EVENT_NAMES.SELECTION_CHANGED));
            autoGenerateCommand();
        });
    });
    document.querySelectorAll('.' + CLASS_NAMES.CATEGORY_HEADER).forEach(header => {
        header.addEventListener('click', (e) => {
            if ((e.target as HTMLInputElement).type === 'checkbox') return;
            const catDiv = (header as HTMLElement).closest('.' + CLASS_NAMES.CATEGORY);
            if (catDiv) catDiv.classList.toggle(CLASS_NAMES.COLLAPSED);
        });
    });
}

function updateCategoryCheckbox(category?: string): void {
    const cb = document.querySelector<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX + '[data-category="' + (category || '') + '"]');
    if (!cb) return;
    const catEl = cb.closest('.' + CLASS_NAMES.CATEGORY);
    if (!catEl) return;
    const cbs = catEl.querySelectorAll<HTMLInputElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + '):not(.' + CLASS_NAMES.DISTRO_HIDDEN + ') input.' + CLASS_NAMES.PACKAGE_CHECKBOX);
    const ch = Array.from(cbs).filter(c => c.checked);
    if (ch.length === 0) { cb.checked = false; cb.indeterminate = false; }
    else if (ch.length === cbs.length) { cb.checked = true; cb.indeterminate = false; }
    else { cb.checked = false; cb.indeterminate = true; }
}

function updateAllCategoryCheckboxes(): void {
    document.querySelectorAll<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX).forEach(cb => updateCategoryCheckbox(cb.dataset.category));
}

function updateSelectAllState(): void {
    const sa = getElement('SELECT_ALL_CHECKBOX') as HTMLInputElement | null;
    const lb = getElement('SELECT_ALL_LABEL');
    if (!sa || !lb) return;
    const vis = document.querySelectorAll<HTMLInputElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + '):not(.' + CLASS_NAMES.DISTRO_HIDDEN + ') input.' + CLASS_NAMES.PACKAGE_CHECKBOX);
    const ch = Array.from(vis).filter(c => c.checked);
    if (ch.length === 0) { sa.indeterminate = false; sa.checked = false; lb.textContent = 'Select'; }
    else if (ch.length === vis.length) { sa.indeterminate = false; sa.checked = true; lb.textContent = 'Deselect'; }
    else { sa.indeterminate = true; lb.textContent = 'Selected'; }
}

function autoGenerateCommand(): void {
    const footer = document.getElementById('commandFooter');
    const cmdEl = getElement('INSTALLATION_COMMAND');
    const cntEl = document.getElementById('pkgCount');
    if (!cmdEl) return;

    const vis = document.querySelectorAll<HTMLInputElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + ') input[name="pkg"]:checked');
    const ids = Array.from(vis).map(c => c.value);
    const total = document.querySelectorAll<HTMLInputElement>('input[name="pkg"]:checked').length;
    if (cntEl) cntEl.textContent = total > 0 ? `${total} selected` : '';

    if (ids.length === 0) {
        cmdEl.textContent = 'Select tools to generate install commands...';
        if (footer) footer.hidden = true;
        return;
    }

    const lines: string[] = [];
    for (const id of ids) {
        const e = allAgents.find(a => a.id === id);
        if (!e) continue;
        const inst = e.installs?.find(i => i.agent === activeAgent) || e.installs?.find(i => i.agent === '') || e.installs?.[0];
        if (inst?.cmd) {
            // Join multi-step commands with && so each package is one line
            lines.push(inst.cmd.replace(/\n/g, ' && '));
        }
    }

    cmdEl.textContent = lines.join('\n');
    if (footer) footer.hidden = false;
}

function setupAutoCommandGeneration(): void {
    document.addEventListener('change', (e) => {
        const t = e.target as HTMLInputElement | null;
        if (t?.type === 'checkbox' && t.classList.contains(CLASS_NAMES.PACKAGE_CHECKBOX)) {
            const cat = t.closest('.' + CLASS_NAMES.CATEGORY);
            if (cat) {
                const ci = cat.querySelector<HTMLInputElement>('.' + CLASS_NAMES.CATEGORY_CHECKBOX);
                if (ci) updateCategoryCheckbox(ci.dataset.category);
            }
            updateSelectAllState();
            autoGenerateCommand();
        }
    });
}

function setupSelectAllCheckbox(): void {
    const sa = getElement('SELECT_ALL_CHECKBOX') as HTMLInputElement | null;
    if (!sa) return;
    sa.addEventListener('change', () => {
        document.querySelectorAll<HTMLInputElement>('label.pkg-label:not(.' + CLASS_NAMES.SEARCH_HIDDEN + '):not(.' + CLASS_NAMES.DISTRO_HIDDEN + ') input.' + CLASS_NAMES.PACKAGE_CHECKBOX).forEach(c => c.checked = sa.checked);
        updateAllCategoryCheckboxes();
        updateSelectAllState();
        autoGenerateCommand();
    });
}

function setupToggleAllButton(): void {
    const btn = getElement('TOGGLE_ALL_BTN');
    const lbl = getElement('TOGGLE_ALL_LABEL');
    if (!btn) return;
    let collapsed = true;
    if (lbl) lbl.textContent = 'Expand';
    btn.addEventListener('click', () => {
        collapsed = !collapsed;
        document.querySelectorAll('.' + CLASS_NAMES.CATEGORY).forEach(c => c.classList.toggle(CLASS_NAMES.COLLAPSED, collapsed));
        if (lbl) lbl.textContent = collapsed ? 'Expand' : 'Collapse';
    });
}

function setupCopyButton(): void {
    const cb = getElement('COPY_COMMAND_BTN');
    if (!cb) return;
    cb.addEventListener('click', async () => {
        const t = getElement('INSTALLATION_COMMAND')?.textContent;
        if (!t || t.startsWith('Select')) return;
        try { await navigator.clipboard.writeText(t); cb.textContent = '✓ Copied!'; setTimeout(() => { cb.textContent = '📋 Copy'; }, 2000); } catch {}
    });
}

function setupCopyListButton(): void {
    const btn = document.getElementById('copyListBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const ids = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="pkg"]:checked')).map(c => c.value);
        const names = ids.map(id => allAgents.find(a => a.id === id)?.name || id).join('\n');
        if (!names) return;
        try { await navigator.clipboard.writeText(names); btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = '📝 Names'; }, 2000); } catch {}
    });
}

async function init(): Promise<void> {
    try {
        await initConfigData();
        await loadData();
        generatePackages();
        setupAgentSelector();
        setupFilterChips();
        setupSearchInput();
        setupSelectAllCheckbox();
        setupToggleAllButton();
        setupAutoCommandGeneration();
        setupCopyButton();
        setupCopyListButton();
        setTimeout(() => {
            document.querySelectorAll('.' + CLASS_NAMES.CATEGORY).forEach(c => c.classList.add(CLASS_NAMES.COLLAPSED));
        }, 50);
    } catch (err) {
        console.error('Agents init failed:', err);
        const c = getElement('PACKAGE_CONTAINER');
        if (c) c.innerHTML = '<p class="error-message">Failed to load agents data.</p>';
    }
}

onDOMReady(init);