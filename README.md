# Interneto Links

"Interneto Links" web using VitePress template based on [fmhy repository](https://github.com/fmhy/edit).

## What this repo contains

- `docs/` content pages
- `docs/.vitepress/` site config and custom theme
- `unocss.config.ts` UnoCSS config used by VitePress
- `Dockerfile` and `docker-compose.yaml` for containerized static serving

## Requirements

- Node.js 20+
- pnpm 10+

## Local development

1. Install dependencies: `pnpm install`
2. Run the docs dev server: `pnpm docs:dev`
3. Open the local URL shown in terminal (typically `http://localhost:5173`).

## Build for production

Run: `pnpm docs:build`

> Build output is generated in: `docs/.vitepress/dist`

## Preview production build locally

Run: `pnpm docs:preview`

## Updating documentation

1. Edit or add Markdown pages under `docs/`.
2. If needed, update theme/config files in `docs/.vitepress/`.
3. Run `pnpm docs:build` to validate build before publishing.

## Deployment

This is a static site. Any static host works.

### Option A: Cloudflare Pages / Netlify / Vercel (static)

- Build command: `pnpm docs:build`
- Publish directory: `docs/.vitepress/dist`

### Option B: Docker

Build and run with Docker Compose: `docker compose up --build -d`
Then open: <http://localhost:4173>

## Useful scripts

- `pnpm docs:dev` - start local dev server
- `pnpm docs:build` - build static site
- `pnpm docs:preview` - preview production build
- `pnpm format` - run formatter check/write

## Notes

- API/worker infrastructure was removed on purpose to keep this repo docs-only.
- Feedback widgets that depended on API behavior are disabled by default in docs config.
