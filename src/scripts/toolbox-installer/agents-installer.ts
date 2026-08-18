/**
 * AI Agents Installer — browse MCP servers, plugins, and skills
 * for Claude Code, Codex CLI, Hermes Agent, and friends.
 *
 * Mirrors the vscode extensions installer pattern (packages-table.ts)
 * but renders agent install commands grouped by category.
 */

import { initConfigData } from '../shared/data-loader';
import { initFavoritesData } from '../shared/favorites-store';
import { initTheme } from '../site/theme-manager';
import { onDOMReady } from '../shared/dom-utils';

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

// State
let allAgents: Array<{ id: string } & AgentEntry> = [];
let filteredAgents: Array<{ id: string } & AgentEntry> = [];
let favorites: Set<string> = new Set();
let searchTerm = '';

// ---- Data Loading ----

async function loadData(): Promise<void> {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(`Failed to load agents: ${res.statusText}`);
    const data: AgentsData = await res.json();
    allAgents = Object.entries(data.agents).map(([id, entry]) => ({ id, ...entry }));
    filteredAgents = [...allAgents];
}

// ---- Rendering ----

function render(): void {
    const container = document.getElementById('agentsContainer');
    if (!container) return;

    // Apply search filter
    if (searchTerm) {
        filteredAgents = allAgents.filter(a => {
            const text = `${a.name} ${a.category} ${a.type} ${a.description}`.toLowerCase();
            return text.includes(searchTerm);
        });
    } else {
        filteredAgents = [...allAgents];
    }

    const grouped: Record<string, typeof filteredAgents> = {};
    for (const agent of filteredAgents) {
        const cat = agent.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(agent);
    }

    const sortedCats = Object.keys(grouped).sort();

    let html = '';
    for (const cat of sortedCats) {
        const agents = grouped[cat];
        const isFavCat = agents.some(a => favorites.has(a.id));

        html += `
        <div class="category">
          <div class="category-header ${isFavCat ? 'has-favs' : ''}">
            <span class="toggle-arrow"></span>
            <span class="category-emoji">${getCategoryEmoji(cat)}</span>
            <span class="category-badge">${agents.length}</span>
            <h2 class="category">${cat}</h2>
          </div>
          <div class="category-content">
            ${agents.map(a => renderAgentCard(a)).join('')}
          </div>
        </div>`;
    }

    container.innerHTML = html || '<p class="no-results">No agents match your search.</p>';

    // Update counts
    const countEl = document.getElementById('pkgCount');
    if (countEl) countEl.textContent = String(filteredAgents.length);
}

function renderAgentCard(agent: typeof allAgents[0]): string {
    const isFav = favorites.has(agent.id);
    const commands = agent.installs || [];

    let installHtml = '';
    if (commands.length > 0) {
        installHtml = commands.map(c => {
            const agentLabel = c.agent ? `<span class="install-agent-badge">${c.agent}</span>` : '';
            return `
            <div class="install-row">
              ${agentLabel}
              <code class="install-cmd">${escapeHtml(c.cmd)}</code>
              <button type="button" class="copy-btn" data-cmd="${escapeHtml(c.cmd)}" aria-label="Copy command">📋</button>
            </div>`;
        }).join('');
    } else {
        installHtml = `<div class="install-row"><span class="no-install">No install command available</span></div>`;
    }

    const compatBadges: string[] = [];
    if (agent.agent_compat?.claude) compatBadges.push('<span class="agent-badge claude">Claude</span>');
    if (agent.agent_compat?.codex) compatBadges.push('<span class="agent-badge codex">Codex</span>');

    return `
    <div class="pkg-item" data-id="${agent.id}">
      <div class="pkg-header">
        <label class="checkbox-wrapper">
          <input type="checkbox" name="pkg" value="${agent.id}" class="package-checkbox" ${isFav ? 'checked' : ''}>
        </label>
        <strong class="pkg-name">${escapeHtml(agent.name)}</strong>
        <span class="pkg-type-badge ${agent.type === 'MCP Server' ? 'mcp' : 'plugin'}">${agent.type}</span>
        ${compatBadges.join('')}
      </div>
      ${agent.description ? `<p class="pkg-desc">${escapeHtml(agent.description.substring(0, 200))}</p>` : ''}
      <div class="install-commands">
        ${installHtml}
      </div>
    </div>`;
}

// ---- Helpers ----

function getCategoryEmoji(cat: string): string {
    const map: Record<string, string> = {
        'Core': '🔧',
        'Development': '💻',
        'Cloud/DevOps': '☁️',
        'Creative': '🎨',
        'DAW/Music': '🎵',
        'Design': '🖌️',
        'Productivity': '📋',
        'Search': '🔍',
        'Research': '📚',
        'Marketing': '📢',
        'Bookmarks': '🔖',
        'Services': '⚡',
        'MCP': '🔌',
        'Plugin/Agent': '🧩',
    };
    return map[cat] || '📦';
}

function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ---- Interactions ----

function setupSearch(): void {
    const input = document.getElementById('searchInput') as HTMLInputElement | null;
    if (!input) return;
    let timer: ReturnType<typeof setTimeout>;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            searchTerm = input.value.trim().toLowerCase();
            render();
        }, 200);
    });
}

function setupCopyButtons(): void {
    document.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.copy-btn') as HTMLElement | null;
        if (!btn) return;
        const cmd = btn.getAttribute('data-cmd');
        if (!cmd) return;
        navigator.clipboard.writeText(cmd).catch(() => {});
        const original = btn.textContent;
        btn.textContent = '✅';
        setTimeout(() => { btn.textContent = original; }, 1500);
    });
}

function setupCategoryToggles(): void {
    document.addEventListener('click', (e) => {
        const header = (e.target as HTMLElement).closest('.category-header') as HTMLElement | null;
        if (!header) return;
        const content = header.nextElementSibling as HTMLElement | null;
        if (!content) return;
        const isOpen = !content.classList.contains('collapsed');
        content.classList.toggle('collapsed', !isOpen);
        header.classList.toggle('collapsed', !isOpen);
    });
}

// ---- Init ----

async function init(): Promise<void> {
    initTheme();
    await initConfigData();
    await loadData();
    initFavoritesData();
    // Expand all categories initially
    render();
    setupSearch();
    setupCopyButtons();
    setupCategoryToggles();
}

onDOMReady(init);