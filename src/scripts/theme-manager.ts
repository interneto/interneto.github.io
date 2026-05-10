// Theme Manager - Shared dark/light theme management for all pages

import { THEME_CONFIG, EVENT_NAMES } from './config';

let currentTheme: string | null = null;
let isInitialized = false;
let mediaQueryList: MediaQueryList | null = null;

export function initTheme(): void {
    if (isInitialized) {
        updateToggleButton(getTheme());
        return;
    }
    applyPreferredTheme(getSavedTheme());
    setupToggleButton();
    setupSystemThemeListener();
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
    localStorage.removeItem(THEME_CONFIG.LEGACY_STORAGE_KEY);
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
    const savedTheme = localStorage.getItem(THEME_CONFIG.STORAGE_KEY);
    if (savedTheme === THEME_CONFIG.DARK || savedTheme === THEME_CONFIG.LIGHT) {
        return savedTheme;
    }

    const legacyTheme = localStorage.getItem(THEME_CONFIG.LEGACY_STORAGE_KEY);
    if (legacyTheme === THEME_CONFIG.DARK || legacyTheme === THEME_CONFIG.LIGHT) {
        localStorage.setItem(THEME_CONFIG.STORAGE_KEY, legacyTheme);
        localStorage.removeItem(THEME_CONFIG.LEGACY_STORAGE_KEY);
        return legacyTheme;
    }

    return '';
}

function getSystemTheme(): string {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEME_CONFIG.DARK
        : THEME_CONFIG.LIGHT;
}

function applyPreferredTheme(theme: string): void {
    applyTheme(theme || getSystemTheme());
}

function applyTheme(theme: string): void {
    currentTheme = theme;
    const root = document.documentElement;
    const isDark = theme === THEME_CONFIG.DARK;
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? THEME_CONFIG.DARK : THEME_CONFIG.LIGHT;
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

function setupSystemThemeListener(): void {
    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    const syncWithSystemTheme = () => {
        if (getSavedTheme()) {
            return;
        }
        const theme = getSystemTheme();
        applyTheme(theme);
        const event = new CustomEvent(EVENT_NAMES.THEME_CHANGED, { detail: { theme } });
        document.dispatchEvent(event);
    };

    if ('addEventListener' in mediaQueryList) {
        mediaQueryList.addEventListener('change', syncWithSystemTheme);
        return;
    }

    mediaQueryList.addListener(syncWithSystemTheme);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initTheme(); });
} else {
    initTheme();
}