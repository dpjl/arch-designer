"use client";
import React, { memo } from 'react';
import { OverlapSegment } from './edge-overlap';
import { useStore } from 'reactflow';

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
  const transform = useStore((s) => s.transform) as unknown as [number, number, number];
  const [tx, ty, zoom] = Array.isArray(transform) ? transform : [0, 0, 1];
  if (!segments.length) return null;
  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{
        zIndex: 60,
        transformOrigin: '0 0',
        transform: `matrix(${zoom}, 0, 0, ${zoom}, ${tx}, ${ty})`,
      }}
    >
      {segments.map((s) => {
        const L = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        // Stack N strokes with equal dash patterns but phase shifted to alternate colors
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
});

export default EdgeOverlapOverlay;
