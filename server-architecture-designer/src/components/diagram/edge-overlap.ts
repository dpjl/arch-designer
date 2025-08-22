import { Edge, Node } from 'reactflow';
import { calculateAbsoluteNodePosition, calculateAnchorPosition } from './edge-anchoring';

export type OverlapSegment = {
  id: string;
  x1: number; y1: number; x2: number; y2: number;
  colors: string[]; // order used for dash cycling
  strokeWidth: number; // base width
};

type Vec = { x:number; y:number };

const sub = (a:Vec,b:Vec):Vec=>({x:a.x-b.x,y:a.y-b.y});

function colorForEdge(e:any): string {
  // network link first
  if (e?.data?.networkColor) return e.data.networkColor;
  if (e?.style?.stroke) return e.style.stroke as string;
  return '#64748b';
}

function strokeWForEdge(e:any): number {
  if (e?.style?.strokeWidth) return Number(e.style.strokeWidth) || 2;
  return 2;
}

// Note: straight-endpoint helper removed; sampling uses actual rendered path instead.

export function computeOverlapSegments(nodes: Node[], edges: Edge[]): OverlapSegment[] {
  // Collect all axis-aligned runs from edges (sampled from path when possible)
  type Entry = { id:string; pivot:Vec; dir:Vec; L:number; axis:'h'|'v'; lineCoord:number; color:string; strokeW:number };
  const all: Entry[] = [];
  const addEntry = (_key: string, entry: Entry) => { all.push(entry); };

  // Try to sample the actual rendered path for exact positions (client-only)
  type Run = { axis:'h'|'v'; dir:Vec; length:number; pivot:Vec; lineCoord:number };
  const sampleRunsFromPath = (edgeId: string): Run[] | null => {
    if (typeof document === 'undefined') return null;
    const path = document.getElementById(edgeId) as SVGPathElement | null;
    if (!path || typeof path.getTotalLength !== 'function') return null;
    try {
      const total = path.getTotalLength();
      if (!isFinite(total) || total <= 0) return null;
      const step = Math.max(2, Math.min(6, total / 120)); // sample density
      const pts: Vec[] = [];
      for (let d = 0; d <= total; d += step) {
        const p = path.getPointAtLength(d);
        pts.push({ x: p.x, y: p.y });
      }
      if (pts.length < 3) return null;
      const runs: Run[] = [];
      const TOL = 0.75; // axis tolerance in px
      let i = 0;
      while (i < pts.length - 1) {
        const start = pts[i];
        let j = i + 1;
        // determine orientation from first delta
        const dx0 = pts[j].x - start.x;
        const dy0 = pts[j].y - start.y;
        const isH = Math.abs(dy0) <= TOL && Math.abs(dx0) > TOL;
        const isV = Math.abs(dx0) <= TOL && Math.abs(dy0) > TOL;
        if (!isH && !isV) { i++; continue; }
        const axis: 'h'|'v' = isH ? 'h' : 'v';
        // extend run while orientation stays the same
        while (j < pts.length) {
          const dx = pts[j].x - pts[j-1].x;
          const dy = pts[j].y - pts[j-1].y;
          const ok = axis === 'h' ? (Math.abs(dy) <= TOL) : (Math.abs(dx) <= TOL);
          if (!ok) break;
          j++;
        }
        const end = pts[j-1];
        const L = Math.hypot(end.x - start.x, end.y - start.y);
        if (L >= 8) { // ignore tiny runs
          const dir: Vec = axis === 'h' ? { x: Math.sign(end.x - start.x) || 1, y: 0 } : { x: 0, y: Math.sign(end.y - start.y) || 1 };
          const lineCoord = axis === 'h' ? start.y : start.x;
          runs.push({ axis, dir, length: L, pivot: { x: start.x, y: start.y }, lineCoord });
        }
        i = j;
      }
      return runs;
    } catch {
      return null;
    }
  };

  for (const e of edges as any[]) {
    const srcAbs = calculateAbsoluteNodePosition(e.source, nodes);
    const tgtAbs = calculateAbsoluteNodePosition(e.target, nodes);
    if (!srcAbs || !tgtAbs) continue;
    const s = e?.data?.sourceAnchor
      ? calculateAnchorPosition(srcAbs.x, srcAbs.y, srcAbs.width, srcAbs.height, e.data.sourceAnchor.side, e.data.sourceAnchor.offset)
      : { x: srcAbs.x + srcAbs.width / 2, y: srcAbs.y + srcAbs.height / 2 };
    const t = e?.data?.targetAnchor
      ? calculateAnchorPosition(tgtAbs.x, tgtAbs.y, tgtAbs.width, tgtAbs.height, e.data.targetAnchor.side, e.data.targetAnchor.offset)
      : { x: tgtAbs.x + tgtAbs.width / 2, y: tgtAbs.y + tgtAbs.height / 2 };
    const col = colorForEdge(e);
    const sw = strokeWForEdge(e);
    const shape = e?.data?.shape || 'smooth';

  // First, try exact runs from the rendered path (works for smooth/step/straight)
    const sampled = sampleRunsFromPath(e.id);
    if (sampled && sampled.length) {
      for (const r of sampled) {
    addEntry('P', { id: e.id, pivot: r.pivot, dir: r.dir, L: r.length, axis: r.axis, lineCoord: r.lineCoord, color: col, strokeW: sw });
      }
      continue; // we've captured exact geometry
    }

    // helper to create an entry given pivot and other point
    const pushRay = (key:string, pivot:Vec, other:Vec) => {
      const v = sub(other, pivot);
      // Only keep axis-aligned
      if (Math.abs(v.y) <= 1e-3 && Math.abs(v.x) > 1e-3) {
        const d = { x: Math.sign(v.x) || 1, y: 0 };
        const L = Math.abs(v.x);
        addEntry(key, { id: e.id, pivot, dir: d, L, axis:'h', lineCoord: pivot.y, color: col, strokeW: sw });
      } else if (Math.abs(v.x) <= 1e-3 && Math.abs(v.y) > 1e-3) {
        const d = { x: 0, y: Math.sign(v.y) || 1 };
        const L = Math.abs(v.y);
        addEntry(key, { id: e.id, pivot, dir: d, L, axis:'v', lineCoord: pivot.x, color: col, strokeW: sw });
      }
    };

    if (shape === 'straight') {
      pushRay('S:'+e.source, s, t);
      pushRay('T:'+e.target, t, s);
      continue;
    }
    if (shape === 'step' || shape === 'smoothstep' || shape === 'default') {
      // Prefer orientation from anchor side when present; otherwise fall back to delta magnitudes
      const side = (e?.data?.sourceAnchor?.side || '').toLowerCase();
      const firstIsHorizontal = side === 'left' || side === 'right' ? true : (side === 'top' || side === 'bottom' ? false : (Math.abs(t.x - s.x) >= Math.abs(t.y - s.y)));
      const dx = t.x - s.x, dy = t.y - s.y;
      const DEFAULT_OFFSET = 25; // typical smooth step offset
      if (firstIsHorizontal) {
        const dir = (side === 'left' ? -1 : side === 'right' ? 1 : (dx >= 0 ? 1 : -1));
        const run = Math.min(DEFAULT_OFFSET, Math.abs(dx) / 2);
        const elbow1 = { x: s.x + dir * run, y: s.y };
        // First trunk from source (horizontal small offset)
        pushRay('S:'+e.source, s, elbow1);
        // Second trunk from elbow (vertical long run)
        pushRay('E:'+elbow1.x.toFixed(2)+'@'+elbow1.y.toFixed(2), elbow1, { x: elbow1.x, y: t.y });
      } else {
        const dir = (side === 'top' ? -1 : side === 'bottom' ? 1 : (dy >= 0 ? 1 : -1));
        const rise = Math.min(DEFAULT_OFFSET, Math.abs(dy) / 2);
        const elbow1 = { x: s.x, y: s.y + dir * rise };
        // First trunk from source (vertical small offset)
        pushRay('S:'+e.source, s, elbow1);
        // Second trunk from elbow (horizontal long run)
        pushRay('E:'+elbow1.x.toFixed(2)+'@'+elbow1.y.toFixed(2), elbow1, { x: t.x, y: elbow1.y });
      }
    }
  }

  // Group all entries by axis and line coordinate, then compute interval overlaps
  const result: OverlapSegment[] = [];
  type Bucket = { axis:'h'|'v'; line:number; list: Array<Entry & { start:number; end:number }> };
  const buckets: Bucket[] = [];
  const LINE_TOL = 1.0;
  for (const en of all) {
    // Convert to axis interval [start,end] independent of pivot and direction
    const start = en.axis==='h' ? Math.min(en.pivot.x, en.pivot.x + en.dir.x*en.L) : Math.min(en.pivot.y, en.pivot.y + en.dir.y*en.L);
    const end   = en.axis==='h' ? Math.max(en.pivot.x, en.pivot.x + en.dir.x*en.L) : Math.max(en.pivot.y, en.pivot.y + en.dir.y*en.L);
    let b = buckets.find(bk => bk.axis===en.axis && Math.abs(bk.line - en.lineCoord) <= LINE_TOL);
    if (!b) { b = { axis: en.axis, line: en.lineCoord, list: [] }; buckets.push(b); }
    b.list.push({ ...en, start, end });
  }

  for (const b of buckets) {
    if (b.list.length < 2) continue;
    // Build sorted unique boundaries
    const bounds = Array.from(new Set(b.list.flatMap(it => [it.start, it.end]))).sort((a,b)=>a-b);
    for (let i = 0; i < bounds.length - 1; i++) {
      const a = bounds[i], c = bounds[i+1];
      if (c - a < 1) continue; // skip tiny segments
      // Active entries that fully cover [a,c]
      const active = b.list.filter(it => it.start <= a + 0.25 && it.end >= c - 0.25);
      if (active.length < 2) continue;
      const colors = active.map(it => ({ id: it.id, color: it.color }))
        .sort((A,B)=> A.id < B.id ? -1 : 1)
        .map(x=>x.color);
      const strokeWidth = Math.max(...active.map(it => it.strokeW));
      if (b.axis === 'h') {
        const y = b.line;
        const segId = `H:${y.toFixed(1)}:${a.toFixed(1)}->${c.toFixed(1)}:${colors.join(',')}`;
        result.push({ id: segId, x1: a, y1: y, x2: c, y2: y, colors, strokeWidth });
      } else {
        const x = b.line;
        const segId = `V:${x.toFixed(1)}:${a.toFixed(1)}->${c.toFixed(1)}:${colors.join(',')}`;
        result.push({ id: segId, x1: x, y1: a, x2: x, y2: c, colors, strokeWidth });
      }
    }
  }

  return result;
}
