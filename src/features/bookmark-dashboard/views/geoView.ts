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

// ─── Random point inside cell AND island ──────────────────────────────────────

function randomInPolyAndIsland(
  cell: [number, number][],
  islandPoly: [number, number][],
  rng: () => number,
  maxTries = 120,
): [number, number] {
  const [minX, minY, maxX, maxY] = polyBbox(cell);
  const w = maxX - minX, h = maxY - minY;
  for (let t = 0; t < maxTries; t++) {
    const px = minX + rng() * w, py = minY + rng() * h;
    if (ptInPoly(px, py, cell) && ptInPoly(px, py, islandPoly)) return [px, py];
  }
  const cc = polyCentroid(cell);
  return ptInPoly(cc[0], cc[1], islandPoly) ? cc : polyCentroid(islandPoly);
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
  const belt = Math.min(drawW, drawH) * 0.34;
  islands.forEach((isl, ii) => {
    const angle = nIsl > 1 ? (Math.PI * 2 * ii) / nIsl - Math.PI / 2 : 0;
    isl.x = drawW / 2 + (nIsl > 1 ? Math.cos(angle) * belt : 0);
    isl.y = drawH / 2 + (nIsl > 1 ? Math.sin(angle) * belt : 0);
    isl.r = clamp(100 + Math.sqrt(isl.weight) * 6, 110, 240);
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

    sci2 = 0;
    for (const cat of categories) {
      for (const subcat of (cat.children ?? [])) {
        const links = subcat.children ?? [];
        const cells: [number, number][][] = [];
        for (let si = 0; si < finalSeeds.length; si++) {
          if (seedToSubcat[si] !== sci2) continue;
          const cell = vor.cellPolygon(si) as [number, number][] | null;
          if (cell) cells.push(cell);
        }
        const rngL = seededRng(stableHash(subcat.id));
        links.forEach(link => {
          if (cells.length === 0) {
            link.x = subcat.x + (rngL() - 0.5) * 14;
            link.y = subcat.y + (rngL() - 0.5) * 14;
          } else {
            const cell = cells[Math.floor(rngL() * cells.length)];
            [link.x, link.y] = randomInPolyAndIsland(cell, islandPts, rngL);
          }
        });
        allLinks.push(...links);
        sci2++;
      }
    }

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
      const h     = (baseColor.h + ci * catHueStep) % 360;
      const sat   = clamp(baseColor.s * 100 + 6, 22, 70);
      const scName = (allIslandSubcats[gSci] as GeoNode | undefined)?.name ?? String(gSci);
      const lV    = stableHash(scName) % 8;
      const l     = clamp(baseColor.l * 100 + 18 + lV, 20, 56);
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

        if (seedToCat[si] !== seedToCat[sj]) {
          borderGroup.append('path').attr('d', bd).attr('fill', 'none')
            .attr('stroke', 'rgba(255,255,255,0.20)').attr('stroke-width', 5)
            .attr('filter', 'blur(2px)');
          borderGroup.append('path').attr('d', bd).attr('fill', 'none')
            .attr('stroke', 'rgba(0,0,0,0.58)').attr('stroke-width', 2.4);
        } else {
          borderGroup.append('path').attr('d', bd).attr('fill', 'none')
            .attr('stroke', 'rgba(0,0,0,0.30)').attr('stroke-width', 0.9);
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
    .attr('stroke', 'rgba(4,16,28,0.55)').attr('stroke-width', 0.7)
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

  const linkLabels = labelLayer
    .selectAll<SVGTextElement, GeoNode>('text.geo-link-label').data(allLinks).join('text')
    .attr('class', 'geo-link-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('fill', 'var(--map-label-link)').attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)').attr('stroke-width', 2.4)
    .style('font-size', '8px').text(n => n.name);

  function applyTransform(): void {
    scene.attr('transform', `translate(${margin},${margin}) ${zoomState.transform.toString()}`);
  }

  function updateVisibility(k: number): void {
    scene.selectAll<SVGGElement, unknown>('.geo-territories').style('opacity', k >= 0.6 ? 1 : 0);
    scene.selectAll<SVGGElement, unknown>('.geo-borders').style('opacity', k >= 0.6 ? 1 : 0);
    linkSel.style('opacity', k >= 2.4 ? 1 : 0).attr('pointer-events', k >= 2.4 ? null : 'none');

    islandLabels.each(function (this: SVGTextElement, node) {
      const show = k < 1.6;
      const el = d3.select(this);
      if (!show) { el.attr('display', 'none'); return; }
      el.attr('display', null)
        .attr('x', margin + zoomState.transform.applyX(node.x))
        .attr('y', margin + zoomState.transform.applyY(node.y));
    });
    catLabels.each(function (this: SVGTextElement, node) {
      const show = k >= 1.6 && k < 3.2;
      const el = d3.select(this);
      if (!show) { el.attr('display', 'none'); return; }
      el.attr('display', null)
        .attr('x', margin + zoomState.transform.applyX(node.x))
        .attr('y', margin + zoomState.transform.applyY(node.y));
    });
    subcatLabels.each(function (this: SVGTextElement, node) {
      const show = k >= 3.2 && k < 5.2;
      const el = d3.select(this);
      if (!show) { el.attr('display', 'none'); return; }
      el.attr('display', null)
        .attr('x', margin + zoomState.transform.applyX(node.x))
        .attr('y', margin + zoomState.transform.applyY(node.y));
    });
    linkLabels.each(function (this: SVGTextElement, node) {
      const show = k >= 5.2 && node.r * k > 5;
      const el = d3.select(this);
      if (!show) { el.attr('display', 'none'); return; }
      el.attr('display', null)
        .attr('x', margin + zoomState.transform.applyX(node.x))
        .attr('y', margin + zoomState.transform.applyY(node.y));
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
