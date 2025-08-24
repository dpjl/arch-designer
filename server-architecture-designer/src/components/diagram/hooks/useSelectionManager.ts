import { useCallback } from 'react';
import { EDGE_COLOR_MODE, colorForEdge, applyPatternToEdge } from '../utils/edgeStyles';

export function useSelectionManager(nodes: any[], edgeColorMode: string, setNodes: any, setEdges: any, setSelection: any, applyPattern = applyPatternToEdge) {
  return useCallback((selection: any, patch: any) => {
    if (!selection) return;
    if (selection.type === 'node') {
      if (patch.detachFromParent) {
        setNodes((nds: any[]) => nds.map((n) => {
          if (n.id !== selection.id) return n;
          if (!n.parentNode) return n;
          const parent = nds.find(p => p.id === n.parentNode);
          if (!parent) return { ...n, parentNode: undefined, extent: undefined };
          return { ...n, parentNode: undefined, extent: undefined, position: { x: n.position.x + parent.position.x, y: n.position.y + parent.position.y } };
        }));
        setSelection((s: any) => ({ ...s, parentNode: undefined, extent: undefined }));
        return;
      }
  setNodes((nds: any[]) => nds.map((n) => (n.id === selection.id ? { ...n, ...patch, data: { ...n.data, ...(patch.data || {}) } } : n)));
      setSelection((s: any) => ({ ...s, ...patch, data: { ...s.data, ...(patch.data || {}) } }));
      if (patch?.data?.color && edgeColorMode === EDGE_COLOR_MODE.BY_SOURCE) {
        setEdges((eds: any[]) => eds.map((e) => e.source === selection.id ? { ...e, style: { ...(e.style || {}), stroke: patch.data.color } } : e));
      }
    } else { // edge
      setEdges((eds: any[]) => eds.map((e) => {
        if (e.id !== selection.id) return e;
        let next: any = { ...e, ...patch };
        if (patch.data) next.data = { ...(e.data||{}), ...patch.data };
        if (patch.data?.shape) {
          const shape = patch.data.shape; const map:Record<string,string>={smooth:'smoothstep',straight:'default',step:'step'}; next.type = map[shape]||'smoothstep';
        }
        if (patch.style) next.style = { ...(e.style||{}), ...(patch.style||{}) };
        next = applyPattern(next);
        return next;
      }));
      setSelection((s: any) => ({ ...s, ...patch, data: { ...(s.data||{}), ...(patch.data||{}) }, style: { ...(s.style||{}), ...(patch.style||{}) } }));
      if (patch?.label && edgeColorMode === EDGE_COLOR_MODE.BY_TYPE) {
        setEdges((eds: any[]) => eds.map((e) => e.id === selection.id ? applyPattern({ ...e, style: { ...(e.style || {}), stroke: colorForEdge({ ...e, label: patch.label }, nodes, edgeColorMode) } }) : e));
      }
    }
  }, [nodes, edgeColorMode, setNodes, setEdges, setSelection, applyPattern]);
}
