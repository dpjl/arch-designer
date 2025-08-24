import { CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT } from '../constants';
import { absolutePosition } from '../layout-utils';

/**
 * Remove a container node but keep all its children at the same hierarchy level,
 * preserving absolute positions.
 */
export function removeContainerKeepChildren(nodes: any[], containerId: string): any[] {
  const container = nodes.find(n => n.id === containerId);
  if (!container) return nodes;
  const parentId: string | undefined = container.parentNode || undefined;
  const next = nodes
    .filter(n => n.id !== containerId)
    .map(n => {
      if (n.parentNode !== containerId) return n;
      const abs = absolutePosition(n, nodes);
      if (!parentId) {
        return { ...n, parentNode: undefined, extent: undefined, position: abs };
      }
      const parent = nodes.find(p => p.id === parentId);
      if (!parent) return { ...n, parentNode: undefined, extent: undefined, position: abs };
      const pAbs = absolutePosition(parent, nodes);
      // Important: do NOT subtract header offset here; local space is top-left of parent content box
      const local = { x: abs.x - pAbs.x, y: abs.y - pAbs.y };
      return { ...n, parentNode: parentId, extent: 'parent', position: local };
    });
  return next;
}

/**
 * Create a new container around the given target node ids.
 * - Computes absolute bounds, adds padding and reserves header height.
 * - Reparents targets into the new container preserving absolute positions.
 */
export function wrapInContainer(nodes: any[], targetIds: string[]): any[] {
  const subset = nodes.filter(n => targetIds.includes(n.id) && n.type !== 'door');
  if (!subset.length) return nodes;
  const parentId: string | undefined = subset.every(n => (n.parentNode || undefined) === (subset[0].parentNode || undefined))
    ? (subset[0].parentNode || undefined)
    : undefined;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  subset.forEach(n => {
    const abs = absolutePosition(n, nodes);
    const w = (n.style?.width || n.data?.width || n.width || 150) as number;
    const h = (n.style?.height || n.data?.height || n.height || 100) as number;
    minX = Math.min(minX, abs.x); minY = Math.min(minY, abs.y);
    maxX = Math.max(maxX, abs.x + w); maxY = Math.max(maxY, abs.y + h);
  });
  if (!isFinite(minX) || !isFinite(minY)) return nodes;
  const PAD_SIDE = 16, PAD_TOP = 12, PAD_BOTTOM = 16; const HEADER = CONTAINER_HEADER_HEIGHT;
  const contentW = Math.round(maxX - minX);
  const contentH = Math.round(maxY - minY);
  const width = Math.max(200, contentW + PAD_SIDE * 2);
  const height = Math.max(140, HEADER + contentH + PAD_TOP + PAD_BOTTOM);
  const absPos = { x: Math.round(minX - PAD_SIDE), y: Math.round(minY - HEADER - PAD_TOP) };
  let position = absPos; let extent: any = undefined; let newParentId: any = undefined;
  if (parentId) {
    const parent = nodes.find(p => p.id === parentId);
    if (parent) {
      const pAbs = absolutePosition(parent, nodes);
      position = { x: absPos.x - pAbs.x, y: absPos.y - pAbs.y };
      newParentId = parentId; extent = 'parent';
    }
  }
  const containerId = `group-${Math.random().toString(36).slice(2, 8)}`;
  const newContainer: any = {
    id: containerId,
    type: 'component',
    position,
    data: { idInternal: containerId, label: 'Container', color: '#475569', width, height, locked: false, isContainer: true, bgColor: '#ffffff', bgOpacity: 0.85 },
    style: { width, height },
    parentNode: newParentId,
    extent
  };
  const next = nodes.map(n => {
    if (!targetIds.includes(n.id)) return n;
    const abs = absolutePosition(n, nodes);
    const local = { x: abs.x - absPos.x, y: abs.y - absPos.y };
    return { ...n, parentNode: containerId, extent: 'parent', position: local } as any;
  });
  return next.concat(newContainer);
}
