"""
Compute (and, applied separately via the Raindrop MCP, apply) a Title Case pass over every
Raindrop collection name: sentence case / mixed case -> Title Case, per the maintainer's naming
convention (2026-09-22 decision, see docs/RAINDROP-CLEANUP.md item 1):
  - Title Case, keep emoji prefixes as-is.
  - Keep established tech-brand casing as-is (iOS, macOS, e-commerce, eBook, e-signature, ...) -
    see BRAND_CASE / ALWAYS_LOWER / WHOLE_TOKEN_BRAND below for the exact list found in this
    corpus; extend it if a future pass finds more.
  - kebab-case package-manager names (arch-packages, debian-packages, ...) are a different naming
    system entirely and excluded via KEBAB_PKG_SUBTREE_ROOT - never Title-Case those.
  - Off-limits roots (!nfo, the unrenderable-character root) and REVIEW/TEST (plus their
    contents) are excluded from every pass, same as everywhere else in this project.

Usage:
    node scripts/raindrop-snapshot.mjs <saved-find_collections-output.json>   # refresh first
    python scripts/raindrop-titlecase.py <path-to-collections.raw.json>
Writes titlecase_diff.json (list of {id, old, new}) in the current directory for review before
applying - apply via mcp__raindrop__update_collections in batches of <=150.

This is not idempotent-by-default automation: it computes the diff, it does not call the API.
Review the diff (this file's own commit history has the "gotchas found" list in its log message)
before applying, especially for brand names / proper nouns it might not know about yet.
"""
import json, re, sys

RAW = sys.argv[1] if len(sys.argv) > 1 else "links/snapshot/collections.raw.json"
OFF_LIMITS_ROOTS = {19044358, 71411789}   # !nfo, "."
UTILITY = {75353467, 75353327}            # REVIEW, TEST
KEBAB_PKG_SUBTREE_ROOT = 31879018         # Software-packages (arch-packages, debian-packages, ...)
# Foreign-language proper nouns (a magazine's actual name, not a generic English label) -
# English Title Case rules don't apply, would wrongly capitalize the Spanish article "la".
PROPER_NOUN_EXCEPTIONS = {19888377}       # "Por la Verdad"

STOPWORDS = {
    'a','an','the','and','or','but','for','nor','of','to','in','on','at','by',
    'with','as','vs','vs.','is','from','into','per','via',
}

# Deliberate lowercase suffix tag used across ~125 Encyclopedia titles (e.g. "Writers wp"
# means "sourced from Wikipedia") - not a real word, never capitalize it regardless of position.
ALWAYS_LOWER = {'wp', 'dl'}

# Brand/tech terms whose casing is fixed regardless of position or how the source spelled it -
# found by scanning the corpus for each token's existing casing variants and keeping whichever
# form the majority of the library already uses (e.g. "iOS" appears correctly 1x, "ios" 1x wrong;
# "WordPress"/"YouTube" appear correctly elsewhere, "Wordpress"/"Youtube" are the lone wrong ones).
BRAND_CASE = {
    'ios': 'iOS', 'macos': 'macOS', 'ipados': 'iPadOS', 'watchos': 'watchOS', 'tvos': 'tvOS',
    'ebook': 'eBook', 'ebooks': 'eBooks', 'ereader': 'eReader', 'ereaders': 'eReaders',
    'iphone': 'iPhone', 'ipad': 'iPad', 'wifi': 'WiFi', 'github': 'GitHub', 'gitlab': 'GitLab',
    'youtube': 'YouTube', 'tiktok': 'TikTok', 'whatsapp': 'WhatsApp', 'paypal': 'PayPal',
    'oauth': 'OAuth', 'devops': 'DevOps', 'wordpress': 'WordPress', 'javascript': 'JavaScript',
    'typescript': 'TypeScript', 'postgresql': 'PostgreSQL', 'mysql': 'MySQL',
}
# Whole-token brand exceptions that don't follow ordinary hyphen-segment capitalization
# (e.g. "Ko-fi" keeps a lowercase "fi" - it's the platform's actual name, not two title-cased words).
WHOLE_TOKEN_BRAND = {'ko-fi': 'Ko-fi'}

def is_ancestor(cid, root, by):
    seen = set()
    while cid is not None and cid not in seen:
        if cid == root:
            return True
        seen.add(cid)
        node = by.get(cid)
        if not node:
            return False
        cid = node['parent_id']
    return False

