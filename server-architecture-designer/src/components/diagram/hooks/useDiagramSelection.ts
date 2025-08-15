import { useCallback, useEffect, useState } from 'react';

interface UseDiagramSelectionArgs {
  setNodes: any;
  setEdges: any;
  showFlash: (m:string)=>void;
  enableKeyboardDelete?: boolean;
  getNodes?: () => any[]; // for multi-selection deletion & cascade
  getEdges?: () => any[];
}

export function useDiagramSelection({ setNodes, setEdges, showFlash, enableKeyboardDelete = false, getNodes, getEdges }: UseDiagramSelectionArgs) {
  const [selection, setSelection] = useState<any>(null);

  const selectNode = useCallback((node: any) => {
    if (!node) return; setSelection({ ...node, type: 'node', nodeType: node.type, position: { ...node.position } });
  }, []);

  const selectEdge = useCallback((edge: any) => { if (!edge) return; setSelection({ ...edge, type: 'edge' }); }, []);
  const clearSelection = useCallback(() => setSelection(null), []);

  useEffect(() => {
    if (!enableKeyboardDelete) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) return;
      const nodes = getNodes?.() || [];
      const edges = getEdges?.() || [];
      const multiSelected = nodes.some(n=>n.selected) || edges.some(ed=>ed.selected);
      if (!selection && !multiSelected) return;
      e.preventDefault();
      const cascadeDelete = (rootIds: string[]) => {
        const allNodes = nodes;
        const rootSet = new Set(rootIds);
        const toDelete = new Set(rootIds);
        let changed = true; let guard=0;
        while (changed && guard++ < 1000) {
          changed = false;
          allNodes.forEach(n => { if (n.parentNode && toDelete.has(n.parentNode) && !toDelete.has(n.id)) { toDelete.add(n.id); changed = true; } });
        }
        // networks membership cleanup
        const netIdsToRemove = new Set<string>();
        allNodes.forEach(n => { if (toDelete.has(n.id) && n.type==='network') netIdsToRemove.add(n.data?.netId || n.id); });
        setNodes((nds:any[])=> nds.filter(n=>!toDelete.has(n.id)).map(n=>{
          if (!netIdsToRemove.size) return n;
          if (n.type!=='component' || n.data?.isContainer) return n;
            const cur:string[] = Array.isArray(n.data?.networks)? n.data.networks : [];
            const next = cur.filter(id=>!netIdsToRemove.has(id));
            if (next.length===cur.length) return n;
            const nextData:any = { ...n.data, networks: next };
            if (n.data?.primaryNetwork && netIdsToRemove.has(n.data.primaryNetwork)) delete nextData.primaryNetwork;
            return { ...n, data: nextData };
        }));
        setEdges((eds:any[])=> eds.filter(e=>!toDelete.has(e.source) && !toDelete.has(e.target)));
      };

      if (multiSelected) {
        const nodeIds = nodes.filter(n=>n.selected).map(n=>n.id);
        if (nodeIds.length) cascadeDelete(nodeIds);
        const edgeIds = edges.filter(ed=>ed.selected).map(ed=>ed.id);
        if (edgeIds.length) setEdges((eds:any[])=>eds.filter(e=>!edgeIds.includes(e.id)));
        showFlash('Deleted selection');
        setSelection(null);
        return;
      }
      if (selection?.type === 'node') {
        cascadeDelete([selection.id]);
        showFlash('Node deleted');
      } else if (selection?.type === 'edge') {
        setEdges((eds:any[])=>eds.filter(e=>e.id!==selection.id));
        showFlash('Edge deleted');
      }
      setSelection(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selection, setNodes, setEdges, showFlash, enableKeyboardDelete, getNodes, getEdges]);

  return { selection, setSelection, selectNode, selectEdge, clearSelection };
}
