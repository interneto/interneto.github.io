# LLM Pricing Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the standalone `llm-pricing` chart (cost vs. ELO quality of LLMs) into `interneto.github.io` as a first-party `/blog/llm-pricing/` feature, including Node-based tooling that preserves the ability to refresh `elo.csv` from the same LMArena source the standalone repo scrapes.

**Architecture:** A self-contained feature module (`src/features/llm-pricing/`, mirroring the existing `bookmark-dashboard` feature) holds the ported chart logic and its own scoped CSS. A dedicated Astro page mounts it outside the markdown content-collection pipeline. Data (`elo.csv`, `narrative.json`) is bundled at build time via Vite imports, matching how `bookmarks.json` is already loaded elsewhere in this repo. Update tooling is a straight Node/Playwright port of the source repo's Python scripts, living in `scripts/` per this repo's existing "flat entry script + `scripts/lib/`" convention.

**Tech Stack:** Astro 6, TypeScript, `@observablehq/plot`, `d3` (already a dependency), `fuzzysort`, Node 22+ native `fetch`, `playwright` (already a devDependency).

**Spec:** `docs/superpowers/specs/2026-08-26-llm-pricing-port-design.md`

## Global Constraints

- Node >= 22.12, pnpm 10 (per `CLAUDE.md`). No test runner, no lint step exists — verification is `pnpm typecheck` (CI-gated) plus manual `pnpm dev` browser checks.
- Output is fully static (`output: 'static'`, `trailingSlash: 'always'`) — no server-side code.
- `scripts/` (repo root) is build-time Node tooling only: plain `.mjs`/`.js` ESM, run directly with `node scripts/foo.mjs`, **no `package.json` script aliases** (per `CLAUDE.md`).
- Every self-contained visual feature owns its own CSS custom-property tokens (light `:root` + `html[data-theme='dark']` override) rather than relying on a shared global token file — there isn't one (per `src/features/bookmark-dashboard/style.css` precedent).
- Do not reuse the id `app` anywhere inside a page's slot content — `VPLayout.astro` already uses `id="app"` for its own root wrapper (`src/layouts/VPLayout.astro:98`); a second `id="app"` inside the slot is a duplicate-ID bug and would apply the feature's page-shell CSS to the whole site chrome instead of just the feature.
- `intelligence.html` / cost-curves is explicitly out of scope — do not port it.

---

## Task 1: Dependencies and data files

**Files:**
- Modify: `package.json` (add `@observablehq/plot`, `fuzzysort` dependencies)
- Create: `src/data/llm-pricing/elo.csv`
- Create: `src/data/llm-pricing/narrative.json`

