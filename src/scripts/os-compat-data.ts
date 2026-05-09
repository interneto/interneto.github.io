/**
 * OS Compatibility Data Module
 * Handles loading and transforming package data for compatibility table
 */

import { OS_COMPAT_CONFIG } from './config';

interface RawPackageManager {
    windows_winget?: string | null;
    macos_brew?: string | null;
    linux_arch_pacman?: string | null;
    linux_arch_aur?: string | null;
    linux_debian_apt?: string | null;
    linux_fedora_rpm?: string | null;
    linux_gentoo_emerge?: string | null;
    linux_flatpak?: string | null;
    linux_snap?: string | null;
    unix_nix_env?: string | null;
    freebsd_pkg?: string | null;
    [key: string]: string | null | undefined;
}

interface RawPackage {
    name: string;
    category?: string;
    subcategory?: string;
    package_manager?: RawPackageManager;
}

interface CompatPackage {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    windows: boolean;
    windowsStatus: string;
    macos: boolean;
    linux: boolean;
    freebsd: boolean;
}

// Module state
let packagesData: CompatPackage[] = [];

/**
 * Load and transform package compatibility data
 * @returns {Promise<Array>} Array of package objects with OS compatibility info
 */
export async function loadCompatibilityData() {
    try {
        const response = await fetch(OS_COMPAT_CONFIG.JSON_URL);
        
        if (!response.ok) {
            throw new Error(`Failed to load packages: ${response.statusText}`);
        }
        
        const data = await response.json();
        packagesData = transformPackageData(data);
        
        return packagesData;
    } catch (error) {
        console.error('Error loading compatibility data:', error);
        throw error;
    }
}

/**
 * Get all loaded packages
 * @returns {Array} Array of package objects
 */
export function getPackages() {
    return packagesData;
}

/**
 * Get a package by ID
 * @param {string} id - Package ID
 * @returns {Object|null} Package object or null if not found
 */
export function getPackageById(id) {
    return packagesData.find(pkg => pkg.id === id) || null;
}

/**
 * Transform raw JSON data into compatibility matrix
 * @param {Object} jsonData - Raw JSON from *-pkgs.json
 * @returns {Array} Transformed package array
 */
function transformPackageData(jsonData: { packages: Record<string, RawPackage> }): CompatPackage[] {
    const windowsNonWingetIds = new Set(
        OS_COMPAT_CONFIG.WINDOWS_NON_WINGET.map(pkg => pkg.id)
    );
    
    return Object.entries(jsonData.packages).map(([id, pkg]) => {
        const pm = pkg.package_manager;
        
        // Check Windows support
        const hasWinget = isPresent(pm?.windows_winget);
        const isNonWingetWindows = windowsNonWingetIds.has(id);
        const hasWindows = hasWinget || isNonWingetWindows;
        const windowsStatus = getWindowsStatus(hasWinget, isNonWingetWindows);
        
        // Check other OS support
        const hasMacOS = isPresent(pm?.macos_brew);
        const hasLinux = checkLinuxSupport(pm);
        const hasFreeBSD = isPresent(pm?.freebsd_pkg);
        
        return {
            id,
            name: pkg.name,
            category: pkg.category ?? '',
            subcategory: pkg.subcategory ?? '',
            windows: hasWindows,
            windowsStatus,
            macos: hasMacOS,
            linux: hasLinux,
            freebsd: hasFreeBSD,
        };
    });
}

/**
 * Check if a value is present (not null, undefined, or empty string)
 * @param {*} value - Value to check
 * @returns {boolean} True if value is present
 */
function isPresent(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
}

/**
 * Check Linux support across multiple package managers
 * @param {Object} pm - Package manager object
 * @returns {boolean} True if Linux is supported
 */
function checkLinuxSupport(pm) {
    const linuxPackageManagers = [
        pm?.linux_arch_pacman,
        pm?.linux_arch_aur,
        pm?.linux_debian_apt,
        pm?.linux_fedora_rpm,
        pm?.linux_gentoo_emerge,
        pm?.linux_flatpak,
        pm?.linux_snap,
        pm?.unix_nix_env,
    ];
    
    return linuxPackageManagers.some(isPresent);
}

/**
 * Determine Windows status (winget, non-winget, or none)
 * @param {boolean} hasWinget - Has winget support
 * @param {boolean} isNonWinget - Is in non-winget list
 * @returns {string} Status string
 */
function getWindowsStatus(hasWinget, isNonWinget) {
    if (hasWinget) {
        return OS_COMPAT_CONFIG.WINDOW_STATUSES.WINGET;
    }
    if (isNonWinget) {
        return OS_COMPAT_CONFIG.WINDOW_STATUSES.NON_WINGET;
    }
    return OS_COMPAT_CONFIG.WINDOW_STATUSES.NONE;
}

/**
 * Get count of packages by OS
 * @param {string} os - Operating system name
 * @returns {number} Count of packages available for that OS
 */
export function getCountByOS(os) {
    return packagesData.filter(pkg => pkg[os]).length;
}

/**
 * Get count of packages by category
 * @param {string} category - Category name
 * @returns {number} Count of packages in that category
 */
export function getCountByCategory(category) {
    return packagesData.filter(pkg => pkg.category === category).length;
}

/**
 * Get all unique categories
 * @returns {Array<string>} Array of unique category names
 */
export function getCategories() {
    const categories = new Set(packagesData.map(pkg => pkg.category));
    return Array.from(categories).sort();
}

/**
 * Filter packages by OS availability
 * @param {string} os - Operating system name
 * @returns {Array} Filtered package array
 */
export function filterByOS(os) {
    if (os === 'all' || os === OS_COMPAT_CONFIG.DEFAULT_FILTER) {
        return packagesData;
    }
    return packagesData.filter(pkg => pkg[os]);
}
