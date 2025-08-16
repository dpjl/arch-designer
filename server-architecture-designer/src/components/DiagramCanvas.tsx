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
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Toolbar, PropertiesPanel, PalettePanel, ComponentNode, DoorNode, NetworkNode, MODES, GRID_SIZE, CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT, DEFAULT_DOOR_WIDTH, DEFAULT_DOOR_HEIGHT, HISTORY_STORAGE_KEY, SNAP_STORAGE_KEY, hexToRgba, autoTextColor, isAncestor } from './diagram';
import { ThemeProvider } from './theme/ThemeProvider';
import { useDiagramHistory } from './diagram/hooks/useDiagramHistory';
import { useDiagramSelection } from './diagram/hooks/useDiagramSelection';
import { applyZIndexHierarchy, enforceContainerSelectedZ, absolutePosition, headerOffsetFor as headerOffsetForUtil } from './diagram/layout-utils';
import { applyPatternToEdge } from './diagram/edge-utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Link2, Palette, Lock, Unlock, LayoutGrid, Boxes } from "lucide-react";
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
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
//         {entry.label}
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
// Responsive condensed toolbar pieces (mobile first)
const MobileMenu = memo(({
  mode, setMode, onSave, onLoad, onExportPng, onExportPdf, onExportJson, onImportJson, onClear, undo, redo, canUndo, canRedo, snapEnabled, setSnapEnabled, onSnapAll
}: any) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden relative">
      <button onClick={()=>setOpen(o=>!o)} aria-label="Menu" className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow">
        {open ? '×' : '≡'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 p-3 rounded-xl bg-white shadow-lg border space-y-2 z-50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Mode</span>
            <button onClick={()=>setMode(mode==='edit'?'view':'edit')} className="px-2 py-1 rounded bg-slate-800 text-white text-[11px]">{mode==='edit'?'View':'Edit'}</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button onClick={onSave} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Save</button>
            <button onClick={onLoad} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Load</button>
            <button onClick={onExportPng} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">PNG</button>
            <button onClick={onExportPdf} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">PDF</button>
            <button onClick={onExportJson} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">JSON</button>
            <button onClick={onImportJson} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Import</button>
            <button onClick={onClear} className="px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700">Clear</button>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <button disabled={!canUndo} onClick={undo} className="flex-1 px-2 py-1 rounded bg-slate-100 disabled:opacity-40">↺</button>
            <button disabled={!canRedo} onClick={redo} className="flex-1 px-2 py-1 rounded bg-slate-100 disabled:opacity-40">↻</button>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <label className="flex items-center gap-1"><input type="checkbox" checked={snapEnabled} onChange={(e)=>setSnapEnabled(e.target.checked)} />Snap</label>
            <button onClick={onSnapAll} className="px-2 py-1 rounded bg-slate-100">Snap All</button>
          </div>
        </div>
      )}
    </div>
  );
});

const ResponsiveTopBar = memo(({ title, ...rest }: any) => {
  return (
    <div className="h-14 sm:h-16 px-2 sm:px-4 border-b bg-white/80 backdrop-blur flex items-center justify-between sticky top-0 z-50 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow"><LayoutGrid className="h-5 w-5"/></div>
        <div className="font-semibold text-sm sm:text-base truncate max-w-[45vw] sm:max-w-xs" title={title}>{title}</div>
      </div>
      <div className="hidden md:flex">
        <Toolbar {...rest} />
      </div>
      <MobileMenu {...rest} />
    </div>
  );
});

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



