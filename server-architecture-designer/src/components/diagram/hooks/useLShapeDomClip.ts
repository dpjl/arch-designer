import { useEffect } from 'react';

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
  // For L-shaped nodes, make the RF wrapper ignore pointer events to let inner clipped content and underlying elements receive events.
  // Avoid applying clip-path on the wrapper to preserve visual overlays like the firewall ring.
  el.style.pointerEvents = isL ? 'none' : '';
      });
    } catch {}
  }, [nodes]);
}
