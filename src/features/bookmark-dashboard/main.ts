import * as d3 from 'd3';
import './style.css';
import { flattenBookmarks } from './services/bookmarkParser';
import type { BookmarkRecord, RawBookmarkNode, VizNode } from './types/bookmarks';
import { clamp, escapeHtml, zoomState } from './shared';
import type { ViewMode } from './shared';
import { renderClassic, limitTopLinksPerSubcategory } from './views/classicView';
import { renderGeo } from './views/geoView';
import { renderSemantic } from './views/semanticView';
import { renderTree } from './views/treeView';

// ─── App state ────────────────────────────────────────────────────────────────

type AppState = {
  records: BookmarkRecord[];
  query: string;
  viewMode: ViewMode;
  favoritesOnly: boolean;
  favoriteIds: Set<string>;
};

const state: AppState = {
  records: [],
  query: '',
  viewMode: 'classic',
  favoritesOnly: false,
  favoriteIds: new Set<string>(),
};

const ISLANDS = ['Categories', 'Web Database', 'Web Platforms'] as const;
type IslandName = (typeof ISLANDS)[number];

const assetBaseUrl = import.meta.env.BASE_URL;
const FAVORITES_STORAGE_KEY = 'interneto.favorite-links';

function assetPath(fileName: string): string {
  return `${assetBaseUrl}${fileName}`;
}

// ─── HTML template ────────────────────────────────────────────────────────────

const mountNode =
  document.querySelector<HTMLDivElement>('#bookmark-dashboard-root') ??
  document.querySelector<HTMLDivElement>('#app');

if (!mountNode) {
  throw new Error('Bookmark dashboard mount node not found.');
}

mountNode.innerHTML = `
  <div class="info-bar">
    <button class="search-toggle-btn" id="search-toggle" type="button" aria-label="Toggle search" aria-expanded="false">
      <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6"/>
        <path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>
    <div class="search-shell" id="search-shell">
      <input id="search-input" type="search" placeholder="Search bookmarks..." autocomplete="off" spellcheck="false" />
    </div>
    <div class="view-toggle" role="tablist" aria-label="View mode">
      <button class="view-btn" id="view-classic" data-view="classic" type="button">Classic</button>
      <button class="view-btn" id="view-tree" data-view="tree" type="button">Tree</button>
      <button class="view-btn" id="view-semantic" data-view="semantic" type="button">Semantic</button>
      <button class="view-btn" id="view-geo" data-view="geo" type="button">Geo Map</button>
    </div>
    <button class="favorites-filter-btn" id="favorites-filter" type="button" aria-pressed="false">☆ Favorite Links</button>
    <span id="stats"></span>
  </div>

  <main class="layout">
    <section class="map-panel">
      <aside class="info-panel" id="info-panel" hidden>
        <button class="close-btn" id="close-panel" aria-label="Close panel" type="button">x</button>
        <div id="info-content"></div>
      </aside>
      <div class="zoom-controls" id="zoom-controls" aria-label="Zoom controls">
        <button class="zoom-btn" id="zoom-in"    type="button" aria-label="Zoom in">+</button>
        <button class="zoom-btn" id="zoom-out"   type="button" aria-label="Zoom out">-</button>
        <button class="zoom-btn zoom-btn--wide" id="zoom-reset" type="button" aria-label="Reset zoom">
          <svg class="zoom-btn-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4.2 10a5.8 5.8 0 1 0 2-4.35" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M4.2 5.65v3.45h3.45" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <svg id="zui-svg" aria-label="Bookmark map"></svg>
    </section>
  </main>
`;

// ─── DOM references ───────────────────────────────────────────────────────────

