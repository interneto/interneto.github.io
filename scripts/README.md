# Scripts

Automation scripts for converting Raindrop.io exports to Astro content.

## Architecture

```
scripts/
├── config/
│   └── categories.js              # Category configuration + descriptions
├── lib/
│   ├── csv-parser.js              # CSV parsing utilities
│   ├── markdown-renderer.js       # Markdown generation utilities
│   └── utils.js                   # File I/O and path utilities
├── data/
│   └── typos.csv                  # Typo data for linting
├── convert.js                     # Main converter (orchestrator)
├── lint-markdown.js               # Markdown linting
└── README.md                      # This file
```

## Usage

### Convert Raindrop.io CSV to Markdown

```bash
node scripts/convert.js
```

**What it does:**
1. Reads `links/interneto-links.csv` (Raindrop.io export)
2. Parses CSV and validates items
3. Generates markdown files in `src/content/categories/`
4. Each markdown file includes YAML frontmatter with title + description
5. Runs markdown linting on output

**Input:** CSV file with structure:
- `folder` - Category path (e.g., `AI Tools & Services/Assistants/...`)
- `title` - Bookmark title
- `url` - Bookmark URL
- `favorite` - Boolean for starred items
- `note` - Optional note (can include source-code URLs)

**Output:** Markdown files in `src/content/categories/` with frontmatter:
```yaml
---
title: By Company
description: Browse services grouped by parent company and ecosystem.
---
```

### Lint Markdown

```bash
node scripts/lint-markdown.js
```

Runs markdown linting on generated files.

## Configuration

### `config/categories.js`

Defines:
- **CATEGORY_CONFIG** - Maps Raindrop folders to markdown files
  - `folder` - Raindrop.io category folder name
  - `displayName` - Display name in UI
  - `file` - Output markdown filename
  - `description` - Short description (legacy)
  - `icon` - Emoji icon

- **CATEGORY_DESCRIPTIONS** - Detailed descriptions for UI/frontmatter
  - Maps category folder → full description
  - Used in markdown frontmatter
  - Persists across regenerations

- **PATHS** - File paths
  - `OUTPUT_DIR` - Output directory for markdown
  - `INPUT_CSV_CANDIDATES` - Locations to search for CSV

## Module Structure

### `lib/csv-parser.js`
Functions for parsing Raindrop CSV exports:
- `parseCsv(text)` - Parse CSV string to objects
- `buildItemFromRow(row)` - Convert CSV row to bookmark item
- `extractSourceCodeUrls(note)` - Extract source code URLs from notes

### `lib/markdown-renderer.js`
Functions for rendering markdown output:
- `renderGroupFile(name, group, folder)` - Render complete markdown file
- `renderItems(lines, items)` - Render bookmark list
- `renderChildren(lines, children, level)` - Render nested categories

### `lib/utils.js`
General utilities:
- `resolveInputCsvPath()` - Find CSV file
- `clearOutputDir()` - Clean output directory
- `normalizeFolder()` - Normalize folder paths
- `isValidRowFolder()` - Validate folder structure

## Workflow

1. **Export from Raindrop.io**
   - Download CSV export from Raindrop settings
   - Place in `links/interneto-links.csv`

2. **Run converter**
   ```bash
   node scripts/convert.js
   ```

3. **Review generated markdown**
   - Check output in `src/content/categories/`
   - Frontmatter should include title + description

4. **Commit changes**
   - Converted markdown files are ready for Astro build

## Category Mapping

### Raindrop → Markdown

The converter maps Raindrop folder paths to markdown files using `config/categories.js`. Each top-level folder becomes a separate markdown file with nested items rendered as subheadings.

---

## ClaudePluginHub API — Agent install commands

The AI Agents installer (`public/pkgs/agents-pkgs.json`) uses the [ClaudePluginHub](https://www.claudepluginhub.com) API to source standardized install commands for Claude Code plugins and MCP servers.

### API endpoint

```
POST https://www.claudepluginhub.com/api/recommend
Content-Type: application/json

{
  "dependencies": ["react", "typescript", "node"],
  "files": ["package.json", "tsconfig.json"]
}
```

Returns a `sections[].results[]` array where each result has:

```json
{
  "name": "typescript-lsp",
  "install": {
    "command": "npx claudepluginhub p/anthropics-typescript-lsp-plugins-typescript-lsp",
    "claude": {
      "addCommand": "/plugin marketplace add https://.../marketplace.json",
      "installCommand": "/plugin install ...@cpd-..."
    }
  }
}
```

### How to update entries

1. Query the API with relevant dependencies to find matching entries
2. Map the CPH `install.claude` commands to `installs[].cmd` in `agents-pkgs.json`
3. Add a generic `npx` install entry: `npx claudepluginhub p/<slug>`
4. Set `agent_compat.npx: true` for entries that have a generic command

The API is rate-limited per IP. Use `curl` (not Python) to avoid Cloudflare blocks:

```bash
curl -sL -X POST "https://www.claudepluginhub.com/api/recommend" \
  -H "Content-Type: application/json" \
  -d '{"dependencies":["react","typescript"],"files":["package.json"]}'
```

The converter recognizes items in paths: `Apps/{category}/...`

Current categories (19 total):
- AI Tools & Services, Business & Commerce, Development
- Education & Reference, File Management, Gaming
- Health & Fitness, Home & Family, Money & Finance
- Multimedia, News & Books, Office & Productivity
- Online Services, OS & Utilities, Security & Privacy
- Social & Communications, System Administration
- Travel & Location, Web Browsers

## Notes

- Categories come from Raindrop.io folder structure
- Items must be under `Apps/` folder to be processed
- Descriptions in CATEGORY_DESCRIPTIONS are preserved across regenerations
- Linting checks markdown formatting and typos
