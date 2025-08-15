"use client";
import React, { memo } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { Handle, Position } from 'reactflow';
import { DEFAULT_DOOR_WIDTH, DEFAULT_DOOR_HEIGHT } from '../constants';

interface DoorNodeProps { data: any; selected: boolean; }

const DoorNode = memo(({ data, selected }: DoorNodeProps) => {
  const { allow = 'HTTPS', width: baseWidth = DEFAULT_DOOR_WIDTH, lockedIcon = true, side } = data || {};
  const scale = Math.max(0.6, Math.min(2, data?.scale ?? 1));
  const doorH = Math.round(DEFAULT_DOOR_HEIGHT * scale);
  const doorW = Math.round((baseWidth || DEFAULT_DOOR_WIDTH) * scale);
  const sideW = Math.max(6, Math.round(doorH * 0.3));
  const fontSize = Math.max(10, Math.round(11 * scale));
  const barrierL = Math.max(Math.round(doorW * 0.9), 64);
  const barrierH = Math.max(8, Math.round(doorH * 0.36));
  const rotate = side === 'left' ? -90 : side === 'right' ? 90 : 0;
  const barrierAngle = (side === 'bottom' || side === 'right') ? 25 : -25;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const panelBg = isDark ? '#1e293b' : '#ffffff';
  const panelFg = isDark ? '#f1f5f9' : '#000000';
  const stripeLight = isDark ? '#ef4444' : '#ef4444';
  const stripeAlt = isDark ? '#334155' : '#ffffff';
  return (
    <div className="relative select-none" style={{ width: doorW, height: doorH }}>
      <div className="absolute inset-0" style={{ transform: `rotate(${rotate}deg)`, transformOrigin: 'center' }}>
  <div className="absolute transition-transform duration-200 ease-out group-hover:rotate-[5deg]" style={{ zIndex: 3, height: barrierH, width: barrierL, background: `repeating-linear-gradient(45deg, ${stripeLight} 0 10px, ${stripeAlt} 10px 20px)`, border: '2px solid ' + (isDark ? '#0f172a' : '#000'), top: '50%', left: 0, transform: `translate(0, -50%) rotate(${barrierAngle}deg)`, transformOrigin: 'left center', borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }} />
        <div className="relative h-full w-full flex items-stretch">
          <div className="bg-black" style={{ width: sideW }} />
          <div className="flex-1 flex items-center justify-center px-3 relative overflow-visible" style={{ background: panelBg, color: panelFg }}>
            <span className="mr-1" aria-hidden>{lockedIcon ? '🔒' : ''}</span>
            <span className="uppercase tracking-wide font-bold" style={{ fontSize }}>{allow}</span>
            <Handle type="target" position={Position.Left} className={`handle-lg !bg-gray-600/90 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:5 }} />
            <Handle type="source" position={Position.Right} className={`handle-lg !bg-gray-600/90 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:5 }} />
          </div>
          <div className="bg-black" style={{ width: sideW }} />
        </div>
      </div>
      {selected && <div className="absolute inset-0 -m-1 border-2 border-blue-500 pointer-events-none" />}
    </div>
  );
});

export default DoorNode;
