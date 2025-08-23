"use client";
import React, { memo } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { Handle, Position } from 'reactflow';
import { DEFAULT_DOOR_WIDTH, DEFAULT_DOOR_HEIGHT } from '../constants';

interface DoorNodeProps { data: any; selected: boolean; }

const DoorNode = memo(({ data, selected }: DoorNodeProps) => {
  const { allow = 'HTTPS', width: baseWidth = DEFAULT_DOOR_WIDTH, side } = data || {};
  // Doors now have fixed height; width is configurable and drives detail thickness.
  const doorH = DEFAULT_DOOR_HEIGHT;
  const doorW = Math.round(baseWidth || DEFAULT_DOOR_WIDTH);
  const scaleW = Math.max(0.4, Math.min(2, doorW / DEFAULT_DOOR_WIDTH));
  const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
  // Side borders scale with width (thinner for small doors, subtle for large)
  const baseSide = Math.round(DEFAULT_DOOR_HEIGHT * 0.24); // ~11px at default
  const sideW = clamp(Math.round(baseSide * scaleW), 4, 14);
  const fontSize = 11;
  const barrierL = Math.max(Math.round(doorW * 0.9), 64);
  // Barrier thickness scales with width as well
  const baseBarrierH = Math.max(8, Math.round(DEFAULT_DOOR_HEIGHT * 0.36)); // ~17px
  const barrierH = clamp(Math.round(baseBarrierH * scaleW), 6, 22);
  const barrierBorderPx = scaleW < 0.85 ? 1 : 2;
  const rotate = side === 'left' ? -90 : side === 'right' ? 90 : 0;
  const barrierAngle = (side === 'bottom' || side === 'right') ? 25 : -25;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
    const panelBg = isDark ? 'linear-gradient(to bottom, #0f172a 0%, #0a1120 100%)' : '#ffffff';
    const panelFg = isDark ? '#f1f5f9' : '#000000';
  const stripeLight = '#ef4444';
  // Slightly softened white for visibility on dark backgrounds
  const stripeAlt = '#f8fafc';
  // Softer side border colors: slate tones instead of pure black in light mode
  const sideBarColor = isDark ? '#7d85b3ff' : '#cf631bff';
  const sideBorderColor = isDark ? '#cbd5e1' : '#000';
  return (
    <div className="relative select-none" style={{ width: doorW, height: doorH }}>
      <div className="absolute inset-0" style={{ transform: `rotate(${rotate}deg)`, transformOrigin: 'center' }}>
  <div className="absolute transition-transform duration-200 ease-out group-hover:rotate-[5deg]" style={{ zIndex: 3, height: barrierH, width: barrierL, background: `repeating-linear-gradient(45deg, ${stripeLight} 0 10px, ${stripeAlt} 10px 20px)`, border: `${barrierBorderPx}px solid ${isDark ? '#0f172a' : '#000'}`, top: '50%', left: 0, transform: `translate(0, -50%) rotate(${barrierAngle}deg)`, transformOrigin: 'left center', borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }} />
        <div className="relative h-full w-full flex items-stretch">
          <div className="flex-none" style={{ width: sideW, background: sideBarColor, boxShadow: isDark? '0 0 0 1px #64748b inset' : undefined, border: `1px solid ${sideBorderColor}` }} />
          <div className="min-w-0 flex-1 flex items-center justify-center px-3 relative overflow-visible rounded-sm" style={{ background: panelBg, color: panelFg, backdropFilter: isDark? 'blur(2px)' : undefined }}>
            <span className="mr-1 flex-none" aria-hidden>🔒</span>
            <span className="uppercase tracking-wide font-bold whitespace-nowrap" style={{ fontSize }}>{allow}</span>
            <Handle type="target" position={Position.Left} className={`handle-lg !bg-gray-600/90 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:5 }} />
            <Handle type="source" position={Position.Right} className={`handle-lg !bg-gray-600/90 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:5 }} />
          </div>
          <div className="flex-none" style={{ width: sideW, background: sideBarColor, boxShadow: isDark? '0 0 0 1px #64748b inset' : undefined, border: `1px solid ${sideBorderColor}` }} />
        </div>
      </div>
      {selected && <div className="absolute inset-0 -m-1 border-2 border-blue-500 pointer-events-none" />}
    </div>
  );
});

export default DoorNode;
