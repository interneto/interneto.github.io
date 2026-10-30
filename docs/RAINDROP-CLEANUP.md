# Raindrop cleanup — runbook

> **Status**: Active. Classification system defined (this doc). Every branch has had a first pass: all 19 `Apps & Services` categories, all of `Society`, and all of `Saved` (`Content`, `Creator`, `Places`, `Upload`). Optional later work: a second, deeper content-reading pass on the large branches, and `Office & Productivity` (22 children) is still above target by design. Day-to-day: classify `Unsorted`, then the scheduled sync publishes it. Progress is in [`RAINDROP-LOG.md`](./RAINDROP-LOG.md).
> **Last updated**: 2026-10-22
> **Audience**: the maintainer and any Claude Code session continuing this work. Read this file first; it is meant to be enough to resume without the original conversation.
> **Related**: [`TAXONOMY.md`](./TAXONOMY.md) (the 19 fixed content categories), [`ROADMAP.md`](./ROADMAP.md), `scripts/README.md` (CSV → Markdown pipeline).
>
> **Note on history**: this doc, a distro-icon UI change, and `scripts/raindrop-snapshot.mjs` were written and committed once already in this project (commit hashes `aa22a45`, `e21b1eb`), then found missing from `git log`/`reflog` in a later session — the commits never reached this working copy. Cause unconfirmed (possibly a different clone/worktree). If you find this note but the file already exists with different content, treat `git log` as the source of truth and reconcile rather than overwrite blind.

## Goal

Reach a near-perfect classification of the Raindrop library: a consistent tree with one clear axis per level, consistent naming, and every bookmark in the folder where it fits best. The site content is generated from the Raindrop export, so a clean library gives clean category pages.

## Hard rules

From the maintainer, override any convenience:

1. **Never delete** anything: bookmarks, collections, tags, highlights.
2. ~~Never create anything net-new~~ — **superseded 2026-09-22**: creating collections (and bookmarks) is now allowed. `REVIEW` and `TEST` were the original pre-existing utility folders, created by hand by the maintainer before this changed.
3. Allowed operations: **rename** a collection, **reparent** a collection (group it under an existing one, or under a newly created one), **move** a bookmark to a collection, **create** a collection (e.g. a new umbrella/grouping folder) when grouping calls for one that doesn't exist yet — prefer reusing or reparenting under an existing collection first (rule 4/5 in the classification system below), create only when no existing one fits.
4. **Merging is allowed as long as nothing is deleted**: consolidating means moving every bookmark out of the redundant collection into the target — never `merge_collections`, which deletes the source collections. **Standing rule, 2026-09-22: every merge always leaves its source collection empty (0 links) — that's expected, not a mistake, since deleting it is still forbidden. Reparent that now-empty shell under `REVIEW` in the same batch, immediately after the merge, rather than waiting for a separate sweep.** A rename never does this (same collection, same links, just relabeled) — only merges need this step.
5. ~~Not allowed on bookmarks: changing title, link, note, tags or metadata~~ — **superseded 2026-09-22**: editing a bookmark's link (or other fields) is allowed, but should be rare, only for clearly necessary cases (e.g. a broken or demonstrably wrong link found while reclassifying) — verify the replacement before applying (fetch/curl it, don't guess from memory) and note it in the progress log. The default is still: only the collection changes. Reclassification is the job; fixing bookmark content is the rare exception, not a parallel task.
6. Anything uncertain, or without a good home, goes to `REVIEW`. The maintainer decides later.
7. Empty (orphan) collections are never removed by Claude. They are left in place or moved under `REVIEW`; the maintainer deletes them in the Raindrop app if they choose to.
8. Verify before claiming: after every rename/move batch, re-fetch the affected collections/bookmarks and confirm the change stuck before reporting it done.

Enforced, not just written down. `.claude/settings.local.json` (gitignored, per machine) denies:

```
mcp__raindrop__create_bookmarks   mcp__raindrop__delete_bookmarks   mcp__raindrop__merge_collections
mcp__raindrop__create_collections mcp__raindrop__delete_collections mcp__raindrop__update_tags
mcp__raindrop__create_highlight   mcp__raindrop__delete_highlights  mcp__raindrop__update_highlight
                                  mcp__raindrop__delete_tags
```