// Runtime-generated PNG brick texture (small, tiled)
let __brickTexCache: { urlH: string; urlV: string; size: number; offX: number; offY: number; shiftTopY: number; shiftSideX: number } | null = null;
function getBrickTexture(): { urlH: string; urlV: string; size: number; offX: number; offY: number; shiftTopY: number; shiftSideX: number } {
  if (typeof document === 'undefined') return { urlH: '', urlV: '', size: 16, offX: 0, offY: 0, shiftTopY: 0, shiftSideX: 0 };
  if (__brickTexCache) return __brickTexCache;
  // Single-brick tile (repeats cleanly) with brown mortar background
  const size = 24; // tile size controls perceived brick size
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const gap = 4; // desired mortar gap between bricks
  const margin = gap / 2; // margin within tile so adjacent tiles form correct gap
  const brickW = size - margin * 2; // brick spans across with margins
  const brickH = Math.round(size * 0.5) - gap; // rectangular brick height
  const r = 0; // sharp corners
  const stroke = '#0f172a'; // dark outline
  const fill = '#ea580c'; // orange fill
  const mortarColor = '#000000'; // black mortar

  // mortar background
  ctx.fillStyle = mortarColor;
  ctx.fillRect(0, 0, size, size);

  // helper to draw rounded rect brick
  const brick = (x: number, y: number) => {
    ctx.beginPath();
    const x2 = x + brickW, y2 = y + brickH;
    if (r <= 0) {
      ctx.rect(x, y, brickW, brickH);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x2 - r, y); ctx.quadraticCurveTo(x2, y, x2, y + r);
      ctx.lineTo(x2, y2 - r); ctx.quadraticCurveTo(x2, y2, x2 - r, y2);
      ctx.lineTo(x + r, y2); ctx.quadraticCurveTo(x, y2, x, y2 - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke();
  };

  // Single centered brick; margins ensure correct gap when repeating
  const yOffset = Math.floor((size - brickH) / 2);
  brick(margin, yOffset);

  const urlH = canvas.toDataURL('image/png');
  // build vertical rotated tile
  const canvasV = document.createElement('canvas'); canvasV.width = size; canvasV.height = size;
  const ctxV = canvasV.getContext('2d')!; ctxV.imageSmoothingEnabled = false;
  ctxV.translate(size, 0); ctxV.rotate(Math.PI/2);
  ctxV.drawImage(canvas, 0, 0);
  const urlV = canvasV.toDataURL('image/png');
  // Precompute shifts to center bricks within ring thickness T=12px
  const T = 12;
  const brickCenterY = yOffset + brickH / 2;
  const brickCenterX = margin + brickW / 2;
  const shiftTopY = Math.round(-(brickCenterY - T / 2));
  const shiftSideX = Math.round(-(brickCenterX - T / 2));
  __brickTexCache = { urlH, urlV, size, offX: margin, offY: yOffset, shiftTopY, shiftSideX };
  return __brickTexCache;
}


// Door helpers (kept for placement logic only)
const CONTAINER_RING_THICKNESS = 14;
const CONTAINER_RING_GAP = 8;
function clamp(val:number, min:number, max:number){ return Math.max(min, Math.min(max, val)); }
function placeDoorOnSide(parent:any, side:'top'|'bottom'|'left'|'right', localPos:{x:number;y:number}, doorW:number, doorH:number, offsets?: { top?: number; bottom?: number; left?: number; right?: number }){
  const w = parent?.data?.width || 520; const h = parent?.data?.height || 320; let x=localPos.x,y=localPos.y; const ftTop=offsets?.top??0, ftBottom=offsets?.bottom??0, ftLeft=offsets?.left??0, ftRight=offsets?.right??0;
  switch(side){
    case 'top': y=-(CONTAINER_RING_GAP+CONTAINER_RING_THICKNESS/2)-doorH/2+ftTop; x=clamp(x,-doorW/2,w-doorW/2); break;
    case 'bottom': y=h-(CONTAINER_RING_GAP+CONTAINER_RING_THICKNESS/2)-doorH/2-ftBottom; x=clamp(x,-doorW/2,w-doorW/2); break;
    case 'left': x=-(CONTAINER_RING_GAP+CONTAINER_RING_THICKNESS/2)-doorW/2+ftLeft; y=clamp(y,-doorH/2,h-doorH/2); break;
    case 'right': x=w-(CONTAINER_RING_GAP+CONTAINER_RING_THICKNESS/2)-doorW/2-ftRight; y=clamp(y,-doorH/2,h-doorH/2); break;
  }
  return { side, position:{x,y} };
}
function snapDoorToNearestSide(parent: any, localPos: {x:number;y:number}, doorW: number, doorH: number, offsets?: { top?: number; bottom?: number; left?: number; right?: number }) {
  const w = parent?.data?.width || 520; const h = parent?.data?.height || 320; const dx = Math.min(localPos.x, w-localPos.x); const dy = Math.min(localPos.y, h-localPos.y); let side:'top'|'bottom'|'left'|'right'='top'; if(dy<=dx) side = (localPos.y < h/2)?'top':'bottom'; else side=(localPos.x < w/2)?'left':'right'; return placeDoorOnSide(parent, side, localPos, doorW, doorH, offsets);
}

// == Node Types Registry =====================================================
const nodeTypes = { component: ComponentNode, door: DoorNode, network: NetworkNode } as const;
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
function DiagramCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const { project } = useReactFlow();
  const [mode, setMode] = useState<typeof MODES[keyof typeof MODES]>(MODES.EDIT);
  // History (refactored using hook) - will be initialized after nodes/edges state
  const [historyFlash, setHistoryFlash] = useState<string | null>(null);
  const showFlash = useCallback((msg: string) => { setHistoryFlash(msg); setTimeout(() => setHistoryFlash(c => c === msg ? null : c), 900); }, []);

  // Load persisted history once
  useEffect(()=>{ try{ const raw= localStorage.getItem(HISTORY_STORAGE_KEY); if(raw){ const parsed=JSON.parse(raw); if(parsed?.present?.nodes){ historyRef.current=parsed; setNodes(parsed.present.nodes); setEdges(parsed.present.edges); lastCommitRef.current=Date.now(); } } } catch{} },[]);

  // Initial graph
  const initialNodes = useMemo(
    () => [
      { id: "traefik-1", type: "component", position: { x: 200, y: 40 }, data: { label: "Traefik", icon: CATALOG.find(c => c.id === "traefik")!.icon, color: CATALOG.find(c => c.id === "traefik")!.color, features: { auth1: true }, isContainer: false } },
      { id: "nextcloud-1", type: "component", position: { x: 80, y: 240 }, data: { label: "Nextcloud", icon: CATALOG.find(c => c.id === "nextcloud")!.icon, color: CATALOG.find(c => c.id === "nextcloud")!.color, features: { auth2: true }, isContainer: false } },
      { id: "ha-1", type: "component", position: { x: 360, y: 240 }, data: { label: "Home Assistant", icon: CATALOG.find(c => c.id === "homeassistant")!.icon, color: CATALOG.find(c => c.id === "homeassistant")!.color, features: { hourglass: true }, isContainer: false } },
      { id: "group-1", type: "component", position: { x: 580, y: 60 }, data: { label: "Home Lab Rack", color: "#475569", width: 520, height: 320, locked: false, isContainer: true, bgColor: '#ffffff', bgOpacity: 0.85 }, style: { width: 520, height: 320 } },
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
  const { historyRef, lastCommitRef, commitIfChanged, undo, redo } = useDiagramHistory(setNodes, setEdges, showFlash);
  useEffect(()=>{ (window as any).__showFlash = showFlash; },[showFlash]);
  const { selection, setSelection, selectNode } = useDiagramSelection({ setNodes, setEdges, showFlash, enableKeyboardDelete: true, getNodes: () => nodes, getEdges: () => edges });
  const [isDark, setIsDark] = useState(false);
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
  // Track changes
  useEffect(()=>{ commitIfChanged(nodes, edges); }, [nodes, edges, commitIfChanged]);
  useEffect(()=>{ const handler=(e:KeyboardEvent)=>{ if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){ e.preventDefault(); undo(); } else if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))){ e.preventDefault(); redo(); } }; window.addEventListener('keydown', handler); return ()=> window.removeEventListener('keydown', handler); },[undo,redo]);
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

  // Edge patterns CSS injection
  const EdgePatternStyles = () => (
    <style>{`
    .react-flow__edge.edge-dashed path { stroke-dasharray:6 6; }
    .react-flow__edge.edge-anim-dash path { stroke-dasharray:6 6; animation: edge-dash 1.2s linear infinite; }
    @keyframes edge-dash { to { stroke-dashoffset:-12; } }
      .container-sel:after { content:""; position:absolute; inset:0; border:2px dashed #3b82f6; border-radius:1rem; pointer-events:none; }

  /* Elevate edges above nodes (user request) */
  .react-flow__edges { z-index: 50 !important; }
  .react-flow__nodes { z-index: 10 !important; }
  /* Grid color now controlled via ReactFlow <Background color=> prop; CSS fallback kept minimal */
  .dark .react-flow__background { background: linear-gradient(to bottom, #0f172a, #020617); }
  /* Preserve node interactivity: edge paths keep pointer-events default (stroke) */

  /* Improved edge label styling */
  .react-flow__edge .react-flow__edge-textwrapper { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); }
  .react-flow__edge .react-flow__edge-textbg { fill: rgba(255,255,255,0.9); stroke: rgba(148,163,184,0.6); stroke-width:1; rx:6; ry:6; }
  .react-flow__edge text.react-flow__edge-text { font-family: system-ui, Inter, sans-serif; font-size:11px; font-weight:600; letter-spacing:0.25px; fill:#334155; }
  .react-flow__edge:hover text.react-flow__edge-text { fill:#0f172a; }
  .react-flow__edge.selected text.react-flow__edge-text { fill:#1e3a8a; }
  .dark .react-flow__edge .react-flow__edge-textbg { fill: rgba(15,23,42,0.72); stroke: rgba(100,116,139,0.35); }
  .dark .react-flow__edge text.react-flow__edge-text { fill:#cbd5e1; }
  .dark .react-flow__edge:hover text.react-flow__edge-text { fill:#e2e8f0; }
  .dark .react-flow__edge.selected text.react-flow__edge-text { fill:#3b82f6; }

      /* Firewall ring uses a tiled PNG brick texture set via CSS var --fwtex */
  .firewall-ring { position:absolute; inset:-8px; border-radius:1.35rem; pointer-events:none; z-index:1; }
      .firewall-ring .fw-top, .firewall-ring .fw-bottom, .firewall-ring .fw-left, .firewall-ring .fw-right {
        position:absolute; background-repeat:repeat; background-size: var(--fwtexSize, 16px 16px);
      }
      .firewall-ring .fw-badge {
        position:absolute; top:-18px; left:-18px; height:40px; width:40px; border-radius:9999px;
        display:flex; align-items:center; justify-content:center; font-size:18px; line-height:1;
        background:#fff7ed; color:#111827; border:2px solid #0f172a;
        box-shadow:0 3px 8px rgba(0,0,0,0.3);
        pointer-events:none; backdrop-filter: blur(2px);
      }
      .dark .firewall-ring .fw-badge { background:rgba(251,146,60,0.18); color:#fcd9b6; border:2px solid #f59e0b; box-shadow:0 0 0 1px rgba(255,255,255,0.04), 0 4px 10px -2px rgba(0,0,0,0.6); }
  /* Inner gap from element border + centered bricks within ring */
  .firewall-ring .fw-top { top: calc(var(--ringGapInner, 2px) * -1); left:0; right:0; height: var(--ringThickness, 8px); border-top-left-radius:1.35rem; border-top-right-radius:1.35rem; background-image: var(--fwtexH); background-position: var(--fwtexOffX, 0) calc(var(--fwShiftTopY, 0)); }
  .firewall-ring .fw-bottom { bottom: calc(var(--ringGapInner, 2px) * -1); left:0; right:0; height: var(--ringThickness, 8px); border-bottom-left-radius:1.35rem; border-bottom-right-radius:1.35rem; background-image: var(--fwtexH); background-position: var(--fwtexOffX, 0) calc(var(--fwShiftTopY, 0)); }
  .firewall-ring .fw-left { top:0; bottom:0; left: calc(var(--ringGapInner, 2px) * -1); width: var(--ringThickness, 8px); border-top-left-radius:1.35rem; border-bottom-left-radius:1.35rem; background-image: var(--fwtexV); background-position: calc(var(--fwShiftSideX, 0)) var(--fwtexOffX, 0); }
  .firewall-ring .fw-right { top:0; bottom:0; right: calc(var(--ringGapInner, 2px) * -1); width: var(--ringThickness, 8px); border-top-right-radius:1.35rem; border-bottom-right-radius:1.35rem; background-image: var(--fwtexV); background-position: calc(var(--fwShiftSideX, 0)) var(--fwtexOffX, 0); }
  /* Larger handles for easier connecting */
  .react-flow__handle.handle-lg { width: 16px; height: 16px; border: 2px solid #ffffff; box-shadow: 0 0 0 3px rgba(59,130,246,0.35); }
  .react-flow__handle.handle-lg:hover { box-shadow: 0 0 0 4px rgba(59,130,246,0.55); }
    `}</style>
  );

  // Stable edge addition + auto color + pattern baseline
  const addDefaultEdge = useCallback((params: any) => {
    setEdges((eds) => {
      const data = { shape: 'smooth', pattern: 'solid' };
      let e: any = { ...params, type: 'smoothstep', data, markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 2, stroke: '#64748b' } };
      e = applyPatternToEdge(e);
      return addEdge(e, eds);
    });
  }, [setEdges, applyPatternToEdge]);

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

  // DnD handlers
  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const bounds = reactFlowWrapper.current!.getBoundingClientRect();
    const id = (event.dataTransfer as DataTransfer).getData("application/x-id");
    const label = (event.dataTransfer as DataTransfer).getData("application/x-label");
    const icon = (event.dataTransfer as DataTransfer).getData("application/x-icon");
    const color = (event.dataTransfer as DataTransfer).getData("application/x-color");
  const local = { x: (event as any).clientX - bounds.left, y: (event as any).clientY - bounds.top };
  const absPos = project(local);

    if (id === "group") {
      const containerId = `group-${Math.random().toString(36).slice(2, 8)}`;
      const width = 520, height = 320;
  const newNode = { id: containerId, type: "component", position: absPos, data: { idInternal: containerId, label: "Container", color: "#475569", width, height, locked: false, isContainer: true, bgColor:'#ffffff', bgOpacity:0.85 }, style: { width, height } };
      setNodes((nds) => nds.concat(newNode));
      return;
    }

  if (id === 'door') {
      const parent = findContainerAt(absPos);
      const parentAbs = parent ? absoluteOf(parent) : null;
      const header = parent ? headerOffsetFor(parent) : 0;
      let position = parent ? { x: absPos.x - parentAbs!.x, y: absPos.y - parentAbs!.y - header } : absPos;
      const nid = `door-${Math.random().toString(36).slice(2, 8)}`;
      let data:any = { idInternal: nid, isDoor: true, label: 'Door', allow: 'HTTPS', width: DEFAULT_DOOR_WIDTH };
      if (parent) {
        const snapped = snapDoorToNearestSide(parent, position, DEFAULT_DOOR_WIDTH, DEFAULT_DOOR_HEIGHT, data?.offsets);
        position = snapped.position;
        data.side = snapped.side;
      }
      const newDoor = { id: nid, type: 'door', position, data, parentNode: (parent as any)?.id, extent: parent ? ('parent' as const) : undefined } as any;
      setNodes((nds) => nds.concat(newDoor));
      return;
    }
    const parent = findContainerAt(absPos);
    if (id === 'network') {
      const nid = `net-${Math.random().toString(36).slice(2, 8)}`;
      // Forbid nesting a network inside another network
      if (parent && parent.type === 'network') {
        // drop at root absolute position
        const newNode = { id: nid, type: 'network', position: absPos, data: { netId: nid, label: label || 'Network', color: color || '#10b981', width: 420, height: 240 } } as any;
        setNodes((nds) => nds.concat(newNode));
        return;
      }
      const newNode = { id: nid, type: 'network', position: absPos, data: { netId: nid, label: label || 'Network', color: color || '#10b981', width: 420, height: 240 } } as any;
      setNodes((nds) => nds.concat(newNode));
      return;
    }
  const headerOffset = parent ? headerOffsetFor(parent) : 0;
  const parentAbs = parent ? absoluteOf(parent) : null;
  const position = parent ? { x: absPos.x - parentAbs!.x, y: absPos.y - parentAbs!.y - headerOffset } : absPos;
    const nid = `${id}-${Math.random().toString(36).slice(2, 8)}`;
    const data: any = { idInternal: nid, label, icon, color, features: {}, isContainer: false };
    if (parent && parent.type==='network') {
      data.primaryNetwork = parent.data?.netId || parent.id;
      data.networks = Array.isArray(data.networks) ? Array.from(new Set([...(data.networks||[]), data.primaryNetwork])) : [data.primaryNetwork];
    }
    const newNode = { id: nid, type: "component", position, data, parentNode: (parent as any)?.id, extent: parent ? ("parent" as const) : undefined };
    setNodes((nds) => nds.concat([newNode]));
  }, [setNodes, findContainerAt]);

  const onDragOver = useCallback((event: DragEvent) => { event.preventDefault(); (event.dataTransfer as DataTransfer).dropEffect = "move"; }, []);

  const onNodeDragStop = useCallback((_: any, node: any) => {
    // Re-parent both services and containers, but avoid cycles
  const parentNode = node.parentNode ? nodes.find((n) => n.id === node.parentNode) : null;
  const parentAbs = parentNode ? absoluteOf(parentNode) : { x: 0, y: 0 };
  const absPos = { x: node.position.x + parentAbs.x, y: node.position.y + parentAbs.y + (parentNode ? headerOffsetFor(parentNode) : 0) };
  const container = findContainerAt(absPos, node.id);

    setNodes((nds) => nds.map((n) => {
      if (n.id !== node.id) return n;
      // Snap doors to walls and restrict movement along the wall
    if (n.type === 'door') {
        if (container) {
          const scale = Math.max(0.6, Math.min(2, (n.data?.scale ?? 1)));
          const doorW = Math.round((n.data?.width || DEFAULT_DOOR_WIDTH) * scale);
          const doorH = Math.round(DEFAULT_DOOR_HEIGHT * scale);
          const containerAbs = absoluteOf(container);
          const snapped = snapDoorToNearestSide(container, { x: absPos.x - containerAbs.x, y: absPos.y - containerAbs.y - headerOffsetFor(container) }, doorW, doorH, n.data?.offsets);
      return { ...n, parentNode: container.id, extent: 'parent', position: snapped.position, data: { ...(n.data||{}), side: snapped.side } };
        }
        // door outside container: keep free
        return n;
      }
      if (container) {
        // Already inside same container: no recompute (prevents cumulative shift)
        if (n.parentNode === container.id) return n;
        if (container.data?.locked) return n; // locked target
        // forbid network nesting into another network
        if (n.type==='network' && container.type==='network') return n;
        const headerOffset = headerOffsetFor(container);
        const containerAbs = absoluteOf(container);
        const next: any = {
          ...n,
          parentNode: container.id,
          extent: "parent",
          position: { x: absPos.x - containerAbs.x, y: absPos.y - containerAbs.y - headerOffset },
        };
        if (n.type==='component' && !n.data?.isContainer && container.type==='network') {
          const netId = container.data?.netId || container.id;
          const prev = Array.isArray(n.data?.networks) ? n.data.networks : [];
          next.data = { ...(n.data||{}), primaryNetwork: netId, networks: Array.from(new Set([...prev, netId])) };
        }
        return next;
      }
      // Leaving container only if it had one
      if (n.parentNode) return { ...n, parentNode: undefined, extent: undefined };
      return n;
    }));
  }, [findContainerAt, nodes, setNodes]);

  // Selection / connect
  const onNodeClick = useCallback((evt: any, node: any) => {
    if (mode === MODES.EDIT) selectNode(node);
  }, [mode, selectNode]);

  const onEdgeClick = useCallback((_: any, edge: any) => { if (mode === MODES.EDIT) setSelection({ ...edge, type: "edge" }); }, [mode]);

  const updateSelection = useCallback((patch: any) => {
    if (!selection) return;
    if (selection.type === 'node') {
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
      // apply patch
      setNodes((nds) => nds.map((n) => (n.id === selection.id ? { ...n, ...patch, data: { ...n.data, ...(patch.data || {}) }, draggable: patch?.data?.locked !== undefined ? !patch.data.locked : n.draggable } : n)));
      setSelection((s: any) => ({ ...s, ...patch, data: { ...s.data, ...(patch.data || {}) } }));
      // optional: resnap door immediately when offsets change
      if (patch?.resnapDoor) {
        setNodes((nds) => nds.map((n) => {
          if (n.id !== selection.id || n.type !== 'door' || !n.parentNode) return n;
          const parent = nds.find(p => p.id === n.parentNode);
          if (!parent) return n;
          const scale = Math.max(0.6, Math.min(2, (n.data?.scale ?? 1)));
          const doorW = Math.round((n.data?.width || DEFAULT_DOOR_WIDTH) * scale);
          const doorH = Math.round(DEFAULT_DOOR_HEIGHT * scale);
          const snapped = snapDoorToNearestSide(parent, n.position, doorW, doorH, n.data?.offsets);
          return { ...n, position: snapped.position, data: { ...(n.data||{}), side: snapped.side } };
        }));
        setSelection((s:any) => {
          if (!s || s.type !== 'node' || s.id !== selection.id || !s.parentNode) return s;
          const parent = nodes.find(n => n.id === s.parentNode);
          if (!parent) return s;
          const scale = Math.max(0.6, Math.min(2, (s.data?.scale ?? 1)));
          const doorW = Math.round((s.data?.width || DEFAULT_DOOR_WIDTH) * scale);
          const doorH = Math.round(DEFAULT_DOOR_HEIGHT * scale);
          const snapped = snapDoorToNearestSide(parent, s.position, doorW, doorH, s.data?.offsets);
          return { ...s, position: snapped.position, data: { ...(s.data||{}), side: snapped.side } };
        });
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

  const onNodeDoubleClick = useCallback((_: any, node: any) => { if (mode !== MODES.EDIT) return; const label = prompt("Label", node.data?.label || ""); if (label !== null) setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label } } : n))); }, [mode]);
  const onEdgeDoubleClick = useCallback((_: any, edge: any) => { if (mode !== MODES.EDIT) return; const label = prompt("Label", edge.label || ""); if (label !== null) setEdges((eds) => eds.map((e) => (e.id === edge.id ? { ...e, label } : e))); }, [mode]);

  // Persistence
  const onSave = useCallback(() => { localStorage.setItem("server-arch:nodes", JSON.stringify(nodes)); localStorage.setItem("server-arch:edges", JSON.stringify(edges)); }, [nodes, edges]);
  const onLoad = useCallback(() => { const n = JSON.parse(localStorage.getItem("server-arch:nodes") || "null"); const e = JSON.parse(localStorage.getItem("server-arch:edges") || "null"); if (n && e) { setNodes(n); setEdges(e); setSelection(null); } }, [setNodes, setEdges]);
  const onClear = useCallback(() => { setNodes([]); setEdges([]); setSelection(null); historyRef.current = { past: [], present: { nodes: [], edges: [] }, future: [] }; lastCommitRef.current = Date.now(); try { localStorage.removeItem(HISTORY_STORAGE_KEY); } catch(_){} showFlash('Cleared'); }, [showFlash]);

  // Export
  const onExportPng = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    const node = reactFlowWrapper.current.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!node) return;
    const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "white" });
    const link = document.createElement("a");
    link.download = `architecture-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const onExportPdf = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    const node = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!node) return;
    try {
      const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' });
      const img = new Image();
      img.onload = () => {
        const pxWidth = img.width, pxHeight = img.height;
        const landscape = pxWidth > pxHeight;
        const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
        const pageSize = doc.internal.pageSize;
        const pageW = pageSize.getWidth();
        const pageH = pageSize.getHeight();
        const margin = 10; const availW = pageW - margin*2; const availH = pageH - margin*2;
        const scale = Math.min(availW / pxWidth, availH / pxHeight);
        const renderW = pxWidth * scale; const renderH = pxHeight * scale;
        const offX = (pageW - renderW)/2; const offY = (pageH - renderH)/2;
        doc.addImage(dataUrl, 'PNG', offX, offY, renderW, renderH);
        doc.save(`architecture-${Date.now()}.pdf`);
      };
      img.src = dataUrl;
    } catch (e) { console.error(e); }
  }, []);

  // Export graph as JSON file (nodes + edges)
  const onExportJson = useCallback(() => {
    const payload = { nodes, edges };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Import nodes+edges JSON from file
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
        if (!n || !e) throw new Error('Invalid JSON: expected { nodes:[], edges:[] }');
        setNodes(n);
        setEdges(e);
        setSelection(null);
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
  }, [setNodes, setEdges, setSelection]);

  // Drag from palette
  const onEntryDragStart = (event: DragEvent, entry: any) => {
    (event.dataTransfer as DataTransfer).setData("application/x-id", entry.id);
    (event.dataTransfer as DataTransfer).setData("application/x-label", entry.label);
    (event.dataTransfer as DataTransfer).setData("application/x-icon", entry.icon);
    (event.dataTransfer as DataTransfer).setData("application/x-color", entry.color);
    (event.dataTransfer as DataTransfer).effectAllowed = "move";
  };

  const onNodeDragStart = useCallback((evt: any, node: any) => {
  if (document.body.classList.contains('resizing-container')) { evt.stopImmediatePropagation?.(); evt.stopPropagation(); return false; }
    if (evt?.altKey && node.parentNode) {
      setNodes((nds) => nds.map((n) => {
        if (n.id !== node.id) return n;
        if (!n.parentNode) return n;
        let x = n.position.x; let y = n.position.y; let cur = nds.find(p => p.id === n.parentNode) as any | undefined; let guard=0;
        while (cur && guard++<100) { x += cur.position.x; y += cur.position.y + (cur.type==='network'?NETWORK_HEADER_HEIGHT:(cur.data?.isContainer?CONTAINER_HEADER_HEIGHT:0)); cur = cur.parentNode ? nds.find(p=>p.id===cur.parentNode) : undefined; }
        return { ...n, parentNode: undefined, extent: undefined, position: { x, y } };
      }));
      setSelection((s: any) => (s && s.id === node.id ? { ...s, parentNode: undefined, extent: undefined } : s));
    }
  }, [setNodes]);
  // Multi-drag state and handlers
  const dragBundleRef = useRef<{ baseId: string; parentId?: string | null; start: Record<string, { x: number; y: number }> } | null>(null);

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
  const onNodeDragStartMulti = useCallback((_: any, node: any) => {
    const selIds = nodes.filter(n => n.selected).map(n => n.id);
    const ids = selIds.length ? selIds : [node.id];
    const parentId = node.parentNode ?? null;
    const subset = nodes.filter(n => ids.includes(n.id) && (n.parentNode ?? null) === parentId);
    const start: Record<string, { x: number; y: number }> = {};
    subset.forEach(n => { start[n.id] = { x: n.position.x, y: n.position.y }; });
    dragBundleRef.current = { baseId: node.id, parentId, start };
  }, [nodes]);
  const onNodeDrag = useCallback((_: any, node: any) => {
    const ref = dragBundleRef.current; if (!ref) return;
    const baseStart = ref.start[node.id]; if (!baseStart) return;
    const dx = node.position.x - baseStart.x; const dy = node.position.y - baseStart.y;
    if (dx === 0 && dy === 0) return;
    setNodes((nds) => nds.map(n => {
      if (!ref.start[n.id]) return n; // only move captured ones
      if (n.id === node.id) return n; // let React Flow manage dragged node
      return { ...n, position: { x: ref.start[n.id].x + dx, y: ref.start[n.id].y + dy } };
    }));
  }, [setNodes]);
  const onNodeDragStopMulti = useCallback(() => { dragBundleRef.current = null; }, []);

  const viewLocked = mode === MODES.VIEW;
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('server-arch:snap') === '1'; } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem('server-arch:snap', snapEnabled ? '1' : '0'); } catch {} }, [snapEnabled]);

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
      <EdgePatternStyles />
      <TooltipProvider>
        {historyFlash && (
          <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-[200]">
            <div className="px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs shadow backdrop-blur-sm animate-fade-in">
              {historyFlash}
              <PropertiesPanel selection={selection} onChange={updateSelection} onDelete={deleteSelection} onClosePanel={() => setShowRightPanel(false)} multiCount={nodes.filter(n=>n.selected).length + edges.filter(e=>e.selected).length} onDeleteSelected={() => { const ids = nodes.filter(n=>n.selected).map(n=>n.id); (window as any).__deleteNodesCascade?.(ids); setEdges(eds=>eds.filter(e=>!ids.includes(e.source) && !ids.includes(e.target))); setSelection(null); showFlash('Deleted selection'); }} networks={networks} />
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
            onExportPdf={onExportPdf}
            onExportJson={onExportJson}
            onImportJson={onImportJson}
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

        <div className="flex gap-4 p-2 sm:p-4 h-[calc(100vh-64px)] relative">
          {/* Left Panel */}
          {showLeftPanel ? (
            <div className="w-72 sm:w-80 flex-shrink-0 space-y-4 overflow-y-auto pr-1 hidden md:block">
              <PalettePanel visible={true} onClose={()=>setShowLeftPanel(false)} onEntryDragStart={onEntryDragStart as any} />
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
        <div ref={reactFlowWrapper} className={`h-full ${viewLocked ? "pointer-events-auto" : ""} reactflow-surface dark:[&_.react-flow__attribution]:bg-transparent`}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop as any}
                    onDragOver={onDragOver as any}
                    nodeTypes={nodeTypes as any}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onEdgeDoubleClick={onEdgeDoubleClick}
                    onNodeDragStop={(e,n)=>{ onNodeDragStop(e,n); onNodeDragStopMulti(); }}
                    onNodeDragStart={(e,n)=>{ onNodeDragStart(e,n); onNodeDragStartMulti(e,n); }}
                    onNodeDrag={onNodeDrag}
                    connectionMode={ConnectionMode.Loose}
                    snapToGrid={snapEnabled}
                    snapGrid={[GRID, GRID]}
                    elementsSelectable
                    selectNodesOnDrag
                    fitView
                  >
                    <MiniMap pannable zoomable className="!rounded-xl !bg-white/80 dark:!bg-slate-800/65 !backdrop-blur !border border-slate-200/60 dark:!border-slate-600/60" nodeStrokeWidth={1} nodeColor={miniMapNodeColorFn} />
                    <Controls showInteractive={false} className="!rounded-xl" />
                    <Background variant={BackgroundVariant.Lines} gap={24} color={isDark ? '#18222b' : '#e2e8f0'} size={1} />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          {showRightPanel ? (
            <div className="w-72 sm:w-80 flex-shrink-0 overflow-y-auto pl-1 hidden lg:block">
              <PropertiesPanel selection={selection} onChange={updateSelection} onDelete={deleteSelection} onClosePanel={() => setShowRightPanel(false)} multiCount={nodes.filter(n=>n.selected).length + edges.filter(e=>e.selected).length} onDeleteSelected={() => { setNodes(nds=>nds.filter(n=>!n.selected)); setEdges(eds=>eds.filter(e=>!e.selected)); setSelection(null); showFlash('Deleted selection'); }} networks={networks} />
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
              <PropertiesPanel selection={selection} onChange={updateSelection} onDelete={deleteSelection} onClosePanel={() => setShowRightPanel(false)} multiCount={nodes.filter(n=>n.selected).length + edges.filter(e=>e.selected).length} onDeleteSelected={() => { setNodes(nds=>nds.filter(n=>!n.selected)); setEdges(eds=>eds.filter(e=>!e.selected)); setSelection(null); showFlash('Deleted selection'); }} networks={networks} />
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
  return (
    <ReactFlowProvider>
      <div className="min-h-screen w-full">
        <DiagramCanvas />
      </div>
    </ReactFlowProvider>
  );
}
