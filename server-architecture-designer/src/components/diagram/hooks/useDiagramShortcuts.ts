"use client";
import { useEffect, useRef } from 'react';

export interface ClipboardPayload {
  nodes: any[];
  edges: any[];
}

export function useDiagramShortcuts(opts: {
  mode: string;
  MODES: Record<string, string>;
  undo: () => void;
  redo: () => void;
  onSave: () => void;
  selection: any | null;
  setSelection: (sel: any | null) => void;
  nodes: any[];
  edges: any[];
  setNodes: (updater: (nds: any[]) => any[]) => void;
  setEdges: (updater: (eds: any[]) => any[]) => void;
  collectDescendants: (rootIds: Set<string>) => Set<string>;
  showFlash: (msg: string) => void;
}) {
  const clipboardRef = useRef<ClipboardPayload | null>(null);

  useEffect(() => {
    const { mode, MODES, undo, redo, onSave, selection, setSelection, nodes, edges, setNodes, setEdges, collectDescendants, showFlash } = opts;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && key === 'z') { e.preventDefault(); undo(); return; }
      if (mod && (key === 'y' || (e.shiftKey && key === 'z'))) { e.preventDefault(); redo(); return; }
      if (mod && key === 'a') { e.preventDefault(); if (mode !== MODES.EDIT) return; setNodes(nds => nds.map(n => ({ ...n, selected: true }))); setEdges(eds => eds.map(ed => ({ ...ed, selected: true }) as any)); setSelection(null); return; }
      if (mod && key === 's') { e.preventDefault(); onSave(); return; }
      if (mod && key === 'c') { if (!selection || selection.type !== 'node') return; e.preventDefault(); const rootId = selection.id as string; const toCopy = collectDescendants(new Set([rootId])); const nodeSet = new Set(Array.from(toCopy)); const nodesToCopy = nodes.filter(n => nodeSet.has(n.id)); const edgesToCopy = edges.filter(ed => nodeSet.has(ed.source) && nodeSet.has(ed.target)); clipboardRef.current = { nodes: JSON.parse(JSON.stringify(nodesToCopy)), edges: JSON.parse(JSON.stringify(edgesToCopy)) }; showFlash('Copied'); return; }
      if (mod && key === 'v') { if (mode !== MODES.EDIT) return; if (!clipboardRef.current || !clipboardRef.current.nodes.length) return; e.preventDefault(); const OFFSET = 24; const idMap = new Map<string, string>(); const clonedNodes = clipboardRef.current.nodes.map(orig => { const newId = `${orig.id}-c${Math.random().toString(36).slice(2, 6)}`; idMap.set(orig.id, newId); return JSON.parse(JSON.stringify({ ...orig, id: newId })); }); const origIdSet = new Set(clipboardRef.current.nodes.map(n => n.id)); clonedNodes.forEach(n => { const [origId] = Array.from(idMap.entries()).find(([, v]) => v === n.id) || []; const orig = clipboardRef.current!.nodes.find(o => o.id === origId); if (!orig) return; if (orig.parentNode && idMap.has(orig.parentNode)) { n.parentNode = idMap.get(orig.parentNode); n.extent = 'parent'; } else { n.parentNode = orig.parentNode; n.extent = orig.parentNode ? 'parent' : undefined; } if (!orig.parentNode || !origIdSet.has(orig.parentNode)) { n.position = { x: (orig.position?.x || 0) + OFFSET, y: (orig.position?.y || 0) + OFFSET }; } if (n.type === 'network') { const netId = idMap.get(orig.id) || n.id; n.data = { ...(n.data || {}), netId }; } }); const netIdByNewNodeId = new Map(clonedNodes.filter(n => n.type === 'network').map(n => [n.id, n.data?.netId] as const)); clonedNodes.forEach(n => { const parentId = n.parentNode as string | undefined; const parent = parentId ? clonedNodes.find(c => c.id === parentId) : undefined; if (n.type === 'component' && !n.data?.isContainer && parent && parent.type === 'network') { const newNetId = netIdByNewNodeId.get(parent.id) || parent.id; const prevNetworks: string[] = Array.isArray(n.data?.networks) ? n.data.networks : []; const cleaned = prevNetworks.filter(id => id !== parent.data?.netId && id !== parent.id); n.data = { ...(n.data || {}), primaryNetwork: newNetId, networks: Array.from(new Set([...cleaned, newNetId])) }; } }); const clonedEdges = clipboardRef.current.edges.map(e => ({ ...e, id: `${e.id}-c${Math.random().toString(36).slice(2, 6)}`, source: idMap.get(e.source) || e.source, target: idMap.get(e.target) || e.target })).filter(e => clonedNodes.some(n => n.id === e.source) && clonedNodes.some(n => n.id === e.target)).map(e => { const next: any = { ...e }; if (next.data?.isNetworkLink && next.data?.networkId && idMap.has(next.data.networkId)) { next.data = { ...next.data, networkId: idMap.get(next.data.networkId) }; } return next; }); setNodes(nds => nds.concat(clonedNodes)); setEdges(eds => eds.concat(clonedEdges)); if (selection && selection.type === 'node' && idMap.has(selection.id)) { const newRootId = idMap.get(selection.id)!; setNodes(nds => nds.map(n => ({ ...n, selected: n.id === newRootId }))); setEdges(eds => eds.map(ed => ({ ...ed, selected: false }) as any)); setSelection({ ...selection, id: newRootId }); } showFlash('Pasted'); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opts]);

  return {} as const;
}