const searchInput   = document.querySelector<HTMLInputElement>('#search-input')!;
const searchToggleBtn = document.querySelector<HTMLButtonElement>('#search-toggle')!;
const searchShell = document.querySelector<HTMLDivElement>('#search-shell')!;
const statsEl       = document.querySelector<HTMLSpanElement>('#stats')!;
const infoPanel     = document.querySelector<HTMLElement>('#info-panel')!;
const infoContent   = document.querySelector<HTMLDivElement>('#info-content')!;
const closePanelBtn = document.querySelector<HTMLButtonElement>('#close-panel')!;
const viewButtons   = Array.from(document.querySelectorAll<HTMLButtonElement>('.view-btn'));
const favoritesFilterBtn = document.querySelector<HTMLButtonElement>('#favorites-filter')!;
const zoomInBtn     = document.querySelector<HTMLButtonElement>('#zoom-in')!;
const zoomOutBtn    = document.querySelector<HTMLButtonElement>('#zoom-out')!;
const zoomResetBtn  = document.querySelector<HTMLButtonElement>('#zoom-reset')!;

// ─── URL state ────────────────────────────────────────────────────────────────

function parseViewModeFromUrl(): ViewMode {
  const value = new URL(window.location.href).searchParams.get('view');
  if (value === 'tree') return 'tree';
  if (value === 'semantic') return 'semantic';
  if (value === 'geo') return 'geo';
  return 'classic';
}

function parseQueryFromUrl(): string {
  return (new URL(window.location.href).searchParams.get('q') ?? '').trim().toLowerCase();
}

function parseFavoritesOnlyFromUrl(): boolean {
  const value = new URL(window.location.href).searchParams.get('favorites');
  return value === '1' || value === 'true';
}

function syncViewButtons(mode: ViewMode): void {
  for (const button of viewButtons) {
    const isActive = button.dataset.view === mode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }
}

function updateViewModeUrl(mode: ViewMode): void {
  const url = new URL(window.location.href);
  if (mode === 'classic') {
    url.searchParams.delete('view');
  } else {
    url.searchParams.set('view', mode);
  }
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function updateSearchUrl(query: string): void {
  const url = new URL(window.location.href);
  if (!query) {
    url.searchParams.delete('q');
  } else {
    url.searchParams.set('q', query);
  }
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function updateFavoritesUrl(enabled: boolean): void {
  const url = new URL(window.location.href);
  if (!enabled) {
    url.searchParams.delete('favorites');
  } else {
    url.searchParams.set('favorites', '1');
  }
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function loadStoredFavoriteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return new Set<string>();
    return new Set<string>(list.filter((v): v is string => typeof v === 'string' && v.length > 0));
  } catch {
    return new Set<string>();
  }
}

function persistFavoriteIds(): void {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(state.favoriteIds)));
}

function isFavoriteRecord(record: BookmarkRecord): boolean {
  return record.isFavorite || state.favoriteIds.has(record.id);
}

function syncFavoritesFilterButton(): void {
  favoritesFilterBtn.classList.toggle('is-active', state.favoritesOnly);
  favoritesFilterBtn.setAttribute('aria-pressed', state.favoritesOnly ? 'true' : 'false');
  favoritesFilterBtn.textContent = state.favoritesOnly ? '★ Favorite Links' : '☆ Favorite Links';
}

function syncSearchVisibility(): void {
  const hasQuery = state.query.length > 0;
  const searchOpen = searchShell.classList.contains('is-open') || hasQuery;
  searchShell.classList.toggle('is-open', searchOpen);
  searchToggleBtn.classList.toggle('is-active', searchOpen);
  searchToggleBtn.setAttribute('aria-expanded', searchOpen ? 'true' : 'false');
}

// ─── Zoom controls ────────────────────────────────────────────────────────────

function animateZoom(transform: d3.ZoomTransform): void {
  if (!zoomState.behavior) return;
  const svg = d3.select<SVGSVGElement, unknown>('#zui-svg');
  svg.transition().duration(220).call(zoomState.behavior.transform, transform);
}

function zoomBy(factor: number): void {
  if (!zoomState.behavior) return;
  const nextScale = clamp(zoomState.transform.k * factor, 0.08, 18);
  const centerX   = 260;
  const centerY   = 210;
  const tx = centerX - ((centerX - zoomState.transform.x) * nextScale) / zoomState.transform.k;
  const ty = centerY - ((centerY - zoomState.transform.y) * nextScale) / zoomState.transform.k;
  animateZoom(d3.zoomIdentity.translate(tx, ty).scale(nextScale));
}

