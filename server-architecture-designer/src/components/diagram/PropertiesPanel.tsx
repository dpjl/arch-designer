"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { CATALOG } from '@/lib/catalog';
import { autoTextColor } from '@/lib/utils';
import { isAuto } from './color-utils';
import { AutoLayoutControls } from './AutoLayoutControls';
import { AutoLayoutConfig } from '@/types/diagram';

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

  const isNode = selection.type === 'node';
  const isContainer = isNode && !!selection.data?.isContainer;
  const isDoor = isNode && !!selection.data?.isDoor;
  const isNetwork = isNode && selection.nodeType === 'network';
  // Local buffer states to avoid disruptive re-renders while typing
  const [tempNetworkLabel, setTempNetworkLabel] = React.useState<string | null>(null);
  React.useEffect(()=>{ if (isNetwork) { setTempNetworkLabel(selection.data?.label || ''); } else { setTempNetworkLabel(null); } }, [isNetwork, selection.id]);

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
                  <Input
                    value={tempNetworkLabel ?? ''}
                    onChange={(e)=> setTempNetworkLabel(e.target.value)}
                    onBlur={()=> {
                      if (tempNetworkLabel !== null && tempNetworkLabel !== selection.data.label) {
                        onChange({ data: { ...selection.data, label: tempNetworkLabel } });
                      }
                    }}
                    onKeyDown={(e)=> {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                      if (e.key === 'Escape') {
                        setTempNetworkLabel(selection.data.label || '');
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Color</Label>
                  <Input type="color" className="h-9 w-10 p-1" value={selection.data.color || '#10b981'} onChange={(e)=> onChange({ data: { ...selection.data, color: e.target.value } })} />
                </div>
                <div className="space-y-1">
                  <Label>Text color</Label>
                  <Input type="color" className="h-9 w-10 p-1" value={selection.data.textColor || autoTextColor(selection.data.color||'#10b981')} onChange={(e)=> onChange({ data: { ...selection.data, textColor: e.target.value } })} />
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
                <Input value={selection.data.label || ''} onChange={(e) => onChange({ data: { ...selection.data, label: e.target.value } })} />
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
                <div className="space-y-2">
                  {(selection.data.instances || []).map((ins: any, idx: number) => {
                    const auth = ins?.auth as ('auth1'|'auth2'|undefined);
                    return (
                      <div key={idx} className="p-2 rounded-md border bg-white dark:bg-slate-700/60 dark:border-slate-600 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-slate-500">Instance ID</span>
                          <span className="text-[10px] text-slate-400">#{idx+1}</span>
                        </div>
                        <Input className="h-8 text-xs w-full" placeholder={`id-${idx+1}`} value={ins?.id || ''} onChange={(e)=>{
                          const list = [...(selection.data.instances||[])]; list[idx] = { ...list[idx], id: e.target.value }; onChange({ data: { ...selection.data, instances: list } });
                        }} />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button type="button" title="No auth" onClick={()=>{ const list=[...(selection.data.instances||[])]; list[idx]={...list[idx], auth: undefined}; onChange({ data:{...selection.data, instances:list} }); }} className={`h-7 w-7 rounded-md border text-xs ${!auth ? 'ring-2 ring-slate-400 border-slate-300' : 'border-slate-200'}`}>—</button>
                            <button type="button" title="Auth simple" onClick={()=>{ const list=[...(selection.data.instances||[])]; list[idx]={...list[idx], auth:'auth1'}; onChange({ data:{...selection.data, instances:list} }); }} className={`h-7 w-7 rounded-md border text-[10px] leading-[0.8] ${auth==='auth1' ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200'}`}><span>🔑</span></button>
                            <button type="button" title="Auth double" onClick={()=>{ const list=[...(selection.data.instances||[])]; list[idx]={...list[idx], auth:'auth2'}; onChange({ data:{...selection.data, instances:list} }); }} className={`h-7 w-7 rounded-md border text-[10px] leading-[0.8] ${auth==='auth2' ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200'}`}><span className="inline-flex flex-col" style={{ lineHeight: 0.8 }}><span>🔑</span><span>🔑</span></span></button>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            <Input type="color" className="h-7 w-8 p-0.5" value={ins?.bgColor || '#ffffff'} onChange={(e)=>{ const list=[...(selection.data.instances||[])]; const bg=e.target.value; const fg = ins?.fgColor || autoTextColor(bg); list[idx]={...list[idx], bgColor: bg, fgColor: fg}; onChange({ data:{...selection.data, instances:list} }); }} />
                            <Input type="color" className="h-7 w-8 p-0.5" value={ins?.fgColor || autoTextColor(ins?.bgColor)} onChange={(e)=>{ const list=[...(selection.data.instances||[])]; list[idx]={...list[idx], fgColor: e.target.value}; onChange({ data:{...selection.data, instances:list} }); }} />
                            <button type="button" onClick={()=>{ const list=[...(selection.data.instances||[])]; list.splice(idx,1); onChange({ data:{...selection.data, instances:list} }); }} className="h-7 px-2 rounded-md bg-slate-100 hover:bg-slate-200 border">✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">Count: {(selection.data.instances||[]).length}</div>
                    <Button size="sm" variant="outline" onClick={()=>{ const list=[...(selection.data.instances||[])]; list.push({ id: `inst-${list.length+1}` }); onChange({ data:{...selection.data, instances:list} }); }}>Add instance</Button>
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
                <Input className="mt-2 text-xs" value={selection.data.icon || ''} onChange={(e) => onChange({ data: { ...selection.data, icon: e.target.value } })} placeholder="URL personnalisée..." />
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
                    <Label className="text-xs">Position ({Math.round((selection.data?.sourceAnchor?.offset || 0.5) * 100)}%)</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
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
                    <Label className="text-xs">Position ({Math.round((selection.data?.targetAnchor?.offset || 0.5) * 100)}%)</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
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