**Interfaces:**
- Produces: `src/data/llm-pricing/elo.csv` (465 rows + header: `model,overall,hard,coding,cpmi,launch,end,source`), `src/data/llm-pricing/narrative.json` (scrollytelling card data, same shape as the source repo's `data/narrative.json`) — consumed by Task 2's `main.ts`.

- [ ] **Step 1: Add the npm dependencies**

Run from the `interneto.github.io` repo root:

```bash
pnpm add @observablehq/plot fuzzysort
```

- [ ] **Step 2: Verify the install**

Run: `grep -E '"@observablehq/plot"|"fuzzysort"' package.json`
Expected: both lines present under `"dependencies"`.

- [ ] **Step 3: Copy the data files from the source repo**

```bash
mkdir -p src/data/llm-pricing
cp "C:/Users/tener/Workspaces/repos/llm-pricing/data/elo.csv" src/data/llm-pricing/elo.csv
cp "C:/Users/tener/Workspaces/repos/llm-pricing/data/narrative.json" src/data/llm-pricing/narrative.json
```

- [ ] **Step 4: Verify the copy**

Run: `wc -l src/data/llm-pricing/elo.csv && head -c 200 src/data/llm-pricing/narrative.json`
Expected: `466 src/data/llm-pricing/elo.csv` (465 rows + header) and valid-looking JSON starting with `{"cards":`.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/data/llm-pricing/elo.csv src/data/llm-pricing/narrative.json
git commit -m "Add llm-pricing chart dependencies and data files"
```

---

## Task 2: Feature module — `main.ts` and `style.css`

**Files:**
- Create: `src/features/llm-pricing/main.ts`
- Create: `src/features/llm-pricing/style.css`

**Interfaces:**
- Consumes: `src/data/llm-pricing/elo.csv` (raw text via Vite's `?raw` import), `src/data/llm-pricing/narrative.json` (JSON import) — both from Task 1.
- Produces: a client-side module that, when imported, mounts the chart into whatever markup exists at `#llm-pricing-root` inside the page it's loaded on (that markup is added in Task 3). Exports nothing — side-effecting entry module, same shape as `src/features/bookmark-dashboard/main.ts`.

This is a near-1:1 port of `C:\Users\tener\Workspaces\repos\llm-pricing\js\main.js`. Three things differ from the source:
1. CDN ESM imports (`https://cdn.jsdelivr.net/...`) become npm imports; the two `@gramex/ui` number formatters (`num`, `num0`) are inlined instead of adding a dependency for them.
2. `d3.csv("data/elo.csv")` (a runtime `fetch`) becomes a build-time `?raw` import parsed with `d3.csvParse` — matching how `src/features/bookmark-dashboard/main.ts` already build-time-imports `../../data/bookmarks.json` instead of fetching it.
3. The root element id changes from `#app` to `#llm-pricing-root` in the CSS (see Global Constraints) — `main.ts` itself never references `#app`, so no JS change is needed for this.

- [ ] **Step 1: Write `src/features/llm-pricing/style.css`**

```css
:root {
  --bg: #fff;
  --bg-rgb: 255, 255, 255;
  --fg: #212529;
  --border: #ced4da;
  --border-rgb: 206, 212, 218;
  --muted: #6c757d;
  --accent: #06b6d4;
  --radius: 6px;
}

html[data-theme='dark'] {
  --bg: #1a1a2e;
  --bg-rgb: 26, 26, 46;
  --fg: #f8f9fa;
  --border: #495057;
  --border-rgb: 73, 80, 87;
  --muted: #adb5bd;
  --accent: #22d3ee;
}

/* Scoped to this feature's own root — the bare `*`/`html, body` resets the
   source repo used are safe there because that page owns the whole
   document; here the same page also renders the site's nav bar and footer,
   so an unscoped reset would strip their spacing too. */
#llm-pricing-root,
#llm-pricing-root *,
#llm-pricing-root *::before,
#llm-pricing-root *::after {
  box-sizing: border-box;
}

#llm-pricing-root * {
  margin: 0;
  padding: 0;
}

#llm-pricing-root {
  height: 100%;
  overflow-x: hidden;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, sans-serif;
  font-size: 14px;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  padding: 10px 16px;
}

#llm-pricing-root::-webkit-scrollbar { display: none; }

#controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

#controls-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

#controls-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

#title-row {
  display: contents; /* transparent on desktop — children slot into the grid normally */
}

#title-block {
  text-align: center;
}

/* ── Mobile: stack into rows ── */
@media (max-width: 540px) {
  #llm-pricing-root { padding: 10px 12px; }

  #controls { gap: 6px; margin-bottom: 8px; }

  #controls-top {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* title + ? on same row */
  #title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  #title-block { text-align: left; }

  /* select + filter full width */
  #controls-left {
    width: 100%;
    gap: 8px;
  }

  #controls-left select { flex: 1; }
  #controls-left #model  { flex: 2; width: auto; }
}

#controls-right {
  display: flex;
  justify-content: flex-end;
  position: relative;
}

#info-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  transition: border-color 0.15s, color 0.15s;
}

#info-btn:hover { border-color: var(--fg); color: var(--fg); }

#info-popover[hidden] { display: none; }

#info-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: min(360px, 90vw);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(var(--border-rgb), 0.35);
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  line-height: 1.6;
  z-index: 100;
}

#info-popover a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
#info-popover strong { font-weight: 600; }

.info-meta {
  font-size: 11px;
  color: var(--muted);
  border-top: 1px solid var(--border);
  padding-top: 8px;
  margin-top: 2px;
}

#controls-slider {
  display: flex;
  align-items: center;
  gap: 12px;
}

#controls-slider input[type="range"] {
  flex: 1;
  height: 6px;
  accent-color: var(--muted);
  cursor: pointer;
}

#brand {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: var(--fg);
  line-height: 1.2;
}

#subtitle {
  font-size: 11px;
  color: var(--muted);
  margin-top: 1px;
}

.legend {
  white-space: nowrap;
  font-size: 12px;
  color: var(--muted);
}

#date-label {
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  min-width: 72px;
}

#llm-pricing-root select,
#llm-pricing-root #model {
  background: var(--bg);
  color: var(--fg);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

#llm-pricing-root select:focus,
#llm-pricing-root #model:focus {
  border-color: #0d6efd;
}

#llm-pricing-root select { cursor: pointer; }
#model { width: 120px; }

#chart-area {
  flex: 1;
  min-height: 400px;
  margin-top: 10px;
  overflow-x: auto;
  overflow-y: hidden;
}

#llm-cost {
  height: 100%;
  min-height: 400px;
  min-width: 360px;
}

@media (max-width: 540px) {
  #chart-area {
    overflow-x: scroll; /* force scrollbar track visible on iOS */
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  #chart-area::-webkit-scrollbar { height: 5px; display: block; }
  #chart-area::-webkit-scrollbar-track { background: transparent; }
  #chart-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
}

#llm-cost > svg {
  width: 100%;
  display: block;
}

#scrolly-section { display: none; }

/* scrolly styles kept for if/when re-enabled */
.scrolly-step { height: 85vh; position: relative; }
.scrolly-gap  { height: 40vh; }

.scrolly-card {
  position: sticky;
  z-index: 50;
  top: calc(0.75rem + 45vh);
  max-width: 360px;
  width: 38%;
  min-width: 240px;
  padding: 1.1rem 1.35rem 0.9rem;
  border-radius: 14px;
  backdrop-filter: blur(14px) saturate(1.6);
  background: rgba(var(--bg-rgb), 0.18);
  border: 1px solid rgba(var(--border-rgb), 0.35);
  box-shadow: 0 8px 32px rgba(var(--border-rgb), 0.2);
  font-size: 0.8rem;
  line-height: 1.55;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.45s ease, transform 0.45s ease;
  margin-right: auto;
}

.scrolly-card.vert-top  { top: 4.75rem; }
.scrolly-card.pos-right { margin-left: auto; margin-right: 0; }
.scrolly-card.pos-center { margin-left: auto; margin-right: auto; }
.scrolly-card.is-active { opacity: 1; transform: translateY(0); }

.scrolly-card h6 {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  opacity: 0.75;
}

.scrolly-card p { margin-bottom: 0.55rem; }
.scrolly-card p:last-child { margin-bottom: 0; }

.scrolly-card .card-links {
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.scrolly-card .card-links a {
  font-size: 0.72rem;
  opacity: 0.8;
  text-decoration: underline;
  text-underline-offset: 2px;
}
```

- [ ] **Step 2: Write `src/features/llm-pricing/main.ts`**

```ts
import "./style.css";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import fuzzysort from "fuzzysort";
import eloCsvRaw from "../../data/llm-pricing/elo.csv?raw";
import narrative from "../../data/llm-pricing/narrative.json";

// Stand-ins for @gramex/ui's num/num0 helpers the source repo pulled from a CDN.
const num0 = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
const num = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

let quality = new URLSearchParams(window.location.search).get("quality") || "overall";
const $quality = document.querySelector<HTMLSelectElement>("#quality")!;
$quality.value = quality;
$quality.addEventListener("change", () => {
  location.search = "?quality=" + $quality.value;
});

const $infoBtn = document.querySelector<HTMLButtonElement>("#info-btn")!;
const $infoPopover = document.querySelector<HTMLElement>("#info-popover")!;
$infoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  $infoPopover.hidden = !$infoPopover.hidden;
});
document.addEventListener("click", () => {
  $infoPopover.hidden = true;
});
$infoPopover.addEventListener("click", (e) => e.stopPropagation());

type EloRow = Record<string, string>;
type Model = EloRow & { cost: number; elo: number; optimal?: string; node?: Element };

const data = d3.csvParse(eloCsvRaw) as unknown as EloRow[];
const hasEloScore = (row: EloRow, field: string) =>
  row[field]?.trim() !== "" && Number.isFinite(+row[field]);
const models: Model[] = data
  .filter((d) => Number.isFinite(+d.cpmi) && +d.cpmi > 0 && hasEloScore(d, quality))
  .map((d) => ({ ...d, cost: +d.cpmi, elo: +d[quality] }));

let scrollyHighlights = new Set<string>();
let scrollyActive = false;

const $chartArea = document.querySelector<HTMLElement>("#chart-area")!;
const MIN_CHART_WIDTH = 560;

const dates = Array.from(new Set(models.map((d) => d.launch))).sort();
const $date = document.querySelector<HTMLInputElement>("#date")!;
$date.setAttribute("max", String(dates.length - 1));
$date.value = String(dates.length - 1);

const xScale = d3.scaleLog().domain(d3.extent(models, (d) => d.cost) as [number, number]).range([0, 1000]);
const yScale = d3.scaleLinear().domain(d3.extent(models, (d) => d.elo) as [number, number]).range([500, 0]);

const eloAnnotations = [
  { elo: 1000, label: "🧒 Middle schooler" },
  { elo: 1100, label: "🎒 HS freshman" },
  { elo: 1200, label: "🎓 HS graduate" },
  { elo: 1300, label: "📚 College junior" },
  { elo: 1350, label: "🏫 College grad" },
  { elo: 1400, label: "🎓 Master's student" },
  { elo: 1450, label: "🔬 PhD candidate" },
  { elo: 1480, label: "🏛 Tenured professor" },
];

const updateOptimalStatus = (filteredModels: Model[]) => {
  filteredModels.forEach((model) => {
    model.optimal = filteredModels.every(
      (other) => other === model || other.elo < model.elo || other.cost > model.cost
    )
      ? "best"
      : filteredModels.every(
          (other) => other === model || other.elo >= model.elo || other.cost <= model.cost
        )
      ? "worst"
      : "";
  });
};

const renderPlot = (filteredModels: Model[]) => {
  const highlighted = (d: Model) => scrollyHighlights.has(d.model);
  const dimmed = (d: Model) => scrollyActive && scrollyHighlights.size > 0 && !highlighted(d);

  const w = Math.max($chartArea.clientWidth, MIN_CHART_WIDTH);
  const h = Math.min(Math.max($chartArea.clientHeight, 400), Math.round(w * 0.62));

  const plot = Plot.plot({
    marginLeft: 50,
    x: { type: "log", grid: true, domain: xScale.domain() },
    y: { grid: true, domain: yScale.domain() },
    width: w,
    height: h,
    marks: [
      Plot.ruleY(eloAnnotations, {
        y: "elo",
        stroke: "var(--muted)",
        strokeOpacity: 0.3,
        strokeDasharray: "4,4",
      }),
      Plot.text(eloAnnotations, {
        y: "elo",
        text: "label",
        frameAnchor: "right",
        textAnchor: "end",
        fontSize: 10,
        fill: "var(--muted)",
        dx: -4,
        dy: -5,
      }),
      Plot.dot(filteredModels, {
        x: "cost",
        y: "elo",
        r: 8,
        fill: (d: Model) => {
          if (highlighted(d)) return "var(--accent)";
          if (d.optimal === "best") return "lime";
          if (d.optimal === "worst") return "red";
          return "rgba(var(--border-rgb), 0.35)";
        },
        fillOpacity: (d: Model) => (dimmed(d) ? 0.3 : 1),
        stroke: (d: Model) => {
          if (highlighted(d)) return "var(--bg)";
          if (d.optimal) return "var(--fg)";
          return "rgba(var(--border-rgb), 0.35)";
        },
        strokeWidth: (d: Model) => (highlighted(d) ? 1.5 : 0.5),
        strokeOpacity: (d: Model) => (dimmed(d) ? 0.2 : 1),
        channels: { model: "model" },
        tip: {
          fill: "var(--bg)",
          format: {
            fill: false,
            fillOpacity: false,
            strokeOpacity: false,
            strokeWidth: false,
            model: (d: string) => d,
            x: (d: number) => `$${num(d)} / MTok`,
            y: (d: number) => num0(d),
          },
        },
      }),
      Plot.text(
        filteredModels.filter((d) => d.optimal || highlighted(d)),
        {
          x: "cost",
          y: "elo",
          text: (d: Model) => d.model,
          fillOpacity: (d: Model) => (dimmed(d) ? 0.25 : 1),
          dy: -10,
          lineAnchor: "bottom",
        }
      ),
      Plot.axisX({ label: "Cost per million input tokens" }),
      Plot.axisY({ label: "ELO score", tickSpacing: 100 }),
    ],
  });
  document.querySelector("#llm-cost")!.replaceChildren(plot);

  const circles = document.querySelectorAll("#llm-cost circle");
  models.forEach((model, i) => {
    if (circles[i]) model.node = circles[i];
  });
};

const update = () => {
  const date = dates[+$date.value];
  document.querySelector("#date-label")!.textContent = d3.timeFormat("%b %Y")(d3.timeParse("%Y-%m")(date)!);

  const search = document.querySelector<HTMLInputElement>("#model")!.value.trim();
  const matches = new Set(
    fuzzysort.go(search, models.map((m) => m.model), { threshold: -20 }).map((r) => r.target)
  );

  const filteredModels = models.filter(
    (d) => d.launch <= date && (d.end ? d.end > date : true) && (search ? matches.has(d.model) : true)
  );
  updateOptimalStatus(filteredModels);
  renderPlot(filteredModels);
};

$date.addEventListener("input", update);
document.querySelector<HTMLInputElement>("#model")!.addEventListener("input", update);
update();
new ResizeObserver(update).observe($chartArea);

// ── Scrollytelling (kept for if/when re-enabled; hidden via #scrolly-section { display: none } in style.css) ──

type NarrativeCard = {
  position: string;
  vertical?: string;
  title: string;
  body: string;
  links?: { url: string; text: string }[];
  highlight: string[];
  date?: string;
};

const scrollySection = document.querySelector<HTMLElement>("#scrolly-section")!;
const cardEls: HTMLElement[] = [];

(narrative.cards as NarrativeCard[]).forEach((card, i, cards) => {
  const linksHtml = card.links?.length
    ? `<div class="card-links">${card.links
        .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.text}</a>`)
        .join("")}</div>`
    : "";

  const cardEl = document.createElement("div");
  cardEl.className = `scrolly-card pos-${card.position}${card.vertical === "top" ? " vert-top" : ""}`;
  cardEl.innerHTML = `<h6>${card.title}</h6>${card.body}${linksHtml}`;

  const step = document.createElement("div");
  step.className = "scrolly-step";
  step.dataset.step = String(i);
  step.appendChild(cardEl);
  scrollySection.appendChild(step);
  cardEls.push(cardEl);

  if (i < cards.length - 1) {
    const gap = document.createElement("div");
    gap.className = "scrolly-gap";
    scrollySection.appendChild(gap);
  }
});

