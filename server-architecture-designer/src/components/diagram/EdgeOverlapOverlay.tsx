"use client";
import React, { memo, useMemo, useEffect, useState } from 'react';
import { OverlapSegment } from './edge-overlap';
import { useStore } from 'reactflow';
import { createPortal } from 'react-dom';

function dashPattern(totalColors: number, segPx = 8): string {
  // Create evenly spaced dash-gaps; we'll render multiple strokes stacked
  return `${segPx} ${segPx * (totalColors - 1)}`;
}
// Compute a base dash offset so segment end lands on a pattern boundary,
// then phase each color by +i*segPx to alternate colors. This clips the last
// dash exactly at the elbow/end instead of overshooting.
function perColorDashOffset(idx: number, segLength: number, totalColors: number, segPx = 8): number {
  const period = segPx * totalColors; // one full color cycle
  const base = (period - (segLength % period)) % period; // align end to boundary
  return base + idx * segPx;
}

const EdgeOverlapOverlay = memo(({ segments }: { segments: OverlapSegment[] }) => {
  const storeTransform = useStore((s) => s.transform) as unknown as [number, number, number];
  const [viewportEl, setViewportEl] = useState<HTMLElement | null>(null);
  const [edgesSvg, setEdgesSvg] = useState<SVGSVGElement | null>(null);
  // Locate the viewport once (client-side)
  useEffect(() => {
    let stopped = false;
    const tryFind = () => {
      if (stopped) return;
      const vp = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      let es: SVGSVGElement | null = null;
      const edgesContainer = document.querySelector('.react-flow__edges') as HTMLElement | null;
      if (edgesContainer) {
        es = (edgesContainer.querySelector('svg') as SVGSVGElement | null) || (edgesContainer as unknown as SVGSVGElement);
      } else {
        es = document.querySelector('.react-flow__edges svg') as SVGSVGElement | null;
      }
      if (vp) setViewportEl(vp);
      if (es) setEdgesSvg(es);
      if (vp && es) { stopped = true; return; }
      // retry next frame
      requestAnimationFrame(tryFind);
    };
    tryFind();
    return () => { stopped = true; };
  }, []);

  // Fallback transform for non-portal render
  const [tx, ty, zoom] = useMemo(() => (Array.isArray(storeTransform) ? storeTransform : ([0, 0, 1] as [number, number, number])), [storeTransform]);

  if (!segments.length) return null;

  const svg = (
    <svg className="pointer-events-none" width="100%" height="100%" style={{ display: 'block' }}>
      {segments.map((s) => {
        const L = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        return (
          <g key={s.id}>
            {s.colors.map((col, i) => (
              <line
                key={`${s.id}-${i}`}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke={col}
                strokeWidth={Math.max(2, s.strokeWidth)}
                strokeLinecap="butt"
                strokeDasharray={dashPattern(s.colors.length)}
                strokeDashoffset={perColorDashOffset(i, L, s.colors.length)}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );

  // Preferred: render inside the edges SVG as a <g> so draw order is above edges and included in exports
  if (edgesSvg) {
    return createPortal(
      <g data-edge-overlap-overlay style={{ pointerEvents: 'none' } as any}>
        {segments.map((s) => {
          const L = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
          return (
            <g key={s.id}>
              {s.colors.map((col, i) => (
                <line
                  key={`${s.id}-${i}`}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke={col}
                  strokeWidth={Math.max(2, s.strokeWidth)}
                  strokeLinecap="butt"
                  strokeDasharray={dashPattern(s.colors.length)}
                  strokeDashoffset={perColorDashOffset(i, L, s.colors.length)}
                />
              ))}
            </g>
          );
        })}
      </g>,
      edgesSvg
    );
  }

  // Next: render inside the viewport so exports/prints include and align it
  if (viewportEl) {
    return createPortal(
      <div data-edge-overlap-overlay className="pointer-events-none" style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
        {svg}
      </div>,
      viewportEl
    );
  }

  // Fallback: absolute overlay with manual transform
  return (
    <div data-edge-overlap-overlay className="pointer-events-none absolute inset-0" style={{ zIndex: 60 }}>
      <svg
        className="pointer-events-none overflow-visible"
        style={{ transformOrigin: '0 0', transform: `matrix(${zoom}, 0, 0, ${zoom}, ${tx}, ${ty})` }}
        width="100%"
        height="100%"
      >
        {segments.map((s) => {
          const L = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
          return (
            <g key={s.id}>
              {s.colors.map((col, i) => (
                <line
                  key={`${s.id}-${i}`}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke={col}
                  strokeWidth={Math.max(2, s.strokeWidth)}
                  strokeLinecap="butt"
                  strokeDasharray={dashPattern(s.colors.length)}
                  strokeDashoffset={perColorDashOffset(i, L, s.colors.length)}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default EdgeOverlapOverlay;
