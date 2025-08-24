"use client";
// ============================================================================
// DiagramCanvas
// Large composite client component. TODO: Progressive extraction into:
//   components/diagram/Toolbar.tsx
//   components/diagram/PalettePanel.tsx
//   components/diagram/PropertiesPanel.tsx
// Region markers below aid automated maintenance.
// ============================================================================
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
  MarkerType,
  useStore,
  useReactFlow,
  ConnectionMode,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { useGroups } from '@/contexts/GroupsContext';
import { useInstanceGroups } from '@/contexts/InstanceGroupsContext';
import { Toolbar, PropertiesPanel, PalettePanel, ComponentNode, DoorNode, NetworkNode, NetworkLinkEdge, CustomEdge, MODES, GRID_SIZE, CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT, DEFAULT_DOOR_WIDTH, DEFAULT_DOOR_HEIGHT, HISTORY_STORAGE_KEY, SNAP_STORAGE_KEY, hexToRgba, autoTextColor, isAncestor, updateNetworkLinksForService, isNetworkLink, useAutoLayout } from './diagram';
import EdgeOverlapOverlay from './diagram/EdgeOverlapOverlay';
import { computeOverlapSegments } from './diagram/edge-overlap';
import ResponsiveTopBar from './diagram/ResponsiveTopBar';
import MobileMenu from './diagram/MobileMenu';
import JsonEditorDialog, { DiagramJsonPayload } from './diagram/JsonEditorDialog';
import { AutoLayoutProvider, DEFAULT_GLOBAL_AUTO_LAYOUT } from '@/contexts/AutoLayoutContext';
import { AutoLayoutConfig } from '@/types/diagram';
import { ThemeProvider } from './theme/ThemeProvider';
import { useDiagramHistory } from './diagram/hooks/useDiagramHistory';
import { useDiagramSelection } from './diagram/hooks/useDiagramSelection';
import { useViewModePan } from './diagram/hooks/useViewModePan';
import { useDiagramShortcuts } from './diagram/hooks/useDiagramShortcuts';
import { useMultiDrag } from './diagram/hooks/useMultiDrag';
import { applyZIndexHierarchy, enforceContainerSelectedZ, absolutePosition, headerOffsetFor as headerOffsetForUtil } from './diagram/layout-utils';
import { applyPatternToEdge } from './diagram/edge-utils';
import { wrapInContainer as wrapInContainerUtil, removeContainerKeepChildren as removeContainerKeepChildrenUtil } from './diagram/selection-actions/containers';
import { createDnDHandlers } from './diagram/dnd/createDnDHandlers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Link2, Palette, Lock, Unlock, LayoutGrid, Boxes } from "lucide-react";
import { computeTightBounds } from '@/lib/export/viewport';
import { exportViewportCropToPng, exportFullDiagram, fitAndExportSelection } from '@/lib/export/exporters';
import { printDataUrl } from '@/lib/export/print';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Input } from "@/components/ui/input";
// PaletteItem moved into PalettePanel
// function PaletteItem({ entry, onDragStart }: any) {
//   return (
//     <div
//       draggable
//       onDragStart={(e) => onDragStart(e, entry)}
//       className="group relative aspect-square rounded-lg border bg-white/80 hover:bg-white hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 flex items-center justify-center p-2"
//     >
//       <img src={entry.icon} alt="" className="max-h-6 max-w-6 object-contain" />
//       
//       {/* Tooltip au survol */}
//       <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
//         <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/90"></div>
//       </div>
//     </div>
//   );
// }


// Simple Icons CDN for stable brand SVGs
const SI = (name: string) => `https://cdn.simpleicons.org/${name}`;

// Stable helper for MiniMap color (avoid new fn each render)
const miniMapNodeColorFn = (n: any) => n?.data?.color || "#94a3b8";

// Exclusive auth toggler (pure)
function exclusiveAuthToggle(
  features: { auth1?: boolean; auth2?: boolean; hourglass?: boolean; firewall?: boolean } = {},
  which: "auth1" | "auth2",
  value: boolean
) {
  const next = { ...features } as any;
  if (which === "auth1") {
    next.auth1 = value;
    if (value) next.auth2 = false;
  } else {
    next.auth2 = value;
    if (value) next.auth1 = false;
  }
  return next;
}

import { CATALOG } from '@/lib/catalog';
// Responsive toolbar components now extracted to diagram/ResponsiveTopBar and diagram/MobileMenu

// =============================
// Decorative tiny icons (WhatsApp-like, flat & colorful)
// =============================
const FeaturesIcons = memo(({ features, compact }: any) => {
  const { auth1, auth2, hourglass } = features || {};
  const cls = compact ? "text-[11px]" : "text-sm";
  return (
    <div className={`flex items-center gap-1 leading-none ${cls}`}>
      {auth2 ? (
        <span title="Double authentification" aria-label="double auth" className="select-none">🔑🔑</span>
      ) : auth1 ? (
        <span title="Authentification" aria-label="auth" className="select-none">🔑</span>
      ) : null}
      {hourglass && <span title="En attente" aria-label="pending" className="select-none">⏳</span>}
    </div>
  );
});



// Brick texture now provided by shared utility


// Door helpers (precise firewall ring anchoring)
const CONTAINER_RING_THICKNESS = 14;
const CONTAINER_RING_GAP = 8;
// Very slight inward offset so the door visually sits inside the brick wall
const DOOR_INSET = 6; // px (tiny, but noticeable)
function clamp(val:number, min:number, max:number){ return Math.max(min, Math.min(max, val)); }
function placeDoorOnSide(parent:any, side:'top'|'bottom'|'left'|'right', localPos:{x:number;y:number}, doorW:number, doorH:number){
  const w = parent?.data?.width || 520; const h = parent?.data?.height || 320; let x=localPos.x,y=localPos.y;
  // Center the door on the middle of the firewall ring band, no manual offsets.
  const mid = CONTAINER_RING_GAP + CONTAINER_RING_THICKNESS/2;
  switch(side){
  case 'top': y = -mid - doorH/2 + DOOR_INSET; x = clamp(x, -doorW/2, w - doorW/2); break;      // push slightly downward (inside)
  case 'bottom': y = h + mid - doorH/2 - DOOR_INSET; x = clamp(x, -doorW/2, w - doorW/2); break; // push slightly upward (inside)
  case 'left': x = -mid - doorW/2 + DOOR_INSET; y = clamp(y, -doorH/2, h - doorH/2); break;      // push slightly right (inside)
  case 'right': x = w + mid - doorW/2 - DOOR_INSET; y = clamp(y, -doorH/2, h - doorH/2); break;  // push slightly left (inside)
  }
  return { side, position:{x,y} };
}
function snapDoorToNearestSide(parent: any, localPos: {x:number;y:number}, doorW: number, doorH: number) {
  const w = parent?.data?.width || 520; const h = parent?.data?.height || 320;
  const dx = Math.min(localPos.x, w-localPos.x); const dy = Math.min(localPos.y, h-localPos.y);
  let side:'top'|'bottom'|'left'|'right'='top';
  if (dy <= dx) side = (localPos.y < h/2) ? 'top' : 'bottom'; else side = (localPos.x < w/2) ? 'left' : 'right';
  return placeDoorOnSide(parent, side, localPos, doorW, doorH);
}

// == Node Types Registry =====================================================
const nodeTypes = { component: ComponentNode, door: DoorNode, network: NetworkNode } as const;
const edgeTypes = { 
  networkLink: NetworkLinkEdge,
  default: CustomEdge,
  straight: CustomEdge,
  step: CustomEdge,
  smoothstep: CustomEdge
} as const;
// == End Node Types Registry =================================================

// =============================
// UI bits
// =============================
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">{children}</h4>
);
// Toolbar extracted

function NetworksInlineEditor({ selection, onChange, networks }: any){
  const present = Array.isArray(networks) ? networks : [];
  const ids: string[] = Array.isArray(selection.data?.networks) ? selection.data.networks : [];
  const toggle = (id:string) => {
    const next = ids.includes(id) ? ids.filter(x=>x!==id) : ids.concat(id);
    onChange({ data: { ...selection.data, networks: next } });
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {present.map((n:any) => (
          <button key={n.id} type="button" onClick={()=>toggle(n.id)} className={`px-2 py-0.5 rounded-full border text-[11px]`} style={{ background: ids.includes(n.id) ? n.color : '#ffffff', color: ids.includes(n.id) ? autoTextColor(n.color) : '#334155', borderColor: n.color }}>
            {n.label}
          </button>
        ))}
        {!present.length && <div className="text-[11px] text-slate-500">Aucun réseau dans le diagramme.</div>}
      </div>
    </div>
  );
}

