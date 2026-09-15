# Roadmap

> **Status**: Active. Planned work that isn't scheduled yet.
> **Last updated**: 2026-09-15
> **Related**: [`TAXONOMY.md`](./TAXONOMY.md) for the current category structure, [`CHANGELOG.md`](./CHANGELOG.md) for what's already shipped, and `CLAUDE.md` for the content pipeline these items touch.

## Categorization

- **Raindrop MCP + Claude for category names & classification.** Connect a Raindrop MCP server to Claude so links can be reviewed and reclassified directly against the taxonomy (`public/pkgs/taxonomy.json` / `docs/TAXONOMY.md`) instead of manually reviewing the CSV export — catching mis-tagged links, inconsistent naming, and category drift before the next `scripts/convert.js` rebuild.
