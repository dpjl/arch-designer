export type Rect = { x: number; y: number; w: number; h: number };

export const getExportPixelRatio = (w: number, h: number) => {
  const dpr = (typeof window !== 'undefined' && (window.devicePixelRatio || 1)) || 1;
  const maxLongest = 4096;
  const longest = Math.max(1, Math.max(w, h));
  let ratio = Math.max(2, Math.min(5, (maxLongest / longest) * dpr));
  const maxPixels = 28_000_000;
  const curPixels = w * h * ratio * ratio;
  if (curPixels > maxPixels) {
    ratio = Math.sqrt(maxPixels / Math.max(1, w * h));
  }
  ratio = Math.max(1.5, Math.min(5, ratio));
  return ratio;
};

export const parseViewportTransform = (el: HTMLElement) => {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return { scale: 1, tx: 0, ty: 0 };
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return { scale: 1, tx: 0, ty: 0 };
  const parts = m[1].split(',').map(v=>parseFloat(v.trim()));
  const a = parts[0] ?? 1; const d = parts[3] ?? a; const e = parts[4] ?? 0; const f = parts[5] ?? 0;
  const scale = a;
  return { scale, tx: e, ty: f };
};

export const computeTightBounds = (viewportEl: HTMLElement): Rect => {
  const vpRect = viewportEl.getBoundingClientRect();
  const elems = [
    ...Array.from(viewportEl.querySelectorAll('.react-flow__node')) as Element[],
    ...Array.from(viewportEl.querySelectorAll('.react-flow__edge-path')) as Element[],
  ] as HTMLElement[];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  elems.forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    minX = Math.min(minX, r.left - vpRect.left);
    minY = Math.min(minY, r.top - vpRect.top);
    maxX = Math.max(maxX, r.right - vpRect.left);
    maxY = Math.max(maxY, r.bottom - vpRect.top);
  });
  if (!isFinite(minX)) return { x: 0, y: 0, w: vpRect.width, h: vpRect.height };
  return { x: Math.max(0, Math.floor(minX)), y: Math.max(0, Math.floor(minY)), w: Math.ceil(maxX - minX), h: Math.ceil(maxY - minY) };
};

export const waitFrames = async (count: number = 2) => {
  for (let i = 0; i < count; i++) {
    await new Promise<void>(r => requestAnimationFrame(() => r()));
  }
};

export const waitFontsReady = async () => {
  try { await (document as any).fonts?.ready; } catch {}
};
