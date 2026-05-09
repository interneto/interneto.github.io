/**
 * FOSS Filter
 * Manages the FOSS-only toggle and package filtering
 */

import { NON_FOSS_PACKAGES, CLASS_NAMES, EVENT_NAMES } from './config';
import {
    getElement,
    getPackageCheckbox,
    addClass,
    removeClass,
} from './dom-utils';
import {
    updateAllCategoryCheckboxes,
    updateSelectAllState,
} from './checkbox-manager';

/**
 * Setup the FOSS toggle button
 */
export function setupFossToggle() {
    const fossToggleBtn = getElement('FOSS_TOGGLE_BTN');
    if (!fossToggleBtn) return;

    let isActive = false;

    fossToggleBtn.addEventListener('click', function() {
        isActive = !isActive;
        
        if (isActive) {
            fossToggleBtn.classList.add(CLASS_NAMES.ACTIVE);
        } else {
            fossToggleBtn.classList.remove(CLASS_NAMES.ACTIVE);
        }
        
        applyFossFilter(isActive);
    });
}

/**
 * Apply FOSS filter - hide/show non-FOSS packages
 * @param {boolean} isActive - Whether to show only FOSS packages
 */
export function applyFossFilter(isActive) {
    NON_FOSS_PACKAGES.forEach(pkgId => {
        const checkbox = getPackageCheckbox(pkgId);
        if (checkbox) {
            const label = checkbox.closest('label');
            if (label) {
                if (isActive) {
                    // Hide non-FOSS package
                    addClass(label, 'FOSS_HIDDEN');
                    checkbox.checked = false;
                } else {
                    // Show non-FOSS package
                    removeClass(label, 'FOSS_HIDDEN');
                }
            }
        }
    });

    // Update state after filter change
    updateAllCategoryCheckboxes();
    updateSelectAllState();
    
    // Notify that filter has changed
    document.dispatchEvent(new CustomEvent(EVENT_NAMES.FILTER_CHANGED));
}

/**
 * Check if FOSS filter is currently active
 * @returns {boolean} True if FOSS filter is active
 */
export function isFossFilterActive() {
    const fossToggleBtn = getElement('FOSS_TOGGLE_BTN');
    return fossToggleBtn ? fossToggleBtn.classList.contains(CLASS_NAMES.ACTIVE) : false;
}

/**
 * Get count of non-FOSS packages currently visible
 * @returns {number}
 */
export function getVisibleNonFossCount() {
    let count = 0;
    NON_FOSS_PACKAGES.forEach(pkgId => {
        const checkbox = getPackageCheckbox(pkgId);
        if (checkbox) {
            const label = checkbox.closest('label');
            if (label && !label.classList.contains(CLASS_NAMES.FOSS_HIDDEN)) {
                count++;
            }
        }
    });
    return count;
}
