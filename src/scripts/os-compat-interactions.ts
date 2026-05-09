/**
 * OS Compatibility Interactions
 * Event handlers for sorting, filtering, and search
 */

import { OS_COMPAT_CONFIG } from './config';
import * as state from './os-compat-state';
import * as table from './os-compat-table';

/**
 * Setup all interactions
 */
export function setupInteractions() {
    setupSorting();
    setupFiltering();
    setupSearch();
    setupKeyboardShortcuts();
}

/**
 * Setup table sorting by clicking column headers
 */
function setupSorting() {
    const headers = document.querySelectorAll<HTMLElement>(OS_COMPAT_CONFIG.SELECTORS.SORTABLE_TH);
    
    headers.forEach(th => {
        th.addEventListener('click', handleSortClick);
        
        // Keyboard support
        th.addEventListener('keydown', (e) => {
            const ke = e as KeyboardEvent;
            if (ke.key === 'Enter' || ke.key === ' ') {
                e.preventDefault();
                handleSortClick.call(th, e);
            }
        });
    });
}

/**
 * Handle sort column click
 * @param {Event} e - Click event
 */
function handleSortClick(this: HTMLElement, _e: Event) {
    const column = this.getAttribute(OS_COMPAT_CONFIG.DATA_ATTRS.SORT);
    if (!column) return;
    
    // Toggle sort direction
    const sortState = state.toggleSortDirection(column);
    
    // Apply filters and sort
    state.applyFilters();
    
    // Update UI
    table.renderTable(state.getFilteredPackages());
    table.updateSortArrows(sortState);
    
    // Announce to screen readers
    announceToScreenReader(
        `Sorted by ${column} ${sortState.direction === 'asc' ? 'ascending' : 'descending'}`
    );
}

/**
 * Setup OS filtering buttons
 */
function setupFiltering() {
    const filterBtns = document.querySelectorAll<HTMLElement>(OS_COMPAT_CONFIG.SELECTORS.FILTER_BTN);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
        
        // Keyboard support
        btn.addEventListener('keydown', (e) => {
            const ke = e as KeyboardEvent;
            if (ke.key === 'Enter' || ke.key === ' ') {
                e.preventDefault();
                handleFilterClick.call(btn, e);
            }
        });
    });
}

/**
 * Handle filter button click
 * @param {Event} e - Click event
 */
function handleFilterClick(this: HTMLElement, _e: Event) {
    const filterOs = this.getAttribute(OS_COMPAT_CONFIG.DATA_ATTRS.FILTER);
    if (!filterOs) return;
    
    // Toggle filter
    state.toggleOsFilter(filterOs);
    
    // Apply filters
    state.applyFilters();
    
    // Update UI
    const filtered = state.getFilteredPackages();
    table.renderTable(filtered);
    table.updateFilterChips(state.getOsFilters());
    table.updateStats(state.getStatistics());
    
    // Announce to screen readers
    const activeFilters = Array.from(state.getOsFilters());
    announceToScreenReader(
        `Filter ${filterOs} ${state.isFilterActive(filterOs) ? 'activated' : 'deactivated'}. ` +
        `${filtered.length} packages shown.`
    );
}

/**
 * Setup search input
 */
function setupSearch() {
    const searchInput = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.SEARCH_INPUT) as HTMLInputElement | null;
    if (!searchInput) return;
    
    // Debounce search input
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            handleSearch((e.target as HTMLInputElement).value);
        }, 300);
    });
    
    // Clear search button
    const clearBtn = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.CLEAR_SEARCH);
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            handleSearch('');
            searchInput.focus();
        });
    }
}

/**
 * Handle search input
 * @param {string} searchTerm - Search term
 */
function handleSearch(searchTerm) {
    // Update state
    state.setSearchTerm(searchTerm);
    
    // Apply filters
    state.applyFilters();
    
    // Update UI
    const filtered = state.getFilteredPackages();
    table.renderTable(filtered);
    table.updateStats(state.getStatistics());
    
    // Highlight search term if present
    if (searchTerm) {
        table.highlightSearchTerm(searchTerm);
    }
    
    // Show/hide clear button (only if element exists)
    updateClearButton(searchTerm);
    
    // Announce to screen readers
    announceToScreenReader(`${filtered.length} packages match your search`);
}

