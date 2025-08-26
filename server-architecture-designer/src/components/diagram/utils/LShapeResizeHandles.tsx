import React from 'react';
import { getAvailableResizeHandles, getResizeHandlePosition } from '../utils/lshape-utils';

interface LShapeResizeHandlesProps {
  id: string;
  width: number;
  height: number;
  lShape?: {
    cutCorner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    cutWidth: number;
    cutHeight: number;
  };
  onResize: (e: React.MouseEvent, direction: string) => void;
}

export const LShapeResizeHandles: React.FC<LShapeResizeHandlesProps> = ({
  id,
  width,
  height,
  lShape,
  onResize
}) => {
  const handleSize = 16;
  const availableHandles = getAvailableResizeHandles(lShape);

  return (
    <>
      {availableHandles.map(handle => {
        const pos = getResizeHandlePosition(handle, width, height, lShape);
        const isCutHandle = handle.startsWith('cut-');
        
        return (
          <div
            key={handle}
            data-resize
            onMouseDownCapture={(e) => onResize(e, handle)}
            className={`absolute bg-blue-500 hover:bg-blue-600 border-2 border-white hover:border-blue-200 shadow-lg hover:shadow-xl transition-all duration-150 z-10 ${
              isCutHandle 
                ? 'rounded-sm bg-orange-500 hover:bg-orange-600' 
                : 'rounded-full'
            }`}
            style={{
              left: pos.x,
              top: pos.y,
              width: isCutHandle ? handleSize + 2 : handleSize,
              height: isCutHandle ? handleSize + 2 : handleSize,
              transform: isCutHandle 
                ? 'translate(-50%, -50%)' 
                : handle === 'e' ? 'translate(-50%, -50%)'
                : handle === 's' ? 'translate(-50%, -50%)'
                : handle === 'se' ? 'translate(-33%, -33%)'
                : handle === 'w' ? 'translate(-50%, -50%)'
                : handle === 'n' ? 'translate(-50%, -50%)'
                : handle === 'nw' ? 'translate(-66%, -66%)'
                : 'translate(-50%, -50%)',
              cursor: pos.cursor,
            }}
            title={isCutHandle ? `Ajuster le coin amputé (${handle})` : `Redimensionner (${handle})`}
          />
        );
      })}
    </>
  );
};
