import * as d3 from 'd3';
import type { BookmarkRecord, VizNode } from '../types/bookmarks';
import { clamp, parentColor, stableHash, zoomState } from '../shared';

// ─── Semantic types ───────────────────────────────────────────────────────────

type SemanticRegion = {
  id: string;
  name: string;
  islandName: string;
  count: number;
  x: number;
  y: number;
  radius: number;
  records: BookmarkRecord[];
};

type SemanticIsland = {
  id: string;
  name: string;
  count: number;
  x: number;
  y: number;
  radius: number;
};

type SemanticLink = {
  id: string;
  title: string;
  x: number;
  y: number;
  radius: number;
  record: BookmarkRecord;
};

type SemanticLayout = {
  islands: SemanticIsland[];
  regions: SemanticRegion[];
  links: SemanticLink[];
};

// ─── Layout helpers ───────────────────────────────────────────────────────────

function groupedRecords(records: BookmarkRecord[]): Map<string, Map<string, BookmarkRecord[]>> {
  const islands = new Map<string, Map<string, BookmarkRecord[]>>();
  for (const record of records) {
    const island = record.folderPath[0] ?? 'Categories';
    const region = record.folderPath[1] ?? 'General';
    if (!islands.has(island)) islands.set(island, new Map<string, BookmarkRecord[]>());
    const regionMap = islands.get(island)!;
    if (!regionMap.has(region)) regionMap.set(region, []);
    regionMap.get(region)!.push(record);
  }
  return islands;
}

// Virtual canvas size for free-pan layout — larger than the viewport.
// Islands are spread across this space; zoom/pan lets the user explore freely.
const VIRTUAL_W = 3200;
const VIRTUAL_H = 2600;

function buildSemanticLayout(records: BookmarkRecord[]): SemanticLayout {
  const grouped = groupedRecords(records);
  const islandNames = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

  const centerX = VIRTUAL_W / 2;
  const centerY = VIRTUAL_H / 2;
  const islandRing = Math.min(VIRTUAL_W, VIRTUAL_H) * 0.31;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const islands: SemanticIsland[] = [];
  const regions: SemanticRegion[] = [];
  const links: SemanticLink[] = [];

  islandNames.forEach((name, islandIndex) => {
    const regionMap  = grouped.get(name)!;
    const allRecords = Array.from(regionMap.values()).flat();
    const islandCount  = allRecords.length;
    const islandRadius = clamp(90 + Math.sqrt(islandCount) * 5.2, 110, 230);

    const angle      = islandNames.length > 1 ? (Math.PI * 2 * islandIndex) / islandNames.length - Math.PI / 2 : -Math.PI / 2;
    const ringFactor = islandNames.length > 1 ? 1 : 0;
    const islandX    = centerX + Math.cos(angle) * islandRing * ringFactor;
    const islandY    = centerY + Math.sin(angle) * islandRing * ringFactor;

    const island: SemanticIsland = {
      id: `island/${name}`, name, count: islandCount,
      x: islandX, y: islandY, radius: islandRadius,
    };
    islands.push(island);

    const regionNames  = Array.from(regionMap.keys()).sort((a, b) => a.localeCompare(b));
    const regionRing   = islandRadius * 0.58;

    regionNames.forEach((regionName, regionIndex) => {
      const regionRecords = [...regionMap.get(regionName)!].sort((a, b) => a.id.localeCompare(b.id));
      const regionCount   = regionRecords.length;
      const regionRadius  = clamp(24 + Math.sqrt(regionCount) * 3.4, 34, Math.max(40, islandRadius * 0.38));

      const regionAngle =
        regionNames.length > 1
          ? (Math.PI * 2 * regionIndex) / regionNames.length + (stableHash(regionName) % 360) * (Math.PI / 180) * 0.025
          : (stableHash(regionName) % 360) * (Math.PI / 180);

      const regionDistance = regionNames.length > 1 ? regionRing : islandRadius * 0.12;
      const regionX = islandX + Math.cos(regionAngle) * regionDistance;
      const regionY = islandY + Math.sin(regionAngle) * regionDistance;

      const region: SemanticRegion = {
        id: `region/${name}/${regionName}`,
        name: regionName, islandName: name, count: regionCount,
        x: regionX, y: regionY, radius: regionRadius, records: regionRecords,
      };
      regions.push(region);

      const jitter = ((stableHash(region.id) % 1000) / 1000) * Math.PI;
      regionRecords.forEach((record, linkIndex) => {
        const spiralRadius  = 8 + Math.sqrt(linkIndex) * 6;
        const maxRadius     = Math.max(6, regionRadius - 8);
        const boundedRadius = Math.min(spiralRadius, maxRadius);
        const theta         = linkIndex * goldenAngle + jitter;
        links.push({
          id: record.id, title: record.title,
          x: regionX + Math.cos(theta) * boundedRadius,
          y: regionY + Math.sin(theta) * boundedRadius,
          radius: record.isFavorite ? 4 : 3.1,
          record,
        });
      });
    });
  });

  return { islands, regions, links };
}