If this deny file is missing on a machine, recreate it before touching Raindrop. Claude cannot edit its own permissions (the harness refuses self-modification of `settings.local.json`); the maintainer edits it by hand.

**Off-limits roots — do not touch, do not list**: `!nfo` (id `19044358`) and the root whose title is a single unrenderable character, referred to as `.` (id `71411789`). Excluded from every snapshot, plan and report.

**Rule 2 update, 2026-09-22**: the maintainer lifted the no-create restriction — creating collections (and bookmarks) is now allowed. **Only deleting a collection or a bookmark is still forbidden.** `merge_collections` stays denied (it deletes the source collections). Deny list is now just `delete_collections`, `delete_bookmarks`, `merge_collections` — check `.claude/settings.local.json` matches this if it looks stale; it was found completely empty (no deny block at all) partway through this session, cause unconfirmed, and rebuilt from scratch at that point.

## Setup

- **MCP server**: official Raindrop server, `https://api.raindrop.io/rest/v2/ai/mcp` (OAuth, dynamic client registration, scopes `read`/`write`).
  - Add: `claude mcp add --transport http raindrop https://api.raindrop.io/rest/v2/ai/mcp`
  - Authenticate: `/mcp` in an interactive session → raindrop → Authenticate. Reconnect or restart so tools load.
- **Tools available under the deny list**: `find_collections`, `find_bookmarks`, `find_misplaced_bookmarks`, `find_mistagged_bookmarks`, `fetch_current_user`, `search_help_docs`, `fetch_bookmark_content`, `update_collections` (rename, reparent), `update_bookmarks` (move only — never change title/link/note/tags).
- **Gotchas**:
  - `find_collections` with no arguments returns the whole library (~386k characters) — too large for the chat; the harness saves it to a file. Copy it to `links/snapshot/collections.raw.json` and process with a script; don't read it into context directly. Its `search` param is Pro-only (fails on this account).
  - `find_bookmarks` returns at most 150 per call; page or filter (`collection_ids`, `url_pattern`, etc.) rather than dumping everything.
  - `update_bookmarks` / `update_collections` take at most 150 ids per call. Batch by destination collection.
- **Key ids** (verify with a fresh `find_collections` if in doubt — ids are only valid for this account): `REVIEW` = `75353467` **(stale as of 2026-10-30 — `update_bookmarks` returned `NotFound: collection 75353467 not found`; re-resolve it before the next pass that needs it)**, `TEST` = `75353327`, Unsorted = `-1`, Trash = `-99`, `Apps & Services` = `32372311`, `Saved` = `63994454`, `Society` = `19046155`.

### REST API token (for `pnpm db:fetch` / `pnpm db:pull`)

Separate from the MCP sign-in above: the MCP connection cannot be reused by scripts, and the app's CSV export is Pro-only. One-time setup:

1. Open <https://app.raindrop.io/settings/integrations>.
2. Under **For Developers**, click **Create new app**. Name: `interneto-sync` (any name works; this is the one these docs assume). Accept the API terms.
3. Open the new app and click **Create test token**, then confirm. The test token is tied to this account only and does not expire.
4. Put it in `.env` in the repo root (gitignored): `RAINDROP_TOKEN=<token>`. Never commit it or paste it into a chat.
5. For the scheduled sync (`.github/workflows/raindrop-sync.yml`, daily), add the same token as the `RAINDROP_TOKEN` repository secret.
6. Run `pnpm db:pull` (fetch, then import/validate/export). The account held 47,449 bookmarks on 2026-10-05; the fetch should report that order of magnitude, minus the two off-limits roots.

To revoke: same page → the app → delete it (or reset the token).

## Data sources

| Source | Gives | Caveat |
|---|---|---|
| `find_collections` (MCP) | Live tree: id, title, parent_id, own/total counts | Authoritative for structure |
| `links/interneto-links.csv` (gitignored) | Every bookmark with its Raindrop id, title, url, folder path | A snapshot in time — refresh before bulk bookmark moves. The app's Export is Pro-only; rebuild it instead with `RAINDROP_TOKEN=… pnpm db:fetch` (REST API, works on free accounts, ~10 min for ~47k bookmarks, read-only, skips the off-limits roots) |
| `scripts/raindrop-snapshot.mjs` | Builds the local read-only snapshot from the two above | Regenerate after any structural change |