const trailing = document.createElement("div");
trailing.style.height = "140vh";
scrollySection.appendChild(trailing);

const endSentinel = document.createElement("div");
trailing.prepend(endSentinel);

const activateCard = (cardData: NarrativeCard) => {
  scrollyActive = true;
  scrollyHighlights = new Set(cardData.highlight);
  if (cardData.date) {
    const targetIdx = dates.indexOf(cardData.date);
    if (targetIdx !== -1) animateToMonth(targetIdx);
  } else {
    update();
  }
};
void activateCard; // kept for parity with the source; wired up once scrolly is re-enabled

const deactivateScrolly = () => {
  scrollyActive = false;
  scrollyHighlights.clear();
  update();
};

const endObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) deactivateScrolly();
  },
  { threshold: 0 }
);
endObserver.observe(endSentinel);

let monthAnimFrame: number | null = null;
const animateToMonth = (targetIdx: number) => {
  if (monthAnimFrame) cancelAnimationFrame(monthAnimFrame);
  const startIdx = +$date.value;
  if (startIdx === targetIdx) return;
  const duration = 700;
  const startTime = performance.now();

  const tick = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const cur = Math.round(startIdx + (targetIdx - startIdx) * eased);
    if (+$date.value !== cur) {
      $date.value = String(cur);
      update();
    }
    if (t < 1) monthAnimFrame = requestAnimationFrame(tick);
  };
  monthAnimFrame = requestAnimationFrame(tick);
};
```

Note: `cardEls` and `activateCard` are unused in the sense that nothing currently
scrolls (scrolly is disabled via CSS, matching the source repo). They're kept
because re-enabling scrolly later is exactly "if/when re-enabled" per the
source's own comment — do not delete them as dead code.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no new errors from `src/features/llm-pricing/*`. If TypeScript
complains about the `?raw` import or the JSON import, confirm
`src/env.d.ts` still has `/// <reference types="astro/client" />` (it does
by default — this reference brings in Vite's client types, which declare
`*?raw` imports as `string`). Fix any other reported type errors before
continuing.

- [ ] **Step 4: Commit**

```bash
git add src/features/llm-pricing/main.ts src/features/llm-pricing/style.css
git commit -m "Port llm-pricing chart into a self-contained feature module"
```

---

## Task 3: Page route

**Files:**
- Create: `src/pages/blog/llm-pricing.astro`

**Interfaces:**
- Consumes: `src/features/llm-pricing/main.ts` (Task 2), `VPLayout` (`src/layouts/VPLayout.astro`, props `title`, `hasSidebar`).
- Produces: the route `/blog/llm-pricing/` (per `trailingSlash: 'always'` in `astro.config.ts`) — consumed by Task 4's blog-index card link.

- [ ] **Step 1: Write `src/pages/blog/llm-pricing.astro`**

```astro
---
import VPLayout from '../../layouts/VPLayout.astro';
---

<VPLayout title="LLM Pricing" description="Compare the cost and quality of large language models." hasSidebar={false}>
  <div class="llm-pricing-page-shell">
    <div id="llm-pricing-root">
      <div id="controls">
        <div id="controls-top">
          <div id="controls-left">
            <select id="quality">
              <option value="overall">Overall</option>
              <option value="coding">Coding</option>
              <option value="hard">Hard</option>
            </select>
            <input id="model" placeholder="Filter">
          </div>
          <div id="title-row">
            <div id="title-block">
              <h1 id="brand">LLM Pricing</h1>
              <p id="subtitle">Which LLMs are the best value for money?</p>
            </div>
            <div id="controls-right">
              <button id="info-btn" title="About this chart">?</button>
              <div id="info-popover" hidden>
                <p>The cost of LLMs is steadily falling, and the quality is rising.</p>
                <p>A rough estimate of the <strong>cost of an LLM</strong> is the cost per million tokens of input, mostly from <a href="https://llmpricecheck.com/" target="_blank" rel="noopener noreferrer">LLMPriceCheck</a>. (Typically, inputs are the bigger component of the cost, compared to outputs.)</p>
                <p>A rough estimate of the <strong>quality of an LLM</strong> is the ELO score on the <a href="https://lmarena.ai/" target="_blank" rel="noopener noreferrer">LMSYS Leaderboard</a>. (This is like the chess ELO score, but for LLMs, where people compare 2 LLMs on the same task.)</p>
                <p>Some LLMs are "pareto optimal" — no other LLM is better in both cost and quality. These are shown in 🟢 green and are the best to use.</p>
                <p>Some LLMs are "pareto suboptimal" — no other LLM is worse in both cost and quality. These are shown in 🔴 red and are the ones to avoid.</p>
                <p class="info-meta">Data from <a href="https://lmarena.ai/" target="_blank" rel="noopener noreferrer">LMArena</a>, refreshed from <a href="https://github.com/sanand0/llmpricing" target="_blank" rel="noopener noreferrer">sanand0/llmpricing</a>. Sources: <a href="https://livebench.ai/" target="_blank" rel="noopener noreferrer">LiveBench</a> · <a href="https://artificialanalysis.ai/models" target="_blank" rel="noopener noreferrer">Artificial Analysis models</a></p>
              </div>
            </div>
          </div>
        </div>
        <div id="controls-slider">
          <label id="date-label" for="date">Month</label>
          <input type="range" id="date" min="0" max="100" step="1" value="100">
          <span class="legend">🟢 Best &nbsp; 🔴 Worst</span>
        </div>
      </div>
      <div id="chart-area">
        <div id="llm-cost"></div>
      </div>
    </div>
  </div>

  <div id="scrolly-section"></div>

  <script>
    import '../../features/llm-pricing/main';
  </script>
</VPLayout>

<style>
  /* Same viewport-fill technique as the (currently disabled) map page —
     61px is this site's navbar height. */
  .llm-pricing-page-shell {
    min-height: calc(100vh - 61px);
    height: calc(100dvh - 61px);
    overflow: hidden;
  }

  #llm-pricing-root {
    min-height: 100%;
    height: 100%;
  }
