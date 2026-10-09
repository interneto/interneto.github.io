/**
 * Site-wide link search on /categories/ — searches every bookmarked link's title
 * (not just category names). The full export (public/generated/bookmarks.json) is
 * ~18MB; this lazy-fetches a slim sibling (title/url/category only, ~2.5MB) on the
 * visitor's first focus/input instead of on page load.
 */
import fuzzysort from 'fuzzysort';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const INDEX_URL = `${BASE}generated/link-search-index.json`;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 40;

interface IndexEntry {
  t: string; // title
  u: string; // url
  c: string; // category slug
}

interface CategoryMeta {
  title: string;
  icon: string;
}

const input = document.getElementById('siteLinkSearch');
const resultsEl = document.getElementById('siteLinkSearchResults');
const emptyEl = document.getElementById('siteLinkSearchEmpty');
const countEl = document.getElementById('siteLinkSearchCount');
const grid = document.querySelector('.vp-categories-index');
const metaScript = document.getElementById('categoryMetaData');

if (input instanceof HTMLInputElement && resultsEl && emptyEl && countEl && grid) {
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

  const buildResultRow = (entry: IndexEntry): HTMLLIElement => {
    const li = document.createElement('li');
    li.className = 'vp-site-search-result';

    const link = document.createElement('a');
    link.href = entry.u;
    link.className = 'vp-site-search-result-link';

    const title = document.createElement('span');
    title.className = 'vp-site-search-result-title';
    title.textContent = entry.t;
    link.appendChild(title);

    const meta = categoryMeta[entry.c];
    const badge = document.createElement('span');
    badge.className = 'vp-site-search-result-category';
    badge.textContent = meta ? `${meta.icon} ${meta.title}` : entry.c;
    link.appendChild(badge);

    li.appendChild(link);
    return li;
  };

  const showResults = (entries: IndexEntry[], total: number) => {
    resultsEl.replaceChildren(...entries.map(buildResultRow));
    resultsEl.hidden = entries.length === 0;
    emptyEl.hidden = entries.length > 0;
    countEl.textContent = entries.length < total ? `Showing ${entries.length} of ${total} matches` : `${total} match${total === 1 ? '' : 'es'}`;
    countEl.hidden = entries.length === 0;
  };

  const search = (query: string) => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH || !index) {
      grid.toggleAttribute('hidden', false);
      resultsEl.hidden = true;
      emptyEl.hidden = true;
      countEl.hidden = true;
      return;
    }
    grid.toggleAttribute('hidden', true);
    const found = fuzzysort.go(q, index, { key: 't', limit: MAX_RESULTS, threshold: 0 });
    showResults(
      found.map((r) => r.obj),
      found.total
    );
  };

  let debounceId: ReturnType<typeof setTimeout>;
  const onInput = () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      loadIndex().then(() => search(input.value));
    }, 150);
  };

  input.addEventListener('focus', () => void loadIndex(), { once: true });
  input.addEventListener('input', onInput);
}
