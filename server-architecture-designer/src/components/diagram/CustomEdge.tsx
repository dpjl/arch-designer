"use client";
import React, { memo, useCallback, useMemo } from 'react';
import { EdgeProps, getBezierPath, getSmoothStepPath, getStraightPath, useReactFlow, Position } from 'reactflow';
import { EdgeAnchorData, calculateAnchorPosition, calculateAbsoluteNodePosition } from './edge-anchoring';

interface CustomEdgeProps extends EdgeProps {
  data?: EdgeAnchorData & {
    shape?: string;
    pattern?: string;
    isNetworkLink?: boolean;
    networkId?: string;
    networkColor?: string;
  };
}

// Convert string side to React Flow Position
function stringToPosition(side: string): Position {
  switch (side) {
    case 'top': return Position.Top;
    case 'bottom': return Position.Bottom;
    case 'left': return Position.Left;
    case 'right': return Position.Right;
    default: return Position.Top;
  }
}

// Simple visual anchor indicator (non-draggable)
const AnchorIndicator = memo(({ 
  x, 
  y, 
  color,
  label
}: {
  x: number;
  y: number;
  color: string;
  label: string;
}) => {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={6}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
      />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        className="pointer-events-none select-none"
        style={{
          fontSize: '8px',
          fontWeight: 'bold',
          fill: '#ffffff',
        }}
      >
        {label}
      </text>
    </g>
  );
});

const CustomEdge = memo(({ 
  id,
  source,
  target,
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition,
  data,
  style,
  markerEnd,
  selected
}: CustomEdgeProps) => {
  const { getNodes } = useReactFlow();
  
  // Calculate actual connection points based on anchors
  const connectionPoints = useMemo(() => {
    const nodes = getNodes();
    let actualSourceX = sourceX;
    let actualSourceY = sourceY;
    let actualTargetX = targetX;
    let actualTargetY = targetY;
    
    // Apply source anchor if exists
    if (data?.sourceAnchor) {
      const absolutePos = calculateAbsoluteNodePosition(source, nodes);
      if (absolutePos) {
        const anchorPos = calculateAnchorPosition(
          absolutePos.x,
          absolutePos.y,
          absolutePos.width,
          absolutePos.height,
          data.sourceAnchor.side,
          data.sourceAnchor.offset
        );
        actualSourceX = anchorPos.x;
        actualSourceY = anchorPos.y;
      }
    }
    
    // Apply target anchor if exists
    if (data?.targetAnchor) {
      const absolutePos = calculateAbsoluteNodePosition(target, nodes);
      if (absolutePos) {
        const anchorPos = calculateAnchorPosition(
          absolutePos.x,
          absolutePos.y,
          absolutePos.width,
          absolutePos.height,
          data.targetAnchor.side,
          data.targetAnchor.offset
        );
        actualTargetX = anchorPos.x;
        actualTargetY = anchorPos.y;
      }
    }
    
    return { actualSourceX, actualSourceY, actualTargetX, actualTargetY };
  }, [sourceX, sourceY, targetX, targetY, data?.sourceAnchor, data?.targetAnchor, source, target, getNodes]);
  
  // Calculate the path based on edge type
  const getPath = useCallback(() => {
    const shape = data?.shape || 'smooth';
    const { actualSourceX, actualSourceY, actualTargetX, actualTargetY } = connectionPoints;
    
    // Calculate actual positions based on custom anchors
    let actualSourcePosition = sourcePosition;
    let actualTargetPosition = targetPosition;
    
    // Override positions if custom anchors are defined
    if (data?.sourceAnchor) {
      actualSourcePosition = stringToPosition(data.sourceAnchor.side);
    }
    if (data?.targetAnchor) {
      actualTargetPosition = stringToPosition(data.targetAnchor.side);
    }
    
    switch (shape) {
      case 'straight':
        return getStraightPath({
          sourceX: actualSourceX,
          sourceY: actualSourceY,
          targetX: actualTargetX,
          targetY: actualTargetY,
        });
      case 'step':
        return getSmoothStepPath({
          sourceX: actualSourceX,
          sourceY: actualSourceY,
          sourcePosition: actualSourcePosition,
          targetX: actualTargetX,
          targetY: actualTargetY,
          targetPosition: actualTargetPosition,
        });
      case 'smooth':
      default:
        return getBezierPath({
          sourceX: actualSourceX,
          sourceY: actualSourceY,
          sourcePosition: actualSourcePosition,
          targetX: actualTargetX,
          targetY: actualTargetY,
          targetPosition: actualTargetPosition,
        });
    }
  }, [connectionPoints, sourcePosition, targetPosition, data?.shape, data?.sourceAnchor, data?.targetAnchor]);

  const [edgePath, labelX, labelY] = getPath();
  const { actualSourceX, actualSourceY, actualTargetX, actualTargetY } = connectionPoints;

  // Determine edge color
  const edgeColor = data?.isNetworkLink ? data.networkColor : (style?.stroke || '#64748b');
  const strokeWidth = selected ? (data?.isNetworkLink ? 4 : 3) : (data?.isNetworkLink ? 3 : 2);
  const safeEdgeColor = edgeColor || '#64748b';

  return (
    <g className={`react-flow__edge ${selected ? 'selected' : ''} ${data?.isNetworkLink ? 'network-link-edge' : 'custom-edge'}`}>
      {/* Invisible wider path for easier selection */}
      <path
        d={String(edgePath)}
        stroke="transparent"
        strokeWidth={Math.max(20, strokeWidth * 4)} // Minimum 20px wide hit area
        fill="none"
        style={{ 
          cursor: 'pointer',
          pointerEvents: 'stroke' // Only the stroke area is clickable
        }}
      />
      
      {/* Visible path */}
      <path
        id={id}
        style={{
          ...style,
          stroke: safeEdgeColor,
          strokeWidth,
          pointerEvents: 'none' // Prevent double click events
        }}
        className="react-flow__edge-path"
        d={String(edgePath)}
        markerEnd={markerEnd && typeof markerEnd === 'object' && 'type' in markerEnd ? `url(#${(markerEnd as any).type})` : undefined}
      />
      
      {/* Simple anchor indicators when selected and custom anchors are active */}
      {selected && (data?.sourceAnchor || data?.targetAnchor) && (
        <>
          {data?.sourceAnchor && (
            <AnchorIndicator
              x={actualSourceX}
              y={actualSourceY}
              color={safeEdgeColor}
              label="S"
            />
          )}
          {data?.targetAnchor && (
            <AnchorIndicator
              x={actualTargetX}
              y={actualTargetY}
              color={safeEdgeColor}
              label="T"
            />
          )}
        </>
      )}

      {/* Aesthetic endpoint dots for network links (always visible) */}
      {data?.isNetworkLink && (
        <>
          {/* Source endpoint dot */}
          <circle
            cx={actualSourceX}
            cy={actualSourceY}
            r={4}
            fill={safeEdgeColor}
            stroke="#ffffff"
            strokeWidth={1.5}
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
            }}
          />
          {/* Target endpoint dot */}
          <circle
            cx={actualTargetX}
            cy={actualTargetY}
            r={4}
            fill={safeEdgeColor}
            stroke="#ffffff"
            strokeWidth={1.5}
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
            }}
          />
        </>
      )}
    </g>
  );
});

export default CustomEdge;
