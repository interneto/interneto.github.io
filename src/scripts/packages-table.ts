// Módulo para renderizar la tabla de paquetes (desktop y mobile)

const BASE = ((import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL).replace(/\/?$/, '/');

// ============================================================================
// TYPES
// ============================================================================

interface PackageManager {
    android_pkg?: string;
    ios_pkg?: string;
    [key: string]: string | undefined;
}

interface PackageInfo {
    name?: string;
    package_manager?: PackageManager;
}

interface PackagesData {
    packages?: Record<string, PackageInfo>;
}

interface MobileTableItem {
    name: string;
    androidPackageName: string;
    iosPackageName: string;
}

interface VscodeExtension {
    id: string;
    name: string;
    category: string;
    isFoss: boolean;
}

interface BrowserExtension {
    id: string;
    name: string;
    category: string;
    firefox_slug?: string;
    chromium_id?: string;
}

interface RawVscodeExtension {
    name: string;
    category: string;
    [key: string]: unknown;
}

interface RawBrowserExtension {
    name: string;
    category: string;
    firefox_slug?: string;
    chromium_id?: string;
    [key: string]: unknown;
}

interface ExtensionData {
    extensions?: Record<string, RawVscodeExtension>;
}

interface BrowserExtensionData {
    extensions?: Record<string, RawBrowserExtension>;
}

// ============================================================================
// URL HELPERS
// ============================================================================

export function getPackagesJsonUrl(): string {
    const path = window.location.pathname;
    if (path.includes('mobile')) {
        return `${BASE}pkgs/mobile-pkgs.json`;
    } else if (path.includes('desktop')) {
        return `${BASE}pkgs/desktop-pkgs.json`;
    }
    return `${BASE}pkgs/desktop-pkgs.json`;
}

export function getVscodeExtensionsJsonUrl(): string {
    return `${BASE}pkgs/vscode-extensions-pkgs.json`;
}

export function getBrowserExtensionsJsonUrl(): string {
    return `${BASE}pkgs/browser-extensions-pkgs.json`;
}

// ============================================================================
// MOBILE PACKAGES TABLE
// ============================================================================

function buildPlayStoreUrl(androidPackageName: string): string {
    return `https://play.google.com/store/apps/details?id=${encodeURIComponent(androidPackageName)}`;
}

function buildAppleStoreUrl(iosPackageName: string): string {
    return `https://apps.apple.com/app/${iosPackageName}`;
}

function createLinkCell(url: string, label: string, iconText: string): HTMLTableCellElement {
    const cell = document.createElement('td');
    if (!url || url.trim() === '') {
        cell.textContent = '-';
        return cell;
    }
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.classList.add('store-link');
    const icon = document.createElement('span');
    icon.classList.add('store-icon');
    icon.textContent = iconText;
    const text = document.createElement('span');
    text.textContent = label;
    link.appendChild(icon);
    link.appendChild(text);
    cell.appendChild(link);
    return cell;
}

export function renderPackagesTable(data: PackagesData): void {
    const tbody = document.querySelector('#packagesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const packageEntries = Object.entries(data?.packages ?? {});
    packageEntries
        .sort(([, a], [, b]) => (a.name ?? '').localeCompare(b.name ?? ''))
        .forEach(([, pkgInfo]) => {
            const packageName = pkgInfo?.name ?? '-';
            const androidPackageName = pkgInfo?.package_manager?.android_pkg?.trim() ?? '';
            const iosPackageName = pkgInfo?.package_manager?.ios_pkg?.trim() ?? '';
            const row = document.createElement('tr');
            const packageNameCell = document.createElement('td');
            packageNameCell.textContent = packageName;
            const androidPackageCell = document.createElement('td');
            androidPackageCell.textContent = androidPackageName || '-';
            const iosPackageCell = document.createElement('td');
            iosPackageCell.textContent = iosPackageName || '-';
            const androidUrl = androidPackageName ? buildPlayStoreUrl(androidPackageName) : '';
            const iosUrl = iosPackageName ? buildAppleStoreUrl(iosPackageName) : '';
            row.appendChild(packageNameCell);
            row.appendChild(androidPackageCell);
            row.appendChild(iosPackageCell);
            row.appendChild(createLinkCell(androidUrl, 'Play Store', '▶'));
            row.appendChild(createLinkCell(iosUrl, 'App Store', '◉'));
            tbody.appendChild(row);
        });
}

function getMobileTableItems(data: PackagesData): MobileTableItem[] {
    const packageEntries = Object.entries(data?.packages ?? {});
    return packageEntries.map(([, pkgInfo]) => ({
        name: pkgInfo?.name ?? '-',
        androidPackageName: pkgInfo?.package_manager?.android_pkg?.trim() ?? '',
        iosPackageName: pkgInfo?.package_manager?.ios_pkg?.trim() ?? '',
    }));
}

function renderMobilePackagesRows(items: MobileTableItem[]): void {
    const tbody = document.querySelector('#packagesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    items
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((item) => {
            const row = document.createElement('tr');
            const packageNameCell = document.createElement('td');
            packageNameCell.textContent = item.name;

            const androidPackageCell = document.createElement('td');
            androidPackageCell.textContent = item.androidPackageName || '-';

            const iosPackageCell = document.createElement('td');
            iosPackageCell.textContent = item.iosPackageName || '-';

            const androidUrl = item.androidPackageName ? buildPlayStoreUrl(item.androidPackageName) : '';
            const iosUrl = item.iosPackageName ? buildAppleStoreUrl(item.iosPackageName) : '';

            row.appendChild(packageNameCell);
            row.appendChild(androidPackageCell);
            row.appendChild(iosPackageCell);
            row.appendChild(createLinkCell(androidUrl, 'Play Store', '▶'));
            row.appendChild(createLinkCell(iosUrl, 'App Store', '◉'));
            tbody.appendChild(row);
        });
}

export async function loadPackagesTable(): Promise<void> {
    const tbody = document.querySelector('#packagesTable tbody');
    const input = document.getElementById('searchInput') as HTMLInputElement | null;
    try {
        const response = await fetch(getPackagesJsonUrl());
        if (!response.ok) {
            throw new Error(`Failed to load packages data: ${response.statusText}`);
        }
        const data = await response.json() as PackagesData;

        if (window.location.pathname.includes('mobile-os-compatibility')) {
            const items = getMobileTableItems(data);
            renderMobilePackagesRows(items);

            if (input) {
                input.addEventListener('input', () => {
                    const query = input.value.trim().toLowerCase();
                    const filtered = items.filter((item) => (
                        item.name.toLowerCase().includes(query)
                        || item.androidPackageName.toLowerCase().includes(query)
                        || item.iosPackageName.toLowerCase().includes(query)
                    ));
                    renderMobilePackagesRows(filtered);
                });
            }
        } else {
            renderPackagesTable(data);
        }
    } catch (error) {
        console.error('Error loading table data:', error);
        if (tbody) tbody.innerHTML = '<tr><td colspan="5">Could not load package table.</td></tr>';
    }
}

// ============================================================================
// SHARED HELPERS
// ============================================================================

function getExtensionIconPath(extensionId: string): string {
    const fileName = extensionId.replace(/\./g, '-');
    return `./img/vscode-extensions/${fileName}.svg`;
}

function getBrowserExtensionIconPath(id: string): string {
    return `./img/browser-extensions/${id}.png`;
}

function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
    return items.reduce<Record<string, T[]>>((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});
}

// ============================================================================
// VS CODE EXTENSIONS GENERATOR
// ============================================================================

function getVscodeExtensionsFromData(data: ExtensionData): Omit<VscodeExtension, 'isFoss'>[] {
    if (!data?.extensions || typeof data.extensions !== 'object' || Array.isArray(data.extensions)) {
        return [];
    }
    return Object.entries(data.extensions).map(([id, ext]) => ({ id, ...ext }));
}

const NON_FOSS_VSCODE_EXTENSIONS = new Set([
    'bmewburn.vscode-intelephense-client',
    'github.copilot-chat',
    'ms-python.vscode-pylance',
]);

const FAVORITE_VSCODE_EXTENSIONS = [
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
    'github.copilot-chat',
];

function renderVscodeGenerator(items: Omit<VscodeExtension, 'isFoss'>[]): void {
    const container = document.getElementById('extensionsCategories');
    const commandFooter = document.getElementById('commandFooter');
    const commandTarget = document.getElementById('installation-command');
    const selectAll = document.getElementById('selectAllCheckbox') as HTMLInputElement | null;
    const selectAllLabel = document.getElementById('selectAllLabel');
    const toggleAllBtn = document.getElementById('toggleAllBtn');
    const toggleAllLabel = document.getElementById('toggleAllLabel');
    const fossToggleBtn = document.getElementById('fossToggleBtn');
    const optionsSelect = document.getElementById('optionsSelect') as HTMLSelectElement | null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const copyBtn = document.getElementById('copyCommandBtn');

    if (
        !container || !commandTarget || !selectAll || !selectAllLabel
        || !toggleAllBtn || !toggleAllLabel || !fossToggleBtn
        || !optionsSelect || !fileInput || !searchInput || !copyBtn
    ) {
        return;
    }

    const state = {
        selected: new Set<string>(),
        searchQuery: '',
        fossOnly: false,
        allCollapsed: false,
    };

    const normalizedItems: VscodeExtension[] = items.map((item) => ({
        ...item,
        isFoss: !NON_FOSS_VSCODE_EXTENSIONS.has(item.id),
    }));

    const grouped = groupByCategory(normalizedItems);
    const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    container.innerHTML = '';

    categories.forEach((category) => {
        const section = document.createElement('section');
        section.className = 'column category';
        section.dataset.category = category;

        const header = document.createElement('div');
        header.className = 'category-header';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'true');

        const title = document.createElement('h4');
        title.textContent = category;

        const arrow = document.createElement('span');
        arrow.className = 'toggle-arrow';
        arrow.textContent = '▼';

        header.appendChild(title);
        header.appendChild(arrow);
        section.appendChild(header);

        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';

        grouped[category]
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((ext) => {
                const label = document.createElement('label');
                label.className = 'ext-item';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.value = ext.id;
                input.dataset.extensionId = ext.id;

                const icon = document.createElement('img');
                icon.className = 'ext-icon';
                icon.width = 18;
                icon.height = 18;
                icon.alt = `${ext.name} icon`;
                icon.src = getExtensionIconPath(ext.id);
                icon.addEventListener('error', () => {
                    if (icon.src.endsWith('.svg')) {
                        icon.src = icon.src.replace('.svg', '.png');
                    } else {
                        icon.style.visibility = 'hidden';
                    }
                });

                const text = document.createElement('span');
                text.textContent = ext.name;

                label.dataset.search = `${ext.name} ${ext.id}`.toLowerCase();
                label.dataset.isFoss = ext.isFoss ? 'true' : 'false';

                input.addEventListener('change', () => {
                    if (input.checked) {
                        state.selected.add(ext.id);
                    } else {
                        state.selected.delete(ext.id);
                    }
                    updateCommand();
                    updateSelectAllState();
                });

                label.appendChild(input);
                label.appendChild(icon);
                label.appendChild(text);
                categoryContent.appendChild(label);
            });

        const toggleCategory = () => {
            const collapsed = section.classList.toggle('collapsed');
            header.setAttribute('aria-expanded', String(!collapsed));
            updateGlobalCollapseState();
        };

        header.addEventListener('click', toggleCategory);
        header.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleCategory();
            }
        });

        section.appendChild(categoryContent);
        container.appendChild(section);
    });

    function getAllExtensionCheckboxes(): HTMLInputElement[] {
        return Array.from(container!.querySelectorAll<HTMLInputElement>('.ext-item input[type="checkbox"]'));
    }

    function getVisibleExtensionCheckboxes(): HTMLInputElement[] {
        return getAllExtensionCheckboxes().filter((checkbox) => {
            const lbl = checkbox.closest<HTMLElement>('.ext-item');
            return lbl && lbl.style.display !== 'none' && !lbl.classList.contains('foss-hidden');
        });
    }

    function getSortedSelectedExtensions(): string[] {
        return Array.from(state.selected).sort((a, b) => a.localeCompare(b));
    }

    function updateCommand(): void {
        const selected = getSortedSelectedExtensions();
        if (selected.length === 0) {
            commandTarget!.textContent = 'Select extensions to generate command...';
            if (commandFooter) commandFooter.hidden = true;
            return;
        }
        commandTarget!.textContent = `code --install-extension ${selected.join(' ')}`;
        if (commandFooter) commandFooter.hidden = false;
    }

    function applyFilters(): void {
        container!.querySelectorAll<HTMLElement>('.ext-item').forEach((lbl) => {
            const matchesSearch = (lbl.dataset.search ?? '').includes(state.searchQuery);
            const isFoss = lbl.dataset.isFoss === 'true';
            const passesFoss = !state.fossOnly || isFoss;
            lbl.classList.toggle('foss-hidden', !passesFoss);
            lbl.style.display = matchesSearch && passesFoss ? '' : 'none';
        });
    }

    function updateSelectAllState(): void {
        const visibleBoxes = getVisibleExtensionCheckboxes();
        const checkedCount = visibleBoxes.filter((el) => el.checked).length;
        const totalCount = visibleBoxes.length;

        if (totalCount === 0 || checkedCount === 0) {
            selectAll!.checked = false;
            selectAll!.indeterminate = false;
            selectAllLabel!.textContent = 'Select';
            return;
        }
        if (checkedCount === totalCount) {
            selectAll!.checked = true;
            selectAll!.indeterminate = false;
            selectAllLabel!.textContent = 'Deselect';
            return;
        }
        selectAll!.checked = false;
        selectAll!.indeterminate = true;
        selectAllLabel!.textContent = 'Selected';
    }

    function updateGlobalCollapseState(): void {
        const sections = Array.from(container!.querySelectorAll('.category'));
        const collapsedCount = sections.filter((s) => s.classList.contains('collapsed')).length;
        state.allCollapsed = sections.length > 0 && collapsedCount === sections.length;
        toggleAllBtn!.classList.toggle('collapsed', state.allCollapsed);
        toggleAllLabel!.textContent = state.allCollapsed ? 'Expand' : 'Collapse';
    }

    function setAllCategoriesCollapsed(shouldCollapse: boolean): void {
        container!.querySelectorAll('.category').forEach((s) => {
            s.classList.toggle('collapsed', shouldCollapse);
            const hdr = s.querySelector('.category-header');
            if (hdr) hdr.setAttribute('aria-expanded', String(!shouldCollapse));
        });
        updateGlobalCollapseState();
    }

    function setSelectionByIds(ids: string[]): void {
        const targetIds = new Set(ids);
        state.selected.clear();
        getAllExtensionCheckboxes().forEach((checkbox) => {
            const shouldSelect = targetIds.has(checkbox.value);
            checkbox.checked = shouldSelect;
            if (shouldSelect) state.selected.add(checkbox.value);
        });
        updateCommand();
        updateSelectAllState();
    }

    selectAll.addEventListener('change', () => {
        const allBoxes = getVisibleExtensionCheckboxes();
        state.selected.clear();
        getAllExtensionCheckboxes().forEach((checkbox) => { checkbox.checked = false; });
        allBoxes.forEach((checkbox) => {
            checkbox.checked = selectAll!.checked;
            if (selectAll!.checked) state.selected.add(checkbox.value);
        });
        updateCommand();
        updateSelectAllState();
    });

    searchInput.addEventListener('input', () => {
        state.searchQuery = searchInput!.value.trim().toLowerCase();
        applyFilters();
        updateSelectAllState();
    });

    toggleAllBtn.addEventListener('click', () => {
        setAllCategoriesCollapsed(!state.allCollapsed);
    });

    fossToggleBtn.addEventListener('click', () => {
        state.fossOnly = !state.fossOnly;
        fossToggleBtn.classList.toggle('active', state.fossOnly);
        applyFilters();
        updateSelectAllState();
    });

    optionsSelect.addEventListener('change', () => {
        const action = optionsSelect!.value;
        if (!action) return;

        if (action === 'loadFavorites') {
            setSelectionByIds(FAVORITE_VSCODE_EXTENSIONS);
        }
        if (action === 'importPackages') {
            fileInput!.value = '';
            fileInput!.click();
        }
        if (action === 'exportPackages') {
            const payload = { extensions: getSortedSelectedExtensions() };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'toolbox-vscode-extensions.json';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        }
        optionsSelect!.value = '';
    });

    fileInput.addEventListener('change', async () => {
        const file = fileInput!.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as unknown;
            const imported: string[] = Array.isArray(parsed)
                ? (parsed as string[])
                : (Array.isArray((parsed as { extensions?: unknown }).extensions)
                    ? ((parsed as { extensions: string[] }).extensions)
                    : []);
            if (imported.length > 0) setSelectionByIds(imported);
        } catch (error) {
            console.error('Unable to import extensions JSON:', error);
        }
    });

    copyBtn.addEventListener('click', async () => {
        const command = commandTarget!.textContent;
        if (!command || command.startsWith('Select extensions')) return;
        try {
            await navigator.clipboard.writeText(command);
            const original = copyBtn.textContent;
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = original; }, 1200);
        } catch (error) {
            console.error('Unable to copy command:', error);
        }
    });

    applyFilters();
    setAllCategoriesCollapsed(false);
    updateCommand();
    updateSelectAllState();
}

