"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CATALOG } from '@/lib/catalog';

interface PaletteItemProps { entry: any; onDragStart: (e: React.DragEvent, entry: any)=>void; }
const PaletteItem: React.FC<PaletteItemProps> = ({ entry, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, entry)}
    className="group relative aspect-square rounded-lg border bg-white/80 hover:bg-white hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 flex items-center justify-center p-2"
  >
    <img src={entry.icon} alt="" className="max-h-6 max-w-6 object-contain" />
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
      {entry.label}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/90"></div>
    </div>
  </div>
);

export interface PalettePanelProps {
  visible: boolean;
  onClose: () => void;
  onEntryDragStart: (e: React.DragEvent, entry: any) => void;
}

export const PalettePanel: React.FC<PalettePanelProps> = ({ visible, onClose, onEntryDragStart }) => {
  if (!visible) return null;
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Palette</CardTitle>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors" title="Masquer le panneau">◀</button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {['container','service','security','generic'].map(cat => (
          <div key={cat}>
            <h4 className="text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">{cat === 'container' ? 'Containers' : cat.charAt(0).toUpperCase()+cat.slice(1)}</h4>
            <div className="grid grid-cols-6 gap-2">
              {CATALOG.filter(e => e.category === cat).map(entry => (
                <PaletteItem key={entry.id} entry={entry} onDragStart={onEntryDragStart} />
              ))}
            </div>
          </div>
        ))}
        <div>
          <h4 className="text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">Networks</h4>
          <div className="grid grid-cols-6 gap-2">
            {CATALOG.filter(e => e.id === 'network').map(entry => (
              <PaletteItem key={entry.id} entry={entry} onDragStart={onEntryDragStart} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PalettePanel;
