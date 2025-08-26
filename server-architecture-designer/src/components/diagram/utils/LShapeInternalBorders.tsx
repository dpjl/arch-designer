import React from 'react';

interface LShapeInternalBordersProps {
  width: number;
  height: number;
  lShape: {
    cutCorner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    cutWidth: number;
    cutHeight: number;
  };
  borderColor: string;
}

export const LShapeInternalBorders: React.FC<LShapeInternalBordersProps> = ({
  width,
  height,
  lShape,
  borderColor
}) => {
  const { cutCorner, cutWidth, cutHeight } = lShape;
  
  // Clamp cut dimensions
  const clampedCutWidth = Math.min(cutWidth, width - 20);
  const clampedCutHeight = Math.min(cutHeight, height - 20);
  
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {cutCorner === 'top-left' && (
        <>
          {/* Vertical internal border */}
          <div 
            className="absolute"
            style={{
              left: clampedCutWidth,
              top: 0,
              width: 1,
              height: clampedCutHeight,
              backgroundColor: borderColor
            }}
          />
          {/* Horizontal internal border */}
          <div 
            className="absolute"
            style={{
              left: 0,
              top: clampedCutHeight,
              width: clampedCutWidth,
              height: 1,
              backgroundColor: borderColor
            }}
          />
        </>
      )}
      
      {cutCorner === 'top-right' && (
        <>
          {/* Vertical internal border */}
          <div 
            className="absolute"
            style={{
              left: width - clampedCutWidth,
              top: 0,
              width: 1,
              height: clampedCutHeight,
              backgroundColor: borderColor
            }}
          />
          {/* Horizontal internal border */}
          <div 
            className="absolute"
            style={{
              left: width - clampedCutWidth,
              top: clampedCutHeight,
              width: clampedCutWidth,
              height: 1,
              backgroundColor: borderColor
            }}
          />
        </>
      )}
      
      {cutCorner === 'bottom-left' && (
        <>
          {/* Vertical internal border */}
          <div 
            className="absolute"
            style={{
              left: clampedCutWidth,
              top: height - clampedCutHeight,
              width: 1,
              height: clampedCutHeight,
              backgroundColor: borderColor
            }}
          />
          {/* Horizontal internal border */}
          <div 
            className="absolute"
            style={{
              left: 0,
              top: height - clampedCutHeight,
              width: clampedCutWidth,
              height: 1,
              backgroundColor: borderColor
            }}
          />
        </>
      )}
      
      {cutCorner === 'bottom-right' && (
        <>
          {/* Vertical internal border */}
          <div 
            className="absolute"
            style={{
              left: width - clampedCutWidth,
              top: height - clampedCutHeight,
              width: 1,
              height: clampedCutHeight,
              backgroundColor: borderColor
            }}
          />
          {/* Horizontal internal border */}
          <div 
            className="absolute"
            style={{
              left: width - clampedCutWidth,
              top: height - clampedCutHeight,
              width: clampedCutWidth,
              height: 1,
              backgroundColor: borderColor
            }}
          />
        </>
      )}
    </div>
  );
};
