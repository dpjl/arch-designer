"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Check } from 'lucide-react';
import { CATALOG } from '@/lib/catalog';
import { autoTextColor } from '@/lib/utils';
import { useGroups } from '@/contexts/GroupsContext';
import { isAuto } from './color-utils';
import { AutoLayoutControls } from './AutoLayoutControls';
import { AutoLayoutConfig } from '@/types/diagram';
import { useStableInput } from '@/hooks/useStableInput';
import { useInstanceGroups } from '@/contexts/InstanceGroupsContext';

const DEFAULT_AUTO_LAYOUT: AutoLayoutConfig = {
  enabled: false,
  leftMargin: 16,
  topMargin: 16,
  itemSpacing: 12,
  lineSpacing: 8,
  useGlobalDefaults: false // Par défaut false, peut être changé par l'utilisateur
};

export interface PropertiesPanelProps {
  selection: any;
  onChange: (patch: any) => void;
  onDelete: () => void;
  onClosePanel?: () => void;
  multiCount?: number;
  onDeleteSelected: () => void;
  networks: any[];
  globalAutoLayoutConfig: AutoLayoutConfig; // Ajout
}

const SectionTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h4 className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">{children}</h4>
);

function NetworksInlineEditor({ selection, onChange, networks }: any) {
  const ids: string[] = selection?.data?.networks || [];
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter(x=>x!==id) : ids.concat(id);
    onChange({ data: { ...selection.data, networks: next } });
  };
  return (
    <div className="flex flex-wrap gap-2">
      {networks.map((n:any) => (
        <button key={n.id} type="button" onClick={()=>toggle(n.id)} className="px-2 py-0.5 rounded-full border text-[11px]" style={{ background: ids.includes(n.id) ? n.color : '#ffffff', color: ids.includes(n.id) ? autoTextColor(n.color) : '#334155', borderColor: n.color }}>
          {n.label||n.id}
        </button>
      ))}
    </div>
  );
}

