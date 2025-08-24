"use client";
import { useCallback, useEffect, useRef, useState } from 'react';

type UseDiagramInteractionsOpts = {
  mode: any;
  MODES: any;
  nodes: any[];
  setNodes: (updater: any) => void;
  setSelection: (sel: any) => void;
  isNodeLocked: (node: any, all: any[]) => boolean;
  CONTAINER_HEADER_HEIGHT: number;
  NETWORK_HEADER_HEIGHT: number;
};

export function useDiagramInteractions({
  mode,
  MODES,
  nodes,
  setNodes,
  setSelection,
  isNodeLocked,
  CONTAINER_HEADER_HEIGHT,
  NETWORK_HEADER_HEIGHT,
}: UseDiagramInteractionsOpts) {
  // Modifiers & touch state
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [touchDragActive, setTouchDragActive] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);

  // Keyboard tracking
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setCtrlPressed(true);
      if (e.key === 'Shift') setShiftPressed(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setCtrlPressed(false);
      if (e.key === 'Shift') setShiftPressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Touch long-press to enable node dragging on mobile
  const onWrapperTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    try {
      const target = e.target as HTMLElement;
      const nodeEl = target?.closest?.('.react-flow__node');
      if (!nodeEl) return;
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = window.setTimeout(() => {
        setTouchDragActive(true);
      }, 450);
    } catch {}
  }, []);
  const clearTouchState = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setTouchDragActive(false);
  }, []);

  // Click handler on nodes (laisser faire RF quand Shift est pressé)
  const onNodeClick = useCallback((evt: any, node: any, selectNode: (n:any)=>void) => {
    if (mode !== MODES.EDIT) return;
    if (evt?.shiftKey) { return; }
    selectNode(node);
  }, [mode, MODES]);

  // Drag start gating (returns boolean ok)
  const onNodeDragStart = useCallback((evt: any, node: any) => {
    if (mode !== MODES.EDIT) { evt.stopPropagation?.(); return false; }
    // Autoriser le drag si Shift (déplacement entre partitions), ou Ctrl/Meta, ou long-press (mobile)
    const allowDrag = (!!evt?.shiftKey) || (!!evt?.ctrlKey || !!evt?.metaKey) || touchDragActive;
    if (!allowDrag) { evt.stopImmediatePropagation?.(); evt.stopPropagation?.(); return false; }
    if (document.body.classList.contains('resizing-container')) { evt.stopImmediatePropagation?.(); evt.stopPropagation?.(); return false; }

  let locked = false;
  try { locked = isNodeLocked?.(node, nodes) || false; } catch {}
  // Si Shift est maintenu: autoriser le drag intra-conteneur (changement de partition) même si l'auto‑layout du parent est actif
  if (locked && !evt?.shiftKey) { evt.stopImmediatePropagation?.(); evt.stopPropagation?.(); return false; }

    // Alt: détacher du parent en gardant la position absolue
    if (evt?.altKey && node?.parentNode) {
      if (node.type !== 'door') {
        setNodes((nds: any[]) => nds.map((n) => {
          if (n.id !== node.id) return n;
          if (!n.parentNode) return n;
          let x = n.position.x; let y = n.position.y;
          let cur = nds.find(p => p.id === n.parentNode) as any | undefined; let guard=0;
          while (cur && guard++<100) {
            x += cur.position.x;
            y += cur.position.y + (cur.type==='network'?NETWORK_HEADER_HEIGHT:(cur.data?.isContainer?CONTAINER_HEADER_HEIGHT:0));
            cur = cur.parentNode ? nds.find(p=>p.id===cur.parentNode) : undefined;
          }
          return { ...n, parentNode: undefined, extent: undefined, position: { x, y } };
        }));
        setSelection((s: any) => (s && s.id === node.id ? { ...s, parentNode: undefined, extent: undefined } : s));
      }
    }
    return true;
  }, [mode, MODES, touchDragActive, isNodeLocked, nodes, setNodes, setSelection, CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT]);

  // Derived props for ReactFlow
  const rfInteraction = {
  nodesDraggable: mode === MODES.EDIT && (ctrlPressed || shiftPressed || touchDragActive),
  panOnDrag: mode === MODES.EDIT,
  // Laisser la sélection rectangulaire uniquement sur le pane avec Shift (comportement RF par défaut)
  selectionOnDrag: false,
    selectionKeyCode: 'Shift' as const,
  };

  return {
    ctrlPressed,
    shiftPressed,
    touchDragActive,
    onWrapperTouchStart,
    clearTouchState,
    onNodeClick,
    onNodeDragStart,
    rfInteraction,
  } as const;
}
