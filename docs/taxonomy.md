# Taxonomy — Single Source of Truth

> **Status**: Active. This is the canonical taxonomy for the Interneto website.
> **Last updated**: 2026-06-21
> **Conventions reference**: `../ai-bookmarks-classification/CONVENTIONS.md`

## Why one taxonomy

The site previously had **three independent category systems** (content pages, toolbox, bookmark classifier) with overlapping but inconsistent names. This document defines the **single taxonomy** that every section references.

---

## The 19 top-level categories

These are the **fixed top-level categories**. They map 1:1 to Raindrop.io folders and drive content generation via `scripts/convert.js`.

| #  | Category                    | Scope                                                                                |
|----|-----------------------------|--------------------------------------------------------------------------------------|
| 1  | **AI Tools & Services**     | Chatbots, GenAI (image/audio/video), model platforms, AI rankings                    |
| 2  | **Business & Commerce**     | Stores, marketplaces, product research, resale                                       |
| 3  | **Development**             | Code editors, IDEs, hosting, frameworks, CMS, docs, converters                       |
| 4  | **Education & Reference**   | Courses, tutorials, dictionaries, encyclopedias, research papers, note systems       |
| 5  | **File Management**         | File sharing, downloaders, torrents, cloud storage                                   |
| 6  | **Gaming**                  | Games, launchers, emulators, gaming utilities                                        |
| 7  | **Health & Fitness**        | Workouts, wellness, health tracking                                                  |
| 8  | **Home & Family**           | Home automation, recipes, family services                                            |
| 9  | **Money & Finance**         | Banking, cryptocurrency, financial tracking                                          |
| 10 | **Multimedia**              | Audio & Music, Photos & Graphics, Video & Movies (3 subcategories, one page)         |
| 11 | **News & Books**            | News, blogs, digital gardens, libraries, magazines                                   |
| 12 | **Office & Productivity**   | Note-taking, task management, bookmarking, calculators, translators, time tracking   |
| 13 | **Online Services**         | Search engines, web directories, software directories, corporations, organizations   |
| 14 | **OS & Utilities**          | Operating systems, OS components, WMs, system tools, hardware, drivers, CD/DVD tools |
| 15 | **Security & Privacy**      | Password managers, cybersecurity, web privacy                                        |
| 16 | **Social & Communications** | Email, messaging, forums, social networks, video conferencing                        |
| 17 | **System Administration**   | Servers, networking, terminals, virtualization, remote desktop                       |
| 18 | **Travel & Location**       | Maps, weather, travel agencies, flights                                              |
| 19 | **Web Browsers**            | Browsers and browser-related tools                                                   |

### Multimedia subcategories

`Multimedia` is a **single page** that renders 3 internal subcategories as sections:

| Subcategory           | Scope                                                                     |
|-----------------------|---------------------------------------------------------------------------|
| **Audio & Music**     | Music streaming, radio, scores, audio tools                               |
| **Photos & Graphics** | Design tools, 3D models, fonts & icons, stock images, galleries           |
| **Video & Movies**    | Video platforms, IPTV, TV databases, YouTube clients, anime/movies/sports |

These are NOT separate top-level pages — they live inside the Multimedia markdown file as `##` sections.

### Key design decisions

- **AI is a technology, not a function.** An AI code editor goes in `Development`, not `AI Tools & Services`. AI only wins when it *is* the purpose (chatbots, generators, model platforms).
- **Gaming unified.** Games, launchers, emulators, and gaming utilities all live under `Gaming`.
- **Multimedia groups media types.** Audio, photos, and video share a parent because users browse media content together. News & Books is separate — text is not multimedia.
- **OS & Utilities is broad.** Absorbs CD/DVD tools, system tools, and hardware utilities that were separate in the old 24-category standard.
- **System Administration** covers servers, networking, terminals, virtualization, and remote desktop.
- **NSFW not a listed category.** NSFW links are distributed across the 19 with an `nsfw` flag. No separate NSFW page.

---

## Raindrop.io folder structure

The CSV export from Raindrop uses this exact folder hierarchy:

```
AI Tools & Services/
Business & Commerce/
Development/
Education & Reference/
File Management/
Gaming/
Health & Fitness/
Home & Family/
Money & Finance/
Multimedia/
  Audio & Music/
  Photos & Graphics/
  Video & Movies/
News & Books/
  News Media/
  Reading/
Office & Productivity/
Online Services/
OS & Utilities/
Security & Privacy/
Social & Communications/
System Administration/
Travel & Location/
Web Browsers/
```

The converter (`scripts/convert.js`) reads the CSV, groups by top-level folder, and generates one `.md` file per category. For `Multimedia`, subcategories become `##` sections within `multimedia.md`.

