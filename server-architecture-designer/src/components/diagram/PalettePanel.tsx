"use client";
import React, { useState, useMemo } from 'react';
import { AutoLayoutConfig } from '@/types/diagram';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  EyeOff, 
  Grid, 
  Box, 
  Shield, 
  Settings,
  Layers
} from 'lucide-react';
import { CATALOG } from '@/lib/catalog';
import { GlobalAutoLayoutPanel } from './GlobalAutoLayoutPanel';

interface PaletteItemProps { 
  entry: any; 
  onDragStart: (e: React.DragEvent, entry: any) => void; 
}

const PaletteItem: React.FC<PaletteItemProps> = ({ entry, onDragStart }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, entry)}
        className="group relative aspect-square rounded-xl border-2 bg-white/90 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 hover:shadow-lg hover:scale-105 cursor-grab active:cursor-grabbing transition-all duration-200 flex items-center justify-center border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500"
        style={{ minHeight: '48px', minWidth: '48px' }}
      >
        <img 
          src={entry.icon} 
          alt="" 
          className="h-6 w-6 object-contain group-hover:scale-110 transition-transform duration-200" 
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </TooltipTrigger>
    <TooltipContent 
      side="right" 
      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium border-0 shadow-xl"
    >
      <div className="font-semibold">{entry.label}</div>
      <div className="text-xs opacity-75 capitalize">{entry.category}</div>
    </TooltipContent>
  </Tooltip>
);

// Composant pour les sections pliables
const CollapsibleCategory: React.FC<{
  title: string;
  icon: React.ReactNode;
  count: number;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, count, defaultCollapsed = false, children }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            {title}
          </h4>
          <span className="h-5 px-1.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-full font-medium">
            {count}
          </span>
        </div>
        <div className="opacity-60 group-hover:opacity-100 transition-opacity">
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </div>
      </button>
      
      {!collapsed && (
        <div className="grid grid-cols-5 gap-2 px-2">
          {children}
        </div>
      )}
    </div>
  );
};

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
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);

  // Filtrage intelligent avec useMemo pour les performances
  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return CATALOG;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return CATALOG.filter(entry => 
      entry.label.toLowerCase().includes(searchLower) ||
      entry.category.toLowerCase().includes(searchLower) ||
      entry.id.toLowerCase().includes(searchLower)
    );
  }, [searchTerm]);

  // Groupement par catégorie avec icônes et métadonnées
  const categorizedResults = useMemo(() => {
    const categoryConfig = {
      container: { 
        name: 'Conteneurs', 
        icon: <Box className="h-3.5 w-3.5 text-purple-500" />,
        defaultCollapsed: false 
      },
      service: { 
        name: 'Services', 
        icon: <Settings className="h-3.5 w-3.5 text-blue-500" />,
        defaultCollapsed: false 
      },
      security: { 
        name: 'Sécurité', 
        icon: <Shield className="h-3.5 w-3.5 text-red-500" />,
        defaultCollapsed: false 
      },
      generic: { 
        name: 'Divers', 
        icon: <Layers className="h-3.5 w-3.5 text-slate-500" />,
        defaultCollapsed: true 
      }
    };

    return Object.entries(categoryConfig)
      .map(([key, config]) => ({
        key,
        ...config,
        items: filteredCatalog.filter(e => e.category === key)
      }))
      .filter(cat => cat.items.length > 0);
  }, [filteredCatalog]);

  const totalResults = filteredCatalog.length;

  if (!visible) return null;
  
  return (
    <Card className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-600 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-semibold">Palette de composants</CardTitle>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" 
            title="Fermer"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {/* Barre de recherche améliorée */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <Input
            type="text"
            placeholder="Rechercher un composant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm pl-8 pr-8 bg-white/80 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded"
              title="Effacer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        {/* Statistiques de recherche */}
        {searchTerm && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{totalResults} résultat{totalResults !== 1 ? 's' : ''}</span>
            {totalResults > 0 && (
              <span className="text-blue-500 dark:text-blue-400">
                {categorizedResults.length} catégorie{categorizedResults.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0 max-h-96 overflow-y-auto">
        {searchTerm && totalResults === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Search className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">Aucun composant trouvé</p>
            <p className="text-xs opacity-75">Essayez un autre terme de recherche</p>
          </div>
        ) : (
          categorizedResults.map(category => (
            <CollapsibleCategory
              key={category.key}
              title={category.name}
              icon={category.icon}
              count={category.items.length}
              defaultCollapsed={searchTerm ? false : category.defaultCollapsed}
            >
              {category.items.map(entry => (
                <PaletteItem key={entry.id} entry={entry} onDragStart={onEntryDragStart} />
              ))}
            </CollapsibleCategory>
          ))
        )}
      </CardContent>
      
      {/* Section Auto-layout globaux pliable */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowGlobalSettings(!showGlobalSettings)}
          className="flex items-center justify-between w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Grid className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Auto-layout global
            </span>
          </div>
          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
            {showGlobalSettings ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </div>
        </button>
        
        {showGlobalSettings && (
          <div className="px-3 pb-3">
            <GlobalAutoLayoutPanel 
              globalConfig={globalAutoLayoutConfig}
              onUpdateGlobalConfig={onUpdateGlobalAutoLayoutConfig}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default PalettePanel;
