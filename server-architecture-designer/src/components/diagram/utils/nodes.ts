// Node related helpers (moved into diagram scope)
export const CONTAINER_HEADER_HEIGHT = 44;

export const ensureChildAboveContainerZ = (nodes: any[]) => {
  const parentMap = new Map(nodes.map(n => [n.id, n.parentNode]));
  const depth = (id: string) => { let d=0, p = parentMap.get(id); let guard=0; while(p && guard++<100){ d++; p = parentMap.get(p); } return d; };
  return nodes.map(n => {
    const d = depth(n.id);
    const targetZ = n.type === 'container' ? d*10 : d*10+1;
    if (n.style?.zIndex === targetZ) return n;
    return { ...n, style: { ...(n.style||{}), zIndex: targetZ } };
  });
};
