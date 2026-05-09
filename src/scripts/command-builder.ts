/**
 * Command Builder
 * Pure logic for building installation commands based on selected packages and distro
 */

import { DISTRO_PREFIXES } from './config';

/**
 * Build an installation command from selected packages and distro
 * @param {string} selectedDistro - The package manager key (e.g., 'linux_arch_pacman')
 * @param {Array} selectedPackageIds - Array of selected package IDs
 * @param {Object} packagesData - The packages data object with structure: { packages: { id: {...} } }
 * @returns {Object} Result object with command, warnings, and metadata
 * @returns {string} result.finalCommand - The main installation command
 * @returns {string} result.aurCommand - AUR command (if applicable for Arch)
 * @returns {string} result.resultCommand - Combined final command
 * @returns {Array} result.nonInstallablePackages - Packages not available for this distro
 * @returns {boolean} result.hasCommand - Whether a command was generated
 */
export function buildCommand(selectedDistro, selectedPackageIds, packagesData) {
    const installationCommands = [];
    const aurPackages = [];
    const nonInstallablePackages = [];

    // Process each selected package
    selectedPackageIds.forEach(packageId => {
        const pkgInfo = packagesData.packages[packageId];
        
        if (!pkgInfo) {
            // Skip if package not found in data
            return;
        }

        if (pkgInfo.package_manager[selectedDistro]) {
            // Package available for this distro
            installationCommands.push(pkgInfo.package_manager[selectedDistro]);
        } else if (selectedDistro === 'linux_arch_pacman' && pkgInfo.package_manager['linux_arch_aur']) {
            // For Arch, try AUR as fallback
            aurPackages.push(pkgInfo.package_manager['linux_arch_aur']);
        } else {
            // Package not available for this distro
            nonInstallablePackages.push(pkgInfo.name);
        }
    });

    // Get command prefix for this distro
    const commandPrefix = getCommandPrefix(selectedDistro);

    // Build final commands
    const finalCommand = installationCommands.length
        ? `${commandPrefix} ${installationCommands.join(' ')}`
        : '';

    const aurCommand = aurPackages.length
        ? `yay -S ${aurPackages.join(' ')}`
        : '';

    // Combine both commands if both exist
    const resultCommand = [finalCommand, aurCommand].filter(cmd => cmd).join(' && ');

    return {
        finalCommand,
        aurCommand,
        resultCommand,
        nonInstallablePackages,
        hasCommand: !!resultCommand,
    };
}

/**
 * Get the command prefix for a specific distro
 * @param {string} distroKey - The distro key (e.g., 'linux_arch_pacman')
 * @returns {string} The command prefix (e.g., 'sudo pacman -S')
 */
export function getCommandPrefix(distroKey) {
    return DISTRO_PREFIXES[distroKey] || '';
}

/**
 * Get all available distro keys
 * @returns {Array<string>} Array of distro keys
 */
export function getAvailableDistros() {
    return Object.keys(DISTRO_PREFIXES);
}

/**
 * Check if a distro key is valid
 * @param {string} distroKey - The distro key to check
 * @returns {boolean} True if valid distro
 */
export function isValidDistro(distroKey) {
    return distroKey in DISTRO_PREFIXES;
}
