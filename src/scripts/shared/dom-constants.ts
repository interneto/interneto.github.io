// DOM identifiers (class names, attributes, element IDs, event names)

export const CLASS_NAMES = {
    OS_BTN: 'os-btn',
    DISTRO_BTN: 'distro-btn',
    ACTIVE: 'active',
    COLLAPSED: 'collapsed',
    COPIED: 'copied',
    PACKAGE_CHECKBOX: 'package-checkbox',
    CATEGORY_CHECKBOX: 'category-checkbox',
    FOSS_HIDDEN: 'foss-hidden',
    SEARCH_HIDDEN: 'search-hidden',
    COLUMN: 'column',
    CATEGORY: 'category',
    CATEGORY_HEADER: 'category-header',
    CATEGORY_CONTENT: 'category-content',
    CATEGORY_EMOJI: 'category-emoji',
    CATEGORY_BADGE: 'category-badge',
    TOGGLE_ARROW: 'toggle-arrow',
    SUBCATEGORY: 'subcategory',
    HIDDEN: 'hidden',
    SHOW: 'show',
    PKG_ITEM: 'pkg-item',
    DISTRO_HIDDEN: 'distro-hidden',
};

export const ATTR_NAMES = {
    CATEGORY: 'data-category',
    DISTRO: 'data-distro',
    OS: 'data-os',
    PACKAGE_NAME: 'data-package-name',
    ROLE: 'role',
    TABINDEX: 'tabindex',
    ARIA_EXPANDED: 'aria-expanded',
    ARIA_CHECKED: 'aria-checked',
    ARIA_LABEL: 'aria-label',
};

export const ELEMENT_IDS = {
    OUTPUT: 'output',
    PACKAGE_CONTAINER: 'packageContainer',
    LOADING_SPINNER: 'loadingSpinner',
    COPY_COMMAND_BTN: 'copyCommandBtn',
    COPY_LIST_BTN: 'copyListBtn',
    PKG_COUNT: 'pkgCount',
    TOGGLE_ALL_BTN: 'toggleAllBtn',
    FOSS_TOGGLE_BTN: 'fossToggleBtn',
    SELECT_ALL_LABEL: 'selectAllLabel',
    TOGGLE_ALL_LABEL: 'toggleAllLabel',
    SELECT_ALL_CHECKBOX: 'selectAllCheckbox',
    OS_SELECTOR: 'osSelector',
    LINUX_DISTRO_SELECTOR: 'linuxDistroSelector',
    OPTIONS_SELECT: 'optionsSelect',
    SEARCH_INPUT: 'searchInput',
    INSTALLATION_COMMAND: 'installation-command',
    PACKAGES_NOT_FOUND: 'packages-not-found',
    FILE_INPUT: 'fileInput',
};

export const EVENT_NAMES = {
    PACKAGES_LOADED: 'packagesLoaded',
    SELECTION_CHANGED: 'selectionChanged',
    FILTER_CHANGED: 'filterChanged',
    OS_CHANGED: 'osChanged',
    THEME_CHANGED: 'themeChanged',
    OS_COMPAT_TABLE_LOADED: 'osCompatTableLoaded',
    OS_COMPAT_SORT_CHANGED: 'osCompatSortChanged',
    OS_COMPAT_FILTER_CHANGED: 'osCompatFilterChanged',
    OS_COMPAT_SEARCH_CHANGED: 'osCompatSearchChanged',
};

export const OS_COMPAT_CONSTANTS = {
    OS_LIST: ['windows', 'macos', 'linux', 'freebsd'] as const,
    WINDOW_STATUSES: {
        WINGET: 'winget',
        NON_WINGET: 'non-winget',
        NONE: 'none',
    },
    STATUS_ICONS: {
        AVAILABLE: '✅',
        WARNING: '⚠️',
        NOT_AVAILABLE: '❌',
    },
    ELEMENT_IDS: {
        TABLE_BODY: 'tableBody',
        SEARCH_INPUT: 'searchInput',
        CLEAR_SEARCH: 'clearSearch',
        RESET_FILTERS: 'resetFilters',
        EXPORT_BTN: 'exportBtn',
        STATS_CONTAINER: 'statsContainer',
        RESULT_COUNT: 'resultCount',
        COLUMN_TOGGLES: 'columnToggles',
    },
    SELECTORS: {
        TABLE_BODY: '#tableBody',
        FILTER_BTN: '.filter-chip',
        SORTABLE_TH: 'th.sortable',
    },
    ICONS: {
        AVAILABLE: '✅',
        NON_WINGET: '⚠️',
        NOT_AVAILABLE: '❌',
        WINGET: '✅',
    },
    DATA_ATTRS: {
        SORT: 'data-column',
        FILTER: 'data-os',
        OS: 'data-os',
    },
    DEFAULT_SORT: {
        COLUMN: 'name',
        DIRECTION: 'asc',
    },
    DEFAULT_FILTER: 'all',
};
