import { isPointInLShape } from './lshape-utils';

export function findLAwareContainerAt(nodes: any[], absoluteOf: (n:any)=>{x:number;y:number}, absPos: { x:number; y:number }, excludeId?: string) {
  const parentMap = new Map(nodes.map(n=>[n.id, n.parentNode]));
  const isAncestor = (maybeAncestorId: string, nodeId: string) => {
    let cur = parentMap.get(nodeId) as string|undefined; let g=0; while(cur && g++<100){ if (cur===maybeAncestorId) return true; cur = parentMap.get(cur); } return false;
  };
  const candidates = nodes
    .filter((n) => (n.data?.isContainer || n.type === 'network') && n.id !== excludeId)
    .map((c) => {
      const abs = absoluteOf(c);
      const w = (c.type === 'network' ? (c.data?.width ?? 420) : (c.data?.width ?? c.style?.width ?? 520)) as number;
      const h = (c.type === 'network' ? (c.data?.height ?? 240) : (c.data?.height ?? c.style?.height ?? 320)) as number;
      return { c, rect: { x: abs.x, y: abs.y, w, h } };
    })
    .filter(({ rect }) => absPos.x >= rect.x && absPos.y >= rect.y && absPos.x <= rect.x + rect.w && absPos.y <= rect.y + rect.h)
    .filter(({ c, rect }) => {
      if (c.data?.shape === 'l-shape' && c.data?.lShape) {
        const localX = absPos.x - rect.x; const localY = absPos.y - rect.y;
        return isPointInLShape(localX, localY, rect.w, rect.h, c.data.lShape);
      }
      return true;
    })
    .filter(({ c }) => !(excludeId && isAncestor(excludeId, c.id)));
  if (!candidates.length) return null;
  candidates.sort((A, B) => (A.rect.w*A.rect.h) - (B.rect.w*B.rect.h));
  return candidates[0].c;
}

export function pickUnderlyingNode(nodes: any[], absoluteOf: (n:any)=>{x:number;y:number}, absPos:{x:number;y:number}, excludeId?: string) {
  const hits = nodes
    .filter(n => n.id !== excludeId)
    .map(n => {
      const a = absoluteOf(n);
      const w = (n.style?.width as number) || (n.data?.width as number) || (n.width as number) || 150;
      const h = (n.style?.height as number) || (n.data?.height as number) || (n.height as number) || 100;
      const inside = absPos.x >= a.x && absPos.y >= a.y && absPos.x <= a.x + w && absPos.y <= a.y + h;
      if (!inside) return null;
      const visible = n.data?.shape === 'l-shape' && n.data?.lShape ? isPointInLShape(absPos.x - a.x, absPos.y - a.y, w, h, n.data.lShape) : true;
      return visible ? { n, area: w*h } : null;
    })
    .filter(Boolean) as {n:any;area:number}[];
  if (!hits.length) return null;
  hits.sort((A,B)=>A.area - B.area);
  return hits[0].n;
}
