import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAutoLayoutContext } from '@/contexts/AutoLayoutContext';

interface GlobalAutoLayoutSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalAutoLayoutSettings: React.FC<GlobalAutoLayoutSettingsProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { globalConfig, updateGlobalConfig } = useAutoLayoutContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[400px] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Paramètres d'auto-layout globaux</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Marge gauche (px)</Label>
            <Input
              type="number"
              value={globalConfig.leftMargin}
              onChange={(e) => updateGlobalConfig({ leftMargin: parseInt(e.target.value) || 0 })}
              className="mt-1"
              min="0"
              max="50"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Marge haut (px)</Label>
            <Input
              type="number"
              value={globalConfig.topMargin}
              onChange={(e) => updateGlobalConfig({ topMargin: parseInt(e.target.value) || 0 })}
              className="mt-1"
              min="0"
              max="50"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Espacement entre colonnes (px)</Label>
            <Input
              type="number"
              value={globalConfig.itemSpacing}
              onChange={(e) => updateGlobalConfig({ itemSpacing: parseInt(e.target.value) || 0 })}
              className="mt-1"
              min="0"
              max="50"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Interligne (px)</Label>
            <Input
              type="number"
              value={globalConfig.lineSpacing}
              onChange={(e) => updateGlobalConfig({ lineSpacing: parseInt(e.target.value) || 0 })}
              className="mt-1"
              min="0"
              max="30"
            />
          </div>
        </div>

        <div className="flex justify-between gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => {
              // Réinitialiser aux valeurs par défaut
              updateGlobalConfig({
                leftMargin: 16,
                topMargin: 16,
                itemSpacing: 12,
                lineSpacing: 8
              });
            }}
          >
            Réinitialiser
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};