</style>
```

I added one line to the info popover (crediting `sanand0/llmpricing` as the
data source) beyond the source repo's original markup — this directly
serves the "don't lose the link to the original author's repo" requirement
from the design.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Manual verification in the browser**

```bash
pnpm dev
```

Open `http://localhost:4321/blog/llm-pricing/` (adjust port if `pnpm dev`
reports a different one). Expected:
- Chart renders with dots, axis labels, and the eloAnnotations reference lines.
- No console errors.
- Typing in the "Filter" box highlights matching models; dragging the Month
  slider updates the chart; clicking "?" opens the info popover, which
  includes the `sanand0/llmpricing` link.
- Toggling the site's theme (keyboard shortcut `T`, or the nav bar's theme
  toggle) switches the chart's own colors (dot fill, background) between
  light and dark — confirms the `html[data-theme='dark']` override in
  `style.css` is wired correctly.
- The site's nav bar and footer render normally, undisturbed — confirms the
  `#llm-pricing-root` scoping fix (no id collision, no unscoped `*` reset).

Stop the dev server once verified.

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/llm-pricing.astro
git commit -m "Add /blog/llm-pricing/ page"
```

---

## Task 4: Blog index card

**Files:**
- Modify: `src/pages/blog/index.astro`

**Interfaces:**
- Consumes: `/blog/llm-pricing/` route (Task 3), `ContentCard` component (`src/components/ContentCard.astro`, props `href`, `title`, `description`, `icon`).

- [ ] **Step 1: Add a hand-written "Tools" section**

In `src/pages/blog/index.astro`, add a new section immediately after the
`{groupedPosts.map((group) => ( ... ))}` block (still inside
`<div class="vp-content-wrapper">`, before its closing `</div>`):

```astro
    <section class="vp-content-section" data-section="Tools" aria-label="Tools posts">
      <h2 class="vp-content-section-title">Tools</h2>
      <div class="vp-content-grid">
        <ContentCard
          href={`${BASE}blog/llm-pricing/`}
          title="LLM Pricing"
          description="Compare the cost and quality of large language models — an interactive chart, kept in sync with the LMArena leaderboards."
          icon="📊"
        />
      </div>
    </section>
```

This mirrors the markup `ContentCard`/`groupedPosts` already produce, but is
written by hand instead of sourced from the `posts` content collection —
`llm-pricing.astro` is a real Astro page, not a markdown post, so putting a
stub entry into the collection would conflict with `[...slug].astro`'s
`getStaticPaths` (both would try to build `/blog/llm-pricing/`).

The tag-filter script at the bottom of this file selects
`.vp-content-card[data-tags]` — `ContentCard` always renders a
`data-tags` attribute (empty string when no `tags` prop is passed), so
this card behaves correctly under the "All" filter and is simply excluded
whenever a specific tag filter is active (it has none), which is the
correct behavior.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Manual verification**

```bash
pnpm dev
```

Open `http://localhost:4321/blog/`. Expected: a "Tools" section appears
(after the existing "Comparing"/"Articles" sections) with one card, "LLM
Pricing" — clicking it navigates to `/blog/llm-pricing/`. The tag filter
buttons at the top still work for the other sections. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "List the LLM Pricing chart on the blog index"
```

---

## Task 5: Update-tooling shared library

**Files:**
- Create: `scripts/lib/llm-pricing.mjs`

**Interfaces:**
- Produces (all named exports): `normalizeKey(value)`, `OpenRouterMatcher` (class; constructor takes `models: OpenRouterModel[]`, method `match(modelName): OpenRouterModel | null`), `fetchOpenRouterModels()` (async, returns `OpenRouterModel[]`), `readEloRows(path)` (returns `{ headers: string[], rows: EloRow[] }`), `writeRows(path, headers, rows)`, `readUpdates(tsvPath)` (returns `Map<string,string>`), `resolveColumn(columnName, headers)`, `applyUpdates({ headers, rows, targetColumn, updates, matcher, now })` (returns `UpdateSummary`), `printSummary(summary, { column, targetColumn, updateCount, dryRun })`, `monthLabel(now, { monthOffset, approximate })`.
- Consumed by: Task 6 (`scripts/llm-pricing-update-elo.mjs`).

This is a direct port of
`C:\Users\tener\Workspaces\repos\llm-pricing\scripts\update_elo.py`, using
`d3.csvParse`/`d3.csvFormat` (from the `d3` npm dependency already in this
repo) in place of Python's `csv` module, and Node's global `fetch` in place
of `httpx`.

- [ ] **Step 1: Write `scripts/lib/llm-pricing.mjs`**

```js
// Shared CSV + OpenRouter-matching logic for the llm-pricing update tooling.
// Ported from https://github.com/sanand0/llmpricing's scripts/update_elo.py.

