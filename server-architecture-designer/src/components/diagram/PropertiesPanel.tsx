"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Trash2, 
  Check, 
  Settings, 
  Palette, 
  Box, 
  Network, 
  Shield, 
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Users,
  Image,
  Type,
  Link,
  Grid,
  Target,
  Layers,
  Zap,
  Globe,
  Square,
  Minus
} from 'lucide-react';
import { CATALOG } from '@/lib/catalog';
import { autoTextColor } from '@/lib/utils';
import { useGroups } from '@/contexts/GroupsContext';
import { isAuto } from './color-utils';
import { AutoLayoutControls } from './AutoLayoutControls';
import { AutoLayoutConfig } from '@/types/diagram';
import { useStableInput } from './hooks/useStableInput';
import { useInstanceGroups } from '@/contexts/InstanceGroupsContext';
import { getDefaultLShapeConfig } from './utils/lshape-utils';

const DEFAULT_AUTO_LAYOUT: AutoLayoutConfig = {
  enabled: false,
  leftMargin: 16,
  topMargin: 16,
  itemSpacing: 12,
  lineSpacing: 8,
  useGlobalDefaults: false
};

export interface PropertiesPanelProps {
  selection: any;
  onChange: (patch: any) => void;
  onDelete: () => void;
  onClosePanel?: () => void;
  multiCount?: number;
  onDeleteSelected: () => void;
  networks: any[];
  globalAutoLayoutConfig: AutoLayoutConfig;
}

// Composants utilitaires
const SectionTitle: React.FC<React.PropsWithChildren<{ 
  icon?: React.ReactNode; 
  collapsible?: boolean; 
  collapsed?: boolean; 
  onToggle?: () => void 
}>> = ({ children, icon, collapsible = false, collapsed = false, onToggle }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{children}</h4>
    </div>
    {collapsible && onToggle && (
      <button 
        onClick={onToggle}
        className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        title={collapsed ? "Développer" : "Replier"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
    )}
  </div>
);

const CollapsibleSection: React.FC<React.PropsWithChildren<{ 
  title: string; 
  icon?: React.ReactNode; 
  defaultCollapsed?: boolean;
  className?: string;
}>> = ({ title, icon, defaultCollapsed = false, children, className = "" }) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <SectionTitle 
        icon={icon} 
        collapsible 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)}
      >
        {title}
      </SectionTitle>
      {!collapsed && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

const IconToggleButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}> = ({ icon, title, active = false, onClick, variant = 'default' }) => {
  const baseClasses = "h-8 w-8 rounded-lg border flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600";
  const activeClasses = variant === 'destructive' 
    ? "ring-2 ring-red-500 border-red-400 dark:ring-red-400 dark:border-red-400" 
    : "ring-2 ring-blue-500 border-blue-400 dark:ring-blue-400 dark:border-blue-400";
  const inactiveClasses = "border-slate-200 dark:border-slate-500";
  
  return (
    <button 
      type="button" 
      title={title} 
      onClick={onClick} 
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      {icon}
    </button>
  );
};