/**
 * Show/hide clear search button based on input
 * @param {string} searchTerm - Current search term
 */
function updateClearButton(searchTerm) {
    const clearBtn = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.CLEAR_SEARCH);
    if (!clearBtn) return;
    
    if (searchTerm.trim()) {
        clearBtn.style.display = 'inline-block';
    } else {
        clearBtn.style.display = 'none';
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.SEARCH_INPUT) as HTMLInputElement | null;
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            const searchInput = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.SEARCH_INPUT) as HTMLInputElement | null;
            if (searchInput && document.activeElement === searchInput) {
                searchInput.value = '';
                handleSearch('');
            }
        }
    });
}

/**
 * Setup reset filters button
 */
export function setupResetButton() {
    const resetBtn = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.RESET_FILTERS);
    if (!resetBtn) return;
    
    resetBtn.addEventListener('click', () => {
        // Reset state
        state.resetFilters();
        
        // Clear search input
        const searchInput = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.SEARCH_INPUT) as HTMLInputElement | null;
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Apply default filters
        state.applyFilters();
        
        // Update UI
        const filtered = state.getFilteredPackages();
        table.renderTable(filtered);
        table.updateFilterChips(state.getOsFilters());
        table.updateSortArrows(state.getSortState());
        table.updateStats(state.getStatistics());
        updateClearButton('');
        
        // Announce to screen readers
        announceToScreenReader('All filters reset');
    });
}

/**
 * Setup export functionality
 */
export function setupExport() {
    const exportBtn = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.EXPORT_BTN);
    if (!exportBtn) return;
    
    exportBtn.addEventListener('click', () => {
        exportToCSV(state.getFilteredPackages());
    });
}

/**
 * Export packages to CSV
 * @param {Array} packages - Packages to export
 */
function exportToCSV(packages) {
    // CSV header
    const headers = ['Category', 'App', 'Windows', 'macOS', 'Linux', 'FreeBSD'];
    const csvRows = [headers.join(',')];
    
    // CSV data
    packages.forEach(pkg => {
        const row = [
            `"${pkg.category}"`,
            `"${pkg.name}"`,
            pkg.windows ? 'Yes' : 'No',
            pkg.macos ? 'Yes' : 'No',
            pkg.linux ? 'Yes' : 'No',
            pkg.freebsd ? 'Yes' : 'No',
        ];
        csvRows.push(row.join(','));
    });
    
    // Create blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `desktop-os-compatibility-${Date.now()}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    announceToScreenReader(`Exported ${packages.length} packages to CSV`);
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
    const announcer = document.getElementById('sr-announcer') || createAnnouncer();
    announcer.textContent = message;
}

/**
 * Create screen reader announcer element
 * @returns {HTMLElement} Announcer element
 */
function createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(announcer);
    return announcer;
}

/**
 * Setup column visibility toggles (optional feature)
 */
export function setupColumnToggles() {
    const toggleContainer = document.getElementById(OS_COMPAT_CONFIG.ELEMENT_IDS.COLUMN_TOGGLES);
    if (!toggleContainer) return;
    
    const columns = ['name', 'category', 'subcategory', 'windows', 'macos', 'linux', 'freebsd'];
    
    columns.forEach(col => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `toggle-${col}`;
        checkbox.checked = true;
        
        const label = document.createElement('label');
        label.htmlFor = `toggle-${col}`;
        label.textContent = col.charAt(0).toUpperCase() + col.slice(1);
        
        checkbox.addEventListener('change', (e) => {
            toggleColumn(col, (e.target as HTMLInputElement).checked);
        });
        
        toggleContainer.appendChild(checkbox);
        toggleContainer.appendChild(label);
    });
}

/**
 * Toggle column visibility
 * @param {string} column - Column name
 * @param {boolean} visible - Show or hide
 */
function toggleColumn(column, visible) {
    const style = visible ? '' : 'none';
    
    // Update headers
    const headers = document.querySelectorAll(`th[data-column="${column}"]`);
    headers.forEach(th => (th as HTMLElement).style.display = style);
    
    // Update cells
    const cells = document.querySelectorAll(`td[data-column="${column}"]`);
    cells.forEach(td => (td as HTMLElement).style.display = style);
}
