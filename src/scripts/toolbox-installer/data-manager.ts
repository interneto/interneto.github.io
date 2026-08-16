/**
 * Data Manager
 * Handles package data loading, import/export, and favorites
 */

import { CONFIG } from '../shared/paths';
import { EVENT_NAMES } from '../shared/dom-constants';
import { getSelectedPackageIds, getElement } from '../shared/dom-utils';
import { initFavoritesData, getFavoritesForCurrentPage } from '../shared/favorites-store';
import type { PackageInfo, PackagesData } from './command-builder';

// Module state
let packagesData: PackagesData | null = null;

/**
 * Load packages from JSON file
 * @returns {Promise<Object>} The loaded packages data
 */
export async function loadPackages(): Promise<PackagesData> {
    try {
        const loadingSpinner = getElement('LOADING_SPINNER');

        const response = await fetch(CONFIG.JSON_URL);
        
        if (!response.ok) {
            throw new Error(`Failed to load packages data: ${response.statusText}`);
        }
        
        packagesData = await response.json() as PackagesData;
        
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
        
        // Dispatch event to notify that packages are loaded
        const event = new CustomEvent(EVENT_NAMES.PACKAGES_LOADED);
        document.dispatchEvent(event);
        
        return packagesData;
    } catch (error) {
        console.error('Error loading packages data:', error);
        
        const loadingSpinner = getElement('LOADING_SPINNER');
        const packageContainer = getElement('PACKAGE_CONTAINER');
        
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
        
        if (packageContainer) {
            packageContainer.innerHTML = `
                <div class="error-message">
                    <h3>Failed to Load Packages</h3>
                    <p>There was an error loading the package data. Please check your connection and try again.</p>
                    <button onclick="location.reload()">Reload Page</button>
                </div>
            `;
        }
        
        throw error;
    }
}

/**
 * Get the current packages data
 * @returns {Object|null} The packages data or null if not loaded
 */
export function getPackagesData(): PackagesData | null {
    return packagesData;
}

/**
 * Get package info by ID
 * @param {string} packageId - The package ID
 * @returns {Object|null} The package info or null if not found
 */
export function getPackageData(packageId: string): PackageInfo | null {
    if (!packagesData || !packagesData.packages) {
        return null;
    }
    return (packagesData.packages[packageId] as PackageInfo | undefined) || null;
}

/**
 * Import packages from a JSON file
 * @param file - The JSON file to import
 * @returns Result with importedCount and notFoundCount
 */
export async function importPackagesFromFile(file: File) {
    if (!file) {
        throw new Error('No file provided');
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const contents = (event.target as FileReader).result as string;
                const importedPackages = JSON.parse(contents);
                
                // Validate that it's an array
                if (!Array.isArray(importedPackages)) {
                    throw new Error('Invalid format: expected an array of package IDs');
                }

                // Wait for packages to be loaded if needed
                if (!packagesData) {
                    await new Promise(resolveLoaded => {
                        document.addEventListener(EVENT_NAMES.PACKAGES_LOADED, resolveLoaded, { once: true });
                    });
                }

                let importedCount = 0;
                let notFoundCount = 0;
                
                // Select imported packages
                importedPackages.forEach(pkgId => {
                    const checkbox = document.getElementById(pkgId) as HTMLInputElement | null;
                    if (checkbox) {
                        checkbox.checked = true;
                        importedCount++;
                    } else {
                        notFoundCount++;
                    }
                });

                resolve({
                    importedCount,
                    notFoundCount,
                    packages: importedPackages,
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file. Please try again.'));
        };

        reader.readAsText(file);
    });
}

/**
 * Export currently selected packages as JSON
 */
export async function exportPackages() {
    try {
        // Wait for packages if not loaded
        if (!packagesData) {
            await new Promise(resolve => {
                document.addEventListener(EVENT_NAMES.PACKAGES_LOADED, resolve, { once: true });
            });
        }

        const selectedPackageIds = getSelectedPackageIds();
        
        const jsonData = JSON.stringify(selectedPackageIds, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = CONFIG.EXPORT_FILENAME;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting packages:', error);
        throw error;
    }
}

/**
 * Load and apply favorite packages from fav-packages.json
 * @returns Result with loadedCount
 */
export async function loadFavorites() {
    try {
        await initFavoritesData();
        const favorites = getFavoritesForCurrentPage();

        // Wait for packages to be loaded if needed
        if (!packagesData) {
            await new Promise(resolve => {
                document.addEventListener(EVENT_NAMES.PACKAGES_LOADED, resolve, { once: true });
            });
        }
        
        // Deselect all first
        const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="pkg"]');
        checkboxes.forEach(cb => cb.checked = false);
        
        // Select favorites
        let loadedCount = 0;
        favorites.forEach(pkgId => {
            const checkbox = document.getElementById(pkgId) as HTMLInputElement | null;
            if (checkbox) {
                checkbox.checked = true;
                loadedCount++;
            }
        });

        return { loadedCount, favorites };
    } catch (error) {
        console.error('Error loading favorites:', error);
        throw error;
    }
}

/**
 * Wait for packages data to be loaded
 * @returns Resolves when packages are loaded
 */
export async function waitForPackagesLoaded() {
    if (packagesData) {
        return packagesData;
    }
    
    return new Promise(resolve => {
        document.addEventListener(EVENT_NAMES.PACKAGES_LOADED, () => {
            resolve(packagesData);
        }, { once: true });
    });
}
