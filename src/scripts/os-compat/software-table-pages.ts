export {}; // module scope — prevents duplicate declaration conflicts

import { initConfigData, getNonFossListFor } from '../shared/data-loader';
import { initFavoritesData, getFavoritesFor, type FavCategory } from '../shared/favorites-store';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

type PageType = 'mobile' | 'browser' | 'vscode';

const FAV_CATEGORY_BY_PAGE_TYPE: Record<PageType, FavCategory> = {
    mobile: 'mobile',
    browser: 'browserExtensions',
    vscode: 'vscodeExtensions',
};

interface TableItem {
    id: string;
    category: string;
    name: string;
    searchText: string;
    [key: string]: unknown;
}

interface TableColumn {
    key: string;
    label: string;
    sortable: boolean;
    headerClass?: string;
    cellClass?: string;
    renderCell?: (item: TableItem) => string;
}

interface FilterOption {
    value: string;
    label: string;
}

interface StatItem {
    label: string;
    value: string | number;
}

interface SortState {
    column: string;
    direction: string;
}

interface PageConfig {
    jsonUrl: string;
    defaultSort: SortState;
    normalizeData: (data: unknown, favCategory: FavCategory) => TableItem[];
    getFilterOptions: (items: TableItem[]) => FilterOption[];
    matchesFilter: (item: TableItem, filterValue: string) => boolean;
    columns: TableColumn[];
    getStats: (filteredItems: TableItem[]) => StatItem[];
}

function getPageType(): PageType | null {
    const path = window.location.pathname;

    if (path.includes('mobile-os-compatibility')) {
        return 'mobile';
    }

    if (path.includes('vscode-extensions-compatibility')) {
        return 'vscode';
    }

    if (path.includes('browser-extensions-compatibility')) {
        return 'browser';
    }

    return null;
}

function escapeHtml(value: unknown) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function createSortArrowsMarkup(columnKey: string) {
    return `
        <span class="sort-arrows">
            <span class="sort-arrow up" data-column="${columnKey}" data-direction="asc"></span>
            <span class="sort-arrow down" data-column="${columnKey}" data-direction="desc"></span>
        </span>
    `;
}

function createStoreLinkMarkup(url: unknown, label: string, icon: string) {
    if (!url) {
        return '-';
    }

    return `
        <a class="store-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
            <span class="store-icon">${escapeHtml(icon)}</span>
            <span>${escapeHtml(label)}</span>
        </a>
    `;
}

function createAvailabilityMarkup(url: unknown, label: string) {
    if (!url) {
        return '<span class="availability-cell no" aria-label="Not available">❌</span>';
    }

    return `
        <a class="availability-cell yes" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}">✅</a>
    `;
}

function createBadgeMarkup(active: boolean, icon: string, label: string) {
    return `<span class="badge-cell${active ? ' active' : ''}" aria-label="${escapeHtml(label)}">${active ? icon : '—'}</span>`;
}

function normalizeBrowserData(data: unknown, favCategory: FavCategory) {
    const extensions = (data as Record<string, unknown>)?.extensions || {};
    const favoriteIds = new Set(getFavoritesFor(favCategory));
    const nonFossIds = new Set(getNonFossListFor(favCategory));
    return Object.entries(extensions as Record<string, Record<string, string>>).map(([id, ext]) => {
        const firefoxSlug = ext?.firefox_slug?.trim() || '';
        const chromiumId = ext?.chromium_id?.trim() || '';
        return {
            id,
            category: ext?.category || 'Other',
            name: ext?.name || id,
            firefoxSlug,
            chromiumId,
            firefoxUrl: firefoxSlug
                ? `https://addons.mozilla.org/en-US/firefox/addon/${encodeURIComponent(firefoxSlug)}/`
                : '',
            chromiumUrl: chromiumId
                ? `https://chromewebstore.google.com/detail/${encodeURIComponent(chromiumId)}`
                : '',
            isFavorite: favoriteIds.has(id),
            isFoss: !nonFossIds.has(id),
            searchText: [ext?.name || '', id, ext?.category || '', firefoxSlug, chromiumId].join(' ').toLowerCase(),
        };
    });
}

