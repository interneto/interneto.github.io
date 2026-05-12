/**
 * Toolbox - Main Application
 * Entry point for initializing all modules and functionality
 */

import { loadPackages } from './data-manager';
import { generatePackages } from './ui-builder';
import {
    setupCategoryCheckboxes,
    setupSelectAllCheckbox,
} from './checkbox-manager';
import { setupFossToggle } from './foss-filter';
import {
    setupOSSelector,
    setupSearchInput,
    setupToggleAllButton,
    setupCopyButton,
    setupAutoCommandGeneration,
} from './interaction-manager';
import {
    setupOptionsSelect,
    setupFileInput,
} from './import-export';

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        const packagesData = await loadPackages();
        
        generatePackages(packagesData);
        
        setupSelectAllCheckbox();
        setupCategoryCheckboxes();
        setupFossToggle();
        
        setupOSSelector();
        setupSearchInput();
        setupToggleAllButton();
        setupCopyButton();
        setupAutoCommandGeneration();
        
        setupOptionsSelect();
        setupFileInput();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
