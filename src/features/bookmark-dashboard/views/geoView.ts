import * as d3 from 'd3';
import type { BookmarkRecord, VizNode } from '../types/bookmarks';
import { clamp, parentColor, stableHash, seededRng, zoomState } from '../shared';

// ─── Geo types ────────────────────────────────────────────────────────────────

type GeoNode = {
  id: string;
  name: string;
  depth: number;          // 1=island, 2=category, 3=subcategory, 4=link
  islandName: string;
  categoryName: string;
  subCatName: string;
  x: number;
  y: number;
  r: number;
  weight: number;
  record?: BookmarkRecord;
  children?: GeoNode[];
};

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildGeoTree(records: BookmarkRecord[]): GeoNode[] {
  const islandMap = new Map<string, Map<string, Map<string, BookmarkRecord[]>>>();
  for (const record of records) {
    const island   = record.folderPath[0] ?? 'Uncategorized';
    const category = record.folderPath[1] ?? 'General';
    const subcat   = record.folderPath[2] ?? category;
    if (!islandMap.has(island)) islandMap.set(island, new Map());
    const catMap = islandMap.get(island)!;
    if (!catMap.has(category)) catMap.set(category, new Map());
    const subcatMap = catMap.get(category)!;
    if (!subcatMap.has(subcat)) subcatMap.set(subcat, []);
    subcatMap.get(subcat)!.push(record);
  }

  const islands: GeoNode[] = [];
  for (const [islandName, catMap] of islandMap) {
    const categories: GeoNode[] = [];
    for (const [catName, subcatMap] of catMap) {
      const subcats: GeoNode[] = [];
      for (const [subcatName, recs] of subcatMap) {
        const links: GeoNode[] = recs.map(r => ({
          id: `geo/link/${r.id}`, name: r.title, depth: 4,
          islandName, categoryName: catName, subCatName: subcatName,
          x: 0, y: 0, r: r.isFavorite ? 5.5 : 4, weight: 1, record: r,
        }));
        subcats.push({
          id: `geo/subcat/${islandName}/${catName}/${subcatName}`,
          name: subcatName, depth: 3,
          islandName, categoryName: catName, subCatName: subcatName,
          x: 0, y: 0, r: 0, weight: recs.length, children: links,
        });
      }
      const catWeight = subcats.reduce((s, sc) => s + sc.weight, 0);
      categories.push({
        id: `geo/cat/${islandName}/${catName}`, name: catName, depth: 2,
        islandName, categoryName: catName, subCatName: '',
        x: 0, y: 0, r: 0, weight: catWeight, children: subcats,
      });
    }
    const islandWeight = categories.reduce((s, c) => s + c.weight, 0);
    islands.push({
      id: `geo/island/${islandName}`, name: islandName, depth: 1,
      islandName, categoryName: '', subCatName: '',
      x: 0, y: 0, r: 0, weight: islandWeight, children: categories,
    });
  }
  return islands;
}

// ─── Island polygon helpers ───────────────────────────────────────────────────

function islandPolyPts(cx: number, cy: number, r: number, seedName: string): [number, number][] {
  const seed = stableHash(seedName);
  const N = 72;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const t = (Math.PI * 2 * i) / N;
    const perturb =
      1 + 0.08 * Math.sin(3 * t + (seed % 100) * 0.063)
        + 0.05 * Math.cos(5 * t + ((seed >> 4) % 100) * 0.063)
        + 0.035 * Math.sin(7 * t + ((seed >> 8) % 100) * 0.063);
    pts.push([cx + Math.cos(t) * r * perturb, cy + Math.sin(t) * r * perturb]);
  }
  return pts;
}

function geoIslandPath(cx: number, cy: number, r: number, seedName: string): string {
  const pts = islandPolyPts(cx, cy, r, seedName);
  const line = d3.line<[number, number]>().x(p => p[0]).y(p => p[1]).curve(d3.curveCatmullRomClosed);
  return line(pts) ?? '';
}

