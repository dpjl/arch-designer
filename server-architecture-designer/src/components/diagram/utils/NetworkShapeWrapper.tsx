import React from 'react';
import { generateLShapeClipPath } from '../utils/lshape-utils';
import { LShapeResizeHandles } from '../utils/LShapeResizeHandles';
import { LShapeInternalBorders } from '../utils/LShapeInternalBorders';

interface NetworkShapeWrapperProps {
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
  id: string;
  partitions: number;
  onResize?: (e: React.MouseEvent, direction: string) => void;
}

export const NetworkShapeWrapper: React.FC<NetworkShapeWrapperProps> = ({
  children,
  width,
  height,
  borderColor,
  bg,
  shape = 'rectangle',
  lShape,
  selected,
  id,
  partitions,
  onResize
}) => {
  const showHandles = selected;
  
  // Generate clip-path for L-shape
  const clipPath = shape === 'l-shape' && lShape 
    ? generateLShapeClipPath(width, height, lShape)
    : 'none';

  return (
    <div className="relative w-full h-full pointer-events-none">
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
        className="rounded-2xl relative border shadow-sm overflow-visible" 
        data-partitions={partitions}
        style={{ 
          borderColor, 
          width: '100%', 
          height: '100%',
          clipPath: clipPath,
          pointerEvents: 'auto'
        }}
      >
        {/* Background with tint */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ background: bg }} />
        
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
