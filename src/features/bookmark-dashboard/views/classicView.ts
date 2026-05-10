import * as d3 from 'd3';
import { buildTree } from '../services/treeBuilder';
import type { BookmarkRecord, VizNode } from '../types/bookmarks';
import { clamp, parentColor, projectPoint, zoomState } from '../shared';

// ─── Classic-specific helpers ─────────────────────────────────────────────────

function weightForTreemap(node: VizNode): number {
  if (node.type === 'bookmark') return 1;
  if (typeof node.count === 'number' && node.count > 0) return node.count;
  return 1;
}

function rootParentName(node: d3.HierarchyRectangularNode<VizNode>): string {
  let current: d3.HierarchyRectangularNode<VizNode> = node;
  while (current.depth > 1 && current.parent) {
    current = current.parent;
  }
  return current.data.name;
}

function regionFill(node: d3.HierarchyRectangularNode<VizNode>): string {
  const base = d3.hsl(parentColor(rootParentName(node)));
  const toneStep = Math.max(0, node.depth - 1);
  const lightness = clamp(base.l + 0.14 - toneStep * 0.08, 0.16, 0.75);
  const saturation = clamp(base.s * 0.95, 0.25, 0.9);
  return `hsla(${base.h}, ${(saturation * 100).toFixed(1)}%, ${(lightness * 100).toFixed(1)}%, 0.24)`;
}

function regionStroke(node: d3.HierarchyRectangularNode<VizNode>): string {
  const base = d3.hsl(parentColor(rootParentName(node)));
  const toneStep = Math.max(0, node.depth - 1);
  const lightness = clamp(base.l + 0.02 - toneStep * 0.1, 0.12, 0.58);
  const saturation = clamp(base.s, 0.3, 0.95);
  return `hsla(${base.h}, ${(saturation * 100).toFixed(1)}%, ${(lightness * 100).toFixed(1)}%, 0.72)`;
}

function regionStrokeWidth(depth: number): number {
  if (depth <= 2) return 1.4;
  if (depth === 3) return 1.1;
  return 0.9;
}

function regionPolygonPath(node: d3.HierarchyRectangularNode<VizNode>): string {
  const { x0, y0, x1, y1 } = node;
  const w = x1 - x0;
  const h = y1 - y0;
  const cut = Math.max(2, Math.min(14, Math.min(w, h) * 0.12));
  return [
    `M ${x0 + cut} ${y0}`, `L ${x1 - cut} ${y0}`,
    `L ${x1} ${y0 + cut}`, `L ${x1} ${y1 - cut}`,
    `L ${x1 - cut} ${y1}`, `L ${x0 + cut} ${y1}`,
    `L ${x0} ${y1 - cut}`, `L ${x0} ${y0 + cut}`, 'Z',
  ].join(' ');
}

function linkFill(node: d3.HierarchyRectangularNode<VizNode>): string {
  const base = d3.hsl(parentColor(rootParentName(node)));
  const lightness = clamp(base.l - 0.10, 0.10, 0.46);
  const saturation = clamp(base.s * 1.02, 0.28, 0.92);
  return `hsla(${base.h}, ${(saturation * 100).toFixed(1)}%, ${(lightness * 100).toFixed(1)}%, 0.90)`;
}

function linkStroke(node: d3.HierarchyRectangularNode<VizNode>): string {
  const base = d3.hsl(parentColor(rootParentName(node)));
  const lightness = clamp(base.l - 0.24, 0.04, 0.30);
  return `hsla(${base.h}, ${(clamp(base.s, 0.38, 1.0) * 100).toFixed(1)}%, ${(lightness * 100).toFixed(1)}%, 0.92)`;
}

function topScore(record: BookmarkRecord): number {
  const favoriteBonus = record.isFavorite ? 5000 : 0;
  const tagBonus = record.tags.length * 25;
  const categoryBonus = record.tagCategories.length * 35;
  const pathDepthBonus = record.folderPath.length;
  return favoriteBonus + tagBonus + categoryBonus + pathDepthBonus;
}

export function limitTopLinksPerSubcategory(records: BookmarkRecord[], maxLinks: number): BookmarkRecord[] {
  const grouped = new Map<string, BookmarkRecord[]>();
  for (const record of records) {
    const key = record.folderPath.join(' > ') || 'Root';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(record);
  }
  const selected: BookmarkRecord[] = [];
  for (const groupRecords of grouped.values()) {
    const top = [...groupRecords]
      .sort((a, b) => {
        const scoreDiff = topScore(b) - topScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return a.title.localeCompare(b.title);
      })
      .slice(0, maxLinks);
    selected.push(...top);
  }
  return selected;
}

