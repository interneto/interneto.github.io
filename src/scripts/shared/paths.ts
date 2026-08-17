// Base URL and path resolution

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export function resolvePkgsFileFromPath(pathname: string): string {
    const path = pathname.toLowerCase();

    if (path.includes('browser-extensions') || path.includes('/browser/')) {
        return 'browser-extensions-pkgs.json';
    }
    if (path.includes('vscode-extensions') || /\/(vscode)\//.test(path)) {
        return 'vscode-extensions-pkgs.json';
    }    if (path.includes('/agents/') || path.includes('agents-compatibility') || path.includes('mcp')) {
        return 'agents-pkgs.json';
    }    if (path.includes('/lib/') || path.includes('lib-compatibility')) {
        return 'lib-pkgs.json';
    }
    if (path.includes('/mobile/') || path.includes('mobile-os-compatibility')) {
        return 'mobile-pkgs.json';
    }
    return 'desktop-pkgs.json';
}

function detectJsonUrl(): string {
    if (typeof window === 'undefined') return `${BASE}pkgs/desktop-pkgs.json`;
    return `${BASE}pkgs/${resolvePkgsFileFromPath(window.location.pathname)}`;
}

export const PATHS = {
    BASE,
    CONFIG_URL: `${BASE}pkgs/config.json`,
    TAXONOMY_URL: `${BASE}pkgs/taxonomy.json`,
    IMAGE_PATH: `${BASE}img/software/apps/`,
    FAV_PACKAGES_URL: `${BASE}pkgs/list/fav-packages.json`,
    JSON_URL: detectJsonUrl(),
};

export const CONFIG = {
    JSON_URL: PATHS.JSON_URL,
    IMAGE_PATH: PATHS.IMAGE_PATH,
    FAV_PACKAGES_URL: PATHS.FAV_PACKAGES_URL,
    EXPORT_FILENAME: 'toolbox-exported-packages.json',
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    FILE_EXTENSION: '.json',
};

export const OS_COMPAT_PATHS = {
    JSON_URL: PATHS.JSON_URL,
    IMAGE_PATH: PATHS.IMAGE_PATH,
};
