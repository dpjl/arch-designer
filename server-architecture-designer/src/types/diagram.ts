// Central shared types for diagram domain (extracted from DiagramCanvas monolith)
// Keep minimal & additive to avoid breaking existing implicit "any" usage.
export type NodeKind = 'component' | 'network' | 'door';

export interface BaseNodeData {
  idInternal: string;
  label?: string;
  color?: string;
  textColor?: string;
}

export interface ServiceNodeData extends BaseNodeData {
  isContainer?: false;
  icon?: string;
  features?: Record<string, any>;
  networks?: string[];
  primaryNetwork?: string;
  instances?: Array<{
    id: string;
    auth?: string;
    bgColor?: string;
    fgColor?: string;
  }>;
  networkColors?: string[]; // derived
}

export interface ContainerNodeData extends BaseNodeData {
  isContainer: true;
  width: number;
  height: number;
  bgColor?: string;
  bgOpacity?: number;
  locked?: boolean;
  features?: Record<string, any>;
}

export interface NetworkNodeData extends BaseNodeData {
  width: number;
  height: number;
  netId: string; // stable identifier used in memberships
  // network nodes also act as containers visually
}

export interface DoorNodeData extends BaseNodeData {
  isDoor: true;
  allow?: string;
  width?: number; // base door width before scaling
  scale?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  offsets?: { top?: number; bottom?: number; left?: number; right?: number };
}

export type AnyNodeData = ServiceNodeData | ContainerNodeData | NetworkNodeData | DoorNodeData | Record<string, any>;

export interface CatalogEntry {
  id: string;
  label: string;
  icon: string;
  color: string;
  category: 'service' | 'generic' | 'security' | 'container';
}
