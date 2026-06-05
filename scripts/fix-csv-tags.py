#!/usr/bin/env python3
"""
fix-csv-tags.py
Applies tag normalizations and reports on interneto-links.csv.

Usage:
    python scripts/fix-csv-tags.py              # apply all fixes
    python scripts/fix-csv-tags.py --dry-run    # preview without writing
    python scripts/fix-csv-tags.py --report     # full tag audit, no changes

Add new fixes to FIXES (exact string replacement) or REGEX_FIXES (regex).
"""

import argparse
import collections
import csv
import io
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "links" / "interneto-links.csv"
BACKUP_PATH = CSV_PATH.with_suffix(".csv.bak")

# ---------------------------------------------------------------------------
# Exact-string fixes  (old, new)
# Applied in order — put more specific rules first.
# ---------------------------------------------------------------------------
FIXES: list[tuple[str, str]] = [
    # ── Case normalization ───────────────────────────────────────────────
    ("OS compatibility:", "OS Compatibility:"),

    # ── Typos ────────────────────────────────────────────────────────────
    ("OS: WIndows",        "OS: Windows"),
    ("Products: Whislist", "Products: Wishlist"),

    # ── Wrong category ───────────────────────────────────────────────────
    ("OS: iOS",            "OS Compatibility: iOS"),

    # ── Plain-text → Category:Value ──────────────────────────────────────
    ("Company Careers",    "Type: Careers"),
]

# ---------------------------------------------------------------------------
# Regex fixes  (pattern, replacement)
# Applied after exact fixes. Use raw strings.
# ---------------------------------------------------------------------------
REGEX_FIXES: list[tuple[str, str]] = [
    # Example: strip leading/trailing whitespace inside individual tag values
    # (r'(?<=,)\s+', ''),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_csv(path: Path) -> tuple[list[str], list[list[str]]]:
    with open(path, encoding="utf-8", newline="") as f:
        rows = list(csv.reader(f))
    if not rows:
        raise ValueError("CSV is empty")
    return rows[0], rows[1:]


def fix_tag_string(tags: str) -> str:
    for old, new in FIXES:
        tags = tags.replace(old, new)
    for pattern, repl in REGEX_FIXES:
        tags = re.sub(pattern, repl, tags)
    return tags


def apply_fixes(
    header: list[str],
    data: list[list[str]],
    dry_run: bool,
) -> tuple[list[list[str]], int]:
    tag_idx = header.index("tags")
    changed = 0
    out = []
    for row in data:
        if len(row) > tag_idx and row[tag_idx]:
            original = row[tag_idx]
            updated = fix_tag_string(original)
            if updated != original:
                changed += 1
                if dry_run:
                    print(f"  [{changed:>4}] {original!r}")
                    print(f"         → {updated!r}")
                row = list(row)
                row[tag_idx] = updated
        out.append(row)
    return out, changed


def write_csv(path: Path, header: list[str], data: list[list[str]]) -> None:
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(header)
    writer.writerows(data)
    path.write_text(buf.getvalue(), encoding="utf-8")


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def report(header: list[str], data: list[list[str]]) -> None:
    tag_idx = header.index("tags")

    counts: collections.Counter[str] = collections.Counter()
    untagged = 0

    for row in data:
        cell = row[tag_idx] if len(row) > tag_idx else ""
        if not cell.strip():
            untagged += 1
            continue
        for t in cell.split(","):
            t = t.strip()
            if t:
                counts[t] += 1

    total = len(data)
    unique = len(counts)

    print(f"\n{'═'*60}")
    print(f"  TAG AUDIT REPORT — {CSV_PATH.name}")
    print(f"{'═'*60}")
    print(f"  Total bookmarks : {total:,}")
    print(f"  Unique tags     : {unique}")
    print(f"  Untagged        : {untagged:,}  ({untagged/total*100:.1f}%)")

    non_format = [(t, c) for t, c in counts.items() if ":" not in t]
    print(f"\n── Tags NOT following Category:Value ({len(non_format)}) ──")
    if non_format:
        for t, c in sorted(non_format, key=lambda x: -x[1]):
            print(f"  {c:6,}  {t!r}")
    else:
        print("  ✓ None")

    underused = [(t, c) for t, c in counts.items() if 1 <= c <= 5]
    print(f"\n── Underused tags 1–5 uses ({len(underused)}) ──")
    for t, c in sorted(underused, key=lambda x: (x[1], x[0])):
        print(f"  {c:3}  {t!r}")

    pending = [(old, new) for old, new in FIXES if old in counts]
    if pending:
        print(f"\n── Pending fixes still present in data ({len(pending)}) ──")
        for old, new in pending:
            print(f"  {counts[old]:6,}  {old!r}  →  {new!r}")

    print(f"\n── Top 20 tags ──")
    for t, c in counts.most_common(20):
        print(f"  {c:6,}  {t}")

    print()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    p.add_argument("--report",  action="store_true", help="Print tag audit report and exit")
    p.add_argument("--no-backup", action="store_true", help="Skip creating .bak before writing")
    return p.parse_args()


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()

    header, data = load_csv(CSV_PATH)

    if args.report:
        report(header, data)
        return

    if args.dry_run:
        print("Dry run — no file will be written.\n")

    out_data, changed = apply_fixes(header, data, dry_run=args.dry_run)

    if args.dry_run:
        print(f"\nDry run complete: {changed} rows would change.")
        return

    if changed == 0:
        print("Nothing to fix — CSV is already clean.")
        return

    if not args.no_backup:
        shutil.copy2(CSV_PATH, BACKUP_PATH)
        print(f"Backup written to {BACKUP_PATH.name}")

    write_csv(CSV_PATH, header, out_data)
    print(f"Done: {changed} rows updated in {CSV_PATH.name}")


if __name__ == "__main__":
    main()
