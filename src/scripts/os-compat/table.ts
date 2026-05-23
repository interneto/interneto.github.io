/**
 * OS Compatibility Table Rendering
 * Pure rendering functions for table, stats, and UI updates
 */

import { OS_COMPAT_CONFIG } from './config';

/**
 * Render the compatibility table
 * @param {Array} packages - Array of package objects
 */
export function renderTable(packages) {
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
 * @param {Object} pkg - Package object
 * @returns {string} HTML string for table row
 */
function createTableRow(pkg) {
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
 * @param {boolean} available - Is OS supported
 * @param {string} windowsStatus - Special Windows status (optional)
 * @returns {string} HTML for icon
 */
function getOsIcon(available, windowsStatus = null) {
    if (!available) {
        return `<span title="Not available">${OS_COMPAT_CONFIG.ICONS.NOT_AVAILABLE}</span>`;
    }
    
    // Handle Windows special statuses
    if (windowsStatus === OS_COMPAT_CONFIG.WINDOW_STATUSES.NON_WINGET) {
        return `<span title="Available but not in winget">${OS_COMPAT_CONFIG.ICONS.NON_WINGET}</span>`;
    }
    
    if (windowsStatus === OS_COMPAT_CONFIG.WINDOW_STATUSES.WINGET) {
        return `<span title="Available in winget">${OS_COMPAT_CONFIG.ICONS.WINGET}</span>`;
    }
    
    // Default available icon
    return `<span title="Available">${OS_COMPAT_CONFIG.ICONS.AVAILABLE}</span>`;
}

/**
 * Update statistics display
 * @param {Object} stats - Statistics object from state
 */
export function updateStats(stats) {
    // Update individual stat elements
    const totalEl = document.getElementById('totalPackages');
    const windowsEl = document.getElementById('windowsCount');
    const macosEl = document.getElementById('macosCount');
    const linuxEl = document.getElementById('linuxCount');
    const freebsdEl = document.getElementById('freebsdCount');
    
    if (totalEl) totalEl.textContent = stats.total;
    if (windowsEl) windowsEl.textContent = stats.windows.total;
    if (macosEl) macosEl.textContent = stats.macos;
    if (linuxEl) linuxEl.textContent = stats.linux;
    if (freebsdEl) freebsdEl.textContent = stats.freebsd;
}

/**
 * Update sort arrows in table headers
 * @param {Object} sortState - Current sort state
 */
export function updateSortArrows(sortState) {
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
 * @param {Set} activeFilters - Set of active OS filter names
 */
export function updateFilterChips(activeFilters) {
    document.querySelectorAll(OS_COMPAT_CONFIG.SELECTORS.FILTER_BTN).forEach(btn => {
        const filterOs = btn.getAttribute(OS_COMPAT_CONFIG.DATA_ATTRS.FILTER);
        if (activeFilters.has(filterOs)) {
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
 * @param {string} message - Loading message
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
 * @param {string} message - Error message
 */
export function showError(message) {
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
 * @param {number} count - Number of results
 * @param {number} total - Total available
 */
export function updateResultCount(count, total) {
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
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Highlight search term in table cells
 * @param {string} searchTerm - Term to highlight
 */
export function highlightSearchTerm(searchTerm) {
    if (!searchTerm) return;
    
    const tbody = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.TABLE_BODY);
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            // Only highlight text columns (category and app name - first 2 columns)
            if (index < 2) {
                const originalText = cell.textContent;
                const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
                const highlighted = originalText.replace(regex, '<mark>$1</mark>');
                cell.innerHTML = highlighted;
            }
        });
    });
}

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
