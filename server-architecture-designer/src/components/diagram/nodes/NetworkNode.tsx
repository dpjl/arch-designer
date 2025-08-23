"use client";
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT, GRID_SIZE } from '../constants';
import { hexToRgba, autoTextColor } from '../diagram-helpers';

interface NetworkNodeProps { id: string; data: any; selected: boolean; isConnectable: boolean; }

const NetworkNode = memo(({ id, data, selected, isConnectable }: NetworkNodeProps) => {
  const { label = 'Network', color = '#10b981', textColor, width = 420, height = 240, headerPos = 'top' } = data || {};
  const partitions = Math.max(1, Math.min(12, parseInt(String(data?.partitions ?? 1), 10) || 1));
  const text = textColor || '#0f172a';
  const bgTint = hexToRgba(color || '#10b981', 0.08);
  const mixHex = (hexA?: string, hexB?: string, wb: number = 0.5) => {
    const parse = (h?: string): [number,number,number] | null => {
      if (!h || typeof h !== 'string') return null;
      const m = h.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
      if (!m) return null;
      let s = m[1];
      if (s.length === 3) s = s.split('').map(c=>c+c).join('');
      const v = parseInt(s, 16);
      return [(v>>16)&255, (v>>8)&255, v&255];
    };
    const a = parse(hexA) || [255,255,255];
    const b = parse(hexB) || [255,255,255];
    const wa = Math.max(0, Math.min(1, 1 - wb));
    const r = Math.round(a[0]*wa + b[0]*wb);
    const g = Math.round(a[1]*wa + b[1]*wb);
    const b2 = Math.round(a[2]*wa + b[2]*wb);
    const toHex = (n:number) => n.toString(16).padStart(2,'0');
    return `#${toHex(r)}${toHex(g)}${toHex(b2)}`;
  };
  const handleSize = 16;
  const showHandles = selected;
  const startResize = (e: React.MouseEvent, dir: string) => {
    e.preventDefault(); e.stopPropagation();
    if ((e.nativeEvent as any)?.stopImmediatePropagation) (e.nativeEvent as any).stopImmediatePropagation();
    const startX = (e as any).clientX, startY = (e as any).clientY; const startW = width, startH = height;
    const lockedAspect = !!data?.aspect?.locked;
    const aspectRatio = (typeof data?.aspect?.ratio === 'number' && data.aspect.ratio > 0) ? data.aspect.ratio : (startW > 0 && startH > 0 ? startW / startH : undefined);
    document.body.classList.add('resizing-container');
  const move = (ev: MouseEvent) => {
      let dw = ev.clientX - startX; let dh = ev.clientY - startY;
      let newW = startW; let newH = startH;
      if (dir.includes('e')) newW = Math.max(200, startW + dw);
      if (dir.includes('s')) newH = Math.max(140, startH + dh);
      if (dir.includes('w')) newW = Math.max(200, startW - dw);
      if (dir.includes('n')) newH = Math.max(140, startH - dh);
      if (lockedAspect && aspectRatio && aspectRatio > 0) {
        if (dir === 'e' || dir === 'w') {
          newH = Math.max(140, Math.round(newW / aspectRatio));
        } else if (dir === 's' || dir === 'n') {
          newW = Math.max(200, Math.round(newH * aspectRatio));
        } else {
          if (Math.abs(dw) >= Math.abs(dh)) newH = Math.max(140, Math.round(newW / aspectRatio));
          else newW = Math.max(200, Math.round(newH * aspectRatio));
        }
      }
      try {
        if ((window as any).__snapEnabled) {
          newW = Math.max(200, Math.round(newW / GRID_SIZE) * GRID_SIZE);
          newH = Math.max(140, Math.round(newH / GRID_SIZE) * GRID_SIZE);
        }
      } catch {}
      const setNodesFn = (window as any).__setDiagramNodes;
      if (typeof setNodesFn === 'function') {
        setNodesFn((nds: any[]) => nds.map(n => n.id === id ? { ...n, draggable: false, data: { ...n.data, width: newW, height: newH }, style: { ...(n.style||{}), width: newW, height: newH } } : n));
      }
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.classList.remove('resizing-container'); const setNodesFn = (window as any).__setDiagramNodes; if (typeof setNodesFn === 'function') setNodesFn((nds: any[]) => nds.map(n => n.id === id ? { ...n, draggable: true } : n)); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };
  return (
    <div className="relative" style={{ width, height }}>
      {selected && <div className="absolute inset-0 -m-1 rounded-2xl ring-2 ring-blue-500 pointer-events-none" />}
  <div className="rounded-2xl relative border shadow-sm overflow-visible" data-partitions={partitions} style={{ borderColor: color, width: '100%', height: '100%' }}>
        {/* Connection handles for network links - always present for React Flow but visually hidden when not selected */}
        <Handle 
          type="target" 
          position={Position.Top} 
          className={`handle-lg !bg-gray-500/80 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`} 
          isConnectable={true}
          style={{ pointerEvents: selected ? 'auto' : 'none' }}
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className={`handle-lg !bg-gray-500/80 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`} 
          isConnectable={true}
          style={{ pointerEvents: selected ? 'auto' : 'none' }}
        />
        <Handle 
          type="target" 
          position={Position.Left} 
          className={`handle-lg !bg-gray-500/80 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`} 
          isConnectable={true}
          style={{ pointerEvents: selected ? 'auto' : 'none' }}
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          className={`handle-lg !bg-gray-500/80 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`} 
          isConnectable={true}
          style={{ pointerEvents: selected ? 'auto' : 'none' }}
        />
        
        {headerPos==='top' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[2] -translate-y-1/2">
          <div className="relative px-3 py-1.5 rounded-full border shadow flex items-center gap-2" style={{ background: color, color: text, borderColor: color }}>
            <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.24), rgba(255,255,255,0))' }} />
            <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed opacity-40" style={{ borderColor: text }} />
            <div className="relative z-[1] h-6 w-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3" cy="11" r="2" stroke={text} strokeWidth="1.5" fill="transparent" />
                <circle cx="9" cy="3" r="2" stroke={text} strokeWidth="1.5" fill="transparent" />
                <circle cx="15" cy="11" r="2" stroke={text} strokeWidth="1.5" fill="transparent" />
                <path d="M4.5 10L7.5 4.5" stroke={text} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10.5 4.5L13.5 10" stroke={text} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M5 11H13" stroke={text} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="relative z-[1] text-[12px] font-semibold truncate max-w-[200px]" title={label}>{label}</span>
          </div>
        </div>)}
  {headerPos==='left' && (
        <div className="absolute top-1/2 left-0 -translate-y-1/2 z-[2] overflow-visible">
          <div className="relative -translate-x-1/2 -rotate-90 [transform-origin:center] px-3 py-1.5 rounded-full border shadow flex items-center gap-2" style={{ background: color, color: text, borderColor: color }}>
            <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.24), rgba(255,255,255,0))' }} />
            <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed opacity-40" style={{ borderColor: text }} />
            <div className="relative z-[1] h-6 w-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3" cy="11" r="2" stroke={text} strokeWidth="1.5" fill="transparent" />
                <circle cx="9" cy="3" r="2" stroke={text} strokeWidth="1.5" fill="transparent" />
                <circle cx="15" cy="11" r="2" stroke={text} strokeWidth="1.5" fill="transparent" />
                <path d="M4.5 10L7.5 4.5" stroke={text} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10.5 4.5L13.5 10" stroke={text} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M5 11H13" stroke={text} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="relative z-[1] text-[12px] font-semibold truncate max-w-[200px]" title={label}>{label}</span>
          </div>
        </div>)}
  <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ background: bgTint }} />
        {/* Partition separators and badges */}
        {partitions > 1 && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {Array.from({ length: partitions - 1 }).map((_, i) => {
              const innerW = width - (headerPos==='left'?NETWORK_HEADER_HEIGHT:0);
              const step = innerW / partitions;
              const x = (headerPos==='left'?NETWORK_HEADER_HEIGHT:0) + Math.round(step * (i + 1));
              return (
                <div key={`guide-${i}`} className="absolute" style={{ left: x, top: 0, bottom: 0 }}>
                  <div className="absolute inset-0" style={{ borderLeft: `1px solid ${color}`, opacity: 0.9 }} />
                </div>
              );
            })}
            {/* Per-partition badges centered */}
            {Array.from({ length: partitions }).map((_, i) => {
              const innerW = width - (headerPos==='left'?NETWORK_HEADER_HEIGHT:0);
              const step = innerW / partitions;
              const left = (headerPos==='left'?NETWORK_HEADER_HEIGHT:0) + Math.round(step * i + step/2);
              const url = Array.isArray(data?.partitionIcons) ? data.partitionIcons[i] : undefined;
              const txt = Array.isArray((data as any)?.partitionBadgeTexts) ? (data as any).partitionBadgeTexts[i] : undefined;
              return (
        <div key={`badge-${i}`} className="absolute" style={{ left, top: 10, transform:'translate(-50%, -50%)' }}>
                  {(url || txt) ? (() => { const badgeBg = mixHex(color, '#ffffff', 0.8); const badgeFg = autoTextColor(badgeBg); return (
                    <div className="max-w-[160px] rounded-xl shadow border overflow-hidden" style={{ borderColor: color, background: badgeBg }}>
                      <div className="px-2 h-8 inline-flex items-center gap-1 whitespace-nowrap">
                        {url && <img src={url} alt="" className="h-5 w-5 object-contain" />}
                        {txt && <span className="text-xs font-semibold truncate max-w-[130px]" style={{ color: badgeFg, fontVariant:'small-caps', letterSpacing: '0.3px' }}>{txt}</span>}
                      </div>
                    </div>
                  ); })() : null}
                </div>
              );
            })}
          </div>
        )}
        {showHandles && (
          <>
            <div data-resize onMouseDownCapture={(e)=>startResize(e,'e')} className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 cursor-ew-resize bg-blue-500 hover:bg-blue-600 border-2 border-white hover:border-blue-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 z-10" style={{ width: handleSize, height: handleSize }} />
            <div data-resize onMouseDownCapture={(e)=>startResize(e,'s')} className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize bg-blue-500 hover:bg-blue-600 border-2 border-white hover:border-blue-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 z-10" style={{ width: handleSize, height: handleSize }} />
            <div data-resize onMouseDownCapture={(e)=>startResize(e,'se')} className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 cursor-nwse-resize bg-blue-600 hover:bg-blue-700 border-2 border-white hover:border-blue-200 rounded-md shadow-lg hover:shadow-xl transition-all duration-150 z-10" style={{ width: handleSize+2, height: handleSize+2 }} />
          </>
        )}
      </div>
    </div>
  );
});

export default NetworkNode;
