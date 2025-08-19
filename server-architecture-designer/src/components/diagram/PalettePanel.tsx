"use client";
import React, { useState, useMemo } from 'react';
import { AutoLayoutConfig } from '@/types/diagram';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { CATALOG } from '@/lib/catalog';
import { GlobalAutoLayoutPanel } from './GlobalAutoLayoutPanel';

interface PaletteItemProps { entry: any; onDragStart: (e: React.DragEvent, entry: any)=>void; }
const PaletteItem: React.FC<PaletteItemProps> = ({ entry, onDragStart }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, entry)}
        className="group relative aspect-square rounded-lg border bg-white/80 dark:bg-slate-700/60 hover:bg-white dark:hover:bg-slate-600 hover:shadow-md hover:scale-105 cursor-grab active:cursor-grabbing transition-all duration-150 flex items-center justify-center p-2"
      >
        <img src={entry.icon} alt="" className="max-h-6 max-w-6 object-contain group-hover:scale-110 transition-transform duration-150" />
      </div>
    </TooltipTrigger>
    <TooltipContent 
      side="top" 
      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium border-0 shadow-lg [&>*:last-child]:bg-slate-900 [&>*:last-child]:dark:bg-slate-100 [&>*:last-child]:fill-slate-900 [&>*:last-child]:dark:fill-slate-100"
    >
      {entry.label}
    </TooltipContent>
  </Tooltip>
);

export interface PalettePanelProps {
  visible: boolean;
  onClose: () => void;
  onEntryDragStart: (e: React.DragEvent, entry: any) => void;
  globalAutoLayoutConfig: AutoLayoutConfig;
  onUpdateGlobalAutoLayoutConfig: (config: AutoLayoutConfig) => void;
}

export const PalettePanel: React.FC<PalettePanelProps> = ({ 
  visible, 
  onClose, 
  onEntryDragStart,
  globalAutoLayoutConfig,
  onUpdateGlobalAutoLayoutConfig 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrage intelligent avec useMemo pour les performances
  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return CATALOG;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return CATALOG.filter(entry => 
      entry.label.toLowerCase().includes(searchLower) ||
      entry.category.toLowerCase().includes(searchLower)
    );
  }, [searchTerm]);

  // Groupement par catégorie après filtrage
  const categorizedResults = useMemo(() => {
    // Removed separate 'network' pseudo-category to avoid duplicate display.
    // 'Network' item is still available under the 'generic' group.
    const categories: Array<'container' | 'service' | 'security' | 'generic'> = ['container', 'service', 'security', 'generic'];
    return categories
      .map(cat => ({
        name: cat,
        displayName: cat === 'container' ? 'Containers' : cat.charAt(0).toUpperCase() + cat.slice(1),
        items: filteredCatalog.filter(e => e.category === cat)
      }))
      .filter(cat => cat.items.length > 0);
  }, [filteredCatalog]);

  if (!visible) return null;
  
  return (
  <Card className="rounded-2xl bg-white/80 dark:bg-slate-800/70 backdrop-blur border-slate-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Palette</CardTitle>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors" title="Masquer le panneau">◀</button>
        </div>
        {/* Champ de recherche */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm bg-white/60 dark:bg-slate-700/60 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 pl-8"
          />
          <svg 
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Effacer la recherche"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {searchTerm && filteredCatalog.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <svg className="mx-auto h-12 w-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">Aucun service trouvé</p>
            <p className="text-xs opacity-75">Essayez un autre terme de recherche</p>
          </div>
        ) : (
          categorizedResults.map(category => (
            <div key={category.name}>
              <h4 className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">
                {category.displayName}
                {searchTerm && (
                  <span className="ml-1 text-blue-500 dark:text-blue-400">({category.items.length})</span>
                )}
              </h4>
              <div className="grid grid-cols-6 gap-2">
                {category.items.map(entry => (
                  <PaletteItem key={entry.id} entry={entry} onDragStart={onEntryDragStart} />
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
      
      <GlobalAutoLayoutPanel 
        globalConfig={globalAutoLayoutConfig}
        onUpdateGlobalConfig={onUpdateGlobalAutoLayoutConfig}
      />
    </Card>
  );
};

export default PalettePanel;