```bash
node scripts/raindrop-snapshot.mjs <saved-find_collections-output.json> [links/interneto-links.csv]
```

Output in `links/snapshot/` (gitignored): `tree.md`, `collections.tsv`, `orphans.tsv`, `bookmarks.tsv`.

The generated Markdown category pages (`src/content/categories/*.md`) carry no Raindrop ids — never usable for moves.

## Classification system (MDL / minimum description length)

Defined before bulk reclassification, so every later rename/merge/split decision follows the same measurable rule instead of ad hoc taste. Kolmogorov complexity itself is uncomputable; what follows is the practical proxy used for a folder tree: the "description length" of the whole library is the total cost of encoding, for every bookmark, the path of choices from a root down to it. Two costs pull in opposite directions:

- **Structure cost** — every folder costs bits: enough to name it and to distinguish it from its siblings. A tree with more folders costs more structure.
- **Addressing cost** — at each folder, picking the right child costs roughly log2(number of siblings) bits. A folder with one giant bucket of 2,000 items (`App repository`) costs nothing in structure but is instantly this library's worst offender in addressing: put a new bookmark in, and nothing about the folder name predicted where inside it that bookmark lands. A folder with 2 children barely justifies existing (1 bit of information; the split cost almost as much as it saved).

MDL picks the tree that minimizes the sum. In practice that gives concrete, checkable rules:

