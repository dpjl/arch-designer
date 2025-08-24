// Shared runtime-generated PNG brick texture for firewall rings.
// Caches on window to avoid re-creating across components.

export type BrickTexture = { urlH: string; urlV: string; size: number; offX: number; offY: number; shiftTopY: number; shiftSideX: number };

function generate(): BrickTexture {
  if (typeof document === 'undefined') return { urlH: '', urlV: '', size: 24, offX: 0, offY: 0, shiftTopY: 0, shiftSideX: 0 };
  const size = 24; // tile size
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  const gap = 4; const margin = gap/2; const brickW = size - margin*2; const brickH = Math.round(size*0.5) - gap;
  const stroke = '#0f172a'; const fill = '#ea580c'; const mortar = '#000000';
  ctx.fillStyle = mortar; ctx.fillRect(0,0,size,size);
  ctx.beginPath(); ctx.rect(margin, Math.floor((size-brickH)/2), brickW, brickH);
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke();
  const urlH = canvas.toDataURL('image/png');
  // vertical rotated tile
  const canvasV = document.createElement('canvas'); canvasV.width = size; canvasV.height = size;
  const ctxV = canvasV.getContext('2d')!; ctxV.imageSmoothingEnabled = false;
  ctxV.translate(size, 0); ctxV.rotate(Math.PI/2); ctxV.drawImage(canvas, 0, 0);
  const urlV = canvasV.toDataURL('image/png');
  // Centering offsets relative to a typical ring thickness T
  const T = 12; const yOffset = Math.floor((size - brickH) / 2);
  const brickCenterY = yOffset + brickH/2;
  const brickCenterX = margin + brickW/2;
  const shiftTopY = Math.round(-(brickCenterY - T/2));
  const shiftSideX = Math.round(-(brickCenterX - T/2));
  return { urlH, urlV, size, offX: margin, offY: yOffset, shiftTopY, shiftSideX };
}

export function getBrickTexture(): BrickTexture {
  if (typeof window === 'undefined') return { urlH: '', urlV: '', size: 24, offX: 0, offY: 0, shiftTopY: 0, shiftSideX: 0 };
  const w = window as any;
  if (!w.__brickTexCache) {
    try { w.__brickTexCache = generate(); } catch { w.__brickTexCache = { urlH:'', urlV:'', size:24, offX:0, offY:0, shiftTopY:0, shiftSideX:0 }; }
  }
  return w.__brickTexCache as BrickTexture;
}
