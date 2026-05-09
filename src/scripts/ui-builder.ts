/**
 * UI Builder
 * Handles DOM generation for packages, categories, and subcategories
 */

import { CONFIG, CLASS_NAMES, ATTR_NAMES, CATEGORY_EMOJIS } from './config';
import { getElement } from './dom-utils';

interface PackageManager {
  [distro: string]: string | null;
}

interface PackageInfo {
  name: string;
  category: string;
  subcategory: string;
  package_manager: PackageManager;
}

interface PackagesData {
  packages: Record<string, PackageInfo>;
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

    // Define categories by column
    const columnCategories = [
        ['Development'],
        ['Internet & Communication'],
        ['System'],
        ['File Management'],
        ['Audio'],
        ['Image'],
        ['Video'],
        ['Office'],
        ['Virtualization'],
        ['Utility'],
        ['Gaming'],
        ['Reading'],
        ['Science'],
    ];

    // Create columns
    columnCategories.forEach(categoryList => {
        const columnDiv = document.createElement('div');
        columnDiv.classList.add(CLASS_NAMES.COLUMN);
        packageContainer.appendChild(columnDiv);

        categoryList.forEach(category => {
            createCategorySection(columnDiv, category, packagesData);
        });
    });
}

/**
 * Create a category section with its subcategories and packages
 * @param {HTMLElement} columnDiv - The column container
 * @param {string} category - Category name
 * @param {Object} packagesData - The packages data
 */
function createCategorySection(columnDiv: HTMLElement, category: string, packagesData: PackagesData): void {
    const categoryDiv = document.createElement('div');
    const categoryClass = category.replace(/\s+/g, '-').toLowerCase();
    categoryDiv.classList.add(CLASS_NAMES.CATEGORY, categoryClass);
    columnDiv.appendChild(categoryDiv);

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
            const iconExtensions = ['svg', 'png', 'jpg', 'jpeg', 'webp'];
            let iconIndex = 0;
            const setIconSource = () => {
                if (iconIndex >= iconExtensions.length) {
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
