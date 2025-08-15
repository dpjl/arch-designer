import { useCallback, useEffect, useState } from 'react';

interface UseDiagramSelectionArgs {
  setNodes: any;
  setEdges: any;
  showFlash: (m:string)=>void;
  enableKeyboardDelete?: boolean;
  getNodes?: () => any[]; // for multi-selection deletion
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
      if (multiSelected) {
        const selectedNodeIds = nodes.filter(n=>n.selected).map(n=>n.id);
        if (selectedNodeIds.length) {
          setNodes((nds:any[])=>nds.filter(n=>!selectedNodeIds.includes(n.id)));
          setEdges((eds:any[])=>eds.filter(e=>!selectedNodeIds.includes(e.source)&&!selectedNodeIds.includes(e.target)));
        }
        const selectedEdgeIds = edges.filter(ed=>ed.selected).map(ed=>ed.id);
        if (selectedEdgeIds.length) setEdges((eds:any[])=>eds.filter(e=>!selectedEdgeIds.includes(e.id)));
        showFlash('Deleted selection');
        setSelection(null);
        return;
      }
      if (selection?.type === 'node') {
        setNodes((nds: any[]) => nds.filter(n => n.id !== selection.id));
        setEdges((eds: any[]) => eds.filter(e => e.source !== selection.id && e.target !== selection.id));
        showFlash('Node deleted');
      } else if (selection?.type === 'edge') {
        setEdges((eds: any[]) => eds.filter(e => e.id !== selection.id));
        showFlash('Edge deleted');
      }
      setSelection(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selection, setNodes, setEdges, showFlash, enableKeyboardDelete, getNodes, getEdges]);

  return { selection, setSelection, selectNode, selectEdge, clearSelection };
}
