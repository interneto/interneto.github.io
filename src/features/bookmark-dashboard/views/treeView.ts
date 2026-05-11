import * as d3 from 'd3';
import { buildTree } from '../services/treeBuilder';
import type { BookmarkRecord, VizNode } from '../types/bookmarks';
import { clamp, parentColor, zoomState } from '../shared';

type TreeRenderMetrics = {
  visibleNodes: number;
  visibleBookmarks: number;
};

type TreeNodePoint = {
  node: d3.HierarchyPointNode<VizNode>;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
};

type TreeLinkPoint = {
  id: string;
  source: TreeNodePoint;
  target: TreeNodePoint;
};

const collapsedNodeIds = new Set<string>();
const previousPositions = new Map<string, { x: number; y: number }>();

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  const a = angle - Math.PI / 2;
  return {
    x: Math.cos(a) * radius,
    y: Math.sin(a) * radius,
  };
}

function nodeRadius(node: d3.HierarchyPointNode<VizNode>): number {
  if (node.data.type === 'bookmark') {
    return node.data.record?.isFavorite ? 5.4 : 4.5;
  }
  if (node.depth === 0) return 11;
  if (node.depth === 1) return 8.8;
  if (node.depth === 2) return 7.2;
  return 6.2;
}

function nodeColor(node: d3.HierarchyPointNode<VizNode>): string {
  if (node.data.type === 'bookmark') {
    return node.data.record?.isFavorite
      ? 'rgba(255, 196, 101, 0.94)'
      : 'rgba(121, 211, 172, 0.9)';
  }
  const anchorName = node.depth > 1 && node.ancestors().length > 1
    ? node.ancestors()[1].data.name
    : node.data.name;
  const base = d3.hsl(parentColor(anchorName));
  const lightness = clamp(base.l + 0.12 - node.depth * 0.04, 0.2, 0.78);
  const saturation = clamp(base.s * 0.96, 0.24, 0.9);
  return `hsla(${base.h}, ${(saturation * 100).toFixed(1)}%, ${(lightness * 100).toFixed(1)}%, 0.92)`;
}

function nodeStroke(node: d3.HierarchyPointNode<VizNode>): string {
  if (node.data.type === 'bookmark') {
    return 'rgba(10, 24, 38, 0.72)';
  }
  const anchorName = node.depth > 1 && node.ancestors().length > 1
    ? node.ancestors()[1].data.name
    : node.data.name;
  const base = d3.hsl(parentColor(anchorName));
  const lightness = clamp(base.l - 0.2, 0.1, 0.54);
  return `hsla(${base.h}, ${(clamp(base.s, 0.34, 0.98) * 100).toFixed(1)}%, ${(lightness * 100).toFixed(1)}%, 0.94)`;
}

function canToggle(node: d3.HierarchyPointNode<VizNode>): boolean {
  if (node.depth === 0) return false;
  if (node.data.type === 'bookmark') return false;
  return (node.data.children?.length ?? 0) > 0;
}

