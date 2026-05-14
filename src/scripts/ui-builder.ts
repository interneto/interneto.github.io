/**
 * UI Builder
 * Handles DOM generation for packages, categories, and subcategories
 */

import { CONFIG, CLASS_NAMES, ATTR_NAMES, CATEGORY_EMOJIS } from './config';
import { getElement } from './dom-utils';
import type { PackageInfo, PackagesData } from './command-builder';

const DEFAULT_ICON_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'webp'];

let categoryLayoutState: {
    container: HTMLElement;
    sections: HTMLElement[];
    columnCount: number;
} | null = null;

let hasResponsiveLayoutListener = false;

// Some app icons in the repo are only available as png/jpg, so prefer those first.
const ICON_EXTENSION_OVERRIDES: Record<string, string[]> = {
        'gpx-viewer': ['png', 'svg', 'jpg', 'jpeg', 'webp'],
        'hyper-calc-pro': ['png', 'svg', 'jpg', 'jpeg', 'webp'],
        'piano-companion': ['png', 'svg', 'jpg', 'jpeg', 'webp'],
};

function getIconExtensionCandidates(pkgKey: string): string[] {
        const override = ICON_EXTENSION_OVERRIDES[pkgKey] ?? [];
        const merged = [...override, ...DEFAULT_ICON_EXTENSIONS];
        return merged.filter((ext, index) => merged.indexOf(ext) === index);
}

/**
 * Generate and insert the complete packages UI structure
 */
export function generatePackages(packagesData: PackagesData): void {
    const packageContainer = getElement('PACKAGE_CONTAINER');
    
    if (!packageContainer) {
        console.error('Package container not found');
        return;
    }
    
    packageContainer.innerHTML = ''; // Clear container

    const categories = [
        'Development',
        'Internet & Communication',
        'System',
        'File Management',
        'Audio',
        'Image',
        'Video',
        'Office',
        'Virtualization',
        'Utility',
        'Gaming',
        'Reading',
        'Science',
    ];

    const categorySections = categories.map(category => createCategorySection(category, packagesData));
    renderCategoryColumns(packageContainer, categorySections);

    if (!hasResponsiveLayoutListener) {
        window.addEventListener('resize', handleResponsiveCategoryLayout);
        hasResponsiveLayoutListener = true;
    }
}

/**
 * Create a category section with its subcategories and packages
 * @param {HTMLElement} columnDiv - The column container
 * @param {string} category - Category name
 * @param {Object} packagesData - The packages data
 */
function createCategorySection(category: string, packagesData: PackagesData): HTMLElement {
    const categoryDiv = document.createElement('div');
    const categoryClass = category.replace(/\s+/g, '-').toLowerCase();
    categoryDiv.classList.add(CLASS_NAMES.CATEGORY, categoryClass);

    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.classList.add(CLASS_NAMES.CATEGORY_HEADER);
    categoryHeader.setAttribute(ATTR_NAMES.ROLE, 'button');
    categoryHeader.setAttribute(ATTR_NAMES.TABINDEX, '0');
    categoryHeader.setAttribute(ATTR_NAMES.ARIA_EXPANDED, 'true');
    categoryHeader.setAttribute(ATTR_NAMES.ARIA_LABEL, `${category} category, click to collapse or expand`);
    categoryDiv.appendChild(categoryHeader);

    // Category checkbox
    const categoryCheckbox = document.createElement('input');
    categoryCheckbox.type = 'checkbox';
    categoryCheckbox.classList.add(CLASS_NAMES.CATEGORY_CHECKBOX);
    categoryCheckbox.dataset.category = category;
    categoryHeader.appendChild(categoryCheckbox);

    // Emoji
    const categoryEmoji = document.createElement('span');
    categoryEmoji.classList.add(CLASS_NAMES.CATEGORY_EMOJI);
    categoryEmoji.textContent = CATEGORY_EMOJIS[category] || '📦';
    categoryHeader.appendChild(categoryEmoji);

    // Heading
    const categoryHeading = document.createElement('h4');
    categoryHeading.textContent = category;
    categoryHeader.appendChild(categoryHeading);

    // Toggle arrow
    const toggleArrow = document.createElement('span');
    toggleArrow.classList.add(CLASS_NAMES.TOGGLE_ARROW);
    toggleArrow.textContent = '▼';
    categoryHeader.appendChild(toggleArrow);

    // Content container
    const categoryContent = document.createElement('div');
    categoryContent.classList.add(CLASS_NAMES.CATEGORY_CONTENT);
    categoryDiv.appendChild(categoryContent);

    // Collect packages by subcategory
    const subcategories: Record<string, { key: string; info: PackageInfo }[]> = {};
    Object.entries(packagesData.packages).forEach(([pkgKey, pkgInfo]) => {
        if (pkgInfo.category === category) {
            const subcategory = pkgInfo.subcategory;
            if (!subcategories[subcategory]) {
                subcategories[subcategory] = [];
            }
            subcategories[subcategory].push({ key: pkgKey, info: pkgInfo });
        }
    });

    // Create subcategories in alphabetical order
    Object.keys(subcategories)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach(subcategory => {
            createSubcategorySection(categoryContent, subcategory, subcategories);
        });

    // Add click handler for category toggle (just toggle class, don't interfere with checkbox)
    categoryHeader.addEventListener('click', function(e) {
        const target = e.target as HTMLElement;
        if (!target.classList.contains(CLASS_NAMES.CATEGORY_CHECKBOX)) {
            categoryDiv.classList.toggle(CLASS_NAMES.COLLAPSED);
            const isExpanded = !categoryDiv.classList.contains(CLASS_NAMES.COLLAPSED);
            categoryHeader.setAttribute(ATTR_NAMES.ARIA_EXPANDED, String(isExpanded));
        }
    });
    
    // Keyboard support for category toggle
    categoryHeader.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const target = e.target as HTMLElement;
            if (!target.classList.contains(CLASS_NAMES.CATEGORY_CHECKBOX)) {
                categoryDiv.classList.toggle(CLASS_NAMES.COLLAPSED);
                const isExpanded = !categoryDiv.classList.contains(CLASS_NAMES.COLLAPSED);
                categoryHeader.setAttribute(ATTR_NAMES.ARIA_EXPANDED, String(isExpanded));
            }
        }
    });

    return categoryDiv;
}

