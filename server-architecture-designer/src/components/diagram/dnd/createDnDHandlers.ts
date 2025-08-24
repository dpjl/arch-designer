import { CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT, MODES, DEFAULT_DOOR_HEIGHT, DEFAULT_DOOR_WIDTH } from '../constants';

type Deps = {
  mode: any;
  MODES: typeof MODES;
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  project: (p: { x: number; y: number }) => { x: number; y: number };
  getNodes: () => any[];
  setNodes: (updater: any) => void;
  findContainerAt: (absPos: { x: number; y: number }, excludeId?: string) => any | null;
  headerOffsetFor: (node: any) => number;
  absoluteOf: (node: any) => { x: number; y: number };
  DEFAULT_DOOR_WIDTH: number;
  DEFAULT_DOOR_HEIGHT: number;
  snapDoorToNearestSide: (parent: any, localPos: { x: number; y: number }, doorW: number, doorH: number) => { side: any; position: { x: number; y: number } };
};

export function createDnDHandlers(deps: Deps) {
  const {
    mode,
    MODES,
    reactFlowWrapper,
    project,
    getNodes,
    setNodes,
    findContainerAt,
    headerOffsetFor,
    absoluteOf,
    DEFAULT_DOOR_WIDTH,
    DEFAULT_DOOR_HEIGHT,
    snapDoorToNearestSide,
  } = deps;

  const onDrop = (event: any) => {
    if (mode !== MODES.EDIT) { event.preventDefault(); return; }
    event.preventDefault();
    const wrapper = reactFlowWrapper.current; if (!wrapper) return;
    const bounds = wrapper.getBoundingClientRect();
    const id = (event.dataTransfer as DataTransfer).getData('application/x-id');
    const label = (event.dataTransfer as DataTransfer).getData('application/x-label');
    const icon = (event.dataTransfer as DataTransfer).getData('application/x-icon');
    const color = (event.dataTransfer as DataTransfer).getData('application/x-color');
    const local = { x: (event as any).clientX - bounds.left, y: (event as any).clientY - bounds.top };
    const absPos = project(local);

    if (id === 'group') {
      const containerId = `group-${Math.random().toString(36).slice(2, 8)}`;
      const width = 520, height = 320;
      const newNode = { id: containerId, type: 'component', position: absPos, data: { idInternal: containerId, label: 'Container', color: '#475569', width, height, locked: false, isContainer: true, bgColor: '#ffffff', bgOpacity: 0.85 }, style: { width, height } } as any;
  setNodes((nds: any[]) => nds.concat(newNode));
      return;
    }

    if (id === 'door') {
      const nodes = getNodes();
      const parent = findContainerAt(absPos);
      if (!parent || !(parent.data?.features?.firewall)) { return; }
      const parentAbs = absoluteOf(parent);
      const header = headerOffsetFor(parent);
      let position = { x: absPos.x - parentAbs.x, y: absPos.y - parentAbs.y - header };
      const nid = `door-${Math.random().toString(36).slice(2, 8)}`;
      let data: any = { idInternal: nid, isDoor: true, label: 'Door', allow: 'HTTPS', width: DEFAULT_DOOR_WIDTH };
      const snapped = snapDoorToNearestSide(parent, position, DEFAULT_DOOR_WIDTH, DEFAULT_DOOR_HEIGHT);
      position = snapped.position; data.side = snapped.side;
      const newDoor = { id: nid, type: 'door', position, data, parentNode: parent.id, extent: 'parent' as const } as any;
  setNodes((nds: any[]) => nds.concat(newDoor));
      return;
    }

    const parent = findContainerAt(absPos);
    if (id === 'network') {
      const nid = `net-${Math.random().toString(36).slice(2, 8)}`;
      if (parent && parent.type === 'network') {
        const newNode = { id: nid, type: 'network', position: absPos, data: { netId: nid, label: label || 'Network', color: color || '#10b981', width: 420, height: 240 } } as any;
  setNodes((nds: any[]) => nds.concat(newNode));
        return;
      }
      const newNode = { id: nid, type: 'network', position: absPos, data: { netId: nid, label: label || 'Network', color: color || '#10b981', width: 420, height: 240 } } as any;
  setNodes((nds: any[]) => nds.concat(newNode));
      return;
    }

    const parentAbs = parent ? absoluteOf(parent) : null;
    const position = parent ? { x: absPos.x - parentAbs!.x, y: absPos.y - parentAbs!.y } : absPos;
    const nid = `${id}-${Math.random().toString(36).slice(2, 8)}`;
    const data: any = { idInternal: nid, label, icon, color, features: {}, isContainer: false };
    if (parent && parent.type === 'network') {
      data.primaryNetwork = parent.data?.netId || parent.id;
      data.networks = Array.isArray(data.networks) ? Array.from(new Set([...(data.networks || []), data.primaryNetwork])) : [data.primaryNetwork];
    }
    const newNode = { id: nid, type: 'component', position, data, parentNode: (parent as any)?.id, extent: parent ? ('parent' as const) : undefined };
  setNodes((nds: any[]) => nds.concat([newNode]));
  };

  const onDragOver = (event: any) => {
    event.preventDefault();
    (event.dataTransfer as DataTransfer).dropEffect = mode === MODES.EDIT ? 'move' : 'none';
  };

  const onNodeDragStop = (_: any, node: any) => {
    if (mode !== MODES.EDIT) return;
    const nodes = getNodes();
    const parentNode = node.parentNode ? nodes.find((n) => n.id === node.parentNode) : null;
    const parentAbs = parentNode ? absoluteOf(parentNode) : { x: 0, y: 0 };
    const absPos = { x: node.position.x + parentAbs.x, y: node.position.y + parentAbs.y + (parentNode ? headerOffsetFor(parentNode) : 0) };
    const container = findContainerAt(absPos, node.id);

  setNodes((nds: any[]) => nds.map((n: any) => {
      if (n.id !== node.id) return n;
      if (n.type === 'door') {
  const originalContainer = n.parentNode ? nds.find((p: any) => p.id === n.parentNode) : undefined;
        if (!originalContainer) return n;
        if (!originalContainer.data?.features?.firewall) return n;
        const doorW = Math.round((n.data?.width || DEFAULT_DOOR_WIDTH));
        const doorH = DEFAULT_DOOR_HEIGHT;
        const contAbs = absoluteOf(originalContainer);
        const local = { x: absPos.x - contAbs.x, y: absPos.y - contAbs.y - headerOffsetFor(originalContainer) };
        const snapped = snapDoorToNearestSide(originalContainer, local, doorW, doorH);
        return { ...n, parentNode: originalContainer.id, extent: 'parent', position: snapped.position, data: { ...(n.data || {}), side: snapped.side } };
      }
      if (container) {
        if (n.parentNode === container.id) return n;
        if (container.data?.locked) return n;
        if (n.type === 'network' && container.type === 'network') return n;
        const containerAbs = absoluteOf(container);
        const isNet = container.type === 'network';
        const headerLeft = (container.data?.headerPos || 'top') === 'left' ? (isNet ? NETWORK_HEADER_HEIGHT : CONTAINER_HEADER_HEIGHT) : 0;
        const partitions = Math.max(1, Math.min(12, parseInt(String(container.data?.partitions ?? 1), 10) || 1));
        const innerW = (container.data?.width || container.style?.width || container.width || 520) - headerLeft;
        const partW = innerW / partitions;
        const localX = absPos.x - containerAbs.x - headerLeft;
        let pIdx = Math.floor(localX / partW); if (pIdx < 0) pIdx = 0; if (pIdx >= partitions) pIdx = partitions - 1;
        const next: any = { ...n, parentNode: container.id, extent: 'parent', position: { x: absPos.x - containerAbs.x, y: absPos.y - containerAbs.y }, data: { ...(n.data || {}), parentPartition: pIdx } };
        if (n.type === 'component' && !n.data?.isContainer && container.type === 'network') {
          const netId = container.data?.netId || container.id;
          const prev = Array.isArray(n.data?.networks) ? n.data.networks : [];
          next.data = { ...(n.data || {}), primaryNetwork: netId, networks: Array.from(new Set([...prev, netId])) };
        }
        return next;
      }
      if (n.parentNode) return { ...n, parentNode: undefined, extent: undefined };
      return n;
    }));
  };

  return { onDrop, onDragOver, onNodeDragStop };
}
