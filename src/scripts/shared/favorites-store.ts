// Runtime loader for public/pkgs/list/fav-packages.json — one favorites list
// per catalog, resolved the same way resolvePkgsFileFromPath resolves catalogs.

import { PATHS } from './paths';

export type FavCategory = 'desktop' | 'mobile' | 'browserExtensions' | 'vscodeExtensions' | 'agents';

interface FavoritesFile {
    desktop: string[];
    mobile: string[];
    browserExtensions: string[];
    vscodeExtensions: string[];
}

export function resolveFavCategoryFromPath(pathname: string): FavCategory {
    const path = pathname.toLowerCase();

    if (path.includes('browser-extensions') || path.includes('/browser/')) {
        return 'browserExtensions';
    }
    if (path.includes('vscode-extensions') || /\/(vscode)\//.test(path)) {
        return 'vscodeExtensions';
    }    if (path.includes('/agents/') || path.includes('agents-compatibility')) {
        return 'agents';
    }    if (path.includes('/mobile/') || path.includes('mobile-os-compatibility')) {
        return 'mobile';
    }
    return 'desktop';
}

let favoritesByCategory: FavoritesFile = {
    desktop: [],
    mobile: [],
    browserExtensions: [],
    vscodeExtensions: [],
};

let initPromise: Promise<void> | null = null;

export function initFavoritesData(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = fetch(PATHS.FAV_PACKAGES_URL)
        .then((res) => {
            if (!res.ok) throw new Error(`Failed to load favorites: ${res.statusText}`);
            return res.json() as Promise<Partial<FavoritesFile>>;
        })
        .then((data) => {
            favoritesByCategory = {
                desktop: data.desktop ?? [],
                mobile: data.mobile ?? [],
                browserExtensions: data.browserExtensions ?? [],
                vscodeExtensions: data.vscodeExtensions ?? [],
            };
        })
        .catch((error) => {
            console.error('Error loading favorites data:', error);
        });
    return initPromise;
}

export const getFavoritesFor = (category: FavCategory): string[] => favoritesByCategory[category];

export function getFavoritesForCurrentPage(): string[] {
    if (typeof window === 'undefined') return [];
    return getFavoritesFor(resolveFavCategoryFromPath(window.location.pathname));
}
