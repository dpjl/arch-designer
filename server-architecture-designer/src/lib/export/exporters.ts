import jsPDF from 'jspdf';
import { toPngSafe } from './htmlToImageSafe';
import { Rect, getExportPixelRatio, waitFontsReady, waitFrames, parseViewportTransform } from './viewport';

export async function exportViewportCropToPng(viewportEl: HTMLElement, crop: Rect, pixelRatio?: number): Promise<string> {
  const vp = viewportEl.getBoundingClientRect();
  const pr = pixelRatio ?? getExportPixelRatio(vp.width, vp.height);
  await waitFontsReady();
  await waitFrames(2);
  const full = await toPngSafe(viewportEl, { pixelRatio: pr });
  const base = await new Promise<HTMLImageElement>((resolve) => { const im = new Image(); im.onload = () => resolve(im); im.src = full; });
  const imgW = base.width, imgH = base.height;
  const sx = Math.max(0, Math.min(imgW, Math.round(crop.x * pr)));
  const sy = Math.max(0, Math.min(imgH, Math.round(crop.y * pr)));
  const sw = Math.max(1, Math.min(imgW - sx, Math.round(crop.w * pr)));
  const sh = Math.max(1, Math.min(imgH - sy, Math.round(crop.h * pr)));
  const canvas = document.createElement('canvas'); canvas.width = sw; canvas.height = sh;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('no ctx');
  ctx.imageSmoothingEnabled = true; (ctx as any).imageSmoothingQuality = 'high';
  ctx.drawImage(base, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL('image/png');
}

export async function exportViewportCropToPdf(viewportEl: HTMLElement, crop: Rect, orientation: 'portrait'|'landscape' = 'portrait'): Promise<jsPDF> {
  const dataUrl = await exportViewportCropToPng(viewportEl, crop);
  const base = await new Promise<HTMLImageElement>((resolve)=>{ const im=new Image(); im.onload=()=>resolve(im); im.src=dataUrl; });
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageSize = doc.internal.pageSize;
  const pageW = pageSize.getWidth();
  const pageH = pageSize.getHeight();
  const margin = 10; const availW = pageW - margin*2; const availH = pageH - margin*2;
  const scale = Math.min(availW / base.width, availH / base.height);
  const renderW = base.width * scale; const renderH = base.height * scale;
  const offX = (pageW - renderW)/2; const offY = (pageH - renderH)/2;
  doc.addImage(dataUrl, 'PNG', offX, offY, renderW, renderH);
  return doc;
}

export async function fitAndExportSelection(viewportEl: HTMLElement, selectionScene: Rect, padding = 8): Promise<string> {
  const vpRect = viewportEl.getBoundingClientRect();
  const targetScale = Math.min((vpRect.width - padding*2) / selectionScene.w, (vpRect.height - padding*2) / selectionScene.h);
  const tx2 = Math.round((vpRect.width - selectionScene.w * targetScale) / 2 - selectionScene.x * targetScale);
  const ty2 = Math.round((vpRect.height - selectionScene.h * targetScale) / 2 - selectionScene.y * targetScale);
  const prevTransform = viewportEl.style.transform;
  const prevOrigin = viewportEl.style.transformOrigin;
  viewportEl.style.transformOrigin = '0 0';
  viewportEl.style.transform = `matrix(${targetScale}, 0, 0, ${targetScale}, ${tx2}, ${ty2})`;
  await waitFontsReady();
  await waitFrames(2);
  const pr = getExportPixelRatio(vpRect.width, vpRect.height);
  const fullUrl = await toPngSafe(viewportEl, { pixelRatio: pr });
  viewportEl.style.transform = prevTransform;
  viewportEl.style.transformOrigin = prevOrigin;
  const objW = Math.ceil(selectionScene.w * targetScale);
  const objH = Math.ceil(selectionScene.h * targetScale);
  const cx = Math.max(0, Math.floor((vpRect.width - objW) / 2) - padding);
  const cy = Math.max(0, Math.floor((vpRect.height - objH) / 2) - padding);
  const cw = Math.min(Math.ceil(vpRect.width - cx), objW + padding * 2);
  const ch = Math.min(Math.ceil(vpRect.height - cy), objH + padding * 2);
  return await exportViewportCropToPng(viewportEl, { x: cx, y: cy, w: cw, h: ch }, pr);
}

export async function exportFullDiagram(viewportEl: HTMLElement, scene: Rect, padding = 12): Promise<string> {
  // Preserve current zoom scale to avoid re-layout/rounding glitches
  const { scale } = parseViewportTransform(viewportEl);
  const outW = Math.ceil(scene.w * scale + padding * 2);
  const outH = Math.ceil(scene.h * scale + padding * 2);
  const off = document.createElement('div');
  off.style.position = 'fixed'; off.style.left = '-10000px'; off.style.top = '0';
  off.style.width = `${outW}px`; off.style.height = `${outH}px`;
  off.style.background = '#ffffff'; off.style.overflow = 'visible';

  // Clone the full React Flow container to include edges and nodes, not just the viewport
  const root = (viewportEl.closest('.react-flow') as HTMLElement) || (viewportEl.closest('.react-flow__renderer') as HTMLElement) || viewportEl;
  const cloneRoot = root.cloneNode(true) as HTMLElement;
  cloneRoot.classList.add('rf-exporting');
  // Apply transform to the cloned viewport inside the cloned root
  const vpClone = cloneRoot.querySelector('.react-flow__viewport') as HTMLElement | null;
  const target = vpClone || cloneRoot;
  target.style.transformOrigin = '0 0';
  target.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${-scene.x * scale + padding}, ${-scene.y * scale + padding})`;
  target.style.willChange = 'transform';
  (target.style as any).backfaceVisibility = 'hidden';

  off.appendChild(cloneRoot); document.body.appendChild(off);
  // Inline external images to prevent CORS taint
  await inlineExternalImages(cloneRoot);
  await waitFontsReady(); await waitFrames(2);
  const pr = getExportPixelRatio(outW, outH);
  const dataUrl = await toPngSafe(cloneRoot, { pixelRatio: pr, width: outW, height: outH, backgroundColor: '#ffffff' });
  document.body.removeChild(off);
  return dataUrl;
}

// Replace external <img> src with data URLs to avoid CORS/taint issues during html-to-image rendering
async function inlineExternalImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(imgs.map(async (img) => {
    const src = img.getAttribute('src') || '';
    if (!src || src.startsWith('data:')) return;
    try {
      const res = await fetch(src, { mode: 'cors' });
      if (!res.ok) throw new Error(`fetch ${src} -> ${res.status}`);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const rdr = new FileReader();
        rdr.onload = () => resolve(String(rdr.result));
        rdr.onerror = reject;
        rdr.readAsDataURL(blob);
      });
      img.setAttribute('crossorigin', 'anonymous');
      img.src = dataUrl;
      // small yield for layout
      await waitFrames(1);
    } catch (_) {
      // As last resort, hide image to avoid blank result
      img.style.visibility = 'hidden';
    }
  }));
}