function getResponsiveColumnCount(): number {
    const width = window.innerWidth;

    if (width >= 1536) return 5;
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
}

function renderCategoryColumns(packageContainer: HTMLElement, categorySections: HTMLElement[]): void {
    const columnCount = getResponsiveColumnCount();
    packageContainer.innerHTML = '';

    const columns = Array.from({ length: columnCount }, () => {
        const columnDiv = document.createElement('div');
        columnDiv.classList.add(CLASS_NAMES.COLUMN);
        packageContainer.appendChild(columnDiv);
        return columnDiv;
    });

    categorySections.forEach((section, index) => {
        columns[index % columnCount].appendChild(section);
    });

    categoryLayoutState = {
        container: packageContainer,
        sections: categorySections,
        columnCount,
    };
}

function handleResponsiveCategoryLayout(): void {
    if (!categoryLayoutState) return;

    const nextColumnCount = getResponsiveColumnCount();
    if (nextColumnCount === categoryLayoutState.columnCount) return;

    renderCategoryColumns(categoryLayoutState.container, categoryLayoutState.sections);
}

/**
 * Create a subcategory section with its packages
 */
function createSubcategorySection(
    categoryContent: HTMLElement,
    subcategory: string,
    subcategories: Record<string, { key: string; info: PackageInfo }[]>
): void {
    const subcategoryDiv = document.createElement('div');
    const subcategoryClass = subcategory.replace(/\s+/g, '-').toLowerCase();
    subcategoryDiv.classList.add(CLASS_NAMES.SUBCATEGORY, subcategoryClass);
    categoryContent.appendChild(subcategoryDiv);

    // Subcategory heading
    const subcategoryHeading = document.createElement('h5');
    subcategoryHeading.textContent = subcategory;
    subcategoryDiv.appendChild(subcategoryHeading);

    // Create package labels
    subcategories[subcategory]
        .sort((a, b) => a.key.localeCompare(b.key))
        .forEach(({ key: pkgKey, info: pkgInfo }) => {
            const packageLabel = document.createElement('label');
            
            const packageCheckbox = document.createElement('input');
            packageCheckbox.type = 'checkbox';
            packageCheckbox.name = 'pkg';
            packageCheckbox.value = pkgKey;
            packageCheckbox.id = pkgKey;
            packageCheckbox.dataset.packageName = pkgInfo.name;
            packageCheckbox.classList.add(CLASS_NAMES.PACKAGE_CHECKBOX);
            packageCheckbox.dataset.category = pkgInfo.category;
            
            const packageImg = document.createElement('img');
            packageImg.classList.add('pkg-icon');
            packageImg.loading = 'lazy';
            packageImg.decoding = 'async';

            const iconExtensions = getIconExtensionCandidates(pkgKey);
            let iconIndex = 0;
            const setIconSource = () => {
                if (iconIndex >= iconExtensions.length) {
                    packageImg.src = `${CONFIG.IMAGE_PATH}no.svg`;
                    packageImg.classList.add('pkg-icon-fallback');
                    return;
                }
                packageImg.src = `${CONFIG.IMAGE_PATH}${pkgKey}.${iconExtensions[iconIndex]}`;
            };

            packageImg.addEventListener('error', () => {
                iconIndex += 1;
                setIconSource();
            });

            setIconSource();
            packageImg.width = 30;
            packageImg.alt = pkgInfo.name;

            packageLabel.appendChild(packageCheckbox);
            packageLabel.appendChild(packageImg);
            packageLabel.appendChild(document.createTextNode(` ${pkgInfo.name}`));
            packageLabel.dataset.search = `${pkgInfo.name} ${pkgKey} ${subcategory} ${pkgInfo.category}`.toLowerCase();
            packageLabel.classList.add(CLASS_NAMES.PKG_ITEM);
            packageLabel.dataset.supportedDistros = Object.entries(pkgInfo.package_manager)
                .filter(([, v]) => v !== null)
                .map(([k]) => k)
                .join(' ');

            subcategoryDiv.appendChild(packageLabel);
        });
}

/**
 * Disable package labels that don't support the given distro.
 */
export function applyDistroVisibilityFilter(distro: string | null | undefined): void {
    const labels = document.querySelectorAll<HTMLElement>(`.${CLASS_NAMES.PKG_ITEM}`);
    labels.forEach(label => {
        const supported = label.dataset.supportedDistros ?? '';
        const available = !distro || supported.split(' ').includes(distro);
        const checkbox = label.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (checkbox) {
            checkbox.disabled = !available;
            if (!available) checkbox.checked = false;
        }
        label.classList.toggle(CLASS_NAMES.DISTRO_HIDDEN, !available);
    });
}
