# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Interneto is a static Astro 6 site (resource discovery / curation) deployed to GitHub Pages. Core sections: content categories, a link map, posts/docs, and a "toolbox" — an interactive package installer + cross-OS/library compatibility tables.

Requires Node >= 22.12 (Astro 6 drops Node 20; `.nvmrc` pins 24 LTS) and pnpm 10. Output is fully static (`output: 'static'`, `format: 'directory'`, `trailingSlash: 'always'`).

## Commands

```bash
pnpm dev          # local dev server (astro dev)
pnpm build        # static build to dist/
pnpm preview      # serve the built dist/
pnpm typecheck    # astro check — run before committing; CI gates on it
```

CI (`.github/workflows/deploy.yml`) runs `pnpm run typecheck` then `pnpm run build` on push to `main`, then deploys `dist/` to Pages. There is no test runner and no lint step in `package.json`.

Maintenance scripts under `scripts/` are run directly with `node` (no package.json aliases):

```bash
node scripts/convert.js              # Raindrop.io CSV export -> src/content/categories/*.md
node scripts/lint-markdown.js        # lint generated markdown (uses scripts/typos.csv)
node scripts/optimize-svgs.mjs       # svgo pass over public/img/software (skips fake-.svg PNGs)
node scripts/download-lib-icons.mjs  # fetch library icons referenced by config.json
node scripts/download-web-favicons.mjs
```

## Architecture

Two distinct "scripts" trees exist — don't confuse them:
- `scripts/` (repo root) — **build-time Node tooling** (CSV conversion, icon downloads, SVG optimization). Plain `.js`/`.mjs`, ESM.
- `src/scripts/` — **client-side browser TypeScript**, imported into `.astro` pages via `<script>import '...'</script>` tags (Astro bundles them). These run in the browser, not at build time.

### Content (Astro Content Collections, Content Layer API)
`src/content.config.ts` defines two glob collections: `categories` (`src/content/categories/*.md`) and `posts` (`src/content/posts/*.md`, adds optional `tags`). Schemas are intentionally loose (`z.any()` for date/next/prev/footer). Category markdown is **generated** by `scripts/convert.js` from `links/interneto-links.csv` (a Raindrop.io export, gitignored) — edit the converter/`scripts/config/categories.js`, not the output files, when changing category structure. Posts are authored by hand.

### Toolbox (the most complex feature)
Driven entirely by static JSON data in `public/pkgs/`:
- `desktop-pkgs.json`, `mobile-pkgs.json`, `lib-pkgs.json`, `browser-extensions-pkgs.json`, `vscode-extensions-pkgs.json` — package catalogs. Each package has a `package_manager` map keyed by distro/manager (`linux_arch_pacman`, `windows_winget`, `macos_brew`, `freebsd_pkg`, `unix_nix_env`, …) with `null` meaning "not available".
- `config.json` — shared metadata: `nonFossList`, `categoryEmojis`, `distroPrefixes` (install-command prefixes per manager), `windowsNonWinget`, library compatibility tables, icon CDN mappings.
- `list/fav-packages.json` — favorites.

Which catalog a page loads is resolved **from the URL pathname** at runtime — see `resolvePkgsFileFromPath` in `src/scripts/shared/paths.ts`. Don't hardcode catalog URLs.

Client logic splits into two subsystems:
- `src/scripts/toolbox-installer/` — the installer UI. `app.ts` is the entry point that wires data loading (`data-manager`), UI generation (`ui-builder`), checkboxes, FOSS filter, OS/search/copy interactions, and import/export. It builds shell install commands from selected packages.
- `src/scripts/os-compat/` — the compatibility tables (sortable, filterable). `init.ts` is the entry point.
- `src/scripts/shared/` — used by both (paths/config, data-loader, dom-utils, event-bus, theme-config, types).

**Dual route trees:** `src/pages/toolbox/*.astro` and `src/pages/toolbox-installer/*.astro` mirror each other; the `toolbox/` files are thin wrappers that re-export the `toolbox-installer/` page (`import Page from '../toolbox-installer/desktop.astro'`). The real page markup + `<script>` import lives in `toolbox-installer/`. `astro.config.ts` redirects `/toolbox-installer` -> `/toolbox/`. When editing a toolbox page, edit the `toolbox-installer/` version.

The package catalogs are also consumed by a separate project — the TUI toolbox installer (`github.com/interneto/tui-toolbox-installer`) syncs `pkgs` from this site. Keep the JSON shape stable. After editing `public/pkgs/*.json`, use the `sync-tui-pkgs` skill (or run `python ../tui-installer/scripts/sync_pkgs.py`) to push the update into the sibling checkout.

### Pages / layouts / components
- `src/pages/` — routes; `[...slug].astro` dynamic routes for categories and posts; `rss.xml.ts` feed.
- `src/layouts/` — `BaseLayout.astro` is the shell (inline pre-paint theme script reading `localStorage['theme-preference']`, then global CSS, then `VPNavBar`/`SiteFooter`). Other layouts: `VPLayout`, `CompatLayout`, `InstallerLayout`.
- `src/components/` — `.astro` UI, several prefixed `VP*` (VitePress-style nav/hero/sidebar). Compatibility/installer pages compose `CompatibilityTablePage.astro` / `ToolboxInstallerSection.astro` with named slots.
- `src/features/bookmark-dashboard/` — self-contained D3-based bookmark visualization (classic/geo/semantic/tree views) over `src/data/bookmarks.json`. D3 is excluded from Vite optimizeDeps (`astro.config.ts`).

### Styling
Global stylesheets live in `public/styles/` (not `src/`) and are linked by URL in layouts (e.g. `vitepress-base.css`, `base-styles.css`, `vp-shell.css`), with per-page styles passed via `extraStyles`. Module/section-based CSS, no CSS framework.
