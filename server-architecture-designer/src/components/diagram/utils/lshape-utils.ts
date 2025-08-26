/**
 * Utilities for handling L-shaped containers
 */

export type LShapeConfig = {
  cutCorner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  cutWidth: number;
  cutHeight: number;
};

/**
 * Generate CSS clip-path for an L-shaped container
 */
export function generateLShapeClipPath(
  totalWidth: number,
  totalHeight: number,
  lShape: LShapeConfig
): string {
  const { cutCorner, cutWidth, cutHeight } = lShape;
  
  // Ensure cut dimensions don't exceed container dimensions
  const clampedCutWidth = Math.min(cutWidth, totalWidth - 20); // Leave at least 20px
  const clampedCutHeight = Math.min(cutHeight, totalHeight - 20);
  
  // Calculate percentages for clip-path
  const cutWPct = (clampedCutWidth / totalWidth) * 100;
  const cutHPct = (clampedCutHeight / totalHeight) * 100;
  
  switch (cutCorner) {
    case 'top-left':
      // Fixed: Create proper rectangular cut, not triangular
      return `polygon(${cutWPct}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${cutHPct}%, ${cutWPct}% ${cutHPct}%)`;
    
    case 'top-right':
      return `polygon(0% 0%, ${100 - cutWPct}% 0%, ${100 - cutWPct}% ${cutHPct}%, 100% ${cutHPct}%, 100% 100%, 0% 100%)`;
    
    case 'bottom-left':
      return `polygon(0% 0%, 100% 0%, 100% 100%, ${cutWPct}% 100%, ${cutWPct}% ${100 - cutHPct}%, 0% ${100 - cutHPct}%)`;
    
    case 'bottom-right':
      return `polygon(0% 0%, 100% 0%, 100% ${100 - cutHPct}%, ${100 - cutWPct}% ${100 - cutHPct}%, ${100 - cutWPct}% 100%, 0% 100%)`;
    
    default:
      return 'none'; // Fallback to rectangle
  }
}

/**
 * Get default L-shape configuration
 */
export function getDefaultLShapeConfig(): LShapeConfig {
  return {
    cutCorner: 'top-right',
    cutWidth: 120,
    cutHeight: 80
  };
}

/**
 * Check if a point is inside an L-shaped container
 */
export function isPointInLShape(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number,
  lShape: LShapeConfig
): boolean {
  const { cutCorner, cutWidth, cutHeight } = lShape;
  
  // First check if point is within the overall rectangle
  if (x < 0 || x > containerWidth || y < 0 || y > containerHeight) {
    return false;
  }
  
  // Then check if point is in the cut-out area
  const clampedCutWidth = Math.min(cutWidth, containerWidth - 20);
  const clampedCutHeight = Math.min(cutHeight, containerHeight - 20);
  
  switch (cutCorner) {
    case 'top-left':
      return !(x < clampedCutWidth && y < clampedCutHeight);
    
    case 'top-right':
      return !(x > containerWidth - clampedCutWidth && y < clampedCutHeight);
    
    case 'bottom-left':
      return !(x < clampedCutWidth && y > containerHeight - clampedCutHeight);
    
    case 'bottom-right':
      return !(x > containerWidth - clampedCutWidth && y > containerHeight - clampedCutHeight);
    
    default:
      return true;
  }
}

/**
 * Get available resize handles based on L-shape configuration
 */
export function getAvailableResizeHandles(lShape?: LShapeConfig): string[] {
  if (!lShape) {
    return ['e', 's', 'se']; // Default rectangle handles
  }
  
  const { cutCorner } = lShape;
  
  // Remove handles that would be in the cut-out area
  switch (cutCorner) {
    case 'top-left':
      return ['e', 's', 'se', 'cut-w', 'cut-n']; // Add custom handles for cut area
    
    case 'top-right':
      return ['e', 's', 'w', 'cut-e', 'cut-n'];
    
    case 'bottom-left':
      return ['e', 's', 'se', 'n', 'cut-w', 'cut-s'];
    
    case 'bottom-right':
      return ['w', 'n', 'nw', 'cut-e', 'cut-s'];
    
    default:
      return ['e', 's', 'se'];
  }
}

/**
 * Get the position for a resize handle
 */
export function getResizeHandlePosition(
  handle: string,
  containerWidth: number,
  containerHeight: number,
  lShape?: LShapeConfig
): { x: number; y: number; cursor: string } {
  const handleSize = 16;
  
  // Standard handles
  switch (handle) {
    case 'e':
      return { x: containerWidth, y: containerHeight / 2, cursor: 'ew-resize' };
    case 's':
      return { x: containerWidth / 2, y: containerHeight, cursor: 'ns-resize' };
    case 'se':
      return { x: containerWidth, y: containerHeight, cursor: 'nwse-resize' };
    case 'w':
      return { x: 0, y: containerHeight / 2, cursor: 'ew-resize' };
    case 'n':
      return { x: containerWidth / 2, y: 0, cursor: 'ns-resize' };
    case 'nw':
      return { x: 0, y: 0, cursor: 'nwse-resize' };
  }
  
  // L-shape specific handles
  if (lShape) {
    const { cutCorner, cutWidth, cutHeight } = lShape;
    const clampedCutWidth = Math.min(cutWidth, containerWidth - 20);
    const clampedCutHeight = Math.min(cutHeight, containerHeight - 20);
    
    switch (handle) {
      case 'cut-w':
        if (cutCorner === 'top-left' || cutCorner === 'bottom-left') {
          return { 
            x: clampedCutWidth, 
            y: cutCorner === 'top-left' ? clampedCutHeight / 2 : containerHeight - clampedCutHeight / 2, 
            cursor: 'ew-resize' 
          };
        }
        break;
      case 'cut-e':
        if (cutCorner === 'top-right' || cutCorner === 'bottom-right') {
          return { 
            x: containerWidth - clampedCutWidth, 
            y: cutCorner === 'top-right' ? clampedCutHeight / 2 : containerHeight - clampedCutHeight / 2, 
            cursor: 'ew-resize' 
          };
        }
        break;
      case 'cut-n':
        if (cutCorner === 'top-left' || cutCorner === 'top-right') {
          return { 
            x: cutCorner === 'top-left' ? clampedCutWidth / 2 : containerWidth - clampedCutWidth / 2, 
            y: clampedCutHeight, 
            cursor: 'ns-resize' 
          };
        }
        break;
      case 'cut-s':
        if (cutCorner === 'bottom-left' || cutCorner === 'bottom-right') {
          return { 
            x: cutCorner === 'bottom-left' ? clampedCutWidth / 2 : containerWidth - clampedCutWidth / 2, 
            y: containerHeight - clampedCutHeight, 
            cursor: 'ns-resize' 
          };
        }
        break;
    }
  }
  
  // Fallback
  return { x: 0, y: 0, cursor: 'default' };
}