function renderVscodeExtensionsTable(items: Omit<VscodeExtension, 'isFoss'>[]): void {
    const tbody = document.getElementById('extensionsTableBody');
    const countEl = document.getElementById('extensionsCount');
    if (!tbody || !countEl) return;

    tbody.innerHTML = '';
    items
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((ext) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ext.name}</td>
                <td><code>${ext.id}</code></td>
                <td>${ext.category}</td>
            `;
            tbody.appendChild(row);
        });
    countEl.textContent = String(items.length);
}

export async function loadVscodeExtensionsGenerator(): Promise<void> {
    try {
        const response = await fetch(getVscodeExtensionsJsonUrl());
        if (!response.ok) throw new Error(`Failed to load VS Code extensions data: ${response.statusText}`);
        const data = await response.json() as ExtensionData;
        const items = getVscodeExtensionsFromData(data);
        renderVscodeGenerator(items);
    } catch (error) {
        console.error('Error loading VS Code generator data:', error);
    }
}

export async function loadVscodeExtensionsTable(): Promise<void> {
    const input = document.getElementById('tableSearch') as HTMLInputElement | null;
    try {
        const response = await fetch(getVscodeExtensionsJsonUrl());
        if (!response.ok) throw new Error(`Failed to load VS Code extensions data: ${response.statusText}`);
        const data = await response.json() as ExtensionData;
        const items = getVscodeExtensionsFromData(data);
        renderVscodeExtensionsTable(items);
        if (input) {
            input.addEventListener('input', () => {
                const query = input.value.trim().toLowerCase();
                const filtered = items.filter((ext) => (
                    ext.name.toLowerCase().includes(query)
                    || ext.id.toLowerCase().includes(query)
                    || ext.category.toLowerCase().includes(query)
                ));
                renderVscodeExtensionsTable(filtered);
            });
        }
    } catch (error) {
        console.error('Error loading VS Code table data:', error);
    }
}

// ============================================================================
// BROWSER EXTENSIONS GENERATOR
// ============================================================================

function getBrowserExtensionsFromData(data: BrowserExtensionData): BrowserExtension[] {
    if (!data?.extensions || typeof data.extensions !== 'object' || Array.isArray(data.extensions)) {
        return [];
    }
    return Object.entries(data.extensions).map(([id, ext]) => ({ id, ...ext }));
}

function buildFirefoxAddonUrl(slug: string | undefined): string | null {
    if (!slug) return null;
    return `https://addons.mozilla.org/en-US/firefox/addon/${encodeURIComponent(slug)}/`;
}

