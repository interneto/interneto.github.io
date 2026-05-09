import * as d3 from 'd3';
import './style.css';
import { flattenBookmarks } from './services/bookmarkParser';
import type { BookmarkRecord, RawBookmarkNode, VizNode } from './types/bookmarks';
import { clamp, escapeHtml, zoomState } from './shared';
import type { ViewMode } from './shared';
import { renderClassic, limitTopLinksPerSubcategory } from './views/classicView';
import { renderGeo } from './views/geoView';
import { renderSemantic } from './views/semanticView';

// ─── App state ────────────────────────────────────────────────────────────────

type AppState = {
  records: BookmarkRecord[];
  query: string;
  viewMode: ViewMode;
};

const state: AppState = {
  records: [],
  query: '',
  viewMode: 'classic',
};

const ISLANDS = ['Categories', 'Web Database', 'Web Platforms'] as const;
type IslandName = (typeof ISLANDS)[number];

const assetBaseUrl = import.meta.env.BASE_URL;

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
  <div class="search-bar">
    <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6"/>
      <path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
    <input id="search-input" type="search" placeholder="Search bookmarks..." autocomplete="off" spellcheck="false" />
    <div class="view-toggle" role="tablist" aria-label="View mode">
      <button class="view-btn" id="view-classic" data-view="classic" type="button">Classic</button>
      <button class="view-btn" id="view-semantic" data-view="semantic" type="button">Semantic</button>
      <button class="view-btn" id="view-geo" data-view="geo" type="button">Geo Map</button>
    </div>
    <span id="stats"></span>
  </div>

  <main class="layout">
    <aside class="info-panel" id="info-panel" hidden>
      <button class="close-btn" id="close-panel" aria-label="Close panel" type="button">x</button>
      <div id="info-content"></div>
    </aside>
    <section class="map-panel">
      <div class="zoom-controls" id="zoom-controls" aria-label="Zoom controls">
        <button class="zoom-btn" id="zoom-in"    type="button" aria-label="Zoom in">+</button>
        <button class="zoom-btn" id="zoom-out"   type="button" aria-label="Zoom out">-</button>
        <button class="zoom-btn zoom-btn--wide" id="zoom-reset" type="button" aria-label="Reset zoom">Reset</button>
      </div>
      <svg id="zui-svg" aria-label="Bookmark map"></svg>
    </section>
  </main>

  <footer class="footer">
    <span class="footer-brand">Interneto</span>
  </footer>
`;

// ─── DOM references ───────────────────────────────────────────────────────────

const searchInput   = document.querySelector<HTMLInputElement>('#search-input')!;
const statsEl       = document.querySelector<HTMLSpanElement>('#stats')!;
const infoPanel     = document.querySelector<HTMLElement>('#info-panel')!;
const infoContent   = document.querySelector<HTMLDivElement>('#info-content')!;
const closePanelBtn = document.querySelector<HTMLButtonElement>('#close-panel')!;
const viewButtons   = Array.from(document.querySelectorAll<HTMLButtonElement>('.view-btn'));
const zoomInBtn     = document.querySelector<HTMLButtonElement>('#zoom-in')!;
const zoomOutBtn    = document.querySelector<HTMLButtonElement>('#zoom-out')!;
const zoomResetBtn  = document.querySelector<HTMLButtonElement>('#zoom-reset')!;

// ─── URL state ────────────────────────────────────────────────────────────────

function parseViewModeFromUrl(): ViewMode {
  const value = new URL(window.location.href).searchParams.get('view');
  if (value === 'semantic') return 'semantic';
  if (value === 'geo') return 'geo';
  return 'classic';
}

function parseQueryFromUrl(): string {
  return (new URL(window.location.href).searchParams.get('q') ?? '').trim().toLowerCase();
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
  if (!state.query) return records;
  return records.filter((record) => {
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

  if (state.viewMode === 'classic') {
    statsEl.textContent = `${classicRecords.length.toLocaleString()} shown (top 3/subcategory) · ${filteredRecords.length.toLocaleString()} matched · ${state.records.length.toLocaleString()} total`;
  } else {
    statsEl.textContent = `${filteredRecords.length.toLocaleString()} / ${state.records.length.toLocaleString()}`;
  }

  const svg = d3.select<SVGSVGElement, unknown>('#zui-svg');
  svg.selectAll('*').remove();

  zoomState.transform = zoomState.viewTransforms[state.viewMode];

  if (state.viewMode === 'semantic') {
    renderSemantic(svg, clusteredRecords, showLinkPanel);
    return;
  }

  if (state.viewMode === 'geo') {
    renderGeo(svg, clusteredRecords, showLinkPanel);
    return;
  }

  renderClassic(svg, classicRecords, showLinkPanel);
}

// ─── Event listeners ──────────────────────────────────────────────────────────

state.viewMode = parseViewModeFromUrl();
state.query    = parseQueryFromUrl();
searchInput.value = state.query;
syncViewButtons(state.viewMode);

searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim().toLowerCase();
  updateSearchUrl(state.query);
  render();
});

closePanelBtn.addEventListener('click', () => { infoPanel.hidden = true; });

zoomInBtn.addEventListener('click',    () => { zoomBy(1.2);  });
zoomOutBtn.addEventListener('click',   () => { zoomBy(0.84); });
zoomResetBtn.addEventListener('click', () => { resetZoom();  });

for (const button of viewButtons) {
  button.addEventListener('click', () => {
    const selected = button.dataset.view;
    if (selected !== 'classic' && selected !== 'semantic' && selected !== 'geo') return;
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
  render();
}
