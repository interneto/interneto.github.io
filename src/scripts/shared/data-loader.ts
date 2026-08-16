// Runtime loaders for the merged JSON config in public/pkgs/config.json.
// Each entry script must `await initConfigData()` before using the sync getters.

import { PATHS } from './paths';
import { resolveFavCategoryFromPath, type FavCategory } from './favorites-store';

interface ConfigFile {
    nonFossLists: Record<FavCategory, string[]>;
    distroPrefixes: Record<string, string>;
    windowsNonWinget: WindowsNonWingetEntry[];
    libCompatTable: LibCompatTable;
    libIcons: LibIconsConfig;
}

export interface TaxonomyNode {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    aliases?: string[];
    children?: TaxonomyNode[];
}
export interface ExtensionAxisEntry { name: string; emoji?: string; }
interface TaxonomyFile {
    categories: TaxonomyNode[];
    extensionAxes?: Record<string, unknown>;
    libraryAxis?: LibCategoriesConfig;
}

export interface WindowsNonWingetEntry { id: string; name: string; }
export interface LibCategoriesConfig {
    base: string[];
    icons: Record<string, string>;
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

let nonFossLists: Record<FavCategory, string[]> = {
    desktop: [],
    mobile: [],
    browserExtensions: [],
    vscodeExtensions: [],
};
let categoryEmojis: Record<string, string> = {};
let taxonomyNodes: TaxonomyNode[] = [];
let aliasToName: Map<string, string> = new Map();
let distroPrefixes: Record<string, string> = {};
let windowsNonWinget: WindowsNonWingetEntry[] = [];
let libCategories: LibCategoriesConfig = { base: [], icons: {} };
let libCompatTable: LibCompatTable = { languages: [], table: {} };
let libIcons: LibIconsConfig = {
    cdn: { dashboardIcons: '', lucide: '' },
    languages: {},
    libraries: {},
};

let initPromise: Promise<void> | null = null;

async function fetchJson<T>(url: string, label: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${label}: ${res.statusText}`);
    return res.json() as Promise<T>;
}

// Flatten the taxonomy tree and build lookup maps: every node's name, id, and
// aliases resolve to that node's display name; every node name carries an emoji.
// Children (e.g. Multimedia sons) are leaf nodes — items resolve to the most
// specific node, so grouping rolls up by son, not parent.
function buildTaxonomyMaps(taxonomy: TaxonomyFile): void {
    aliasToName = new Map();
    categoryEmojis = {};
    const walk = (node: TaxonomyNode) => {
        if (node.emoji) categoryEmojis[node.name] = node.emoji;
        for (const key of [node.name, node.id, ...(node.aliases ?? [])]) {
            aliasToName.set(key, node.name);
        }
        node.children?.forEach(walk);
    };
    taxonomy.categories.forEach(walk);

    // Extension axes are separate (own native categories, bypass alias mapping) —
    // register only their emojis so the UI can badge them.
    for (const axis of Object.values(taxonomy.extensionAxes ?? {})) {
        if (!Array.isArray(axis)) continue;
        for (const entry of axis as ExtensionAxisEntry[]) {
            if (entry?.name && entry.emoji) categoryEmojis[entry.name] = entry.emoji;
        }
    }
}

export function initConfigData(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = Promise.all([
        fetchJson<ConfigFile>(PATHS.CONFIG_URL, 'config.json'),
        fetchJson<TaxonomyFile>(PATHS.TAXONOMY_URL, 'taxonomy.json'),
    ]).then(([config, taxonomy]) => {
        nonFossLists = config.nonFossLists;
        distroPrefixes = config.distroPrefixes;
        windowsNonWinget = config.windowsNonWinget;
        libCompatTable = config.libCompatTable;
        libIcons = config.libIcons;
        libCategories = taxonomy.libraryAxis ?? { base: [], icons: {} };
        taxonomyNodes = taxonomy.categories;
        buildTaxonomyMaps(taxonomy);
    });
    return initPromise;
}

/** Resolve a legacy category string (or id/name) to its taxonomy display name. */
export const resolveCategoryName = (legacy: string): string =>
    aliasToName.get(legacy) ?? legacy;

export const getTaxonomy = (): TaxonomyNode[] => taxonomyNodes;

export const getNonFossListFor = (category: FavCategory): string[] => nonFossLists[category] ?? [];
export const getNonFossListForCurrentPage = (): string[] =>
    typeof window === 'undefined' ? [] : getNonFossListFor(resolveFavCategoryFromPath(window.location.pathname));
export const getCategoryEmojis = (): Record<string, string> => categoryEmojis;
export const getDistroPrefixes = (): Record<string, string> => distroPrefixes;
export const getWindowsNonWinget = (): WindowsNonWingetEntry[] => windowsNonWinget;
export const getLibBaseCategories = (): string[] => libCategories.base;
export const getLibCategoryIcons = (): Record<string, string> => libCategories.icons;
export const getLibCompatTable = (): LibCompatTable => libCompatTable;
export const getLibIcons = (): LibIconsConfig => libIcons;
