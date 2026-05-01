# Development Guide

## Requirements

- Node.js 20+
- pnpm 10+

## Local Development

1. Install dependencies: `pnpm install`
2. Run dev server: `pnpm docs:dev`
3. Open http://localhost:5173

## Building

Run: `pnpm docs:build`

Build output: `docs/.vitepress/dist`

## Preview Production Build

Run: `pnpm docs:preview`

## Deployment

### Static Hosts (Cloudflare Pages, Netlify, Vercel)

- Build command: `pnpm docs:build`
- Publish directory: `docs/.vitepress/dist`

### Docker

```bash
docker compose up --build -d
```

Open: http://localhost:4173

## Project Structure

- `docs/` - Content pages in Markdown
- `docs/.vitepress/` - Site configuration and theme
- `unocss.config.ts` - UnoCSS configuration
- `Dockerfile` & `docker-compose.yaml` - Container setup

## Useful Commands

- `pnpm docs:dev` - Start dev server
- `pnpm docs:build` - Build static site
- `pnpm docs:preview` - Preview production build locally
- `pnpm format` - Run formatter
