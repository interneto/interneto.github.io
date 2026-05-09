/**
 * Event Bus
 * Centralized event management and dispatching
 */

import { EVENT_NAMES } from './config';

/**
 * Dispatch a custom event
 * @param {string} eventName - The event name (from EVENT_NAMES)
 * @param {any} detail - Optional event detail data
 */
export function dispatchEvent(eventName, detail = null) {
    const event = detail ? new CustomEvent(eventName, { detail }) : new CustomEvent(eventName);
    document.dispatchEvent(event);
}

/**
 * Listen to a custom event
 * @param {string} eventName - The event name (from EVENT_NAMES)
 * @param {Function} callback - Callback function
 * @param {Object} options - Event listener options
 */
export function addEventListener(eventName, callback, options = {}) {
    document.addEventListener(eventName, callback, options);
}

/**
 * Stop listening to a custom event
 * @param {string} eventName - The event name (from EVENT_NAMES)
 * @param {Function} callback - The callback to remove
 */
export function removeEventListener(eventName, callback) {
    document.removeEventListener(eventName, callback);
}

/**
 * Listen to an event once
 * @param {string} eventName - The event name (from EVENT_NAMES)
 * @param {Function} callback - Callback function
 */
export function once(eventName, callback) {
    document.addEventListener(eventName, callback, { once: true });
}

/**
 * Wait for an event to be dispatched (returns Promise)
 * @param {string} eventName - The event name (from EVENT_NAMES)
 * @returns {Promise<CustomEvent>} Promise that resolves when event fires
 */
export function waitFor(eventName) {
    return new Promise(resolve => {
        once(eventName, resolve);
    });
}

/**
 * Get all available event names
 * @returns {Object} The EVENT_NAMES object
 */
export function getEventNames() {
    return Object.freeze({ ...EVENT_NAMES });
}
