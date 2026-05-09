/**
 * DOM Utilities
 * Centralized DOM query and manipulation functions to avoid duplication
 */

import { CLASS_NAMES, ATTR_NAMES, ELEMENT_IDS } from './config';

/**
 * Get all selected package IDs (visible or hidden by FOSS filter)
 * @returns {string[]} Array of selected package IDs
 */
export function getSelectedPackageIds() {
    return Array.from(document.querySelectorAll<HTMLInputElement>('input[name="pkg"]:checked'))
        .map(checkbox => checkbox.value);
}

/**
 * Get all visible (not hidden by FOSS filter) package checkboxes
 * @returns {HTMLInputElement[]} Array of visible checkbox elements
 */
export function getVisibleCheckboxes() {
    return Array.from(document.querySelectorAll(`.${CLASS_NAMES.PACKAGE_CHECKBOX}`))
        .filter(cb => {
            const label = cb.closest('label');
            return label
                && !label.classList.contains(CLASS_NAMES.FOSS_HIDDEN)
                && !label.classList.contains(CLASS_NAMES.SEARCH_HIDDEN)
                && !label.classList.contains(CLASS_NAMES.DISTRO_HIDDEN);
        });
}

/**
 * Get the currently active OS
 * @returns {string|null} The active OS (linux, windows, macos, freebsd) or null
 */
export function getActiveOS() {
    const activeBtn = document.querySelector(`.${CLASS_NAMES.OS_BTN}.${CLASS_NAMES.ACTIVE}`) as HTMLElement | null;
    return activeBtn ? activeBtn.dataset.os : null;
}

/**
 * Get the currently active Linux distro
 * @returns {string|null} The active distro key or null
 */
export function getActiveDistro() {
    const activeBtn = document.querySelector(`.${CLASS_NAMES.DISTRO_BTN}.${CLASS_NAMES.ACTIVE}`) as HTMLElement | null;
    return activeBtn ? activeBtn.dataset.distro : null;
}

/**
 * Update active state on a group of buttons
 * @param {string} selectorClass - CSS class of buttons to manage
 * @param {HTMLElement} clickedElement - The button that was clicked
 * @param {boolean} updateAria - Whether to update aria-checked attribute
 */
export function updateActiveButton(selectorClass, clickedElement, updateAria = false) {
    const buttons = document.querySelectorAll(`.${selectorClass}`);
    
    buttons.forEach(btn => {
        btn.classList.remove(CLASS_NAMES.ACTIVE);
        if (updateAria) {
            btn.setAttribute(ATTR_NAMES.ARIA_CHECKED, 'false');
        }
    });
    
    clickedElement.classList.add(CLASS_NAMES.ACTIVE);
    if (updateAria) {
        clickedElement.setAttribute(ATTR_NAMES.ARIA_CHECKED, 'true');
    }
}

/**
 * Set multiple ARIA attributes on an element
 * @param {HTMLElement} element - Target element
 * @param {Object} attributes - Object with attribute names as keys and values
 */
export function setAriaAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(`aria-${key}`, value);
    });
}

/**
 * Get checkbox by package ID
 * @param {string} packageId - The package ID
 * @returns {HTMLInputElement|null} The checkbox element or null
 */
export function getPackageCheckbox(packageId) {
    return document.getElementById(packageId);
}

/**
 * Get all checkboxes for a specific category
 * @param {string} category - Category name
 * @returns {HTMLInputElement[]} Array of checkbox elements
 */
export function getPackageCheckboxesByCategory(category) {
    return Array.from(
        document.querySelectorAll(`.${CLASS_NAMES.PACKAGE_CHECKBOX}[${ATTR_NAMES.CATEGORY}="${category}"]`)
    );
}

/**
 * Get the category checkbox for a specific category
 * @param {string} category - Category name
 * @returns {HTMLInputElement|null} The category checkbox or null
 */
export function getCategoryCheckbox(category) {
    return document.querySelector(
        `.${CLASS_NAMES.CATEGORY_CHECKBOX}[${ATTR_NAMES.CATEGORY}="${category}"]`
    );
}

/**
 * Get element by ID from ELEMENT_IDS constants
 * @param {string} idKey - Key from ELEMENT_IDS
 * @returns {HTMLElement|null}
 */
export function getElement(idKey) {
    const elementId = ELEMENT_IDS[idKey];
    return elementId ? document.getElementById(elementId) : null;
}

/**
 * Query all elements of a certain class
 * @param {string} classNameKey - Key from CLASS_NAMES
 * @returns {NodeListOf<HTMLElement>}
 */
export function queryByClass(classNameKey) {
    const className = CLASS_NAMES[classNameKey];
    return className ? document.querySelectorAll(`.${className}`) : null;
}

/**
 * Check if an element has a specific CSS class
 * @param {HTMLElement} element - Target element
 * @param {string} classKey - Key from CLASS_NAMES
 * @returns {boolean}
 */
