-- Full local mirror of the Raindrop.io account (pnpm db:full -> data/raindrop.db).
-- Rebuilt from scratch on every run; Raindrop stays the source of truth.
-- Holds the whole account except the root `.` and Trash; `!nfo` is included, so it stays local and gitignored.
-- Every row keeps the API object in `raw` (JSON) so nothing the API returns is lost.

CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Includes the system collection Unsorted (-1).
CREATE TABLE collections (
  id          INTEGER PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  slug        TEXT,
  access_level INTEGER,               -- 1 read, 2 collaborate, 3 edit, 4 owner
  parent_id   INTEGER REFERENCES collections(id),
  path        TEXT NOT NULL,          -- "Root / Child / Leaf"
  depth       INTEGER NOT NULL,       -- 0 = root
  count       INTEGER,                -- own bookmarks, as reported by the API
  public      INTEGER,
  view        TEXT,
  sort        INTEGER,
  color       TEXT,
  cover       TEXT,
  expanded    INTEGER,
  created     TEXT,
  last_update TEXT,
  raw         TEXT
);
CREATE INDEX idx_collections_parent ON collections(parent_id);

CREATE TABLE raindrops (
  id            INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  title         TEXT,
  link          TEXT NOT NULL,
  domain        TEXT,
  site          TEXT,                 -- domain grouped by site: en.wikipedia.org -> wikipedia.org (scripts/db/lib/site.js)
  excerpt       TEXT,
  note          TEXT,
  type          TEXT,                 -- link | article | image | video | document | audio
  cover         TEXT,
  important     INTEGER NOT NULL DEFAULT 0,
  broken        INTEGER NOT NULL DEFAULT 0,
  created       TEXT,
  last_update   TEXT,
  reminder      TEXT,
  cache_status  TEXT,
  cache_size    INTEGER,
  file_name     TEXT,
  file_type     TEXT,
  file_size     INTEGER,
  sort          INTEGER,
  raw           TEXT NOT NULL
);
CREATE INDEX idx_raindrops_collection ON raindrops(collection_id);
CREATE INDEX idx_raindrops_domain ON raindrops(domain);
CREATE INDEX idx_raindrops_site ON raindrops(site);
CREATE INDEX idx_raindrops_link ON raindrops(link);
CREATE INDEX idx_raindrops_created ON raindrops(created);

CREATE TABLE raindrop_tags (
  raindrop_id INTEGER NOT NULL REFERENCES raindrops(id),
  tag         TEXT NOT NULL,
  PRIMARY KEY (raindrop_id, tag)
);
CREATE INDEX idx_raindrop_tags_tag ON raindrop_tags(tag);

CREATE TABLE media (
  raindrop_id INTEGER NOT NULL REFERENCES raindrops(id),
  position    INTEGER NOT NULL,
  link        TEXT NOT NULL,
  type        TEXT,
  PRIMARY KEY (raindrop_id, position)
);

CREATE TABLE highlights (
  id          TEXT PRIMARY KEY,
  raindrop_id INTEGER NOT NULL REFERENCES raindrops(id),
  text        TEXT,
  note        TEXT,
  color       TEXT,
  created     TEXT,
  last_update TEXT
);
CREATE INDEX idx_highlights_raindrop ON highlights(raindrop_id);

-- Full-text search: SELECT r.* FROM raindrops_fts f JOIN raindrops r ON r.id = f.rowid WHERE raindrops_fts MATCH 'rust';
CREATE VIRTUAL TABLE raindrops_fts USING fts5(title, excerpt, note, link, content='raindrops', content_rowid='id');

-- Bookmarks with their folder path and tags, ready to browse.
CREATE VIEW v_bookmarks AS
SELECT r.id, r.title, r.link, r.domain, c.path AS folder, r.type, r.important, r.broken,
       (SELECT group_concat(tag, ', ' ORDER BY tag) FROM raindrop_tags t WHERE t.raindrop_id = r.id) AS tags,
       r.excerpt, r.note, r.created, r.last_update
FROM raindrops r JOIN collections c ON c.id = r.collection_id;

CREATE VIEW v_tags AS
SELECT tag, count(*) AS count FROM raindrop_tags GROUP BY tag ORDER BY count DESC;

CREATE VIEW v_domains AS
SELECT domain, count(*) AS count FROM raindrops GROUP BY domain ORDER BY count DESC;

CREATE VIEW v_sites AS
SELECT site, count(*) AS count, count(DISTINCT domain) AS domains FROM raindrops GROUP BY site ORDER BY count DESC;

-- Same link saved more than once.
CREATE VIEW v_duplicates AS
SELECT link, count(*) AS count, group_concat(id, ', ') AS ids
FROM raindrops GROUP BY link HAVING count(*) > 1 ORDER BY count DESC;

-- Own and subtree bookmark counts per collection, from the rows actually stored.
CREATE VIEW v_collection_stats AS
WITH RECURSIVE sub(root, id) AS (
  SELECT id, id FROM collections
  UNION ALL
  SELECT sub.root, c.id FROM collections c JOIN sub ON c.parent_id = sub.id
)
SELECT c.id, c.path, c.depth,
       (SELECT count(*) FROM raindrops r WHERE r.collection_id = c.id) AS own,
       (SELECT count(*) FROM raindrops r JOIN sub s ON r.collection_id = s.id WHERE s.root = c.id) AS total
FROM collections c ORDER BY c.path;