function resetZoom(): void {
  animateZoom(d3.zoomIdentity);
}

// ─── Data filters ─────────────────────────────────────────────────────────────

function applyFilters(records: BookmarkRecord[]): BookmarkRecord[] {
  return records.filter((record) => {
    if (state.favoritesOnly && !isFavoriteRecord(record)) {
      return false;
    }
    if (!state.query) {
      return true;
    }
    const haystack = [record.title, record.uri, ...record.tags, ...record.folderPath]
      .join(' ').toLowerCase();
    return haystack.includes(state.query);
  });
}

function inferIsland(path: string[]): { island: IslandName; matchedIndex: number } {
  const normalized = path.map((segment) => segment.trim().toLowerCase());

  const exactIndex = normalized.findIndex((segment) =>
    ISLANDS.some((island) => island.toLowerCase() === segment),
  );

  if (exactIndex >= 0) {
    const island = ISLANDS.find((v) => v.toLowerCase() === normalized[exactIndex]) ?? 'Categories';
    return { island, matchedIndex: exactIndex };
  }

  const joined = normalized.join(' ');
  if (joined.includes('database')) return { island: 'Web Database',  matchedIndex: -1 };
  if (joined.includes('platform')) return { island: 'Web Platforms', matchedIndex: -1 };
  return { island: 'Categories', matchedIndex: -1 };
}

function clusterizeRecord(record: BookmarkRecord): BookmarkRecord {
  const cleanPath = record.folderPath.map((s) => s.trim()).filter(Boolean);
  const { island, matchedIndex } = inferIsland(cleanPath);
  const rest = matchedIndex >= 0 ? cleanPath.slice(matchedIndex + 1) : cleanPath;
  return { ...record, folderPath: [island, ...rest] };
}

// ─── Info panel ───────────────────────────────────────────────────────────────

function showLinkPanel(node: VizNode): void {
  if (!node.record) return;
  const record = node.record;
  const path   = record.folderPath.join(' > ') || 'Root';

  infoContent.innerHTML = `
    <div class="info-path">${escapeHtml(path)}</div>
    <h2 class="info-title">${escapeHtml(record.title)}</h2>
    <button class="info-favorite-btn" id="favorite-toggle" data-bookmark-id="${escapeHtml(record.id)}" type="button">
      ${isFavoriteRecord(record) ? '★ Remove Favorite' : '☆ Add Favorite'}
    </button>
    <a class="info-url" href="${record.uri}" target="_blank" rel="noreferrer noopener"
       title="${escapeHtml(record.uri)}">${escapeHtml(record.uri)}</a>
    ${record.tags.length
      ? '<div class="info-tags">' + record.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('') + '</div>'
      : ''}
    <a class="info-open" href="${record.uri}" target="_blank" rel="noreferrer noopener">Open</a>
  `;

  infoPanel.hidden = false;
}

// ─── Render dispatcher ────────────────────────────────────────────────────────

