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

export interface AutoLayoutConfig {
  enabled: boolean;
  leftMargin: number;
  topMargin: number;
  itemSpacing: number;
  lineSpacing: number;
  useGlobalDefaults?: boolean; // Nouvelle propriété pour utiliser les valeurs globales
}

export interface ContainerNodeData {
  label: string;
  color?: string;
  textColor?: string;
  width?: number;
  height?: number;
  children?: string[];
  autoLayout?: AutoLayoutConfig;
}

export interface NetworkNodeData {
  label: string;
  color?: string;
  textColor?: string;
  width?: number;
  height?: number;
  children?: string[];
  headerPos?: 'top' | 'left';
  autoLayout?: AutoLayoutConfig;
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
