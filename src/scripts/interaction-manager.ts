/**
 * Interaction Manager
 * Handles user interactions: OS selection, button toggles, copy, command generation
 */

import { CLASS_NAMES, EVENT_NAMES } from './config';
import {
    getActiveOS,
    getActiveDistro,
    getElement,
    updateActiveButton,
    getSelectedPackageIds,
} from './dom-utils';
import {
    updateAllCategoryCheckboxes,
    updateSelectAllState,
} from './checkbox-manager';
import {
    buildCommand,
} from './command-builder';
import {
    getPackagesData,
} from './data-manager';
import {
    applyDistroVisibilityFilter,
} from './ui-builder';

/**
 * Setup OS selector buttons and distro visibility
 */
export function setupOSSelector() {
    const osBtns = document.querySelectorAll(`.${CLASS_NAMES.OS_BTN}`);
    const linuxSelector = getElement('LINUX_DISTRO_SELECTOR');
    const distroBtns = document.querySelectorAll(`.${CLASS_NAMES.DISTRO_BTN}`);

    osBtns.forEach(btn => {
        btn.addEventListener('click', function(this: HTMLElement) {
            updateActiveButton(CLASS_NAMES.OS_BTN, this, true);

            // Show/hide Linux distro selector SOLO si existe (desktop)
            const os = this.dataset.os;
            if (linuxSelector) {
                if (os === 'linux') {
                    linuxSelector.classList.remove('hidden');
                } else {
                    linuxSelector.classList.add('hidden');
                }
            }

            // Filter packages by selected distro
            applyDistroVisibilityFilter(getDistroFromOS(os));

            // Auto-generate command with new OS
            autoGenerateCommand();

            // Notify OS change
            document.dispatchEvent(new CustomEvent(EVENT_NAMES.OS_CHANGED));
        });
    });

    // Activar el primer SO por defecto si ninguno está activo (mobile)
    if (osBtns.length && !document.querySelector(`.${CLASS_NAMES.OS_BTN}.${CLASS_NAMES.ACTIVE}`)) {
        (osBtns[0] as HTMLElement).classList.add(CLASS_NAMES.ACTIVE);
        const firstOS = (osBtns[0] as HTMLElement).dataset.os;
        applyDistroVisibilityFilter(getDistroFromOS(firstOS));
        autoGenerateCommand();
    } else {
        // Apply filter for the already-active OS on initial load
        const activeOS = (document.querySelector(`.${CLASS_NAMES.OS_BTN}.${CLASS_NAMES.ACTIVE}`) as HTMLElement | null)?.dataset.os;
        if (activeOS) applyDistroVisibilityFilter(getDistroFromOS(activeOS));
    }

    // Setup distro button listeners SOLO si existen (desktop)
    if (distroBtns.length) {
        distroBtns.forEach(btn => {
            btn.addEventListener('click', function(this: HTMLElement) {
                updateActiveButton(CLASS_NAMES.DISTRO_BTN, this, false);
                applyDistroVisibilityFilter(this.dataset.distro);
                autoGenerateCommand();
            });

            // Keyboard support
            btn.addEventListener('keydown', function(this: HTMLElement, e: Event) {
                const ke = e as KeyboardEvent;
                if (ke.key === 'Enter' || ke.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }
}

/**
 * Setup toggle all categories button
 */
export function setupToggleAllButton() {
    const toggleAllBtn = getElement('TOGGLE_ALL_BTN');
    const toggleAllLabel = getElement('TOGGLE_ALL_LABEL');
    
    if (!toggleAllBtn) return;
    
    let allCollapsed = false;
    
    toggleAllBtn.addEventListener('click', function() {
        const categories = document.querySelectorAll(`.${CLASS_NAMES.CATEGORY}`);
        
        if (allCollapsed) {
            // Expand all
            categories.forEach(cat => cat.classList.remove(CLASS_NAMES.COLLAPSED));
            if (toggleAllLabel) toggleAllLabel.textContent = 'Collapse';
            toggleAllBtn.classList.remove(CLASS_NAMES.COLLAPSED);
            allCollapsed = false;
        } else {
            // Collapse all
            categories.forEach(cat => cat.classList.add(CLASS_NAMES.COLLAPSED));
            if (toggleAllLabel) toggleAllLabel.textContent = 'Expand';
            toggleAllBtn.classList.add(CLASS_NAMES.COLLAPSED);
            allCollapsed = true;
        }
    });
}

function updateSearchGroupVisibility(packageContainer: HTMLElement) {
    const visibleLabelSelector = `label:not(.${CLASS_NAMES.FOSS_HIDDEN}):not(.${CLASS_NAMES.SEARCH_HIDDEN}):not(.${CLASS_NAMES.DISTRO_HIDDEN})`;

    const subcategories = packageContainer.querySelectorAll<HTMLElement>(`.${CLASS_NAMES.SUBCATEGORY}`);
    subcategories.forEach((subcategory) => {
        const hasVisibleLabels = !!subcategory.querySelector(visibleLabelSelector);
        subcategory.classList.toggle(CLASS_NAMES.SEARCH_HIDDEN, !hasVisibleLabels);
    });

    const categories = packageContainer.querySelectorAll<HTMLElement>(`.${CLASS_NAMES.CATEGORY}`);
    categories.forEach((category) => {
        const hasVisibleLabels = !!category.querySelector(visibleLabelSelector);
        category.classList.toggle(CLASS_NAMES.SEARCH_HIDDEN, !hasVisibleLabels);
    });
}

/**
 * Setup package search input for desktop/mobile generators.
 */
export function setupSearchInput() {
    const searchInput = getElement('SEARCH_INPUT');
    const packageContainer = getElement('PACKAGE_CONTAINER');

    if (!searchInput || !packageContainer) return;

    let searchTimeout: ReturnType<typeof setTimeout>;

    searchInput.addEventListener('input', () => {
        // Clear previous timeout to debounce
        clearTimeout(searchTimeout);

        const query = (searchInput as HTMLInputElement).value.trim().toLowerCase();

        // Only apply filters if query has content
        if (query.length === 0) {
            // Show all packages when search is cleared
            const labels = packageContainer.querySelectorAll<HTMLLabelElement>('label');
            labels.forEach((label) => {
                label.classList.remove(CLASS_NAMES.SEARCH_HIDDEN);
            });
            updateSearchGroupVisibility(packageContainer);
            updateAllCategoryCheckboxes();
            updateSelectAllState();
            autoGenerateCommand();
            return;
        }

        // Debounce the search for performance (100ms delay)
        searchTimeout = setTimeout(() => {
            const labels = packageContainer.querySelectorAll<HTMLLabelElement>('label');

            labels.forEach((label) => {
                const searchText = label.dataset.search || '';
                // Support word pattern matching: search for query as substring (like "*text*" wildcard)
                const matches = searchText.includes(query);
                label.classList.toggle(CLASS_NAMES.SEARCH_HIDDEN, !matches);
            });

            updateSearchGroupVisibility(packageContainer);
            updateAllCategoryCheckboxes();
            updateSelectAllState();
            autoGenerateCommand();
        }, 100);
    });
}

/**
 * Setup copy-names-list button
 */
export function setupCopyListButton() {
    const copyListBtn = document.getElementById('copyListBtn');
    if (!copyListBtn) return;

    copyListBtn.addEventListener('click', async () => {
        const packagesData = getPackagesData();
        const ids = getSelectedPackageIds();
        if (!ids.length || !packagesData) return;

        const names = ids
            .map((id) => packagesData.packages[id]?.name ?? id)
            .join('\n');

        try {
            await navigator.clipboard.writeText(names);
            copyListBtn.textContent = '✓ Copied!';
            setTimeout(() => { copyListBtn.textContent = '📝 Names'; }, 2000);
        } catch {
            alert('Failed to copy to clipboard');
        }
    });
}

/**
 * Setup copy command button
 */
export function setupCopyButton() {
    const copyBtn = getElement('COPY_COMMAND_BTN');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', async function() {
        const commandElement = getElement('INSTALLATION_COMMAND');
        if (!commandElement) return;
        
        const commandText = commandElement.textContent;
        
        if (commandText && !isPlaceholderText(commandText)) {
            try {
                await navigator.clipboard.writeText(commandText);
                
                // Visual feedback
                copyBtn.textContent = '✓ Copied!';
                copyBtn.classList.add(CLASS_NAMES.COPIED);
                
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copy';
                    copyBtn.classList.remove(CLASS_NAMES.COPIED);
                }, 2000);
            } catch (error) {
                console.error('Failed to copy:', error);
                alert('Failed to copy to clipboard');
            }
        }
    });
}

/**
 * Setup auto-generation of command on selection changes
 */
export function setupAutoCommandGeneration() {
    syncCommandFooterSpace();

    const commandFooter = document.getElementById('commandFooter');
    if (commandFooter && 'ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(() => syncCommandFooterSpace());
        resizeObserver.observe(commandFooter);
    }

    window.addEventListener('resize', syncCommandFooterSpace);

    // Trigger on package checkbox change
    document.addEventListener('change', function(e) {
        const target = e.target as HTMLInputElement | null;
        if (target?.type === 'checkbox' && target?.classList.contains(CLASS_NAMES.PACKAGE_CHECKBOX)) {
            autoGenerateCommand();
        }
    });
    
    // Trigger on selection or filter changes
    document.addEventListener(EVENT_NAMES.SELECTION_CHANGED, autoGenerateCommand);
    document.addEventListener(EVENT_NAMES.FILTER_CHANGED, autoGenerateCommand);
    document.addEventListener(EVENT_NAMES.OS_CHANGED, autoGenerateCommand);
}

/**
 * Auto-generate installation command based on current selections
 */
export function autoGenerateCommand() {
    try {
        const commandFooter = document.getElementById('commandFooter');
        const activeOS = getActiveOS();
        
        if (!activeOS) {
            const commandElement = getElement('INSTALLATION_COMMAND');
            if (commandElement) {
                commandElement.textContent = 'Please select an operating system';
            }
            return;
        }

        // Map OS to distro key
        let selectedDistro = getDistroFromOS(activeOS);
        
        if (!selectedDistro) {
            const commandElement = getElement('INSTALLATION_COMMAND');
            if (commandElement) {
                commandElement.textContent = 'Please select an operating system';
            }
            return;
        }

        const selectedPackageIds = getSelectedPackageIds();

        updatePkgCount(selectedPackageIds.length);

        if (selectedPackageIds.length === 0) {
            const commandElement = getElement('INSTALLATION_COMMAND');
            if (commandElement) {
                commandElement.textContent = 'Select packages to generate installation command...';
            }
            if (commandFooter) commandFooter.hidden = true;
            syncCommandFooterSpace();
            return;
        }

        // Get packages data
        const packagesData = getPackagesData();
        if (!packagesData) {
            console.error('Packages data not available');
            return;
        }

        // Build the command
        const result = buildCommand(selectedDistro, selectedPackageIds, packagesData);

        // Display command
        const commandElement = getElement('INSTALLATION_COMMAND');
        if (commandElement) {
            if (result.resultCommand) {
                commandElement.textContent = result.resultCommand;
            } else {
                commandElement.textContent = 'No compatible packages selected for this OS';
            }
        }
        if (commandFooter) commandFooter.hidden = false;
        syncCommandFooterSpace();
    } catch (error) {
        console.error('Error generating command:', error);
    }
}

function updatePkgCount(count: number) {
    const el = document.getElementById('pkgCount');
    if (!el) return;
    el.textContent = count > 0 ? `${count} selected` : '';
}

function syncCommandFooterSpace() {
    const commandFooter = document.getElementById('commandFooter') as HTMLElement | null;
    const footerSpace = commandFooter && !commandFooter.hidden
        ? commandFooter.offsetHeight + 16
        : 0;

    document.documentElement.style.setProperty('--command-footer-space', `${footerSpace}px`);
}

/**
 * Get distro key based on selected OS
 * @param {string} activeOS - The active OS
 * @returns {string|null} The distro key or null
 */
function getDistroFromOS(activeOS: string | undefined): string | null {
    switch(activeOS) {
        case 'linux':
            return getActiveDistro() || 'linux_arch_pacman';
        case 'windows':
            return 'windows_winget';
        case 'macos':
            return 'macos_brew';
        case 'freebsd':
            return 'freebsd_pkg';
        case 'android':
            return 'android_pkg';
        case 'ios':
            return 'ios_pkg';
        default:
            return null;
    }
}

/**
 * Check if text is a placeholder message
 * @param {string} text - The text to check
 * @returns {boolean} True if text is placeholder
 */
function isPlaceholderText(text: string): boolean {
    return text === 'Select packages to generate installation command...' ||
           text === 'Please select an operating system' ||
           text === 'No compatible packages selected for this OS';
}