// ─── Geometry utilities ───────────────────────────────────────────────────────

function ptInPoly(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polyCentroid(pts: [number, number][]): [number, number] {
  let ax = 0, ay = 0, area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const cross = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
    ax += (pts[j][0] + pts[i][0]) * cross;
    ay += (pts[j][1] + pts[i][1]) * cross;
    area += cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-6) {
    return [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ];
  }
  return [ax / (6 * area), ay / (6 * area)];
}

function polyBbox(pts: [number, number][]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

// ─── Lloyd relaxation ─────────────────────────────────────────────────────────

function lloydRelax(
  seeds: [number, number][],
  bbox: [number, number, number, number],
  iterations: number,
): [number, number][] {
  let pts: [number, number][] = seeds.map(s => [s[0], s[1]]);
  for (let iter = 0; iter < iterations; iter++) {
    if (pts.length < 2) break;
    const del = d3.Delaunay.from(pts, p => p[0], p => p[1]);
    const vor = del.voronoi(bbox);
    pts = pts.map((old, i) => {
      const cell = vor.cellPolygon(i) as [number, number][] | null;
      return cell ? polyCentroid(cell) : old;
    });
  }
  return pts;
}

// ─── Organic border ───────────────────────────────────────────────────────────

function organicBorderPath(va: [number, number], vb: [number, number], hashSeed: number): string {
  const rng = seededRng(hashSeed);
  const dx = vb[0] - va[0], dy = vb[1] - va[1];
  const len = Math.hypot(dx, dy);
  if (len < 2) return '';
  const px = -dy / len, py = dx / len;
  const N = Math.max(5, Math.ceil(len / 9));
  const amp = len * 0.062;
  const freq = 0.8 + rng() * 0.7;
  const phase = rng() * Math.PI * 2;
  const pts: [number, number][] = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const falloff = Math.sin(t * Math.PI);
    const noise = amp * falloff * Math.sin(freq * k * (Math.PI / (N * 0.5)) + phase);
    pts.push([va[0] + dx * t + px * noise, va[1] + dy * t + py * noise]);
  }
  const line = d3.line<[number, number]>().x(p => p[0]).y(p => p[1]).curve(d3.curveCatmullRom.alpha(0.5));
  return line(pts) ?? '';
}

// ─── Find shared Voronoi edge ─────────────────────────────────────────────────

function findSharedVoronoiEdge(
  cellI: [number, number][],
  cellJ: [number, number][],
): [[number, number], [number, number]] | null {
  const EPS = 1.5;
  const shared: [number, number][] = [];
  for (const vi of cellI) {
    for (const vj of cellJ) {
      if (Math.hypot(vi[0] - vj[0], vi[1] - vj[1]) < EPS) {
        if (!shared.some(s => Math.hypot(s[0] - vi[0], s[1] - vi[1]) < EPS)) shared.push(vi);
        if (shared.length === 2) return [shared[0], shared[1]];
      }
    }
  }
  return shared.length >= 2 ? [shared[0], shared[1]] : null;
}

// ─── Zoom helper ──────────────────────────────────────────────────────────────

function geoZoomToTarget(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  drawW: number, drawH: number,
  cx: number, cy: number, r: number,
): void {
  if (!zoomState.behavior) return;
  const scale = clamp(0.85 * Math.min(drawW, drawH) / Math.max(20, r * 2.6), 0.4, 18);
  const tx    = drawW / 2 - cx * scale;
  const ty    = drawH / 2 - cy * scale;
  const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
  zoomState.transform = transform;
  zoomState.viewTransforms.geo = transform;
  svg.transition().duration(400).call(zoomState.behavior.transform, transform);
}

// ─── renderGeo ────────────────────────────────────────────────────────────────

