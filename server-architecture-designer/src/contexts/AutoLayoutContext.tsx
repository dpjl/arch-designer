import React, { createContext, useContext } from 'react';
import { AutoLayoutConfig } from '@/types/diagram';

// Configuration globale par défaut (enabled n'est pas utilisé pour les valeurs globales)
const DEFAULT_GLOBAL_AUTO_LAYOUT: AutoLayoutConfig = {
  enabled: true, // ← Pas utilisé, mais on met true pour éviter confusion
  leftMargin: 16,
  topMargin: 16,
  itemSpacing: 12,
  lineSpacing: 8,
  useGlobalDefaults: false // ← Pas utilisé non plus pour les valeurs globales
};

interface AutoLayoutContextType {
  globalConfig: AutoLayoutConfig;
  updateGlobalConfig: (config: Partial<AutoLayoutConfig>) => void;
}

const AutoLayoutContext = createContext<AutoLayoutContextType | undefined>(undefined);

interface AutoLayoutProviderProps {
  children: React.ReactNode;
  globalConfig: AutoLayoutConfig;
  onUpdateGlobalConfig: (config: AutoLayoutConfig) => void;
}

export const AutoLayoutProvider: React.FC<AutoLayoutProviderProps> = ({
  children,
  globalConfig,
  onUpdateGlobalConfig
}) => {
  const updateGlobalConfig = (config: Partial<AutoLayoutConfig>) => {
    const newConfig = { ...globalConfig, ...config };
    onUpdateGlobalConfig(newConfig);
  };  return (
    <AutoLayoutContext.Provider value={{ globalConfig, updateGlobalConfig }}>
      {children}
    </AutoLayoutContext.Provider>
  );
};

export const useAutoLayoutContext = () => {
  const context = useContext(AutoLayoutContext);
  if (context === undefined) {
    throw new Error('useAutoLayoutContext must be used within an AutoLayoutProvider');
  }
  return context;
};

export { DEFAULT_GLOBAL_AUTO_LAYOUT };