function buildChromiumExtensionUrl(chromiumId: string | undefined): string | null {
    if (!chromiumId) return null;
    return `https://chromewebstore.google.com/detail/${encodeURIComponent(chromiumId)}`;
}

function renderBrowserExtensionsGenerator(items: BrowserExtension[]): void {
    const container = document.getElementById('browserExtensionsCategories');
    const commandFooter = document.getElementById('commandFooter');
    const commandTarget = document.getElementById('installation-command');
    const selectAll = document.getElementById('selectAllCheckbox') as HTMLInputElement | null;
    const selectAllLabel = document.getElementById('selectAllLabel');
    const toggleAllBtn = document.getElementById('toggleAllBtn');
    const toggleAllLabel = document.getElementById('toggleAllLabel');
    const browserSelect = document.getElementById('browserSelect') as HTMLSelectElement | null;
    const optionsSelect = document.getElementById('optionsSelect') as HTMLSelectElement | null;
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const copyBtn = document.getElementById('copyCommandBtn');

    if (
        !container || !commandTarget || !selectAll || !selectAllLabel
        || !toggleAllBtn || !toggleAllLabel || !browserSelect
        || !optionsSelect || !searchInput || !copyBtn
    ) {
        return;
    }

    const state = {
        selected: new Set<string>(),
        searchQuery: '',
        allCollapsed: false,
        browser: 'both',
    };

    const grouped = groupByCategory(items);
    const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    container.innerHTML = '';

    categories.forEach((category) => {
        const section = document.createElement('section');
        section.className = 'column category';
        section.dataset.category = category;

        const header = document.createElement('div');
        header.className = 'category-header';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'true');

        const title = document.createElement('h4');
        title.textContent = category;

        const arrow = document.createElement('span');
        arrow.className = 'toggle-arrow';
        arrow.textContent = '▼';

        header.appendChild(title);
        header.appendChild(arrow);
        section.appendChild(header);

        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';

        grouped[category]
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((ext) => {
                const label = document.createElement('label');
                label.className = 'ext-item';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.value = ext.id;
                input.dataset.extensionId = ext.id;

                const text = document.createElement('span');
                text.textContent = ext.name;

                const icon = document.createElement('img');
                icon.className = 'ext-icon';
                icon.width = 18;
                icon.height = 18;
                icon.alt = `${ext.name} icon`;
                icon.src = getBrowserExtensionIconPath(ext.id);
                icon.addEventListener('error', () => { icon.style.visibility = 'hidden'; });

                label.dataset.search = `${ext.name} ${ext.id}`.toLowerCase();
                label.dataset.firefoxSlug = ext.firefox_slug ?? '';
                label.dataset.chromiumId = ext.chromium_id ?? '';

                input.addEventListener('change', () => {
                    if (input.checked) {
                        state.selected.add(ext.id);
                    } else {
                        state.selected.delete(ext.id);
                    }
                    updateLinks();
                    updateSelectAllState();
                });

                label.appendChild(input);
                label.appendChild(icon);
                label.appendChild(text);
                categoryContent.appendChild(label);
            });

        const toggleCategory = () => {
            const collapsed = section.classList.toggle('collapsed');
            header.setAttribute('aria-expanded', String(!collapsed));
            updateGlobalCollapseState();
        };

        header.addEventListener('click', toggleCategory);
        header.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleCategory();
            }
        });

        section.appendChild(categoryContent);
        container.appendChild(section);
    });

    function getAllExtensionCheckboxes(): HTMLInputElement[] {
        return Array.from(container!.querySelectorAll<HTMLInputElement>('.ext-item input[type="checkbox"]'));
    }

    function getVisibleExtensionCheckboxes(): HTMLInputElement[] {
        return getAllExtensionCheckboxes().filter((checkbox) => {
            const lbl = checkbox.closest<HTMLElement>('.ext-item');
            return lbl && lbl.style.display !== 'none';
        });
    }

    function updateLinks(): void {
        const selectedIds = Array.from(state.selected).sort((a, b) => a.localeCompare(b));
        if (selectedIds.length === 0) {
            commandTarget!.textContent = 'Select extensions to generate install links...';
            if (commandFooter) commandFooter.hidden = true;
            return;
        }

        const selectedItems = items.filter((ext) => state.selected.has(ext.id));
        const lines: string[] = [];

        selectedItems
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((ext) => {
                const browser = state.browser;
                if (browser === 'firefox' || browser === 'both') {
                    const url = buildFirefoxAddonUrl(ext.firefox_slug);
                    if (url) lines.push(`[Firefox] ${ext.name}: ${url}`);
                }
                if (browser === 'chromium' || browser === 'both') {
                    const url = buildChromiumExtensionUrl(ext.chromium_id);
                    if (url) lines.push(`[Chromium] ${ext.name}: ${url}`);
                }
            });

        commandTarget!.textContent = lines.length > 0
            ? lines.join('\n')
            : 'No store links available for selected browser.';
        if (commandFooter) commandFooter.hidden = false;
    }

    function applyFilters(): void {
        container!.querySelectorAll<HTMLElement>('.ext-item').forEach((lbl) => {
            const matchesSearch = (lbl.dataset.search ?? '').includes(state.searchQuery);
            const browser = state.browser;
            let matchesBrowser = true;
            if (browser === 'firefox') {
                matchesBrowser = (lbl.dataset.firefoxSlug ?? '') !== '';
            } else if (browser === 'chromium') {
                matchesBrowser = (lbl.dataset.chromiumId ?? '') !== '';
            }
            lbl.style.display = matchesSearch && matchesBrowser ? '' : 'none';
        });
    }

    function updateSelectAllState(): void {
        const visibleBoxes = getVisibleExtensionCheckboxes();
        const checkedCount = visibleBoxes.filter((el) => el.checked).length;
        const totalCount = visibleBoxes.length;

        if (totalCount === 0 || checkedCount === 0) {
            selectAll!.checked = false;
            selectAll!.indeterminate = false;
            selectAllLabel!.textContent = 'Select';
            return;
        }
        if (checkedCount === totalCount) {
            selectAll!.checked = true;
            selectAll!.indeterminate = false;
            selectAllLabel!.textContent = 'Deselect';
            return;
        }
        selectAll!.checked = false;
        selectAll!.indeterminate = true;
        selectAllLabel!.textContent = 'Selected';
    }

    function updateGlobalCollapseState(): void {
        const sections = Array.from(container!.querySelectorAll('.category'));
        const collapsedCount = sections.filter((s) => s.classList.contains('collapsed')).length;
        state.allCollapsed = sections.length > 0 && collapsedCount === sections.length;
        toggleAllBtn!.classList.toggle('collapsed', state.allCollapsed);
        toggleAllLabel!.textContent = state.allCollapsed ? 'Expand' : 'Collapse';
    }

    function setAllCategoriesCollapsed(shouldCollapse: boolean): void {
        container!.querySelectorAll('.category').forEach((s) => {
            s.classList.toggle('collapsed', shouldCollapse);
            const hdr = s.querySelector('.category-header');
            if (hdr) hdr.setAttribute('aria-expanded', String(!shouldCollapse));
        });
        updateGlobalCollapseState();
    }

    selectAll.addEventListener('change', () => {
        const allBoxes = getVisibleExtensionCheckboxes();
        state.selected.clear();
        getAllExtensionCheckboxes().forEach((checkbox) => { checkbox.checked = false; });
        allBoxes.forEach((checkbox) => {
            checkbox.checked = selectAll!.checked;
            if (selectAll!.checked) state.selected.add(checkbox.value);
        });
        updateLinks();
        updateSelectAllState();
    });

    searchInput.addEventListener('input', () => {
        state.searchQuery = searchInput!.value.trim().toLowerCase();
        applyFilters();
        updateSelectAllState();
    });

    toggleAllBtn.addEventListener('click', () => {
        setAllCategoriesCollapsed(!state.allCollapsed);
    });

    browserSelect.addEventListener('change', () => {
        state.browser = browserSelect!.value;
        applyFilters();
        updateLinks();
        updateSelectAllState();
    });

    optionsSelect.addEventListener('change', () => {
        const action = optionsSelect!.value;
        if (!action) return;

        if (action === 'exportPackages') {
            const selectedSorted = Array.from(state.selected).sort((a, b) => a.localeCompare(b));
            const payload = { extensions: selectedSorted };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'toolbox-browser-extensions.json';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        }
        optionsSelect!.value = '';
    });

    copyBtn.addEventListener('click', async () => {
        const command = commandTarget!.textContent;
        if (!command || command.startsWith('Select extensions')) return;
        try {
            await navigator.clipboard.writeText(command);
            const original = copyBtn.textContent;
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = original; }, 1200);
        } catch (error) {
            console.error('Unable to copy links:', error);
        }
    });

    applyFilters();
    setAllCategoriesCollapsed(false);
    updateLinks();
    updateSelectAllState();
}

export async function loadBrowserExtensionsGenerator(): Promise<void> {
    try {
        const response = await fetch(getBrowserExtensionsJsonUrl());
        if (!response.ok) throw new Error(`Failed to load browser extensions data: ${response.statusText}`);
        const data = await response.json() as BrowserExtensionData;
        const items = getBrowserExtensionsFromData(data);
        renderBrowserExtensionsGenerator(items);
    } catch (error) {
        console.error('Error loading browser extensions generator data:', error);
    }
}

// ============================================================================
// INIT
// ============================================================================

function initSharedPages(): void {
    if (document.getElementById('extensionsCategories')) {
        loadVscodeExtensionsGenerator();
    }
    if (document.getElementById('extensionsTableBody')) {
        loadVscodeExtensionsTable();
    }
    if (document.getElementById('browserExtensionsCategories')) {
        loadBrowserExtensionsGenerator();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedPages);
} else {
    initSharedPages();
}