export function renderTree(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  records: BookmarkRecord[],
  onLinkClick: (node: VizNode) => void,
  onStructureChange: () => void,
): TreeRenderMetrics {
  const mapPanel = document.querySelector<HTMLElement>('.map-panel')!;
  const viewW = Math.max(mapPanel.clientWidth, 520);
  const viewH = Math.max(mapPanel.clientHeight, 420);

  svg.attr('viewBox', `0 0 ${viewW} ${viewH}`);

  svg.append('rect')
    .attr('class', 'tree-canvas-bg')
    .attr('width', viewW)
    .attr('height', viewH)
    .attr('fill', 'transparent');

  const scene = svg.append('g').attr('class', 'scene tree-scene');
  const linkLayer = scene.append('g').attr('class', 'tree-links');
  const nodeLayer = scene.append('g').attr('class', 'tree-nodes');
  const labelLayer = scene.append('g').attr('class', 'tree-labels').style('pointer-events', 'none');

  const rootNode = buildTree(records, 99);
  const hierarchy = d3.hierarchy<VizNode>(
    rootNode,
    (node) => {
      if (node.type === 'bookmark') return undefined;
      if (collapsedNodeIds.has(node.id)) return undefined;
      return node.children;
    },
  );

  const radius = Math.max(220, Math.min(2200, Math.max(viewW, viewH) * 0.72));
  const treeLayout = d3.tree<VizNode>()
    .size([Math.PI * 2, radius])
    .separation((a, b) => {
      const sameParent = a.parent === b.parent;
      const depth = Math.max(1, Math.min(a.depth, b.depth));
      return (sameParent ? 1.0 : 1.6) / Math.pow(depth, 0.35);
    });

  const laidOut = treeLayout(hierarchy);
  const descendants = laidOut.descendants();

  const pointById = new Map<string, TreeNodePoint>();
  const points: TreeNodePoint[] = descendants.map((node) => {
    const { x, y } = polarToCartesian(node.x, node.y);
    const previous = previousPositions.get(node.data.id);
    const parentPrevious = node.parent ? previousPositions.get(node.parent.data.id) : undefined;

    const fromX = previous?.x ?? parentPrevious?.x ?? x;
    const fromY = previous?.y ?? parentPrevious?.y ?? y;

    const point: TreeNodePoint = { node, x, y, fromX, fromY };
    pointById.set(node.data.id, point);
    return point;
  });

  const links: TreeLinkPoint[] = laidOut.links().map((link) => ({
    id: `${link.source.data.id}=>${link.target.data.id}`,
    source: pointById.get(link.source.data.id)!,
    target: pointById.get(link.target.data.id)!,
  }));

  const linkPath = d3.linkHorizontal<{ x: number; y: number }, { x: number; y: number }>()
    .x((d) => d.x)
    .y((d) => d.y);

  function toLinkDatum(link: TreeLinkPoint, from = false): { source: { x: number; y: number }; target: { x: number; y: number } } {
    if (from) {
      return {
        source: { x: link.source.fromX, y: link.source.fromY },
        target: { x: link.target.fromX, y: link.target.fromY },
      };
    }
    return {
      source: { x: link.source.x, y: link.source.y },
      target: { x: link.target.x, y: link.target.y },
    };
  }

  const t = svg.transition().duration(420).ease(d3.easeCubicOut);

  linkLayer
    .selectAll<SVGPathElement, TreeLinkPoint>('path.tree-link')
    .data(links, (d) => d.id)
    .join('path')
    .attr('class', (d) => `tree-link depth-${d.target.node.depth}`)
    .attr('d', (d) => linkPath(toLinkDatum(d, true)) ?? '')
    .attr('stroke-width', (d) => (d.target.node.depth <= 2 ? 1.65 : d.target.node.depth === 3 ? 1.25 : 1.05))
    .attr('opacity', 0.12)
    .transition(t)
    .attr('d', (d) => linkPath(toLinkDatum(d)) ?? '')
    .attr('opacity', (d) => (d.target.node.data.type === 'bookmark' ? 0.56 : 0.68));

  const nodeSelection = nodeLayer
    .selectAll<SVGGElement, TreeNodePoint>('g.tree-node')
    .data(points, (d) => d.node.data.id)
    .join('g')
    .attr('class', (d) => {
      const classes = ['tree-node'];
      classes.push(d.node.data.type === 'bookmark' ? 'tree-node--bookmark' : 'tree-node--group');
      classes.push(`depth-${d.node.depth}`);
      if (canToggle(d.node)) {
        classes.push(collapsedNodeIds.has(d.node.data.id) ? 'is-collapsed' : 'is-expanded');
      }
      return classes.join(' ');
    })
    .attr('transform', (d) => `translate(${d.fromX},${d.fromY})`)
    .style('opacity', 0.1)
    .on('click', (_, point) => {
      if (point.node.data.type === 'bookmark') {
        onLinkClick(point.node.data);
        return;
      }

      if (!canToggle(point.node)) {
        return;
      }

      const id = point.node.data.id;
      if (collapsedNodeIds.has(id)) {
        collapsedNodeIds.delete(id);
      } else {
        collapsedNodeIds.add(id);
      }

      onStructureChange();
    });

  nodeSelection
    .append('circle')
    .attr('class', 'tree-node-hit')
    .attr('r', (d) => Math.max(14, nodeRadius(d.node) + 7));

  nodeSelection
    .append('circle')
    .attr('class', 'tree-node-core')
    .attr('r', (d) => nodeRadius(d.node))
    .attr('fill', (d) => nodeColor(d.node))
    .attr('stroke', (d) => nodeStroke(d.node))
    .attr('stroke-width', (d) => (d.node.depth <= 1 ? 1.8 : 1.35));

  nodeSelection
    .filter((d) => canToggle(d.node))
    .append('text')
    .attr('class', 'tree-node-toggle')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('y', -1)
    .text((d) => (collapsedNodeIds.has(d.node.data.id) ? '+' : '-'));

  nodeSelection
    .transition(t)
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .style('opacity', 1);

  const labelSelection = labelLayer
    .selectAll<SVGTextElement, TreeNodePoint>('text.tree-node-label')
    .data(points, (d) => d.node.data.id)
    .join('text')
    .attr('class', (d) => `tree-node-label depth-${d.node.depth}`)
    .attr('x', (d) => {
      if (d.node.depth === 0) return 0;
      return d.x >= 0 ? nodeRadius(d.node) + 7 : -(nodeRadius(d.node) + 7);
    })
    .attr('y', 1)
    .attr('text-anchor', (d) => {
      if (d.node.depth === 0) return 'middle';
      return d.x >= 0 ? 'start' : 'end';
    })
    .attr('dominant-baseline', 'middle')
    .text((d) => d.node.data.name)
    .attr('transform', (d) => `translate(${d.x},${d.y})`);

  function applyTransform(): void {
    const tx = zoomState.transform.x + viewW / 2;
    const ty = zoomState.transform.y + viewH / 2;
    scene.attr('transform', `translate(${tx},${ty}) scale(${zoomState.transform.k})`);
  }

  function updateLabelVisibility(scale: number): void {
    labelSelection.each(function onEach(this: SVGTextElement, point) {
      let show = true;
      if (point.node.data.type === 'bookmark') {
        show = scale >= 2.0;
      } else if (point.node.depth >= 4) {
        show = scale >= 1.55;
      } else if (point.node.depth === 3) {
        show = scale >= 1.15;
      }

      const el = d3.select(this);
      if (!show) {
        el.attr('display', 'none');
      } else {
        el.attr('display', null);
      }
    });
  }

  zoomState.behavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.08, 16])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zoomState.transform = event.transform;
      zoomState.viewTransforms.tree = zoomState.transform;
      applyTransform();
      updateLabelVisibility(zoomState.transform.k);
    });

  const isIdentity = zoomState.transform.k === 1
    && zoomState.transform.x === 0
    && zoomState.transform.y === 0;

  if (isIdentity) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of points) {
      const r = nodeRadius(point.node) + 12;
      minX = Math.min(minX, point.x - r);
      minY = Math.min(minY, point.y - r);
      maxX = Math.max(maxX, point.x + r);
      maxY = Math.max(maxY, point.y + r);
    }

    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const pad = 34;
    const scale = clamp(Math.min((viewW - pad * 2) / contentW, (viewH - pad * 2) / contentH), 0.14, 1.15);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    zoomState.transform = d3.zoomIdentity
      .translate(-centerX * scale, -centerY * scale)
      .scale(scale);
    zoomState.viewTransforms.tree = zoomState.transform;
  }

  svg.call(zoomState.behavior);
  svg.call(zoomState.behavior.transform, zoomState.transform);
  applyTransform();
  updateLabelVisibility(zoomState.transform.k);

  for (const point of points) {
    previousPositions.set(point.node.data.id, { x: point.x, y: point.y });
  }

  return {
    visibleNodes: points.length,
    visibleBookmarks: points.filter((point) => point.node.data.type === 'bookmark').length,
  };
}