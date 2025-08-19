import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AutoLayoutConfig } from '@/types/diagram';
import { DEFAULT_GLOBAL_AUTO_LAYOUT } from '@/contexts/AutoLayoutContext';

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
    <div className="space-y-3 p-3 border-t bg-slate-50/50 dark:bg-slate-800/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Paramètres auto-layout globaux
        </h3>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={resetToDefaults}
          className="h-6 text-xs px-2"
        >
          Défaut
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-slate-600 dark:text-slate-400">
            Marge gauche
          </Label>
          <Input
            type="number"
            value={globalConfig.leftMargin}
            onChange={(e) => updateGlobalConfig({ leftMargin: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs"
            min="0"
            max="50"
          />
        </div>
        
        <div>
          <Label className="text-xs text-slate-600 dark:text-slate-400">
            Marge haut
          </Label>
          <Input
            type="number"
            value={globalConfig.topMargin}
            onChange={(e) => updateGlobalConfig({ topMargin: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs"
            min="0"
            max="50"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600 dark:text-slate-400">
            Espacement colonnes
          </Label>
          <Input
            type="number"
            value={globalConfig.itemSpacing}
            onChange={(e) => updateGlobalConfig({ itemSpacing: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs"
            min="0"
            max="50"
          />
        </div>
        
        <div>
          <Label className="text-xs text-slate-600 dark:text-slate-400">
            Interligne
          </Label>
          <Input
            type="number"
            value={globalConfig.lineSpacing}
            onChange={(e) => updateGlobalConfig({ lineSpacing: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs"
            min="0"
            max="30"
          />
        </div>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        Ces valeurs sont utilisées par défaut pour tous les nouveaux conteneurs avec auto-layout activé.
      </div>
    </div>
  );
};
