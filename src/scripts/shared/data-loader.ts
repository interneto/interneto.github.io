// Runtime loaders for the merged JSON config in public/pkgs/config.json.
// Each entry script must `await initConfigData()` before using the sync getters.

import { PATHS } from './paths';

interface ConfigFile {
    nonFossList: string[];
    categoryEmojis: Record<string, string>;
    distroPrefixes: Record<string, string>;
    windowsNonWinget: WindowsNonWingetEntry[];
    libCategories: LibCategoriesConfig;
    vscodeExtensionsMeta: VscodeExtensionsMeta;
    libCompatTable: LibCompatTable;
    libIcons: LibIconsConfig;
}

export interface WindowsNonWingetEntry { id: string; name: string; }
export interface LibCategoriesConfig {
    base: string[];
    icons: Record<string, string>;
}
export interface VscodeExtensionsMeta {
    nonFoss: string[];
    favorites: string[];
}

export type LibCompatType = 'included' | 'external';
export interface LibCompatEntry { name: string; type: LibCompatType; }
export interface LibCompatTable {
    languages: string[];
    table: Record<string, Record<string, LibCompatEntry[]>>;
}

export interface LibIconsConfig {
    cdn: { dashboardIcons: string; lucide: string };
    languages: Record<string, { slug?: string; url?: string }>;
    libraries: Record<string, string>;
}

let nonFossList: string[] = [];
let categoryEmojis: Record<string, string> = {};
let distroPrefixes: Record<string, string> = {};
let windowsNonWinget: WindowsNonWingetEntry[] = [];
let libCategories: LibCategoriesConfig = { base: [], icons: {} };
let vscodeExtensionsMeta: VscodeExtensionsMeta = { nonFoss: [], favorites: [] };
let libCompatTable: LibCompatTable = { languages: [], table: {} };
let libIcons: LibIconsConfig = {
    cdn: { dashboardIcons: '', lucide: '' },
    languages: {},
    libraries: {},
};

let initPromise: Promise<void> | null = null;

export function initConfigData(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = fetch(PATHS.CONFIG_URL)
        .then((res) => {
            if (!res.ok) {
                throw new Error(`Failed to load config.json: ${res.statusText}`);
            }
            return res.json() as Promise<ConfigFile>;
        })
        .then((config) => {
            nonFossList = config.nonFossList;
            categoryEmojis = config.categoryEmojis;
            distroPrefixes = config.distroPrefixes;
            windowsNonWinget = config.windowsNonWinget;
            libCategories = config.libCategories;
            vscodeExtensionsMeta = config.vscodeExtensionsMeta;
            libCompatTable = config.libCompatTable;
            libIcons = config.libIcons;
        });
    return initPromise;
}

export const getNonFossList = (): string[] => nonFossList;
export const getCategoryEmojis = (): Record<string, string> => categoryEmojis;
export const getDistroPrefixes = (): Record<string, string> => distroPrefixes;
export const getWindowsNonWinget = (): WindowsNonWingetEntry[] => windowsNonWinget;
export const getLibBaseCategories = (): string[] => libCategories.base;
export const getLibCategoryIcons = (): Record<string, string> => libCategories.icons;
export const getVscodeNonFossExtensions = (): string[] => vscodeExtensionsMeta.nonFoss;
export const getVscodeFavoriteExtensions = (): string[] => vscodeExtensionsMeta.favorites;
export const getLibCompatTable = (): LibCompatTable => libCompatTable;
export const getLibIcons = (): LibIconsConfig => libIcons;
