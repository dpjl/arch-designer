import { CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT } from './constants';

export function headerOffsetFor(node: any): number {
  if (!node) return 0;
  if (node.type === 'network') return NETWORK_HEADER_HEIGHT;
  if (node.data?.isContainer) return CONTAINER_HEADER_HEIGHT;
  return 0;
}

export function absolutePosition(node: any, nodes: any[]): { x: number; y: number } {
  if (!node) return { x: 0, y: 0 };
  let x = node.position.x; let y = node.position.y; let cur = node.parentNode ? nodes.find(n=>n.id===node.parentNode) : null; let guard=0;
  while (cur && guard++ < 100) {
    x += cur.position.x;
    y += cur.position.y + headerOffsetFor(cur);
    cur = cur.parentNode ? nodes.find(n=>n.id===cur.parentNode) : null;
  }
  return { x, y };
}

export function buildParentMap(nodes: any[]) { return new Map(nodes.map(n=>[n.id, n.parentNode])); }

export function computeDepth(id: string, pmap: Map<string, string|undefined>) {
  let d=0; let p = pmap.get(id); let g=0; while(p && g++<100){ d++; p = pmap.get(p); } return d;
}

export function applyZIndexHierarchy(nodes: any[], setNodes: (updater: any)=>void) {
  const pmap = buildParentMap(nodes);
  const BASE = 100;
  const updates: Record<string, number> = {};
  nodes.forEach(n => {
    const d = computeDepth(n.id, pmap);
    const target = n.data?.isContainer ? d*BASE : d*BASE + 50;
    const current = (n.style?.zIndex as number)|0;
    if (current !== target) updates[n.id] = target;
  });
  if (Object.keys(updates).length) {
    setNodes((nds: any[]) => nds.map(n => updates[n.id] !== undefined ? { ...n, style: { ...(n.style||{}), zIndex: updates[n.id] } } : n));
  }
}

export function enforceContainerSelectedZ(selection: any, setNodes: (u:any)=>void) {
  if (!selection || selection.type !== 'node' || !selection.data?.isContainer) return;
  setNodes((nds: any[]) => {
    const pmap = buildParentMap(nds); const d = computeDepth(selection.id, pmap); const z = d * 100;
    return nds.map(n => n.id===selection.id ? { ...n, style: { ...(n.style||{}), zIndex: z } } : n);
  });
}
