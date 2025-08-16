"use client";
import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import { Handle, Position, useStore } from 'reactflow';
import { Boxes, Lock, Unlock } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { CONTAINER_HEADER_HEIGHT } from '../constants';
import { hexToRgba, autoTextColor } from '../diagram-helpers';
import { effectiveBorderColor, effectiveBgColor, isAuto } from '../color-utils';

// Ensure brick texture generator (used for firewall ring) is available after refactor.
function generateBrickTexture() {
  if (typeof document === 'undefined') return { urlH:'', urlV:'', size:24, offX:0, offY:0, shiftTopY:0, shiftSideX:0 };
  // Return cached if exists
  const w = window as any;
  if (w.__brickTexCache) return w.__brickTexCache;
  const size = 24; // tile size
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  const gap = 4; const margin = gap/2; const brickW = size - margin*2; const brickH = Math.round(size*0.5) - gap; const stroke = '#0f172a'; const fill = '#ea580c'; const mortar = '#000000';
  ctx.fillStyle = mortar; ctx.fillRect(0,0,size,size);
  ctx.beginPath(); ctx.rect(margin, Math.floor((size-brickH)/2), brickW, brickH); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth=1; ctx.strokeStyle=stroke; ctx.stroke();
  const urlH = canvas.toDataURL('image/png');
  const canvasV = document.createElement('canvas'); canvasV.width = size; canvasV.height = size; const ctxV = canvasV.getContext('2d')!; ctxV.imageSmoothingEnabled=false; ctxV.translate(size,0); ctxV.rotate(Math.PI/2); ctxV.drawImage(canvas,0,0); const urlV = canvasV.toDataURL('image/png');
  // Precompute offsets relative to ring thickness T
  const T = 12; const yOffset = Math.floor((size-brickH)/2); const shiftTopY = Math.round(-((yOffset + brickH/2) - T/2)); const shiftSideX = shiftTopY; // symmetrical
  const cache = { urlH, urlV, size, offX: margin, offY: yOffset, shiftTopY, shiftSideX };
  w.__brickTexCache = cache; w.__getBrickTexture = () => cache;
  return cache;
}

if (typeof window !== 'undefined' && !(window as any).__getBrickTexture) {
  try { generateBrickTexture(); } catch { /* ignore */ }
}

const getBrickTexture = () => {
  if (typeof window === 'undefined') return { urlH:'', urlV:'', size:24, offX:0, offY:0, shiftTopY:0, shiftSideX:0 };
  const w = window as any;
  if (w.__getBrickTexture) return w.__getBrickTexture();
  return generateBrickTexture();
};

const FeaturesIcons = ({ features, compact }: any) => {
  const { auth1, auth2, hourglass } = features || {};
  const cls = compact ? 'text-[11px]' : 'text-sm';
  return (
    <div className={`flex items-center gap-1 leading-none ${cls}`}>
      {auth2 ? <span title="Double authentification" className="select-none">🔑🔑</span> : auth1 ? <span title="Authentification" className="select-none">🔑</span> : null}
      {hourglass && <span title="En attente" className="select-none">⏳</span>}
    </div>
  );
};

interface ComponentNodeProps {
  id: string;
  data: any;
  selected: boolean;
  isConnectable: boolean;
  xPos: number; yPos: number;
}