function normalizeMobileData(data: unknown, favCategory: FavCategory) {
    const packages = (data as Record<string, unknown>)?.packages || {};
    const favoriteIds = new Set(getFavoritesFor(favCategory));
    const nonFossIds = new Set(getNonFossListFor(favCategory));
    return Object.entries(packages as Record<string, Record<string, unknown>>).map(([id, pkg]) => {
        const pm = pkg?.package_manager as Record<string, string> | undefined;
        const androidPackageName = pm?.android_pkg?.trim() || '';
        const iosPackageName = pm?.ios_pkg?.trim() || '';

        return {
            id,
            category: (pkg as Record<string, string>)?.category || '-',
            name: (pkg as Record<string, string>)?.name || '-',
            androidPackageName,
            iosPackageName,
            androidUrl: androidPackageName
                ? `https://play.google.com/store/apps/details?id=${encodeURIComponent(androidPackageName)}`
                : '',
            iosUrl: iosPackageName
                ? `https://apps.apple.com/app/${iosPackageName}`
                : '',
            isFavorite: favoriteIds.has(id),
            isFoss: !nonFossIds.has(id),
            searchText: [
                (pkg as Record<string, string>)?.name || '',
                (pkg as Record<string, string>)?.category || '',
                (pkg as Record<string, string>)?.subcategory || '',
                androidPackageName,
                iosPackageName,
            ].join(' ').toLowerCase(),
        };
    });
}

function normalizeVscodeData(data: unknown, favCategory: FavCategory) {
    const extensions = (data as Record<string, unknown>)?.extensions || {};
    const favoriteIds = new Set(getFavoritesFor(favCategory));
    const nonFossIds = new Set(getNonFossListFor(favCategory));
    return Object.entries(extensions as Record<string, Record<string, string>>).map(([id, ext]) => ({
        id,
        category: ext?.category || 'Other',
        name: ext?.name || id,
        isFavorite: favoriteIds.has(id),
        isFoss: !nonFossIds.has(id),
        searchText: [ext?.name || '', id, ext?.category || ''].join(' ').toLowerCase(),
    }));
}