---

## Mapping: old website categories → new

| Old (`categories.js` pre-Jun-2026) | New                       | Action                                                                                            |
| ---                                | ---                       | ---                                                                                               |
| `by-Company`                       | —                         | **Special page** (alternative view, not a taxonomy category)                                      |
| `OS`                               | `OS & Utilities`          | Renamed                                                                                           |
| `AI Tools & Services`              | `AI Tools & Services`     | ✅                                                                                                 |
| `Dev`                              | `Development`             | Renamed                                                                                           |
| `Education`                        | `Education & Reference`   | Renamed                                                                                           |
| `File Management`                  | `File Management`         | ✅                                                                                                 |
| `Financial assets`                 | `Money & Finance`         | Renamed                                                                                           |
| `Gaming`                           | `Gaming`                  | ✅ (now unified: games + launchers + emulators)                                                    |
| `Health & Fitness`                 | `Health & Fitness`        | ✅                                                                                                 |
| `Home & Family`                    | `Home & Family`           | ✅                                                                                                 |
| `InterComm`                        | `Social & Communications` | Renamed                                                                                           |
| `Multimedia`                       | `Multimedia`              | ✅ (now with 3 subcategories instead of flat)                                                      |
| `News Media`                       | `News & Books`            | Renamed                                                                                           |
| `Office & Productivity`            | `Office & Productivity`   | ✅                                                                                                 |
| `Online Services`                  | `Online Services`         | ✅                                                                                                 |
| `Security & Privacy`               | `Security & Privacy`      | ✅                                                                                                 |
| `Sys Admin`                        | `System Administration`   | Renamed                                                                                           |
| `Time`                             | `Office & Productivity`   | Absorbed                                                                                          |
| `Travel & Location`                | `Travel & Location`       | ✅                                                                                                 |
| `Utility`                          | `OS & Utilities`          | Absorbed (most links)                                                                             |

### New categories added

| Category              | Origin                        |
|-----------------------|-------------------------------|
| `Business & Commerce` | From the 24-category standard |
| `Web Browsers`        | From the 24-category standard |

---

## Mapping: toolbox categories → taxonomy

The toolbox currently has **29 different category strings** across its 5 catalogs. A runtime mapping layer translates them to the 19 taxonomy categories.

### Desktop packages (`desktop-pkgs.json`)

| Toolbox category           | Taxonomy                  |
|----------------------------|---------------------------|
| `File Management`          | `File Management` ✅       |
| `Utility`                  | `OS & Utilities`          |
| `Internet & Communication` | `Social & Communications` |
| `Office`                   | `Office & Productivity`   |
| `Development`              | `Development` ✅           |
| `Gaming`                   | `Gaming` ✅                |
| `Audio`                    | `Multimedia`              |
| `Video`                    | `Multimedia`              |
| `Image`                    | `Multimedia`              |
| `System`                   | `OS & Utilities`          |
| `Virtualization`           | `System Administration`   |
| `Reading`                  | `Education & Reference`   |
| `Science`                  | `Education & Reference`   |
| `Education`                | `Education & Reference`   |

### Mobile packages (`mobile-pkgs.json`)

| Toolbox category | Taxonomy                |
|------------------|-------------------------|
| `Office`         | `Office & Productivity` |
| `Utility`        | `OS & Utilities`        |

### Browser extensions (`browser-extensions-pkgs.json`)

| Toolbox category       | Taxonomy                |
|------------------------|-------------------------|
| `Privacy and Security` | `Security & Privacy`    |
| `Appearance`           | `Web Browsers`          |
| `Productivity`         | `Office & Productivity` |
| `Developer Tools`      | `Development`           |
| `Media`                | `Multimedia`            |

### VS Code extensions (`vscode-extensions-pkgs.json`)

All map to `Development`. Internal subcategories (`Languages`, `Formatting and Linting`, etc.) are preserved as `subcategory` for UI filtering.

| Toolbox category         | Taxonomy              |
|--------------------------|-----------------------|
| `AI`                     | `AI Tools & Services` |
| `Languages`              | `Development`         |
| `Markdown and Docs`      | `Development`         |
| `Databases`              | `Development`         |
| `Formatting and Linting` | `Development`         |
| `Utilities`              | `Development`         |
| `Web and Frontend`       | `Development`         |
| `DevOps and Cloud`       | `Development`         |
| `Remote Development`     | `Development`         |

### Runtime mapping (Phase 3)