const ComponentNode = memo(({ id, data, selected, isConnectable }: ComponentNodeProps) => {
  const zoom = useStore((s) => s.transform[2]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { label = 'Component', icon, color, features = {}, bgColor, bgOpacity = 1, isContainer = false, width = 520, height = 320, locked = false, widthMode = 'fixed', customWidth } = data || {};
  const autoRef = useRef<HTMLDivElement|null>(null);
  const [autoW, setAutoW] = useState<number>();
  const borderColor = effectiveBorderColor(color, isDark);
  const baseBg = effectiveBgColor(bgColor, isDark);
  const bg = hexToRgba(baseBg, bgOpacity);
  const showText = zoom >= 0.6;
  // dynamic label color if auto background
  const labelColorClass = !isContainer && isAuto(bgColor) ? (isDark ? 'text-slate-100' : 'text-slate-800') : '';
  const handleSize = 10;
  const showHandles = isContainer && selected && !locked;

  const startResize = (e: React.MouseEvent, dir: string) => {
    if (!isContainer) return;
    e.preventDefault(); e.stopPropagation();
    if ((e.nativeEvent as any)?.stopImmediatePropagation) (e.nativeEvent as any).stopImmediatePropagation();
    const startX = e.clientX, startY = e.clientY; const startW = width, startH = height;
    document.body.classList.add('resizing-container');
    const move = (ev: MouseEvent) => {
      let dw = ev.clientX - startX; let dh = ev.clientY - startY;
      let newW = startW; let newH = startH;
      if (dir.includes('e')) newW = Math.max(200, startW + dw);
      if (dir.includes('s')) newH = Math.max(140, startH + dh);
      if (dir.includes('w')) newW = Math.max(200, startW - dw);
      if (dir.includes('n')) newH = Math.max(140, startH - dh);
      const setNodesFn = (window as any).__setDiagramNodes;
      if (typeof setNodesFn === 'function') {
        setNodesFn((nds: any[]) => nds.map(n => n.id === id ? { ...n, draggable: false, data: { ...n.data, width: newW, height: newH }, style: { ...(n.style||{}), width: newW, height: newH } } : n));
      }
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.classList.remove('resizing-container'); const setNodesFn = (window as any).__setDiagramNodes; if (typeof setNodesFn === 'function') setNodesFn((nds: any[]) => nds.map(n => n.id === id ? { ...n, draggable: true } : n)); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const headerPos = (data?.headerPos || 'top') as 'top'|'left';
  if (isContainer) {
    const tex = getBrickTexture();
    return (
      <div className="relative" style={{ width, height, ['--fwtexH' as any]: features?.firewall ? `url('${tex.urlH}')` : undefined, ['--fwtexV' as any]: features?.firewall ? `url('${tex.urlV}')` : undefined, ['--fwtexSize' as any]: features?.firewall ? `${tex.size}px ${tex.size}px` : undefined, ['--fwtexOffX' as any]: `${tex.offX}px`, ['--fwtexOffY' as any]: `${tex.offY}px`, ['--fwShiftTopY' as any]: `${tex.shiftTopY}px`, ['--fwShiftSideX' as any]: `${tex.shiftSideX}px`, ['--ringGapInner' as any]: '8px', ['--ringThickness' as any]: '14px' }}>
        {features?.firewall && (
          <div className="firewall-ring rounded-2xl">
            <div className="fw-top" />
            <div className="fw-bottom" />
            <div className="fw-left" />
            <div className="fw-right" />
            <div className="fw-badge dark:!bg-amber-400/90 dark:!text-slate-900 dark:!border-amber-500" title="Firewall activé" aria-label="firewall">🛡️</div>
          </div>
        )}
        <div className={`rounded-2xl overflow-hidden relative ${selected ? 'container-sel' : ''}`} style={{ width: '100%', height: '100%', border: `1px solid ${borderColor}`, background: bg, paddingTop: headerPos==='top'?CONTAINER_HEADER_HEIGHT:0, paddingLeft: headerPos==='left'?CONTAINER_HEADER_HEIGHT:0 }}>
          {headerPos==='top' && (
          <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-3 py-2 bg-white/90 dark:bg-slate-900/70 backdrop-blur border-b" style={{ borderColor: borderColor, height: CONTAINER_HEADER_HEIGHT }}>
            {icon ? (
              <div className="h-8 w-8 rounded-xl bg-white/70 dark:bg-slate-800/70 border flex items-center justify-center overflow-hidden shadow-sm">
                <img src={icon} alt="" className="max-h-7 max-w-7 object-contain" />
              </div>
            ) : (
              <Boxes className="h-5 w-5" />
            )}
            <div className="font-semibold text-gray-800 dark:text-slate-100 truncate" title={label}>{label}</div>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
              <FeaturesIcons features={features} compact />
              {locked ? <Lock className="h-3.5 w-3.5"/> : <Unlock className="h-3.5 w-3.5"/>}
            </div>
          </div>)}
          {headerPos==='left' && (
          <div className="absolute top-0 bottom-0 left-0 flex flex-col items-center justify-start gap-3 px-2 py-3 bg-white/90 dark:bg-slate-900/70 backdrop-blur border-r" style={{ borderColor: borderColor, width: CONTAINER_HEADER_HEIGHT }}>
            {icon ? (
              <div className="h-8 w-8 rounded-xl bg-white/70 dark:bg-slate-800/70 border flex items-center justify-center overflow-hidden shadow-sm">
                <img src={icon} alt="" className="max-h-7 max-w-7 object-contain" />
              </div>
            ) : (
              <Boxes className="h-5 w-5" />
            )}
            <div className="font-semibold text-gray-800 dark:text-slate-100 truncate [writing-mode:vertical-rl] rotate-180" title={label}>{label}</div>
            <div className="mt-auto flex flex-col items-center gap-2 text-[10px] text-slate-600">
              <FeaturesIcons features={features} compact />
              {locked ? <Lock className="h-3.5 w-3.5"/> : <Unlock className="h-3.5 w-3.5"/>}
            </div>
          </div>)}
          {showHandles && (
            <>
              <div data-resize onMouseDownCapture={(e)=>startResize(e,'e')} className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 cursor-ew-resize bg-blue-500/80 hover:bg-blue-500 rounded-full shadow z-10" style={{ width: handleSize, height: handleSize }} />
              <div data-resize onMouseDownCapture={(e)=>startResize(e,'s')} className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize bg-blue-500/80 hover:bg-blue-500 rounded-full shadow z-10" style={{ width: handleSize, height: handleSize }} />
              <div data-resize onMouseDownCapture={(e)=>startResize(e,'se')} className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 cursor-nwse-resize bg-blue-600 hover:bg-blue-500 rounded-md shadow z-10" style={{ width: handleSize+2, height: handleSize+2 }} />
            </>
          )}
        </div>
      </div>
    );
  }

  const tex = getBrickTexture();
  // Service node width computation
  let serviceWidth: number | undefined;
  if (widthMode === 'fixed') {
    serviceWidth = 240; // legacy fixed width
  } else if (widthMode === 'custom') {
    serviceWidth = Math.max(140, Math.min(800, customWidth || 240));
  } // auto: undefined => shrink to fit via inline-flex

  // Measure auto width (content + instance tabs) after paint
  useLayoutEffect(() => {
    if (widthMode !== 'auto') { setAutoW(undefined); return; }
    const el = autoRef.current; if (!el) return;
    // Temporarily allow content to shrink so we can measure intrinsic width
    const prevWidth = el.style.width;
    const prevMinWidth = el.style.minWidth;
    el.style.width = 'fit-content';
    el.style.minWidth = '0';
    // Measure base content width (exclude absolute tabs)
    let w = el.scrollWidth;
    // Measure instance tabs (absolute) and ensure container can fit them
    const tabs = el.querySelector('[data-instance-tabs] .flex');
    if (tabs instanceof HTMLElement) {
      const tabsW = tabs.scrollWidth + 16; // small padding allowance
      if (tabsW > w) w = tabsW;
    }
    // Clamp
    w = Math.max(140, Math.min(w, 1000));
    // Restore before applying state to avoid flicker
    el.style.width = prevWidth;
    el.style.minWidth = prevMinWidth;
    if (!autoW || Math.abs(autoW - w) > 0.5) setAutoW(w);
  }, [widthMode, label, data?.instances, features, icon, borderColor, bgColor, customWidth]);

  return (
    <div className="relative inline-block" style={{ ['--fwtexH' as any]: features?.firewall ? `url('${tex.urlH}')` : undefined, ['--fwtexV' as any]: features?.firewall ? `url('${tex.urlV}')` : undefined, ['--fwtexSize' as any]: features?.firewall ? `${tex.size}px ${tex.size}px` : undefined, ['--fwtexOffX' as any]: `${tex.offX}px`, ['--fwtexOffY' as any]: `${tex.offY}px`, ['--fwShiftTopY' as any]: `${tex.shiftTopY}px`, ['--fwShiftSideX' as any]: `${tex.shiftSideX}px`, ['--ringGapInner' as any]: '5px', ['--ringThickness' as any]: '12px' }}>
        {features?.firewall && (
          <div className="firewall-ring rounded-2xl">
          <div className="fw-top" />
          <div className="fw-bottom" />
          <div className="fw-left" />
          <div className="fw-right" />
            <div className="fw-badge dark:!bg-amber-400/90 dark:!text-slate-900 dark:!border-amber-500" title="Firewall activé" aria-label="firewall">🛡️</div>
        </div>
      )}
  { /* Service body */ }
  {(() => {
    const hasNetworks = Array.isArray(data?.networkColors) && data.networkColors.length > 0;
    return (
  <div ref={widthMode==='auto'?autoRef:undefined} className={"group rounded-2xl shadow-lg px-2 pt-1 pb-1 hover:shadow-xl transition overflow-visible border relative dark:shadow-slate-950/40 " + (widthMode==='auto' ? ' inline-flex items-center' : '')}
       style={{ borderColor, background: bg, width: widthMode==='auto' ? (autoW? `${autoW}px` : undefined) : serviceWidth }}>
        {hasNetworks && (
          <div className="pointer-events-none absolute h-1.5 flex overflow-hidden"
               style={{ top:0, left:4, right:4, borderTopLeftRadius:'calc(1rem - 4px)', borderTopRightRadius:'calc(1rem - 4px)', clipPath:'inset(0 0 0 0 round calc(1rem - 4px) calc(1rem - 4px) 0 0)' }}>
            {data.networkColors.slice(0,8).map((c:string, i:number) => (<div key={i} className="flex-1" style={{ background: c }} />))}
            {data.networkColors.length > 8 && <div className="px-1 text-[9px] leading-none bg-slate-50/80 text-slate-700">+{data.networkColors.length-8}</div>}
          </div>
        )}
        {selected && <div className="absolute inset-0 rounded-2xl border-2 border-blue-500 pointer-events-none" />}
        <Handle type="target" position={Position.Top} className={`handle-lg !bg-gray-500/80 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} isConnectable={isConnectable} />
        <Handle type="source" position={Position.Bottom} className={`handle-lg !bg-gray-500/80 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} isConnectable={isConnectable} />
        <Handle type="target" position={Position.Left} className={`handle-lg !bg-gray-500/80 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} isConnectable={isConnectable} />
        <Handle type="source" position={Position.Right} className={`handle-lg !bg-gray-500/80 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} isConnectable={isConnectable} />
  <div className={"flex items-center gap-2 min-w-0 transition-all " + (hasNetworks ? 'mt-1' : '')}>
          {icon ? <img src={icon} alt="" className="h-7 w-7 object-contain rounded" /> : <div className="h-7 w-7 rounded bg-gray-200 dark:bg-slate-600" />}
          {showText && <div className={`font-medium text-sm truncate flex-1 ${labelColorClass} dark:text-slate-100`} title={label || 'Unnamed'}>{label || 'Unnamed'}</div>}
          <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ background: borderColor }} />
          <FeaturesIcons features={features} compact={!showText} />
        </div>
        {Array.isArray(data?.instances) && data.instances.length > 0 && (
          (() => {
            const list = data.instances as any[]; const MAX = 7; const shown = list.slice(0, MAX); const more = list.length - shown.length;
            const short = (s?: string) => { const v = (s || 'inst').toString(); return v.length > 10 ? `${v.slice(0, 8)}…` : v; };
            return (
              <div className="absolute top-0 left-2 right-2 z-[5] pointer-events-none transform -translate-y-full" data-instance-tabs>
                <div className="flex items-end gap-1">
                  {shown.map((ins: any, i: number) => (
                    <div key={i} className="pointer-events-none px-1.5 py-0.5 rounded-t-lg border border-b-0 text-[10px] shadow-sm max-w-[100px] flex items-center gap-0.5" style={{ borderColor, background: ins?.bgColor ? ins.bgColor : 'linear-gradient(to bottom, #ffffff, #f8fafc)', color: ins?.fgColor ? ins.fgColor : (ins?.bgColor ? autoTextColor(ins.bgColor) : '#111827') }}>
                      <span className="font-mono truncate" style={{ maxWidth: '66px' }}>{short(ins?.id)}</span>
                      {ins?.auth ? (<span className="inline-flex flex-col leading-[0.8] text-[9px]"><span>🔑</span>{ins.auth === 'auth2' && <span>🔑</span>}</span>) : null}
                    </div>
                  ))}
                  {more > 0 && (<div className="pointer-events-none px-2 py-0.5 rounded-t-lg border border-b-0 text-slate-600 text-[10px] shadow-sm bg-slate-50" style={{ borderColor }}>+{more}</div>)}
                </div>
              </div>
            );
          })()
        )}
    </div>
      ); })()}
    </div>
  );
});

export default ComponentNode;
