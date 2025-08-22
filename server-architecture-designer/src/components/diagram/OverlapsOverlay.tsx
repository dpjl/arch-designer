"use client";
import React, { useMemo } from 'react';
import { useStore } from 'reactflow';
import { calculateAbsoluteNodePosition, calculateAnchorPosition } from './edge-anchoring';

type NodeLike = any;
type EdgeLike = any;

interface OverlapsOverlayProps {
  nodes: NodeLike[];
  edges: EdgeLike[];
}

// EPS tolerance for considering segments collinear
const EPS = 0.75;

export default function OverlapsOverlay({ nodes, edges }: OverlapsOverlayProps) {
  const viewport = useStore((s) => s.transform); // [x, y, zoom]
  const [tx, ty, tz] = viewport as any;
  const colorOf = (e: any) => e.data?.isNetworkLink ? (e.data?.networkColor || e.style?.stroke || '#64748b') : (e.style?.stroke || '#64748b');
  const widthOf = (e: any) => e.data?.isNetworkLink ? 3 : 2;

  type Seg = { axis: 'h' | 'v'; coord: number; a: number; b: number; edge: any };

  const segments = useMemo(() => {
    const segs: Seg[] = [];
    const pointsFor = (e: any) => {
      const sAbs = calculateAbsoluteNodePosition(e.source, nodes);
      const tAbs = calculateAbsoluteNodePosition(e.target, nodes);
      let sx = e.sourceX, sy = e.sourceY, tx = e.targetX, ty = e.targetY;
      if (e.data?.sourceAnchor && sAbs) { const p = calculateAnchorPosition(sAbs.x, sAbs.y, sAbs.width, sAbs.height, e.data.sourceAnchor.side, e.data.sourceAnchor.offset); sx = p.x; sy = p.y; }
      if (e.data?.targetAnchor && tAbs) { const p = calculateAnchorPosition(tAbs.x, tAbs.y, tAbs.width, tAbs.height, e.data.targetAnchor.side, e.data.targetAnchor.offset); tx = p.x; ty = p.y; }
      return { sx, sy, tx, ty } as { sx:number; sy:number; tx:number; ty:number };
    };
    const addSeg = (axis:'h'|'v', c:number, v1:number, v2:number, e:any) => {
      let a = v1, b = v2; if (a > b) { const t = a; a = b; b = t; }
      if (Math.abs(b - a) < 1) return; // ignore tiny
      segs.push({ axis, coord: c, a, b, edge: e });
    };
    for (const e of edges) {
      const shape = (e.data?.shape || e.type || 'smooth') as string;
      const p = pointsFor(e);
      if (shape === 'straight') {
        if (Math.abs(p.sy - p.ty) <= EPS) addSeg('h', p.sy, p.sx, p.tx, e);
        else if (Math.abs(p.sx - p.tx) <= EPS) addSeg('v', p.sx, p.sy, p.ty, e);
        continue;
      }
      if (shape === 'step' || shape === 'smoothstep' || shape === 'default') {
        // Decide initial axis by magnitude if no explicit anchors
        const horizontalFirst = Math.abs(p.tx - p.sx) >= Math.abs(p.ty - p.sy);
        if (horizontalFirst) {
          // seg1: horizontal from source to vertical align of target
          addSeg('h', p.sy, p.sx, p.tx, e);
          // seg2: vertical up/down to target
          addSeg('v', p.tx, p.sy, p.ty, e);
        } else {
          addSeg('v', p.sx, p.sy, p.ty, e);
          addSeg('h', p.ty, p.sx, p.tx, e);
        }
      }
    }
    return segs;
  }, [nodes, edges]);

  // Build overlap intervals by grouping collinear segments and sweeping endpoints
  const overlays = useMemo(() => {
    type Overlay = { axis:'h'|'v'; coord:number; from:number; to:number; colors:string[]; width:number };
    const out: Overlay[] = [];
    // Group key by axis + coord (within EPS)
    const groups: Array<{ axis:'h'|'v'; coord:number; list: Seg[] }>=[];
    segments.forEach((s) => {
      let g = groups.find(gr => gr.axis===s.axis && Math.abs(gr.coord - s.coord) <= EPS);
      if (!g) { g = { axis: s.axis, coord: s.coord, list: [] }; groups.push(g); }
      g.list.push(s);
    });
    for (const g of groups) {
      if (g.list.length < 2) continue;
      // Collect breakpoints
      const pts: number[] = [];
      g.list.forEach(s => { pts.push(s.a, s.b); });
      pts.sort((a,b)=>a-b);
      for (let i=0;i<pts.length-1;i++){
        const a = pts[i], b = pts[i+1];
        if (b - a < 2) continue; // too small
        // active segments covering [a,b]
        const active = g.list.filter(s => s.a <= a + EPS && s.b >= b - EPS);
        if (active.length >= 2) {
          const colors = active.map(s => ({ id: s.edge.id as string, color: colorOf(s.edge), w: widthOf(s.edge) }))
            .sort((A,B)=> A.id.localeCompare(B.id))
            .map(o=>o.color);
          const width = Math.max(...active.map(s => widthOf(s.edge)));
          out.push({ axis: g.axis, coord: g.coord, from: a, to: b, colors, width });
        }
      }
    }
    return out;
  }, [segments]);

  if (!overlays.length) return null;

  const dash = 6; // pixels per color dash (in scene space)
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60 }}>
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        {/* Apply the same transform as the viewport so we draw in scene coordinates */}
        <g style={{ transform: `matrix(${tz},0,0,${tz},${tx},${ty})`, transformOrigin: '0 0' }}>
          {overlays.map((o, idx) => {
            const pathD = o.axis==='h' ? `M ${o.from} ${o.coord} L ${o.to} ${o.coord}` : `M ${o.coord} ${o.from} L ${o.coord} ${o.to}`;
            const totalColors = o.colors.length;
            return (
              <g key={idx}>
                {o.colors.map((c, k) => (
                  <path
                    key={k}
                    d={pathD}
                    fill="none"
                    stroke={c}
                    strokeWidth={o.width}
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                    style={{
                      strokeDasharray: `${dash} ${Math.max(1,(totalColors-1))*dash}`,
                      strokeDashoffset: `${k * dash}`,
                    }}
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
