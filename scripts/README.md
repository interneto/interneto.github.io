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
- `folder` - Category path (e.g., `Apps/by-Company/...`)
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

The converter recognizes items in paths: `Apps/{category}/...`

Current categories (19 total):
- by-Company, OS, AI Tools & Services, Dev, Gaming
- Education, File Management, Financial assets, Health & Fitness
- Home & Family, InterComm, Multimedia, News Media
- Office & Productivity, Online Services, Security & Privacy
- Sys Admin, Time, Travel & Location, Utility

## Notes

- Categories come from Raindrop.io folder structure
- Items must be under `Apps/` folder to be processed
- Descriptions in CATEGORY_DESCRIPTIONS are preserved across regenerations
- Linting checks markdown formatting and typos
