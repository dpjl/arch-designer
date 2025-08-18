// Network link utilities
import { MarkerType } from 'reactflow';

export interface NetworkLinkPosition {
  side: 'top' | 'bottom' | 'left' | 'right';
  offset: number; // 0-1, position along the side
}

export interface NetworkLinkData {
  isNetworkLink: boolean;
  networkId: string;
  networkColor: string;
  sourcePosition?: NetworkLinkPosition;
  targetPosition?: NetworkLinkPosition;
  shape?: string;
  pattern?: string;
}

// Generate an ID for a network link
export function generateNetworkLinkId(serviceId: string, networkId: string): string {
  return `network-link-${serviceId}-${networkId}`;
}

// Create a network link edge
export function createNetworkLinkEdge(
  serviceId: string, 
  networkNodeId: string, // The actual node ID for the target
  networkDisplayId: string, // The netId for display and reference
  networkColor: string,
  sourcePosition?: NetworkLinkPosition,
  targetPosition?: NetworkLinkPosition
): any {
  const id = generateNetworkLinkId(serviceId, networkDisplayId);
  
  return {
    id,
    source: serviceId,
    target: networkNodeId, // Use actual node ID for React Flow
    type: 'networkLink',
    animated: false,
    style: {
      stroke: networkColor,
      strokeWidth: 3,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: networkColor,
    },
    data: {
      isNetworkLink: true,
      networkId: networkDisplayId, // Use display ID for label
      networkColor,
      sourcePosition,
      targetPosition,
      shape: 'smooth',
      pattern: 'solid',
    } as NetworkLinkData,
    className: 'network-link-edge',
  };
}

// Calculate position on rectangle border based on side and offset
export function calculateBorderPosition(
  nodeWidth: number,
  nodeHeight: number,
  side: 'top' | 'bottom' | 'left' | 'right',
  offset: number // 0-1
): { x: number; y: number } {
  const clampedOffset = Math.max(0, Math.min(1, offset));
  
  switch (side) {
    case 'top':
      return { x: nodeWidth * clampedOffset, y: 0 };
    case 'bottom':
      return { x: nodeWidth * clampedOffset, y: nodeHeight };
    case 'left':
      return { x: 0, y: nodeHeight * clampedOffset };
    case 'right':
      return { x: nodeWidth, y: nodeHeight * clampedOffset };
  }
}

// Find the closest point on a rectangle border to a given point
export function findClosestBorderPoint(
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
  pointX: number,
  pointY: number
): { side: 'top' | 'bottom' | 'left' | 'right'; offset: number; x: number; y: number } {
  const relativeX = pointX - rectX;
  const relativeY = pointY - rectY;
  
  // Calculate distances to each side
  const distToTop = Math.abs(relativeY);
  const distToBottom = Math.abs(relativeY - rectHeight);
  const distToLeft = Math.abs(relativeX);
  const distToRight = Math.abs(relativeX - rectWidth);
  
  const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
  
  if (minDist === distToTop) {
    const offset = Math.max(0, Math.min(1, relativeX / rectWidth));
    return { side: 'top', offset, x: rectX + rectWidth * offset, y: rectY };
  } else if (minDist === distToBottom) {
    const offset = Math.max(0, Math.min(1, relativeX / rectWidth));
    return { side: 'bottom', offset, x: rectX + rectWidth * offset, y: rectY + rectHeight };
  } else if (minDist === distToLeft) {
    const offset = Math.max(0, Math.min(1, relativeY / rectHeight));
    return { side: 'left', offset, x: rectX, y: rectY + rectHeight * offset };
  } else {
    const offset = Math.max(0, Math.min(1, relativeY / rectHeight));
    return { side: 'right', offset, x: rectX + rectWidth, y: rectY + rectHeight * offset };
  }
}

// Check if an edge is a network link
export function isNetworkLink(edge: any): boolean {
  return edge?.data?.isNetworkLink === true;
}

// Get all network links for a service
export function getNetworkLinksForService(edges: any[], serviceId: string): any[] {
  return edges.filter(edge => 
    isNetworkLink(edge) && edge.source === serviceId
  );
}

// Get all network links for a network
export function getNetworkLinksForNetwork(edges: any[], networkId: string): any[] {
  return edges.filter(edge => 
    isNetworkLink(edge) && edge.target === networkId
  );
}

// Remove all network links for a service
export function removeNetworkLinksForService(edges: any[], serviceId: string): any[] {
  return edges.filter(edge => 
    !(isNetworkLink(edge) && edge.source === serviceId)
  );
}

// Update network links for a service based on its networks array
export function updateNetworkLinksForService(
  edges: any[],
  nodes: any[],
  serviceId: string,
  networkIds: string[],
  networkColorMap: Map<string, string>,
  autoLinkEnabled: boolean
): any[] {
  // If auto-link is disabled, remove all network links for this service
  if (!autoLinkEnabled) {
    return removeNetworkLinksForService(edges, serviceId);
  }
  
  // If auto-link is enabled, update links while preserving custom anchors
  if (networkIds.length === 0) {
    return removeNetworkLinksForService(edges, serviceId);
  }
  
  // Find the service node to check its parent
  const serviceNode = nodes.find(n => n.id === serviceId);
  const parentNetworkNodeId = serviceNode?.parentNode;
  
  // Find the parent network's netId if it exists
  let parentNetworkNetId = null;
  if (parentNetworkNodeId) {
    const parentNetworkNode = nodes.find(n => n.id === parentNetworkNodeId && n.type === 'network');
    if (parentNetworkNode) {
      parentNetworkNetId = parentNetworkNode.data?.netId || parentNetworkNode.id;
    }
  }
  
  // Filter out the parent network from the networks to link to
  const filteredNetworkIds = networkIds.filter(netId => netId !== parentNetworkNetId);
  
  // If no networks left after filtering, just remove existing links
  if (filteredNetworkIds.length === 0) {
    return removeNetworkLinksForService(edges, serviceId);
  }
  
  // Map netId to actual node ID
  const netIdToNodeId = new Map<string, string>();
  nodes.filter(n => n.type === 'network').forEach(n => {
    const netId = n.data?.netId || n.id;
    netIdToNodeId.set(netId, n.id);
  });
  
  // Collect existing network links for this service to preserve their custom anchors
  const existingLinksMap = new Map<string, any>();
  edges.forEach(edge => {
    if (isNetworkLink(edge) && edge.source === serviceId) {
      const networkId = edge.data?.networkId;
      if (networkId) {
        existingLinksMap.set(networkId, edge);
      }
    }
  });
  
  // Remove existing network links for this service
  let updatedEdges = removeNetworkLinksForService(edges, serviceId);
  
  // Create or update links for each filtered network
  const newLinks = filteredNetworkIds.map(netId => {
    const actualNodeId = netIdToNodeId.get(netId);
    if (!actualNodeId) return null;
    
    const networkColor = networkColorMap.get(netId) || '#10b981';
    const existingLink = existingLinksMap.get(netId);
    
    if (existingLink) {
      // Preserve existing link but update target node ID and color if needed
      return {
        ...existingLink,
        target: actualNodeId, // Update target in case node ID changed
        style: {
          ...existingLink.style,
          stroke: networkColor,
        },
        markerEnd: {
          ...existingLink.markerEnd,
          color: networkColor,
        },
        data: {
          ...existingLink.data,
          networkColor,
          // Preserve sourceAnchor and targetAnchor if they exist
        }
      };
    } else {
      // Create new link
      return createNetworkLinkEdge(serviceId, actualNodeId, netId, networkColor);
    }
  }).filter(Boolean);
  
  return [...updatedEdges, ...newLinks];
}