// =============================
// Canvas
// =============================
function DiagramCanvas({ 
  globalAutoLayoutConfig, 
  onUpdateGlobalAutoLayoutConfig 
}: { 
  globalAutoLayoutConfig: AutoLayoutConfig; 
  onUpdateGlobalAutoLayoutConfig: (config: AutoLayoutConfig) => void; 
}) {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const { groups, setGroups } = useGroups();
  const { groups: instanceGroups, setGroups: setInstanceGroups } = useInstanceGroups();
  const [rehydrated, setRehydrated] = useState(false);
  useEffect(()=>{ try { (window as any).__instanceGroupsMap = Object.fromEntries(instanceGroups.map(g=>[g.id,{label:g.label,color:g.color}])); } catch {} }, [instanceGroups]);
  // Expose instance groups for node renderers (no hooks inside ReactFlow node bodies)
  useEffect(()=>{
    try {
      (window as any).__instanceGroupsMap = Object.fromEntries(instanceGroups.map(g => [g.id, { label: g.label, color: g.color }]));
    } catch {}
  }, [instanceGroups]);
  const { project, fitView, getViewport, setViewport, getNodes: rfGetNodes } = useReactFlow();
  const [mode, setMode] = useState<typeof MODES[keyof typeof MODES]>(MODES.EDIT);
  // History (refactored using hook) - will be initialized after nodes/edges state
  const [historyFlash, setHistoryFlash] = useState<string | null>(null);
  const showFlash = useCallback((msg: string) => { setHistoryFlash(msg); setTimeout(() => setHistoryFlash(c => c === msg ? null : c), 900); }, []);

  // Load persisted history once, plus groups and global config for parity with manual "Charger"
  useEffect(()=>{
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.present?.nodes) {
          historyRef.current = parsed;
          setNodes(parsed.present.nodes);
          setEdges(parsed.present.edges);
          lastCommitRef.current = Date.now();
        }
      }
    } catch {}
    // Rehydrate groups and instance groups
    try {
      const gr = JSON.parse(localStorage.getItem('server-arch:groups') || 'null');
      if (Array.isArray(gr)) setGroups(gr);
    } catch {}
    try {
      const igr = JSON.parse(localStorage.getItem('server-arch:instance-groups') || 'null');
      if (Array.isArray(igr)) setInstanceGroups(igr);
    } catch {}
    // Rehydrate global auto-layout config
    try {
      const g = JSON.parse(localStorage.getItem('server-arch:global-config') || 'null');
      if (g) onUpdateGlobalAutoLayoutConfig({ ...DEFAULT_GLOBAL_AUTO_LAYOUT, ...g });
    } catch {}
    // Mark rehydration done on next frame to ensure nodes/edges are applied
    requestAnimationFrame(() => setRehydrated(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Initial graph
  const initialNodes = useMemo(
    () => [
      { id: "traefik-1", type: "component", position: { x: 200, y: 40 }, data: { label: "Traefik", icon: CATALOG.find(c => c.id === "traefik")!.icon, color: CATALOG.find(c => c.id === "traefik")!.color, features: { auth1: true }, isContainer: false } },
      { id: "nextcloud-1", type: "component", position: { x: 80, y: 240 }, data: { label: "Nextcloud", icon: CATALOG.find(c => c.id === "nextcloud")!.icon, color: CATALOG.find(c => c.id === "nextcloud")!.color, features: { auth2: true }, isContainer: false, networks: ["net-test-1"] } },
      { id: "ha-1", type: "component", position: { x: 360, y: 240 }, data: { label: "Home Assistant", icon: CATALOG.find(c => c.id === "homeassistant")!.icon, color: CATALOG.find(c => c.id === "homeassistant")!.color, features: { hourglass: true }, isContainer: false } },
      { id: "group-1", type: "component", position: { x: 580, y: 60 }, data: { label: "Home Lab Rack", color: "#475569", width: 520, height: 320, locked: false, isContainer: true, bgColor: '#ffffff', bgOpacity: 0.85 }, style: { width: 520, height: 320 } },
      { id: "net-test-1", type: "network", position: { x: 100, y: 350 }, data: { netId: "net-test-1", label: "Test Network", color: "#10b981", width: 300, height: 180 } },
    ],
    []
  );

  const initialEdges = useMemo(
    () => [
      { id: "e1-2", source: "traefik-1", target: "nextcloud-1", animated: true, label: "HTTPS", style: { stroke: "#06b6d4" }, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e1-3", source: "traefik-1", target: "ha-1", label: "HTTPS", markerEnd: { type: MarkerType.ArrowClosed } },
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
  // expose setter for resize handles inside node components
  useEffect(() => { (window as any).__setDiagramNodes = setNodes; (window as any).__getDiagramNodes = () => nodes; }, [setNodes, nodes]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any);
  const overlapSegments = useMemo(() => computeOverlapSegments(nodes as any, edges as any), [nodes, edges]);
  
  const { historyRef, lastCommitRef, commitIfChanged, undo, redo } = useDiagramHistory(setNodes, setEdges, showFlash);
  useEffect(()=>{ (window as any).__showFlash = showFlash; },[showFlash]);
  // Keyboard shortcuts (undo/redo/select all/save/copy-paste)
  const { selection, setSelection, selectNode } = useDiagramSelection({ setNodes, setEdges, showFlash, enableKeyboardDelete: mode === MODES.EDIT, getNodes: () => nodes, getEdges: () => edges });
  const { applyAutoLayout, isNodeLocked } = useAutoLayout(globalAutoLayoutConfig);
  
  const [isDark, setIsDark] = useState(false);
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [jsonInitialPayload, setJsonInitialPayload] = useState<DiagramJsonPayload | null>(null);
  useEffect(()=>{
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(document.documentElement.classList.contains('dark') || mq.matches);
    update();
    mq.addEventListener('change', update);
    const obs = new MutationObserver(update); obs.observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
    return ()=>{ mq.removeEventListener('change', update); obs.disconnect(); };
  }, []);
  // Networks present in the diagram (derived from nodes; stable IDs)
  type Network = { id: string; label: string; color: string };
  const [networks, setNetworks] = useState<Network[]>([]);
  // Ensure existing network nodes have a stable netId field
  useEffect(() => {
    let changed = false;
    setNodes((nds) => {
      const next = nds.map(n => {
        if (n.type !== 'network') return n;
        const netId = (n.data?.netId as string | undefined) || n.id;
        if (n.data?.netId) return n;
        changed = true;
        return { ...n, data: { ...n.data, netId } };
      });
      return changed ? next : nds;
    });
  }, [setNodes]);
  // Derive networks list from current nodes (only nodes of type 'network')
  useEffect(() => {
    const present = nodes.filter(n => n.type === 'network').map(n => ({ id: (n.data?.netId || n.id) as string, label: n.data?.label || 'Network', color: n.data?.color || '#10b981' }));
    const same = present.length === networks.length && present.every((p, i) => p.id === networks[i]?.id && p.label === networks[i]?.label && p.color === networks[i]?.color);
    if (!same) setNetworks(present);
  }, [nodes]);

  // Synchronize network links when networks or nodes change
  useEffect(() => {
    if (!rehydrated) return; // avoid clobbering persisted edges on first mount
    const networkColorMap = new Map(networks.map(n => [n.id, n.color]));
    
    setEdges((eds) => {
      let updatedEdges = eds;
      
      // Update all services with autoLinkToNetworks enabled
      nodes.forEach(node => {
        if (node.type === 'component' && !node.data?.isContainer && node.data?.autoLinkToNetworks) {
          const networkIds = Array.isArray(node.data?.networks) ? node.data.networks : [];
          updatedEdges = updateNetworkLinksForService(updatedEdges, nodes, node.id, networkIds, networkColorMap, true);
        }
      });
      
      // Remove network links that point to non-existent networks
      const existingNodeIds = new Set(nodes.map(n => n.id));
      updatedEdges = updatedEdges.filter(edge => {
        if (!isNetworkLink(edge)) return true;
        return existingNodeIds.has(edge.source) && existingNodeIds.has(edge.target);
      });
      
      return updatedEdges;
    });
  }, [networks, nodes, rehydrated]);
  
  // Réorganisation automatique quand les paramètres globaux changent
  useEffect(() => {
    // Trouver tous les conteneurs qui utilisent les valeurs globales
    const containersWithGlobalDefaults = nodes.filter(node => 
      node.data?.autoLayout?.enabled && 
      node.data?.autoLayout?.useGlobalDefaults &&
      (node.data?.isContainer || node.type === 'network')
    );
    
    if (containersWithGlobalDefaults.length > 0) {
      setNodes((nds) => {
        let updatedNodes = [...nds];
        
        containersWithGlobalDefaults.forEach(containerNode => {
          const childNodes = nds.filter(n => n.parentNode === containerNode.id);
          if (childNodes.length > 0) {
            const layoutResult = applyAutoLayout(
              containerNode, 
              childNodes, 
              updatedNodes, 
              containerNode.data.autoLayout
            );
            updatedNodes = layoutResult;
          }
        });
        
        return updatedNodes;
      });
    }
  }, [globalAutoLayoutConfig]); // Se déclenche quand les paramètres globaux changent
  
  // Track changes
  useEffect(()=>{ commitIfChanged(nodes, edges); }, [nodes, edges, commitIfChanged]);
  // Keyboard delete handled inside useDiagramSelection when enabled (disabled here for duplication avoidance)

  // Node selection handled by hook

  // Edge style pattern utility imported

  // Helpers for ancestry
  const parentMapOf = (ns: any[]) => new Map(ns.map((n) => [n.id, n.parentNode]));
  const isAncestor = (ns: any[], maybeAncestorId: string, nodeId: string) => {
    const pmap = parentMapOf(ns); let cur = pmap.get(nodeId); let guard = 0;
    while (cur && guard++ < 100) { if (cur === maybeAncestorId) return true; cur = pmap.get(cur as string); }
    return false;
  };

  // Absolute positioning helpers (for nested containers)
  const headerOffsetFor = useCallback((n:any)=>headerOffsetForUtil(n), []);
  const absoluteOf = useCallback((n:any)=>absolutePosition(n, nodes), [nodes]);

  // Compute zIndex: strict parent < child ordering at all depths
  useEffect(()=>{ applyZIndexHierarchy(nodes, setNodes); }, [nodes, setNodes]);

  // Selection zIndex correction: keep containers at depth z-index even when selected
  useEffect(()=>{ enforceContainerSelectedZ(selection, setNodes); }, [selection, setNodes]);

  // Auto-layout surveillance des redimensionnements
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nodeId = entry.target.getAttribute('data-id');
        if (nodeId) {
          const node = nodes.find(n => n.id === nodeId);
          if (node?.data?.autoLayout?.enabled && (node.data?.isContainer || node.type === 'network')) {
            // Réorganiser automatiquement après un petit délai
            setTimeout(() => {
              setNodes((nds) => {
                const containerNode = nds.find(n => n.id === nodeId);
                if (!containerNode?.data?.autoLayout?.enabled) return nds;
                
                const childNodes = nds.filter(n => n.parentNode === nodeId);
                return applyAutoLayout(containerNode, childNodes, nds, containerNode.data.autoLayout);
              });
            }, 100);
          }
        }
      }
    });

    // Observer tous les conteneurs avec auto-layout
    const containersWithAutoLayout = nodes.filter(n => 
      n.data?.autoLayout?.enabled && (n.data?.isContainer || n.type === 'network')
    );

    containersWithAutoLayout.forEach(node => {
      const element = document.querySelector(`[data-id="${node.id}"]`);
      if (element) {
        resizeObserver.observe(element);
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [nodes, applyAutoLayout]);

  // Edge patterns CSS moved to globals.css

  // Stable edge addition + auto color + pattern baseline
  const addDefaultEdge = useCallback((params: any) => {
    setEdges((eds) => {
      // Check if this is a connection to a network node
      const targetNode = nodes.find(n => n.id === params.target);
      const sourceNode = nodes.find(n => n.id === params.source);
      
      if (targetNode?.type === 'network' && sourceNode?.type === 'component' && !sourceNode.data?.isContainer) {
        // Create a network link edge
        const networkColor = targetNode.data?.color || '#10b981';
        const networkId = targetNode.data?.netId || targetNode.id;
        
        const e: any = {
          ...params,
          type: 'networkLink',
          animated: false,
          style: {
            stroke: networkColor,
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: networkColor,
          },
          data: {
            isNetworkLink: true,
            networkId,
            networkColor,
            shape: 'smooth',
            pattern: 'solid',
          },
          className: 'network-link-edge',
        };
        
        return addEdge(e, eds);
      } else {
        // Create a regular edge with custom anchoring support
        const data = { shape: 'smooth', pattern: 'solid' };
        let e: any = { ...params, type: 'default', data, markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 2, stroke: '#64748b' } };
        e = applyPatternToEdge(e);
        return addEdge(e, eds);
      }
    });
  }, [setEdges, applyPatternToEdge, nodes]);

  const onConnect = useCallback((params: any) => addDefaultEdge(params), [addDefaultEdge]);

  // Recompute color + ensure pattern styling persists
  // Pattern reapplication only if needed (removed dynamic coloring logic)
  useEffect(() => {
    setEdges((eds) => eds.map((e) => applyPatternToEdge(e)));
  }, [applyPatternToEdge]);

  // Derive per-node network color segments from data.networks and global registry
  useEffect(() => {
    const colorMap = new Map(networks.map(n => [n.id, n.color] as const));
    setNodes((nds) => {
      let changed = false;
      const next = nds.map(n => {
        if (n.type !== 'component' || n.data?.isContainer) return n;
        const ids: string[] = Array.isArray(n.data?.networks) ? n.data.networks : [];
        const cols = ids.map(id => colorMap.get(id)).filter(Boolean) as string[];
        const prev = (n.data?.networkColors || []) as string[];
        const same = prev.length === cols.length && prev.every((c, i) => c === cols[i]);
        if (same) return n;
        changed = true;
        return { ...n, data: { ...n.data, networkColors: cols } };
      });
      return changed ? next : nds;
    });
  }, [networks, nodes]);

  // One-time normalization to remove legacy negative offsets for nodes inside containers
  useEffect(() => {
    setNodes((nds) => nds.map(n => {
      if (!n.parentNode) return n;
      if (n.position.x < 0 || n.position.y < -CONTAINER_HEADER_HEIGHT) {
        return { ...n, position: { x: Math.max(0, n.position.x), y: Math.max(0, n.position.y) } };
      }
      return n;
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Container hit test — with self/descendant exclusion to prevent cycles
  const findContainerAt = useCallback((absPos: { x: number; y: number }, excludeId?: string) => {
    const candidates = nodes
      .filter((n) => (n.data?.isContainer || n.type === 'network') && n.id !== excludeId)
      .map((c) => {
        const abs = absoluteOf(c);
        const w = (c.type === 'network' ? (c.data?.width ?? 420) : (c.data?.width ?? c.style?.width ?? 520)) as number;
        const h = (c.type === 'network' ? (c.data?.height ?? 240) : (c.data?.height ?? c.style?.height ?? 320)) as number;
        return { c, rect: { x: abs.x, y: abs.y, w, h } };
      })
      .filter(({ c, rect }) => absPos.x >= rect.x && absPos.y >= rect.y && absPos.x <= rect.x + rect.w && absPos.y <= rect.y + rect.h)
      .filter(({ c }) => !(excludeId && isAncestor(nodes, excludeId, c.id)));
    if (!candidates.length) return null;
    // Choose the smallest area container that contains the point (most inner visually)
    candidates.sort((A, B) => {
      const a = A.rect.w * A.rect.h;
      const b = B.rect.w * B.rect.h;
      if (a !== b) return a - b;
      // tie-breaker: greater depth wins
      const pmap = parentMapOf(nodes);
      const depth = (id: string) => { let d=0, p=pmap.get(id) as string|undefined, g=0; while(p && g++<100){ d++; p = pmap.get(p); } return d; };
      return depth(B.c.id) - depth(A.c.id);
    });
    return candidates[0].c;
  }, [nodes, absoluteOf]);

  // DnD handlers (extracted)
  const { onDrop, onDragOver, onNodeDragStop } = useMemo(() => createDnDHandlers({
    mode,
    MODES,
    reactFlowWrapper,
    project,
    getNodes: () => nodes,
    setNodes,
    findContainerAt,
    headerOffsetFor: (n:any) => headerOffsetFor(n),
    absoluteOf: (n:any) => absoluteOf(n),
    DEFAULT_DOOR_WIDTH,
    DEFAULT_DOOR_HEIGHT,
    snapDoorToNearestSide,
  }), [mode, project, nodes, setNodes, findContainerAt]);

  // Selection / connect
  const onNodeClick = useCallback((evt: any, node: any) => {
    if (mode !== MODES.EDIT) return;
    // Let React Flow handle additive selection when Shift is held
    if (evt?.shiftKey) return;
    selectNode(node);
  }, [mode, selectNode]);

  const onEdgeClick = useCallback((_: any, edge: any) => { if (mode === MODES.EDIT) setSelection({ ...edge, type: "edge" }); }, [mode, setSelection]);

  const updateSelection = useCallback((patch: any) => {
    // Allow certain actions even without a focused single node
    if (!selection) {
      if (patch?.wrapSelectionInContainer) {
        setNodes((nds) => {
          const targetIds = nds.filter(n=>n.selected).map(n=>n.id);
          if (!targetIds.length) return nds;
          return wrapInContainerUtil(nds, targetIds);
        });
        return;
      }
      return;
    }
    if (selection.type === 'node') {
      // Remove container but keep its children at same hierarchy level
      if (patch.removeContainerKeepChildren && (selection.data?.isContainer || selection.nodeType==='network')) {
        setNodes((nds) => removeContainerKeepChildrenUtil(nds, selection.id));
        setSelection(null);
        return;
      }
      // Wrap single node or current multi-selection in a new container sized to fit
      if (patch.wrapSelectionInContainer) {
        setNodes((nds) => {
          const selectedIds = nds.filter(n=>n.selected).map(n=>n.id);
          const targetIds = selectedIds.length ? selectedIds : [selection.id];
          return wrapInContainerUtil(nds, targetIds);
        });
        return;
      }
        // Resize network container to fit children
        if (patch.autoFitNetwork && selection.type==='node' && selection.nodeType==='network') {
          setNodes((nds) => {
            const children = nds.filter(c => c.parentNode === selection.id);
            if (!children.length) return nds;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            children.forEach(c => {
              const w = (c.style?.width as number) || (c.data?.isContainer ? (c.data.width||520) : 240);
              const h = (c.style?.height as number) || (c.data?.isContainer ? (c.data.height||320) : 84);
              minX = Math.min(minX, c.position.x);
              minY = Math.min(minY, c.position.y);
              maxX = Math.max(maxX, c.position.x + w);
              maxY = Math.max(maxY, c.position.y + h);
            });
            const pad = 24; const headerOffset = NETWORK_HEADER_HEIGHT + 6;
            const newW = Math.max(240, (maxX - minX) + pad * 2);
            const newH = Math.max(140, (maxY - minY) + pad * 2 + headerOffset);
            const shiftX = minX - pad; const shiftY = minY - pad;
            return nds.map(n => {
              if (n.parentNode === selection.id) return { ...n, position: { x: n.position.x - shiftX, y: n.position.y - shiftY } };
              if (n.id === selection.id) return { ...n, data: { ...n.data, width: newW, height: newH }, style: { ...(n.style||{}), width: newW, height: newH } };
              return n;
            });
          });
          setSelection((s:any)=> s && s.id===selection.id ? { ...s } : s);
          return;
        }
      if (patch.autoFitContainer && selection.data?.isContainer) {
        setNodes((nds) => {
          const children = nds.filter(c => c.parentNode === selection.id);
          if (!children.length) return nds;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          children.forEach(c => {
            const w = (c.style?.width as number) || (c.data?.isContainer ? (c.data.width||520) : 240);
            const h = (c.style?.height as number) || (c.data?.isContainer ? (c.data.height||320) : 84);
            minX = Math.min(minX, c.position.x);
            minY = Math.min(minY, c.position.y);
            maxX = Math.max(maxX, c.position.x + w);
            maxY = Math.max(maxY, c.position.y + h);
          });
          const pad = 24; const headerOffset = CONTAINER_HEADER_HEIGHT;
          const newW = Math.max(260, (maxX - minX) + pad * 2);
          const newH = Math.max(180, (maxY - minY) + pad * 2 + headerOffset);
          const shiftX = minX - pad; const shiftY = minY - pad;
          return nds.map(n => {
            if (n.parentNode === selection.id) return { ...n, position: { x: n.position.x - shiftX, y: n.position.y - shiftY } };
            if (n.id === selection.id) return { ...n, data: { ...n.data, width: newW, height: newH }, style: { ...(n.style||{}), width: newW, height: newH } };
            return n;
          });
        });
        setSelection((s:any)=> s && s.id===selection.id ? { ...s } : s);
        return;
      }

      // Mise à jour normale des données AVANT l'auto-layout
      if (patch.data) {
        const partitionsChanging = Object.prototype.hasOwnProperty.call(patch.data, 'partitions');
        if (!partitionsChanging) {
          setNodes((nds) => nds.map((n) => (n.id === selection.id ? { ...n, data: { ...n.data, ...patch.data } } : n)));
        } else {
          // Apply data change, then clamp children into new partitions
          setNodes((nds) => {
            const updated = nds.map((n) => {
              if (n.id !== selection.id) return n;
              const nextParts = Math.max(1, Math.min(12, parseInt(String((patch.data.partitions ?? n.data?.partitions) ?? 1), 10) || 1));
              let nextIcons: string[] | undefined = Array.isArray(n.data?.partitionIcons) ? [...n.data.partitionIcons] : [];
              // Ensure exactly nextParts entries
              nextIcons = nextIcons.slice(0, nextParts);
              while (nextIcons.length < nextParts) nextIcons.push('');
              let nextTexts: string[] | undefined = Array.isArray(n.data?.partitionBadgeTexts) ? [...n.data.partitionBadgeTexts] : [];
              nextTexts = nextTexts.slice(0, nextParts);
              while (nextTexts.length < nextParts) nextTexts.push('');
              return { ...n, data: { ...n.data, ...patch.data, partitionIcons: nextIcons, partitionBadgeTexts: nextTexts } };
            });
            const container = updated.find(n => n.id === selection.id);
            if (!container) return updated;
            const isNet = container.type === 'network';
            const headerLeft = (container.data?.headerPos||'top')==='left' ? (isNet?NETWORK_HEADER_HEIGHT:CONTAINER_HEADER_HEIGHT) : 0;
            const width = (container.data?.width||container.style?.width||container.width||520) as number;
            const parts = Math.max(1, Math.min(12, parseInt(String(container.data?.partitions ?? 1), 10) || 1));
            const innerW = width - headerLeft;
            const partW = innerW / parts;
            const leftPad = 4;
            return updated.map(n => {
              if (n.parentNode !== selection.id) return n;
              const nodeW = (n as any).width || (n as any).data?.width || (n as any).style?.width || 150;
              let pIdx = (n as any).data?.parentPartition;
              if (typeof pIdx !== 'number' || isNaN(pIdx)) {
                const localX = Math.max(0, n.position.x - headerLeft);
                pIdx = Math.floor(localX / partW);
              }
              if (pIdx < 0) pIdx = 0; if (pIdx >= parts) pIdx = parts - 1;
              // Clamp X into partition bounds
              const minX = headerLeft + pIdx * partW + leftPad;
              const maxX = headerLeft + (pIdx + 1) * partW - nodeW - leftPad;
              const newX = Math.max(minX, Math.min(n.position.x, maxX));
              return { ...n, position: { x: newX, y: n.position.y }, data: { ...(n.data||{}), parentPartition: pIdx } };
            });
          });
        }
        setSelection((s: any) => {
          if (!s || s.id !== selection.id) return s;
          // Mirror partitionIcons length when partitions changed
          if (partitionsChanging) {
            const nextParts = Math.max(1, Math.min(12, parseInt(String((patch.data.partitions ?? s.data?.partitions) ?? 1), 10) || 1));
            let nextIcons: string[] | undefined = Array.isArray(s.data?.partitionIcons) ? [...s.data.partitionIcons] : [];
            nextIcons = nextIcons.slice(0, nextParts);
            while (nextIcons.length < nextParts) nextIcons.push('');
            let nextTexts: string[] | undefined = Array.isArray(s.data?.partitionBadgeTexts) ? [...s.data.partitionBadgeTexts] : [];
            nextTexts = nextTexts.slice(0, nextParts);
            while (nextTexts.length < nextParts) nextTexts.push('');
            return { ...s, data: { ...s.data, ...patch.data, partitionIcons: nextIcons, partitionBadgeTexts: nextTexts } };
          }
          return { ...s, data: { ...s.data, ...patch.data } };
        });
      }

      // Handle auto-layout APRÈS la mise à jour des données
      if (patch.applyAutoLayout && (selection.data?.isContainer || selection.nodeType === 'network')) {
        // Petite pause pour permettre à React de traiter la mise à jour des données
        setTimeout(() => {
          setNodes((nds) => {
            const containerNode = nds.find(n => n.id === selection.id);
            if (!containerNode || !containerNode.data?.autoLayout) return nds;
            
            const childNodes = nds.filter(n => n.parentNode === selection.id);
            return applyAutoLayout(containerNode, childNodes, nds, containerNode.data.autoLayout);
          });
        }, 1);
        return;
      }
      
      // Réorganisation automatique si l'auto-layout est activé et si on change la taille
      // (mais seulement si on n'a pas déjà déclenché l'auto-layout explicitement)
      if (patch.data && (patch.data.width !== undefined || patch.data.height !== undefined) && 
          (selection.data?.isContainer || selection.nodeType === 'network') && !patch.applyAutoLayout) {
        setTimeout(() => {
          setNodes((nds) => {
            const containerNode = nds.find(n => n.id === selection.id);
            if (!containerNode) return nds;
            const childNodes = nds.filter(n => n.parentNode === selection.id);
            if (childNodes.length === 0) return nds;
            let next: typeof nds = nds;
            if (containerNode.data?.autoLayout?.enabled) {
              // Appliquer l'auto-layout avec agrandissement automatique si nécessaire
              next = applyAutoLayout(containerNode, childNodes, nds, containerNode.data.autoLayout);
            } else {
              // Sinon, simplement RE-CLAMP dans les partitions
              const isNet = containerNode.type === 'network';
              const headerLeft = (containerNode.data?.headerPos||'top')==='left' ? (isNet?NETWORK_HEADER_HEIGHT:CONTAINER_HEADER_HEIGHT) : 0;
              const width = (containerNode.data?.width||containerNode.style?.width||containerNode.width||520) as number;
              const parts = Math.max(1, Math.min(12, parseInt(String(containerNode.data?.partitions ?? 1), 10) || 1));
              const innerW = width - headerLeft;
              const partW = innerW / parts;
              const leftPad = 4;
              next = nds.map(n => {
                if (n.parentNode !== selection.id) return n;
                const nodeW = (n as any).width || (n as any).data?.width || (n as any).style?.width || 150;
                let pIdx = (n as any).data?.parentPartition;
                if (typeof pIdx !== 'number' || isNaN(pIdx)) {
                  const localX = Math.max(0, n.position.x - headerLeft);
                  pIdx = Math.floor(localX / partW);
                }
                if (pIdx < 0) pIdx = 0; if (pIdx >= parts) pIdx = parts - 1;
                const minX = headerLeft + pIdx * partW + leftPad;
                const maxX = headerLeft + (pIdx + 1) * partW - nodeW - leftPad;
                const newX = Math.max(minX, Math.min(n.position.x, maxX));
                return { ...n, position: { x: newX, y: n.position.y }, data: { ...(n.data||{}), parentPartition: pIdx } };
              });
            }
            // Mettre à jour la sélection à partir de la version la plus récente du nœud
            setSelection((s: any) => {
              if (s && s.id === selection.id) {
                const updatedNode = next.find(n => n.id === selection.id);
                return updatedNode ? { ...s, data: updatedNode.data } : s;
              }
              return s;
            });
            return next;
          });
        }, 50); // Petit délai pour que la mise à jour de taille soit appliquée
      }
      
      // Logique détach inchangée
      if (patch.detachFromParent) {
        setNodes((nds) => nds.map((n) => {
          if (n.id !== selection.id) return n;
          if (!n.parentNode) return n;
          // compute absolute pos across all ancestors including header offsets
          let x = n.position.x; let y = n.position.y;
          let cur = nds.find(p => p.id === n.parentNode) as any | undefined;
          let guard = 0;
          while (cur && guard++ < 100) {
            x += cur.position.x;
            y += cur.position.y + (cur.type==='network' ? NETWORK_HEADER_HEIGHT : (cur.data?.isContainer ? CONTAINER_HEADER_HEIGHT : 0));
            cur = cur.parentNode ? nds.find(p => p.id === cur.parentNode) : undefined;
          }
          return { ...n, parentNode: undefined, extent: undefined, position: { x, y } };
        }));
        setSelection((s: any) => ({ ...s, parentNode: undefined, extent: undefined }));
        return;
      }
      
      // Application du patch (logique de mise à jour réorganisée plus haut)
      if (!patch.data) {
        // Si pas de data, application normale
        setNodes((nds) => nds.map((n) => (n.id === selection.id ? { ...n, ...patch, draggable: patch?.data?.locked !== undefined ? !patch.data.locked : n.draggable } : n)));
        setSelection((s: any) => ({ ...s, ...patch }));
      }
      
      // Handle network links when autoLinkToNetworks or networks change
      if (patch.data && (patch.data.hasOwnProperty('autoLinkToNetworks') || patch.data.hasOwnProperty('networks'))) {
        const updatedNode = nodes.find(n => n.id === selection.id);
        if (updatedNode && updatedNode.type === 'component' && !updatedNode.data?.isContainer) {
          const networkIds = Array.isArray(patch.data.networks) ? patch.data.networks : (updatedNode.data?.networks || []);
          const autoLinkEnabled = patch.data.hasOwnProperty('autoLinkToNetworks') ? patch.data.autoLinkToNetworks : (updatedNode.data?.autoLinkToNetworks || false);
          const networkColorMap = new Map(networks.map(n => [n.id, n.color]));
          
          setEdges((eds) => updateNetworkLinksForService(eds, nodes, selection.id, networkIds, networkColorMap, autoLinkEnabled));
        }
      }
      // When door width changes via properties, resnap precisely
      if (patch?.data && selection?.type === 'node' && selection.nodeType !== 'edge') {
        const changedWidth = Object.prototype.hasOwnProperty.call(patch.data, 'width');
        if (changedWidth) {
          setNodes((nds) => nds.map((n) => {
            if (n.id !== selection.id || n.type !== 'door' || !n.parentNode) return n;
            const parent = nds.find(p => p.id === n.parentNode);
            if (!parent) return n;
            const doorW = Math.round((patch.data?.width ?? n.data?.width ?? DEFAULT_DOOR_WIDTH));
            const doorH = DEFAULT_DOOR_HEIGHT;
            const snapped = snapDoorToNearestSide(parent, n.position, doorW, doorH);
            return { ...n, position: snapped.position, data: { ...(n.data||{}), side: snapped.side } };
          }));
        }
      }
  // keep explicit edge color only if user changes it via edge properties
    } else {
      setEdges((eds) => eds.map((e) => {
        if (e.id !== selection.id) return e;
        let next: any = { ...e, ...patch };
        if (patch.data) next.data = { ...(e.data||{}), ...patch.data };
        if (patch.data?.shape) {
          const shape = patch.data.shape; const map:Record<string,string>={smooth:'smoothstep',straight:'default',step:'step'}; next.type = map[shape]||'smoothstep';
        }
        if (patch.style) next.style = { ...(e.style||{}), ...(patch.style||{}) };
        next = applyPatternToEdge(next);
        return next;
      }));
      setSelection((s: any) => ({ ...s, ...patch, data: { ...(s.data||{}), ...(patch.data||{}) }, style: { ...(s.style||{}), ...(patch.style||{}) } }));
  // no dynamic recoloring on label change anymore
    }
  }, [selection, nodes, applyPatternToEdge]);

  // Container resize immediate -> sync sizes from events fired by handles
  useEffect(() => {
    const immediate = (e: any) => {
      const { id, width, height } = e.detail || {};
      if (!id) return;
      setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, width, height }, style: { ...(n.style||{}), width, height } } : n));
      setSelection((s: any) => (s && s.id === id ? { ...s, data: { ...s.data, width, height } } : s));
    };
    window.addEventListener('container:resize:immediate', immediate);
    return () => window.removeEventListener('container:resize:immediate', immediate);
  }, [setNodes]);

  const deleteSelection = useCallback(() => {
    if (!selection) return;
    if (selection.type === "node") {
      // defer actual deletion until helper is available
      (window as any).__deleteNodesCascade?.([selection.id]);
    }
    else setEdges((eds) => eds.filter((e) => e.id !== selection.id));
    setSelection(null);
  }, [selection, setEdges, setSelection]);

  const onNodeDoubleClick = useCallback((_: any, node: any) => { if (mode !== MODES.EDIT) return; const label = prompt("Label", node.data?.label || ""); if (label !== null) setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label } } : n))); }, [mode, setNodes]);
  const onEdgeDoubleClick = useCallback((_: any, edge: any) => { if (mode !== MODES.EDIT) return; const label = prompt("Label", edge.label || ""); if (label !== null) setEdges((eds) => eds.map((e) => (e.id === edge.id ? { ...e, label } : e))); }, [mode, setEdges]);

  // Persistence
  const onSave = useCallback(() => { 
    localStorage.setItem("server-arch:nodes", JSON.stringify(nodes)); 
    localStorage.setItem("server-arch:edges", JSON.stringify(edges)); 
    localStorage.setItem("server-arch:global-config", JSON.stringify(globalAutoLayoutConfig));
    try { localStorage.setItem('server-arch:groups', JSON.stringify(groups)); } catch {}
    try { localStorage.setItem('server-arch:instance-groups', JSON.stringify(instanceGroups)); } catch {}
  }, [nodes, edges, globalAutoLayoutConfig, groups, instanceGroups]);
  
  const onLoad = useCallback(() => { 
    const n = JSON.parse(localStorage.getItem("server-arch:nodes") || "null"); 
    const e = JSON.parse(localStorage.getItem("server-arch:edges") || "null"); 
    const g = JSON.parse(localStorage.getItem("server-arch:global-config") || "null");
  const gr = JSON.parse(localStorage.getItem('server-arch:groups') || 'null');
  const igr = JSON.parse(localStorage.getItem('server-arch:instance-groups') || 'null');
    
    if (n && e) { 
      setNodes(n); 
      setEdges(e); 
      setSelection(null); 
      
      if (g) {
        onUpdateGlobalAutoLayoutConfig({ ...DEFAULT_GLOBAL_AUTO_LAYOUT, ...g });
      }
    if (Array.isArray(gr)) setGroups(gr);
    if (Array.isArray(igr)) setInstanceGroups(igr);
    } 
  }, [setNodes, setEdges, onUpdateGlobalAutoLayoutConfig, setGroups, setInstanceGroups]);
  const onClear = useCallback(() => { setNodes([]); setEdges([]); setSelection(null); historyRef.current = { past: [], present: { nodes: [], edges: [] }, future: [] }; lastCommitRef.current = Date.now(); try { localStorage.removeItem(HISTORY_STORAGE_KEY); } catch(_){} showFlash('Cleared'); }, [showFlash]);

  // Export helpers moved to lib/export
  const getSelectedNodeSceneRect = () => {
    if (!selection || selection.type !== 'node') return null;
    const n = nodes.find(nd => nd.id === selection.id);
    if (!n) return null;
    const pos = absolutePosition(n, nodes);
    const w = (n.style?.width as number) || (n.data?.width as number) || (n.width as number) || 520;
    const h = (n.style?.height as number) || (n.data?.height as number) || (n.height as number) || 320;
    return { x: pos.x, y: pos.y, w, h };
  };

  // Tight bounds moved to lib/export

  const onExportPng = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    const viewportEl = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewportEl) return;
    const scene = getSelectedNodeSceneRect();
    const dataUrl = scene
      ? await fitAndExportSelection(viewportEl, scene, 8)
      : await exportViewportCropToPng(viewportEl, computeTightBounds(viewportEl));
    const link = document.createElement('a');
    link.download = `architecture-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [selection]);


  // Print the entire diagram: fit all nodes into view, snapshot, crop to content, print via hidden iframe
  // Compute full diagram bounds in scene coordinates from nodes
  const getDiagramSceneBounds = useCallback(() => {
    if (!nodes.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      const pos = absolutePosition(n, nodes);
      const w = (n.style?.width as number) || (n.data?.width as number) || (n.width as number) || 150;
      const h = (n.style?.height as number) || (n.data?.height as number) || (n.height as number) || 100;
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + w);
      maxY = Math.max(maxY, pos.y + h);
    });
    if (!isFinite(minX)) return null;
    return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
  }, [nodes]);

  const onPrintDiagram = useCallback(async () => {
    if (!reactFlowWrapper.current) { showFlash('Rien à imprimer'); return; }
    const viewportEl = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewportEl) { showFlash('Rien à imprimer'); return; }
    try {
      const scene = getDiagramSceneBounds();
      if (!scene) { showFlash('Rien à imprimer'); return; }
      const dataUrl = await exportFullDiagram(viewportEl, scene, 12);

      printDataUrl(dataUrl, 'Impression');
    } catch (e) { console.error(e); showFlash('Impression échouée'); }
  }, [getDiagramSceneBounds]);

  // Export graph as JSON file (nodes + edges + groups + global config)
  const onExportJson = useCallback(() => {
    const payload = { 
      nodes, 
      edges, 
      groups,
      instanceGroups,
      globalAutoLayoutConfig 
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [nodes, edges, groups, globalAutoLayoutConfig]);

  const openJsonEditor = useCallback(() => {
    const snapshot: DiagramJsonPayload = { nodes, edges, groups, instanceGroups, globalAutoLayoutConfig } as any;
    setJsonInitialPayload(snapshot);
    setJsonEditorOpen(true);
  }, [nodes, edges, groups, instanceGroups, globalAutoLayoutConfig]);
  const applyJsonEditor = useCallback((payload: DiagramJsonPayload) => {
    setNodes(payload.nodes as any);
    setEdges(payload.edges as any);
    if (Array.isArray(payload.groups)) setGroups(payload.groups as any);
    if (Array.isArray(payload.instanceGroups)) setInstanceGroups(payload.instanceGroups as any);
    if (payload.globalAutoLayoutConfig) onUpdateGlobalAutoLayoutConfig(payload.globalAutoLayoutConfig as any);
    try {
      historyRef.current = { past: [], present: { nodes: payload.nodes, edges: payload.edges }, future: [] } as any;
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRef.current));
    } catch {}
  }, [setNodes, setEdges, setGroups, setInstanceGroups, onUpdateGlobalAutoLayoutConfig]);

  // Import nodes+edges+groups+global config JSON from file
  const onImportJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
  const data = JSON.parse(text);
  const n = Array.isArray(data?.nodes) ? data.nodes : null;
  const e = Array.isArray(data?.edges) ? data.edges : null;
  const gr = Array.isArray(data?.groups) ? data.groups : null;
  const igr = Array.isArray(data?.instanceGroups) ? data.instanceGroups : null;
        if (!n || !e) throw new Error('Invalid JSON: expected { nodes:[], edges:[] }');
        
        setNodes(n);
        setEdges(e);
        setSelection(null);
  if (gr) setGroups(gr);
  if (igr) setInstanceGroups(igr);
        
        // Charger les paramètres globaux s'ils existent
        if (data.globalAutoLayoutConfig) {
          onUpdateGlobalAutoLayoutConfig({ ...DEFAULT_GLOBAL_AUTO_LAYOUT, ...data.globalAutoLayoutConfig });
        }
        
        // Reset history to the imported state
        historyRef.current = { past: [], present: { nodes: JSON.parse(JSON.stringify(n)), edges: JSON.parse(JSON.stringify(e)) }, future: [] };
        lastCommitRef.current = Date.now();
        try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRef.current)); } catch(_){}
        showFlash('Imported JSON');
      } catch (err) {
        console.error(err);
        showFlash('Import failed');
      }
    };
    input.click();
  }, [setNodes, setEdges, setSelection, setGroups, setInstanceGroups]);


  // Drag from palette
  const onEntryDragStart = (event: DragEvent, entry: any) => {
    (event.dataTransfer as DataTransfer).setData("application/x-id", entry.id);
    (event.dataTransfer as DataTransfer).setData("application/x-label", entry.label);
    (event.dataTransfer as DataTransfer).setData("application/x-icon", entry.icon);
    (event.dataTransfer as DataTransfer).setData("application/x-color", entry.color);
    (event.dataTransfer as DataTransfer).effectAllowed = "move";
  };

  const onNodeDragStart = useCallback((evt: any, node: any) => {
  if (mode !== MODES.EDIT) { evt.stopPropagation(); return; }
  if (document.body.classList.contains('resizing-container')) { evt.stopImmediatePropagation?.(); evt.stopPropagation(); return false; }
  
    // Bloquer le mouvement si l'auto-layout est activé pour ce nœud
    if (isNodeLocked(node, nodes)) {
      evt.stopImmediatePropagation?.(); 
      evt.stopPropagation(); 
      return false;
    }
    
    if (evt?.altKey && node.parentNode) {
      if (node.type === 'door') {
        return; // Doors cannot be detached from their container
      }
      setNodes((nds) => nds.map((n) => {
        if (n.id !== node.id) return n;
        if (!n.parentNode) return n;
        let x = n.position.x; let y = n.position.y; let cur = nds.find(p => p.id === n.parentNode) as any | undefined; let guard=0;
        while (cur && guard++<100) { x += cur.position.x; y += cur.position.y + (cur.type==='network'?NETWORK_HEADER_HEIGHT:(cur.data?.isContainer?CONTAINER_HEADER_HEIGHT:0)); cur = cur.parentNode ? nds.find(p=>p.id===cur.parentNode) : undefined; }
        return { ...n, parentNode: undefined, extent: undefined, position: { x, y } };
      }));
      setSelection((s: any) => (s && s.id === node.id ? { ...s, parentNode: undefined, extent: undefined } : s));
    }
  }, [setNodes, isNodeLocked, nodes, mode]);
  // Multi-drag handlers (extracted)
  const { onNodeDragStartMulti, onNodeDrag, onNodeDragStopMulti } = useMultiDrag({
    nodes,
    setNodes,
    mode,
    MODES,
    DEFAULT_DOOR_WIDTH,
    DEFAULT_DOOR_HEIGHT,
    CONTAINER_HEADER_HEIGHT,
    NETWORK_HEADER_HEIGHT,
    snapDoorToNearestSide,
  });

  // =========
  // Cascade delete helpers
  // =========
  const collectDescendants = useCallback((rootIds: Set<string>) => {
    const toDelete = new Set(rootIds);
    let changed = true; let guard = 0;
    while (changed && guard++ < 1000) {
      changed = false;
      nodes.forEach(n => {
        if (n.parentNode && toDelete.has(n.parentNode) && !toDelete.has(n.id)) { toDelete.add(n.id); changed = true; }
      });
    }
    return toDelete;
  }, [nodes]);

  const deleteNodesCascade = useCallback((ids: string[]) => {
    if (!ids.length) return;
    const base = new Set(ids);
    const all = collectDescendants(base);
    // Determine netIds of network nodes being deleted to clean memberships
    const netIdsToRemove = new Set<string>();
    nodes.forEach(n => { if (all.has(n.id) && n.type === 'network') { netIdsToRemove.add((n.data?.netId || n.id) as string); } });
    // Update nodes and edges
    setNodes((nds) => nds.filter(n => !all.has(n.id)).map(n => {
      if (!netIdsToRemove.size) return n;
      if (n.type !== 'component' || n.data?.isContainer) return n;
      const cur: string[] = Array.isArray(n.data?.networks) ? n.data.networks : [];
      const next = cur.filter(id => !netIdsToRemove.has(id));
      if (next.length === cur.length) return n;
      const nextData:any = { ...n.data, networks: next };
      if (n.data?.primaryNetwork && netIdsToRemove.has(n.data.primaryNetwork)) { delete nextData.primaryNetwork; }
      return { ...n, data: nextData };
    }));
    setEdges((eds) => eds.filter(e => !all.has(e.source) && !all.has(e.target)));
    setSelection(null);
  }, [nodes, setNodes, setEdges, setSelection, collectDescendants]);
  useEffect(()=>{ (window as any).__deleteNodesCascade = deleteNodesCascade; }, [deleteNodesCascade]);
  useDiagramShortcuts({
    mode,
    MODES,
    undo,
    redo,
    onSave,
    selection,
    setSelection,
    nodes,
    edges,
    setNodes,
    setEdges,
    collectDescendants,
    showFlash,
  });
  // old inline multi-drag handlers removed (moved to useMultiDrag)

  // Clear selection and enforce read-only when switching to view mode
  useEffect(() => {
    if (mode === MODES.VIEW) {
      setSelection(null);
    }
  }, [mode, setSelection]);

  const viewLocked = mode === MODES.VIEW;
  const { isPanning, onMouseDown: onWrapperMouseDown } = useViewModePan(viewLocked, getViewport, setViewport);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  // Hydration note: ne pas lire localStorage dans l'initialisation useState
  // pour éviter un rendu initial différent (serveur vs client) qui déclenche
  // un warning de mismatch (aria-label du bouton Snap). On initialise à false
  // puis on synchronise après montage.
  const [snapEnabled, setSnapEnabled] = useState<boolean>(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('server-arch:snap');
      if (saved) setSnapEnabled(saved === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('server-arch:snap', snapEnabled ? '1' : '0'); } catch {}
  try { (window as any).__snapEnabled = snapEnabled; } catch {}
  }, [snapEnabled]);

  const GRID = 24;
  const snapRound = (v: number) => Math.round(v / GRID) * GRID;
  const onSnapAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => {
      if (n.type === 'door') return n; // don't snap doors, they follow walls
      const parent = n.parentNode ? nds.find(p => p.id === n.parentNode) : undefined;
      const pos = n.position;
      // keep relative to parent if any; BASE grid applies to local coords as well
      return { ...n, position: { x: snapRound(pos.x), y: snapRound(pos.y) } };
    }));
    showFlash('Snapped to grid');
  }, [setNodes]);

  return (
    <ThemeProvider>
  <div className="h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-100 selection:bg-slate-900/80 selection:text-white dark:selection:bg-slate-100/20 dark:selection:text-slate-100">
  {/* edge label/pattern styles are now in globals.css */}
      <TooltipProvider>
        {historyFlash && (
          <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-[200]">
            <div className="px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs shadow backdrop-blur-sm animate-fade-in">
              {historyFlash}
            </div>
          </div>
        )}
  <div className="h-16 px-2 sm:px-4 border-b bg-white/70 dark:bg-slate-900/70 backdrop-blur flex items-center gap-3 justify-between sticky top-0 z-50 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow"><LayoutGrid className="h-5 w-5"/></div>
      <div className="text-base sm:text-lg font-semibold truncate max-w-[40vw]">Server Architecture Designer</div>
          </div>
          <Toolbar
            mode={mode}
            setMode={setMode}
            onSave={onSave}
            onLoad={onLoad}
            onExportPng={onExportPng}
            onExportJson={onExportJson}
            onImportJson={onImportJson}
            onPrintDiagram={onPrintDiagram}
            onEditJson={openJsonEditor}
            onClear={onClear}
            onUndo={undo}
            onRedo={redo}
            canUndo={historyRef.current.past.length>0}
            canRedo={historyRef.current.future.length>0}
            snapEnabled={snapEnabled}
            setSnapEnabled={setSnapEnabled}
            onSnapAll={onSnapAll}
          />
        </div>
        <JsonEditorDialog
          open={jsonEditorOpen}
          initialValue={jsonInitialPayload || { nodes, edges, groups, instanceGroups, globalAutoLayoutConfig } as any}
          onClose={()=>setJsonEditorOpen(false)}
          onApply={(p)=>{ applyJsonEditor(p); setJsonEditorOpen(false); }}
        />

        <div className="flex gap-4 p-2 sm:p-4 h-[calc(100vh-64px)] relative">
          {/* Left Panel */}
          {showLeftPanel ? (
            <div className="w-72 sm:w-80 flex-shrink-0 space-y-4 overflow-y-auto pr-1 hidden md:block">
              <PalettePanel 
                visible={true} 
                onClose={()=>setShowLeftPanel(false)} 
                onEntryDragStart={onEntryDragStart as any}
                globalAutoLayoutConfig={globalAutoLayoutConfig}
                onUpdateGlobalAutoLayoutConfig={onUpdateGlobalAutoLayoutConfig}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 flex items-start pt-2 hidden md:flex">
              <button 
                onClick={() => setShowLeftPanel(true)}
                className="text-xs px-2 py-1 rounded-md bg-white border shadow hover:shadow-md transition-shadow"
                title="Afficher le panneau"
              >
                ▶
              </button>
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 min-w-0 relative">
      <Card className="rounded-2xl h-full bg-white/80 dark:bg-slate-900/55 backdrop-blur border border-slate-200 dark:border-slate-700 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <CardContent className="h-full p-0">
        <div
          ref={reactFlowWrapper}
          onMouseDownCapture={onWrapperMouseDown}
          className={`h-full ${viewLocked ? "cursor-" + (isPanning ? "grabbing" : "grab") : ""} reactflow-surface dark:[&_.react-flow__attribution]:bg-transparent`}
        >
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={(changes)=>{
                      if (mode !== MODES.EDIT) return;
                      onNodesChange(changes);
                    }}
                    onEdgesChange={(changes)=>{ if (mode === MODES.EDIT) onEdgesChange(changes); }}
                    onConnect={(params)=>{ if (mode === MODES.EDIT) onConnect(params); }}
                    onDrop={onDrop as any}
                    onDragOver={onDragOver as any}
                    nodeTypes={nodeTypes as any}
                    edgeTypes={edgeTypes as any}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onEdgeDoubleClick={onEdgeDoubleClick}
                    onNodeDragStop={(e,n)=>{ onNodeDragStop(e,n); onNodeDragStopMulti(); }}
                    onNodeDragStart={(e,n)=>{ onNodeDragStart(e,n); onNodeDragStartMulti(e,n); }}
                    onNodeDrag={onNodeDrag}
                    connectionMode={ConnectionMode.Loose}
                    connectionLineType={ConnectionLineType.Straight}
                    minZoom={0.1}
                    maxZoom={3}
                    nodesDraggable={mode === MODES.EDIT}
                    nodesConnectable={mode === MODES.EDIT}
                    elementsSelectable={mode === MODES.EDIT}
                    selectNodesOnDrag={mode === MODES.EDIT}
                    panOnDrag={false}
                    selectionOnDrag
                    defaultEdgeOptions={{
                      type: 'default',
                      style: { strokeWidth: 2, stroke: '#64748b' },
                      markerEnd: { type: MarkerType.ArrowClosed }
                    }}
                    snapToGrid={snapEnabled}
                    snapGrid={[GRID, GRID]}
                    fitView
                    deleteKeyCode={[]}
                  >
                    <MiniMap pannable zoomable className="!rounded-xl !bg-white/80 dark:!bg-slate-800/65 !backdrop-blur !border border-slate-200/60 dark:!border-slate-600/60" nodeStrokeWidth={1} nodeColor={miniMapNodeColorFn} />
                    <Controls showInteractive={false} className="!rounded-xl" />
                    {mode === MODES.EDIT && (
                      <Background variant={BackgroundVariant.Lines} gap={24} color={isDark ? '#18222b' : '#e2e8f0'} size={1} />
                    )}
                    {/* Overlay for overlapping straight edges from shared endpoints */}
                    <EdgeOverlapOverlay segments={overlapSegments} />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          {showRightPanel ? (
            <div className="w-72 sm:w-80 flex-shrink-0 overflow-y-auto pl-1 hidden lg:block">
              <PropertiesPanel 
                selection={selection} 
                onChange={updateSelection} 
                onDelete={deleteSelection} 
                onClosePanel={() => setShowRightPanel(false)} 
                multiCount={nodes.filter(n=>n.selected).length + edges.filter(e=>e.selected).length} 
                onDeleteSelected={() => { setNodes(nds=>nds.filter(n=>!n.selected)); setEdges(eds=>eds.filter(e=>!e.selected)); setSelection(null); showFlash('Deleted selection'); }} 
                networks={networks}
                globalAutoLayoutConfig={globalAutoLayoutConfig}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 flex items-start pt-2 hidden lg:flex">
              <button 
                onClick={() => setShowRightPanel(true)}
                className="text-xs px-2 py-1 rounded-md bg-white border shadow hover:shadow-md transition-shadow"
                title="Afficher le panneau"
              >
                ◀
              </button>
            </div>
          )}
          {/* Mobile bottom dock (safe-area aware) */}
          <div className="md:hidden fixed left-0 right-0 z-[70] flex justify-center pointer-events-none select-none" style={{bottom: 'max(env(safe-area-inset-bottom,0px) + 8px, 8px)'}}>
            <div className="pointer-events-auto flex gap-2 px-3 py-1.5 rounded-full shadow-lg bg-slate-900/95 ring-1 ring-white/10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80 text-white text-[11px]">
              <button onClick={()=>setShowLeftPanel(s=>!s)} className="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 active:bg-slate-500 transition min-w-[70px]" aria-label="Palette">{showLeftPanel? 'Palette -' : 'Palette +'}</button>
              <button onClick={()=>setShowRightPanel(s=>!s)} className="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 active:bg-slate-500 transition min-w-[70px]" aria-label="Propriétés">{showRightPanel? 'Props -' : 'Props +'}</button>
            </div>
          </div>
          {/* Mobile overlays */}
          {showLeftPanel && (
            <div className="md:hidden absolute inset-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Palette</h2>
                <button onClick={()=>setShowLeftPanel(false)} className="text-xs px-2 py-1 rounded bg-slate-200">Fermer</button>
              </div>
              <div className="grid grid-cols-5 gap-2">{CATALOG.map(entry => (<div key={entry.id} draggable onDragStart={(e)=>onEntryDragStart(e as any, entry)} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 border text-[10px]"><img src={entry.icon} alt="" className="h-6 w-6 object-contain" /><span className="truncate w-full text-center">{entry.label}</span></div>))}</div>
            </div>
          )}
          {showRightPanel && (
            <div className="lg:hidden absolute inset-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Propriétés</h2>
                <button onClick={()=>setShowRightPanel(false)} className="text-xs px-2 py-1 rounded bg-slate-200">Fermer</button>
              </div>
              <PropertiesPanel 
                selection={selection} 
                onChange={updateSelection} 
                onDelete={deleteSelection} 
                onClosePanel={() => setShowRightPanel(false)} 
                multiCount={nodes.filter(n=>n.selected).length + edges.filter(e=>e.selected).length} 
                onDeleteSelected={() => { setNodes(nds=>nds.filter(n=>!n.selected)); setEdges(eds=>eds.filter(e=>!e.selected)); setSelection(null); showFlash('Deleted selection'); }} 
                networks={networks}
                globalAutoLayoutConfig={globalAutoLayoutConfig}
              />
            </div>
          )}
        </div>
      </TooltipProvider>
  </div>
  </ThemeProvider>
  );
}

// =============================
// App wrapper (single provider)
// =============================
export default function App() {
  // État pour les paramètres globaux d'auto-layout
  const [globalAutoLayoutConfig, setGlobalAutoLayoutConfig] = useState<AutoLayoutConfig>(() => {
    return { ...DEFAULT_GLOBAL_AUTO_LAYOUT, enabled: true }; // Force enabled: true pour les globales
  });

  // Wrapper pour s'assurer que enabled reste true dans les valeurs globales
  const updateGlobalAutoLayoutConfig = (config: AutoLayoutConfig) => {
    setGlobalAutoLayoutConfig({ ...config, enabled: true });
  };

  return (
    <AutoLayoutProvider
      globalConfig={globalAutoLayoutConfig}
      onUpdateGlobalConfig={updateGlobalAutoLayoutConfig}
    >
      <ReactFlowProvider>
        <div className="min-h-screen w-full">
          <DiagramCanvas 
            globalAutoLayoutConfig={globalAutoLayoutConfig}
            onUpdateGlobalAutoLayoutConfig={updateGlobalAutoLayoutConfig}
          />
        </div>
      </ReactFlowProvider>
    </AutoLayoutProvider>
  );
}
