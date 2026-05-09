import * as d3 from 'd3';

// ─── View mode type ───────────────────────────────────────────────────────────
export type ViewMode = 'classic' | 'semantic' | 'geo';

// ─── Shared color scale ───────────────────────────────────────────────────────
export const PARENT_PALETTE: string[] = [
  '#4f7cff', '#16b38a', '#d7872e', '#d85f8f', '#8f6bff', '#30a7cf',
];
export const parentColor = d3.scaleOrdinal<string, string>().range(PARENT_PALETTE);

// ─── Shared zoom state (mutated by view renderers) ────────────────────────────
export const zoomState = {
  behavior: undefined as d3.ZoomBehavior<SVGSVGElement, unknown> | undefined,
  transform: d3.zoomIdentity as d3.ZoomTransform,
  viewTransforms: {
    classic:  d3.zoomIdentity as d3.ZoomTransform,
    semantic: d3.zoomIdentity as d3.ZoomTransform,
    geo:      d3.zoomIdentity as d3.ZoomTransform,
  } as Record<ViewMode, d3.ZoomTransform>,
};

// ─── Pure utilities ───────────────────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stableHash(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function projectPoint(x: number, y: number, margin: number): { x: number; y: number } {
  return {
    x: margin + zoomState.transform.applyX(x),
    y: margin + zoomState.transform.applyY(y),
  };
}
