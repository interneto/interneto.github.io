# Raindrop cleanup — runbook

> **Status**: Active. Classification system defined (this doc); reclassification of the full library in progress.
> **Last updated**: 2026-09-22
> **Audience**: the maintainer and any Claude Code session continuing this work. Read this file first; it is meant to be enough to resume without the original conversation.
> **Related**: [`TAXONOMY.md`](./TAXONOMY.md) (the 19 fixed content categories), [`ROADMAP.md`](./ROADMAP.md), `scripts/README.md` (CSV → Markdown pipeline).
>
> **Note on history**: this doc, a distro-icon UI change, and `scripts/raindrop-snapshot.mjs` were written and committed once already in this project (commit hashes `aa22a45`, `e21b1eb`), then found missing from `git log`/`reflog` in a later session — the commits never reached this working copy. Cause unconfirmed (possibly a different clone/worktree). If you find this note but the file already exists with different content, treat `git log` as the source of truth and reconcile rather than overwrite blind.

## Goal

Reach a near-perfect classification of the Raindrop library: a consistent tree with one clear axis per level, consistent naming, and every bookmark in the folder where it fits best. The site content is generated from the Raindrop export, so a clean library gives clean category pages.

## Hard rules

From the maintainer, override any convenience:

1. **Never delete** anything: bookmarks, collections, tags, highlights.
2. **Never create** anything net-new. The only pre-existing utility folders are `REVIEW` and `TEST`, both created by hand by the maintainer.
3. Allowed operations: **rename** a collection, **reparent** a collection (group it under an existing one), **move** a bookmark to an existing collection.
4. **Merging is allowed as long as nothing is deleted**: consolidating means moving every bookmark out of the redundant collection into the target and leaving the now-empty shell in place (or reparenting it under `REVIEW`) — never `merge_collections`, which deletes the source collections.
5. Not allowed on bookmarks: changing title, link, note, tags or metadata. Only the collection changes.
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

## Setup

- **MCP server**: official Raindrop server, `https://api.raindrop.io/rest/v2/ai/mcp` (OAuth, dynamic client registration, scopes `read`/`write`).
  - Add: `claude mcp add --transport http raindrop https://api.raindrop.io/rest/v2/ai/mcp`
  - Authenticate: `/mcp` in an interactive session → raindrop → Authenticate. Reconnect or restart so tools load.
- **Tools available under the deny list**: `find_collections`, `find_bookmarks`, `find_misplaced_bookmarks`, `find_mistagged_bookmarks`, `fetch_current_user`, `search_help_docs`, `fetch_bookmark_content`, `update_collections` (rename, reparent), `update_bookmarks` (move only — never change title/link/note/tags).
- **Gotchas**:
  - `find_collections` with no arguments returns the whole library (~386k characters) — too large for the chat; the harness saves it to a file. Copy it to `links/snapshot/collections.raw.json` and process with a script; don't read it into context directly. Its `search` param is Pro-only (fails on this account).
  - `find_bookmarks` returns at most 150 per call; page or filter (`collection_ids`, `url_pattern`, etc.) rather than dumping everything.
  - `update_bookmarks` / `update_collections` take at most 150 ids per call. Batch by destination collection.
- **Key ids** (verify with a fresh `find_collections` if in doubt — ids are only valid for this account): `REVIEW` = `75353467`, `TEST` = `75353327`, Unsorted = `-1`, Trash = `-99`, `Apps & Services` = `32372311`, `Saved` = `63994454`, `Society` = `19046155`.

## Data sources

