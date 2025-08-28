"use client";
import { CONTAINER_HEADER_HEIGHT, GRID_SIZE } from '../constants';
import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import { Handle, Position, useStore } from 'reactflow';
import { Boxes, Lock, Unlock, Key } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { useGroups } from '@/contexts/GroupsContext';
import { hexToRgba, autoTextColor } from '../diagram-helpers';
import { getBrickTexture } from '../firewall-texture';
import { FirewallIcon } from '../icons/FirewallIcon';
import { effectiveBorderColor, effectiveBgColor, isAuto } from '../color-utils';
import { ContainerShapeWrapper } from '../utils/ContainerShapeWrapper';
import { generateLShapeClipPath } from '../utils/lshape-utils';

// getBrickTexture now provided by shared utility

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
  const { label = 'Component', icon, color, features = {}, bgColor, bgOpacity = 1, isContainer = false, width = 520, height = 320, locked = false, widthMode = 'fixed', customWidth, groupId, compact: compactFlag } = data || {};
  const bgImageUrl: string | undefined = (data?.bgImageUrl || '').trim() || undefined;
  const bgImageOpacity: number = typeof data?.bgImageOpacity === 'number' ? Math.max(0, Math.min(1, data.bgImageOpacity)) : 0.3;
  const isCompact = !!compactFlag;
  const { getById } = useGroups();
  const group = groupId ? getById(groupId) : undefined;
  const autoRef = useRef<HTMLDivElement|null>(null);
  const serviceRef = useRef<HTMLDivElement|null>(null);
  const [autoServiceW, setAutoServiceW] = useState<number>();
  const effectiveColor = group?.color || color;
  const effectiveBgBase = group?.color || bgColor;
  // Darken a hex color by mixing with black by factor [0..1]
  const darkenHex = (hex?: string, factor: number = 0.2) => {
    if (!hex || typeof hex !== 'string') return hex || '#000000';
    const m = hex.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (!m) return hex;
    let s = m[1]; if (s.length === 3) s = s.split('').map(c=>c+c).join('');
    const v = parseInt(s, 16);
    let r=(v>>16)&255, g=(v>>8)&255, b=v&255;
    r = Math.max(0, Math.min(255, Math.round(r * (1 - factor))));
    g = Math.max(0, Math.min(255, Math.round(g * (1 - factor))));
    b = Math.max(0, Math.min(255, Math.round(b * (1 - factor))));
    const toHex = (n:number) => n.toString(16).padStart(2,'0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const baseBg = effectiveBgColor(effectiveBgBase, isDark);
  // For grouped services, use solid background (no opacity) exactly as chosen; otherwise honor bgOpacity
  const bg = group ? baseBg : hexToRgba(baseBg, bgOpacity);
  // For grouped services, derive a slightly darker border from the group color for visual separation
  let borderColor;
  if (isAuto(effectiveColor)) {
    borderColor = isDark ? '#aaa8a8ff' : '#4b4949ff';
  } else {
    borderColor = group ? darkenHex(effectiveColor, 0.22) : effectiveBorderColor(effectiveColor, isDark);
  }
  // Helper to mix two hex colors (returns hex). wb is weight of B in [0..1]
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
  // Previously: hide text when zoom < 0.6 (zoom threshold chosen to reduce clutter).
  // Requirement: always display the service label even at minimum zoom.
  const showText = true;
  // Dynamic label color based on resolved background (handles 'auto' and group overrides)
  const labelFg = autoTextColor(baseBg || '#ffffff');
  const handleSize = 16;
  const showHandles = isContainer && selected && !locked;
  const { theme } = useTheme();
  const firewallLabel = String((data?.features?.firewallLabel ?? 'FIREWALL') || 'FIREWALL');
  const firewallVariant = data?.features?.firewallVariant || 'default'; // 'default', 'secure', 'warning'

  const startResize = (e: React.MouseEvent, dir: string) => {
    if (!isContainer) return;
    e.preventDefault(); e.stopPropagation();
    if ((e.nativeEvent as any)?.stopImmediatePropagation) (e.nativeEvent as any).stopImmediatePropagation();
    const startX = e.clientX, startY = e.clientY; const startW = width, startH = height;
    const lockedAspect = !!data?.aspect?.locked;
    const aspectRatio = (typeof data?.aspect?.ratio === 'number' && data.aspect.ratio > 0) ? data.aspect.ratio : (startW > 0 && startH > 0 ? startW / startH : undefined);
    const isLShape = data?.shape === 'l-shape';
    const currentLShape = data?.lShape;
    
    document.body.classList.add('resizing-container');
    
    const move = (ev: MouseEvent) => {
      let dw = ev.clientX - startX; let dh = ev.clientY - startY;
      let newW = startW; let newH = startH;
      let newLShape = currentLShape ? { ...currentLShape } : undefined;
      
      // Handle L-shape specific resize handles
      if (dir.startsWith('cut-') && isLShape && newLShape) {
        if (dir === 'cut-w') {
          // Adjust cut width for left-side cuts
          if (newLShape.cutCorner === 'top-left' || newLShape.cutCorner === 'bottom-left') {
            const newCutWidth = Math.max(20, Math.min(startW - 20, (currentLShape?.cutWidth || 120) + dw));
            newLShape.cutWidth = newCutWidth;
          }
        } else if (dir === 'cut-e') {
          // Adjust cut width for right-side cuts
          if (newLShape.cutCorner === 'top-right' || newLShape.cutCorner === 'bottom-right') {
            const newCutWidth = Math.max(20, Math.min(startW - 20, (currentLShape?.cutWidth || 120) - dw));
            newLShape.cutWidth = newCutWidth;
          }
        } else if (dir === 'cut-n') {
          // Adjust cut height for top cuts
          if (newLShape.cutCorner === 'top-left' || newLShape.cutCorner === 'top-right') {
            const newCutHeight = Math.max(20, Math.min(startH - 20, (currentLShape?.cutHeight || 80) + dh));
            newLShape.cutHeight = newCutHeight;
          }
        } else if (dir === 'cut-s') {
          // Adjust cut height for bottom cuts
          if (newLShape.cutCorner === 'bottom-left' || newLShape.cutCorner === 'bottom-right') {
            const newCutHeight = Math.max(20, Math.min(startH - 20, (currentLShape?.cutHeight || 80) - dh));
            newLShape.cutHeight = newCutHeight;
          }
        }
      } else {
        // Standard resize handles
        if (dir.includes('e')) newW = Math.max(200, startW + dw);
        if (dir.includes('s')) newH = Math.max(140, startH + dh);
        if (dir.includes('w')) newW = Math.max(200, startW - dw);
        if (dir.includes('n')) newH = Math.max(140, startH - dh);
        
        // Maintain aspect if locked
        if (lockedAspect && aspectRatio && aspectRatio > 0) {
          if (dir === 'e' || dir === 'w') {
            newH = Math.max(140, Math.round(newW / aspectRatio));
          } else if (dir === 's' || dir === 'n') {
            newW = Math.max(200, Math.round(newH * aspectRatio));
          } else {
            if (Math.abs(dw) >= Math.abs(dh)) {
              newH = Math.max(140, Math.round(newW / aspectRatio));
            } else {
              newW = Math.max(200, Math.round(newH * aspectRatio));
            }
          }
        }
        
        // Adjust L-shape cut dimensions if container is resized
        if (isLShape && newLShape) {
          // Ensure cut dimensions don't exceed new container dimensions
          newLShape.cutWidth = Math.min(newLShape.cutWidth, newW - 20);
          newLShape.cutHeight = Math.min(newLShape.cutHeight, newH - 20);
        }
      }
      
      // Snap dimensions to grid if enabled globally
      try {
        if ((window as any).__snapEnabled && !dir.startsWith('cut-')) {
          newW = Math.max(200, Math.round(newW / GRID_SIZE) * GRID_SIZE);
          newH = Math.max(140, Math.round(newH / GRID_SIZE) * GRID_SIZE);
        }
      } catch {}
      
      const setNodesFn = (window as any).__setDiagramNodes;
      if (typeof setNodesFn === 'function') {
        setNodesFn((nds: any[]) => nds.map(n => n.id === id ? { 
          ...n, 
          draggable: false, 
          data: { 
            ...n.data, 
            width: newW, 
            height: newH,
            lShape: newLShape 
          }, 
          style: { 
            ...(n.style||{}), 
            width: newW, 
            height: newH 
          } 
        } : n));
      }
    };
    
    const up = () => { 
      window.removeEventListener('mousemove', move); 
      window.removeEventListener('mouseup', up); 
      document.body.classList.remove('resizing-container'); 
      const setNodesFn = (window as any).__setDiagramNodes; 
      if (typeof setNodesFn === 'function') {
        setNodesFn((nds: any[]) => nds.map(n => n.id === id ? { ...n, draggable: undefined as any } : n)); 
      }
    };
    
    window.addEventListener('mousemove', move); 
    window.addEventListener('mouseup', up);
  };

  const headerPos = (data?.headerPos || 'top') as 'top'|'left';
  const partitions = Math.max(1, Math.min(12, parseInt(String(data?.partitions ?? 1), 10) || 1));
  if (isContainer) {
    const tex = getBrickTexture();
    const isDark = theme === 'dark';
    const texUrlH = isDark && tex.urlHDark ? tex.urlHDark : tex.urlH;
    
    return (
      <div className="relative" style={{ 
        width, height, 
        ['--fwtexH' as any]: features?.firewall ? `url('${texUrlH}')` : undefined, 
        ['--fwtexSize' as any]: features?.firewall ? `${tex.size}px ${tex.size}px` : undefined, 
        ['--fwtexOffX' as any]: `${tex.offX}px`, 
        ['--fwtexOffY' as any]: `${tex.offY}px`, 
        ['--fwShiftTopY' as any]: `${tex.shiftTopY}px`, 
        ['--fwShiftSideX' as any]: `${tex.shiftSideX}px`, 
        ['--ringGapInner' as any]: '8px', 
        ['--ringThickness' as any]: '14px' 
      }}>
        {features?.firewall && (
          <div className="firewall-ring rounded-2xl" style={{ pointerEvents: 'none' }}>
            <div className="fw-top" />
            <div className="fw-badge fw-badge--rect" title="Firewall activé" aria-label="firewall">
              <div className="fw-rect">
                <FirewallIcon size={24} variant={firewallVariant as any} />
              </div>
            </div>
            <div className="fw-label" aria-hidden="true">{firewallLabel}</div>
          </div>
        )}
  <ContainerShapeWrapper
          width={width}
          height={height}
          borderColor={borderColor}
          bg={bg}
          shape={data?.shape || 'rectangle'}
          lShape={data?.lShape}
          selected={selected}
          locked={locked}
          isContainer={isContainer}
          id={id}
          partitions={partitions}
          headerPos={headerPos}
          onResize={startResize}
        >
          {/* Optional background image overlay (fills best while preserving aspect) */}
          {bgImageUrl && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              {/* Use two layers: a dimmer layer for better contrast and the image with configured opacity */}
              <img src={bgImageUrl} alt=""
                   className="absolute inset-0 w-full h-full object-contain"
                   style={{ opacity: bgImageOpacity, filter: 'saturate(0.95)' }} />
            </div>
          )}
          {headerPos==='top' && (
          <div 
            className="absolute top-0 left-0 right-0 flex items-center gap-3 px-3 py-2 bg-white/90 dark:bg-slate-900/70 backdrop-blur border-b rounded-t-2xl" 
            style={{ 
              borderColor: borderColor, 
              height: CONTAINER_HEADER_HEIGHT,
              // Offset header if top-left corner is cut
              marginLeft: (data?.shape === 'l-shape' && data?.lShape?.cutCorner === 'top-left') 
                ? Math.min(data.lShape.cutWidth || 120, width - 20) 
                : 0
            }}
          >
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
          <div className="absolute top-0 bottom-0 left-0 flex flex-col items-center justify-start gap-3 px-2 py-3 bg-white/90 dark:bg-slate-900/70 backdrop-blur border-r rounded-l-2xl" style={{ borderColor: borderColor, width: CONTAINER_HEADER_HEIGHT }}>
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
          {/* Partition separators and badges */}
          {partitions > 1 && (
            <div className="absolute pointer-events-none" aria-hidden style={{ 
              top: headerPos === 'top' ? CONTAINER_HEADER_HEIGHT : 0,
              left: headerPos === 'left' ? CONTAINER_HEADER_HEIGHT : 0,
              right: 0,
              bottom: 0
            }}>
              {Array.from({ length: partitions - 1 }).map((_, i) => {
                const innerW = width - (headerPos==='left'?CONTAINER_HEADER_HEIGHT:0);
                const step = innerW / partitions;
                const x = Math.round(step * (i + 1));
                return (
                  <div key={`guide-${i}`} className="absolute" style={{ left: x, top: 0, bottom: 0 }}>
                    <div className="absolute inset-0" style={{ borderLeft: `1px solid ${borderColor}`, opacity: 0.9 }} />
                  </div>
                );
              })}
              {/* Per-partition badges centered */}
              {Array.from({ length: partitions }).map((_, i) => {
                const innerW = width - (headerPos==='left'?CONTAINER_HEADER_HEIGHT:0);
                const step = innerW / partitions;
                const left = Math.round(step * i + step/2);
                const url = Array.isArray(data?.partitionIcons) ? data.partitionIcons[i] : undefined;
                const txt = Array.isArray((data as any)?.partitionBadgeTexts) ? (data as any).partitionBadgeTexts[i] : undefined;
                return (
                  <div key={`badge-${i}`} className="absolute" style={{ left, top: 10, transform:'translate(-50%, -50%)' }}>
                    {(url || txt) ? (() => { const badgeBg = mixHex(baseBg, '#ffffff', 0.3); const badgeFg = autoTextColor(badgeBg); return (
                      <div className="max-w-[160px] rounded-xl shadow border overflow-hidden" style={{ borderColor: borderColor, background: badgeBg, backdropFilter:'saturate(1.1) blur(1px)' }}>
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
        </ContainerShapeWrapper>
      </div>
    );
  }

  const tex = getBrickTexture();
  const texUrlH = isDark && tex.urlHDark ? tex.urlHDark : tex.urlH;
  
  // Service node width computation (applies to the service card only)
  let serviceWidth: number | undefined;
  if (widthMode === 'fixed') {
    serviceWidth = 240;
  } else if (widthMode === 'custom') {
    serviceWidth = Math.max(140, Math.min(800, customWidth || 240));
  } else if (widthMode === 'auto') {
    serviceWidth = autoServiceW;
  }

  // Measure auto width based on the service card content only (exclude instances)
  useLayoutEffect(() => {
    if (widthMode !== 'auto') { setAutoServiceW(undefined); return; }
    const el = serviceRef.current; if (!el) return;
    const prevWidth = el.style.width;
    const prevMinWidth = el.style.minWidth;
    el.style.width = 'fit-content';
    el.style.minWidth = '0';
    let w = el.scrollWidth;
    w = Math.max(140, Math.min(w, 800));
    el.style.width = prevWidth;
    el.style.minWidth = prevMinWidth;
    if (!autoServiceW || Math.abs((autoServiceW || 0) - w) > 0.5) setAutoServiceW(w);
  }, [widthMode, label, features, icon, borderColor, customWidth]);

  return (
    <div className="relative inline-block" style={{ 
      ['--fwtexH' as any]: features?.firewall ? `url('${texUrlH}')` : undefined, 
      ['--fwtexSize' as any]: features?.firewall ? `${tex.size}px ${tex.size}px` : undefined, 
      ['--fwtexOffX' as any]: `${tex.offX}px`, 
      ['--fwtexOffY' as any]: `${tex.offY}px`, 
      ['--fwShiftTopY' as any]: `${tex.shiftTopY}px`, 
      ['--fwShiftSideX' as any]: `${tex.shiftSideX}px`, 
      ['--ringGapInner' as any]: '5px', 
      ['--ringThickness' as any]: '12px' 
    }}>
        {features?.firewall && (
          <div className="firewall-ring rounded-2xl">
            <div className="fw-top" />
            <div className="fw-badge fw-badge--rect" title="Firewall activé" aria-label="firewall">
              <div className="fw-rect">
                <FirewallIcon size={24} variant={firewallVariant as any} />
              </div>
            </div>
            <div className="fw-label" aria-hidden="true">{firewallLabel}</div>
          </div>
        )}
  { /* Service body */ }
  {(() => {
    const hasNetworks = Array.isArray(data?.networkColors) && data.networkColors.length > 0;
    return (
  <div ref={autoRef} className={"flex items-stretch gap-2 transition " + (widthMode==='auto' ? '' : '')}>
        {/* Service card */}
  <div ref={serviceRef} className={`group rounded-2xl shadow-lg ${isCompact ? 'px-2 py-0.5' : 'px-2 pt-1 pb-1'} hover:shadow-xl transition overflow-visible border relative dark:shadow-slate-950/40`} style={{ borderColor, background: bg, width: serviceWidth, zIndex: 200, minHeight: isCompact ? 30 : undefined }}>
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
  <div className={"flex items-center gap-2 min-w-0 transition-all " + (
            isCompact ? (hasNetworks ? 'mt-[4px]' : 'mt-[2px]') : (hasNetworks ? 'mt-1' : '')
          )} style={isCompact?{minHeight:18, alignItems:'center'}:undefined}>
          {icon ? <img src={icon} alt="" className={(isCompact? 'h-4.5 w-4.5' : 'h-7 w-7') + " object-contain rounded"} /> : <div className={(isCompact? 'h-4.5 w-4.5' : 'h-7 w-7') + " rounded bg-gray-200 dark:bg-slate-600"} />}
          {showText && <div className={(isCompact? 'text-[11px]' : 'text-sm') + " font-medium truncate flex-1 leading-tight"} style={{ color: labelFg }} title={label || 'Unnamed'}>{label || 'Unnamed'}</div>}
          <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ background: borderColor }} />
          <FeaturesIcons features={features} compact={isCompact} />
        </div>
        </div>
        {/* Instances as vertical rectangles on the right */}
    {Array.isArray(data?.instances) && data.instances.length > 0 && (
          (() => {
            const list = data.instances as any[];
            const groupsMap: Record<string, { label: string; color: string }> = (window as any).__instanceGroupsMap || {};
            const useServiceColor = !!data?.useServiceColorForInstances;
            return (
              <div className="relative flex items-stretch" style={{ minWidth: isCompact ? '22px' : '28px', marginLeft: isCompact ? '-16px' : '-20px' }}>
                {list.map((ins:any, i:number) => {
                  const grp = groupsMap[ins?.groupId||''];
                  let bgCol;
                  if (useServiceColor) {
                    // Use the same logic as the service for background color (auto, group, theme-aware)
                    const base = group?.color || bgColor;
                    bgCol = effectiveBgColor(base, isDark);
                  } else {
                    bgCol = grp?.color || '#ffffff';
                  }
                  const fgCol = autoTextColor(bgCol);
                  const isDouble = ins?.auth === 'auth2';
                  return (
                    <div key={i} className="absolute top-0 bottom-0 rounded-2xl border shadow-sm flex flex-col items-end justify-end px-1 pt-0.5 pb-0.5" style={{ borderColor, background: bgCol, left: `${i*(isCompact?12:16)}px`, minWidth: isCompact? '22px':'28px', maxWidth: '100px', zIndex: 150 - i }}>
                      <div className="w-full flex flex-col items-end justify-end">
                        {ins?.auth && (
                          isDouble ? (
                            <span className="inline-flex flex-col items-end justify-end mb-0.5" style={{marginRight: '-1px'}}>
                              <Key className={isCompact?"h-2.5 w-2.5":"h-3 w-3"} strokeWidth={2.1} />
                              <Key className={isCompact?"h-2 w-2 -mt-0.5":"h-2.5 w-2.5 -mt-1"} strokeWidth={2.1} />
                            </span>
                          ) : (
                            <span className="inline-flex items-end justify-end mb-1" style={{marginRight: '-1px'}}>
                              <Key className={isCompact?"h-2.5 w-2.5":"h-3 w-3"} strokeWidth={2.1} />
                            </span>
                          )
                        )}
                        <span className={(isCompact?"text-[9px]":"text-[10px]") + " font-medium text-right truncate w-full leading-tight"} style={{ color: fgCol, fontVariant: 'small-caps', letterSpacing: '0.3px' }} title={grp?.label || ''}>{grp?.label || ''}</span>
                      </div>
                    </div>
                  );
                })}
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
