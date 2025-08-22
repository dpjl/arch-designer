"use client";
import { useCallback, useRef, useState } from 'react';

export function useViewModePan(
  viewLocked: boolean,
  getViewport: () => { x: number; y: number; zoom: number },
  setViewport: (vp: { x: number; y: number; zoom: number }) => void
) {
  const [isPanning, setIsPanning] = useState(false);
  const panLastRef = useRef<{ x: number; y: number } | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewLocked) return;
    if (e.button !== 0) return; // left button only
    e.preventDefault();
    e.stopPropagation();
    panLastRef.current = { x: e.clientX, y: e.clientY };
    setIsPanning(true);
    const move = (ev: MouseEvent) => {
      const last = panLastRef.current; if (!last) return;
      const dx = ev.clientX - last.x; const dy = ev.clientY - last.y;
      panLastRef.current = { x: ev.clientX, y: ev.clientY };
      try {
        const vp = getViewport();
        setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom });
      } catch {}
    };
    const up = () => {
      setIsPanning(false);
      panLastRef.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [viewLocked, getViewport, setViewport]);

  return { isPanning, onMouseDown } as const;
}