export function hasClass(element, classKey) {
    const className = CLASS_NAMES[classKey];
    return element && className ? element.classList.contains(className) : false;
}

/**
 * Add CSS class to element using CLASS_NAMES key
 * @param {HTMLElement} element - Target element
 * @param {string} classKey - Key from CLASS_NAMES
 */
export function addClass(element, classKey) {
    const className = CLASS_NAMES[classKey];
    if (element && className) {
        element.classList.add(className);
    }
}

/**
 * Remove CSS class from element using CLASS_NAMES key
 * @param {HTMLElement} element - Target element
 * @param {string} classKey - Key from CLASS_NAMES
 */
export function removeClass(element, classKey) {
    const className = CLASS_NAMES[classKey];
    if (element && className) {
        element.classList.remove(className);
    }
}

/**
 * Toggle CSS class on element
 * @param {HTMLElement} element - Target element
 * @param {string} classKey - Key from CLASS_NAMES
 * @returns {boolean} New state of the class
 */
export function toggleClass(element, classKey) {
    const className = CLASS_NAMES[classKey];
    return element && className ? element.classList.toggle(className) : false;
}

/**
 * Query a single element with optional warning
 * @param {string} selector - CSS selector
 * @param {boolean} warnIfNotFound - Log warning if not found
 * @returns {HTMLElement|null}
 */
export function querySelector(selector, warnIfNotFound = false) {
    const element = document.querySelector(selector);
    if (!element && warnIfNotFound) {
        console.warn(`Element not found: ${selector}`);
    }
    return element;
}

/**
 * Query all elements and return as array
 * @param {string} selector - CSS selector
 * @returns {HTMLElement[]} Array of elements
 */
export function querySelectorAll(selector) {
    return Array.from(document.querySelectorAll(selector));
}

/**
 * Set multiple attributes on an element at once
 * @param {HTMLElement} element - Target element
 * @param {Object} attributes - Object with attribute names and values
 */
export function batchSetAttributes(element, attributes) {
    if (!element) return;
    Object.entries(attributes).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            element.setAttribute(key, value);
        }
    });
}

/**
 * Create an element with attributes and classes
 * @param {string} tagName - HTML tag name
 * @param {Object} options - Options object
 * @param {string[]} options.classes - Array of CSS classes
 * @param {Object} options.attributes - Object with attributes
 * @param {string} options.textContent - Text content
 * @param {string} options.innerHTML - Inner HTML
 * @returns {HTMLElement} Created element
 */
interface CreateElementOptions {
    classes?: string[];
    attributes?: Record<string, string>;
    textContent?: string;
    innerHTML?: string;
}

export function createElement(tagName: string, options: CreateElementOptions = {}) {
    const element = document.createElement(tagName);
    
    if (options.classes) {
        element.classList.add(...options.classes);
    }
    
    if (options.attributes) {
        batchSetAttributes(element, options.attributes);
    }
    
    if (options.textContent) {
        element.textContent = options.textContent;
    }
    
    if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }
    
    return element;
}

/**
 * Remove all child nodes from an element
 * @param {HTMLElement} element - Target element
 */
export function clearElement(element) {
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

/**
 * Show element by removing display: none
 * @param {HTMLElement} element - Target element
 */
export function showElement(element) {
    if (element) {
        element.style.display = '';
    }
}

/**
 * Hide element with display: none
 * @param {HTMLElement} element - Target element
 */
export function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Target element
 * @param {boolean} show - Force show (true) or hide (false), or toggle if undefined
 */
export function toggleElement(element, show) {
    if (!element) return;
    
    if (show === undefined) {
        // Toggle based on current state
        element.style.display = element.style.display === 'none' ? '' : 'none';
    } else {
        element.style.display = show ? '' : 'none';
    }
}

/**
 * Add event listener to multiple elements
 * @param {string|HTMLElement[]} selector - CSS selector or array of elements
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 */
export function addEventListeners(selector, event, handler, options = {}) {
    const elements = typeof selector === 'string' 
        ? querySelectorAll(selector)
        : selector;
    
    elements.forEach(element => {
        element.addEventListener(event, handler, options);
    });
}

/**
 * Delegate event to parent element
 * @param {HTMLElement} parent - Parent element
 * @param {string} selector - Child selector to match
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function delegateEvent(parent, selector, event, handler) {
    if (!parent) return;
    
    parent.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target) {
            handler.call(target, e);
        }
    });
}

/**
 * Wait for DOM to be ready
 * @param {Function} callback - Callback function
 */
export function onDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

/**
 * Scroll element into view smoothly
 * @param {HTMLElement} element - Target element
 * @param {Object} options - Scroll options
 */
export function scrollIntoView(element, options = { behavior: 'smooth', block: 'center' }) {
    if (element) {
        element.scrollIntoView(options);
    }
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func: (...args: unknown[]) => unknown, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return function(this: unknown, ...args: unknown[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func: (...args: unknown[]) => unknown, limit: number) {
    let inThrottle: boolean;
    return function(this: unknown, ...args: unknown[]) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