import { readFileSync, writeFileSync } from 'node:fs';
import * as d3 from 'd3';

export const COLUMN_ALIASES = {
  text: 'overall',
  overall: 'overall',
  hard: 'hard',
  code: 'coding',
  coding: 'coding',
};

const PAREN_SUFFIX = /\s*\([^)]*\)\s*$/;
const LATEST_SUFFIX = /-latest$/i;
const EFFORT_SUFFIX = /-(?:high|medium|low)$/i;
const REASONING_SUFFIX = /-(?:thinking|reasoning|no-thinking|non-thinking)$/i;
const BETA_SUFFIX = /-beta(?:-\d+|\d+)?$/i;
const RELEASE_SUFFIXES = [
  /-(?:20\d{2}(?:[-.]\d{2}){1,2})$/,
  /-(?:\d{2}(?:[-.]\d{2}){2})$/,
  /-\d{8}$/,
  /-\d{4}$/,
];

const TOKENS_PER_MILLION = 1_000_000;

export class UpdateEloError extends Error {}

export function normalizeKey(value) {
  let normalized = value.toLowerCase();
  normalized = normalized.replace(/[^a-z0-9]+/g, '-');
  normalized = normalized.replace(/-+/g, '-');
  return normalized.replace(/^-+|-+$/g, '');
}

function dropProviderPrefix(value) {
  const providerless = value.includes('/') ? value.split('/').slice(1).join('/') : value;
  return providerless.split(':')[0];
}

function generateLookupKeys(model) {
  const values = new Set([model.modelId, dropProviderPrefix(model.modelId)]);
  if (model.canonicalSlug) {
    values.add(model.canonicalSlug);
    values.add(dropProviderPrefix(model.canonicalSlug));
  }
  return new Set([...values].filter(Boolean).map(normalizeKey));
}

const dropParentheticalSuffix = (value) => value.replace(PAREN_SUFFIX, '').trim();
const dropLatestSuffix = (value) => value.replace(LATEST_SUFFIX, '').replace(/[- ]+$/, '');
const dropEffortSuffix = (value) => value.replace(EFFORT_SUFFIX, '').replace(/[- ]+$/, '');
const dropReasoningSuffix = (value) => value.replace(REASONING_SUFFIX, '').replace(/[- ]+$/, '');
const dropBetaSuffix = (value) => value.replace(BETA_SUFFIX, '').replace(/[- ]+$/, '');
function dropReleaseSuffix(value) {
  let trimmed = value;
  for (const pattern of RELEASE_SUFFIXES) {
    trimmed = trimmed.replace(pattern, '').replace(/[- ]+$/, '');
  }
  return trimmed;
}

const TRANSFORMS = [
  dropParentheticalSuffix,
  dropLatestSuffix,
  dropReasoningSuffix,
  dropEffortSuffix,
  dropBetaSuffix,
  dropReleaseSuffix,
];

export function generateCandidateKeys(modelName) {
  const queue = [modelName.trim()];
  const seenValues = new Set();
  const orderedKeys = [];
  const seenKeys = new Set();

  while (queue.length > 0) {
    const current = queue.shift().trim();
    if (!current || seenValues.has(current)) continue;
    seenValues.add(current);

    const key = normalizeKey(current);
    if (key && !seenKeys.has(key)) {
      orderedKeys.push(key);
      seenKeys.add(key);
    }

    for (const transform of TRANSFORMS) {
      const transformed = transform(current);
      if (transformed && transformed !== current && !seenValues.has(transformed)) {
        queue.push(transformed);
      }
    }
  }

  return orderedKeys;
}

export class OpenRouterMatcher {
  constructor(models) {
    this.lookup = new Map();
    for (const model of models) {
      for (const key of generateLookupKeys(model)) {
        if (!this.lookup.has(key)) this.lookup.set(key, []);
        this.lookup.get(key).push(model);
      }
    }
  }

  match(modelName) {
    for (const key of generateCandidateKeys(modelName)) {
      const match = this._resolveHits(this.lookup.get(key) ?? []);
      if (match) return match;
    }
    return null;
  }

  _resolveHits(hits) {
    const uniqueById = new Map(hits.map((hit) => [hit.modelId, hit]));
    const uniqueHits = [...uniqueById.values()];
    if (uniqueHits.length === 0) return null;
    if (uniqueHits.length === 1) return uniqueHits[0];

    const paidHits = uniqueHits.filter((hit) => !hit.modelId.endsWith(':free'));
    if (paidHits.length === 1) return paidHits[0];
    return null;
  }
}

export function resolveColumn(columnName, headers) {
  const resolved = COLUMN_ALIASES[columnName.toLowerCase()];
  if (!resolved) {
    const options = Object.keys(COLUMN_ALIASES).sort().join(', ');
    throw new UpdateEloError(`Unsupported column ${JSON.stringify(columnName)}. Use one of: ${options}.`);
  }
  if (!headers.includes(resolved)) {
    throw new UpdateEloError(`elo.csv does not have a ${JSON.stringify(resolved)} column.`);
  }
  return resolved;
}

export function readUpdates(tsvPath) {
  const text = readFileSync(tsvPath, 'utf8');
  const lines = text.split(/\r\n|\n/);
  if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
    throw new UpdateEloError(`${tsvPath} is empty.`);
  }

  const updates = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const row = line.split('\t');
    if (row.length < 2) {
      throw new UpdateEloError(`${tsvPath}:${i + 1} must have at least two TSV columns.`);
    }
    const model = row[0].trim();
    const score = row[1].trim();
    if (!model) throw new UpdateEloError(`${tsvPath}:${i + 1} is missing the model name.`);
    if (!score) throw new UpdateEloError(`${tsvPath}:${i + 1} is missing the score value.`);
    if (!Number.isFinite(Number(score))) {
      throw new UpdateEloError(`${tsvPath}:${i + 1} has a non-numeric score ${JSON.stringify(score)}.`);
    }
    updates.set(model, score);
  }

  if (updates.size === 0) throw new UpdateEloError(`${tsvPath} does not contain any data rows.`);
  return updates;
}

export function readEloRows(eloPath) {
  const text = readFileSync(eloPath, 'utf8');
  const parsed = d3.csvParse(text);
  if (!parsed.columns || parsed.columns.length === 0) {
    throw new UpdateEloError(`${eloPath} is missing a header row.`);
  }
  const rows = parsed.map((row) => {
    const normalized = {};
    for (const key of parsed.columns) normalized[key] = row[key] ?? '';
    return normalized;
  });
  return { headers: [...parsed.columns], rows };
}

export function writeRows(eloPath, headers, rows) {
  writeFileSync(eloPath, d3.csvFormat(rows, headers) + '\n', 'utf8');
}

export async function fetchOpenRouterModels() {
  const response = await fetch('https://openrouter.ai/api/v1/models');
  if (!response.ok) {
    throw new UpdateEloError(`OpenRouter models request failed: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.data)) {
    throw new UpdateEloError('OpenRouter returned an unexpected models payload.');
  }

  const models = [];
  for (const item of payload.data) {
    const modelId = item.id;
    const promptPrice = item.pricing?.prompt;
    if (!modelId || promptPrice === undefined || promptPrice === null || promptPrice === '') continue;
    const price = Number(promptPrice);
    if (!Number.isFinite(price)) continue;
    models.push({
      modelId: String(modelId),
      canonicalSlug: String(item.canonical_slug ?? ''),
      promptPrice: price,
      launchLabel: inferOpenRouterLaunchLabel(item.created),
      get sourceUrl() {
        return `https://openrouter.ai/${this.modelId.split(':')[0]}`;
      },
    });
  }
  return models;
}