const PAGE_CONFIGS: Record<PageType, PageConfig> = {
    mobile: {
        jsonUrl: `${BASE}pkgs/mobile-pkgs.json`,
        defaultSort: { column: 'name', direction: 'asc' },
        normalizeData: normalizeMobileData,
        getFilterOptions() {
            return [
                { value: 'all', label: 'All' },
                { value: 'android', label: 'Android' },
                { value: 'ios', label: 'iOS' },
            ];
        },
        matchesFilter(item, filterValue) {
            if (filterValue === 'android') {
                return Boolean(item.androidPackageName);
            }

            if (filterValue === 'ios') {
                return Boolean(item.iosPackageName);
            }

            return true;
        },
        columns: [
            { key: 'category', label: 'Category', sortable: true, headerClass: 'sortable sticky-col category-col', cellClass: 'sticky-col category-col' },
            { key: 'name', label: 'App', sortable: true, headerClass: 'sortable sticky-col app-col', cellClass: 'sticky-col app-col' },
            { key: 'androidPackageName', label: 'Android', sortable: true, renderCell: (item) => createAvailabilityMarkup(item.androidUrl, 'Open in Play Store') },
            { key: 'iosPackageName', label: 'iOS', sortable: true, renderCell: (item) => createAvailabilityMarkup(item.iosUrl, 'Open in App Store') },
            { key: 'isFavorite', label: 'Favs', sortable: true, renderCell: (item) => createBadgeMarkup(Boolean(item.isFavorite), '⭐', 'Favorite') },
            { key: 'isFoss', label: 'FOSS', sortable: true, renderCell: (item) => createBadgeMarkup(Boolean(item.isFoss), '🌿', 'Open source') },
        ],
        getStats(filteredItems) {
            const categories = new Set(filteredItems.map((item) => item.category));

            return [
                { label: 'Total Packages', value: filteredItems.length },
                { label: 'Categories', value: categories.size },
                { label: 'Android', value: filteredItems.filter((item) => item.androidPackageName).length },
                { label: 'iOS', value: filteredItems.filter((item) => item.iosPackageName).length },
            ];
        },
    },
    browser: {
        jsonUrl: `${BASE}pkgs/browser-extensions-pkgs.json`,
        defaultSort: { column: 'name', direction: 'asc' },
        normalizeData: normalizeBrowserData,
        getFilterOptions(items) {
            const categories = (Array.from(new Set<string>(items.map((item) => String(item.category)))) as string[]).sort((a, b) => a.localeCompare(b));
            return [{ value: 'all', label: 'All' }, ...categories.map((category) => ({ value: category, label: category }))];
        },
        matchesFilter(item, filterValue) {
            return item.category === filterValue;
        },
        columns: [
            { key: 'category', label: 'Category', sortable: true, headerClass: 'sortable sticky-col category-col', cellClass: 'sticky-col category-col' },
            { key: 'name', label: 'Extension', sortable: true, headerClass: 'sortable sticky-col app-col', cellClass: 'sticky-col app-col' },
            { key: 'firefoxUrl', label: 'Firefox', sortable: false, renderCell: (item) => createStoreLinkMarkup(item.firefoxUrl, 'Firefox Extension', '🦊') },
            { key: 'chromiumUrl', label: 'Chromium', sortable: false, renderCell: (item) => createStoreLinkMarkup(item.chromiumUrl, 'Chromium Extension', '🔵') },
            { key: 'isFavorite', label: 'Favs', sortable: true, renderCell: (item) => createBadgeMarkup(Boolean(item.isFavorite), '⭐', 'Favorite') },
            { key: 'isFoss', label: 'FOSS', sortable: true, renderCell: (item) => createBadgeMarkup(Boolean(item.isFoss), '🌿', 'Open source') },
        ],
        getStats(filteredItems) {
            const categories = new Set(filteredItems.map((item) => item.category));
            return [
                { label: 'Total Extensions', value: filteredItems.length },
                { label: 'Categories', value: categories.size },
                { label: 'Firefox', value: filteredItems.filter((item) => item.firefoxUrl).length },
                { label: 'Chromium', value: filteredItems.filter((item) => item.chromiumUrl).length },
            ];
        },
    },
    vscode: {
        jsonUrl: `${BASE}pkgs/vscode-extensions-pkgs.json`,
        defaultSort: { column: 'name', direction: 'asc' },
        normalizeData: normalizeVscodeData,
        getFilterOptions(items) {
            const categories = (Array.from(new Set<string>(items.map((item) => String(item.category)))) as string[]).sort((a, b) => a.localeCompare(b));
            return [{ value: 'all', label: 'All' }, ...categories.map((category) => ({ value: category, label: category }))];
        },
        matchesFilter(item, filterValue) {
            return item.category === filterValue;
        },
        columns: [
            { key: 'category', label: 'Category', sortable: true, headerClass: 'sortable sticky-col category-col', cellClass: 'sticky-col category-col' },
            { key: 'name', label: 'Extension', sortable: true, headerClass: 'sortable sticky-col app-col', cellClass: 'sticky-col app-col' },
            { key: 'id', label: 'Package Name', sortable: true, renderCell: (item) => `<code class="table-inline-code">${escapeHtml(item.id)}</code>` },
            { key: 'isFavorite', label: 'Favs', sortable: true, renderCell: (item) => createBadgeMarkup(Boolean(item.isFavorite), '⭐', 'Favorite') },
            { key: 'isFoss', label: 'FOSS', sortable: true, renderCell: (item) => createBadgeMarkup(Boolean(item.isFoss), '🌿', 'Open source') },
        ],
        getStats(filteredItems) {
            const categories = filteredItems.reduce((acc, item) => {
                const cat = item.category as string;
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topCategories = (Object.entries(categories) as [string, number][])
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .slice(0, 2);

            return [
                { label: 'Total Extensions', value: filteredItems.length },
                { label: 'Categories', value: Object.keys(categories).length },
                { label: topCategories[0]?.[0] || 'Top Category', value: topCategories[0]?.[1] || 0 },
                { label: topCategories[1]?.[0] || 'Second Category', value: topCategories[1]?.[1] || 0 },
            ];
        },
    },
};

function sortItems(items: TableItem[], column: string, direction: string) {
    return [...items].sort((left, right) => {
        const leftValue = String(left[column] ?? '').toLowerCase();
        const rightValue = String(right[column] ?? '').toLowerCase();

        if (leftValue === rightValue) {
            return 0;
        }

        if (direction === 'asc') {
            return leftValue < rightValue ? -1 : 1;
        }

        return leftValue > rightValue ? -1 : 1;
    });
}

function createTableHeader(config: PageConfig, sortState: SortState) {
    const head = document.getElementById('tableHead');
    if (!head) return;

    const headerMarkup = config.columns.map((column) => {
        const classes = column.headerClass || (column.sortable ? 'sortable' : '');

        if (!column.sortable) {
            return `<th class="${classes}">${escapeHtml(column.label)}</th>`;
        }

        const ariaSort = sortState.column === column.key
            ? (sortState.direction === 'asc' ? 'ascending' : 'descending')
            : 'none';

        return `
            <th class="${classes}" data-column="${column.key}" tabindex="0" role="button" aria-sort="${ariaSort}">
                ${escapeHtml(column.label)}
                ${createSortArrowsMarkup(column.key)}
            </th>
        `;
    }).join('');

    head.innerHTML = `<tr>${headerMarkup}</tr>`;
}

function renderTableBody(config: PageConfig, items: TableItem[]) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${config.columns.length}" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No software matches your filters
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map((item) => {
        const cells = config.columns.map((column) => {
            const classes = column.cellClass ? ` class="${column.cellClass}"` : '';
            const content = column.renderCell
                ? column.renderCell(item)
                : escapeHtml(item[column.key] ?? '-');
            return `<td${classes}>${content}</td>`;
        }).join('');

        return `<tr>${cells}</tr>`;
    }).join('');
}

function renderStats(config: PageConfig, items: TableItem[]) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    const stats = config.getStats(items);
    statsContainer.innerHTML = stats.map((stat) => `
        <div class="stat-item">
            <div class="stat-number">${escapeHtml(String(stat.value))}</div>
            <div class="stat-label">${escapeHtml(stat.label)}</div>
        </div>
    `).join('');
}

