/**
 * OS Compatibility Table Rendering
 * Pure rendering functions for table, stats, and UI updates
 */

import { OS_COMPAT_CONFIG } from './config';
import type { OsCompatPackage, Statistics, SortState } from './types';

/**
 * Render the compatibility table
 * @param packages - Array of package objects
 */
export function renderTable(packages: OsCompatPackage[]) {
    const tbody = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.TABLE_BODY);
    if (!tbody) return;

    if (packages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No packages match your filters
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = packages.map(pkg => createTableRow(pkg)).join('');
}

/**
 * Create a single table row
 * @param pkg - Package object
 * @returns HTML string for table row
 */
function createTableRow(pkg: OsCompatPackage) {
    return `
        <tr>
            <td class="sticky-col category-col">${escapeHtml(pkg.category)}</td>
            <td class="sticky-col app-col"><strong>${escapeHtml(pkg.name)}</strong></td>
            <td class="os-column" ${OS_COMPAT_CONFIG.DATA_ATTRS.OS}="windows">
                ${getOsIcon(pkg.windows, pkg.windowsStatus)}
            </td>
            <td class="os-column" ${OS_COMPAT_CONFIG.DATA_ATTRS.OS}="macos">
                ${getOsIcon(pkg.macos)}
            </td>
            <td class="os-column" ${OS_COMPAT_CONFIG.DATA_ATTRS.OS}="linux">
                ${getOsIcon(pkg.linux)}
            </td>
            <td class="os-column" ${OS_COMPAT_CONFIG.DATA_ATTRS.OS}="freebsd">
                ${getOsIcon(pkg.freebsd)}
            </td>
        </tr>
    `;
}

/**
 * Get OS availability icon
 * @param available - Is OS supported
 * @param windowsStatus - Special Windows status (optional)
 * @returns HTML for icon
 */
const CHECK_SVG = '<svg viewBox="0 0 24 24"><polyline points="4 13 9 18 20 6"/></svg>';
const CROSS_SVG = '<svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';
const WARN_SVG = '<svg viewBox="0 0 24 24"><line x1="12" y1="7" x2="12" y2="14"/><circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="currentColor"/></svg>';

function getOsIcon(available: boolean, windowsStatus: string | null | undefined = null) {
    if (!available) {
        return `<span class="os-status os-status--no" title="Not available">${CROSS_SVG}</span>`;
    }

    // Handle Windows special statuses
    if (windowsStatus === OS_COMPAT_CONFIG.WINDOW_STATUSES.NON_WINGET) {
        return `<span class="os-status os-status--warn" title="Available but not in winget">${WARN_SVG}</span>`;
    }

    if (windowsStatus === OS_COMPAT_CONFIG.WINDOW_STATUSES.WINGET) {
        return `<span class="os-status os-status--yes" title="Available in winget">${CHECK_SVG}</span>`;
    }

    // Default available icon
    return `<span class="os-status os-status--yes" title="Available">${CHECK_SVG}</span>`;
}

/**
 * Update statistics display
 * @param stats - Statistics object from state
 */
export function updateStats(stats: Statistics) {
    // Update individual stat elements
    const totalEl = document.getElementById('totalPackages');
    const windowsEl = document.getElementById('windowsCount');
    const macosEl = document.getElementById('macosCount');
    const linuxEl = document.getElementById('linuxCount');
    const freebsdEl = document.getElementById('freebsdCount');

    if (totalEl) totalEl.textContent = String(stats.total);
    if (windowsEl) windowsEl.textContent = String(stats.windows.total);
    if (macosEl) macosEl.textContent = String(stats.macos);
    if (linuxEl) linuxEl.textContent = String(stats.linux);
    if (freebsdEl) freebsdEl.textContent = String(stats.freebsd);
}

/**
 * Update sort arrows in table headers
 * @param sortState - Current sort state
 */
export function updateSortArrows(sortState: SortState) {
    // Remove all existing sort classes
    document.querySelectorAll(OS_COMPAT_CONFIG.SELECTORS.SORTABLE_TH).forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        th.setAttribute('aria-sort', 'none');
    });

    // Add sort class to active column
    const activeHeader = document.querySelector(
        `${OS_COMPAT_CONFIG.SELECTORS.SORTABLE_TH}[${OS_COMPAT_CONFIG.DATA_ATTRS.SORT}="${sortState.column}"]`
    );

    if (activeHeader) {
        activeHeader.classList.add(`sort-${sortState.direction}`);
        activeHeader.setAttribute('aria-sort', sortState.direction === 'asc' ? 'ascending' : 'descending');
    }
}

/**
 * Update filter chips (active filter buttons)
 * @param activeFilters - Set of active OS filter names
 */
export function updateFilterChips(activeFilters: Set<string>) {
    document.querySelectorAll(OS_COMPAT_CONFIG.SELECTORS.FILTER_BTN).forEach(btn => {
        const filterOs = btn.getAttribute(OS_COMPAT_CONFIG.DATA_ATTRS.FILTER);
        if (filterOs !== null && activeFilters.has(filterOs)) {
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        }
    });
}

/**
 * Show loading state
 * @param message - Loading message
 */
export function showLoading(message = 'Loading...') {
    const tbody = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.TABLE_BODY);
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
                <div style="margin-top: 1rem;">${escapeHtml(message)}</div>
            </td>
        </tr>
    `;
}

/**
 * Show error state
 * @param message - Error message
 */
export function showError(message: string) {
    const tbody = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.TABLE_BODY);
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--error-color, #e74c3c);">
                <strong>Error:</strong> ${escapeHtml(message)}
            </td>
        </tr>
    `;
}

/**
 * Update result count message (optional feature)
 * @param count - Number of results
 * @param total - Total available
 */
export function updateResultCount(count: number, total: number) {
    const container = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.RESULT_COUNT);
    if (!container) return; // Element doesn't exist in current HTML

    if (count === total) {
        container.textContent = `Showing all ${count} packages`;
    } else {
        container.textContent = `Showing ${count} of ${total} packages`;
    }
}

/**
 * Escape HTML to prevent XSS
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeHtml(str: string) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Highlight search term in table cells
 * @param searchTerm - Term to highlight
 */
export function highlightSearchTerm(searchTerm: string) {
    if (!searchTerm) return;

    const tbody = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.TABLE_BODY);
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            // Only highlight text columns (category and app name - first 2 columns)
            if (index < 2) {
                const originalText = cell.textContent ?? '';
                const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
                const highlighted = originalText.replace(regex, '<mark>$1</mark>');
                cell.innerHTML = highlighted;
            }
        });
    });
}

/**
 * Escape special regex characters
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