export function formatDecimal(value) {
  if (Number.isInteger(value)) return String(value);
  // Existing elo.csv cpmi values go to 3-4 decimal places (e.g. 0.7448,
  // 0.435) — Python's Decimal preserves full precision here, so don't
  // round to a fixed 2 places. toFixed(10) also absorbs float noise
  // (e.g. 0.30000000000000004) before the trailing zeros are trimmed.
  return value.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
}

export function monthLabel(now, { monthOffset = 0, approximate = true } = {}) {
  const totalMonths = now.getUTCFullYear() * 12 + now.getUTCMonth() + monthOffset;
  const year = Math.floor(totalMonths / 12);
  const monthIndex = ((totalMonths % 12) + 12) % 12;
  const suffix = approximate ? '?' : '';
  return `${String(year).padStart(4, '0')}-${String(monthIndex + 1).padStart(2, '0')}${suffix}`;
}

function inferOpenRouterLaunchLabel(created) {
  if (created === undefined || created === null || created === '') return null;
  const timestamp = Number(created);
  if (!Number.isFinite(timestamp)) return null;
  const createdAt = new Date(timestamp * 1000);
  if (Number.isNaN(createdAt.getTime())) return null;
  return monthLabel(createdAt, { approximate: false });
}

function parseRankValue(value, context) {
  const stripped = value.trim();
  if (!stripped) return null;
  const parsed = Number(stripped);
  if (!Number.isFinite(parsed)) {
    throw new UpdateEloError(`${context} has a non-numeric value ${JSON.stringify(value)}.`);
  }
  return parsed;
}

function insertRowByScore(rows, newRow, targetColumn) {
  const newScore = parseRankValue(newRow[targetColumn], `new row ${newRow.model} ${targetColumn}`);
  if (newScore === null) {
    rows.push(newRow);
    return;
  }
  for (let i = 0; i < rows.length; i++) {
    const existingScore = parseRankValue(rows[i][targetColumn], `elo.csv row ${rows[i].model} ${targetColumn}`);
    if (existingScore === null || existingScore < newScore) {
      rows.splice(i, 0, newRow);
      return;
    }
  }
  rows.push(newRow);
}

function newRow(headers, modelName) {
  const row = {};
  for (const header of headers) row[header] = '';
  row.model = modelName;
  return row;
}

function updateOpenRouterMetadata(row, modelName, matcher) {
  const needsPricing = !row.cpmi || !row.source;
  const needsLaunch = !row.launch;
  if (!needsPricing && !needsLaunch) {
    return { pricingUpdated: false, launchUpdated: false, missingMatch: false };
  }

  const match = matcher.match(modelName);
  if (!match) {
    return { pricingUpdated: false, launchUpdated: false, missingMatch: true };
  }

  let pricingUpdated = false;
  if (!row.cpmi) {
    const cpmiValue = match.promptPrice * TOKENS_PER_MILLION;
    row.cpmi = cpmiValue <= 0 ? '' : formatDecimal(cpmiValue);
    pricingUpdated = true;
  }
  if (!row.source) {
    row.source = match.sourceUrl;
    pricingUpdated = true;
  }

  let launchUpdated = false;
  if (!row.launch && match.launchLabel) {
    row.launch = match.launchLabel;
    launchUpdated = true;
  }

  return { pricingUpdated, launchUpdated, missingMatch: false };
}

function fillMissingEndDates(rows, presentModels, endLabel) {
  let filled = 0;
  for (const row of rows) {
    if (presentModels.has(row.model) || row.end) continue;
    row.end = endLabel;
    filled += 1;
  }
  return filled;
}

export function applyUpdates({ headers, rows, targetColumn, updates, matcher, now }) {
  const summary = { added: 0, updated: 0, priced: 0, launched: 0, ended: 0, unmatchedOpenrouter: [] };
  const rowsByModel = new Map(rows.map((row) => [row.model, row]));
  const newRows = [];

  for (const [modelName, score] of updates) {
    let row = rowsByModel.get(modelName);
    const isNew = !row;
    if (!row) {
      row = newRow(headers, modelName);
      rowsByModel.set(modelName, row);
      newRows.push(row);
      summary.added += 1;
    } else {
      summary.updated += 1;
    }

    row[targetColumn] = score;

    const metadataUpdate = updateOpenRouterMetadata(row, modelName, matcher);
    if (metadataUpdate.missingMatch) summary.unmatchedOpenrouter.push(modelName);
    if (metadataUpdate.pricingUpdated) summary.priced += 1;
    if (metadataUpdate.launchUpdated) summary.launched += 1;
    if (isNew && !row.launch) row.launch = monthLabel(now, { monthOffset: -1 });
  }

  for (const row of newRows) insertRowByScore(rows, row, targetColumn);

  if (targetColumn === 'overall') {
    summary.ended = fillMissingEndDates(rows, new Set(updates.keys()), monthLabel(now));
  }

  return summary;
}

export function printSummary(summary, { column, targetColumn, updateCount, dryRun }) {
  const displayColumn = column.toLowerCase() === targetColumn ? column : `${column} -> ${targetColumn}`;
  console.log(
    `${dryRun ? 'Dry run:' : 'Updated'} ${summary.updated} existing rows and added ${summary.added} new rows ` +
      `for ${displayColumn} (${updateCount} input models).`
  );
  console.log(`Updated pricing metadata for ${summary.priced} touched models from OpenRouter.`);
  if (summary.launched) console.log(`Updated launch dates for ${summary.launched} touched models from OpenRouter.`);
  if (summary.ended) console.log(`Filled blank end dates for ${summary.ended} rows missing from the overall TSV.`);
  if (summary.unmatchedOpenrouter.length) {
    const preview = summary.unmatchedOpenrouter.slice(0, 10).join(', ');
    const suffix = summary.unmatchedOpenrouter.length > 10 ? ', ...' : '';
    console.log(`No safe OpenRouter match for ${summary.unmatchedOpenrouter.length} touched models: ${preview}${suffix}`);
  }
}
```

- [ ] **Step 2: Sanity-check the key-normalization logic**

The trickiest ported piece is `generateCandidateKeys`/`OpenRouterMatcher` —
verify it behaves like the Python version on a couple of known cases before
building the CLI on top of it:

```bash
node -e "
import('./scripts/lib/llm-pricing.mjs').then(({ generateCandidateKeys, normalizeKey }) => {
  console.log(generateCandidateKeys('GPT-5.4-high (codex-harness)'));
  console.log(normalizeKey('anthropic/claude-opus-4.7'));
});
"
```

Expected: the first line's array starts with the full normalized string
(`gpt-5-4-high-codex-harness`) and, later in the array, includes
`gpt-5-4` (parenthetical, effort, and release suffixes progressively
stripped) — confirming the transform queue explores looser forms. The
second line prints `anthropic-claude-opus-4-7`.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/llm-pricing.mjs
git commit -m "Port llm-pricing's update_elo.py matching logic to Node"
```

---

## Task 6: Update-tooling CLI — `update-elo`

**Files:**
- Create: `scripts/llm-pricing-update-elo.mjs`

