import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AutoLayoutConfig } from '@/types/diagram';

interface AutoLayoutControlsProps {
  config?: AutoLayoutConfig;
  onChange: (config: AutoLayoutConfig) => void;
  disabled?: boolean;
  globalConfig: AutoLayoutConfig; // Ajout direct du globalConfig
}

export const AutoLayoutControls: React.FC<AutoLayoutControlsProps> = ({
  config,
  onChange,
  disabled = false,
  globalConfig
}) => {
  // Normalisation : si un objet partiel est passé (ex: { enabled:true }),
  // on complète proprement avec les valeurs par défaut afin d'éviter des
  // champs vides dans le formulaire (cas observé sur les containers classiques).
  const currentConfig: AutoLayoutConfig = {
    enabled: config?.enabled ?? false,
    leftMargin: config?.leftMargin ?? 16,
    topMargin: config?.topMargin ?? 16,
    itemSpacing: config?.itemSpacing ?? 12,
    lineSpacing: config?.lineSpacing ?? 8,
    useGlobalDefaults: config?.useGlobalDefaults ?? false
  };

  // Fonction de mise à jour simple
  const updateConfig = (updates: Partial<AutoLayoutConfig>) => {
    const newConfig = { ...currentConfig, ...updates };
    onChange(newConfig);
  };

  // Valeurs effectives pour l'affichage (lecture seule quand mode global)
  const displayValues = currentConfig.useGlobalDefaults ? {
    leftMargin: globalConfig.leftMargin,
    topMargin: globalConfig.topMargin,
    itemSpacing: globalConfig.itemSpacing,
    lineSpacing: globalConfig.lineSpacing
  } : {
    leftMargin: currentConfig.leftMargin,
    topMargin: currentConfig.topMargin,
    itemSpacing: currentConfig.itemSpacing,
    lineSpacing: currentConfig.lineSpacing
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
      {/* Case principale : Activer/désactiver l'auto-layout */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto-layout-enabled"
          checked={currentConfig.enabled}
          onCheckedChange={(checked) => updateConfig({ enabled: checked === true })}
          disabled={disabled}
        />
        <span className="text-sm font-medium">Organisation automatique</span>
      </div>

      {/* Panneau de configuration (visible seulement si activé) */}
      {currentConfig.enabled && (
        <div className="space-y-3 pl-6">
          
          {/* Case à cocher : Utiliser les valeurs globales */}
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-slate-600">
            <Checkbox
              id="use-global-defaults"
              checked={currentConfig.useGlobalDefaults === true}
              onCheckedChange={(checked) => updateConfig({ useGlobalDefaults: checked === true })}
              disabled={disabled}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Utiliser les valeurs par défaut globales
            </span>
          </div>

          {/* Paramètres personnalisés (affichés uniquement si valeurs globales NON utilisées) */}
          {!currentConfig.useGlobalDefaults && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Marge gauche (px)
                </Label>
                <Input
                  type="number"
                  value={currentConfig.leftMargin}
                  onChange={(e) => updateConfig({ leftMargin: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                  min="0"
                  max="50"
                  disabled={disabled}
                />
              </div>
              
              <div>
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Marge haut (px)
                </Label>
                <Input
                  type="number"
                  value={currentConfig.topMargin}
                  onChange={(e) => updateConfig({ topMargin: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                  min="0"
                  max="50"
                  disabled={disabled}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Espacement entre colonnes (px)
                </Label>
                <Input
                  type="number"
                  value={currentConfig.itemSpacing}
                  onChange={(e) => updateConfig({ itemSpacing: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                  min="0"
                  max="50"
                  disabled={disabled}
                />
              </div>
              
              <div>
                <Label className="text-xs text-slate-600 dark:text-slate-400">
                  Interligne (px)
                </Label>
                <Input
                  type="number"
                  value={currentConfig.lineSpacing}
                  onChange={(e) => updateConfig({ lineSpacing: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                  min="0"
                  max="30"
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          {/* Affichage en lecture seule des valeurs effectives (si mode global activé) */}
          {currentConfig.useGlobalDefaults && (
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded">
              <div className="font-medium mb-1">Valeurs effectives (globales) :</div>
              <div>Marges: {displayValues.leftMargin}px (gauche) / {displayValues.topMargin}px (haut)</div>
              <div>Espacements: {displayValues.itemSpacing}px (colonnes) / {displayValues.lineSpacing}px (lignes)</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
