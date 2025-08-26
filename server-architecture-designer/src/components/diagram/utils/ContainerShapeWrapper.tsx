import React from 'react';
import { generateLShapeClipPath } from '../utils/lshape-utils';
import { LShapeResizeHandles } from '../utils/LShapeResizeHandles';
import { LShapeInternalBorders } from '../utils/LShapeInternalBorders';

interface ContainerShapeWrapperProps {
  children: React.ReactNode;
  width: number;
  height: number;
  borderColor: string;
  bg: string;
  shape?: 'rectangle' | 'l-shape';
  lShape?: {
    cutCorner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    cutWidth: number;
    cutHeight: number;
  };
  selected: boolean;
  locked: boolean;
  isContainer: boolean;
  id: string;
  partitions: number;
  headerPos?: 'top' | 'left';
  onResize?: (e: React.MouseEvent, direction: string) => void;
}

export const ContainerShapeWrapper: React.FC<ContainerShapeWrapperProps> = ({
  children,
  width,
  height,
  borderColor,
  bg,
  shape = 'rectangle',
  lShape,
  selected,
  locked,
  isContainer,
  id,
  partitions,
  headerPos = 'top',
  onResize
}) => {
  const showHandles = isContainer && selected && !locked;
  
  // Generate clip-path for L-shape
  const clipPath = shape === 'l-shape' && lShape 
    ? generateLShapeClipPath(width, height, lShape)
    : 'none';

  const CONTAINER_HEADER_HEIGHT = 52; // Match the constant from ComponentNode

  return (
    <div className="relative w-full h-full">
      {/* Internal borders for L-shape - outside the clipped container */}
      {shape === 'l-shape' && lShape && (
        <LShapeInternalBorders
          width={width}
          height={height}
          lShape={lShape}
          borderColor={borderColor}
        />
      )}
      
      <div 
        className={`rounded-2xl overflow-hidden relative ${selected ? 'container-sel' : ''}`} 
        data-partitions={partitions}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: `1px solid ${borderColor}`, 
          background: bg,
          clipPath: clipPath,
          paddingTop: headerPos === 'top' ? CONTAINER_HEADER_HEIGHT : 0,
          paddingLeft: headerPos === 'left' ? CONTAINER_HEADER_HEIGHT : 0
        }}
      >
        {children}
        
        {showHandles && onResize && (
          <LShapeResizeHandles
            id={id}
            width={width}
            height={height}
            lShape={shape === 'l-shape' ? lShape : undefined}
            onResize={onResize}
          />
        )}
      </div>
    </div>
  );
};
