/**
 * Library Compatibility Table
 * Shows equivalent libraries across languages by category.
 * Data lives in public/pkgs/config.json (libCompatTable).
 */

import {
    initConfigData,
    getLibBaseCategories,
    getLibCompatTable,
    type LibCompatType,
} from '../shared/data-loader';

let LANGUAGES: string[] = [];
let CATEGORIES: string[] = [];
let COMPAT_TABLE: ReturnType<typeof getLibCompatTable>['table'] = {};

let compatVisibility: 'all' | 'external' | 'core' = 'external';

function shouldShowType(type: LibCompatType): boolean {
    if (compatVisibility === 'all') return true;
    if (compatVisibility === 'external') return type === 'external';
    return type === 'included';
}

function buildTable() {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    const headerRow = document.createElement('tr');
    const thCat = document.createElement('th');
    thCat.className = 'sticky-col';
    thCat.style.minWidth = '120px';
    thCat.textContent = 'Category';
    headerRow.appendChild(thCat);

    for (const lang of LANGUAGES) {
        const th = document.createElement('th');
        th.className = 'lang-col';
        th.textContent = lang;
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);

    for (const category of CATEGORIES) {
        const tr = document.createElement('tr');

        const tdCat = document.createElement('td');
        tdCat.className = 'sticky-col category-cell';
        tdCat.textContent = category;
        tr.appendChild(tdCat);

        for (const lang of LANGUAGES) {
            const td = document.createElement('td');
            td.className = 'lang-cell';
            const libs = (COMPAT_TABLE[category]?.[lang] ?? []).filter(lib => shouldShowType(lib.type));
            for (const lib of libs) {
                const item = document.createElement('div');
                item.className = 'compat-lib-item';
                const nameNode = document.createTextNode(lib.name + ' ');
                const badge = document.createElement('span');
                badge.className = `compat-badge compat-badge-${lib.type}`;
                const isCore = lib.type === 'included';
                badge.textContent = isCore ? 'core' : 'ext';
                badge.title = isCore ? 'Included in language/runtime' : 'Requires package manager';
                item.appendChild(nameNode);
                item.appendChild(badge);
                td.appendChild(item);
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

function applySearchFilter() {
    const input = document.getElementById('searchInput') as HTMLInputElement | null;
    if (!input) return;
    const q = input.value.toLowerCase();
    document.querySelectorAll('#tableBody tr').forEach(row => {
        (row as HTMLElement).style.display = row.textContent?.toLowerCase().includes(q) ? '' : 'none';
    });
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', applySearchFilter);
}

function setupVisibilityFilter() {
    const select = document.getElementById('compatVisibilitySelect') as HTMLSelectElement | null;
    if (!select) return;
    select.value = compatVisibility;
    select.addEventListener('change', () => {
        const value = select.value;
        if (value === 'all' || value === 'external' || value === 'core') {
            compatVisibility = value;
            buildTable();
            applySearchFilter();
        }
    });
}

export async function initLibCompat() {
    await initConfigData();
    const compat = getLibCompatTable();
    LANGUAGES = compat.languages;
    COMPAT_TABLE = compat.table;
    CATEGORIES = [...getLibBaseCategories()];
    buildTable();
    setupSearch();
    setupVisibilityFilter();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLibCompat);
} else {
    initLibCompat();
}