function renderFilterChips(options: FilterOption[], activeFilters: Set<string>) {
    const container = document.getElementById('filterChips');
    if (!container) return;

    container.innerHTML = options.map((option) => `
        <button
            type="button"
            class="filter-chip${activeFilters.has(option.value) ? ' active' : ''}"
            data-filter="${escapeHtml(option.value)}"
            aria-pressed="${activeFilters.has(option.value) ? 'true' : 'false'}"
        >${escapeHtml(option.label)}</button>
    `).join('');
}

function initializePage() {
    const pageType = getPageType();
    if (!pageType) return;

    const config = PAGE_CONFIGS[pageType];
    if (!config) return;

    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const state: {
        items: TableItem[];
        filteredItems: TableItem[];
        activeFilters: Set<string>;
        sortState: SortState;
        searchTerm: string;
        filterOptions: FilterOption[];
    } = {
        items: [],
        filteredItems: [],
        activeFilters: new Set(['all']),
        sortState: { ...config.defaultSort },
        searchTerm: '',
        filterOptions: [],
    };

    function applyState() {
        let items = [...state.items];

        if (state.searchTerm) {
            items = items.filter((item) => (item.searchText as string).includes(state.searchTerm));
        }

        if (!state.activeFilters.has('all')) {
            items = items.filter((item) => Array.from(state.activeFilters).some((filterValue) => config.matchesFilter(item, filterValue)));
        }

        items = sortItems(items, state.sortState.column, state.sortState.direction);
        state.filteredItems = items;

        createTableHeader(config, state.sortState);
        renderFilterChips(state.filterOptions, state.activeFilters);
        renderTableBody(config, state.filteredItems);
        renderStats(config, state.filteredItems);
        attachHeaderEvents();
        attachFilterEvents();
    }

    function attachHeaderEvents() {
        const headers = document.querySelectorAll('#tableHead th.sortable');
        headers.forEach((header) => {
            const el = header as HTMLElement;
            const handleSort = () => {
                const column = el.dataset.column;
                if (!column) return;

                if (state.sortState.column === column) {
                    state.sortState.direction = state.sortState.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    state.sortState.column = column;
                    state.sortState.direction = 'asc';
                }

                applyState();
            };

            el.onclick = handleSort;
            el.onkeydown = (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSort();
                }
            };
        });
    }

    function attachFilterEvents() {
        const filterButtons = document.querySelectorAll('#filterChips .filter-chip');
        filterButtons.forEach((button) => {
            const btn = button as HTMLElement;
            const handleFilter = () => {
                const filterValue = btn.dataset.filter;
                if (!filterValue) return;

                if (filterValue === 'all') {
                    state.activeFilters = new Set(['all']);
                } else {
                    state.activeFilters.delete('all');

                    if (state.activeFilters.has(filterValue)) {
                        state.activeFilters.delete(filterValue);
                    } else {
                        state.activeFilters.add(filterValue);
                    }

                    if (state.activeFilters.size === 0) {
                        state.activeFilters.add('all');
                    }
                }

                applyState();
            };

            btn.onclick = handleFilter;
            btn.onkeydown = (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleFilter();
                }
            };
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            state.searchTerm = searchInput.value.trim().toLowerCase();
            applyState();
        });
    }

    const favCategory = FAV_CATEGORY_BY_PAGE_TYPE[pageType];

    Promise.all([initConfigData(), initFavoritesData()])
        .then(() => fetch(config.jsonUrl))
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load software table data: ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            state.items = config.normalizeData(data, favCategory);
            state.filterOptions = config.getFilterOptions(state.items);
            applyState();
        })
        .catch((error) => {
            console.error('Error initializing software table page:', error);
            renderTableBody(config, []);
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}