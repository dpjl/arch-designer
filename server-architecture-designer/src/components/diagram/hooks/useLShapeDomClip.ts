import { useEffect } from 'react';
import { generateLShapeClipPath } from '../utils/lshape-utils';

/**
 * Apply CSS clip-path to React Flow node wrappers for L-shaped nodes so the hollow corner is non-interactive.
 */
export function useLShapeDomClip(nodes: any[]) {
  useEffect(() => {
    try {
      nodes.forEach((n) => {
        if (!n?.data) return;
        const el = document.querySelector(`[data-id="${n.id}"]`) as HTMLElement | null;
        if (!el) return;
        const isL = (n.data?.shape === 'l-shape') && !!n.data?.lShape;
        if (isL) {
          const w = (n.data?.width || n.style?.width || n.width || (n.type==='network'?420:520)) as number;
          const h = (n.data?.height || n.style?.height || n.height || (n.type==='network'?240:320)) as number;
          const clip = generateLShapeClipPath(w, h, n.data.lShape);
          el.style.clipPath = clip;
        } else {
          el.style.clipPath = '';
        }
      });
    } catch {}
  }, [nodes]);
}
