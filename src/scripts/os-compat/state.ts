/**
 * OS Compatibility State Management
 * Centralized state for table sorting, filtering, and search
 */

import { OS_COMPAT_CONFIG } from './config';
import type { OsCompatPackage, SortState } from './types';

// Internal state (not exported directly)
let state = {
    packages: [] as OsCompatPackage[],
    filteredPackages: [] as OsCompatPackage[],
    sortState: {
        column: OS_COMPAT_CONFIG.DEFAULT_SORT.COLUMN,
        direction: OS_COMPAT_CONFIG.DEFAULT_SORT.DIRECTION,
    } as SortState,
    osFilters: new Set([OS_COMPAT_CONFIG.DEFAULT_FILTER]),
    searchTerm: '',
};

/**
 * Get complete state (immutable copy)
 * @returns Copy of current state
 */
export function getState() {
    return {
        packages: [...state.packages],
        filteredPackages: [...state.filteredPackages],
        sortState: { ...state.sortState },
        osFilters: new Set(state.osFilters),
        searchTerm: state.searchTerm,
    };
}

/**
 * Set packages data
 * @param packages - Array of package objects
 */
export function setPackages(packages: OsCompatPackage[]) {
    state.packages = [...packages];
}

/**
 * Get all packages
 * @returns Array of package objects
 */
export function getPackages() {
    return state.packages;
}

/**
 * Get filtered packages
 * @returns Array of filtered package objects
 */
export function getFilteredPackages() {
    return state.filteredPackages;
}

/**
 * Get current sort state
 * @returns Sort state with column and direction
 */
export function getSortState() {
    return { ...state.sortState };
}

/**
 * Set sort column and direction
 * @param column - Column name to sort by
 * @param direction - 'asc' or 'desc'
 */
export function setSortColumn(column: string, direction: string) {
    state.sortState = { column, direction };
}

/**
 * Toggle sort direction for a column
 * @param column - Column name
 * @returns New sort state
 */
export function toggleSortDirection(column: string) {
    if (state.sortState.column === column) {
        // Same column - toggle direction
        state.sortState.direction = state.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // New column - default to ascending
        state.sortState.column = column;
        state.sortState.direction = 'asc';
    }
    return { ...state.sortState };
}

/**
 * Get active OS filters
 * @returns Set of active OS filter names
 */
export function getOsFilters() {
    return new Set(state.osFilters);
}

/**
 * Set OS filters
 * @param filters - Array or Set of OS filter names
 */
export function setOsFilters(filters: Iterable<string>) {
    state.osFilters = new Set(filters);
}

/**
 * Toggle an OS filter
 * @param os - OS name to toggle
 */
export function toggleOsFilter(os: string) {
    if (os === OS_COMPAT_CONFIG.DEFAULT_FILTER) {
        // Selecting 'all' clears other filters
        state.osFilters = new Set([OS_COMPAT_CONFIG.DEFAULT_FILTER]);
    } else {
        // Remove 'all' if it exists
        state.osFilters.delete(OS_COMPAT_CONFIG.DEFAULT_FILTER);

        // Toggle the specific OS
        if (state.osFilters.has(os)) {
            state.osFilters.delete(os);
        } else {
            state.osFilters.add(os);
        }

        // If no filters remaining, add 'all'
        if (state.osFilters.size === 0) {
            state.osFilters.add(OS_COMPAT_CONFIG.DEFAULT_FILTER);
        }
    }
}

/**
 * Check if a specific OS filter is active
 * @param os - OS name
 * @returns True if filter is active
 */
export function isFilterActive(os: string) {
    return state.osFilters.has(os);
}

/**
 * Get search term
 * @returns Current search term
 */
export function getSearchTerm() {
    return state.searchTerm;
}

/**
 * Set search term
 * @param term - Search term
 */
export function setSearchTerm(term: string) {
    state.searchTerm = term.trim().toLowerCase();
}

/**
 * Apply all filters (search + OS filters) and sort
 * Updates state.filteredPackages
 */
export function applyFilters() {
    let filtered = [...state.packages];

    // Apply search filter
    if (state.searchTerm) {
        filtered = filtered.filter(pkg => {
            const text = `${pkg.name} ${pkg.category}`.toLowerCase();
            return text.includes(state.searchTerm);
        });
    }

    // Apply OS filter
    const hasOsFilter = !state.osFilters.has(OS_COMPAT_CONFIG.DEFAULT_FILTER);
    if (hasOsFilter) {
        filtered = filtered.filter(pkg => {
            return Array.from(state.osFilters).some(os => pkg[os]);
        });
    }

    // Apply sort
    filtered = sortPackages(filtered, state.sortState.column, state.sortState.direction);

    state.filteredPackages = filtered;
}

/**
 * Sort packages by column and direction
 * @param packages - Packages to sort
 * @param column - Column name
 * @param direction - 'asc' or 'desc'
 * @returns Sorted array
 */
function sortPackages(packages: OsCompatPackage[], column: string, direction: string) {
    return [...packages].sort((a, b) => {
        let valA = String(a[column]).toLowerCase();
        let valB = String(b[column]).toLowerCase();

        if (direction === 'asc') {
            return valA < valB ? -1 : valA > valB ? 1 : 0;
        } else {
            return valA > valB ? -1 : valA < valB ? 1 : 0;
        }
    });
}

/**
 * Reset all filters to default
 */
export function resetFilters() {
    state.osFilters = new Set([OS_COMPAT_CONFIG.DEFAULT_FILTER]);
    state.searchTerm = '';
    state.sortState = {
        column: OS_COMPAT_CONFIG.DEFAULT_SORT.COLUMN,
        direction: OS_COMPAT_CONFIG.DEFAULT_SORT.DIRECTION,
    };
}

/**
 * Get statistics about current filtered packages
 * @returns Statistics object
 */
export function getStatistics() {
    const list = state.filteredPackages;

    // Count Windows packages by status
    const windowsWingetCount = list.filter(p =>
        p.windowsStatus === OS_COMPAT_CONFIG.WINDOW_STATUSES.WINGET
    ).length;
    const windowsNonWingetCount = list.filter(p =>
        p.windowsStatus === OS_COMPAT_CONFIG.WINDOW_STATUSES.NON_WINGET
    ).length;

    return {
        total: list.length,
        windows: {
            total: list.filter(p => p.windows).length,
            winget: windowsWingetCount,
            nonWinget: windowsNonWingetCount,
        },
        macos: list.filter(p => p.macos).length,
        linux: list.filter(p => p.linux).length,
        freebsd: list.filter(p => p.freebsd).length,
    };
}