function render(): void {
  const filteredRecords  = applyFilters(state.records);
  const clusteredRecords = filteredRecords.map((r) => clusterizeRecord(r));
  const classicRecords   = limitTopLinksPerSubcategory(clusteredRecords, 3);
  const favoritesCount = state.records.filter((record) => isFavoriteRecord(record)).length;

  const svg = d3.select<SVGSVGElement, unknown>('#zui-svg');
  svg.selectAll('*').remove();

  zoomState.transform = zoomState.viewTransforms[state.viewMode];

  if (state.viewMode === 'semantic') {
    statsEl.textContent = `${filteredRecords.length.toLocaleString()} / ${state.records.length.toLocaleString()} · ${favoritesCount.toLocaleString()} favorites`;
    renderSemantic(svg, clusteredRecords, showLinkPanel);
    return;
  }

  if (state.viewMode === 'geo') {
    statsEl.textContent = `${filteredRecords.length.toLocaleString()} / ${state.records.length.toLocaleString()} · ${favoritesCount.toLocaleString()} favorites`;
    renderGeo(svg, clusteredRecords, showLinkPanel);
    return;
  }

  if (state.viewMode === 'tree') {
    const metrics = renderTree(svg, clusteredRecords, showLinkPanel, render);
    statsEl.textContent = `${metrics.visibleNodes.toLocaleString()} nodes · ${metrics.visibleBookmarks.toLocaleString()} links visible · ${filteredRecords.length.toLocaleString()} matched · ${state.records.length.toLocaleString()} total · ${favoritesCount.toLocaleString()} favorites`;
    return;
  }

  statsEl.textContent = `${classicRecords.length.toLocaleString()} shown (top 3/subcategory) · ${filteredRecords.length.toLocaleString()} matched · ${state.records.length.toLocaleString()} total · ${favoritesCount.toLocaleString()} favorites`;

  renderClassic(svg, classicRecords, showLinkPanel);
}

// ─── Event listeners ──────────────────────────────────────────────────────────

state.viewMode = parseViewModeFromUrl();
state.query    = parseQueryFromUrl();
state.favoritesOnly = parseFavoritesOnlyFromUrl();
searchInput.value = state.query;
if (state.query) {
  searchShell.classList.add('is-open');
}
syncViewButtons(state.viewMode);
syncFavoritesFilterButton();
syncSearchVisibility();

searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim().toLowerCase();
  updateSearchUrl(state.query);
  syncSearchVisibility();
  render();
});

searchToggleBtn.addEventListener('click', () => {
  const isOpen = searchShell.classList.contains('is-open');
  if (isOpen && state.query.length === 0) {
    searchShell.classList.remove('is-open');
  } else {
    searchShell.classList.add('is-open');
    searchInput.focus();
  }
  syncSearchVisibility();
});

favoritesFilterBtn.addEventListener('click', () => {
  state.favoritesOnly = !state.favoritesOnly;
  updateFavoritesUrl(state.favoritesOnly);
  syncFavoritesFilterButton();
  render();
});

infoContent.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const toggleBtn = target.closest<HTMLButtonElement>('#favorite-toggle');
  if (!toggleBtn) return;
  const bookmarkId = toggleBtn.dataset.bookmarkId;
  if (!bookmarkId) return;

  if (state.favoriteIds.has(bookmarkId)) {
    state.favoriteIds.delete(bookmarkId);
  } else {
    state.favoriteIds.add(bookmarkId);
  }

  const currentRecord = state.records.find((record) => record.id === bookmarkId);
  if (currentRecord) {
    toggleBtn.textContent = isFavoriteRecord(currentRecord)
      ? '★ Remove Favorite'
      : '☆ Add Favorite';
  }

  persistFavoriteIds();
  render();
});

closePanelBtn.addEventListener('click', () => { infoPanel.hidden = true; });

zoomInBtn.addEventListener('click',    () => { zoomBy(1.2);  });
zoomOutBtn.addEventListener('click',   () => { zoomBy(0.84); });
zoomResetBtn.addEventListener('click', () => { resetZoom();  });

for (const button of viewButtons) {
  button.addEventListener('click', () => {
    const selected = button.dataset.view;
    if (selected !== 'classic' && selected !== 'tree' && selected !== 'semantic' && selected !== 'geo') return;
    state.viewMode = selected;
    syncViewButtons(selected);
    updateViewModeUrl(selected);
    render();
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

void bootstrap();

async function bootstrap(): Promise<void> {
  const data = await fetch(assetPath('bookmarks.json')).then(
    (r) => r.json() as Promise<RawBookmarkNode>,
  );
  state.records = flattenBookmarks(data);
  state.favoriteIds = loadStoredFavoriteIds();

  for (const record of state.records) {
    if (record.isFavorite) {
      state.favoriteIds.add(record.id);
    }
  }

  persistFavoriteIds();
  render();
}
