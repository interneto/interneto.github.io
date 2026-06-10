/**
 * Event Bus
 * Centralized event management and dispatching
 */

import { EVENT_NAMES } from './dom-constants';

/**
 * Dispatch a custom event
 * @param eventName - The event name (from EVENT_NAMES)
 * @param detail - Optional event detail data
 */
export function dispatchEvent(eventName: string, detail: unknown = null) {
    const event = detail ? new CustomEvent(eventName, { detail }) : new CustomEvent(eventName);
    document.dispatchEvent(event);
}

/**
 * Listen to a custom event
 * @param eventName - The event name (from EVENT_NAMES)
 * @param callback - Callback function
 * @param options - Event listener options
 */
export function addEventListener(
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options: AddEventListenerOptions | boolean = {}
) {
    document.addEventListener(eventName, callback, options);
}

/**
 * Stop listening to a custom event
 * @param eventName - The event name (from EVENT_NAMES)
 * @param callback - The callback to remove
 */
export function removeEventListener(eventName: string, callback: EventListenerOrEventListenerObject) {
    document.removeEventListener(eventName, callback);
}

/**
 * Listen to an event once
 * @param eventName - The event name (from EVENT_NAMES)
 * @param callback - Callback function
 */
export function once(eventName: string, callback: EventListenerOrEventListenerObject) {
    document.addEventListener(eventName, callback, { once: true });
}

/**
 * Wait for an event to be dispatched (returns Promise)
 * @param eventName - The event name (from EVENT_NAMES)
 * @returns Promise that resolves when event fires
 */
export function waitFor(eventName: string): Promise<Event> {
    return new Promise(resolve => {
        once(eventName, resolve);
    });
}

/**
 * Get all available event names
 * @returns The EVENT_NAMES object
 */
export function getEventNames() {
    return Object.freeze({ ...EVENT_NAMES });
}
