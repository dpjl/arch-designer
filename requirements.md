# Server Architecture Designer — Requirements

This document concisely lists the currently implemented capabilities of the web application.

## Overview
- Interactive canvas to design server/application architectures using nodes and connections.
- Built on React Flow with custom node types (service, container, door).

## Core Features
- Drag-and-drop palette to add services, containers, and doors to the canvas.
- Smart placement: dropped items land under the cursor (zoom and pan aware).
- Parenting: auto-detect target container when dropping or dragging; prevents parenting cycles.
- Nesting: containers can contain services and other containers (multi-level nesting supported).

## Node Types
- Service node
  - Icon, label, color; optional firewall ring effect.
  - Connectable from all sides (Top/Bottom/Left/Right) with enlarged handles.
  - Instances: compact count badge; per-instance id and auth (none/simple/double) editable in properties.
- Container node
  - Header with icon and title; resizable via handles; lock/unlock.
  - Can contain children; header height reserved inside; optional firewall ring.
- Door node (container wall gate)
  - Snaps to nearest wall of its parent container and stays constrained along it.
  - Visual: white panel with black side posts and a warning barrier; optional lock icon; allowed label.
  - Fine-tuning offset (single slider) applied to the active wall; immediate re-snap on change.

### Node properties by type
- Service
  - data: { label, icon, color, features, isContainer:false, instances?: Array<{ id?: string, auth?: 'auth1'|'auth2' }> }
  - style: { borderColor via color, background via bgColor/bgOpacity when present }
- Container
  - data: { label, color, bgColor, bgOpacity, isContainer:true, width, height, locked, features }
  - style: { width, height, zIndex (depth-based) }
  - interactions: resize handles; auto-fit; detach from parent
- Door
  - data: { isDoor:true, label (displayed as allow), allow, width, scale, lockedIcon, side, offset, offsets }
  - layout: anchored to parent container’s active wall, position snaps on drag and offset changes

## Editing & Interaction
- Selection: shows a property panel for nodes and edges.
- Properties — node
  - Label, icon, colors (border/background), background opacity.
  - Container toggling and size; lock/unlock; auto-fit to children; detach from parent.
  - Door: width, scale, lock icon toggle, allowed text, wall offset.
- Properties — edge
  - Shape (smooth/straight/step), pattern (solid/dashed/animated), stroke width, color.
- Connecting
  - Large connection handles for easier linking; visible on selection.
  - Doors are connectable (central handle) for clear “through-door” routing.
  - Loose connection mode: easier drop onto targets.
- Keyboard
  - Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Y / Shift+Z).

## Layout, Layers, and Visuals
- Depth layering guarantees parent < child ordering at all times (including nested containers).
- Selecting a container does not raise it above its children.
- Mini-map, controls, and background grid lines for navigation.

## Persistence & Export
- Save/Load to browser localStorage (nodes and edges).
- Automatic history persistence for undo/redo.
- Export PNG (high-DPI) of the current canvas.
- Export JSON file with { nodes, edges }.
- Import JSON file to replace the current graph; history reset to imported state.

## Constraints & Safeguards
- Container resizing avoids position jumps for nested containers (position remains relative to parent).
- Door placement is constrained to the container’s ring band and respects wall snapping.
- Cycle prevention when (re)parenting nodes into containers.

## UI Panels
- Left: palette (services and containers) with drag sources.
- Right: properties panel (contextual to selection) with actions and sliders.
