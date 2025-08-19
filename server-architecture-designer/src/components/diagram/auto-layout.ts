// Auto-layout system for containers
// Automatically arranges child elements in a grid layout

import { Node } from 'reactflow';
import { ContainerNodeData } from '@/types/diagram';

export interface AutoLayoutConfig {
  enabled: boolean;
  marginLeft: number;
  marginTop: number;
  columnSpacing: number;
  rowSpacing: number;
  itemWidth: number;
  itemHeight: number;
}

export const DEFAULT_AUTO_LAYOUT: AutoLayoutConfig = {
  enabled: false,
  marginLeft: 20,
  marginTop: 60, // Space for container header
  columnSpacing: 16,
  rowSpacing: 16,
  itemWidth: 120,
  itemHeight: 80,
};

/**
 * Calculate positions for child nodes in a grid layout
 */
export function calculateAutoLayoutPositions(
  containerNode: Node<ContainerNodeData>,
  childNodes: Node[],
  config: AutoLayoutConfig
): { nodeId: string; x: number; y: number }[] {
  if (!config.enabled || childNodes.length === 0) {
    return [];
  }

  const positions: { nodeId: string; x: number; y: number }[] = [];
  const containerWidth = containerNode.data.width;
  
  // Calculate how many items fit per row
  const availableWidth = containerWidth - config.marginLeft * 2;
  const itemsPerRow = Math.max(1, Math.floor(
    (availableWidth + config.columnSpacing) / (config.itemWidth + config.columnSpacing)
  ));
  
  // Position each child
  childNodes.forEach((child, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    const x = config.marginLeft + col * (config.itemWidth + config.columnSpacing);
    const y = config.marginTop + row * (config.itemHeight + config.rowSpacing);
    
    positions.push({
      nodeId: child.id,
      x,
      y
    });
  });
  
  return positions;
}

/**
 * Calculate the required container height to fit all children
 */
export function calculateRequiredContainerHeight(
  childCount: number,
  containerWidth: number,
  config: AutoLayoutConfig
): number {
  if (!config.enabled || childCount === 0) {
    return 0; // Don't change height if auto-layout is disabled
  }
  
  const availableWidth = containerWidth - config.marginLeft * 2;
  const itemsPerRow = Math.max(1, Math.floor(
    (availableWidth + config.columnSpacing) / (config.itemWidth + config.columnSpacing)
  ));
  
  const rowCount = Math.ceil(childCount / itemsPerRow);
  const requiredHeight = config.marginTop + 
    rowCount * config.itemHeight + 
    (rowCount - 1) * config.rowSpacing + 
    config.marginTop; // Bottom margin
  
  return Math.max(120, requiredHeight); // Minimum height
}

/**
 * Check if a node is a child of the given container
 */
export function isChildOfContainer(node: Node, containerId: string): boolean {
  return node.parentNode === containerId;
}

/**
 * Get all direct children of a container
 */
export function getContainerChildren(nodes: Node[], containerId: string): Node[] {
  return nodes.filter(node => isChildOfContainer(node, containerId));
}

/**
 * Apply auto-layout to a container and its children
 */
export function applyAutoLayout(
  nodes: Node[],
  containerId: string
): Node[] {
  const containerNode = nodes.find(n => n.id === containerId);
  if (!containerNode || !containerNode.data.isContainer) {
    return nodes;
  }
  
  const config = containerNode.data.autoLayout || DEFAULT_AUTO_LAYOUT;
  if (!config.enabled) {
    return nodes;
  }
  
  const childNodes = getContainerChildren(nodes, containerId);
  const positions = calculateAutoLayoutPositions(containerNode, childNodes, config);
  const requiredHeight = calculateRequiredContainerHeight(childNodes.length, containerNode.data.width, config);
  
  // Update nodes with new positions
  return nodes.map(node => {
    if (node.id === containerId) {
      // Update container height if needed (never shrink)
      const newHeight = Math.max(node.data.height, requiredHeight);
      return {
        ...node,
        data: {
          ...node.data,
          height: newHeight
        }
      };
    }
    
    // Update child positions
    const newPosition = positions.find(p => p.nodeId === node.id);
    if (newPosition) {
      return {
        ...node,
        position: {
          x: newPosition.x,
          y: newPosition.y
        }
      };
    }
    
    return node;
  });
}