| Source | Gives | Caveat |
|---|---|---|
| `find_collections` (MCP) | Live tree: id, title, parent_id, own/total counts | Authoritative for structure |
| `links/interneto-links.csv` (Raindrop export, gitignored) | Every bookmark with its Raindrop id, title, url, folder path | A snapshot in time — re-export before bulk bookmark moves |
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
4. **Low-confidence or judgment calls**: surface to the maintainer rather than guessing (e.g. a category whose name plainly doesn't match its contents, with no obvious correct rename).
5. **Rebuild the site data** once a subtree is settled: re-export the CSV, `node scripts/convert.js` (or `pnpm sync`), `pnpm typecheck`, commit the regenerated content.

### Progress log

- `by-Company` (33 bookmarks, retired per `TAXONOMY.md`) merged into `Business & Commerce > Enterprises > Conglomerate`. Shell empty, not deleted.
- 12 slash-in-title collections renamed to `&`, matching the existing sibling convention (`Jazz & Blues`). The root `Apps/Services` (as it was named then) kept its bare slash at the time — hardcoded in `scripts/lib/utils.js` as the CSV path-parser's split guard. (Superseded below: the maintainer renamed this root too.)
- 18 Spanish government ministry folders (`Society > Govs > Spain Ministers`) translated to English, 2 typos fixed in the process (`Minesterio` → `Ministerio` → `Ministry`, `Asusntos` → `Asuntos`). `Ejército de España` → `Armed Forces`. One low-confidence guess: `Minesterio de APA` → `Ministry of Agriculture, Fisheries and Food` — needs maintainer confirmation, "APA" unconfirmed.
- Proper nouns correctly left untranslated: `La Palma`, `El Hierro`, `La Gomera` (place names), `Por la Verdad` (a magazine's actual name).
- 2 more typos fixed in `Saved > Content > Audiovisual`: `Photograhy Content` → `Photography Content`, `Exercice video` → `Exercise video`.
- `Content` subtree top level audited: `Text / Source-code / Audio / Audiovisual / Software-packages / Resource / Image / Upload` is a clean single format axis, no rework needed at that level.
- `Health video` (1) and `Places video` (2), both under `Audiovisual`, merged into existing siblings `Explaining video` and `Documentary video` after confirming content fit. Shells empty.
- Still open in `Audiovisual`: `Political system video` (4 bookmarks — actual content is Illuminati/Jesuits/Rothschild/Vatican conspiracy videos, label doesn't match; needs maintainer input on the right name) — not renamed. `VR video` (1) and `Records video` (3, world-record clips) left as-is — genuinely distinct content, no good merge target.
- `Political system video` → renamed (by maintainer, directly in Raindrop) to `Conspiracy Theory video` — matches its actual contents (Illuminati/Jesuits/Rothschild/Vatican videos). Confirmed correct.
- `Scripts` vs `Coding content` (`Source-code`): checked both, no overlap — `Scripts` is OS install/setup scripts only, `Coding content` is a broad grab-bag (CodePen demos, Colab notebooks, tutorials, checklists). Rule 5 (near-duplicate merge) doesn't apply. `Coding content` itself is low-coherence and a real split candidate later (≥40 items, rule 3) — not attempted yet.
- `Software-packages` audited: clean single axis (package manager/ecosystem), consistent `kebab-case` naming matching real package-manager slugs (the `lower` flag here is a deliberate, coherent convention, not an inconsistency — left untouched). No changes needed.
- `Encyclopedia content` (2,559 bookmarks, the second-largest branch in `Content`) audited: a coherent Dewey-like subject tree, single axis at every level, all consistently `wp`-suffixed. Two real fixes: `Tunning wp` → `Tuning wp` (typo); `Music Theory (Spanish) wp` (my earlier translation of `Teoría musical wp`) turned out to split the tree on *language* where every other node here splits on *subject* — a rule-1 violation I introduced myself. Re-checked its 23 bookmarks' actual content and they're specifically about intervals/tuning, so split them into the existing `Interval music wp` (+12) and `Tuning wp` (+11) rather than the generic parent — higher fidelity, still zero new categories. Shell empty.
- Sampled `Physics wp`'s 151 "own" bookmarks (a big mixed-flag branch): confirmed legitimate — general physics-glossary entries (Buoyancy, Angular momentum, Capacitance…) that don't fit one subfield. Entity-with-subtypes, not a lazy dump. Left as-is.
- Remaining unreviewed in `Saved > Content`: `Text` branch outside Encyclopedia content (Blog content, Book, Patent content, …), `Resource`, `Image`, `Upload`, and the `Music content` genre tree under `Audio`.
- **`App repository` (1,986 bookmarks, one flat leaf) — explicitly out of scope, maintainer's call (2026-09-22).** Already covered by the site's own app/package catalogs (`public/pkgs/*.json`, the toolbox installer); redundant to also subdivide it here. Leave as a single flat leaf, don't revisit.
- **Root rename, 2026-09-22**: maintainer renamed the root `Apps/Services` → `Apps & Services` directly in Raindrop (removes the last slash-in-title case). Since `scripts/lib/utils.js`'s `isValidRowFolder` hardcoded the old literal `'Apps/Services'` as the CSV path-parser's root guard, updated it to `'Apps & Services'` (and the matching CSV fixtures in `scripts/db/*.test.js`); `pnpm run db:test` passes (5/5). **As of 2026-09-22 the local `links/interneto-links.csv` still has the old name** (28,551 rows say `Apps/Services`, only 2 say `Apps & Services` — not yet re-exported) — re-export from Raindrop before the next `node scripts/convert.js` / `pnpm sync`, or every row under the root will be silently skipped by the now-updated guard.
- **`Saved > Content` — fully reviewed, 2026-09-22.** All branches covered: `Text` (Encyclopedia content, Blog content, Book/Patent/Recipe/Resume/Paper/AI Conversation leaves), `Source-code`, `Audio`/`Music content` genre tree, `Audiovisual`, `Software-packages`, `Resource`, `Image`, `Upload`. Fixes applied: 6× `arcticles` → `articles` typo and `HIstory` → `History` (`Blog content`); 3 leaves given the `wp` suffix every sibling around them carries (`Astral body`, `Classical mechanics`, `Aeronautics`); `Reggeaton` → `Reggaeton` typo (`Music content`); one real single-child chain flattened — `RnB` (0 own, 1 child `Soul`) had zero information per rule 6, so `Soul` was reparented up to sit directly under `Music content`, `RnB`'s shell left empty. `Resource`/`Image`/`Upload` were already clean. Checked and deliberately left alone: `Paranormal wp`/`Conspiracy wp` (QAnon vs Xenoglossy/Paranormal — genuinely distinct, not a duplicate); `Quantum mechanics wp`/`Classical mechanics wp` (real distinct subfields, no merge target); `Music content`'s 18-way top-level branching (above the 15 target, but every genre is real and populated — a meta-genre regrouping is a bigger, more subjective call than this pass should make unilaterally).
- **`Online Services` — reviewed, 2026-09-22.** 318 collections. Found and fixed a real structural bug: `DuckDuckGo` (9 bookmarks, its own company, tagged `Company: DuckDuckGo`) was nested as a fake "child" of `MS Bing`, and `Lycos` (8 bookmarks, its own independent legacy portal) as a fake child of `Google Search` — two competing search engines each misfiled under an unrelated competitor. Reparented both up to sit directly under `Search engine`, siblings of `MS Bing`/`Google Search`/`Sogou`/`Searx`. Also: `Human Phenotypes` → `Human Phenotypes Db`, matching ~18 of its ~21 siblings under `Database`. Typo scan across all 318 titles: none found. Spot-checked `Coding platform`, `Video streaming`, `Reviews`, `Software Db`, `World Db`, `Wikis` subtrees — all single-axis, no other issues. Not exhaustively reviewed leaf-by-leaf given size; the `DuckDuckGo`/`Lycos` pattern (a real entity misfiled as a fake subtype) is the kind of error worth a second pass looking specifically for elsewhere in the library.
- **`Business & Commerce` — reviewed, 2026-09-22.** 283 collections. Found the same class of bug as `Online Services`' DuckDuckGo/Lycos case, but bigger: 7 of the 33 bookmarks moved into the generic `Enterprises > Conglomerate` during the earlier `by-Company` merge (this session, before `Corporation` had been seen) actually had dedicated, more specific homes in the separate `Corporation` branch's per-company folders (`Microsoft`, `Alphabet (Google)`, `Amazon`, `Facebook (Meta)`, `Apple`, `IBM`, `Alibaba Group`) — moved all 7 to their correct folder. Also found a loose `Alibaba Group` homepage bookmark sitting in `Conglo Group` (a sibling bucket under `Conglomerate`) when `Corporation > Alibaba Group` already existed — same consolidation, moved it too. Two typos fixed: `Geomological Lab` → `Gemological Lab` (checked its actual 2 bookmarks — gemstone-appraisal labs, not geology) and `Defenece contractor` → `Defense contractor`. Typo scan across all 283 titles otherwise clean. **Lesson for future passes**: before merging into a "general/misc" bucket, check sibling branches at the *parent's* level too, not just the immediate children being searched — `Corporation` was one level up from where the by-Company merge was looking.
- All three of the largest branches (`Content`, `Online Services`, `Business & Commerce`) now reviewed. Remaining: the other 16 categories under `Apps & Services` (all much smaller — see the ranked table from the initial triage) and `Society`'s `Organization`/`Portfolio` (Govs already done via the Spanish-ministry pass).

## Test state

`TEST` (id `75353327`) holds one bookmark ("Anthropic - Company"), used to prove `update_bookmarks` works. `REVIEW` (id `75353467`) is empty. Maintainer can delete both whenever.

## Open questions for the maintainer

All answered 2026-09-22:

1. `Ministry of Agriculture, Fisheries and Food` — confirmed correct.
2. `Political system video` — already renamed by maintainer to `Conspiracy Theory video`, confirmed correct.
3. `Saved` = content, `Society` = entities — confirmed correct.
4. Order: finish `Saved > Content` before moving to `Business & Commerce` / `Online Services`. In progress.