export function renderGeo(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  records: BookmarkRecord[],
  onLinkClick: (node: VizNode) => void,
): void {
  const mapPanel = document.querySelector<HTMLElement>('.map-panel')!;
  const width  = Math.max(mapPanel.clientWidth,  520);
  const height = Math.max(mapPanel.clientHeight, 420);
  const margin = 0;
  const drawW  = width  - margin * 2;
  const drawH  = height - margin * 2;
  svg.attr('viewBox', `0 0 ${width} ${height}`);

  svg.append('rect').attr('width', width).attr('height', height)
    .attr('fill', 'var(--map-ocean, #04121e)').attr('class', 'geo-ocean');

  const defs       = svg.append('defs');
  const scene      = svg.append('g').attr('class', 'scene geo-scene');
  const labelLayer = svg.append('g').attr('class', 'geo-labels').style('pointer-events', 'none');

  const islands = buildGeoTree(records);

  const nIsl = islands.length;
  // Precompute radii first so the belt distance can scale with them: adjacent islands
  // must sit further apart than their combined radius regardless of viewport size.
  islands.forEach((isl) => { isl.r = clamp(100 + Math.sqrt(isl.weight) * 6, 110, 240); });
  const ISLAND_GAP = 80;
  const maxR = islands.reduce((m, isl) => Math.max(m, isl.r), 0);
  // Chord length needed between two adjacent islands on the belt = 2R + gap.
  // For N islands evenly placed, chord = 2·belt·sin(π/N), so belt = chord / (2·sin(π/N)).
  const minBeltFromIslands = nIsl > 1
    ? (2 * maxR + ISLAND_GAP) / (2 * Math.sin(Math.PI / nIsl))
    : 0;
  const screenBelt = Math.min(drawW, drawH) * 0.34;
  const belt = Math.max(screenBelt, minBeltFromIslands);
  islands.forEach((isl, ii) => {
    const angle = nIsl > 1 ? (Math.PI * 2 * ii) / nIsl - Math.PI / 2 : 0;
    isl.x = drawW / 2 + (nIsl > 1 ? Math.cos(angle) * belt : 0);
    isl.y = drawH / 2 + (nIsl > 1 ? Math.sin(angle) * belt : 0);
  });

  const allCategories: GeoNode[] = [];
  const allSubcats:    GeoNode[] = [];
  const allLinks:      GeoNode[] = [];

  for (const island of islands) {
    const categories = island.children ?? [];
    if (categories.length === 0) continue;
    const allIslandSubcats = categories.flatMap(c => c.children ?? []);
    if (allIslandSubcats.length === 0) continue;

    const islandPts = islandPolyPts(island.x, island.y, island.r, island.name);
    const bbox      = polyBbox(islandPts);
    const baseColor = d3.hsl(parentColor(island.name));
    const catHueStep = 360 / Math.max(categories.length, 1);

    const sqrtWts   = allIslandSubcats.map(sc => Math.max(1, Math.sqrt(sc.weight)));
    const totalSqrt = sqrtWts.reduce((a, b) => a + b, 0);
    const TOTAL_SEEDS = clamp(allIslandSubcats.length * 4, 12, 80);
    const seedCounts  = sqrtWts.map(w => Math.max(1, Math.round(w / totalSqrt * TOTAL_SEEDS)));

    const rng = seededRng(stableHash(island.name));
    const initialSeeds: [number, number][] = [];
    const seedToCat:    number[] = [];
    const seedToSubcat: number[] = [];

    let catIdx    = 0;
    let globalSci = 0;
    for (const cat of categories) {
      const subcats  = cat.children ?? [];
      const nSubcats = subcats.length;
      for (let sci = 0; sci < nSubcats; sci++) {
        const n = seedCounts[globalSci];
        const catAngle  = (Math.PI * 2 * catIdx) / Math.max(categories.length, 1);
        const subAngOff = nSubcats > 1 ? ((sci - (nSubcats - 1) / 2) / nSubcats) * 0.4 : 0;
        const angle  = catAngle + subAngOff;
        const biasR  = island.r * 0.38;
        const biasX  = island.x + Math.cos(angle) * biasR;
        const biasY  = island.y + Math.sin(angle) * biasR;
        for (let k = 0; k < n; k++) {
          let sx = biasX, sy = biasY, tries = 0;
          do {
            sx = biasX + (rng() - 0.5) * island.r * 0.8;
            sy = biasY + (rng() - 0.5) * island.r * 0.8;
            tries++;
          } while (!ptInPoly(sx, sy, islandPts) && tries < 80);
          if (tries >= 80) { sx = island.x; sy = island.y; }
          initialSeeds.push([sx, sy]);
          seedToCat.push(catIdx);
          seedToSubcat.push(globalSci);
        }
        globalSci++;
      }
      catIdx++;
    }

    const relaxed    = lloydRelax(initialSeeds, bbox, 3);
    const finalSeeds: [number, number][] = relaxed.map((s, i) =>
      ptInPoly(s[0], s[1], islandPts) ? s : initialSeeds[i],
    );

    const del = d3.Delaunay.from(finalSeeds, p => p[0], p => p[1]);
    const vor = del.voronoi(bbox);

    const catPts    = categories.map(() => [] as [number, number][]);
    const subcatPts = allIslandSubcats.map(() => [] as [number, number][]);
    for (let si = 0; si < finalSeeds.length; si++) {
      const cell = vor.cellPolygon(si) as [number, number][] | null;
      if (!cell) continue;
      catPts[seedToCat[si]].push(...cell);
      subcatPts[seedToSubcat[si]].push(...cell);
    }

    catIdx = 0;
    for (const cat of categories) {
      const pts = catPts[catIdx];
      cat.x = pts.length > 0 ? pts.reduce((s, p) => s + p[0], 0) / pts.length : island.x;
      cat.y = pts.length > 0 ? pts.reduce((s, p) => s + p[1], 0) / pts.length : island.y;
      cat.r = clamp(Math.sqrt(cat.weight) * 9, 26, island.r * 0.7);
      catIdx++;
    }

    let sci2 = 0;
    for (const cat of categories) {
      for (const subcat of (cat.children ?? [])) {
        const pts = subcatPts[sci2];
        subcat.x = pts.length > 0 ? pts.reduce((s, p) => s + p[0], 0) / pts.length : cat.x;
        subcat.y = pts.length > 0 ? pts.reduce((s, p) => s + p[1], 0) / pts.length : cat.y;
        subcat.r = clamp(Math.sqrt(subcat.weight) * 6, 18, island.r * 0.45);
        sci2++;
      }
    }

    // Seed every link near its subcategory centroid, then run a per-island d3-force
    // simulation so they spread without overlapping. Each link is anchored to its
    // subcategory via positional forces; collision keeps them apart; a tick callback
    // clamps escapees back inside the island polygon.
    const islandLinks: GeoNode[] = [];
    sci2 = 0;
    for (const cat of categories) {
      for (const subcat of (cat.children ?? [])) {
        const links = subcat.children ?? [];
        const rngL = seededRng(stableHash(subcat.id));
        links.forEach((link) => {
          link.x = subcat.x + (rngL() - 0.5) * Math.max(subcat.r, 12);
          link.y = subcat.y + (rngL() - 0.5) * Math.max(subcat.r, 12);
        });
        islandLinks.push(...links);
        sci2++;
      }
    }

    // Convex hull of each subcategory's Voronoi cells = its "zone". Links must live
     // inside their own zone — no spilling into a neighbouring subcategory's territory.
    const subcatHulls = new Map<string, [number, number][]>();
    allIslandSubcats.forEach((sc, gSci) => {
      const pts = subcatPts[gSci];
      if (pts.length < 3) return;
      const hull = d3.polygonHull(pts);
      if (hull) subcatHulls.set(sc.id, hull);
    });

    if (islandLinks.length > 0) {
      const subcatById = new Map(allIslandSubcats.map(sc => [sc.id, sc]));
      const subcatIdFor = (l: GeoNode) =>
        `geo/subcat/${island.name}/${l.categoryName}/${l.subCatName}`;
      const subcatFor = (l: GeoNode) => subcatById.get(subcatIdFor(l));

      // After every tick, snap any link that escaped its subcategory zone back toward
      // the subcat centroid. Strong pull (t=0.55) so escapees converge fast.
      const enforceZones = () => {
        for (const link of islandLinks) {
          const hull = subcatHulls.get(subcatIdFor(link));
          if (!hull) continue;
          if (!ptInPoly(link.x, link.y, hull)) {
            const sc = subcatFor(link);
            const cx = sc?.x ?? island.x;
            const cy = sc?.y ?? island.y;
            const t = 0.55;
            link.x = link.x * (1 - t) + cx * t;
            link.y = link.y * (1 - t) + cy * t;
          }
        }
      };

      const sim = d3.forceSimulation<GeoNode>(islandLinks)
        .force('x', d3.forceX<GeoNode>(l => subcatFor(l)?.x ?? island.x).strength(0.22))
        .force('y', d3.forceY<GeoNode>(l => subcatFor(l)?.y ?? island.y).strength(0.22))
        // Padding (+2.4) is the visual gap so the small disc + label area don't kiss.
        .force('collide', d3.forceCollide<GeoNode>(l => l.r + 2.4).iterations(2))
        .on('tick', enforceZones)
        .stop();
      const iterations = Math.min(120, Math.ceil(Math.log(islandLinks.length + 10) * 25));
      for (let k = 0; k < iterations; k++) sim.tick();
      enforceZones();
      // Final island-poly clamp in case any survived the per-zone snap.
      for (const link of islandLinks) {
        if (!ptInPoly(link.x, link.y, islandPts)) {
          const sc = subcatFor(link);
          if (sc) { link.x = sc.x; link.y = sc.y; }
        }
      }
    }
    allLinks.push(...islandLinks);

    allCategories.push(...categories);
    allSubcats.push(...allIslandSubcats);

    // ── Render island ──────────────────────────────────────────────────────
    const clipId  = `geo-clip-${island.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const blobPth = geoIslandPath(island.x, island.y, island.r, island.name);

    defs.append('clipPath').attr('id', clipId).append('path').attr('d', blobPth);

    const islandG = scene.append('g')
      .attr('class', 'node geo-island')
      .attr('clip-path', `url(#${clipId})`);

    islandG.append('path').attr('d', blobPth)
      .attr('fill', `hsl(${baseColor.h.toFixed(1)}, ${clamp(baseColor.s * 100, 18, 55).toFixed(1)}%, ${clamp(baseColor.l * 100 - 6, 8, 26).toFixed(1)}%)`)
      .attr('class', 'geo-island-base');

    const cellGroup = islandG.append('g').attr('class', 'geo-territories');
    const line2d    = d3.line<[number, number]>().x(p => p[0]).y(p => p[1]);

    for (let si = 0; si < finalSeeds.length; si++) {
      const cell = vor.cellPolygon(si) as [number, number][] | null;
      if (!cell) continue;
      const ci    = seedToCat[si];
      const gSci  = seedToSubcat[si];
      const scName = (allIslandSubcats[gSci] as GeoNode | undefined)?.name ?? String(gSci);
      // Per-subcategory color: small hue shift within the parent category's hue band
      // plus a larger lightness spread so neighbouring subcategories read as distinct.
      const scHash    = stableHash(scName);
      const subHueShift = ((scHash % 31) - 15) * 0.35;   // ±5° within the category hue
      const h     = (baseColor.h + ci * catHueStep + subHueShift + 360) % 360;
      const sat   = clamp(baseColor.s * 100 + 6 + ((scHash >> 5) % 12), 26, 76);
      const lV    = (scHash % 22) - 6;                    // [-6, +15]
      const l     = clamp(baseColor.l * 100 + 22 + lV, 22, 62);
      const cat   = categories[ci] as GeoNode | undefined;
      if (!cat) continue;
      cellGroup.append('path')
        .attr('d', (line2d([...cell] as [number, number][]) ?? '') + 'Z')
        .attr('fill', `hsl(${h.toFixed(1)}, ${sat.toFixed(1)}%, ${l.toFixed(1)}%)`)
        .attr('stroke', 'none')
        .attr('class', 'geo-territory node')
        .on('click', () => { geoZoomToTarget(svg, drawW, drawH, cat.x, cat.y, cat.r); });
    }

    const borderGroup = islandG.append('g').attr('class', 'geo-borders').style('pointer-events', 'none');
    const drawnPairs  = new Set<string>();

    for (let si = 0; si < finalSeeds.length; si++) {
      for (const sj of del.neighbors(si)) {
        if (sj <= si || seedToSubcat[si] === seedToSubcat[sj]) continue;
        const key = `${si}-${sj}`;
        if (drawnPairs.has(key)) continue;
        drawnPairs.add(key);

        const cellI = vor.cellPolygon(si) as [number, number][] | null;
        const cellJ = vor.cellPolygon(sj) as [number, number][] | null;
        if (!cellI || !cellJ) continue;

        const edge = findSharedVoronoiEdge(cellI, cellJ);
        if (!edge) continue;

        const bd = organicBorderPath(edge[0], edge[1], stableHash(`${si}-${sj}`));
        if (!bd) continue;

        // Three-layer border: light halo (outside glow), thick dark line (the
        // perimeter), and a faint inner highlight to give the edge a crisp pop.
        if (seedToCat[si] !== seedToCat[sj]) {
          // Country-level border: between different categories.
          borderGroup.append('path').attr('d', bd).attr('fill', 'none')
            .attr('stroke', 'rgba(255,255,255,0.28)').attr('stroke-width', 7)
            .attr('filter', 'blur(2.2px)');
          borderGroup.append('path').attr('d', bd).attr('fill', 'none')
            .attr('stroke', 'rgba(0,0,0,0.85)').attr('stroke-width', 3.4)
            .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
          borderGroup.append('path').attr('d', bd).attr('fill', 'none')
            .attr('stroke', 'rgba(255,255,255,0.30)').attr('stroke-width', 0.9);
        } else {
          // Province-level border: between sibling subcategories under the same category.
          borderGroup.append('path').attr('d', bd).attr('fill', 'none')
            .attr('stroke', 'rgba(255,255,255,0.18)').attr('stroke-width', 3.2)
            .attr('filter', 'blur(1.4px)');
          borderGroup.append('path').attr('d', bd).attr('fill', 'none')
            .attr('stroke', 'rgba(0,0,0,0.65)').attr('stroke-width', 1.6)
            .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
        }
      }
    }

    scene.append('path')
      .attr('d', geoIslandPath(island.x, island.y, island.r + 6, island.name))
      .attr('fill', 'none')
      .attr('stroke', `hsla(${baseColor.h.toFixed(1)}, 68%, 68%, 0.22)`)
      .attr('stroke-width', 10).attr('filter', 'blur(4px)').style('pointer-events', 'none');

    scene.append('path').attr('d', blobPth).attr('fill', 'none')
      .attr('stroke', `hsla(${baseColor.h.toFixed(1)}, ${clamp(baseColor.s * 100 + 10, 38, 90).toFixed(1)}%, ${clamp(baseColor.l * 100 + 20, 32, 70).toFixed(1)}%, 0.85)`)
      .attr('stroke-width', 2).style('pointer-events', 'none');
  }

  const linkGroup = scene.append('g').attr('class', 'geo-links');
  const linkSel   = linkGroup
    .selectAll<SVGCircleElement, GeoNode>('circle.geo-link')
    .data(allLinks).join('circle')
    .attr('class', 'node geo-link')
    .attr('cx', l => l.x).attr('cy', l => l.y).attr('r', l => l.r)
    .attr('fill', l => {
      if (l.record?.isFavorite) return 'rgba(255,204,80,0.95)';
      const base = d3.hsl(parentColor(l.islandName));
      return `hsla(${base.h}, ${clamp(base.s * 100 + 12, 36, 90).toFixed(1)}%, ${clamp(base.l * 100 + 34, 58, 84).toFixed(1)}%, 0.92)`;
    })
    .attr('stroke', 'rgba(4,16,28,0.55)')
    // non-scaling-stroke + an explicit stroke-width that we recompute on zoom keeps
    // the border proportional to the visible circle (≈15% of visual radius).
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('stroke-width', l => Math.max(0.6, l.r * 0.18))
    .on('click', (_, node) => {
      if (node.record) {
        onLinkClick({ id: node.id, name: node.name, type: 'bookmark', record: node.record });
      }
    });

  const islandLabels = labelLayer
    .selectAll<SVGTextElement, GeoNode>('text.geo-island-label').data(islands).join('text')
    .attr('class', 'geo-island-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('fill', 'var(--map-label-1)').attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)').attr('stroke-width', 3.5)
    .style('font-size', '14px').style('font-weight', '700').text(n => n.name);

  const catLabels = labelLayer
    .selectAll<SVGTextElement, GeoNode>('text.geo-cat-label').data(allCategories).join('text')
    .attr('class', 'geo-cat-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('fill', 'var(--map-label-2)').attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)').attr('stroke-width', 3.2)
    .style('font-size', '12px').style('font-weight', '600').text(n => n.name);

  const subcatLabels = labelLayer
    .selectAll<SVGTextElement, GeoNode>('text.geo-subcat-label').data(allSubcats).join('text')
    .attr('class', 'geo-subcat-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('fill', 'var(--map-label-3)').attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)').attr('stroke-width', 2.8)
    .style('font-size', '10px').text(n => n.name);

  // Link labels render BELOW the dot — map-of-github style. `hanging` baseline pins
  // the top of the text glyph to y so the gap stays constant regardless of font.
  const linkLabels = labelLayer
    .selectAll<SVGTextElement, GeoNode>('text.geo-link-label').data(allLinks).join('text')
    .attr('class', 'geo-link-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'hanging')
    .attr('fill', 'var(--map-label-link)').attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)').attr('stroke-width', 2.4)
    .style('font-size', '8px').text(n => n.name);

  function applyTransform(): void {
    scene.attr('transform', `translate(${margin},${margin}) ${zoomState.transform.toString()}`);
  }

  // Smooth opacity interpolation across zoom bands. `fadeIn..fadeFull` ramps 0→1;
  // `holdEnd..fadeOut` ramps 1→0. Outside the [fadeIn, fadeOut] window the label
  // is hidden via display=none so it doesn't hit-test or get painted.
  function bandOpacity(k: number, fadeIn: number, fadeFull: number, holdEnd: number, fadeOut: number): number {
    if (k <= fadeIn || k >= fadeOut) return 0;
    if (k < fadeFull) return (k - fadeIn) / (fadeFull - fadeIn);
    if (k <= holdEnd) return 1;
    return 1 - (k - holdEnd) / (fadeOut - holdEnd);
  }

  // Bands chosen so neighbouring levels cross-fade for ~0.4 zoom units instead of
  // popping in/out. Original boundaries: 1.6, 3.2, 5.2.
  function levelBands(k: number) {
    return {
      island:  bandOpacity(k, 0,    0,    1.4,  1.8),
      cat:     bandOpacity(k, 1.4,  1.8,  3.0,  3.4),
      subcat:  bandOpacity(k, 3.0,  3.4,  5.0,  5.4),
      link:    bandOpacity(k, 5.0,  5.4,  Infinity, Infinity),
      // Territory + border fade in slightly later than islands, never out.
      territory: bandOpacity(k, 0.5, 0.8, Infinity, Infinity),
    };
  }

  function placeLabel(this: SVGTextElement, node: GeoNode, opacity: number, yOffset = 0): void {
    const el = d3.select(this);
    if (opacity <= 0.001) { el.attr('display', 'none'); return; }
    el.attr('display', null).style('opacity', opacity)
      .attr('x', margin + zoomState.transform.applyX(node.x))
      .attr('y', margin + zoomState.transform.applyY(node.y) + yOffset);
  }

  // Visual size caps so dots and labels don't balloon at high zoom.
  const LINK_MAX_VISUAL_R = 7;        // px, normal link
  const LINK_FAV_MAX_VISUAL_R = 9;    // px, favourites get a slight bump
  // Font grows 5% per zoom unit above 1, capped at +50% of baseline.
  const fontScale = (k: number) => Math.min(1 + Math.max(0, k - 1) * 0.05, 1.5);
  // Visual radius an SVG circle ends up displaying at zoom k = (attr.r * k).
  // We invert it so the displayed size is capped: r_attr = min(baseR * k, maxR) / k.
  const visualR = (baseR: number, maxR: number, k: number) => Math.min(baseR * k, maxR);

  function updateVisibility(k: number): void {
    const b = levelBands(k);
    scene.selectAll<SVGGElement, unknown>('.geo-territories').style('opacity', b.territory);
    scene.selectAll<SVGGElement, unknown>('.geo-borders').style('opacity', b.territory);

    // Counter-scale link dots so they stop growing once they hit the cap, and keep
    // the border proportional to the visible disc (non-scaling-stroke = stroke-width
    // is in screen px, independent of the scene zoom).
    linkSel
      .style('opacity', b.link)
      .attr('pointer-events', b.link > 0.5 ? null : 'none')
      .attr('r', (l) => {
        const maxR = l.record?.isFavorite ? LINK_FAV_MAX_VISUAL_R : LINK_MAX_VISUAL_R;
        return visualR(l.r, maxR, k) / k;
      })
      .attr('stroke-width', (l) => {
        const maxR = l.record?.isFavorite ? LINK_FAV_MAX_VISUAL_R : LINK_MAX_VISUAL_R;
        return Math.max(0.6, visualR(l.r, maxR, k) * 0.18);
      });

    // Slight, capped font growth across all label layers.
    const fs = fontScale(k);
    islandLabels.style('font-size', `${14 * fs}px`);
    catLabels.style('font-size',    `${12 * fs}px`);
    subcatLabels.style('font-size', `${10 * fs}px`);
    linkLabels.style('font-size',   `${8 * fs}px`);

    islandLabels.each(function (this: SVGTextElement, node) { placeLabel.call(this, node, b.island); });
    catLabels.each(function (this: SVGTextElement, node) { placeLabel.call(this, node, b.cat); });
    subcatLabels.each(function (this: SVGTextElement, node) { placeLabel.call(this, node, b.subcat); });
    // Link labels sit BELOW the dot. Gap = capped visual radius + 2px so the label
    // doesn't drift away from the dot once we hit the size cap.
    linkLabels.each(function (this: SVGTextElement, node) {
      const maxR = node.record?.isFavorite ? LINK_FAV_MAX_VISUAL_R : LINK_MAX_VISUAL_R;
      const offset = visualR(node.r, maxR, k) + 2;
      const showByR = node.r * k > 5;
      placeLabel.call(this, node, showByR ? b.link : 0, offset);
    });
  }

  zoomState.behavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.4, 18])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zoomState.transform = event.transform;
      zoomState.viewTransforms.geo = zoomState.transform;
      applyTransform();
      updateVisibility(zoomState.transform.k);
    });

  svg.call(zoomState.behavior).call(zoomState.behavior.transform, zoomState.transform);
  applyTransform();
  updateVisibility(zoomState.transform.k);
}
