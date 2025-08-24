import { useCallback, useRef } from 'react';

type MultiDragDeps = {
  nodes: any[];
  setNodes: (updater: any) => void;
  mode: any;
  MODES: any;
  DEFAULT_DOOR_WIDTH: number;
  DEFAULT_DOOR_HEIGHT: number;
  CONTAINER_HEADER_HEIGHT: number;
  NETWORK_HEADER_HEIGHT: number;
  snapDoorToNearestSide: (parent: any, localPos: { x: number; y: number }, doorW: number, doorH: number) => { side: any; position: { x: number; y: number } };
};

export function useMultiDrag({ nodes, setNodes, mode, MODES, DEFAULT_DOOR_WIDTH, DEFAULT_DOOR_HEIGHT, CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT, snapDoorToNearestSide }: MultiDragDeps) {
  const dragBundleRef = useRef<{
    baseId: string;
    parentId?: string | null;
    start: Record<string, { x: number; y: number }>;
    partIndex?: Record<string, number>;
    headerLeft?: number;
    partitions?: number;
    partitionWidth?: number;
    containerWidth?: number;
  } | null>(null);

  const onNodeDragStartMulti = useCallback((_: any, node: any) => {
    if (!node) return;
    const selIds = nodes.filter(n => n.selected).map(n => n.id);
    const ids = selIds.length ? selIds : [node.id];
    const parentId = node?.parentNode ?? null;
    const subset = nodes.filter(n => ids.includes(n.id) && (n.parentNode ?? null) === parentId);
    const start: Record<string, { x: number; y: number }> = {};
    subset.forEach(n => { start[n.id] = { x: n.position.x, y: n.position.y }; });

    let partIndex: Record<string, number> | undefined = undefined;
    let headerLeft: number | undefined = undefined;
    let partitions: number | undefined = undefined;
    let partitionWidth: number | undefined = undefined;
    let containerWidth: number | undefined = undefined;
  if (parentId) {
      const parent = nodes.find(n => n.id === parentId);
      if (parent) {
        const isNet = parent.type === 'network';
        const headerPos = (parent.data?.headerPos || 'top');
        headerLeft = headerPos === 'left' ? (isNet ? NETWORK_HEADER_HEIGHT : CONTAINER_HEADER_HEIGHT) : 0;
        const width = (parent.data?.width || parent.style?.width || parent.width || 520) as number;
        containerWidth = width;
        partitions = Math.max(1, Math.min(12, parseInt(String(parent.data?.partitions ?? 1), 10) || 1));
        const innerW = width - (headerLeft || 0);
        partitionWidth = innerW / partitions;
        partIndex = {};
        subset.forEach(n => {
          let idx = (n as any).data?.parentPartition;
          if (typeof idx !== 'number' || isNaN(idx)) {
            const localX = Math.max(0, n.position.x - (headerLeft || 0));
            idx = Math.floor(localX / (partitionWidth || innerW));
          }
          if (idx < 0) idx = 0; if (idx >= (partitions || 1)) idx = (partitions || 1) - 1;
          partIndex![n.id] = idx;
        });
      }
    }
    dragBundleRef.current = { baseId: node.id, parentId, start, partIndex, headerLeft, partitions, partitionWidth, containerWidth };
  }, [nodes, CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT]);

  const onNodeDrag = useCallback((evt: any, node: any) => {
    if (mode !== MODES.EDIT) return;
    const ref = dragBundleRef.current; if (!ref) return;
  const baseStart = ref.start?.[node?.id]; if (!baseStart) return;
    const dx = node.position.x - baseStart.x; const dy = node.position.y - baseStart.y;
    if (dx === 0 && dy === 0) return;
    setNodes((nds: any[]) => nds.map((n: any) => {
      if (!ref.start[n.id]) return n;
      if (n.type === 'door') {
        const parent = n.parentNode ? nds.find((p: any) => p.id === n.parentNode) : undefined;
        if (!parent) return n;
        if (!parent.data?.features?.firewall) return n;
        const doorW = Math.round((n.data?.width || DEFAULT_DOOR_WIDTH));
        const doorH = DEFAULT_DOOR_HEIGHT;
        const startLocal = ref.start[n.id];
        const localX = startLocal.x + dx;
        const localY = startLocal.y + dy;
        const snapped = snapDoorToNearestSide(parent, { x: localX, y: localY }, doorW, doorH);
        return { ...n, position: snapped.position, data: { ...(n as any).data, side: snapped.side } } as any;
      }
      let newX = ref.start[n.id].x + dx;
      let newY = ref.start[n.id].y + dy;
      if (n.type !== 'door' && ref.parentId && ref.partitions && ref.partitionWidth && ref.headerLeft !== undefined) {
        const nodeW = (n as any).width || (n as any).data?.width || (n as any).style?.width || 150;
        const pad = 4;
  // Shift maintenu: autoriser le changement de partition pendant le drag
  if (evt?.shiftKey) {
          const centerX = newX + nodeW / 2;
          let idx = Math.floor((centerX - (ref.headerLeft || 0)) / (ref.partitionWidth || 1));
          if (idx < 0) idx = 0; if (idx >= (ref.partitions || 1)) idx = (ref.partitions || 1) - 1;
          if (!ref.partIndex) ref.partIndex = {};
          ref.partIndex[n.id] = idx;
        }
        const idx = ref.partIndex?.[n.id] ?? 0;
        const left = (ref.headerLeft || 0) + idx * (ref.partitionWidth || 1) + 0;
        const right = (ref.headerLeft || 0) + (idx + 1) * (ref.partitionWidth || 1);
        newX = Math.max(left + pad, Math.min(newX, right - nodeW - pad));
      }
      return { ...n, position: { x: newX, y: newY }, data: { ...(n as any).data, parentPartition: ref.partIndex?.[n.id] ?? (n as any).data?.parentPartition } } as any;
    }));
  }, [setNodes, mode, MODES, DEFAULT_DOOR_WIDTH, DEFAULT_DOOR_HEIGHT, snapDoorToNearestSide]);

  const onNodeDragStopMulti = useCallback(() => { dragBundleRef.current = null; }, []);

  return { onNodeDragStartMulti, onNodeDrag, onNodeDragStopMulti };
}
