# Interneto

Interneto website built with Astro.

## Requirements

- Node.js 22.12.0 or newer
- Recommended for local development: Node.js 24 LTS
- Package manager: pnpm 10

Astro 6 does not support Node 20, so local development and builds must run on Node 22.12.0 or higher. For longer-lived local development, use Node 24 LTS.

## Project

Interneto is a web platform for resource discovery and curation, with core sections for:

- content categories
- link map
- package and compatibility toolbox
- posts and documentation

The site is designed around static content and a fast browsing experience on desktop and mobile.

## Stack

- Astro 6
- TypeScript
- Section-based modular CSS
- D3.js for specific visualizations/interactions
- Content managed with Astro Content Collections (Content Layer API)

## Architecture

- `src/pages/`: site routes and pages
- `src/components/`: reusable UI components
- `src/layouts/`: shared base layouts
- `src/content/`: editorial content (docs and posts)
- `src/content.config.ts`: collection and schema definitions
- `public/`: static assets and serialized data
- `public/styles/`: global styles and page/module styles

## Content and Data

- Content collections for docs and posts
- Supporting JSON/CSV sources for directories, compatibility, and listings
- Internal scripts for data conversion and maintenance

## Site Goal

Centralize useful resources in a navigable, maintainable, and scalable format, prioritizing clarity and quick access.

