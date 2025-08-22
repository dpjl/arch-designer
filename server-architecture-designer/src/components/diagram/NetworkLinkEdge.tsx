"use client";
import React, { memo, useCallback, useState } from 'react';
import { EdgeProps, getBezierPath, getSmoothStepPath, getStraightPath } from 'reactflow';
import { NetworkLinkData } from './network-link-utils';

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
  selected
}: NetworkLinkEdgeProps) => {
  const { networkColor, networkId } = data;
  
  // Calculate the path based on edge type
  const getPath = useCallback(() => {
    const shape = data?.shape || 'smooth';
    
    switch (shape) {
      case 'straight':
        return getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
      case 'step':
        return getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
      case 'smooth':
      default:
        return getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
    }
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data?.shape]);

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
      {/* Invisible wider path for easier selection */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={Math.max(20, (selected ? 4 : 3) * 4)} // Minimum 20px wide hit area
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
          stroke: networkColor,
          strokeWidth: selected ? 4 : 3,
          pointerEvents: 'none' // Prevent double click events
        }}
        className="react-flow__edge-path"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={edgePath}
        markerEnd={markerEnd && typeof markerEnd === 'object' && 'type' in markerEnd ? `url(#${(markerEnd as any).type})` : undefined}
      />

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