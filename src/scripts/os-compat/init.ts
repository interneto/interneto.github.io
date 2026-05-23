/**
 * OS Compatibility Application Initialization
 * Entry point for desktop-os-compatibility.html
 */

import { initConfigData } from '../shared/data-loader';
import { initTheme } from '../site/theme-manager';
import { loadCompatibilityData } from './data';
import * as state from './state';
import * as table from './table';
import * as interactions from './interactions';
import { onDOMReady } from '../shared/dom-utils';

/**
 * Initialize the OS Compatibility application
 */
async function init() {
    try {
        // Initialize theme first (synchronous)
        initTheme();

        // Show loading state
        table.showLoading('Loading package data...');

        // Load JSON config + packages in parallel
        await initConfigData();
        const packages = await loadCompatibilityData();
        
        // Initialize state with loaded packages
        state.setPackages(packages);
        
        // Apply default filters and sorting
        state.applyFilters();
        
        // Get filtered packages
        const filtered = state.getFilteredPackages();
        
        // Setup all interactions (event listeners)
        interactions.setupInteractions();
        
        // Initial render
        table.renderTable(filtered);
        table.updateStats(state.getStatistics());
        table.updateFilterChips(state.getOsFilters());
        table.updateSortArrows(state.getSortState());
        
        // Log success for debugging
        console.info(`✓ OS Compatibility loaded: ${packages.length} packages`);
        
    } catch (error) {
        console.error('Failed to initialize OS Compatibility:', error);
        table.showError('Failed to load package data. Please refresh the page.');
    }
}

// Auto-initialize when DOM is ready
onDOMReady(init);

// Export for testing or manual initialization
export { init };
