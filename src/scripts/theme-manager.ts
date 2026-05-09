// Theme Manager - Shared dark/light theme management for all pages

import { THEME_CONFIG, EVENT_NAMES } from './config';

let currentTheme: string | null = null;
let isInitialized = false;

export function initTheme(): void {
    if (isInitialized) {
        updateToggleButton(getTheme());
        return;
    }
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    setupToggleButton();
    isInitialized = true;
}

export function getTheme(): string {
    return document.documentElement.getAttribute('data-theme') || THEME_CONFIG.LIGHT;
}

export function setTheme(theme: string): void {
    if (theme !== THEME_CONFIG.DARK && theme !== THEME_CONFIG.LIGHT) {
        console.error(`Invalid theme: ${theme}`);
        return;
    }
    localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
    applyTheme(theme);
    const event = new CustomEvent(EVENT_NAMES.THEME_CHANGED, { detail: { theme } });
    document.dispatchEvent(event);
}

export function onThemeChange(callback: (detail: { theme: string }) => void): () => void {
    const handler = (event: Event) => callback((event as CustomEvent).detail);
    document.addEventListener(EVENT_NAMES.THEME_CHANGED, handler);
    return () => document.removeEventListener(EVENT_NAMES.THEME_CHANGED, handler);
}

export function toggleTheme(): void {
    const current = getTheme();
    const newTheme = current === THEME_CONFIG.DARK ? THEME_CONFIG.LIGHT : THEME_CONFIG.DARK;
    setTheme(newTheme);
}

function getSavedTheme(): string {
    return localStorage.getItem(THEME_CONFIG.STORAGE_KEY) || THEME_CONFIG.LIGHT;
}

function applyTheme(theme: string): void {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    updateToggleButton(theme);
}

function updateToggleButton(theme: string): void {
    const toggleBtn = document.getElementById(THEME_CONFIG.BUTTON_ID);
    if (!toggleBtn) return;
    const isDark = theme === THEME_CONFIG.DARK;
    toggleBtn.textContent = isDark ? THEME_CONFIG.EMOJIS.DARK : THEME_CONFIG.EMOJIS.LIGHT;
    toggleBtn.setAttribute('aria-label', isDark ? THEME_CONFIG.ARIA_LABELS.DARK : THEME_CONFIG.ARIA_LABELS.LIGHT);
    toggleBtn.setAttribute('title', isDark ? THEME_CONFIG.TITLES.DARK : THEME_CONFIG.TITLES.LIGHT);
}

function setupToggleButton(): void {
    const toggleBtn = document.getElementById(THEME_CONFIG.BUTTON_ID);
    if (!toggleBtn) {
        console.warn('Theme toggle button not found');
        return;
    }
    toggleBtn.addEventListener('click', toggleTheme);
    toggleBtn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initTheme(); });
} else {
    initTheme();
}