// ─── renderClassic ────────────────────────────────────────────────────────────

export function renderClassic(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  records: BookmarkRecord[],
  onLinkClick: (node: VizNode) => void,
): void {
  const tree = buildTree(records, 99);

  const mapPanel = document.querySelector<HTMLElement>('.map-panel')!;
  const width = Math.max(mapPanel.clientWidth, 520);
  const height = Math.max(mapPanel.clientHeight, 420);
  const margin = 0;
  const drawWidth = Math.max(20, width - margin * 2);
  const drawHeight = Math.max(20, height - margin * 2);

  svg.attr('viewBox', `0 0 ${width} ${height}`);

  const scene = svg.append('g').attr('class', 'scene');
  const regionLayer = scene.append('g').attr('class', 'regions');
  const linkLayer = scene.append('g').attr('class', 'links');
  const labelOverlay = svg.append('g').attr('class', 'label-overlay').style('pointer-events', 'none');

  const root = d3
    .hierarchy<VizNode>(tree, (node) => node.children)
    .sum((node) => weightForTreemap(node))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const treemap = d3
    .treemap<VizNode>()
    .size([drawWidth, drawHeight])
    .paddingOuter(2)
    .paddingTop((node) => {
      if (node.depth === 1) return 14;
      if (node.depth === 2) return 10;
      return 4;
    })
    .paddingInner(3)
    .round(true);

  const laidOut = treemap(root);
  const descendants = laidOut.descendants().filter((node) => node.depth > 0);
  const groups = descendants.filter((node) => node.data.type !== 'bookmark');
  const links = descendants.filter((node) => node.data.type === 'bookmark');

  const regionNodes = regionLayer
    .selectAll<SVGGElement, d3.HierarchyRectangularNode<VizNode>>('g')
    .data(groups)
    .join('g')
    .attr('class', (node) => `node node--region depth-${node.depth}`)
    .on('click', (_, node) => {
      zoomToRegion(svg, node, drawWidth, drawHeight);
    });

  regionNodes
    .append('path')
    .attr('d', (node) => regionPolygonPath(node))
    .attr('fill', (node) => regionFill(node))
    .attr('stroke', (node) => regionStroke(node))
    .attr('stroke-width', (node) => regionStrokeWidth(node.depth));

  const linkNodes = linkLayer
    .selectAll<SVGGElement, d3.HierarchyRectangularNode<VizNode>>('g')
    .data(links)
    .join('g')
    .attr('class', 'node node--link')
    .on('click', (_, node) => { onLinkClick(node.data); });

  linkNodes
    .append('rect')
    .attr('x', (node) => {
      const cw = node.x1 - node.x0;
      const ch = node.y1 - node.y0;
      const size = Math.max(1, Math.min(cw, ch) - 2);
      return node.x0 + (cw - size) / 2;
    })
    .attr('y', (node) => {
      const cw = node.x1 - node.x0;
      const ch = node.y1 - node.y0;
      const size = Math.max(1, Math.min(cw, ch) - 2);
      return node.y0 + (ch - size) / 2;
    })
    .attr('width',  (node) => Math.max(1, Math.min(node.x1 - node.x0, node.y1 - node.y0) - 2))
    .attr('height', (node) => Math.max(1, Math.min(node.x1 - node.x0, node.y1 - node.y0) - 2))
    .attr('rx', 3)
    .attr('ry', 3)
    .attr('fill',   (node) => linkFill(node))
    .attr('stroke', (node) => linkStroke(node))
    .attr('stroke-width', 0.8);

  const groupLabels = labelOverlay
    .selectAll<SVGTextElement, d3.HierarchyRectangularNode<VizNode>>('text.group-label')
    .data(groups)
    .join('text')
    .attr('class', 'group-label')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text((node) => node.data.name)
    .attr('fill', 'var(--map-label-1)')
    .attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)')
    .attr('stroke-width', 3)
    .style('font-size', '12px');

  const linkLabels = labelOverlay
    .selectAll<SVGTextElement, d3.HierarchyRectangularNode<VizNode>>('text.link-label')
    .data(links)
    .join('text')
    .attr('class', 'link-label')
    .attr('dominant-baseline', 'middle')
    .text((node) => node.data.name)
    .attr('fill', 'var(--map-label-3)')
    .attr('paint-order', 'stroke')
    .attr('stroke', 'var(--map-label-stroke)')
    .attr('stroke-width', 3)
    .style('font-size', '10px');

  function updateTransforms(): void {
    scene.attr('transform', `translate(${margin},${margin}) ${zoomState.transform.toString()}`);
  }

  function updateLabelVisibility(scale: number): void {
    regionNodes.each(function onEach(node) {
      const widthPx  = (node.x1 - node.x0) * scale;
      const heightPx = (node.y1 - node.y0) * scale;
      const areaPx   = widthPx * heightPx;
      let visible = false;
      if      (node.depth === 1) visible = areaPx > 2600;
      else if (node.depth === 2) visible = scale >= 0.92 && areaPx > 900;
      else if (node.depth === 3) visible = scale >= 1.45 && areaPx > 320;
      else                       visible = scale >= 2.2  && areaPx > 130;
      d3.select(this)
        .style('opacity', visible ? 1 : 0)
        .attr('pointer-events', visible ? null : 'none');
    });

    linkNodes.each(function onEach(node) {
      const widthPx  = (node.x1 - node.x0) * scale;
      const heightPx = (node.y1 - node.y0) * scale;
      const areaPx   = widthPx * heightPx;
      const visible  = scale >= 2.65 && areaPx > 72;
      d3.select(this)
        .style('opacity', visible ? 1 : 0)
        .attr('pointer-events', visible ? null : 'none');
    });

    groupLabels.each(function onEach(node) {
      const widthPx  = (node.x1 - node.x0) * scale;
      const heightPx = (node.y1 - node.y0) * scale;
      const areaPx   = widthPx * heightPx;
      let visible = false;
      if      (node.depth === 1) visible = scale < 1.5  && areaPx > 8000;
      else if (node.depth === 2) visible = scale >= 1.5 && scale < 2.6  && areaPx > 3200;
      else if (node.depth === 3) visible = scale >= 2.6 && scale < 4.4  && areaPx > 1200;
      else                       visible = scale >= 4.4 && areaPx > 500;

      const element = d3.select(this);
      if (!visible) { element.attr('display', 'none'); return; }

      const centerX   = (node.x0 + node.x1) / 2;
      const centerY   = (node.y0 + node.y1) / 2;
      const projected = projectPoint(centerX, centerY, margin);
      const fontSize  = node.depth === 1 ? '13px' : node.depth === 2 ? '12px' : '11px';
      element.attr('display', null).attr('x', projected.x).attr('y', projected.y).style('font-size', fontSize);
    });

    linkLabels.each(function onEach(node) {
      const cw       = node.x1 - node.x0;
      const ch       = node.y1 - node.y0;
      const size     = Math.min(cw, ch);
      const sizePx   = size * scale;
      const shouldDisplay = scale >= 5.8 && sizePx > 14;

      const element = d3.select(this);
      if (!shouldDisplay) { element.attr('display', 'none'); return; }

      const cx        = node.x0 + cw / 2;
      const cy        = node.y0 + ch / 2;
      const projected = projectPoint(cx, cy, margin);
      element.attr('display', null).attr('x', projected.x).attr('y', projected.y).attr('text-anchor', 'middle');
    });
  }

  zoomState.behavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.45, 16])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zoomState.transform = event.transform;
      zoomState.viewTransforms.classic = zoomState.transform;
      updateTransforms();
      updateLabelVisibility(zoomState.transform.k);
    });

  svg.call(zoomState.behavior).call(zoomState.behavior.transform, zoomState.transform);
  updateTransforms();
  updateLabelVisibility(zoomState.transform.k);
}

function zoomToRegion(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  node: d3.HierarchyRectangularNode<VizNode>,
  drawWidth: number,
  drawHeight: number,
): void {
  if (!zoomState.behavior) return;
  const width  = Math.max(1, node.x1 - node.x0);
  const height = Math.max(1, node.y1 - node.y0);
  const scale  = Math.min(16, Math.max(0.6, 0.88 * Math.min(drawWidth / width, drawHeight / height)));
  const centerX = (node.x0 + node.x1) / 2;
  const centerY = (node.y0 + node.y1) / 2;
  const tx = drawWidth  / 2 - centerX * scale;
  const ty = drawHeight / 2 - centerY * scale;
  const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
  zoomState.transform = transform;
  svg.transition().duration(420).call(zoomState.behavior.transform, transform);
}
