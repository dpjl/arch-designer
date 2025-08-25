import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AutoLayoutConfig } from '@/types/diagram';
import { DEFAULT_GLOBAL_AUTO_LAYOUT } from '@/contexts/AutoLayoutContext';
import { RotateCcw, Grid, Move, ArrowUpDown } from 'lucide-react';

interface GlobalAutoLayoutPanelProps {
  globalConfig: AutoLayoutConfig;
  onUpdateGlobalConfig: (config: AutoLayoutConfig) => void;
}

export const GlobalAutoLayoutPanel: React.FC<GlobalAutoLayoutPanelProps> = ({
  globalConfig,
  onUpdateGlobalConfig
}) => {
  const updateGlobalConfig = (updates: Partial<AutoLayoutConfig>) => {
    const newConfig = { ...globalConfig, ...updates };
    onUpdateGlobalConfig(newConfig);
  };

  const resetToDefaults = () => {
    onUpdateGlobalConfig(DEFAULT_GLOBAL_AUTO_LAYOUT);
  };

  return (
    <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-700/30 border border-slate-200/50 dark:border-slate-600/50">
      
      {/* En-tête avec bouton de reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid className="h-3.5 w-3.5 text-emerald-500" />
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Paramètres globaux
          </h3>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={resetToDefaults}
          className="h-6 px-2 text-xs hover:bg-white dark:hover:bg-slate-700"
          title="Restaurer les valeurs par défaut"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
      
      {/* Grille des contrôles avec icônes */}
      <div className="space-y-3">
        
        {/* Section Marges */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Move className="h-3 w-3 text-blue-500" />
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Marges</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Gauche</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={globalConfig.leftMargin}
                  onChange={(e) => updateGlobalConfig({ leftMargin: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                  min="0"
                  max="50"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Haut</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={globalConfig.topMargin}
                  onChange={(e) => updateGlobalConfig({ topMargin: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                  min="0"
                  max="50"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Espacements */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3 w-3 text-purple-500" />
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Espacements</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Colonnes</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={globalConfig.itemSpacing}
                  onChange={(e) => updateGlobalConfig({ itemSpacing: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                  min="0"
                  max="50"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Lignes</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={globalConfig.lineSpacing}
                  onChange={(e) => updateGlobalConfig({ lineSpacing: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                  min="0"
                  max="30"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aperçu visuel */}
        <div className="p-2 rounded-md bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-600/50">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Aperçu :</div>
          <div className="grid grid-cols-3 gap-1 text-xs text-center">
            <div 
              className="h-6 bg-blue-100 dark:bg-blue-900/30 rounded border flex items-center justify-center"
              style={{ marginLeft: `${Math.min(globalConfig.leftMargin/2, 10)}px`, marginTop: `${Math.min(globalConfig.topMargin/2, 10)}px` }}
            >
              <div className="text-[10px] text-blue-600 dark:text-blue-400">A</div>
            </div>
            <div 
              className="h-6 bg-green-100 dark:bg-green-900/30 rounded border flex items-center justify-center"
              style={{ marginTop: `${Math.min(globalConfig.topMargin/2, 10)}px` }}
            >
              <div className="text-[10px] text-green-600 dark:text-green-400">B</div>
            </div>
            <div 
              className="h-6 bg-purple-100 dark:bg-purple-900/30 rounded border flex items-center justify-center"
              style={{ marginTop: `${Math.min(globalConfig.topMargin/2, 10)}px` }}
            >
              <div className="text-[10px] text-purple-600 dark:text-purple-400">C</div>
            </div>
          </div>
        </div>

        {/* Note explicative */}
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-200/50 dark:border-blue-800/50">
          💡 Ces valeurs s'appliquent automatiquement aux nouveaux conteneurs avec auto-layout activé.
        </div>
      </div>
    </div>
  );
};

export default GlobalAutoLayoutPanel;
