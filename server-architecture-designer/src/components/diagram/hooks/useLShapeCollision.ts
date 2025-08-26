import { useCallback } from 'react';
import { Node } from 'reactflow';
import { isPointInLShape } from '../utils/lshape-utils';

export const useLShapeCollision = () => {
  
  const checkNodeCollisionWithLShape = useCallback((
    node: Node,
    containerNode: Node,
    newPosition: { x: number; y: number }
  ): { x: number; y: number } => {
    const containerData = containerNode.data;
    
    // If not L-shape, allow any position
    if (containerData?.shape !== 'l-shape' || !containerData?.lShape) {
      return newPosition;
    }
    
    const lShape = containerData.lShape;
    const containerWidth = containerData.width || 520;
    const containerHeight = containerData.height || 320;
    const nodeWidth = node.width || node.data?.width || 150;
    const nodeHeight = node.height || node.data?.height || 100;
    
    // Check all four corners of the node
    const corners = [
      { x: newPosition.x, y: newPosition.y },
      { x: newPosition.x + nodeWidth, y: newPosition.y },
      { x: newPosition.x, y: newPosition.y + nodeHeight },
      { x: newPosition.x + nodeWidth, y: newPosition.y + nodeHeight }
    ];
    
    // If any corner is in the cut area, adjust position
    const hasCollision = corners.some(corner => 
      !isPointInLShape(corner.x, corner.y, containerWidth, containerHeight, lShape)
    );
    
    if (!hasCollision) {
      return newPosition; // No collision, allow the position
    }
    
    // Find a valid position by adjusting
    let adjustedX = newPosition.x;
    let adjustedY = newPosition.y;
    
    const { cutCorner, cutWidth, cutHeight } = lShape;
    const clampedCutWidth = Math.min(cutWidth, containerWidth - 20);
    const clampedCutHeight = Math.min(cutHeight, containerHeight - 20);
    
    switch (cutCorner) {
      case 'top-left':
        // If trying to move into top-left cut area
        if (newPosition.x < clampedCutWidth && newPosition.y < clampedCutHeight) {
          // Choose the shortest path out
          const distanceToRight = clampedCutWidth - newPosition.x;
          const distanceToBottom = clampedCutHeight - newPosition.y;
          
          if (distanceToRight < distanceToBottom) {
            adjustedX = clampedCutWidth + 5; // Move to the right of cut
          } else {
            adjustedY = clampedCutHeight + 5; // Move below cut
          }
        }
        break;
        
      case 'top-right':
        if (newPosition.x + nodeWidth > containerWidth - clampedCutWidth && newPosition.y < clampedCutHeight) {
          const distanceToLeft = (newPosition.x + nodeWidth) - (containerWidth - clampedCutWidth);
          const distanceToBottom = clampedCutHeight - newPosition.y;
          
          if (distanceToLeft < distanceToBottom) {
            adjustedX = containerWidth - clampedCutWidth - nodeWidth - 5; // Move to the left of cut
          } else {
            adjustedY = clampedCutHeight + 5; // Move below cut
          }
        }
        break;
        
      case 'bottom-left':
        if (newPosition.x < clampedCutWidth && newPosition.y + nodeHeight > containerHeight - clampedCutHeight) {
          const distanceToRight = clampedCutWidth - newPosition.x;
          const distanceToTop = (newPosition.y + nodeHeight) - (containerHeight - clampedCutHeight);
          
          if (distanceToRight < distanceToTop) {
            adjustedX = clampedCutWidth + 5; // Move to the right of cut
          } else {
            adjustedY = containerHeight - clampedCutHeight - nodeHeight - 5; // Move above cut
          }
        }
        break;
        
      case 'bottom-right':
        if (newPosition.x + nodeWidth > containerWidth - clampedCutWidth && 
            newPosition.y + nodeHeight > containerHeight - clampedCutHeight) {
          const distanceToLeft = (newPosition.x + nodeWidth) - (containerWidth - clampedCutWidth);
          const distanceToTop = (newPosition.y + nodeHeight) - (containerHeight - clampedCutHeight);
          
          if (distanceToLeft < distanceToTop) {
            adjustedX = containerWidth - clampedCutWidth - nodeWidth - 5; // Move to the left of cut
          } else {
            adjustedY = containerHeight - clampedCutHeight - nodeHeight - 5; // Move above cut
          }
        }
        break;
    }
    
    // Make sure adjusted position is within container bounds
    adjustedX = Math.max(0, Math.min(adjustedX, containerWidth - nodeWidth));
    adjustedY = Math.max(0, Math.min(adjustedY, containerHeight - nodeHeight));
    
    return { x: adjustedX, y: adjustedY };
  }, []);
  
  return {
    checkNodeCollisionWithLShape
  };
};
