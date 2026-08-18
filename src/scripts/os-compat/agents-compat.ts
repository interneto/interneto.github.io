/**
 * AI Agents Compatibility Table
 * Shows which MCP servers, plugins, and skills work with each agent.
 * Follows the desktop-os-compatibility pattern (data.ts/state.ts/table.ts/interactions.ts)
 * but self-contained since agents have a simpler data model.
 */

export {}; // module scope

import { initConfigData } from '../shared/data-loader';
import { initTheme } from '../site/theme-manager';
import { onDOMReady } from '../shared/dom-utils';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const JSON_URL = `${BASE}pkgs/agents-pkgs.json`;

interface AgentEntry {
    name: string;
    type: string;
    category: string;
    description: string;
    agent_compat: { claude: boolean; codex: boolean; copilot?: boolean; npx?: boolean };
}

interface AgentsData {
    agents: Record<string, AgentEntry>;
}

interface TableItem {
    id: string;
    name: string;
    type: string;
    category: string;
    claude: boolean;
    codex: boolean;
    copilot: boolean;
    npx: boolean;
    isMcp: boolean;
}

// ---- State ----

let allItems: TableItem[] = [];
let filteredItems: TableItem[] = [];

interface SortState { column: string; direction: string; }
let sortState: SortState = { column: 'name', direction: 'asc' };
let activeFilter = 'all'; // 'all', 'mcp', 'plugin'
let searchTerm = '';

// ---- Data ----

function loadData(data: AgentsData): void {
    allItems = Object.entries(data.agents).map(([id, entry]) => ({
        id,
        name: entry.name,
        type: entry.type,
        category: entry.category || 'Other',
        claude: entry.agent_compat?.claude ?? false,
        codex: entry.agent_compat?.codex ?? false,
        copilot: entry.agent_compat?.copilot ?? false,
        npx: entry.agent_compat?.npx ?? false,
        isMcp: entry.type === 'MCP Server',
    }));
}

// ---- Filters & Sort ----

function applyFilters(): void {
    let items = [...allItems];

    // Search
    if (searchTerm) {
        items = items.filter(i =>
            `${i.name} ${i.category} ${i.type}`.toLowerCase().includes(searchTerm)
        );
    }

    // Type/agent filter
    if (activeFilter !== 'all') {
        if (activeFilter === 'mcp') items = items.filter(i => i.isMcp);
        else if (activeFilter === 'plugin') items = items.filter(i => !i.isMcp);
    }

    // Sort
    items.sort((a, b) => {
        let va = String(a[sortState.column as keyof TableItem] ?? '').toLowerCase();
        let vb = String(b[sortState.column as keyof TableItem] ?? '').toLowerCase();
        if (sortState.column === 'codex' || sortState.column === 'claude' || sortState.column === 'copilot' || sortState.column === 'npx') {
            va = a[sortState.column as keyof TableItem] ? '1' : '0';
            vb = b[sortState.column as keyof TableItem] ? '1' : '0';
        }
        return sortState.direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    filteredItems = items;
}

// ---- Rendering ----

const CHECK_SVG = '<svg viewBox="0 0 24 24"><polyline points="4 13 9 18 20 6"/></svg>';
const CROSS_SVG = '<svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';

function escapeHtml(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function statusIcon(available: boolean, label: string): string {
    const cls = available ? 'os-status os-status--yes' : 'os-status os-status--no';
    const icon = available ? CHECK_SVG : CROSS_SVG;
    return `<span class="${cls}" title="${label}">${icon}</span>`;
}

function renderTable(): void {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    if (filteredItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary);">No tools match your filters</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredItems.map(item => `
        <tr>
            <td class="sticky-col category-col">${escapeHtml(item.category)}</td>
            <td class="sticky-col app-col"><strong>${escapeHtml(item.name)}</strong></td>
            <td class="os-column">${statusIcon(item.claude, item.claude ? 'Compatible with Claude Code' : 'Not compatible with Claude Code')}</td>
            <td class="os-column">${statusIcon(item.codex, item.codex ? 'Compatible with Codex CLI' : 'Not compatible with Codex CLI')}</td>
            <td class="os-column">${statusIcon(item.copilot, item.copilot ? 'Compatible with GitHub Copilot CLI' : 'Not compatible with GitHub Copilot CLI')}</td>
            <td class="os-column">${statusIcon(item.npx, item.npx ? 'Compatible with NPX (any agent)' : 'Not compatible with NPX (any agent)')}</td>
        </tr>
    `).join('');
}

function updateStats(): void {
    const totalEl = document.getElementById('totalPackages');
    const mcpEl = document.getElementById('mcpCount');
    const pluginEl = document.getElementById('pluginCount');
    if (totalEl) totalEl.textContent = String(filteredItems.length);
    if (mcpEl) mcpEl.textContent = String(filteredItems.filter(i => i.isMcp).length);
    if (pluginEl) pluginEl.textContent = String(filteredItems.filter(i => !i.isMcp).length);
}

function updateFilterChips(): void {
    document.querySelectorAll<HTMLElement>('.filter-chip').forEach(btn => {
        const os = btn.getAttribute('data-os');
        const active = os === activeFilter;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
}

function updateSortArrows(): void {
    document.querySelectorAll<HTMLElement>('th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        th.setAttribute('aria-sort', 'none');
        const col = th.getAttribute('data-column');
        if (col === sortState.column) {
            th.classList.add(`sort-${sortState.direction}`);
            th.setAttribute('aria-sort', sortState.direction === 'asc' ? 'ascending' : 'descending');
        }
    });
}

function refreshUI(): void {
    applyFilters();
    renderTable();
    updateStats();
    updateFilterChips();
    updateSortArrows();
}

// ---- Interactions ----

function setupSorting(): void {
    document.querySelectorAll<HTMLElement>('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-column');
            if (!col) return;
            if (sortState.column === col) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = col;
                sortState.direction = 'asc';
            }
            refreshUI();
        });
    });
}

function setupFiltering(): void {
    document.querySelectorAll<HTMLElement>('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const os = btn.getAttribute('data-os');
            if (!os) return;
            activeFilter = os;
            refreshUI();
        });
    });
}

function setupSearch(): void {
    const input = document.getElementById('compatSearchInput') as HTMLInputElement | null;
    if (!input) return;
    let timer: ReturnType<typeof setTimeout>;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            searchTerm = input.value.trim().toLowerCase();
            refreshUI();
        }, 250);
    });
}

// ---- Init ----

async function init(): Promise<void> {
    try {
        initTheme();
        const tbody = document.getElementById('tableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Loading agents data...</td></tr>`;
        }

        await initConfigData();
        const res = await fetch(JSON_URL);
        if (!res.ok) throw new Error(`Failed to load: ${res.statusText}`);
        const data: AgentsData = await res.json();
        loadData(data);
        setupSorting();
        setupFiltering();
        setupSearch();
        refreshUI();
    } catch (err) {
        console.error('Agents compat init failed:', err);
        const tbody = document.getElementById('tableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--error-color, #e74c3c);"><strong>Error:</strong> Failed to load agents data.</td></tr>`;
        }
    }
}

onDOMReady(init);