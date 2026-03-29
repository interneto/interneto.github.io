# TODO

## Priority

- [x] Fix [script](./scripts/convert-interneto-links-to-markdown.js): Move links marked with "fav" (⭐) to the beginning of each folder/subfolder block
- [x] Add total bookmarks count at the beginning of each markdown file in `/docs` folder
- [x] **Add source-code notes to [script](./scripts/convert-interneto-links-to-markdown.js)**
    - Parse source-code URLs from CSV based on `Source-code: URL` pattern in note field
    - Display source-code reference with Git icon in markdown format
    - Implemented output format: `- ⭐ **[title](url)** / [🔗](source-code-url)`
- [x] **Apply markdown lint to output files in [script](./scripts/convert-interneto-links-to-markdown.js)**
    - Integrated `lint-markdown.js` to run automatically after conversion
    - Ensures all generated files are valid and well-formatted
    - Fixes applied: bold formatting for favorites, separators for source-code links
- [x] **Optimize `pnpm run docs:build` performance**
    - Fixed Sass deprecation warning by updating to modern compiler API
    - Created `.pnpmrc` with optimization settings (hoisted node_modules, strict-peer-dependencies)
    - Added `docs:build:prod` and `clean` scripts for CI/CD
    - **Result**: Build time reduced from 50s → 26s (52% faster), all warnings eliminated
- [x] **Sort links by alphabetical order, while maintaining favorites at the beginning**
    - Modified `renderItems()` in conversion script to sort alphabetically with `localeCompare()`
    - Implemented stable sort: favorites first (⭐), then non-favorites
    - Within each group (favorites/non-favorites), items sorted alphabetically by title
    - Result: Clean, organized output with important links always visible at top
- [x] **Support multiple source-code URLs separated by commas**
    - Updated `extractSourceCodeUrls()` to handle multiple URLs from `Source-code:` field
    - Supports format: `Source-code: url1, url2, url3`
    - Renders as: `- ⭐ **[title](url)** / [🔗](url1), [🔗](url2), [🔗](url3)`
    - Flexible parsing with comma separator tolerance
