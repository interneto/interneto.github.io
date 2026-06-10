/**
 * Shared types for the OS compatibility table subsystem.
 */

export interface OsCompatPackage {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    windows: boolean;
    windowsStatus: string;
    macos: boolean;
    linux: boolean;
    freebsd: boolean;
    // Dynamic access by column/OS key (e.g. pkg[os], pkg[sortColumn]).
    [key: string]: unknown;
}

export interface Statistics {
    total: number;
    windows: { total: number; winget: number; nonWinget: number };
    macos: number;
    linux: number;
    freebsd: number;
}

export interface SortState {
    column: string;
    direction: string;
}