const DEFAULT_DOOR_WIDTH = 140;

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
  // Shared state for compact partition icon picker popover
  const { groups, addGroup, updateGroup, removeGroup, pickSmartColor } = useGroups();
  const { groups: instGroups, addGroup: addInstGroup, updateGroup: updateInstGroup, removeGroup: removeInstGroup, pickSmartColor: pickInstSmartColor } = useInstanceGroups();
  const [openPartitionPickerIndex, setOpenPartitionPickerIndex] = React.useState<number | null>(null);
  const [pickerQuery, setPickerQuery] = React.useState('');
  const [pickerPage, setPickerPage] = React.useState(1);
  const [openTextIndex, setOpenTextIndex] = React.useState<number | null>(null);
  const [openUrlIndex, setOpenUrlIndex] = React.useState<number | null>(null);
  const [openGroupPicker, setOpenGroupPicker] = React.useState(false);
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
  const [groupFilter, setGroupFilter] = React.useState('');
  const filteredGroups = React.useMemo(() => groups.filter(g => g.label.toLowerCase().includes(groupFilter.toLowerCase())), [groups, groupFilter]);
  // Close pickers when selection changes
  React.useEffect(() => { setOpenPartitionPickerIndex(null); setOpenUrlIndex(null); setPickerQuery(''); setPickerPage(1); }, [selection?.id]);
  // Compute flags early (guarded) and keep all hooks above any early returns
  const isNode = !!selection && selection.type === 'node';
  const isContainer = isNode && !!selection.data?.isContainer;
  const isDoor = isNode && !!selection.data?.isDoor;
  const isNetwork = isNode && selection.nodeType === 'network';
  // Stable buffered input for network label
  const netLabel = useStableInput(
    selection?.id || '',
    (isNetwork ? (selection?.data?.label || '') : ''),
    (val) => { if (isNetwork) onChange({ data: { ...selection.data, label: val } }); }
  );
  const nodeLabel = useStableInput(
    selection?.id || '',
    (isNode && !isNetwork ? (selection?.data?.label || '') : ''),
    (val) => { if (isNode && !isNetwork) onChange({ data: { ...selection.data, label: val } }); }
  );
  const iconUrl = useStableInput(
    selection?.id || '',
    (isNode ? (selection?.data?.icon || '') : ''),
    (val) => { if (isNode) onChange({ data: { ...selection.data, icon: val } }); }
  );
  if ((multiCount || 0) > 1) {
    return (
  <Card className="rounded-2xl text-[13px] bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-600 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Multiple selection</CardTitle>
            {onClosePanel && (
              <button onClick={onClosePanel} className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors" title="Masquer le panneau">▶</button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-slate-600 dark:text-slate-300">{multiCount} éléments sélectionnés.</div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={onDeleteSelected} className="rounded-md"><Trash2 className="h-4 w-4 mr-2"/>Supprimer</Button>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Maj+clic pour ajouter/retirer. Glisser un cadre pour sélectionner une zone.</div>
        </CardContent>
      </Card>
    );
  }
  if (!selection) {
    return (
  <Card className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-600 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">No selection</CardTitle>
            {onClosePanel && (
              <button onClick={onClosePanel} className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors" title="Masquer le panneau">▶</button>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Select a node or edge to edit its properties.</CardContent>
      </Card>
    );
  }

  // Flags and tempNetworkLabel are defined above to keep hook order stable

  return (
  <Card className="rounded-2xl text-[13px] bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-600 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{isNode ? 'Node' : 'Edge'} properties</CardTitle>
          {onClosePanel && (
            <button onClick={onClosePanel} className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors" title="Masquer le panneau">▶</button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-[13px]">
        {isNode ? (
          <>
            {isNetwork && (
              <div className="space-y-2">
                <SectionTitle>Network</SectionTitle>
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input {...netLabel} />
                </div>
                {/* Partition badges */}
                <div className="space-y-1">
                  <Label>Badges par partition</Label>
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: Math.max(1, (selection.data.partitions ?? 1)) }).map((_, i) => {
                      const idx = i;
                      const value = (selection.data.partitionIcons || [])[idx] || '';
                      // use shared popover state
                      return (
                        <div key={i} className="flex flex-col gap-1 p-2 rounded-md border bg-white/70 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <button type="button" aria-label="Effacer" title="Effacer" onClick={()=>{ const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : []; arr[idx] = ''; onChange({ data: { partitionIcons: arr } }); }} className="h-6 w-6 rounded border text-[11px] flex items-center justify-center">✕</button>
                              <div className="h-7 w-7 rounded-md border bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                {value ? <img src={value} alt="" className="h-5 w-5 object-contain"/> : <span className="text-[10px] text-slate-400">—</span>}
                              </div>
                              <span className="text-[11px] text-slate-500 truncate">Partition {i+1}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button type="button" title="Texte" aria-label="Texte" className="h-8 w-8 rounded-md border flex items-center justify-center" onClick={()=> { setOpenTextIndex(openTextIndex===idx?null:idx); }}>🅣</button>
                              <button type="button" title="URL icône" aria-label="URL icône" className="h-8 w-8 rounded-md border flex items-center justify-center" onClick={()=> { setOpenUrlIndex(openUrlIndex===idx?null:idx); if(openUrlIndex!==idx){ setPickerQuery(''); setPickerPage(1);} }}>🔗</button>
                              <button type="button" title="Parcourir" aria-label="Parcourir" className="h-8 w-8 rounded-md border flex items-center justify-center" onClick={()=> { setOpenPartitionPickerIndex(openPartitionPickerIndex === idx ? null : idx); setPickerQuery(''); setPickerPage(1); }}>🖼️</button>
                            </div>
                          </div>
                          {openTextIndex === idx && (
                            <div className="flex items-center gap-2">
                              <Input className="h-8 text-xs w-full" placeholder="Texte du badge…" value={(selection.data.partitionBadgeTexts||[])[idx] || ''} onChange={(e)=>{
                                const arr = Array.isArray(selection.data.partitionBadgeTexts) ? [...selection.data.partitionBadgeTexts] : [];
                                arr[idx] = e.target.value;
                                onChange({ data: { partitionBadgeTexts: arr } });
                              }} />
                              <button type="button" className="px-2 h-8 rounded-md border text-xs" onClick={()=>{ const arr = Array.isArray(selection.data.partitionBadgeTexts) ? [...selection.data.partitionBadgeTexts] : []; arr[idx] = ''; onChange({ data: { partitionBadgeTexts: arr } }); }}>Effacer</button>
                            </div>
                          )}
                          {openUrlIndex === idx && (
                            <div className="flex items-center gap-2">
                              <Input className="h-8 text-xs w-full" placeholder="URL d’icône…" value={value} onChange={(e)=>{
                                const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : [];
                                arr[idx] = e.target.value;
                                onChange({ data: { partitionIcons: arr } });
                              }} />
                              <button type="button" className="px-2 h-8 rounded-md border text-xs" onClick={()=>{ const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : []; arr[idx] = ''; onChange({ data: { partitionIcons: arr } }); }}>Effacer</button>
                            </div>
                          )}
                          {openPartitionPickerIndex === idx && (
                            <div className="mt-2 p-2 rounded-lg border bg-white dark:bg-slate-800 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <Input className="h-9 text-xs" placeholder="Rechercher…" value={pickerQuery} onChange={(e)=>{ setPickerQuery(e.target.value); setPickerPage(1); }} />
                                <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500">
                                  <button type="button" disabled={pickerPage<=1} onClick={()=> setPickerPage(p=>Math.max(1,p-1))} className="px-2 h-8 rounded border disabled:opacity-40">‹</button>
                                  <span>{pickerPage}/{totalPages}</span>
                                  <button type="button" disabled={pickerPage>=totalPages} onClick={()=> setPickerPage(p=>Math.min(totalPages,p+1))} className="px-2 h-8 rounded border disabled:opacity-40">›</button>
                                </div>
                              </div>
                              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-auto pr-1">
                                {currentItems.map(c => (
                                  <button key={c.id} type="button" onClick={()=>{
                                    const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : [];
                                    arr[idx] = c.icon;
                                    onChange({ data: { partitionIcons: arr } });
                                    setOpenPartitionPickerIndex(null);
                                  }} className={`h-10 w-10 rounded-lg border ${value===c.icon?'ring-2 ring-blue-500 border-blue-400':'border-slate-200 dark:border-slate-600'} bg-white dark:bg-slate-800 flex items-center justify-center`}>
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
                <div className="space-y-1">
                  <Label>Color</Label>
                  <Input type="color" className="h-9 w-10 p-1" value={selection.data.color || '#10b981'} onChange={(e)=> onChange({ data: { ...selection.data, color: e.target.value } })} />
                </div>
                <div className="space-y-1">
                  <Label>Text color</Label>
                  <Input type="color" className="h-9 w-10 p-1" value={selection.data.textColor || autoTextColor(selection.data.color||'#10b981')} onChange={(e)=> onChange({ data: { ...selection.data, textColor: e.target.value } })} />
                </div>
                <div className="space-y-1">
                  <Label>Partitions (vertical)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={selection.data.partitions ?? 1}
                    onChange={(e)=> {
                      let v = parseInt(e.target.value,10); if (isNaN(v)) v = 1; v = Math.max(1, Math.min(12, v));
                      onChange({ data: { ...selection.data, partitions: v } });
                    }}
                  />
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Header</span>
                  {['top','left'].map(p=>{ const active=(selection.data.headerPos||'top')===p; return <button key={p} type="button" onClick={()=> onChange({ data:{...selection.data, headerPos:p } })} className={`px-2 h-7 rounded-md text-[11px] border capitalize ${active?'bg-blue-500 text-white border-blue-500 dark:bg-blue-500':'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{p}</button>; })}
                </div>
                <div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => onChange({ autoFitNetwork: true })}>Ajuster à ses éléments</Button>
                </div>
                
                {/* Auto-layout section for networks */}
                <AutoLayoutControls
                  config={selection.data.autoLayout || DEFAULT_AUTO_LAYOUT}
                  globalConfig={globalAutoLayoutConfig}
                  onChange={(config) => {
                    // Mise à jour unique avec les nouvelles données ET déclenchement auto-layout
                    onChange({ 
                      data: { 
                        ...selection.data, 
                        autoLayout: config
                      },
                      ...(config.enabled ? { applyAutoLayout: true } : {})
                    });
                  }}
                />
              </div>
            )}
      {!isDoor && !isNetwork && (
              <div className="space-y-1">
                <Label>Label</Label>
        <Input {...nodeLabel} />
              </div>
            )}
            {/* Group assignment for service nodes (non-container) */}
            {!isDoor && !isNetwork && !isContainer && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <Label>Groupe</Label>
                  <button type="button" aria-label="Choisir un groupe" title="Choisir un groupe" className="h-8 w-8 rounded-md border flex items-center justify-center" onClick={()=> setOpenGroupPicker(v=>!v)}>👥</button>
                </div>
                {selection.data.groupId && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md border" style={{ background: (groups.find(g=>g.id===selection.data.groupId)?.color)||'#ffffff', color: autoTextColor(groups.find(g=>g.id===selection.data.groupId)?.color||'#ffffff'), borderColor: groups.find(g=>g.id===selection.data.groupId)?.color }}>
                      {groups.find(g=>g.id===selection.data.groupId)?.label || '—'}
                    </span>
                    <button className="px-2 h-8 rounded-md border text-xs" onClick={()=> onChange({ data: { groupId: undefined } })}>Retirer</button>
                  </div>
                )}
                {openGroupPicker && (
                  <div className="mt-2 p-2 rounded-lg border bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Input className="h-8 text-xs" placeholder="Rechercher groupe…" value={groupFilter} onChange={e=>setGroupFilter(e.target.value)} />
                      <button type="button" className="px-2 h-8 rounded-md border text-xs" onClick={()=>{ addGroup('Groupe', pickSmartColor()); setGroupFilter(''); }}>+ Ajouter</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-auto pr-1">
                      {filteredGroups.map(g => (
                        <div key={g.id} className="flex items-center justify-between gap-2 p-2 rounded-md border" style={{ borderColor: g.color }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-4 w-4 rounded-full border" style={{ background: g.color, borderColor: g.color }} />
                            <Input className="h-8 text-xs w-40" value={g.label} onChange={(e)=> updateGroup(g.id, { label: e.target.value })} />
                            <Input type="color" className="h-8 w-9 p-1" value={g.color} onChange={(e)=> updateGroup(g.id, { color: e.target.value })} />
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" title="Choisir" aria-label="Choisir" className="h-7 w-7 rounded-md border flex items-center justify-center" onClick={()=> onChange({ data: { groupId: g.id } })}>
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Supprimer" aria-label="Supprimer" className="h-7 w-7 rounded-md border flex items-center justify-center" onClick={()=> removeGroup(g.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredGroups.length===0 && (
                        <div className="text-[12px] text-slate-500">Aucun groupe. Cliquez sur “Ajouter”.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!isDoor && !isNetwork && (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  checked={!!selection.data.isContainer}
                  onCheckedChange={(v) => {
                    const makeContainer = !!v;
                    if (makeContainer) {
                      const w = selection.data.width || 520; const h = selection.data.height || 320;
                      onChange({ data: { ...selection.data, isContainer: true, width: w, height: h, bgColor: selection.data.bgColor||'#ffffff', bgOpacity: selection.data.bgOpacity ?? 0.85 } });
                    } else {
                      onChange({ data: { ...selection.data, isContainer: false }, style: { width: undefined, height: undefined } });
                    }
                  }}
                />
                <span className="text-xs">Mode container</span>
              </div>
            )}
            {/* Compact mode: only for service nodes (non-container, non-network, non-door) */}
            {!isDoor && !isNetwork && !selection.data?.isContainer && (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  checked={!!selection.data.compact}
                  onCheckedChange={(v) => onChange({ data: { ...selection.data, compact: !!v } })}
                />
                <span className="text-xs">Mode compact</span>
              </div>
            )}
            {!isDoor && !isNetwork && (
              <div className="space-y-1">
                <SectionTitle>Couleurs</SectionTitle>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">Bord</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={()=> onChange({ data:{ ...selection.data, color: 'auto' } })} className={`px-2 h-8 rounded-md text-[10px] border ${isAuto(selection.data.color)?'bg-blue-500 text-white border-blue-500':'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Auto</button>
                        <Input type="color" className="h-8 w-9 p-1" value={isAuto(selection.data.color)? '#94a3b8' : selection.data.color} onChange={(e) => onChange({ data: { ...selection.data, color: e.target.value } })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">Fond</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={()=> onChange({ data:{ ...selection.data, bgColor: 'auto' } })} className={`px-2 h-8 rounded-md text-[10px] border ${isAuto(selection.data.bgColor)?'bg-blue-500 text-white border-blue-500':'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Auto</button>
                        <Input type="color" className="h-8 w-9 p-1" value={isAuto(selection.data.bgColor)? '#ffffff' : selection.data.bgColor} onChange={(e) => onChange({ data: { ...selection.data, bgColor: e.target.value } })} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">Opacité {Math.round((selection.data.bgOpacity ?? 1)*100)}%</span>
                    <input type="range" min={0.1} max={1} step={0.05} value={selection.data.bgOpacity ?? 1} onChange={(e) => onChange({ data: { ...selection.data, bgOpacity: parseFloat(e.target.value) } })} className="w-full" />
                  </div>
                </div>
              </div>
            )}
            {!isDoor && !isNetwork && (
              <div className="space-y-1">
                <SectionTitle>Features</SectionTitle>
                <div className="flex items-center gap-2">
                  <button type="button" title="Auth simple" onClick={() => onChange({ data:{ ...selection.data, features: exclusiveAuthToggle(selection.data.features, 'auth1', !selection.data.features?.auth1) } })} className={`h-9 w-9 rounded-lg border flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 ${selection.data.features?.auth1 ? 'ring-2 ring-blue-500 border-blue-400 dark:ring-blue-400 dark:border-blue-400' : 'border-slate-200 dark:border-slate-500'}`}>🔑</button>
                  <button type="button" title="Auth double" onClick={() => onChange({ data:{ ...selection.data, features: exclusiveAuthToggle(selection.data.features, 'auth2', !selection.data.features?.auth2) } })} className={`h-9 w-9 rounded-lg border flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 ${selection.data.features?.auth2 ? 'ring-2 ring-blue-500 border-blue-400 dark:ring-blue-400 dark:border-blue-400' : 'border-slate-200 dark:border-slate-500'}`}>🔑🔑</button>
                  <button type="button" title="Sablier" onClick={() => onChange({ data:{ ...selection.data, features: { ...(selection.data.features||{}), hourglass: !selection.data.features?.hourglass } } })} className={`h-9 w-9 rounded-lg border flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 ${selection.data.features?.hourglass ? 'ring-2 ring-blue-500 border-blue-400 dark:ring-blue-400 dark:border-blue-400' : 'border-slate-200 dark:border-slate-500'}`}>⏳</button>
                  <button type="button" title="Firewall" onClick={() => onChange({ data:{ ...selection.data, features: { ...(selection.data.features||{}), firewall: !selection.data.features?.firewall } } })} className={`h-9 w-9 rounded-lg border flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 ${selection.data.features?.firewall ? 'ring-2 ring-red-500 border-red-400 dark:ring-red-400 dark:border-red-400' : 'border-slate-200 dark:border-slate-500'}`}>🛡️</button>
                </div>
              </div>
            )}
            {!isDoor && !isContainer && !isNetwork && (
              <div className="space-y-2">
                <SectionTitle>Largeur</SectionTitle>
                <div className="flex gap-2">
                  {['fixed','auto','custom'].map(mode=>{ const active=(selection.data.widthMode||'fixed')===mode; return <button key={mode} type="button" onClick={()=> onChange({ data:{...selection.data, widthMode:mode } })} className={`px-3 h-8 rounded-md text-[11px] border capitalize ${active?'bg-blue-500 text-white border-blue-500':'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{mode}</button>; })}
                </div>
                {(selection.data.widthMode==='custom') && (
                  <div className="flex items-center gap-2">
                    <input type="range" min={140} max={800} step={10} value={selection.data.customWidth || 240} onChange={(e)=> onChange({ data:{...selection.data, customWidth: parseInt(e.target.value,10) } })} className="flex-1" />
                    <Input type="number" className="w-24" value={selection.data.customWidth || 240} onChange={(e)=> onChange({ data:{...selection.data, customWidth: parseInt(e.target.value,10)||240 } })} />
                  </div>
                )}
              </div>
            )}
            {!isDoor && !isContainer && !isNetwork && (
              <div className="space-y-2">
                <SectionTitle>Instances</SectionTitle>
                {/* Option: use service color for all instance backgrounds */}
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="useServiceColorForInstances"
                    checked={!!selection.data.useServiceColorForInstances}
                    onChange={e => onChange({ data: { ...selection.data, useServiceColorForInstances: e.target.checked } })}
                  />
                  <label htmlFor="useServiceColorForInstances" className="text-xs select-none cursor-pointer">Utiliser la couleur du service pour les instances</label>
                </div>
                <div className="space-y-2">
                  {(selection.data.instances || []).map((ins: any, idx: number) => {
                    const auth = ins?.auth as ('auth1'|'auth2'|undefined);
                    const grp = instGroups.find(g => g.id === ins?.groupId);
                    return (
                      <div key={idx} className="p-2 rounded-md border bg-white dark:bg-slate-700/60 dark:border-slate-600 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-slate-500">Instance</span>
                          <span className="text-[10px] text-slate-400">#{idx+1}</span>
                        </div>
                        {/* Instance group selector (compact) */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Groupe</span>
                          <select className="flex-1 p-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600" value={ins?.groupId || ''} onChange={(e)=>{
                            const gid = e.target.value || undefined;
                            const list = [...(selection.data.instances||[])];
                            list[idx] = { ...list[idx], groupId: gid as any } as any;
                            onChange({ data: { ...selection.data, instances: list } });
                          }}>
                            <option value="">— choisir —</option>
                            {instGroups.map(g => (<option key={g.id} value={g.id}>{g.label}</option>))}
                          </select>
                          <button type="button" className="h-7 px-2 rounded border text-[11px]" title="Ajouter groupe d’instances" onClick={()=>{ const g = addInstGroup('Groupe', pickInstSmartColor()); }}>
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button type="button" title="No auth" onClick={()=>{ const list=[...(selection.data.instances||[])]; list[idx]={...list[idx], auth: undefined}; onChange({ data:{...selection.data, instances:list} }); }} className={`h-7 w-7 rounded-md border text-xs ${!auth ? 'ring-2 ring-slate-400 border-slate-300' : 'border-slate-200'}`}>—</button>
                            <button type="button" title="Auth simple" onClick={()=>{ const list=[...(selection.data.instances||[])]; list[idx]={...list[idx], auth:'auth1'}; onChange({ data:{...selection.data, instances:list} }); }} className={`h-7 w-7 rounded-md border text-[10px] leading-[0.8] ${auth==='auth1' ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200'}`}><span>🔑</span></button>
                            <button type="button" title="Auth double" onClick={()=>{ const list=[...(selection.data.instances||[])]; list[idx]={...list[idx], auth:'auth2'}; onChange({ data:{...selection.data, instances:list} }); }} className={`h-7 w-7 rounded-md border text-[10px] leading-[0.8] ${auth==='auth2' ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200'}`}><span className="inline-flex flex-col" style={{ lineHeight: 0.8 }}><span>🔑</span><span>🔑</span></span></button>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            {/* Aperçu (hérite du groupe) */}
                            <div className="h-7 px-2 rounded-md border text-[11px] flex items-center gap-2" style={{ background: grp?.color || '#ffffff', color: autoTextColor(grp?.color || '#ffffff'), borderColor: grp?.color || '#e2e8f0' }}>
                              <span className="truncate max-w-[140px]">{grp?.label || '—'}</span>
                            </div>
                            <button type="button" onClick={()=>{ const list=[...(selection.data.instances||[])]; list.splice(idx,1); onChange({ data:{...selection.data, instances:list} }); }} className="h-7 px-2 rounded-md bg-slate-100 hover:bg-slate-200 border">✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">Count: {(selection.data.instances||[]).length}</div>
                    <Button size="sm" variant="outline" onClick={()=>{
                      const gid = (instGroups[0]?.id) || addInstGroup('Groupe', pickInstSmartColor()).id;
                      const list=[...(selection.data.instances||[])];
                      list.push({ groupId: gid } as any);
                      onChange({ data:{...selection.data, instances:list} });
                    }}>Add instance from group</Button>
                  </div>
                  {/* Inline editor for instance groups (compact) */}
                  <div className="mt-2 p-2 rounded border bg-white/70 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-slate-500">Groupes d’instances</span>
                      <button type="button" className="ml-auto h-7 px-2 rounded-md border text-[11px]" onClick={()=> addInstGroup('Groupe', pickInstSmartColor())}>+ Ajouter</button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-auto pr-1">
                      {instGroups.map(g => (
                        <div key={g.id} className="flex items-center justify-between gap-2 p-1 rounded border" style={{ borderColor: g.color }}>
                          <Input className="h-7 text-xs w-36" value={g.label} onChange={(e)=> updateInstGroup(g.id, { label: e.target.value })} />
                          <Input type="color" className="h-7 w-8 p-0.5" value={g.color} onChange={(e)=> updateInstGroup(g.id, { color: e.target.value })} />
                          <button type="button" className="h-7 w-7 rounded-md border" title="Supprimer" onClick={()=> removeInstGroup(g.id)}>✕</button>
                        </div>
                      ))}
                      {instGroups.length===0 && <div className="text-[11px] text-slate-500">Aucun groupe. Ajoutez-en un.</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!isDoor && !isContainer && !isNetwork && (
              <div className="space-y-2">
                <SectionTitle>Réseaux</SectionTitle>
                <NetworksInlineEditor selection={selection} onChange={onChange} networks={networks} />
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    checked={!!selection.data?.autoLinkToNetworks}
                    onCheckedChange={(v) => onChange({ data: { ...selection.data, autoLinkToNetworks: !!v } })}
                  />
                  <span className="text-xs">Lier automatiquement aux réseaux</span>
                </div>
                {selection.data?.autoLinkToNetworks && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                    Des liens automatiques seront créés vers tous les réseaux sélectionnés. La couleur de chaque lien correspondra à celle du réseau ciblé.
                  </div>
                )}
              </div>
            )}
            {isDoor && (
              <>
                <SectionTitle>Door</SectionTitle>
                <div className="space-y-1">
                  <Label>Allowed</Label>
                  <Input value={selection.data.allow || ''} placeholder="e.g., HTTPS" onChange={(e) => onChange({ data: { ...selection.data, allow: e.target.value } })} />
                  <div className="text-[11px] text-slate-500">Text shown on the door, representing the allowed flow.</div>
                </div>
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <Label>Width</Label>
                    <input type="range" min={80} max={240} step={4} value={selection.data.width ?? DEFAULT_DOOR_WIDTH} onChange={(e)=> onChange({ data: { ...selection.data, width: parseInt(e.target.value,10) } })} className="w-full" />
                    <div className="text-[11px] text-slate-500">{selection.data.width ?? DEFAULT_DOOR_WIDTH}px</div>
                  </div>
                  <div>
                    <Label>Scale</Label>
                    <input type="range" min={0.6} max={2} step={0.05} value={selection.data.scale ?? 1} onChange={(e)=> onChange({ data: { ...selection.data, scale: parseFloat(e.target.value) } })} className="w-full" />
                    <div className="text-[11px] text-slate-500">{Math.round((selection.data.scale ?? 1)*100)}%</div>
                    <label className="flex items-center gap-2 text-xs mt-1"><input type="checkbox" checked={!!selection.data.lockedIcon} onChange={(e)=> onChange({ data:{ ...selection.data, lockedIcon: e.target.checked } })} /> Lock icon</label>
                  </div>
                </div>
                <div className="pt-2">
                  <Label>Wall Offset</Label>
                  <input type="range" min={-4} max={4} step={1} value={(selection.data.offset || 0)} onChange={(e)=> {
                    const v = parseInt(e.target.value,10);
                    const side = selection.data.side as ('top'|'bottom'|'left'|'right'|undefined);
                    const nextOffsets:any = { ...(selection.data.offsets||{}) };
                    if (side) nextOffsets[side] = v; else nextOffsets.top = v;
                    onChange({ data: { ...selection.data, offset: v, offsets: nextOffsets }, resnapDoor: true });
                  }} className="w-full" />
                  <div className="text-[11px] text-slate-500">Anchored side: {selection.data.side || 'auto'}</div>
                </div>
              </>
            )}
            {!isDoor && isContainer && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <SectionTitle>Container</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" value={selection.data.width} onChange={(e) => onChange({ data: { ...selection.data, width: Number(e.target.value) || 0 } })} />
                    <Input type="number" value={selection.data.height} onChange={(e) => onChange({ data: { ...selection.data, height: Number(e.target.value) || 0 } })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Partitions (vertical)</Label>
                    <Input type="number" min={1} max={12} value={selection.data.partitions ?? 1} onChange={(e)=>{
                      let v = parseInt(e.target.value,10); if (isNaN(v)) v = 1; v = Math.max(1, Math.min(12, v));
                      onChange({ data: { ...selection.data, partitions: v } });
                    }} />
                  </div>
                  {/* Partition badges */}
                  <div className="space-y-1">
                    <Label>Badges par partition</Label>
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: Math.max(1, (selection.data.partitions ?? 1)) }).map((_, i) => {
                        const idx = i;
                        const value = (selection.data.partitionIcons || [])[idx] || '';
                          return (
                          <div key={i} className="flex flex-col gap-1 p-2 rounded-md border bg-white/70 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <button type="button" aria-label="Effacer" title="Effacer" onClick={()=>{ const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : []; arr[idx] = ''; onChange({ data: { partitionIcons: arr } }); }} className="h-6 w-6 rounded border text-[11px] flex items-center justify-center">✕</button>
                                <div className="h-7 w-7 rounded-md border bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                  {value ? <img src={value} alt="" className="h-5 w-5 object-contain"/> : <span className="text-[10px] text-slate-400">—</span>}
                                </div>
                                  <span className="text-[11px] text-slate-500 truncate">Partition {i+1}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button type="button" title="Texte" aria-label="Texte" className="h-8 w-8 rounded-md border flex items-center justify-center" onClick={()=> { setOpenTextIndex(openTextIndex===idx?null:idx); }}>🅣</button>
                                  <button type="button" title="URL icône" aria-label="URL icône" className="h-8 w-8 rounded-md border flex items-center justify-center" onClick={()=> { setOpenUrlIndex(openUrlIndex===idx?null:idx); if(openUrlIndex!==idx){ setPickerQuery(''); setPickerPage(1);} }}>🔗</button>
                                  <button type="button" title="Parcourir" aria-label="Parcourir" className="h-8 w-8 rounded-md border flex items-center justify-center" onClick={()=> { setOpenPartitionPickerIndex(openPartitionPickerIndex === idx ? null : idx); setPickerQuery(''); setPickerPage(1); }}>🖼️</button>
                              </div>
                            </div>
                              {openTextIndex === idx && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Input className="h-8 text-xs w-full" placeholder="Texte du badge…" value={(selection.data.partitionBadgeTexts||[])[idx] || ''} onChange={(e)=>{
                                    const arr = Array.isArray(selection.data.partitionBadgeTexts) ? [...selection.data.partitionBadgeTexts] : [];
                                    arr[idx] = e.target.value;
                                    onChange({ data: { partitionBadgeTexts: arr } });
                                  }} />
                                  <button type="button" className="px-2 h-8 rounded-md border text-xs" onClick={()=>{ const arr = Array.isArray(selection.data.partitionBadgeTexts) ? [...selection.data.partitionBadgeTexts] : []; arr[idx] = ''; onChange({ data: { partitionBadgeTexts: arr } }); }}>Effacer</button>
                                </div>
                              )}
                              {openUrlIndex === idx && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Input className="h-8 text-xs w-full" placeholder="URL d’icône…" value={value} onChange={(e)=>{
                                    const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : [];
                                    arr[idx] = e.target.value;
                                    onChange({ data: { partitionIcons: arr } });
                                  }} />
                                  <button type="button" className="px-2 h-8 rounded-md border text-xs" onClick={()=>{ const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : []; arr[idx] = ''; onChange({ data: { partitionIcons: arr } }); }}>Effacer</button>
                                </div>
                              )}
                              {openPartitionPickerIndex === idx && (
                              <div className="mt-2 p-2 rounded-lg border bg-white dark:bg-slate-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Input className="h-9 text-xs" placeholder="Rechercher…" value={pickerQuery} onChange={(e)=>{ setPickerQuery(e.target.value); setPickerPage(1); }} />
                                    <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500">
                                      <button type="button" disabled={pickerPage<=1} onClick={()=> setPickerPage(p=>Math.max(1,p-1))} className="px-2 h-8 rounded border disabled:opacity-40">‹</button>
                                      <span>{pickerPage}/{totalPages}</span>
                                      <button type="button" disabled={pickerPage>=totalPages} onClick={()=> setPickerPage(p=>Math.min(totalPages,p+1))} className="px-2 h-8 rounded border disabled:opacity-40">›</button>
                                    </div>
                                </div>
                                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-auto pr-1">
                                    {currentItems.map(c => (
                                    <button key={c.id} type="button" onClick={()=>{
                                      const arr = Array.isArray(selection.data.partitionIcons) ? [...selection.data.partitionIcons] : [];
                                      arr[idx] = c.icon;
                                        onChange({ data: { partitionIcons: arr } });
                                        setOpenPartitionPickerIndex(null);
                                    }} className={`h-10 w-10 rounded-lg border ${value===c.icon?'ring-2 ring-blue-500 border-blue-400':'border-slate-200 dark:border-slate-600'} bg-white dark:bg-slate-800 flex items-center justify-center`}>
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
                  <div className="flex gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Header</span>
                    {['top','left'].map(p => {
                      const active = (selection.data.headerPos||'top')===p;
                      return <button key={p} type="button" onClick={()=>onChange({ data:{...selection.data, headerPos:p } })} className={`px-2 h-7 rounded-md text-[11px] border capitalize ${active?'bg-blue-500 text-white border-blue-500 dark:bg-blue-500 dark:text-white':'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{p}</button>;
                    })}
                  </div>
                </div>
                <div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => onChange({ autoFitContainer: true })}>Auto-fit aux enfants</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!selection.data.locked} onCheckedChange={(v) => onChange({ data: { ...selection.data, locked: !!v } })} />
                  <span className="text-xs">Verrouiller le container</span>
                </div>

                {/* Auto-layout section */}
                <AutoLayoutControls
                  config={selection.data.autoLayout || DEFAULT_AUTO_LAYOUT}
                  globalConfig={globalAutoLayoutConfig}
                  onChange={(config) => {
                    // Mise à jour unique avec les nouvelles données ET déclenchement auto-layout
                    onChange({ 
                      data: { 
                        ...selection.data, 
                        autoLayout: config
                      },
                      ...(config.enabled ? { applyAutoLayout: true } : {})
                    });
                  }}
                />
              </div>
            )}
            {!isDoor && isNode && (
              <div className="space-y-1">
                <SectionTitle>Icône</SectionTitle>
                <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto p-2 rounded border bg-slate-50/50 dark:bg-slate-700/30 dark:border-slate-600 [scrollbar-width:thin]">
                  {CATALOG.map(c => {
                    const active = selection.data.icon === c.icon;
                    return (
                      <div key={c.id} className="group relative">
                        <button type="button" onClick={() => onChange({ data: { ...selection.data, icon: c.icon } })} className={`h-10 w-10 rounded-xl border bg-white/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all duration-200 flex items-center justify-center p-1 ${active ? 'ring-2 ring-blue-500 border-blue-400 dark:ring-blue-400 dark:border-blue-400' : 'border-slate-200 dark:border-slate-600'}`}>
                          <img src={c.icon} alt="" className="h-8 w-8 object-contain" />
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {c.label}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Input className="mt-2 text-xs" placeholder="URL personnalisée..." {...iconUrl} />
              </div>
            )}
            {!isDoor && isNode && selection.parentNode && (
              <div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => onChange({ detachFromParent: true })}>Détacher du container (ou Alt+Drag)</Button>
              </div>
            )}
            {!isDoor && isContainer && selection.parentNode && (
              <div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => onChange({ detachFromParent: true })}>Détacher ce container du parent</Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-1">
              <SectionTitle>Label</SectionTitle>
              <Input value={selection.label || ''} onChange={(e)=> onChange({ label: e.target.value })} />
            </div>
            
            {/* Network link information */}
            {selection.data?.isNetworkLink && (
              <div className="space-y-1">
                <div className="text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                  🔗 Lien automatique vers le réseau <strong>{selection.data.networkId}</strong>
                </div>
              </div>
            )}
            
            {/* Anchor positioning information */}
            <div className="space-y-1">
              <SectionTitle>Positionnement des extrémités</SectionTitle>
              
              {/* Quick presets */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Presets rapides</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
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
              </div>
              
              {/* Source anchor controls */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Source (départ)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Côté</Label>
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
                      className="w-full p-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600"
                    >
                      <option value="top">Haut</option>
                      <option value="right">Droite</option>
                      <option value="bottom">Bas</option>
                      <option value="left">Gauche</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    {(() => { const off = selection.data?.sourceAnchor?.offset ?? 0.5; const pct = (off * 100).toFixed(2); return (
                      <Label className="text-xs">Position ({pct}%)</Label>
                    ); })()}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.0001"
                      value={selection.data?.sourceAnchor?.offset || 0.5}
                      onChange={(e) => onChange({ 
                        data: { 
                          ...selection.data, 
                          sourceAnchor: { 
                            nodeId: selection.source, 
                            side: selection.data?.sourceAnchor?.side || 'right', 
                            offset: parseFloat(e.target.value) 
                          } 
                        } 
                      })}
                      className="w-full"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="h-7 w-24 text-xs"
                        min={0}
                        max={100}
                        step={0.01}
                        value={((selection.data?.sourceAnchor?.offset ?? 0.5) * 100).toFixed(2)}
                        onChange={(e)=> {
                          const v = Math.min(100, Math.max(0, parseFloat(e.target.value))); 
                          const frac = isNaN(v) ? 0.5 : (v/100);
                          onChange({ data: { ...selection.data, sourceAnchor: { nodeId: selection.source, side: selection.data?.sourceAnchor?.side || 'right', offset: frac } } });
                        }}
                      />
                      <span className="text-[11px] text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Target anchor controls */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Cible (arrivée)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Côté</Label>
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
                      className="w-full p-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600"
                    >
                      <option value="top">Haut</option>
                      <option value="right">Droite</option>
                      <option value="bottom">Bas</option>
                      <option value="left">Gauche</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    {(() => { const off = selection.data?.targetAnchor?.offset ?? 0.5; const pct = (off * 100).toFixed(2); return (
                      <Label className="text-xs">Position ({pct}%)</Label>
                    ); })()}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.0001"
                      value={selection.data?.targetAnchor?.offset || 0.5}
                      onChange={(e) => onChange({ 
                        data: { 
                          ...selection.data, 
                          targetAnchor: { 
                            nodeId: selection.target, 
                            side: selection.data?.targetAnchor?.side || 'left', 
                            offset: parseFloat(e.target.value) 
                          } 
                        } 
                      })}
                      className="w-full"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="h-7 w-24 text-xs"
                        min={0}
                        max={100}
                        step={0.01}
                        value={((selection.data?.targetAnchor?.offset ?? 0.5) * 100).toFixed(2)}
                        onChange={(e)=> {
                          const v = Math.min(100, Math.max(0, parseFloat(e.target.value))); 
                          const frac = isNaN(v) ? 0.5 : (v/100);
                          onChange({ data: { ...selection.data, targetAnchor: { nodeId: selection.target, side: selection.data?.targetAnchor?.side || 'left', offset: frac } } });
                        }}
                      />
                      <span className="text-[11px] text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current status */}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {(selection.data?.sourceAnchor || selection.data?.targetAnchor) ? (
                  <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded">
                    ✓ Positions personnalisées actives
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    ℹ️ Positions automatiques (par défaut)
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <SectionTitle>Forme</SectionTitle>
              <div className="flex gap-2 flex-wrap">
                {[
                  {id:'smooth', svg:<svg width="48" height="18" className="overflow-visible"><path d="M2 14 C18 2 30 2 46 14" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round"/></svg>, title:'Courbe', type:'smoothstep'},
                  {id:'straight', svg:<svg width="48" height="18" className="overflow-visible"><line x1="2" y1="9" x2="46" y2="9" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>, title:'Droite', type:'default'},
                  {id:'step', svg:<svg width="48" height="18" className="overflow-visible"><path d="M2 14 H24 V4 H46" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round"/></svg>, title:'Angles', type:'step'},
                ].map(opt => {
                  const active = (selection.data?.shape || 'smooth') === opt.id;
                  return <button key={opt.id} type="button" title={opt.title} onClick={() => onChange({ type: opt.type, data:{...(selection.data||{}), shape:opt.id}})} className={`h-10 w-14 flex items-center justify-center rounded-md border transition-colors text-slate-600 dark:text-slate-300
                    ${active ? 'bg-blue-50 dark:bg-blue-500/25 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-inset ring-blue-500/40 dark:ring-blue-400/40' : 'bg-white dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'}`}>{opt.svg}</button>;
                })}
              </div>
            </div>
            <div className="space-y-1">
              <SectionTitle>Motif</SectionTitle>
              <div className="flex gap-2 flex-wrap">
                {[
                  {id:'solid', dash:'', title:'Continu'},
                  {id:'dashed', dash:'6 6', title:'Pointillés'},
                  {id:'animated', dash:'6 6', title:'Animé', anim:true},
                ].map(opt => {
                  const active = (selection.data?.pattern || 'solid') === opt.id;
                  return <button key={opt.id} type="button" title={opt.title} onClick={()=> onChange({ data:{...(selection.data||{}), pattern: opt.id } })} className={`h-10 w-14 flex items-center justify-center rounded-md border transition-colors text-slate-600 dark:text-slate-300
                    ${active?'bg-blue-50 dark:bg-blue-500/25 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-inset ring-blue-500/40 dark:ring-blue-400/40':'bg-white dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                    <svg width="48" height="18" className="overflow-visible"><line x1="2" y1="9" x2="46" y2="9" stroke="currentColor" strokeWidth={2} strokeDasharray={opt.dash} strokeLinecap="round">{opt.anim && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />}</line></svg>
                  </button>;
                })}
              </div>
            </div>
            <div className="space-y-1">
              <SectionTitle>Épaisseur</SectionTitle>
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,6].map(w => { const active=(selection.style?.strokeWidth||2)===w; return <button key={w} type="button" title={`Épaisseur ${w}`} onClick={()=> onChange({ style:{...(selection.style||{}), strokeWidth:w } })} className={`h-9 px-2 flex items-center justify-center rounded-md border min-w-[44px] transition-colors text-slate-600 dark:text-slate-300
                  ${active?'bg-blue-50 dark:bg-blue-500/25 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-inset ring-blue-500/40 dark:ring-blue-400/40':'bg-white dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'}`}><div className="w-8"><svg width="32" height={w+4} className="overflow-visible"><line x1="0" y1={w/2+2} x2="32" y2={w/2+2} stroke="currentColor" strokeWidth={w} strokeLinecap="round"/></svg></div></button>; })}
              </div>
            </div>
            <div className="space-y-1">
              <SectionTitle>Couleur</SectionTitle>
              <Input value={selection.style?.stroke || '#94a3b8'} type="color" onChange={(e) => onChange({ style: { ...(selection.style || {}), stroke: e.target.value } })} />
            </div>
            <div className="pt-2">
              <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}><Trash2 className="h-4 w-4 mr-2"/>Delete edge</Button>
            </div>
          </>
        )}
        {isNode && (
          <div className="pt-2">
            <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}><Trash2 className="h-4 w-4 mr-2"/>Delete node</Button>
          </div>
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