```typescript
// src/scripts/shared/category-mapping.ts
const TOOLBOX_TO_TAXONOMY: Record<string, string> = {
  'File Management': 'File Management',
  'Internet & Communication': 'Social & Communications',
  'Utility': 'OS & Utilities',
  'Office': 'Office & Productivity',
  'Development': 'Development',
  'Gaming': 'Gaming',
  'Audio': 'Multimedia',
  'Video': 'Multimedia',
  'Image': 'Multimedia',
  'System': 'OS & Utilities',
  'Virtualization': 'System Administration',
  'Reading': 'Education & Reference',
  'Science': 'Education & Reference',
  'Education': 'Education & Reference',
  'Privacy and Security': 'Security & Privacy',
  'Appearance': 'Web Browsers',
  'Productivity': 'Office & Productivity',
  'Developer Tools': 'Development',
  'Media': 'Multimedia',
  'AI': 'AI Tools & Services',
  'Languages': 'Development',
  'Markdown and Docs': 'Development',
  'Databases': 'Development',
  'Formatting and Linting': 'Development',
  'Utilities': 'Development',
  'Web and Frontend': 'Development',
  'DevOps and Cloud': 'Development',
  'Remote Development': 'Development',
};
```

---

## Mapping: blog posts → taxonomy

Posts use freeform `tags` in frontmatter. An optional `category` field references the taxonomy.

| Post                      | Category                |
|---------------------------|-------------------------|
| `ai-chatbot-platforms.md` | `AI Tools & Services`   |
| `ai-tools.md`             | `AI Tools & Services`   |
| `bookmark-managers.md`    | `Office & Productivity` |
| `linux-distros.md`        | `OS & Utilities`        |
| `what-is-info.md`         | `Education & Reference` |

---

## Special cases

### `by-Company`

Not a taxonomy category. An alternative view grouping links by parent company (Google, Microsoft, Meta, etc.). Kept as a special page outside the taxonomy hierarchy.

### NSFW

Not a listed category. NSFW links are distributed across the 19 with an `nsfw` flag. The generated `nsfw.md` / `nsfw-content.md` files are excluded from listings.

---

## URL redirects

Old category URLs redirect to new ones (configured in `astro.config.ts`):

| Old URL                           | New URL                                 |
|-----------------------------------|-----------------------------------------|
| `/directory/os/`                  | `/directory/os-and-utilities/`          |
| `/directory/dev/`                 | `/directory/development/`               |
| `/directory/education/`           | `/directory/education-and-reference/`   |
| `/directory/financial-assets/`    | `/directory/money-and-finance/`         |
| `/directory/intercomm/`           | `/directory/social-and-communications/` |
| `/directory/news-media/`          | `/directory/news-and-books/`            |
| `/directory/sys-admin/`           | `/directory/system-administration/`     |
| `/directory/time/`                | `/directory/office-and-productivity/`   |
| `/directory/utility/`             | `/directory/os-and-utilities/`          |
| `/directory/audio-and-music/`     | `/directory/multimedia/`                |
| `/directory/photos-and-graphics/` | `/directory/multimedia/`                |
| `/directory/video-and-movies/`    | `/directory/multimedia/`                |

---

## Migration plan

### Phase 1: Document & agree ✅
- [x] Audit all three systems
- [x] Create taxonomy document
- [x] Decide: NSFW not listed, distributed with flag
- [x] Decide: Gaming unified
- [x] Decide: CD/DVD Tools + System & Hardware → OS & Utilities
- [x] Decide: Multimedia as parent of Audio/Photos/Video (one page)
- [x] Decide: News & Books top-level (not under Multimedia)
- [x] Decide: Web Browsers top-level
- [x] Decide: System Administration (not Network & Admin)

### Phase 2: Update content categories
- [ ] Update `scripts/config/categories.js` to 19 categories
- [ ] Update `src/pages/directory/index.astro` icons and order
- [ ] Update `src/components/VPSidebar.astro` sidebar items
- [ ] Update `src/content/categories/index.md` landing page
- [ ] Update `astro.config.ts` redirects
- [ ] Regenerate `src/content/categories/*.md` via `node scripts/convert.js`

### Phase 3: Update toolbox
- [ ] Create `src/scripts/shared/category-mapping.ts`
- [ ] Update `categoryEmojis` in `public/pkgs/config.json`
- [ ] Update toolbox UI to display taxonomy names

### Phase 4: Update blog
- [ ] Add `category` field to post frontmatter schema
- [ ] Tag existing posts

### Phase 5: Cross-linking
- [ ] Category pages show related toolbox packages
- [ ] Category pages show related blog posts

---

## References

- **This document**: `docs/taxonomy.md`
- **Category config**: `scripts/config/categories.js`
- **Converter**: `scripts/convert.js`
- **Toolbox config**: `public/pkgs/config.json`
- **Classification conventions**: `../ai-bookmarks-classification/CONVENTIONS.md`