def _case_segment(w):
    """Case one hyphen-free chunk. No stopword handling here - that's applied at the
    whole-space-separated-word level, not per hyphen segment."""
    if not any(ch.isalpha() for ch in w):
        return w  # emoji/symbol/number-only, untouched
    core = re.sub(r"[^A-Za-z]", "", w).lower()
    if core in BRAND_CASE:
        prefix = w[:len(w) - len(w.lstrip('([{'))]
        suffix_start = len(w.rstrip(')]}.,;:'))
        suffix = w[suffix_start:]
        return prefix + BRAND_CASE[core] + suffix
    if core in ALWAYS_LOWER:
        return w.lower()
    # internal uppercase already present (macOS, iOS, eBook, YouTube, WiFi...) -> leave alone
    if any(ch.isupper() for ch in w[1:]):
        return w
    letters = [ch for ch in w if ch.isalpha()]
    # single capital letter (grade/rating like "Serie A", "Plan B") -> leave alone
    if len(letters) == 1:
        return w
    # fully uppercase acronym (len>=2 letters) -> leave alone
    if len(letters) >= 2 and w == w.upper():
        return w
    # capitalize first letter, lowercase rest (plain lower/Capitalized words)
    if w[0].isalpha():
        return w[0].upper() + w[1:].lower()
    return w

def titlecase_word(w, is_first_real_word):
    if not any(ch.isalpha() for ch in w):
        return w, False  # emoji/symbol/number-only, untouched
    core = re.sub(r"[^A-Za-z]", "", w).lower()
    core_hyphenated = re.sub(r"[^A-Za-z\-]", "", w).lower()
    # whole-token brand exception (e.g. "Ko-fi") -> wins over hyphen-segment splitting
    if core_hyphenated in WHOLE_TOKEN_BRAND:
        new = WHOLE_TOKEN_BRAND[core_hyphenated]
        return new, (new != w)
    # single-letter-hyphen-word brand pattern (e-commerce, e-signature, e-book) -> leave alone
    if re.match(r'^[a-z]-[a-z]+$', w):
        return w, False
    # standalone single capital letter (grade/rating like "Serie A", "Plan B") -> leave alone,
    # checked before the stopword rule so "A" never gets mistaken for the article "a"
    letters = [ch for ch in w if ch.isalpha()]
    if len(letters) == 1 and w[0].isupper():
        return w, False
    # stopword, not first real word of the title -> ensure lowercase (whole-word only, not
    # applied inside a hyphenated compound's segments)
    if '-' not in w and core in STOPWORDS and not is_first_real_word:
        new = w.lower()
        return new, (new != w)
    # hyphenated compound: case each segment independently (Self-hosted -> Self-Hosted,
    # AI-gen -> AI-Gen, Front-end -> Front-End), then rejoin
    if '-' in w:
        parts = w.split('-')
        new = '-'.join(_case_segment(p) for p in parts)
        return new, (new != w)
    new = _case_segment(w)
    return new, (new != w)

def titlecase_title(title):
    words = title.split(' ')
    out = []
    seen_first_real = False
    changed = False
    for w in words:
        new_w, did_change = titlecase_word(w, is_first_real_word=not seen_first_real)
        if any(ch.isalpha() for ch in w):
            seen_first_real = True
        if did_change:
            changed = True
        out.append(new_w)
    return ' '.join(out), changed

def main():
    d = json.load(open(RAW, encoding='utf8'))['collections']
    by = {c['collection_id']: c for c in d}
    diffs = []
    for c in d:
        cid = c['collection_id']
        if cid in UTILITY or cid < 0 or cid in PROPER_NOUN_EXCEPTIONS:
            continue
        if any(is_ancestor(cid, r, by) for r in OFF_LIMITS_ROOTS | UTILITY):
            continue
        if is_ancestor(cid, KEBAB_PKG_SUBTREE_ROOT, by):
            continue
        new_title, changed = titlecase_title(c['title'])
        if changed:
            diffs.append({'id': cid, 'old': c['title'], 'new': new_title})
    print(f"{len(d)} total collections scanned, {len(diffs)} would change")
    json.dump(diffs, open('titlecase_diff.json', 'w', encoding='utf8'), ensure_ascii=False, indent=0)
    for x in diffs[:400]:
        print(f"{x['id']}\t{x['old']!r} -> {x['new']!r}")

if __name__ == '__main__':
    main()
