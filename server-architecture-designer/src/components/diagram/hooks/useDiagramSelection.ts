import { useCallback, useEffect, useState } from 'react';

interface UseDiagramSelectionArgs {
  setNodes: any;
  setEdges: any;
  showFlash: (m:string)=>void;
  enableKeyboardDelete?: boolean;
}

export function useDiagramSelection({ setNodes, setEdges, showFlash, enableKeyboardDelete = false }: UseDiagramSelectionArgs) {
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
      if (!selection) return; e.preventDefault();
      if (selection.type === 'node') {
        setNodes((nds: any[]) => nds.filter(n => n.id !== selection.id));
        setEdges((eds: any[]) => eds.filter(e => e.source !== selection.id && e.target !== selection.id));
        showFlash('Node deleted');
      } else if (selection.type === 'edge') {
        setEdges((eds: any[]) => eds.filter(e => e.id !== selection.id));
        showFlash('Edge deleted');
      }
      setSelection(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selection, setNodes, setEdges, showFlash, enableKeyboardDelete]);

  return { selection, setSelection, selectNode, selectEdge, clearSelection };
}
