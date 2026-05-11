type Tag = 'desktop' | 'mobile' | 'web' | 'lib';

interface DirectoryEntry {
    category: string;
    name: string;
    icon: string;
    link: string;
    tags: Tag[];
    key?: string;
}

interface DirectoryConfig {
    sources?: {
        desktop?: string;
        mobile?: string;
    };
    entries?: DirectoryEntry[];
}

interface LegacyPackageInfo {
    name?: string;
    category?: string;
}

interface LegacyPackagesData {
    packages?: Record<string, LegacyPackageInfo>;
}

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
const DEFAULT_ICON = `${BASE}img/apps/no.svg`;

const tableBody = document.querySelector<HTMLTableSectionElement>('#toolboxDirectoryTable tbody');
const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter-chip[data-tag]'));

const totalCount = document.getElementById('directoryTotalCount');
const visibleCount = document.getElementById('directoryVisibleCount');
const desktopCount = document.getElementById('directoryDesktopCount');
const mobileCount = document.getElementById('directoryMobileCount');
const webCount = document.getElementById('directoryWebCount');
const libCount = document.getElementById('directoryLibCount');

const state = {
    query: '',
    tag: 'all',
};

function withBase(path: string): string {
    if (!path) return DEFAULT_ICON;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE}${path.replace(/^\//, '')}`;
}

function normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function ensureTagSet(entry: DirectoryEntry): Set<Tag> {
    return new Set(entry.tags.filter((tag): tag is Tag => ['desktop', 'mobile', 'web', 'lib'].includes(tag)));
}

function buildSearchLink(name: string): string {
    return `https://duckduckgo.com/?q=${encodeURIComponent(name)}`;
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

function mergeEntry(
    map: Map<string, DirectoryEntry>,
    incoming: DirectoryEntry,
): void {
    const key = normalizeName(incoming.name);
    const current = map.get(key);

    if (!current) {
        map.set(key, {
            ...incoming,
            tags: Array.from(ensureTagSet(incoming)).sort() as Tag[],
        });
        return;
    }

    const mergedTags = new Set<Tag>([...ensureTagSet(current), ...ensureTagSet(incoming)]);

    const hasMeaningfulIcon = (icon: string) => !!icon && !icon.endsWith('/img/apps/no.svg') && !icon.endsWith('img/apps/no.svg');
    const hasMeaningfulLink = (link: string) => !!link && !link.includes('duckduckgo.com/?q=');

    current.tags = Array.from(mergedTags).sort() as Tag[];

    if (incoming.category && !current.category) {
        current.category = incoming.category;
    }

    if (hasMeaningfulIcon(incoming.icon) && !hasMeaningfulIcon(current.icon)) {
        current.icon = incoming.icon;
    }

    if (hasMeaningfulLink(incoming.link) && !hasMeaningfulLink(current.link)) {
        current.link = incoming.link;
    }
}

function buildEntriesFromLegacy(
    legacy: LegacyPackagesData,
    tag: Tag,
): DirectoryEntry[] {
    return Object.entries(legacy.packages ?? {}).map(([pkgKey, pkg]) => {
        const name = (pkg.name ?? pkgKey).trim();
        const category = (pkg.category ?? 'Other').trim();

        return {
            category,
            name,
            icon: `/img/apps/${pkgKey}.svg`,
            link: buildSearchLink(name),
            tags: [tag],
            key: pkgKey,
        };
    });
}

function getTagBadges(tags: Tag[]): string {
    return tags
        .map((tag) => `<span class="tag-badge tag-${tag}">#${tag}</span>`)
        .join('');
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
            ).sort() as Tag[];

            const iconsMarkup = groupEntries
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((entry) => {
                    const safeName = escapeHtml(entry.name);
                    const safeLink = escapeHtml(entry.link || buildSearchLink(entry.name));
                    const safeIcon = escapeHtml(withBase(entry.icon));
                    const safeFallback = escapeHtml(DEFAULT_ICON);
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
                                onerror="this.onerror=null;this.src='${safeFallback}';"
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

        const tagsCell = document.createElement('td');
        tagsCell.innerHTML = `<div class="directory-tags">${getTagBadges(uniqueTags)}</div>`;

        row.appendChild(categoryCell);
        row.appendChild(iconsCell);
        row.appendChild(tagsCell);
        tableBody.appendChild(row);
        });
}

function updateStats(totalEntries: DirectoryEntry[], visibleEntries: DirectoryEntry[]): void {
    if (totalCount) totalCount.textContent = String(totalEntries.length);
    if (visibleCount) visibleCount.textContent = String(visibleEntries.length);

    const totalByTag = {
        desktop: 0,
        mobile: 0,
        web: 0,
        lib: 0,
    };

    totalEntries.forEach((entry) => {
        entry.tags.forEach((tag) => {
            totalByTag[tag] += 1;
        });
    });

    if (desktopCount) desktopCount.textContent = String(totalByTag.desktop);
    if (mobileCount) mobileCount.textContent = String(totalByTag.mobile);
    if (webCount) webCount.textContent = String(totalByTag.web);
    if (libCount) libCount.textContent = String(totalByTag.lib);
}

function matchesTag(entry: DirectoryEntry): boolean {
    if (state.tag === 'all') return true;
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
    const configUrl = `${BASE}pkgs/toolbox-directory.json`;
    const config = await fetchJson<DirectoryConfig>(configUrl);

    const [desktopData, mobileData] = await Promise.all([
        config.sources?.desktop ? fetchJson<LegacyPackagesData>(withBase(config.sources.desktop)) : Promise.resolve({ packages: {} }),
        config.sources?.mobile ? fetchJson<LegacyPackagesData>(withBase(config.sources.mobile)) : Promise.resolve({ packages: {} }),
    ]);

    const merged = new Map<string, DirectoryEntry>();

    (config.entries ?? []).forEach((entry) => {
        mergeEntry(merged, entry);
    });

    buildEntriesFromLegacy(desktopData, 'desktop').forEach((entry) => {
        mergeEntry(merged, entry);
    });

    buildEntriesFromLegacy(mobileData, 'mobile').forEach((entry) => {
        mergeEntry(merged, entry);
    });

    return Array.from(merged.values())
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
        console.error('Failed to initialize toolbox directory:', error);
        tableBody.innerHTML = '<tr><td colspan="3">Could not load unified directory data.</td></tr>';
    }
}

void init();
