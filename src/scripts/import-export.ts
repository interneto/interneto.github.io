/**
 * Import / Export Manager
 * Handles file import/export UI and file input setup
 */

import { CONFIG, CLASS_NAMES, EVENT_NAMES } from './config';
import {
    getElement,
} from './dom-utils';
import {
    importPackagesFromFile,
    exportPackages,
    loadFavorites,
    waitForPackagesLoaded,
} from './data-manager';
import {
    updateAllCategoryCheckboxes,
    updateSelectAllState,
} from './checkbox-manager';
import {
    autoGenerateCommand,
} from './interaction-manager';

/**
 * Setup the options select dropdown for import/export/favorites
 */
export function setupOptionsSelect() {
    const optionsSelect = getElement('OPTIONS_SELECT');
    
    if (!optionsSelect) return;
    
    optionsSelect.addEventListener('change', async function(e) {
        const target = e.target as HTMLSelectElement;
        const action = target.value;
        
        try {
            if (action === 'loadFavorites') {
                await handleLoadFavorites();
            } else if (action === 'importPackages') {
                handleImportPackages();
            } else if (action === 'exportPackages') {
                await handleExportPackages();
            }
        } catch (error) {
            console.error('Error handling option:', error);
            alert(`Error: ${(error as Error).message}`);
        } finally {
            // Reset select to default option
            target.value = '';
        }
    });
}

/**
 * Setup the file input for importing packages
 */
export function setupFileInput() {
    const fileInput = getElement('FILE_INPUT');
    
    if (!fileInput) return;
    
    fileInput.addEventListener('change', async function(e) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;
        
        try {
            // Validate file size
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                throw new Error(`File is too large. Maximum size is ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB.`);
            }
            
            // Validate file type
            if (!file.name.endsWith(CONFIG.FILE_EXTENSION)) {
                throw new Error('Please select a valid JSON file.');
            }
            
            await handleFileImport(file);
        } catch (error) {
            console.error('Error importing file:', error);
            alert(`Error importing packages: ${(error as Error).message}`);
        } finally {
            // Reset file input
            (fileInput as HTMLInputElement).value = '';
        }
    });
}

/**
 * Handle loading favorite packages
 */
async function handleLoadFavorites() {
    try {
        await waitForPackagesLoaded();
        const result = await loadFavorites();
        
        // Update UI
        updateAllCategoryCheckboxes();
        updateSelectAllState();
        autoGenerateCommand();
        
        alert(`${result.loadedCount} favorite packages loaded successfully!`);
    } catch (error) {
        console.error('Error loading favorites:', error);
        throw new Error(`Failed to load favorites: ${(error as Error).message}`);
    }
}

/**
 * Handle importing packages from file
 */
function handleImportPackages() {
    const fileInput = getElement('FILE_INPUT');
    
    if (!fileInput) {
        console.error('File input element not found');
        return;
    }
    
    // Reset input to allow re-importing same file
    (fileInput as HTMLInputElement).value = '';
    fileInput.click();
}

/**
 * Handle file import after file is selected
 */
async function handleFileImport(file: File) {
    try {
        const result = await importPackagesFromFile(file) as { importedCount: number; notFoundCount: number };
        
        // Update UI
        updateAllCategoryCheckboxes();
        updateSelectAllState();
        autoGenerateCommand();
        
        const message = `Packages imported successfully!\n${result.importedCount} packages selected`;
        if (result.notFoundCount > 0) {
            alert(`${message}\n${result.notFoundCount} packages not found`);
        } else {
            alert(message);
        }
    } catch (error) {
        console.error('Error importing packages:', error);
        throw new Error(`Failed to import: ${(error as Error).message}`);
    }
}

/**
 * Handle exporting selected packages
 */
async function handleExportPackages() {
    try {
        await exportPackages();
        alert('Selected packages exported successfully!');
    } catch (error) {
        console.error('Error exporting packages:', error);
        throw new Error(`Failed to export: ${(error as Error).message}`);
    }
}

/**
 * Trigger file import by clicking the hidden file input
 * This is called directly by HTML
 */
export function triggerImport() {
    handleImportPackages();
}

/**
 * Trigger export by calling the export function
 * This is called directly by HTML
 */
export async function triggerExport() {
    try {
        await handleExportPackages();
    } catch (error) {
        console.error('Error exporting:', error);
        alert(`Error exporting packages: ${(error as Error).message}`);
    }
}

/**
 * Trigger loading favorites
 * This is called directly by HTML
 */
export async function triggerLoadFavorites() {
    try {
        await handleLoadFavorites();
    } catch (error) {
        console.error('Error loading favorites:', error);
        alert(`Error loading favorites: ${(error as Error).message}`);
    }
}