1. **One axis per level.** Every group of siblings answers one and only one question — all formats, or all topics, or all sources, never mixed. Two siblings on different axes (a genre next to a file format) can't both be the "right" choice for a new item, which is pure wasted structure. (This already guided the `Content` audit: `Text / Source-code / Audio / Audiovisual / …` is one clean format axis — no rework needed there.)
2. **Target branching factor: 5–15 children per node.** Below ~5, the split barely encodes a bit (rarely worth a folder). Above ~15, picking a child costs as much as no folder existed (approaching the cost of one flat list) — split it. This is also the practical human-navigable range (Miller's ~7±2), which matters because a taxonomy nobody can scan is badly compressed for its real reader too.
3. **Split threshold**: only split a node into new children when it holds ≥40 items *and* a natural partition exists where every new child gets ≥8 items. Splitting into children with 1–3 items each is negative-value — the structure cost exceeds the addressing bits saved. (`Audiovisual`'s single-item leaves — `VR video`, `Health video`, `Places video` — were exactly this; two were folded into an existing sibling that already covered the same property, one stayed because no sibling covers the same thing.)
4. **Merge threshold**: fold a leaf into an existing sibling/parent when it holds ≤3 items *and* a sibling already covers the same predictable property. Don't invent a new destination for it — reusing an existing node is strictly cheaper than adding one. When no existing node fits, it's a real (if small) category — leave it rather than force-fitting.
5. **No near-duplicate siblings.** If two sibling folders' membership criteria overlap by more than about half — you couldn't tell which one a new item belongs in without an unwritten rule — they encode the same thing twice. Merge them (move all bookmarks to one, leave the other's shell empty).
6. **Flatten single-child chains** (currently 162 in the library) — a folder with exactly one child has a branching factor of 1, i.e. zero bits of information; it exists but decides nothing. Reparent the child up a level, *unless* the chain is a genuine growth seed: a namespace that already has siblings-in-waiting elsewhere in the tree (e.g. one company's own subfolder inside a branch that already holds several other named companies the same way) — keep those, they'll stop being single-child as the library grows.
7. **"Mixed" folders (holds both subfolders and its own loose bookmarks) are not automatically wrong.** Distinguish two cases:
   - **Lazy-dump mixed**: the loose bookmarks actually fit one of the existing children and were just never filed — move them in.
   - **Entity-with-subtypes mixed**: the folder denotes a real thing that legitimately has both its own primary resources *and* named sub-entities (e.g. `Ministry of Defense` holding its own official-site bookmark plus a child `Armed Forces`) — this is correct, not a violation. Judge by content, not by the flag alone.
8. **Naming = shortest sufficient label.** A category's name should be the shortest string that fully predicts its membership relative to its siblings. A name that just restates its parent in another language or with extra words (`Music theory wp > Teoría musical wp`) adds bits without adding distinguishing power — rename or fold in. Fix real typos on sight.
9. **Depth cap: 5 from each root** (`Apps & Services`, `Saved`, `Society`). Addressing any one of ~2,400 collections needs about 11–12 bits total; depth 5 at branching ~7–10 gives roughly 14–17 bits of capacity — comfortably enough. Depth beyond that adds navigation cost without adding real discriminating information, and is usually a sign of rule 6 (single-child chains) or over-splitting (rule 3).

**How this changes the earlier structural flags** (`orphan`, `single`, `mixed`, naming): they're now first-pass detectors, not verdicts. `single` → apply rule 6 (check growth-seed exception). `mixed` → apply rule 7 (check which case). Small leaves (≤3) → apply rule 4. Wide branches (>15 children) → apply rule 2/3. Every actual change still requires reading real bookmark titles/content in the folder before acting — a category name never fully determines what's really inside it (seen firsthand: `Analysis of music` looked mis-shelved under `Audiovisual` by name alone; its contents confirmed it was filed correctly, and it was left untouched).

## Workflow

Tree first, bookmarks second, one subtree at a time.

1. **Refresh the snapshot** (see Data sources). Re-export the CSV before bookmark work.
2. **Read before deciding.** For any node the rules above flag, pull a sample of its actual bookmarks (`find_bookmarks` with `collection_ids`) before renaming, merging or moving anything. The rules size the decision; the content confirms it.
3. **Small, verified batches over one giant blind pass.** Apply a handful of high-confidence changes, then re-fetch the affected collections/bookmarks to confirm before reporting done or moving to the next cluster.
4. **After any merge, reparent the emptied source under `REVIEW` in that same batch** (see hard rule 4) — don't leave it sitting empty where it was, and don't wait for a separate cleanup pass.
5. **Low-confidence or judgment calls**: surface to the maintainer rather than guessing (e.g. a category whose name plainly doesn't match its contents, with no obvious correct rename).
6. **Rebuild the site data** once a subtree is settled: re-export the CSV, `node scripts/convert.js` (or `pnpm sync`), `pnpm typecheck`, commit the regenerated content.

### Progress log

Moved to [`RAINDROP-LOG.md`](./RAINDROP-LOG.md) (append new entries there).

## Test state

`TEST` (id `75353327`) holds one bookmark ("Anthropic - Company"), used to prove `update_bookmarks` works. `REVIEW` (id `75353467`) now holds 24 empty collections (see progress log), ready for the maintainer to delete. Maintainer can delete `TEST` too whenever.

## Open questions for the maintainer

All answered 2026-09-22:

1. `Ministry of Agriculture, Fisheries and Food` — confirmed correct.
2. `Political system video` — already renamed by maintainer to `Conspiracy Theory video`, confirmed correct.
3. `Saved` = content, `Society` = entities — confirmed correct.
4. Order: finish `Saved > Content` before moving to `Business & Commerce` / `Online Services`. Done.

## Pending tasks (progress)

Maintainer picked items 4, 5, 6 from below to do next (2026-09-22), items 1 and 2 deferred (naming convention decided — see item 1 — but the pass itself not started; deeper-content-read lens deferred to a future session):

- **#4 done**: `Office & Productivity`'s `Word processor`/`Office suite` and `Contact manager`/`CRM` checked by content — **not duplicates**, correctly split (standalone tools vs. full suites; contact apps vs. CRM software). But each pair had one genuinely misplaced item: `Redmine` (an issue tracker, not a contact manager) moved to `Project Management Tool`; `BillSplit` (expense-splitting, same kind of app as `Settle Up`/`PugPocket`) moved to `Finance manager`.
- **#5 done**: `Blogs media`/`Forum` re-examined for missed groupings. Found and fixed one real pair: `Camera blog` and `Photo blog` — checked content, genuinely the same thing (general photography blogs/news, no gear-vs-technique split held up) — merged (`Photo blog` now 15), shell to `REVIEW`. Checked and confirmed correctly distinct, not merged: `Privacy Guide` (a real guide/resource, not misfiled), `Anon forum` vs `Alternative forum` (anonymity/format vs. fringe-topic — different axes). No other pairs found.
- **#6 done**: `Portfolio > Dr`'s remaining 5 people — fetched each site's actual content (title/domain alone wasn't enough) and placed all 5 into existing categories, **fully dissolving `Dr`**: Sebastian La Rosa (general wellness blogger) and Jimmy Wales (Wikipedia founder, blogs on his own site) → `Content Creators`; Laura Prichard (astrophysics PhD, healthcare data scientist) → `Researcher`; Mar Gómez (PhD physicist, TV weather presenter/science communicator) → `Presenter`; Joe Dispenza (alt-health author, same pattern as Coleman/Horowitz/Emoto already moved) → `Writers`. `Dr`'s shell → `REVIEW`, now fully empty.

## Pending tasks

Everything below is known-outstanding as of 2026-09-22 — not yet done, not forgotten. Ordered roughly by what matters most.

1. ~~Standardize category names across the whole library~~ — **done, 2026-09-23.** See [`RAINDROP-LOG.md`](./RAINDROP-LOG.md).
2. **Apply the "read actual sibling content" lens more broadly — deferred to a future session** (maintainer's call, 2026-09-22). The `AI Tools & Services` deep pass proved structural checks (branching factor, typos) miss real content-mixing that only shows up when you read what's inside near-adjacent categories (`LiteLLM` looked fine structurally, was wrong once read). Only done for `AI Tools & Services` so far. Worth redoing branches with that deeper lens eventually, especially the large ones (`Content`, `Online Services`, `Business & Commerce`).
3. **`Saved > Creator` (2,594 bookmarks) and `Content Uploaded` (17) — never started.** The only two `Saved` branches not yet touched.
4. ~~`Office & Productivity` pairs~~ — **done**, see [`RAINDROP-LOG.md`](./RAINDROP-LOG.md).
5. ~~`Blogs media`/`Forum` re-check~~ — **done**, see [`RAINDROP-LOG.md`](./RAINDROP-LOG.md).
6. ~~`Portfolio > Dr`'s 5 people~~ — **done, `Dr` fully dissolved**, see [`RAINDROP-LOG.md`](./RAINDROP-LOG.md).
7. ~~CSV refresh~~ — **done 2026-10-05** via `pnpm db:fetch`: 47,398 bookmarks written (47,449 in the account minus 51 under the off-limits roots), every folder matched the live tree. Earlier note: **CSV refresh was pending** — no longer needs the Pro-only export: `RAINDROP_TOKEN=… pnpm db:fetch` (added 2026-10-05, not yet run against the live account — no token on the machine that wrote it; first run should be checked against `find_collections` counts). Original note: **CSV re-export was pending on the maintainer's side.** `links/interneto-links.csv` was stale as of the last check (28,551 rows still say the old `Apps/Services` root name). Re-export from Raindrop before the next `node scripts/convert.js` / `pnpm sync`, or rows will be silently skipped by the now-corrected guard in `scripts/lib/utils.js`.
8. ~~Site rebuild~~ — **done 2026-10-05**: `pnpm sync` imported 28,914 `Apps & Services` bookmarks into `data/bookmarks.db` (first import, 0 unmapped folders) and regenerated the 19 category pages + `bookmarks.json`; typecheck and build pass. Earlier note: **Site rebuild had never been run.** All changes so far are in Raindrop only — `src/content/categories/*.md` (and the live site) don't reflect any of it yet. Needs, in order: re-export CSV (#7) → `node scripts/convert.js` or `pnpm sync` → `pnpm typecheck` → commit.
9. ~~`REVIEW` (26 items, as of 2026-09-23) and `TEST` (1 bookmark) are ready for the maintainer to delete** in the Raindrop app — Claude cannot delete. Includes the 4 religion-group leaves (`Buddhism`, `Hinduism`, `Islam`, `Judaism`) the maintainer may want to reconsider keeping as placeholders rather than deleting.~~
10. ~~**One low-confidence typo left unfixed**: `Cords map` (`Travel & Location`, 1 bookmark) — its content didn't confirm what "Cords" was meant to be.~~
11. ~~**Unrelated, from earlier in this session**: a distro-icon UI change (`src/pages/toolbox-installer/desktop.astro`, `public/styles/generator.css`) was made and confirmed lost from git history (commits never reached this working copy, cause unconfirmed). Not redone — say if you still want it.~~