**Interfaces:**
- Consumes: everything exported by `scripts/lib/llm-pricing.mjs` (Task 5).
- Produces: `updateElo({ filePath, column, eloPath, dryRun })` (async, named export) — consumed by Task 8's orchestrator. Also runnable directly as a CLI.

- [ ] **Step 1: Write `scripts/llm-pricing-update-elo.mjs`**

```js
#!/usr/bin/env node
// Merges a scraped LMArena leaderboard TSV into src/data/llm-pricing/elo.csv,
// backfilling pricing/launch metadata from OpenRouter where blank.
// Ported from https://github.com/sanand0/llmpricing's scripts/update_elo.py.
//
// Run with:
//   node scripts/llm-pricing-update-elo.mjs <tsv-file> --column overall [--elo path] [--dry-run]

import { resolve } from 'node:path';
import {
  UpdateEloError,
  applyUpdates,
  fetchOpenRouterModels,
  OpenRouterMatcher,
  printSummary,
  readEloRows,
  readUpdates,
  resolveColumn,
  writeRows,
} from './lib/llm-pricing.mjs';

export async function updateElo({ filePath, column, eloPath = 'src/data/llm-pricing/elo.csv', dryRun = false }) {
  const { headers, rows } = readEloRows(eloPath);
  const targetColumn = resolveColumn(column, headers);
  const updates = readUpdates(filePath);
  const matcher = new OpenRouterMatcher(await fetchOpenRouterModels());

  const now = new Date();
  const summary = applyUpdates({ headers, rows, targetColumn, updates, matcher, now });

  if (!dryRun) writeRows(eloPath, headers, rows);

  printSummary(summary, { column, targetColumn, updateCount: updates.size, dryRun });
  return summary;
}

function parseArgs(argv) {
  const positional = [];
  let column = null;
  let eloPath = 'src/data/llm-pricing/elo.csv';
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--column' || arg === '-c') {
      column = argv[++i];
    } else if (arg === '--elo') {
      eloPath = argv[++i];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else {
      positional.push(arg);
    }
  }

  return { filePath: positional[0], column, eloPath, dryRun };
}

async function main() {
  const { filePath, column, eloPath, dryRun } = parseArgs(process.argv.slice(2));
  if (!filePath || !column) {
    console.error('Usage: node scripts/llm-pricing-update-elo.mjs <tsv-file> --column overall|hard|coding [--elo path] [--dry-run]');
    process.exit(2);
  }

  try {
    await updateElo({ filePath: resolve(filePath), column, eloPath: resolve(eloPath), dryRun });
  } catch (error) {
    if (error instanceof UpdateEloError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
```

- [ ] **Step 2: Verify against a hand-made TSV fixture**

```bash
printf 'model\tscore\nclaude-fable-5\t1510\nsome-brand-new-model-xyz\t1300\n' > /tmp/llm-pricing-test.tsv
node scripts/llm-pricing-update-elo.mjs /tmp/llm-pricing-test.tsv --column overall --dry-run
```

Expected output: a line like `Dry run: 1 existing rows and added 1 new
rows for overall (2 input models).`, followed by an OpenRouter pricing
line. `claude-fable-5` already exists in `elo.csv` (updated), `some-brand-new-model-xyz`
does not (added). Because `--dry-run` was passed, confirm `git status
src/data/llm-pricing/elo.csv` shows no changes.

- [ ] **Step 3: Commit**

```bash
git add scripts/llm-pricing-update-elo.mjs
git commit -m "Add llm-pricing-update-elo CLI"
```

---

## Task 7: Update-tooling CLI — `download`

**Files:**
- Create: `scripts/llm-pricing-download.mjs`

**Interfaces:**
- Consumes: the `playwright` npm package (existing devDependency).
- Produces: `downloadLeaderboard({ url, output, cdp, browserMode, executable, timeout })` (async, named export) — consumed by Task 8's orchestrator. Also runnable directly as a CLI, writing a TSV file in the shape `scripts/llm-pricing-update-elo.mjs` expects.

This is a port of
`C:\Users\tener\Workspaces\repos\llm-pricing\download.py`, using
`playwright` (Node) instead of Playwright-Python.

- [ ] **Step 1: Write `scripts/llm-pricing-download.mjs`**

