/**
 * Site-wide link search on /categories/ — a Ctrl+K-style popup (inspired by fmhy.pages.dev)
 * that searches every bookmarked link's title, not just category names. Results go to the
 * bookmark's own subcategory heading on its category page — not out to the external site —
 * with a small secondary icon to open the link itself. The full bookmarks export is ~18MB,
 * too heavy to fetch for a search box; this lazy-fetches a slim sibling (title/url/category/
 * anchor, ~3MB) on first open, not on page load.
 */
import fuzzysort from 'fuzzysort';
import type { KeyResult } from 'fuzzysort';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const INDEX_URL = `${BASE}generated/link-search-index.json`;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 30;

interface IndexEntry {
  t: string; // title
  u: string; // external url
  c: string; // category slug
  h: string; // subcategory #anchor on that category page ('' = page top)
}

interface CategoryMeta {
  title: string;
  icon: string;
}

const trigger = document.getElementById('siteLinkSearchTrigger');
const modal = document.getElementById('siteLinkSearchModal');
const input = document.getElementById('siteLinkSearch');
const resultsEl = document.getElementById('siteLinkSearchResults');
const emptyEl = document.getElementById('siteLinkSearchEmpty');
const countEl = document.getElementById('siteLinkSearchCount');
const closeBtn = document.getElementById('siteLinkSearchClose');
const metaScript = document.getElementById('categoryMetaData');

if (
  trigger &&
  modal &&
  input instanceof HTMLInputElement &&
  resultsEl &&
  emptyEl &&
  countEl &&
  closeBtn
) {
  const categoryMeta: Record<string, CategoryMeta> = metaScript?.textContent ? JSON.parse(metaScript.textContent) : {};

  let index: IndexEntry[] | null = null;
  let indexPromise: Promise<IndexEntry[]> | null = null;
  const loadIndex = (): Promise<IndexEntry[]> => {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load link index: ${res.status}`);
          return res.json() as Promise<IndexEntry[]>;
        })
        .then((data) => (index = data));
    }
    return indexPromise;
  };

  const categoryHref = (entry: IndexEntry) => `${BASE}categories/${entry.c}/${entry.h ? `#${entry.h}` : ''}`;

  // Appends title text with matched characters wrapped in <mark>, via fuzzysort's own
  // highlighter — safe (DOM nodes + textContent throughout, no innerHTML of user data).
  const appendHighlighted = (container: Node, result: KeyResult<IndexEntry>) => {
    const parts = result.highlight((match) => {
      const mark = document.createElement('mark');
      mark.textContent = match;
      return mark;
    });
    for (const part of parts) container.appendChild(typeof part === 'string' ? document.createTextNode(part) : part);
  };

  const buildResultRow = (result: KeyResult<IndexEntry>): HTMLLIElement => {
    const entry = result.obj;
    const li = document.createElement('li');
    li.className = 'vp-site-search-result';

    const link = document.createElement('a');
    link.href = categoryHref(entry);
    link.className = 'vp-site-search-result-link';

    const title = document.createElement('span');
    title.className = 'vp-site-search-result-title';
    appendHighlighted(title, result);
    link.appendChild(title);

    const meta = categoryMeta[entry.c];
    const badge = document.createElement('span');
    badge.className = 'vp-site-search-result-category';
    badge.textContent = meta ? `${meta.icon} ${meta.title}` : entry.c;
    link.appendChild(badge);

    li.appendChild(link);

    const openLink = document.createElement('a');
    openLink.href = entry.u;
    openLink.className = 'vp-site-search-result-open';
    openLink.title = 'Open link';
    openLink.setAttribute('aria-label', `Open ${entry.t}`);
    openLink.textContent = '↗';
    li.appendChild(openLink);

    return li;
  };

  const setActive = (i: number) => {
    const rows = Array.from(resultsEl.children);
    rows.forEach((row, idx) => row.classList.toggle('is-active', idx === i));
    rows[i]?.scrollIntoView({ block: 'nearest' });
  };

  const search = (query: string) => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH || !index) {
      resultsEl.replaceChildren();
      resultsEl.hidden = true;
      emptyEl.hidden = true;
      countEl.hidden = true;
      return;
    }
    const found = fuzzysort.go(q, index, { key: 't', limit: MAX_RESULTS, threshold: 0 });
    resultsEl.replaceChildren(...found.map(buildResultRow));
    resultsEl.hidden = found.length === 0;
    emptyEl.hidden = found.length > 0;
    countEl.hidden = found.length === 0;
    countEl.textContent = found.length < found.total ? `Showing ${found.length} of ${found.total} matches` : `${found.total} match${found.total === 1 ? '' : 'es'}`;
    if (found.length) setActive(0);
  };

  let debounceId: ReturnType<typeof setTimeout>;
  input.addEventListener('input', () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => loadIndex().then(() => search(input.value)), 150);
  });

  const open = () => {
    modal.hidden = false;
    document.body.classList.add('vp-site-search-open');
    loadIndex().then(() => search(input.value));
    input.focus();
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove('vp-site-search-open');
    trigger.focus();
  };

  trigger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.addEventListener('mousedown', (e) => {
    if (e.target === modal) close();
  });

  input.addEventListener('keydown', (e) => {
    const rows = Array.from(resultsEl.children) as HTMLLIElement[];
    const activeIdx = rows.findIndex((row) => row.classList.contains('is-active'));

    if (e.key === 'ArrowDown' && rows.length) {
      e.preventDefault();
      setActive((activeIdx + 1) % rows.length);
    } else if (e.key === 'ArrowUp' && rows.length) {
      e.preventDefault();
      setActive((activeIdx - 1 + rows.length) % rows.length);
    } else if (e.key === 'Enter') {
      const target = (rows[activeIdx] ?? rows[0])?.querySelector<HTMLAnchorElement>('.vp-site-search-result-link');
      if (target) {
        e.preventDefault();
        target.click();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.hidden && e.key === 'Escape') {
      close();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modal.hidden) open();
      else close();
    }
  });
}
