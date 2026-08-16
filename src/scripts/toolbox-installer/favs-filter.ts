/**
 * Favs Filter
 * Manages the Favorites-only toggle and package filtering.
 * Inverse of foss-filter: hides everything NOT in the favorites list when active.
 */

import { CLASS_NAMES, EVENT_NAMES } from '../shared/dom-constants';
import { getFavoritesForCurrentPage } from '../shared/favorites-store';
import {
    getElement,
    addClass,
    removeClass,
} from '../shared/dom-utils';
import {
    updateAllCategoryCheckboxes,
    updateSelectAllState,
} from './checkbox-manager';

/**
 * Setup the Favs toggle button
 */
export function setupFavsToggle() {
    const favsToggleBtn = getElement('FAVS_TOGGLE_BTN');
    if (!favsToggleBtn) return;

    let isActive = false;

    favsToggleBtn.addEventListener('click', function() {
        isActive = !isActive;

        if (isActive) {
            favsToggleBtn.classList.add(CLASS_NAMES.ACTIVE);
        } else {
            favsToggleBtn.classList.remove(CLASS_NAMES.ACTIVE);
        }

        applyFavsFilter(isActive);
    });
}

/**
 * Apply Favs filter - show only favorite packages, hide everything else
 * @param isActive - Whether to show only favorite packages
 */
export function applyFavsFilter(isActive: boolean) {
    const favorites = new Set(getFavoritesForCurrentPage());

    document.querySelectorAll<HTMLInputElement>(`.${CLASS_NAMES.PACKAGE_CHECKBOX}`).forEach((checkbox) => {
        const label = checkbox.closest('label');
        if (!label) return;

        const isFavorite = favorites.has(checkbox.id || checkbox.value);

        if (isActive && !isFavorite) {
            addClass(label, 'FAVS_HIDDEN');
            checkbox.checked = false;
        } else {
            removeClass(label, 'FAVS_HIDDEN');
        }
    });

    updateAllCategoryCheckboxes();
    updateSelectAllState();

    document.dispatchEvent(new CustomEvent(EVENT_NAMES.FILTER_CHANGED));
}

/**
 * Check if Favs filter is currently active
 */
export function isFavsFilterActive() {
    const favsToggleBtn = getElement('FAVS_TOGGLE_BTN');
    return favsToggleBtn ? favsToggleBtn.classList.contains(CLASS_NAMES.ACTIVE) : false;
}
