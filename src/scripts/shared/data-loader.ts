// Runtime loaders for JSON config in public/pkgs/config/.
// Each entry script must `await initConfigData()` before using the sync getters.

import { PATHS } from './paths';

export interface WindowsNonWingetEntry { id: string; name: string; }
export interface LibCategoriesConfig {
    base: string[];
    icons: Record<string, string>;
}
export interface VscodeExtensionsMeta {
    nonFoss: string[];
    favorites: string[];
}

let fossList: string[] = [];
let categoryEmojis: Record<string, string> = {};
let distroPrefixes: Record<string, string> = {};
let windowsNonWinget: WindowsNonWingetEntry[] = [];
let libCategories: LibCategoriesConfig = { base: [], icons: {} };
let vscodeExtensionsMeta: VscodeExtensionsMeta = { nonFoss: [], favorites: [] };

let initPromise: Promise<void> | null = null;

async function fetchJson<T>(name: string): Promise<T> {
    const res = await fetch(`${PATHS.CONFIG_DIR}${name}.json`);
    if (!res.ok) {
        throw new Error(`Failed to load config/${name}.json: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
}

export function initConfigData(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = Promise.all([
        fetchJson<string[]>('foss-list'),
        fetchJson<Record<string, string>>('category-emojis'),
        fetchJson<Record<string, string>>('distro-prefixes'),
        fetchJson<WindowsNonWingetEntry[]>('windows-non-winget'),
        fetchJson<LibCategoriesConfig>('lib-categories'),
        fetchJson<VscodeExtensionsMeta>('vscode-extensions-meta'),
    ]).then(([foss, emojis, distros, nonWinget, libs, vscode]) => {
        fossList = foss;
        categoryEmojis = emojis;
        distroPrefixes = distros;
        windowsNonWinget = nonWinget;
        libCategories = libs;
        vscodeExtensionsMeta = vscode;
    });
    return initPromise;
}

export const getFossList = (): string[] => fossList;
export const getCategoryEmojis = (): Record<string, string> => categoryEmojis;
export const getDistroPrefixes = (): Record<string, string> => distroPrefixes;
export const getWindowsNonWinget = (): WindowsNonWingetEntry[] => windowsNonWinget;
export const getLibBaseCategories = (): string[] => libCategories.base;
export const getLibCategoryIcons = (): Record<string, string> => libCategories.icons;
export const getVscodeNonFossExtensions = (): string[] => vscodeExtensionsMeta.nonFoss;
export const getVscodeFavoriteExtensions = (): string[] => vscodeExtensionsMeta.favorites;
