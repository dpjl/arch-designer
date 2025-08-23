"use client";
import React, { memo, useCallback, useMemo, useState } from 'react';
import { EdgeProps, getBezierPath, getSmoothStepPath, getStraightPath, useReactFlow, Position, EdgeText } from 'reactflow';
import { useTheme } from '../theme/ThemeProvider';
import { NetworkLinkData } from './network-link-utils';
import { calculateAbsoluteNodePosition, calculateAnchorPosition } from './edge-anchoring';

interface NetworkLinkEdgeProps extends EdgeProps {
  data: NetworkLinkData;
}

// Draggable handle component for edge endpoints
const EdgeHandle = memo(({ 
  x, 
  y, 
  color, 
  onDrag 
}: {
  x: number;
  y: number;
  color: string;
  onDrag: (deltaX: number, deltaY: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStart.x;
      const deltaY = moveEvent.clientY - dragStart.y;
      onDrag(deltaX, deltaY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [dragStart, onDrag]);

  return (
    <circle
      cx={x}
      cy={y}
      r={6}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
      className={`cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        transition: isDragging ? 'none' : 'all 0.2s ease',
      }}
    />
  );
});

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

const NetworkLinkEdge = memo(({ 
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
  selected,
  label
}: NetworkLinkEdgeProps) => {
  const { networkColor, networkId } = data;
  const { getNodes } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  // Compute actual connection points honoring saved anchors
  const connectionPoints = useMemo(() => {
    const nodes = getNodes();
    let actualSourceX = sourceX;
    let actualSourceY = sourceY;
    let actualTargetX = targetX;
    let actualTargetY = targetY;
    if ((data as any)?.sourceAnchor) {
      const abs = calculateAbsoluteNodePosition(source, nodes);
      if (abs) {
        const p = calculateAnchorPosition(abs.x, abs.y, abs.width, abs.height, (data as any).sourceAnchor.side, (data as any).sourceAnchor.offset);
        actualSourceX = p.x; actualSourceY = p.y;
      }
    }
    if ((data as any)?.targetAnchor) {
      const abs = calculateAbsoluteNodePosition(target, nodes);
      if (abs) {
        const p = calculateAnchorPosition(abs.x, abs.y, abs.width, abs.height, (data as any).targetAnchor.side, (data as any).targetAnchor.offset);
        actualTargetX = p.x; actualTargetY = p.y;
      }
    }
    return { actualSourceX, actualSourceY, actualTargetX, actualTargetY };
  }, [getNodes, source, target, sourceX, sourceY, targetX, targetY, (data as any)?.sourceAnchor, (data as any)?.targetAnchor]);
  
  // Calculate the path based on edge type
  const getPath = useCallback(() => {
    const shape = data?.shape || 'smooth';
    const { actualSourceX, actualSourceY, actualTargetX, actualTargetY } = connectionPoints;
    let actualSourcePosition = sourcePosition;
    let actualTargetPosition = targetPosition;
    if ((data as any)?.sourceAnchor) actualSourcePosition = stringToPosition((data as any).sourceAnchor.side);
    if ((data as any)?.targetAnchor) actualTargetPosition = stringToPosition((data as any).targetAnchor.side);
    
    switch (shape) {
      case 'straight':
        return getStraightPath({ sourceX: actualSourceX, sourceY: actualSourceY, targetX: actualTargetX, targetY: actualTargetY });
      case 'step':
        return getSmoothStepPath({ sourceX: actualSourceX, sourceY: actualSourceY, sourcePosition: actualSourcePosition, targetX: actualTargetX, targetY: actualTargetY, targetPosition: actualTargetPosition });
      case 'smooth':
      default:
        return getBezierPath({ sourceX: actualSourceX, sourceY: actualSourceY, sourcePosition: actualSourcePosition, targetX: actualTargetX, targetY: actualTargetY, targetPosition: actualTargetPosition });
    }
  }, [connectionPoints, sourcePosition, targetPosition, data?.shape, (data as any)?.sourceAnchor, (data as any)?.targetAnchor]);

  const [edgePath, labelX, labelY] = getPath();

  const handleSourceDrag = useCallback((deltaX: number, deltaY: number) => {
    // TODO: Calculate new position on source node border and update edge
    console.log('Source drag:', deltaX, deltaY);
  }, []);

  const handleTargetDrag = useCallback((deltaX: number, deltaY: number) => {
    // TODO: Calculate new position on target node border and update edge
    console.log('Target drag:', deltaX, deltaY);
  }, []);

  return (
    <g className={`react-flow__edge ${selected ? 'selected' : ''} network-link-edge`}>
      {/* Visible path */}
      <path
        id={id}
        style={{
          ...style,
          stroke: networkColor,
          strokeWidth: (typeof style?.strokeWidth === 'number' ? (style!.strokeWidth as number) : 3),
          pointerEvents: 'none' // Prevent double click events
        }}
        className="react-flow__edge-path"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={edgePath}
        markerEnd={markerEnd && typeof markerEnd === 'object' && 'type' in markerEnd ? `url(#${(markerEnd as any).type})` : undefined}
      />

      {/* Wide transparent hit area ABOVE the visible stroke for easier selection (works with dashed/animated) */}
      <path
        d={edgePath}
        stroke="rgba(0,0,0,0.001)"
        strokeWidth={Math.max(20, ((typeof style?.strokeWidth === 'number' ? (style!.strokeWidth as number) : 3)) * 4)}
        fill="none"
        strokeLinecap="round"
        style={{ 
          cursor: 'pointer',
          pointerEvents: 'stroke'
        }}
      />

      {/* Label */}
    {label && (
        <EdgeText
          x={labelX}
          y={labelY}
          label={String(label)}
      labelStyle={{ fontSize: 11, fontWeight: 600, fill: isDark ? '#e2e8f0' : '#0f172a' }}
          labelShowBg
          labelBgPadding={[3, 6]}
          labelBgBorderRadius={4}
      labelBgStyle={{ fill: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.92)', stroke: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.15)' }}
        />
      )}

  {/* Overlap dashes are rendered globally by EdgeOverlapOverlay */}
      
      {/* Aesthetic endpoint dots (always visible) */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={4}
        fill={networkColor}
        stroke="#ffffff"
        strokeWidth={1.5}
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
        }}
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={4}
        fill={networkColor}
        stroke="#ffffff"
        strokeWidth={1.5}
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
        }}
      />
      
      {/* Draggable handles when selected */}
      {selected && (
        <>
          <EdgeHandle
            x={sourceX}
            y={sourceY}
            color={networkColor}
            onDrag={handleSourceDrag}
          />
          <EdgeHandle
            x={targetX}
            y={targetY}
            color={networkColor}
            onDrag={handleTargetDrag}
          />
        </>
      )}
    </g>
  );
});

export default NetworkLinkEdge;