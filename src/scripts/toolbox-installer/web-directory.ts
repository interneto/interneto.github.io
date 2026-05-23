// Renders the Web Directory table from /pkgs/web-directory.json.
// Tags describe extra surfaces a web destination ALSO has:
//   desktop          → also ships a desktop app
//   mobile           → also ships a mobile app
//   extension-store  → is a storefront for browser extensions
// No tag = pure web.

type Tag = 'desktop' | 'mobile' | 'extension-store';

const VALID_TAGS: readonly Tag[] = ['desktop', 'mobile', 'extension-store'];

interface DirectoryEntry {
    category: string;
    name: string;
    icon: string;
    link: string;
    tags: Tag[];
}

interface DirectoryConfig {
    entries?: DirectoryEntry[];
}

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
const DEFAULT_ICON = `${BASE}img/apps/no.svg`;

const tableBody = document.querySelector<HTMLTableSectionElement>('#toolboxDirectoryTable tbody');
const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter-chip[data-tag]'));

const totalCount = document.getElementById('directoryTotalCount');
const visibleCount = document.getElementById('directoryVisibleCount');
const webOnlyCount = document.getElementById('directoryWebOnlyCount');
const desktopCount = document.getElementById('directoryDesktopCount');
const mobileCount = document.getElementById('directoryMobileCount');
const extStoreCount = document.getElementById('directoryExtensionStoreCount');

const state = {
    query: '',
    tag: 'all',
};

function withBase(path: string): string {
    if (!path) return DEFAULT_ICON;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE}${path.replace(/^\//, '')}`;
}

function buildSearchLink(name: string): string {
    return `https://duckduckgo.com/?q=${encodeURIComponent(name)}`;
}

function faviconFromLink(link: string): string | null {
    try {
        const url = new URL(link);
        if (!/^https?:$/.test(url.protocol)) return null;
        return `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`;
    } catch {
        return null;
    }
}

function isPlaceholderIcon(icon: string): boolean {
    return !icon || icon.endsWith('/img/apps/no.svg') || icon.endsWith('img/apps/no.svg');
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function sanitizeTags(raw: unknown): Tag[] {
    if (!Array.isArray(raw)) return [];
    const set = new Set<Tag>();
    for (const t of raw) {
        if (typeof t === 'string' && (VALID_TAGS as readonly string[]).includes(t)) {
            set.add(t as Tag);
        }
    }
    return Array.from(set).sort();
}

function renderRows(entries: DirectoryEntry[]): void {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const grouped = new Map<string, DirectoryEntry[]>();
    entries.forEach((entry) => {
        const list = grouped.get(entry.category) ?? [];
        list.push(entry);
        grouped.set(entry.category, list);
    });

    Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([category, groupEntries]) => {
            const uniqueTags = Array.from(
                new Set(groupEntries.flatMap((entry) => entry.tags))
            ).sort();

            const iconsMarkup = groupEntries
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((entry) => {
                    const safeName = escapeHtml(entry.name);
                    const linkHref = entry.link || buildSearchLink(entry.name);
                    const safeLink = escapeHtml(linkHref);
                    const favicon = faviconFromLink(linkHref);
                    const primarySrc = isPlaceholderIcon(entry.icon) && favicon
                        ? favicon
                        : withBase(entry.icon);
                    const safeIcon = escapeHtml(primarySrc);
                    const safeFavicon = favicon ? escapeHtml(favicon) : '';
                    const safeFallback = escapeHtml(DEFAULT_ICON);
                    const onerror = safeFavicon && primarySrc !== favicon
                        ? `this.onerror=function(){this.onerror=null;this.src='${safeFallback}';};this.src='${safeFavicon}';`
                        : `this.onerror=null;this.src='${safeFallback}';`;
                    return `
                        <a
                            class="directory-icon-link"
                            href="${safeLink}"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="${safeName}"
                            aria-label="${safeName}"
                        >
                            <img
                                class="directory-icon"
                                src="${safeIcon}"
                                alt="${safeName} icon"
                                loading="lazy"
                                onerror="${onerror}"
                            />
                        </a>
                    `;
                })
                .join('');

            const row = document.createElement('tr');
            row.dataset.search = `${category} ${groupEntries.map((entry) => entry.name).join(' ')} ${uniqueTags.map((tag) => `#${tag}`).join(' ')}`.toLowerCase();
            row.dataset.tags = uniqueTags.join(' ');

            const categoryCell = document.createElement('td');
            categoryCell.className = 'directory-category';
            categoryCell.textContent = category;

            const iconsCell = document.createElement('td');
            iconsCell.innerHTML = `<div class="directory-icon-list">${iconsMarkup}</div>`;

            row.appendChild(categoryCell);
            row.appendChild(iconsCell);
            tableBody.appendChild(row);
        });
}

function updateStats(totalEntries: DirectoryEntry[], visibleEntries: DirectoryEntry[]): void {
    if (totalCount) totalCount.textContent = String(totalEntries.length);
    if (visibleCount) visibleCount.textContent = String(visibleEntries.length);

    let webOnly = 0;
    const byTag: Record<Tag, number> = { desktop: 0, mobile: 0, 'extension-store': 0 };
    totalEntries.forEach((entry) => {
        if (entry.tags.length === 0) webOnly++;
        entry.tags.forEach((tag) => { byTag[tag] += 1; });
    });

    if (webOnlyCount) webOnlyCount.textContent = String(webOnly);
    if (desktopCount) desktopCount.textContent = String(byTag.desktop);
    if (mobileCount) mobileCount.textContent = String(byTag.mobile);
    if (extStoreCount) extStoreCount.textContent = String(byTag['extension-store']);
}

function matchesTag(entry: DirectoryEntry): boolean {
    if (state.tag === 'all') return true;
    if (state.tag === 'web-only') return entry.tags.length === 0;
    return entry.tags.includes(state.tag as Tag);
}

function matchesQuery(entry: DirectoryEntry): boolean {
    if (!state.query) return true;
    const searchable = `${entry.category} ${entry.name} ${entry.tags.map((tag) => `#${tag}`).join(' ')}`.toLowerCase();
    return searchable.includes(state.query);
}

function applyFilters(entries: DirectoryEntry[]): void {
    const filtered = entries.filter((entry) => matchesTag(entry) && matchesQuery(entry));
    renderRows(filtered);
    updateStats(entries, filtered);
}

async function loadDirectoryData(): Promise<DirectoryEntry[]> {
    const config = await fetchJson<DirectoryConfig>(`${BASE}pkgs/web-directory.json`);
    return (config.entries ?? [])
        .map((entry) => ({ ...entry, tags: sanitizeTags(entry.tags) }))
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

async function init(): Promise<void> {
    if (!tableBody) return;
    try {
        const entries = await loadDirectoryData();
        renderRows(entries);

        searchInput?.addEventListener('input', () => {
            state.query = searchInput.value.trim().toLowerCase();
            applyFilters(entries);
        });

        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                state.tag = chip.dataset.tag ?? 'all';
                chips.forEach((button) => {
                    const isActive = button === chip;
                    button.classList.toggle('active', isActive);
                    button.setAttribute('aria-pressed', String(isActive));
                });
                applyFilters(entries);
            });
        });

        applyFilters(entries);
    } catch (error) {
        console.error('Failed to initialize web directory:', error);
        tableBody.innerHTML = '<tr><td colspan="2">Could not load web directory data.</td></tr>';
    }
}

void init();
