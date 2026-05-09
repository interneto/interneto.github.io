/**
 * Toolbox Installer - Main Application
 * Entry point for initializing all modules and functionality
 */

import { loadPackages, getPackagesData } from './data-manager';
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
        // Load packages data
        console.log('Loading packages...');
        const packagesData = await loadPackages();
        
        // Generate UI
        console.log('Generating packages UI...');
        generatePackages(packagesData);
        
        // Setup all event handlers
        console.log('Setting up event handlers...');
        setupSelectAllCheckbox();
        setupCategoryCheckboxes();
        setupFossToggle();
        
        // Setup interactions
        setupOSSelector();
        setupSearchInput();
        setupToggleAllButton();
        setupCopyButton();
        setupAutoCommandGeneration();
        
        // Setup import/export
        setupOptionsSelect();
        setupFileInput();
        
        console.log('Application initialized successfully');
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