// ─── Zoom helpers ─────────────────────────────────────────────────────────────

function semanticZoomToCircle(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  viewW: number, viewH: number,
  cx: number, cy: number, radius: number,
): void {
  if (!zoomState.behavior) return;
  const diameter = Math.max(20, radius * 2.2);
  const scale    = Math.min(12, Math.max(0.7, 0.9 * Math.min(viewW / diameter, viewH / diameter)));
  const tx       = viewW / 2 - cx * scale;
  const ty       = viewH / 2 - cy * scale;
  const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
  zoomState.transform = transform;
  zoomState.viewTransforms.semantic = transform;
  svg.transition().duration(420).call(zoomState.behavior.transform, transform);
}

// ─── renderSemantic ───────────────────────────────────────────────────────────

export function renderSemantic(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  records: BookmarkRecord[],
  onLinkClick: (node: VizNode) => void,
): void {
  const mapPanel = document.querySelector<HTMLElement>('.map-panel')!;
  const viewW    = Math.max(mapPanel.clientWidth,  520);
  const viewH    = Math.max(mapPanel.clientHeight, 420);
  const margin   = 0; // layout in virtual-canvas space; no per-renderer margin

  svg.attr('viewBox', `0 0 ${viewW} ${viewH}`);

  // Invisible background to capture pan gestures on empty canvas space
  svg.append('rect')
    .attr('width', viewW).attr('height', viewH)
    .attr('fill', 'transparent').attr('class', 'semantic-canvas-bg');

  const scene        = svg.append('g').attr('class', 'scene semantic-scene');
  const islandLayer  = scene.append('g').attr('class', 'semantic-islands');
  const regionLayer  = scene.append('g').attr('class', 'semantic-regions');
  const linkLayer    = scene.append('g').attr('class', 'semantic-links');
  const labelOverlay = svg.append('g').attr('class', 'label-overlay semantic-label-overlay').style('pointer-events', 'none');

  const layout = buildSemanticLayout(records);

  // ── Island circles ─────────────────────────────────────────────────────────
  const islandNodes = islandLayer
    .selectAll<SVGGElement, SemanticIsland>('g')
    .data(layout.islands).join('g')
    .attr('class', 'node semantic-node semantic-node--island')
    .on('click', (_, node) => {
      semanticZoomToCircle(svg, viewW, viewH, node.x, node.y, node.radius);
    });

  islandNodes.append('circle')
    .attr('cx', n => n.x).attr('cy', n => n.y).attr('r', n => n.radius)
    .attr('fill', n => {
      const base = d3.hsl(parentColor(n.name));
      return `hsla(${base.h}, ${clamp(base.s * 100, 28, 78).toFixed(1)}%, ${clamp(base.l * 100 + 16, 28, 64).toFixed(1)}%, 0.18)`;
    })
    .attr('stroke', n => {
      const base = d3.hsl(parentColor(n.name));
      return `hsla(${base.h}, ${clamp(base.s * 100, 34, 92).toFixed(1)}%, ${clamp(base.l * 100 + 8, 32, 70).toFixed(1)}%, 0.78)`;
    })
    .attr('stroke-width', 2.2);

  // ── Region circles ─────────────────────────────────────────────────────────
  const regionNodes = regionLayer
    .selectAll<SVGGElement, SemanticRegion>('g')
    .data(layout.regions).join('g')
    .attr('class', 'node semantic-node semantic-node--region')
    .on('click', (_, node) => {
      semanticZoomToCircle(svg, viewW, viewH, node.x, node.y, node.radius);
    });

  regionNodes.append('circle')
    .attr('cx', n => n.x).attr('cy', n => n.y).attr('r', n => n.radius)
    .attr('fill', n => {
      const base = d3.hsl(parentColor(n.islandName));
      return `hsla(${base.h}, ${clamp(base.s * 100, 26, 80).toFixed(1)}%, ${clamp(base.l * 100 + 24, 34, 78).toFixed(1)}%, 0.24)`;
    })
    .attr('stroke', 'rgba(214, 239, 255, 0.62)')
    .attr('stroke-width', 1.1)
    .attr('stroke-dasharray', '3 3');

  // ── Link dots ──────────────────────────────────────────────────────────────
  const linkNodes = linkLayer
    .selectAll<SVGGElement, SemanticLink>('g')
    .data(layout.links).join('g')
    .attr('class', 'node semantic-node semantic-node--link')
    .on('click', (_, node) => {
      onLinkClick({ id: node.id, name: node.title, type: 'bookmark', record: node.record });
    });

  linkNodes.append('circle')
    .attr('cx', n => n.x).attr('cy', n => n.y).attr('r', n => n.radius)
    .attr('fill', n => n.record.isFavorite ? 'rgba(255, 193, 102, 0.95)' : 'rgba(121, 211, 172, 0.88)')
    .attr('stroke', 'rgba(4, 20, 31, 0.64)').attr('stroke-width', 0.8);

  // ── Labels ─────────────────────────────────────────────────────────────────
  const islandLabels = labelOverlay
    .selectAll<SVGTextElement, SemanticIsland>('text.island-label')
    .data(layout.islands).join('text')
    .attr('class', 'island-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('fill', 'var(--map-label-1)').attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)').attr('stroke-width', 3)
    .style('font-size', '13px')
    .text(n => `${n.name} (${n.count})`);

  const regionLabels = labelOverlay
    .selectAll<SVGTextElement, SemanticRegion>('text.region-label')
    .data(layout.regions).join('text')
    .attr('class', 'region-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('fill', 'var(--map-label-2)').attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)').attr('stroke-width', 3)
    .style('font-size', '11px')
    .text(n => n.name);

  const linkLabels = labelOverlay
    .selectAll<SVGTextElement, SemanticLink>('text.semantic-link-label')
    .data(layout.links).join('text')
    .attr('class', 'semantic-link-label').attr('dominant-baseline', 'middle')
    .attr('fill', 'var(--map-label-3)').attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)').attr('stroke-width', 3)
    .style('font-size', '10px')
    .text(n => n.title);

  // ── Transforms ────────────────────────────────────────────────────────────
  function applyTransform(): void {
    scene.attr('transform', zoomState.transform.toString());
  }

  function updateLabelVisibility(scale: number): void {
    islandLabels.each(function (this: SVGTextElement, node) {
      const tx  = zoomState.transform.applyX(node.x);
      const ty  = zoomState.transform.applyY(node.y);
      const show = scale <= 2.8 || node.radius * scale > 80;
      const el  = d3.select(this);
      if (!show) { el.attr('display', 'none'); return; }
      el.attr('display', null).attr('x', tx + margin).attr('y', ty + margin);
    });

    regionLabels.each(function (this: SVGTextElement, node) {
      const tx   = zoomState.transform.applyX(node.x);
      const ty   = zoomState.transform.applyY(node.y);
      const show = scale >= 0.95 && node.radius * scale > 34;
      const el   = d3.select(this);
      if (!show) { el.attr('display', 'none'); return; }
      el.attr('display', null).attr('x', tx + margin).attr('y', ty + margin);
    });

    linkLabels.each(function (this: SVGTextElement, node) {
      const tx   = zoomState.transform.applyX(node.x + 4);
      const ty   = zoomState.transform.applyY(node.y);
      const show = scale >= 3.2;
      const el   = d3.select(this);
      if (!show) { el.attr('display', 'none'); return; }
      el.attr('display', null).attr('x', tx + margin).attr('y', ty + margin);
    });
  }

  // ── Zoom behavior — free pan + zoom ───────────────────────────────────────
  zoomState.behavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.08, 14])   // wider range enables true free-canvas exploration
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zoomState.transform = event.transform;
      zoomState.viewTransforms.semantic = zoomState.transform;
      applyTransform();
      updateLabelVisibility(zoomState.transform.k);
    });

  // If this is the first render (identity transform), center the content in the viewport.
  const isIdentity = zoomState.transform.k === 1
    && zoomState.transform.x === 0
    && zoomState.transform.y === 0;

  if (isIdentity) {
    // Fit to actual content bounds and anchor near the top to avoid empty top gap.
    const bounds = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    };

    for (const island of layout.islands) {
      bounds.minX = Math.min(bounds.minX, island.x - island.radius);
      bounds.minY = Math.min(bounds.minY, island.y - island.radius);
      bounds.maxX = Math.max(bounds.maxX, island.x + island.radius);
      bounds.maxY = Math.max(bounds.maxY, island.y + island.radius);
    }

    for (const region of layout.regions) {
      bounds.minX = Math.min(bounds.minX, region.x - region.radius);
      bounds.minY = Math.min(bounds.minY, region.y - region.radius);
      bounds.maxX = Math.max(bounds.maxX, region.x + region.radius);
      bounds.maxY = Math.max(bounds.maxY, region.y + region.radius);
    }

    for (const link of layout.links) {
      bounds.minX = Math.min(bounds.minX, link.x - link.radius);
      bounds.minY = Math.min(bounds.minY, link.y - link.radius);
      bounds.maxX = Math.max(bounds.maxX, link.x + link.radius);
      bounds.maxY = Math.max(bounds.maxY, link.y + link.radius);
    }

    const contentW = Math.max(1, bounds.maxX - bounds.minX);
    const contentH = Math.max(1, bounds.maxY - bounds.minY);
    const padX = 16;
    const padTop = 8;
    const padBottom = 16;
    const usableW = Math.max(1, viewW - padX * 2);
    const usableH = Math.max(1, viewH - padTop - padBottom);
    const fitScale = Math.min(usableW / contentW, usableH / contentH);
    const tx = padX - bounds.minX * fitScale + (usableW - contentW * fitScale) / 2;
    const ty = padTop - bounds.minY * fitScale;
    zoomState.transform = d3.zoomIdentity.translate(tx, ty).scale(fitScale);
    zoomState.viewTransforms.semantic = zoomState.transform;
  }

  svg.call(zoomState.behavior).call(zoomState.behavior.transform, zoomState.transform);
  applyTransform();
  updateLabelVisibility(zoomState.transform.k);
}
