-- Interneto bookmark mirror. Raindrop.io remains the source of truth for
-- structure; this is a local, queryable, rebuildable copy. Never hard-delete
-- a bookmark row — see removed_at.

CREATE TABLE IF NOT EXISTS bookmarks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  raindrop_id   TEXT NOT NULL,
  url           TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  domain        TEXT,
  cover         TEXT,
  note          TEXT,
  favorite      INTEGER NOT NULL DEFAULT 0,
  category      TEXT NOT NULL,
  folder_path   TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT,
  imported_at   TEXT NOT NULL,
  removed_at    TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_raindrop_id ON bookmarks(raindrop_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(category);

CREATE TABLE IF NOT EXISTS collections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  raindrop_id   TEXT UNIQUE,
  name          TEXT NOT NULL,
  parent_id     INTEGER REFERENCES collections(id)
);

CREATE TABLE IF NOT EXISTS bookmark_collections (
  bookmark_id   INTEGER NOT NULL REFERENCES bookmarks(id),
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  PRIMARY KEY (bookmark_id, collection_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmark_tags (
  bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id),
  tag_id      INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (bookmark_id, tag_id)
);

CREATE TABLE IF NOT EXISTS source_code_urls (
  bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id),
  url         TEXT NOT NULL,
  PRIMARY KEY (bookmark_id, url)
);
