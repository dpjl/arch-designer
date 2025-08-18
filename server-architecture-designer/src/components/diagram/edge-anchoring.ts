// Edge anchoring system for custom connection points
export interface EdgeAnchor {
  nodeId: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  offset: number; // 0-1, position along the side
}

export interface EdgeAnchorData {
  sourceAnchor?: EdgeAnchor;
  targetAnchor?: EdgeAnchor;
}

// Calculate absolute position of a node considering all parent containers
export function calculateAbsoluteNodePosition(
  nodeId: string,
  nodes: any[]
): { x: number; y: number; width: number; height: number } | null {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.position || !node.width || !node.height) {
    return null;
  }
  
  let absoluteX = node.position.x;
  let absoluteY = node.position.y;
  
  // Traverse up the parent chain to calculate absolute position
  let currentNode = node;
  while (currentNode.parentNode) {
    const parentNode = nodes.find(n => n.id === currentNode.parentNode);
    if (!parentNode || !parentNode.position) break;
    
    absoluteX += parentNode.position.x;
    absoluteY += parentNode.position.y;
    
    currentNode = parentNode;
  }
  
  return {
    x: absoluteX,
    y: absoluteY,
    width: node.width,
    height: node.height
  };
}

// Calculate position on rectangle border based on side and offset
export function calculateAnchorPosition(
  nodeX: number,
  nodeY: number,
  nodeWidth: number,
  nodeHeight: number,
  side: 'top' | 'bottom' | 'left' | 'right',
  offset: number // 0-1
): { x: number; y: number } {
  const clampedOffset = Math.max(0, Math.min(1, offset));
  
  switch (side) {
    case 'top':
      return { x: nodeX + nodeWidth * clampedOffset, y: nodeY };
    case 'bottom':
      return { x: nodeX + nodeWidth * clampedOffset, y: nodeY + nodeHeight };
    case 'left':
      return { x: nodeX, y: nodeY + nodeHeight * clampedOffset };
    case 'right':
      return { x: nodeX + nodeWidth, y: nodeY + nodeHeight * clampedOffset };
  }
}