const ColorPicker: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  hasAuto?: boolean;
  onAutoToggle?: () => void;
  isAuto?: boolean;
}> = ({ label, value, onChange, hasAuto = false, onAutoToggle, isAuto = false }) => (
  <div className="space-y-1">
    <Label className="text-xs text-slate-600 dark:text-slate-400">{label}</Label>
    <div className="flex items-center gap-1">
      {hasAuto && onAutoToggle && (
        <button 
          type="button" 
          onClick={onAutoToggle} 
          className={`px-2 h-8 rounded-md text-[10px] border transition-colors ${
            isAuto 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Auto
        </button>
      )}
      <Input 
        type="color" 
        className="h-8 w-12 p-1 flex-1" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  </div>
);

// Composant pour l'éditeur de réseaux inline
const NetworksInlineEditor = ({ selection, onChange, networks }: any) => {
  const ids: string[] = selection?.data?.networks || [];
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter(x=>x!==id) : ids.concat(id);
    onChange({ data: { networks: next } });
  };
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {networks.map((n:any) => (
        <button 
          key={n.id} 
          type="button" 
          onClick={()=>toggle(n.id)} 
          className="px-2 py-1 rounded-full border text-[11px] transition-colors" 
          style={{ 
            background: ids.includes(n.id) ? n.color : '#ffffff', 
            color: ids.includes(n.id) ? autoTextColor(n.color) : '#334155', 
            borderColor: n.color 
          }}
        >
          {n.label||n.id}
        </button>
      ))}
    </div>
  );
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selection, 
  onChange, 
  onDelete, 
  onClosePanel, 
  multiCount, 
  onDeleteSelected, 
  networks,
  globalAutoLayoutConfig 
}) => {
  // État et hooks
  const { groups, addGroup, updateGroup, removeGroup, pickSmartColor } = useGroups();
  const { groups: instGroups, addGroup: addInstGroup, updateGroup: updateInstGroup, removeGroup: removeInstGroup, pickSmartColor: pickInstSmartColor } = useInstanceGroups();
  
  // State for UI interactions
  const [openPartitionPickerIndex, setOpenPartitionPickerIndex] = React.useState<number | null>(null);
  const [pickerQuery, setPickerQuery] = React.useState('');
  const [pickerPage, setPickerPage] = React.useState(1);
  const [openTextIndex, setOpenTextIndex] = React.useState<number | null>(null);
  const [openUrlIndex, setOpenUrlIndex] = React.useState<number | null>(null);
  const [openGroupPicker, setOpenGroupPicker] = React.useState(false);
  const [groupFilter, setGroupFilter] = React.useState('');
  
  const pageSize = 24;
  const filteredCatalog = React.useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((c: any) => ((c.label || c.id || '').toLowerCase().includes(q)));
  }, [pickerQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredCatalog.length / pageSize));
  const currentItems = React.useMemo(() => {
    const start = (pickerPage - 1) * pageSize;
    return filteredCatalog.slice(start, start + pageSize);
  }, [filteredCatalog, pickerPage]);
  const filteredGroups = React.useMemo(() => groups.filter(g => g.label.toLowerCase().includes(groupFilter.toLowerCase())), [groups, groupFilter]);
  
  // Close pickers when selection changes
  React.useEffect(() => { 
    setOpenPartitionPickerIndex(null); 
    setOpenUrlIndex(null); 
    setPickerQuery(''); 
    setPickerPage(1); 
  }, [selection?.id]);
  
  // Drapeaux d'identification
  const isNode = !!selection && selection.type === 'node';
  const isContainer = isNode && !!selection.data?.isContainer;
  const isDoor = isNode && !!selection.data?.isDoor;
  const isNetwork = isNode && selection.nodeType === 'network';
  const isService = isNode && !isContainer && !isDoor && !isNetwork;

  // Aspect ratio helpers
  const aspect = (selection?.data?.aspect || {}) as { locked?: boolean; ratio?: number; preset?: string; custom?: { w?: number; h?: number } };
  const presets: { id: string; label: string; ratio?: number }[] = [
    { id: 'a4p', label: 'A4 ↕', ratio: 210/297 },
    { id: 'a4l', label: 'A4 ↔', ratio: 297/210 },
    { id: '1:1', label: '1:1', ratio: 1 },
    { id: '4:3', label: '4:3', ratio: 4/3 },
    { id: '16:9', label: '16:9', ratio: 16/9 },
    { id: 'custom', label: 'Custom' },
  ];
  
  const currentRatio = (() => {
    if (aspect?.locked && typeof aspect?.ratio === 'number' && aspect.ratio > 0) return aspect.ratio;
    const w = Number(selection?.data?.width || 0);
    const h = Number(selection?.data?.height || 0);
    return w > 0 && h > 0 ? (w / h) : (16/9);
  })();
  
  const handleAspectToggle = (locked: boolean) => {
    if (!isNode) return;
    if (locked) {
      const w = Number(selection?.data?.width || 0);
      const h = Number(selection?.data?.height || 0);
      const r = w > 0 && h > 0 ? (w / h) : (16/9);
      const newH = h > 0 ? Math.max(1, Math.round(w / r)) : Math.round(w / r);
      onChange({ data: { width: w, height: newH, aspect: { locked: true, ratio: r, preset: undefined, custom: undefined } } });
    } else {
      onChange({ data: { aspect: { locked: false } } });
    }
  };
  
  const applyPreset = (id: string) => {
    const p = presets.find(x => x.id === id);
    if (!p) return;
    if (p.id === 'custom') {
      const r = (aspect.custom?.w && aspect.custom?.h && aspect.custom.h>0) ? (aspect.custom.w / aspect.custom.h) : currentRatio;
      const w = Number(selection?.data?.width || 0);
      const h = Math.max(1, Math.round(w / r));
      onChange({ data: { width: w, height: h, aspect: { ...(aspect||{}), locked: true, preset: 'custom', ratio: r } } });
    } else {
      const r = p.ratio || currentRatio;
      const w = Number(selection?.data?.width || 0);
      const h = Math.max(1, Math.round(w / r));
      onChange({ data: { width: w, height: h, aspect: { locked: true, preset: p.id, ratio: r } } });
    }
  };
  
  const applyCustomWH = (which: 'w'|'h', value: number) => {
    const w = which==='w' ? value : (aspect.custom?.w ?? 16);
    const h = which==='h' ? value : (aspect.custom?.h ?? 9);
    const safeW = Math.max(1, Math.round(w));
    const safeH = Math.max(1, Math.round(h));
    const ratio = safeW / safeH;
    const curW = Number(selection?.data?.width || 0);
    const newH = Math.max(1, Math.round(curW / ratio));
    onChange({ data: { width: curW, height: newH, aspect: { locked: true, preset: 'custom', custom: { w: safeW, h: safeH }, ratio } } });
  };

  // Inputs stables
  const nodeLabel = useStableInput(
    selection?.id || '',
    (isNode && !isNetwork ? (selection?.data?.label || '') : ''),
    (val) => { if (isNode && !isNetwork) onChange({ data: { label: val } }); }
  );
  
  const netLabel = useStableInput(
    selection?.id || '',
    (isNetwork ? (selection?.data?.label || '') : ''),
    (val) => { if (isNetwork) onChange({ data: { label: val } }); }
  );

  const iconUrl = useStableInput(
    selection?.id || '',
    (isNode ? (selection?.data?.icon || '') : ''),
    (val) => { if (isNode) onChange({ data: { icon: val } }); }
  );

  // Cas de sélection multiple
  if ((multiCount || 0) > 1) {
    return (
      <Card className="rounded-xl text-[13px] bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-semibold">Sélection multiple</CardTitle>
            </div>
            {onClosePanel && (
              <button onClick={onClosePanel} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title="Fermer">
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              {multiCount}
            </span>
            éléments sélectionnés
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="destructive" size="sm" onClick={onDeleteSelected} className="rounded-lg">
              <Trash2 className="h-4 w-4 mr-2"/>Supprimer
            </Button>
            <Button variant="secondary" size="sm" onClick={()=> onChange({ wrapSelectionInContainer: true })} className="rounded-lg">
              <Box className="h-4 w-4 mr-2"/>Créer conteneur
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cas sans sélection
  if (!selection) {
    return (
      <Card className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-sm font-semibold">Aucune sélection</CardTitle>
            </div>
            {onClosePanel && (
              <button onClick={onClosePanel} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title="Fermer">
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
            Sélectionnez un élément pour modifier ses propriétés
          </div>
        </CardContent>
      </Card>
    );
  }

  // Interface principale
  return (
    <Card className="rounded-xl text-[13px] bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isNode ? (
              isNetwork ? <Network className="h-4 w-4 text-emerald-500" /> :
              isContainer ? <Box className="h-4 w-4 text-purple-500" /> :
              isDoor ? <Shield className="h-4 w-4 text-orange-500" /> :
              <Settings className="h-4 w-4 text-blue-500" />
            ) : (
              <Zap className="h-4 w-4 text-slate-500" />
            )}
            <CardTitle className="text-sm font-semibold">
              {isNode ? (
                isNetwork ? 'Réseau' :
                isContainer ? 'Conteneur' :
                isDoor ? 'Porte' :
                'Service'
              ) : 'Lien'}
            </CardTitle>
          </div>
          {onClosePanel && (
            <button onClick={onClosePanel} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title="Fermer">
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {isNode ? (
          <>
            {/* Section Identité */}
            <div className="space-y-3">
              <SectionTitle icon={<Type className="h-3.5 w-3.5" />}>Identité</SectionTitle>
              
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Nom</Label>
                <Input 
                  value={isNetwork ? netLabel.value : nodeLabel.value} 
                  onChange={isNetwork ? netLabel.onChange : nodeLabel.onChange} 
                  onBlur={isNetwork ? netLabel.onBlur : nodeLabel.onBlur} 
                  onKeyDown={isNetwork ? netLabel.onKeyDown : nodeLabel.onKeyDown}
                  className="h-8"
                  placeholder={isNetwork ? "Nom du réseau" : isDoor ? "Protocole autorisé" : "Nom du service"}
                />
              </div>

              {/* Options de mode pour les services */}
              {isService && (
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!selection.data.isContainer}
                      onCheckedChange={(v) => {
                        const makeContainer = !!v;
                        if (makeContainer) {
                          const w = selection.data.width || 520; 
                          const h = selection.data.height || 320;
                          onChange({ 
                            data: { 
                              isContainer: true, 
                              width: w, 
                              height: h, 
                              bgColor: selection.data.bgColor||'#ffffff', 
                              bgOpacity: selection.data.bgOpacity ?? 0.85 
                            } 
                          });
                        } else {
                          onChange({ data: { isContainer: false }, style: { width: undefined, height: undefined } });
                        }
                      }}
                    />
                    <Label className="text-xs cursor-pointer">Conteneur</Label>
                  </div>
                  
                  {!selection.data?.isContainer && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!!selection.data.compact}
                        onCheckedChange={(v) => onChange({ data: { compact: !!v } })}
                      />
                      <Label className="text-xs cursor-pointer">Compact</Label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section Apparence */}
            <CollapsibleSection title="Apparence" icon={<Palette className="h-3.5 w-3.5" />}>
              
              {/* Icône */}
              {!isDoor && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">Icône</Label>
                  <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-700/30">
                    {CATALOG.slice(0, 18).map(c => {
                      const active = selection.data.icon === c.icon;
                      return (
                        <button 
                          key={c.id} 
                          type="button" 
                          onClick={() => onChange({ data: { icon: c.icon } })} 
                          className={`h-8 w-8 rounded-lg border bg-white/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center justify-center p-1 ${
                            active ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200 dark:border-slate-600'
                          }`}
                          title={c.label}
                        >
                          <img src={c.icon} alt="" className="h-6 w-6 object-contain" />
                        </button>
                      );
                    })}
                  </div>
                  <Input 
                    className="h-8 text-xs" 
                    placeholder="URL personnalisée..." 
                    value={iconUrl.value} 
                    onChange={iconUrl.onChange} 
                    onBlur={iconUrl.onBlur} 
                    onKeyDown={iconUrl.onKeyDown} 
                  />
                </div>
              )}

              {/* Couleurs */}
              <div className="grid grid-cols-2 gap-3">
                <ColorPicker
                  label="Bordure"
                  value={isAuto(selection.data.color) ? '#94a3b8' : (selection.data.color || '#94a3b8')}
                  onChange={(val) => onChange({ data: { color: val } })}
                  hasAuto={!isDoor && !isNetwork}
                  onAutoToggle={() => onChange({ data: { color: 'auto' } })}
                  isAuto={isAuto(selection.data.color)}
                />

                {(isService || isContainer) && (
                  <ColorPicker
                    label="Fond"
                    value={isAuto(selection.data.bgColor) ? '#ffffff' : (selection.data.bgColor || '#ffffff')}
                    onChange={(val) => onChange({ data: { bgColor: val } })}
                    hasAuto={true}
                    onAutoToggle={() => onChange({ data: { bgColor: 'auto' } })}
                    isAuto={isAuto(selection.data.bgColor)}
                  />
                )}

                {isNetwork && (
                  <>
                    <ColorPicker
                      label="Réseau"
                      value={selection.data.color || '#10b981'}
                      onChange={(val) => onChange({ data: { color: val } })}
                    />
                    <ColorPicker
                      label="Texte"
                      value={selection.data.textColor || autoTextColor(selection.data.color||'#10b981')}
                      onChange={(val) => onChange({ data: { textColor: val } })}
                    />
                  </>
                )}
              </div>

              {/* Opacité */}
              {(isService || isContainer) && (
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    Opacité {Math.round((selection.data.bgOpacity ?? 1)*100)}%
                  </Label>
                  <input 
                    type="range" 
                    min={0.1} 
                    max={1} 
                    step={0.05} 
                    value={selection.data.bgOpacity ?? 1} 
                    onChange={(e) => onChange({ data: { bgOpacity: parseFloat(e.target.value) } })} 
                    className="w-full accent-blue-500" 
                  />
                </div>
              )}
            </CollapsibleSection>

            {/* Section Fonctionnalités pour les services */}
            {isService && (
              <CollapsibleSection title="Fonctionnalités" icon={<Shield className="h-3.5 w-3.5" />}>
                <div className="grid grid-cols-4 gap-2">
                  <IconToggleButton
                    icon="🔑"
                    title="Auth simple"
                    active={!!selection.data.features?.auth1}
                    onClick={() => onChange({ data: { features: exclusiveAuthToggle(selection.data.features, 'auth1', !selection.data.features?.auth1) } })}
                  />
                  <IconToggleButton
                    icon="🔐"
                    title="Auth double"
                    active={!!selection.data.features?.auth2}
                    onClick={() => onChange({ data: { features: exclusiveAuthToggle(selection.data.features, 'auth2', !selection.data.features?.auth2) } })}
                  />
                  <IconToggleButton
                    icon="⏳"
                    title="Sablier"
                    active={!!selection.data.features?.hourglass}
                    onClick={() => onChange({ data: { features: { ...(selection.data.features||{}), hourglass: !selection.data.features?.hourglass } } })}
                  />
                  <IconToggleButton
                    icon="🛡️"
                    title="Firewall"
                    active={!!selection.data.features?.firewall}
                    onClick={() => onChange({ data: { features: { ...(selection.data.features||{}), firewall: !selection.data.features?.firewall } } })}
                    variant="destructive"
                  />
                </div>
                
                {selection.data.features?.firewall && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">Texte Firewall</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="FIREWALL"
                      value={selection.data.features?.firewallLabel || ''}
                      onChange={(e) => onChange({ data: { features: { ...(selection.data.features||{}), firewallLabel: e.target.value } } })}
                    />
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Section Groupe pour les services */}
            {isService && (
              <CollapsibleSection title="Groupe" icon={<Users className="h-3.5 w-3.5" />}>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">Groupe d'appartenance</Label>
                  <button 
                    type="button" 
                    onClick={() => setOpenGroupPicker(v => !v)} 
                    className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"
                    title="Choisir un groupe"
                  >
                    <Users className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                {selection.data.groupId && (
                  <div className="flex items-center gap-2">
                    <span 
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs flex-1" 
                      style={{ 
                        background: (groups.find(g=>g.id===selection.data.groupId)?.color)||'#ffffff', 
                        color: autoTextColor(groups.find(g=>g.id===selection.data.groupId)?.color||'#ffffff'), 
                        borderColor: groups.find(g=>g.id===selection.data.groupId)?.color 
                      }}
                    >
                      {groups.find(g=>g.id===selection.data.groupId)?.label || '—'}
                    </span>
                    <button 
                      className="px-2 h-8 rounded-md border text-xs hover:bg-slate-50 dark:hover:bg-slate-700" 
                      onClick={() => onChange({ data: { groupId: undefined } })}
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                {openGroupPicker && (
                  <div className="p-2 rounded-lg border bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Input 
                        className="h-8 text-xs flex-1" 
                        placeholder="Rechercher groupe…" 
                        value={groupFilter} 
                        onChange={e => setGroupFilter(e.target.value)} 
                      />
                      <button 
                        type="button" 
                        className="px-2 h-8 rounded-md border text-xs hover:bg-slate-50 dark:hover:bg-slate-700" 
                        onClick={() => { addGroup('Groupe', pickSmartColor()); setGroupFilter(''); }}
                      >
                        + Ajouter
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {filteredGroups.map(g => (
                        <div key={g.id} className="flex items-center gap-2 p-2 rounded-md border" style={{ borderColor: g.color }}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="h-4 w-4 rounded-full border" style={{ background: g.color, borderColor: g.color }} />
                            <Input 
                              className="h-8 text-xs flex-1" 
                              value={g.label} 
                              onChange={(e) => updateGroup(g.id, { label: e.target.value })} 
                            />
                            <Input 
                              type="color" 
                              className="h-8 w-12 p-1" 
                              value={g.color} 
                              onChange={(e) => updateGroup(g.id, { color: e.target.value })} 
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              type="button" 
                              className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700" 
                              onClick={() => onChange({ data: { groupId: g.id } })}
                              title="Choisir"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              type="button" 
                              className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700" 
                              onClick={() => removeGroup(g.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredGroups.length === 0 && (
                        <div className="text-xs text-slate-500 text-center py-2">Aucun groupe trouvé</div>
                      )}
                    </div>
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Section Largeur pour les services */}
            {isService && (
              <CollapsibleSection title="Dimensions" icon={<Grid className="h-3.5 w-3.5" />}>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">Mode largeur</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {['fixed', 'auto', 'custom'].map(mode => {
                      const active = (selection.data.widthMode || 'fixed') === mode;
                      return (
                        <button 
                          key={mode} 
                          type="button" 
                          onClick={() => onChange({ data: { widthMode: mode } })} 
                          className={`px-2 h-8 rounded-lg border text-xs transition-colors capitalize ${
                            active ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                  
                  {(selection.data.widthMode === 'custom') && (
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Largeur personnalisée</Label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min={140} 
                          max={800} 
                          step={10} 
                          value={selection.data.customWidth || 240} 
                          onChange={(e) => onChange({ data: { customWidth: parseInt(e.target.value, 10) } })} 
                          className="flex-1 accent-blue-500" 
                        />
                        <Input 
                          type="number" 
                          className="w-20 h-8 text-xs" 
                          value={selection.data.customWidth || 240} 
                          onChange={(e) => onChange({ data: { customWidth: parseInt(e.target.value, 10) || 240 } })} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* Section Instances pour les services */}
            {isService && (
              <CollapsibleSection title="Instances" icon={<Layers className="h-3.5 w-3.5" />} defaultCollapsed={true}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!selection.data.useServiceColorForInstances}
                      onCheckedChange={e => onChange({ data: { useServiceColorForInstances: !!e } })}
                    />
                    <Label className="text-xs cursor-pointer">Utiliser couleur du service</Label>
                  </div>
                  
                  <div className="space-y-2">
                    {(selection.data.instances || []).map((ins: any, idx: number) => {
                      const auth = ins?.auth as ('auth1'|'auth2'|undefined);
                      const grp = instGroups.find(g => g.id === ins?.groupId);
                      return (
                        <div key={idx} className="p-2 rounded-md border bg-slate-50/50 dark:bg-slate-700/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Instance #{idx+1}</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const list = [...(selection.data.instances||[])]; 
                                list.splice(idx,1); 
                                onChange({ data: { instances: list } }); 
                              }} 
                              className="h-6 w-6 rounded-md border text-xs hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                              ✕
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <select 
                              className="flex-1 p-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600" 
                              value={ins?.groupId || ''} 
                              onChange={(e) => {
                                const gid = e.target.value || undefined;
                                const list = [...(selection.data.instances||[])];
                                list[idx] = { ...list[idx], groupId: gid };
                                onChange({ data: { instances: list } });
                              }}
                            >
                              <option value="">— choisir groupe —</option>
                              {instGroups.map(g => (<option key={g.id} value={g.id}>{g.label}</option>))}
                            </select>
                            <button 
                              type="button" 
                              className="h-7 px-2 rounded border text-xs hover:bg-slate-50 dark:hover:bg-slate-700" 
                              title="Ajouter groupe d'instances" 
                              onClick={() => addInstGroup('Groupe', pickInstSmartColor())}
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <button 
                                type="button" 
                                onClick={() => {
                                  const list = [...(selection.data.instances||[])]; 
                                  list[idx] = {...list[idx], auth: undefined}; 
                                  onChange({ data: { instances: list } }); 
                                }} 
                                className={`h-7 w-7 rounded-md border text-xs ${!auth ? 'ring-2 ring-slate-400 border-slate-300' : 'border-slate-200'}`}
                                title="Aucune auth"
                              >
                                —
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  const list = [...(selection.data.instances||[])]; 
                                  list[idx] = {...list[idx], auth: 'auth1'}; 
                                  onChange({ data: { instances: list } }); 
                                }} 
                                className={`h-7 w-7 rounded-md border text-xs ${auth==='auth1' ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200'}`}
                                title="Auth simple"
                              >
                                🔑
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  const list = [...(selection.data.instances||[])]; 
                                  list[idx] = {...list[idx], auth: 'auth2'}; 
                                  onChange({ data: { instances: list } }); 
                                }} 
                                className={`h-7 w-7 rounded-md border text-xs ${auth==='auth2' ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200'}`}
                                title="Auth double"
                              >
                                🔐
                              </button>
                            </div>
                            
                            {grp && (
                              <div 
                                className="h-7 px-2 rounded-md border text-xs flex items-center gap-2 flex-1" 
                                style={{ 
                                  background: grp.color, 
                                  color: autoTextColor(grp.color), 
                                  borderColor: grp.color 
                                }}
                              >
                                <span className="truncate">{grp.label}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total: {(selection.data.instances||[]).length}</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        const gid = (instGroups[0]?.id) || addInstGroup('Groupe', pickInstSmartColor()).id;
                        const list = [...(selection.data.instances||[])];
                        list.push({ groupId: gid });
                        onChange({ data: { instances: list } });
                      }}
                      className="h-8"
                    >
                      + Instance
                    </Button>
                  </div>
                  
                  {/* Éditeur inline des groupes d'instances */}
                  <div className="p-2 rounded border bg-white/70 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-500 flex-1">Groupes d'instances</span>
                      <button 
                        type="button" 
                        className="h-7 px-2 rounded-md border text-xs hover:bg-slate-50 dark:hover:bg-slate-700" 
                        onClick={() => addInstGroup('Groupe', pickInstSmartColor())}
                      >
                        + Ajouter
                      </button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {instGroups.map(g => (
                        <div key={g.id} className="flex items-center gap-2 p-1 rounded border" style={{ borderColor: g.color }}>
                          <Input 
                            className="h-7 text-xs flex-1" 
                            value={g.label} 
                            onChange={(e) => updateInstGroup(g.id, { label: e.target.value })} 
                          />
                          <Input 
                            type="color" 
                            className="h-7 w-8 p-0.5" 
                            value={g.color} 
                            onChange={(e) => updateInstGroup(g.id, { color: e.target.value })} 
                          />
                          <button 
                            type="button" 
                            className="h-7 w-7 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-700" 
                            onClick={() => removeInstGroup(g.id)}
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {instGroups.length === 0 && (
                        <div className="text-xs text-slate-500 text-center py-2">Aucun groupe d'instances</div>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Section Réseaux pour les services */}
            {isService && networks.length > 0 && (
              <CollapsibleSection title="Réseaux" icon={<Globe className="h-3.5 w-3.5" />}>
                <NetworksInlineEditor selection={selection} onChange={onChange} networks={networks} />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!selection.data?.autoLinkToNetworks}
                    onCheckedChange={(v) => onChange({ data: { autoLinkToNetworks: !!v } })}
                  />
                  <Label className="text-xs cursor-pointer">Liens automatiques</Label>
                </div>
                {selection.data?.autoLinkToNetworks && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md">
                    💡 Des liens seront créés automatiquement vers les réseaux sélectionnés
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Section Auto-layout pour conteneurs et réseaux */}
            {(isContainer || isNetwork) && (
              <CollapsibleSection title="Auto-layout" icon={<Grid className="h-3.5 w-3.5" />} defaultCollapsed={false}>
                <AutoLayoutControls
                  config={selection.data.autoLayout || DEFAULT_AUTO_LAYOUT}
                  globalConfig={globalAutoLayoutConfig}
                  onChange={(config) => {
                    onChange({ 
                      data: { autoLayout: config }, 
                      ...(config.enabled ? { applyAutoLayout: true } : {}) 
                    });
                  }}
                />
              </CollapsibleSection>
            )}

            {/* Section Dimensions pour conteneurs et réseaux */}
            {(isContainer || isNetwork) && (
              <CollapsibleSection title="Dimensions" icon={<Grid className="h-3.5 w-3.5" />}>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Largeur</Label>
                      <Input 
                        type="number" 
                        className="h-8" 
                        value={selection.data.width || 0} 
                        onChange={(e) => {
                          const w = Number(e.target.value) || 0;
                          if (aspect?.locked && currentRatio > 0) {
                            const h = Math.max(1, Math.round(w / currentRatio));
                            onChange({ data: { width: w, height: h } });
                          } else {
                            onChange({ data: { width: w } });
                          }
                        }} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Hauteur</Label>
                      <Input 
                        type="number" 
                        className="h-8" 
                        value={selection.data.height || 0} 
                        onChange={(e) => {
                          const h = Number(e.target.value) || 0;
                          if (aspect?.locked && currentRatio > 0) {
                            const w = Math.max(1, Math.round(h * currentRatio));
                            onChange({ data: { width: w, height: h } });
                          } else {
                            onChange({ data: { height: h } });
                          }
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Aspect ratio */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={!!aspect.locked} 
                        onCheckedChange={(v) => handleAspectToggle(!!v)} 
                      />
                      <Label className="text-xs cursor-pointer">Contraindre l'aspect</Label>
                    </div>
                    
                    {aspect.locked && (
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className="h-8 px-2 rounded border text-xs dark:bg-slate-700 dark:border-slate-600"
                          value={aspect.preset && presets.some(p=>p.id===aspect.preset) ? aspect.preset : 'custom'}
                          onChange={(e) => applyPreset(e.target.value)}
                        >
                          {presets.map(p => (<option key={p.id} value={p.id}>{p.label}</option>))}
                        </select>
                        
                        {aspect.preset === 'custom' && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="h-8 w-16 text-xs"
                              value={aspect.custom?.w ?? 16}
                              onChange={(e) => applyCustomWH('w', parseInt(e.target.value||'0',10) || 1)}
                            />
                            <span className="text-xs">:</span>
                            <Input
                              type="number"
                              className="h-8 w-16 text-xs"
                              value={aspect.custom?.h ?? 9}
                              onChange={(e) => applyCustomWH('h', parseInt(e.target.value||'0',10) || 1)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {aspect.locked && (
                      <div className="text-xs text-slate-500">Ratio: {currentRatio.toFixed(4)}</div>
                    )}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Section Forme pour conteneurs et réseaux */}
            {(isContainer || isNetwork) && (
              <CollapsibleSection title="Forme" icon={<Square className="h-3.5 w-3.5" />}>
                <div className="space-y-3">
                  {/* Sélecteur de forme */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">Type de forme</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onChange({ data: { shape: 'rectangle', lShape: undefined } })}
                        className={`h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          (selection.data.shape || 'rectangle') === 'rectangle'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Square className="h-6 w-6" />
                        <span className="text-xs">Rectangle</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const defaultLShape = selection.data.lShape || getDefaultLShapeConfig();
                          onChange({ data: { shape: 'l-shape', lShape: defaultLShape } });
                        }}
                        className={`h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          selection.data.shape === 'l-shape'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="relative">
                          <Square className="h-6 w-6" />
                          <Minus className="h-2 w-2 absolute -top-0.5 -right-0.5 bg-white dark:bg-slate-800 rounded" />
                        </div>
                        <span className="text-xs">Forme L</span>
                      </button>
                    </div>
                  </div>

                  {/* Configuration forme L */}
                  {selection.data.shape === 'l-shape' && (
                    <div className="space-y-3 p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-700/30">
                      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Configuration forme L</Label>
                      
                      {/* Sélection du coin coupé */}
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600 dark:text-slate-400">Coin amputé</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'top-left', label: 'Haut gauche', icon: '◤' },
                            { value: 'top-right', label: 'Haut droit', icon: '◥' },
                            { value: 'bottom-left', label: 'Bas gauche', icon: '◣' },
                            { value: 'bottom-right', label: 'Bas droit', icon: '◢' },
                          ].map(corner => {
                            const isActive = (selection.data.lShape?.cutCorner || 'top-right') === corner.value;
                            return (
                              <button
                                key={corner.value}
                                type="button"
                                onClick={() => {
                                  const currentLShape = selection.data.lShape || getDefaultLShapeConfig();
                                  onChange({ 
                                    data: { 
                                      lShape: { 
                                        ...currentLShape, 
                                        cutCorner: corner.value as any 
                                      } 
                                    } 
                                  });
                                }}
                                className={`h-12 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 text-xs ${
                                  isActive
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <span className="text-lg">{corner.icon}</span>
                                <span>{corner.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dimensions du coin coupé */}
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600 dark:text-slate-400">Dimensions du coin amputé</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Largeur</Label>
                            <Input
                              type="number"
                              className="h-8"
                              min={20}
                              max={Math.max(20, (selection.data.width || 520) - 20)}
                              value={selection.data.lShape?.cutWidth || 120}
                              onChange={(e) => {
                                const currentLShape = selection.data.lShape || getDefaultLShapeConfig();
                                const value = Math.max(20, Math.min(
                                  (selection.data.width || 520) - 20,
                                  parseInt(e.target.value) || 120
                                ));
                                onChange({ 
                                  data: { 
                                    lShape: { 
                                      ...currentLShape, 
                                      cutWidth: value 
                                    } 
                                  } 
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Hauteur</Label>
                            <Input
                              type="number"
                              className="h-8"
                              min={20}
                              max={Math.max(20, (selection.data.height || 320) - 20)}
                              value={selection.data.lShape?.cutHeight || 80}
                              onChange={(e) => {
                                const currentLShape = selection.data.lShape || getDefaultLShapeConfig();
                                const value = Math.max(20, Math.min(
                                  (selection.data.height || 320) - 20,
                                  parseInt(e.target.value) || 80
                                ));
                                onChange({ 
                                  data: { 
                                    lShape: { 
                                      ...currentLShape, 
                                      cutHeight: value 
                                    } 
                                  } 
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Presets rapides */}
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600 dark:text-slate-400">Presets rapides</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={() => {
                              const currentLShape = selection.data.lShape || getDefaultLShapeConfig();
                              const width = selection.data.width || 520;
                              const height = selection.data.height || 320;
                              onChange({ 
                                data: { 
                                  lShape: { 
                                    ...currentLShape, 
                                    cutWidth: Math.round(width * 0.25),
                                    cutHeight: Math.round(height * 0.25)
                                  } 
                                } 
                              });
                            }}
                          >
                            Petit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={() => {
                              const currentLShape = selection.data.lShape || getDefaultLShapeConfig();
                              const width = selection.data.width || 520;
                              const height = selection.data.height || 320;
                              onChange({ 
                                data: { 
                                  lShape: { 
                                    ...currentLShape, 
                                    cutWidth: Math.round(width * 0.4),
                                    cutHeight: Math.round(height * 0.4)
                                  } 
                                } 
                              });
                            }}
                          >
                            Grand
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* Section Partitions pour conteneurs et réseaux */}
            {(isContainer || isNetwork) && (
              <CollapsibleSection title="Partitions" icon={<Layers className="h-3.5 w-3.5" />} defaultCollapsed={false}>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">Nombre de partitions verticales</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      className="h-8"
                      value={selection.data.partitions ?? 1}
                      onChange={(e) => {
                        let v = parseInt(e.target.value, 10); 
                        if (isNaN(v)) v = 1; 
                        v = Math.max(1, Math.min(12, v));
                        onChange({ data: { partitions: v } });
                      }}
                    />
                  </div>
                  
                  {isNetwork && (
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Position du header</Label>
                      <div className="flex gap-2">
                        {['top', 'left'].map(p => {
                          const active = (selection.data.headerPos || 'top') === p;
                          return (
                            <button 
                              key={p} 
                              type="button" 
                              onClick={() => onChange({ data: { headerPos: p } })} 
                              className={`px-3 h-8 rounded-lg border text-xs capitalize transition-colors ${
                                active ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {p === 'top' ? 'Haut' : 'Gauche'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Badges par partition */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">Badges par partition</Label>
                    <div className="space-y-2">
                      {Array.from({ length: Math.max(1, (selection.data.partitions ?? 1)) }).map((_, i) => {
                        const idx = i;
                        const value = (selection.data.partitionIcons || [])[idx] || '';
                        return (
                          <div key={i} className="p-2 rounded-md border bg-slate-50/50 dark:bg-slate-700/30">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-md border bg-white dark:bg-slate-800 flex items-center justify-center">
                                  {value ? <img src={value} alt="" className="h-5 w-5 object-contain"/> : <span className="text-xs text-slate-400">—</span>}
                                </div>
                                <span className="text-xs text-slate-500">Partition {i+1}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  type="button" 
                                  onClick={() => setOpenTextIndex(openTextIndex === idx ? null : idx)} 
                                  className="h-7 w-7 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-700"
                                  title="Texte"
                                >
                                  🅣
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setOpenUrlIndex(openUrlIndex === idx ? null : idx)} 
                                  className="h-7 w-7 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-700"
                                  title="URL"
                                >
                                  🔗
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setOpenPartitionPickerIndex(openPartitionPickerIndex === idx ? null : idx)} 
                                  className="h-7 w-7 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-700"
                                  title="Catalogue"
                                >
                                  🖼️
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : []; 
                                    arr[idx] = ''; 
                                    onChange({ data: { partitionIcons: arr } }); 
                                  }} 
                                  className="h-7 w-7 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-700"
                                  title="Effacer"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            
                            {openTextIndex === idx && (
                              <div className="flex items-center gap-2 mb-2">
                                <Input 
                                  className="h-8 text-xs flex-1" 
                                  placeholder="Texte du badge…" 
                                  value={(selection.data.partitionBadgeTexts||[])[idx] || ''} 
                                  onChange={(e) => {
                                    const arr = Array.isArray(selection.data.partitionBadgeTexts) ? [...selection.data.partitionBadgeTexts] : [];
                                    arr[idx] = e.target.value;
                                    onChange({ data: { partitionBadgeTexts: arr } });
                                  }} 
                                />
                              </div>
                            )}
                            
                            {openUrlIndex === idx && (
                              <div className="flex items-center gap-2 mb-2">
                                <Input 
                                  className="h-8 text-xs flex-1" 
                                  placeholder="URL d'icône…" 
                                  value={value} 
                                  onChange={(e) => {
                                    const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : [];
                                    arr[idx] = e.target.value;
                                    onChange({ data: { partitionIcons: arr } });
                                  }} 
                                />
                              </div>
                            )}
                            
                            {openPartitionPickerIndex === idx && (
                              <div className="p-2 rounded-lg border bg-white dark:bg-slate-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <Input 
                                    className="h-8 text-xs flex-1" 
                                    placeholder="Rechercher…" 
                                    value={pickerQuery} 
                                    onChange={(e) => { setPickerQuery(e.target.value); setPickerPage(1); }} 
                                  />
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <button 
                                      type="button" 
                                      disabled={pickerPage <= 1} 
                                      onClick={() => setPickerPage(p => Math.max(1, p-1))} 
                                      className="px-2 h-8 rounded border disabled:opacity-40"
                                    >
                                      ‹
                                    </button>
                                    <span>{pickerPage}/{totalPages}</span>
                                    <button 
                                      type="button" 
                                      disabled={pickerPage >= totalPages} 
                                      onClick={() => setPickerPage(p => Math.min(totalPages, p+1))} 
                                      className="px-2 h-8 rounded border disabled:opacity-40"
                                    >
                                      ›
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-6 gap-1 max-h-32 overflow-auto">
                                  {currentItems.map(c => (
                                    <button 
                                      key={c.id} 
                                      type="button" 
                                      onClick={() => {
                                        const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : [];
                                        arr[idx] = c.icon;
                                        onChange({ data: { partitionIcons: arr } });
                                        setOpenPartitionPickerIndex(null);
                                      }} 
                                      className={`h-8 w-8 rounded-lg border bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center ${
                                        value === c.icon ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200 dark:border-slate-600'
                                      }`}
                                    >
                                      <img src={c.icon} alt="" className="h-5 w-5 object-contain" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Section Porte - dimensions et protocole */}
            {isDoor && (
              <CollapsibleSection title="Configuration" icon={<Shield className="h-3.5 w-3.5" />}>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">Protocole autorisé</Label>
                    <Input 
                      value={selection.data.allow || ''} 
                      placeholder="ex: HTTPS, SSH..." 
                      onChange={(e) => onChange({ data: { allow: e.target.value } })}
                      className="h-8"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      Largeur ({selection.data.width ?? 140}px)
                    </Label>
                    <input 
                      type="range" 
                      min={80} 
                      max={240} 
                      step={4} 
                      value={selection.data.width ?? 140} 
                      onChange={(e) => onChange({ data: { width: parseInt(e.target.value, 10) } })} 
                      className="w-full accent-blue-500" 
                    />
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Actions spéciales pour conteneurs */}
            {isContainer && (
              <CollapsibleSection title="Actions conteneur" icon={<Box className="h-3.5 w-3.5" />}>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onChange({ autoFitContainer: true })} 
                    className="w-full rounded-lg"
                  >
                    <Grid className="h-4 w-4 mr-2"/>Auto-ajuster aux enfants
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={!!selection.data.locked} 
                      onCheckedChange={(v) => onChange({ data: { locked: !!v } })} 
                    />
                    <Label className="text-xs cursor-pointer">Verrouiller le conteneur</Label>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Actions spéciales pour réseaux */}
            {isNetwork && (
              <CollapsibleSection title="Actions réseau" icon={<Network className="h-3.5 w-3.5" />}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onChange({ autoFitNetwork: true })} 
                  className="w-full rounded-lg"
                >
                  <Grid className="h-4 w-4 mr-2"/>Ajuster à ses éléments
                </Button>
              </CollapsibleSection>
            )}

            {/* Action pour détacher du parent */}
            {!isDoor && isNode && selection.parentNode && (
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onChange({ detachFromParent: true })} 
                  className="w-full rounded-lg"
                >
                  <Box className="h-4 w-4 mr-2"/>Détacher du conteneur
                </Button>
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Ou utilisez Alt+Glisser
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button variant="destructive" size="sm" onClick={onDelete} className="rounded-lg">
                <Trash2 className="h-4 w-4 mr-2"/>Supprimer
              </Button>
              
              {isContainer && (
                <Button variant="outline" size="sm" onClick={()=> onChange({ removeContainerKeepChildren: true })} className="rounded-lg">
                  <Box className="h-4 w-4 mr-2"/>Supprimer conteneur seulement
                </Button>
              )}
              
              {!isDoor && (
                <Button variant="outline" size="sm" onClick={()=> onChange({ wrapSelectionInContainer: true })} className="rounded-lg">
                  <Box className="h-4 w-4 mr-2"/>Créer conteneur autour
                </Button>
              )}
            </div>
          </>
        ) : (
          // Interface pour les liens
          <>
            <div className="space-y-3">
              <SectionTitle icon={<Type className="h-3.5 w-3.5" />}>Label</SectionTitle>
              <Input 
                value={selection.label || ''} 
                onChange={(e)=> onChange({ label: e.target.value })}
                className="h-8"
                placeholder="Nom du lien"
              />
            </div>

            {selection.data?.isNetworkLink && (
              <div className="text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Lien automatique vers réseau</span>
                </div>
              </div>
            )}

            <CollapsibleSection title="Style" icon={<Palette className="h-3.5 w-3.5" />}>
              
              {/* Positionnement des ancres */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Positionnement des extrémités</Label>
                
                {/* Presets rapides */}
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onChange({ 
                      data: { 
                        ...selection.data, 
                        sourceAnchor: { nodeId: selection.source, side: 'right', offset: 0.5 },
                        targetAnchor: { nodeId: selection.target, side: 'left', offset: 0.5 }
                      } 
                    })}
                  >
                    ➡️ Horizontal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onChange({ 
                      data: { 
                        ...selection.data, 
                        sourceAnchor: { nodeId: selection.source, side: 'bottom', offset: 0.5 },
                        targetAnchor: { nodeId: selection.target, side: 'top', offset: 0.5 }
                      } 
                    })}
                  >
                    ⬇️ Vertical
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onChange({ 
                      data: { 
                        ...selection.data, 
                        sourceAnchor: { nodeId: selection.source, side: 'bottom', offset: 0.2 },
                        targetAnchor: { nodeId: selection.target, side: 'top', offset: 0.8 }
                      } 
                    })}
                  >
                    ↗️ Diagonal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onChange({ 
                      data: { 
                        ...selection.data, 
                        sourceAnchor: undefined,
                        targetAnchor: undefined
                      } 
                    })}
                  >
                    🔄 Auto
                  </Button>
                </div>
                
                {/* Contrôles détaillés si ancres personnalisées */}
                {(selection.data?.sourceAnchor || selection.data?.targetAnchor) && (
                  <div className="p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-700/30 space-y-2">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Contrôles fins</div>
                    
                    {/* Source */}
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Source (départ)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          value={selection.data?.sourceAnchor?.side || 'right'}
                          onChange={(e) => onChange({ 
                            data: { 
                              ...selection.data, 
                              sourceAnchor: { 
                                nodeId: selection.source, 
                                side: e.target.value as any, 
                                offset: selection.data?.sourceAnchor?.offset || 0.5 
                              } 
                            } 
                          })}
                          className="h-7 px-2 text-xs border rounded dark:bg-slate-700 dark:border-slate-600"
                        >
                          <option value="top">Haut</option>
                          <option value="right">Droite</option>
                          <option value="bottom">Bas</option>
                          <option value="left">Gauche</option>
                        </select>
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(((selection.data?.sourceAnchor?.offset ?? 0.5) * 100))}
                          onChange={(e) => {
                            const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)); 
                            onChange({ 
                              data: { 
                                ...selection.data, 
                                sourceAnchor: { 
                                  nodeId: selection.source, 
                                  side: selection.data?.sourceAnchor?.side || 'right', 
                                  offset: v / 100 
                                } 
                              } 
                            });
                          }}
                          placeholder="%"
                        />
                      </div>
                    </div>
                    
                    {/* Target */}
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Cible (arrivée)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          value={selection.data?.targetAnchor?.side || 'left'}
                          onChange={(e) => onChange({ 
                            data: { 
                              ...selection.data, 
                              targetAnchor: { 
                                nodeId: selection.target, 
                                side: e.target.value as any, 
                                offset: selection.data?.targetAnchor?.offset || 0.5 
                              } 
                            } 
                          })}
                          className="h-7 px-2 text-xs border rounded dark:bg-slate-700 dark:border-slate-600"
                        >
                          <option value="top">Haut</option>
                          <option value="right">Droite</option>
                          <option value="bottom">Bas</option>
                          <option value="left">Gauche</option>
                        </select>
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(((selection.data?.targetAnchor?.offset ?? 0.5) * 100))}
                          onChange={(e) => {
                            const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)); 
                            onChange({ 
                              data: { 
                                ...selection.data, 
                                targetAnchor: { 
                                  nodeId: selection.target, 
                                  side: selection.data?.targetAnchor?.side || 'left', 
                                  offset: v / 100 
                                } 
                              } 
                            });
                          }}
                          placeholder="%"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Motif */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Motif</Label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    {id:'solid', title:'Continu'},
                    {id:'dashed', title:'Pointillés'},
                    {id:'animated', title:'Animé'},
                  ].map(opt => {
                    const active = (selection.data?.pattern || 'solid') === opt.id;
                    return (
                      <button 
                        key={opt.id} 
                        type="button" 
                        onClick={() => onChange({ data: { ...(selection.data||{}), pattern: opt.id } })} 
                        className={`h-8 px-2 rounded-lg border text-xs transition-colors ${
                          active ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.title}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Forme du lien */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Forme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {id:'smooth', title:'Courbe', type:'smoothstep'},
                    {id:'straight', title:'Droite', type:'default'},
                    {id:'step', title:'Angles', type:'step'},
                  ].map(opt => {
                    const active = (selection.data?.shape || 'smooth') === opt.id;
                    return (
                      <button 
                        key={opt.id} 
                        type="button" 
                        onClick={() => onChange({ type: opt.type, data:{...(selection.data||{}), shape:opt.id}})} 
                        className={`h-8 px-2 rounded-lg border text-xs transition-colors ${
                          active ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Couleur */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Couleur</Label>
                <Input 
                  type="color" 
                  className="h-8 w-full" 
                  value={selection.style?.stroke || '#94a3b8'} 
                  onChange={(e) => onChange({ style: { ...(selection.style || {}), stroke: e.target.value } })} 
                />
              </div>

              {/* Épaisseur */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Épaisseur</Label>
                <div className="grid grid-cols-5 gap-1">
                  {[1,2,3,4,6].map(w => { 
                    const active=(selection.style?.strokeWidth||2)===w; 
                    return (
                      <button 
                        key={w} 
                        type="button" 
                        onClick={()=> onChange({ style:{...(selection.style||{}), strokeWidth:w } })} 
                        className={`h-8 rounded-lg border flex items-center justify-center text-xs transition-colors ${
                          active ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {w}px
                      </button>
                    ); 
                  })}
                </div>
              </div>
            </CollapsibleSection>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button variant="destructive" size="sm" onClick={onDelete} className="w-full rounded-lg">
                <Trash2 className="h-4 w-4 mr-2"/>Supprimer le lien
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

function exclusiveAuthToggle(
  features: { auth1?: boolean; auth2?: boolean; hourglass?: boolean; firewall?: boolean } = {},
  which: 'auth1' | 'auth2',
  value: boolean
) {
  const base = { ...(features||{}) };
  if (which === 'auth1') {
    if (value) return { ...base, auth1: true, auth2: false };
    return { ...base, auth1: false };
  }
  if (which === 'auth2') {
    if (value) return { ...base, auth2: true, auth1: false };
    return { ...base, auth2: false };
  }
  return base;
}

export default PropertiesPanel;
