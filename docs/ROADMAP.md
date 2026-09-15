# Roadmap

> Planned work that isn't scheduled yet. See [`taxonomy.md`](./taxonomy.md) for the current category structure and `CLAUDE.md` for the content pipeline these items touch.

## Categorization

- **Raindrop MCP + Claude for category names & classification.** Connect a Raindrop MCP server to Claude so links can be reviewed and reclassified directly against the taxonomy (`public/pkgs/taxonomy.json` / `docs/taxonomy.md`) instead of manually reviewing the CSV export — catching mis-tagged links, inconsistent naming, and category drift before the next `scripts/convert.js` rebuild.