```js
#!/usr/bin/env node
// Scrapes one LMArena leaderboard view into a TSV via Chrome DevTools Protocol
// (or a launched headless Chromium), for scripts/llm-pricing-update-elo.mjs.
// Ported from https://github.com/sanand0/llmpricing's download.py.
//
// Run with:
//   node scripts/llm-pricing-download.mjs <url> <output.tsv> [--browser auto|cdp|launch] [--executable path]

import { existsSync } from 'node:fs';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const EXTRACT_SCRIPT = `
Array.from(document.querySelectorAll("table tr")).map(d => {
  const cells = d.querySelectorAll("td, th");
  const [model, score] = [(cells[2].querySelector("a")?.innerText ?? cells[2].innerText).split(/\\n/)[0], cells[3].innerText.split(/\\s/)[0]];
  return \`\${model}\\t\${score}\`;
}).join("\\n");
`.trim();

function defaultExecutable() {
  const configured = process.env.LLMPRICING_CHROMIUM;
  const candidates = [
    configured,
    process.platform === 'win32' ? `${process.env.LOCALAPPDATA}\\Chromium\\Application\\chrome.exe` : null,
    process.platform === 'win32' ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe` : null,
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export async function downloadLeaderboard({ url, output, cdp = 'http://localhost:9222', browserMode = 'auto', executable = null, timeout = 60_000 }) {
  let browser = null;
  let ownsBrowser = false;

  if (browserMode === 'auto' || browserMode === 'cdp') {
    try {
      browser = await chromium.connectOverCDP(cdp, { timeout });
    } catch (error) {
      if (browserMode === 'cdp') throw error;
    }
  }
  if (!browser) {
    browser = await chromium.launch({ headless: true, executablePath: executable ?? undefined });
    ownsBrowser = true;
  }

  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = await context.newPage();
  let value;
  try {
    console.error(`Opening ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForFunction(
      () => [...document.querySelectorAll('table tr')].some((row) => row.querySelectorAll('td, th').length >= 4),
      { timeout }
    );
    value = await page.evaluate(EXTRACT_SCRIPT);
  } finally {
    await page.close();
    // Only close a browser we launched ourselves — a CDP-connected browser
    // belongs to the user's already-running Chrome and must be left open,
    // exactly like download.py's `if owns_browser: browser.close()`.
    if (ownsBrowser) await browser.close();
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('The leaderboard extraction returned no text.');
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, value.trimEnd() + '\n', 'utf8');
  const { size } = await stat(output);
  return {
    url,
    path: output,
    lines: value.split(/\r\n|\n/).filter((line) => line.trim()).length,
    bytes: size,
  };
}

function parseArgs(argv) {
  const positional = [];
  let cdp = 'http://localhost:9222';
  let browserMode = 'auto';
  let executable = null;
  let timeout = 60_000;
  let format = 'json';
  let describe = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cdp') cdp = argv[++i];
    else if (arg === '--browser') browserMode = argv[++i];
    else if (arg === '--executable') executable = argv[++i];
    else if (arg === '--timeout') timeout = Number(argv[++i]);
    else if (arg === '--format') format = argv[++i];
    else if (arg === '--describe') describe = true;
    else positional.push(arg);
  }

  return { url: positional[0], output: positional[1], cdp, browserMode, executable, timeout, format, describe };
}

function describeContract() {
  console.log(
    JSON.stringify(
      {
        description: 'Download an LMArena leaderboard TSV with Playwright.',
        arguments: { url: 'Leaderboard URL to visit.', output: 'Path to write the TSV export.' },
        options: {
          '--browser': 'Browser mode: auto, cdp, or launch. Default: auto.',
          '--cdp': 'CDP endpoint used by cdp/auto mode. Default: http://localhost:9222',
          '--executable': 'Optional Chrome/Chromium executable for launch mode.',
          '--timeout': 'Navigation and table wait timeout in milliseconds.',
          '--format': 'Use json for structured output or text for a plain summary.',
          '--describe': 'Print this schema and exit.',
        },
        output: { url: 'Visited URL.', path: 'Written TSV path.', lines: 'Number of non-empty output lines.', bytes: 'Number of bytes written.' },
      },
      null,
      2
    )
  );
}

async function main() {
  const { url, output, cdp, browserMode, executable, timeout, format, describe } = parseArgs(process.argv.slice(2));

  if (describe) {
    describeContract();
    return;
  }
  if (!url || !output) {
    console.error('Error: URL and output path are required unless --describe is used.');
    process.exit(2);
  }
  if (!['json', 'text'].includes(format)) {
    console.error('Error: --format must be json or text.');
    process.exit(2);
  }
  if (!['auto', 'cdp', 'launch'].includes(browserMode)) {
    console.error('Error: --browser must be auto, cdp, or launch.');
    process.exit(2);
  }
  if (executable && !existsSync(executable)) {
    console.error(`Error: executable does not exist: ${executable}`);
    process.exit(2);
  }

  const resolvedExecutable = executable ?? defaultExecutable();

  let summary;
  try {
    summary = await downloadLeaderboard({ url, output: resolve(output), cdp, browserMode, executable: resolvedExecutable, timeout });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  if (format === 'json' || !process.stdout.isTTY) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Wrote ${summary.lines} lines to ${summary.path}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
```

- [ ] **Step 2: Add `playwright` chromium if not already installed**

```bash
pnpm exec playwright install chromium
```

Expected: either confirms Chromium is already installed, or downloads it.

- [ ] **Step 3: Verify against a live leaderboard page**

```bash
node scripts/llm-pricing-download.mjs https://lmarena.ai/leaderboard/text /tmp/llm-pricing-overall.tsv --browser launch
```

Expected: JSON output with `"lines"` > 0 and a `"path"` pointing at
`/tmp/llm-pricing-overall.tsv`; opening that file shows tab-separated
`model<TAB>score` lines. If this environment has no network access to
`lmarena.ai`, note that in the task and move on — Task 8's orchestrator
still needs to exist and this script's shape is independently correct
(same CLI contract as `download.py`, verified by `--describe`):

```bash
node scripts/llm-pricing-download.mjs --describe
```

Expected: the JSON contract printed above.

- [ ] **Step 4: Commit**

```bash
git add scripts/llm-pricing-download.mjs
git commit -m "Add llm-pricing-download CLI (Node/Playwright port of download.py)"
```

---

## Task 8: Orchestrator and docs

**Files:**
- Create: `scripts/llm-pricing-update.mjs`
- Modify: `scripts/README.md`

**Interfaces:**
- Consumes: `downloadLeaderboard` (Task 7), `updateElo` (Task 6).

- [ ] **Step 1: Write `scripts/llm-pricing-update.mjs`**

```js
#!/usr/bin/env node
// Refreshes src/data/llm-pricing/elo.csv from all three LMArena leaderboard
// views. Node port of https://github.com/sanand0/llmpricing's update.sh.
//
// Run with: node scripts/llm-pricing-update.mjs
// Optional: LLMPRICING_CHROMIUM=/path/to/chrome node scripts/llm-pricing-update.mjs

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadLeaderboard } from './llm-pricing-download.mjs';
import { updateElo } from './llm-pricing-update-elo.mjs';

const VIEWS = [
  { url: 'https://lmarena.ai/leaderboard/text', column: 'overall' },
  { url: 'https://lmarena.ai/leaderboard/text/hard-prompts', column: 'hard' },
  { url: 'https://lmarena.ai/leaderboard/text/coding', column: 'coding' },
];

const tmpDir = mkdtempSync(join(tmpdir(), 'llm-pricing-'));
try {
  for (const { url, column } of VIEWS) {
    const output = join(tmpDir, `${column}.tsv`);
    console.log(`Downloading ${column} leaderboard from ${url}`);
    await downloadLeaderboard({
      url,
      output,
      browserMode: 'auto',
      executable: process.env.LLMPRICING_CHROMIUM || null,
    });

    console.log(`Updating elo.csv column ${column}`);
    await updateElo({ filePath: output, column, eloPath: 'src/data/llm-pricing/elo.csv' });
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
```

- [ ] **Step 2: Document it in `scripts/README.md`**

Add a new section (after the existing content, following the same style as
the rest of the file):

```markdown
## Refresh the LLM Pricing chart data

```bash
node scripts/llm-pricing-update.mjs
```

**What it does:**
1. Scrapes the Overall, Hard, and Coding LMArena leaderboards
   (`https://lmarena.ai/leaderboard/text*`) via Chrome DevTools Protocol
   (or a launched headless Chromium if no CDP browser is available on
   `localhost:9222`).
2. Merges each into `src/data/llm-pricing/elo.csv`, backfilling
   `cpmi`/`launch`/`source` from OpenRouter's public models API when blank.

Set `LLMPRICING_CHROMIUM` to a Chrome/Chromium executable path if Playwright
can't find one automatically. To update a single leaderboard view instead of
all three:

```bash
node scripts/llm-pricing-download.mjs https://lmarena.ai/leaderboard/text /tmp/overall.tsv
node scripts/llm-pricing-update-elo.mjs /tmp/overall.tsv --column overall
```

This is a Node port of the update tooling from
[sanand0/llmpricing](https://github.com/sanand0/llmpricing) (specifically
`download.py` and `scripts/update_elo.py`), the original source for this
chart's data. See also
[david7ce/llm-pricing](https://github.com/david7ce/llm-pricing), a fork that
runs the same refresh independently.
```

- [ ] **Step 3: Verify the orchestrator's shape**

```bash
node --check scripts/llm-pricing-update.mjs
```

Expected: no output (syntax is valid). A full live run depends on network
access to `lmarena.ai`, already exercised piecewise in Tasks 6 and 7 — this
step confirms the orchestrator itself is wired correctly (imports resolve,
no syntax errors) without needing three more live scrapes.

- [ ] **Step 4: Commit**

```bash
git add scripts/llm-pricing-update.mjs scripts/README.md
git commit -m "Add llm-pricing-update orchestrator and document the refresh workflow"
```

---

## Task 9: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full typecheck**

Run: `pnpm typecheck`
Expected: exits 0.

- [ ] **Step 2: Full build**

Run: `pnpm build`
Expected: exits 0, `dist/blog/llm-pricing/index.html` exists.

- [ ] **Step 3: Preview the static build**

```bash
pnpm preview
```

Open the printed local URL, navigate to `/blog/` then to the "LLM Pricing"
card, confirm the chart renders identically to the `pnpm dev` check in Task
3. Confirm `/blog/llm-pricing/` also loads directly (not just via the
in-app link) — this exercises the static route Astro actually generated,
not just dev-server routing. Stop the preview server.

- [ ] **Step 4: Commit (if anything changed during verification)**

```bash
git status --short
```

If clean, no commit needed — Task 9 is verification-only. If any fix was
required, commit it with a message describing what broke and why.
