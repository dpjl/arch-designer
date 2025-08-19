import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
  MarkerType,
  useStore,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  LayoutGrid,
  Eye,
  Pencil,
  Download,
  Upload,
  Save,
  Trash2,
  Wand2,
  Link2,
  Palette,
  Image as ImageIcon,
  Boxes,
  Link as LinkIcon,
  Lock,
  Unlock,
} from "lucide-react";
import * as htmlToImage from "html-to-image";

// =============================
// Modes / constants
// =============================
const MODES = { EDIT: "edit", VIEW: "view", CONNECT: "connect" } as const;

// Edge color modes
const EDGE_COLOR_MODE = { BY_TYPE: "byType", BY_SOURCE: "bySource" } as const;

// Simple Icons CDN for stable brand SVGs
const SI = (name: string) => `https://cdn.simpleicons.org/${name}`;

// Stable helper for MiniMap color (avoid new fn each render)
const miniMapNodeColorFn = (n: any) => n?.data?.color || "#94a3b8";

// Exclusive auth toggler (pure)
function exclusiveAuthToggle(
  features: { auth1?: boolean; auth2?: boolean; hourglass?: boolean } = {},
  which: "auth1" | "auth2",
  value: boolean
) {
  const next = { ...features } as any;
  if (which === "auth1") {
    next.auth1 = value;
    if (value) next.auth2 = false;
  } else {
    next.auth2 = value;
    if (value) next.auth1 = false;
  }
  return next;
}

// =============================
// Catalog (verified HTTPS URLs)
// =============================
const CATALOG = [
  { id: "traefik", label: "Traefik", icon: SI("traefikmesh"), color: "#24A1C1" },
  { id: "nextcloud", label: "Nextcloud", icon: SI("nextcloud"), color: "#0082C9" },
  { id: "homeassistant", label: "Home Assistant", icon: SI("homeassistant"), color: "#41BDF5" },
  { id: "jellyfin", label: "Jellyfin", icon: SI("jellyfin"), color: "#6F3FF5" },
  { id: "proxmox", label: "Proxmox", icon: SI("proxmox"), color: "#E57000" },
  { id: "docker", label: "Docker", icon: SI("docker"), color: "#1D63ED" },
  { id: "kubernetes", label: "Kubernetes", icon: SI("kubernetes"), color: "#326CE5" },
  { id: "nginx", label: "Nginx", icon: SI("nginx"), color: "#119639" },
  { id: "wireguard", label: "WireGuard", icon: SI("wireguard"), color: "#88171A" },
  { id: "grafana", label: "Grafana", icon: SI("grafana"), color: "#F46800" },
  { id: "prometheus", label: "Prometheus", icon: SI("prometheus"), color: "#E6522C" },
  { id: "vaultwarden", label: "Vaultwarden (Bitwarden)", icon: SI("bitwarden"), color: "#175DDC" },
  { id: "gitea", label: "Gitea", icon: SI("gitea"), color: "#609926" },
  { id: "postgresql", label: "PostgreSQL", icon: SI("postgresql"), color: "#336791" },
  { id: "mariadb", label: "MariaDB", icon: SI("mariadb"), color: "#013D57" },
  // Generic shapes (Wikimedia SVGs)
  { id: "server", label: "Server", icon: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Antu_distributor-logo.svg", color: "#64748B" },
  { id: "database", label: "Database", icon: "https://upload.wikimedia.org/wikipedia/commons/3/38/Database-icon.svg", color: "#64748B" },
  { id: "container", label: "Container", icon: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Boxicons-solid_package.svg", color: "#64748B" },
  { id: "user", label: "User", icon: "https://upload.wikimedia.org/wikipedia/commons/9/99/OOjs_UI_icon_userAvatar.svg", color: "#64748B" },
  { id: "network", label: "Network", icon: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Network_Noun_project_1554.svg", color: "#64748B" },
  // Containers (groups)
  { id: "group", label: "Container (Group)", icon: SI("layouts"), color: "#475569" },
] as const;

// =============================
// Decorative tiny icons (WhatsApp-like, flat & colorful)
// =============================
const FlatKey = memo(({ color = "#10B981", ring = "#065F46" }: { color?: string; ring?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
    <circle cx="9" cy="12" r="4.2" fill={color} stroke={ring} strokeWidth="1.5"/>
    <rect x="12.5" y="11.25" width="8" height="1.7" rx="0.85" fill={ring}/>
    <rect x="18.2" y="9.6" width="1.7" height="4.3" rx="0.85" fill={ring}/>
  </svg>
));

const FlatHourglass = memo(({ body = "#F59E0B", frame = "#93370D" }: { body?: string; frame?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
    <rect x="5.8" y="3.2" width="12.4" height="17.6" rx="2.2" ry="2.2" fill="#FEF3C7" stroke={frame} strokeWidth="1.5"/>
    <path d="M8 6h8c0 3-4 4-4 6s4 3 4 6H8c0-3 4-4 4-6s-4-3-4-6z" fill={body}/>
  </svg>
));

// =============================
// Edge coloring helpers
// =============================
const TYPE_COLORS: Record<string, string> = {
  HTTPS: "#06b6d4",
  HTTP: "#f97316",
  MQTT: "#22c55e",
  SSH: "#8b5cf6",
};
const normalizeType = (label?: string) => (label || "").trim().toUpperCase();
const colorForEdge = (edge: any, nodes: any[], mode: string) => {
  if (mode === EDGE_COLOR_MODE.BY_SOURCE) {
    const src = nodes.find((n) => n.id === edge.source);
    return src?.data?.color || "#94a3b8";
    }
  const t = normalizeType(edge.label);
  return TYPE_COLORS[t] || "#94a3b8";
};

// =============================
// Node components
// =============================
const FeaturesIcons = memo(({ features, compact }: any) => {
  const { auth1, auth2, hourglass } = features || {};
  return (
    <div className={`flex items-center gap-1 ${compact ? "scale-90" : ""}`}>
      {auth1 && <FlatKey color="#22C55E" ring="#15803D" />}
      {auth2 && <FlatKey color="#60A5FA" ring="#1D4ED8" />}
      {hourglass && <FlatHourglass body="#F59E0B" frame="#B45309" />}
    </div>
  );
});

const ServiceNode = memo(({ data, isConnectable }: any) => {
  const zoom = useStore((s) => s.transform[2]);
  const { label, icon, color, features = {} } = data || {};
  // Always show text now (was: const showText = zoom >= 0.6)
  const showText = true;
  const borderColor = color || "#94a3b8";
  return (
    <div className="group rounded-2xl shadow-lg bg-white p-2 w-[220px] hover:shadow-xl transition overflow-hidden border" style={{ borderColor }}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400/70" isConnectable={isConnectable} />
      <div className="flex items-center gap-2">
        {icon ? <img src={icon} alt="" className="h-8 w-8 object-contain rounded" /> : <div className="h-8 w-8 rounded bg-gray-200" />}
        <div className="flex-1 min-w-0">
          {showText && <div className="font-semibold text-gray-800 leading-tight truncate" title={label || "Unnamed"}>{label || "Unnamed"}</div>}
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: borderColor }} />
            <FeaturesIcons features={features} compact={!showText} />
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400/70" isConnectable={isConnectable} />
    </div>
  );
});

const ContainerNode = memo(({ data, selected }: any) => {
  const { label = "Container", color = "#475569", width = 520, height = 320, locked = false } = data || {};
  const border = selected ? `2px dashed ${color}` : `1px solid ${color}`;
  return (
    <div className="rounded-2xl bg-white/80 overflow-hidden" style={{ width, height, border }}>
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b" style={{ borderColor: color }}>
        <Boxes className="h-4 w-4" />
        <div className="font-medium text-sm truncate" title={label}>{label}</div>
        <div className="ml-auto text-xs inline-flex items-center gap-1 text-slate-600">
          {locked ? <Lock className="h-3.5 w-3.5"/> : <Unlock className="h-3.5 w-3.5"/>}
        </div>
      </div>
      {/* children render inside */}
    </div>
  );
});

const nodeTypes = { service: ServiceNode, container: ContainerNode } as const;

// =============================
// UI bits
// =============================
function Toolbar({ mode, setMode, onSave, onLoad, onExportPng, onClear, onAutoLayout }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-2xl bg-white/90 backdrop-blur shadow p-1 flex items-center">
        <Button variant={mode === MODES.EDIT ? "default" : "ghost"} onClick={() => setMode(MODES.EDIT)} className="rounded-xl"><Pencil className="h-4 w-4 mr-2"/>Edit</Button>
        <Button variant={mode === MODES.VIEW ? "default" : "ghost"} onClick={() => setMode(MODES.VIEW)} className="rounded-xl"><Eye className="h-4 w-4 mr-2"/>View</Button>
        <Button variant={mode === MODES.CONNECT ? "default" : "ghost"} onClick={() => setMode(MODES.CONNECT)} className="rounded-xl"><LinkIcon className="h-4 w-4 mr-2"/>Connect</Button>
      </div>
      <div className="rounded-2xl bg-white/90 backdrop-blur shadow p-1 flex items-center">
        <Button variant="ghost" onClick={onSave} className="rounded-xl" title="Save to local storage"><Save className="h-4 w-4 mr-2"/>Save</Button>
        <Button variant="ghost" onClick={onLoad} className="rounded-xl" title="Load from local storage"><Upload className="h-4 w-4 mr-2"/>Load</Button>
        <Button variant="ghost" onClick={onExportPng} className="rounded-xl" title="Export as PNG"><Download className="h-4 w-4 mr-2"/>PNG</Button>
        <Button variant="ghost" onClick={onAutoLayout} className="rounded-xl" title="Auto layout"><Wand2 className="h-4 w-4 mr-2"/>Auto</Button>
        <Button variant="destructive" onClick={onClear} className="rounded-xl"><Trash2 className="h-4 w-4 mr-2"/>Clear</Button>
      </div>
    </div>
  );
}

function PaletteItem({ entry, onDragStart }: any) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, entry)}
      className="flex items-center gap-3 rounded-xl border bg-white/90 backdrop-blur p-2 shadow hover:shadow-md cursor-grab active:cursor-grabbing"
      title={entry.label}
    >
      <img src={entry.icon} alt="" className="h-8 w-8 object-contain" />
      <div>
        <div className="font-medium leading-tight">{entry.label}</div>
        <div className="text-xs text-muted-foreground">Drag to canvas</div>
      </div>
    </div>
  );
}

function PropertiesPanel({ selection, onChange, onDelete }: any) {
  if (!selection) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">No selection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Select a node or edge to edit its properties.</CardContent>
      </Card>
    );
  }

  const isNode = selection.type === "node";
  const isContainer = isNode && typeof selection.data?.width === "number" && typeof selection.data?.height === "number";

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{isNode ? "Node" : "Edge"} properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isNode ? (
          <>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={selection.data.label || ""} onChange={(e) => onChange({ data: { ...selection.data, label: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input type="color" value={selection.data.color || "#94a3b8"} onChange={(e) => onChange({ data: { ...selection.data, color: e.target.value } })} />
            </div>
            {!isContainer && (
              <div className="space-y-1">
                <Label>Features</Label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!selection.data.features?.auth1}
                      onCheckedChange={(v) => onChange({ data: { ...selection.data, features: exclusiveAuthToggle(selection.data.features, "auth1", !!v) } })}
                    />
                    <span className="text-sm">Auth simple</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!selection.data.features?.auth2}
                      onCheckedChange={(v) => onChange({ data: { ...selection.data, features: exclusiveAuthToggle(selection.data.features, "auth2", !!v) } })}
                    />
                    <span className="text-sm">Auth double</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!selection.data.features?.hourglass}
                      onCheckedChange={(v) => onChange({ data: { ...selection.data, features: { ...(selection.data.features || {}), hourglass: !!v } } })}
                    />
                    <span className="text-sm">Sablier</span>
                  </div>
                </div>
              </div>
            )}
            {isContainer && (
              <>
                <div className="space-y-1">
                  <Label>Container size (px)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" value={selection.data.width} onChange={(e) => onChange({ data: { ...selection.data, width: Number(e.target.value) || 0 } })} />
                    <Input type="number" value={selection.data.height} onChange={(e) => onChange({ data: { ...selection.data, height: Number(e.target.value) || 0 } })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!selection.data.locked}
                    onCheckedChange={(v) => onChange({ data: { ...selection.data, locked: !!v } })}
                  />
                  <span className="text-sm">Verrouiller le container</span>
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label>Icon URL</Label>
              <Input value={selection.data.icon || ""} onChange={(e) => onChange({ data: { ...selection.data, icon: e.target.value } })} placeholder="https://..." />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={selection.label || ""} onChange={(e) => onChange({ label: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Style (stroke color)</Label>
              <Input value={selection.style?.stroke || "#94a3b8"} type="color" onChange={(e) => onChange({ style: { ...(selection.style || {}), stroke: e.target.value } })} />
            </div>
          </>
        )}
        <div className="pt-2">
          <Button variant="destructive" className="w-full" onClick={onDelete}><Trash2 className="h-4 w-4 mr-2"/>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Legend() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Legend</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground space-y-1">
        <div>• <b>Create a link</b>: drag from a node handle to another handle, or switch to <em>Connect</em> mode then click source → target.</div>
        <div>• <b>Containers</b>: drag a "Container (Group)" onto canvas, then drop services inside. Dragging a node inside will snap it to the container.</div>
        <div>• Double-click a node/edge to quick-edit label</div>
        <div>• Use Save/Load to keep multiple diagrams</div>
        <div>• Switch to View mode to lock the layout</div>
      </CardContent>
    </Card>
  );
}

function AutoLayoutButton({ onClick }: any) {
  return (
    <Button variant="outline" onClick={onClick} className="w-full"><LayoutGrid className="h-4 w-4 mr-2"/>Smart layout</Button>
  );
}

// =============================
// Diagnostics ("tests")
// =============================
function runDiagnostics() {
  const results: { name: string; pass: boolean }[] = [];
  results.push({ name: "Catalog entries valid (https)", pass: CATALOG.every((e) => typeof e.icon === "string" && e.icon.startsWith("http")) });
  results.push({ name: "nodeTypes include service & container", pass: ["service", "container"].every((k) => Object.keys(nodeTypes).includes(k)) });
  // Auth exclusivity
  const a1 = exclusiveAuthToggle({}, "auth1", true); const a2 = exclusiveAuthToggle(a1, "auth2", true);
  results.push({ name: "Auth flags mutually exclusive", pass: !!a2.auth2 && !a2.auth1 });
  // MiniMap color fn returns fallback when no color
  results.push({ name: "MiniMap color fallback", pass: miniMapNodeColorFn({ data: {} }) === "#94a3b8" });
  return results;
}

function DiagnosticsPanel() {
  const [results, setResults] = useState<{ name: string; pass: boolean }[]>([]);
  useEffect(() => { setResults(runDiagnostics()); }, []);
  const passCount = results.filter((r) => r.pass).length;
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-xs text-muted-foreground">Smoke checks to prevent common runtime issues.</div>
        <div className="text-xs">{passCount}/{results.length} tests passed</div>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center justify-between rounded-lg border p-2 ${r.pass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <span>{r.name}</span>
              <span className={`text-xs ${r.pass ? "text-green-700" : "text-red-700"}`}>{r.pass ? "PASS" : "FAIL"}</span>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={() => setResults(runDiagnostics())}>Run again</Button>
      </CardContent>
    </Card>
  );
}

// =============================
// Canvas
// =============================
function DiagramCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<typeof MODES[keyof typeof MODES]>(MODES.EDIT);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [edgeColorMode, setEdgeColorMode] = useState<string>(EDGE_COLOR_MODE.BY_TYPE);

  // Initial graph
  const initialNodes = useMemo(
    () => [
      { id: "traefik-1", type: "service", position: { x: 200, y: 40 }, data: { label: "Traefik", icon: CATALOG.find(c => c.id === "traefik")!.icon, color: CATALOG.find(c => c.id === "traefik")!.color, features: { auth1: true } } },
      { id: "nextcloud-1", type: "service", position: { x: 80, y: 240 }, data: { label: "Nextcloud", icon: CATALOG.find(c => c.id === "nextcloud")!.icon, color: CATALOG.find(c => c.id === "nextcloud")!.color, features: { auth2: true } } },
      { id: "ha-1", type: "service", position: { x: 360, y: 240 }, data: { label: "Home Assistant", icon: CATALOG.find(c => c.id === "homeassistant")!.icon, color: CATALOG.find(c => c.id === "homeassistant")!.color, features: { hourglass: true } } },
      { id: "group-1", type: "container", position: { x: 580, y: 60 }, data: { label: "Home Lab Rack", color: "#475569", width: 520, height: 320, locked: false }, style: { width: 520, height: 320 } },
    ],
    []
  );

  const initialEdges = useMemo(
    () => [
      { id: "e1-2", source: "traefik-1", target: "nextcloud-1", animated: true, label: "HTTPS", style: { stroke: "#06b6d4" }, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e1-3", source: "traefik-1", target: "ha-1", label: "HTTPS", markerEnd: { type: MarkerType.ArrowClosed } },
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any);
  const [selection, setSelection] = useState<any>(null);

  // Helpers for ancestry
  const parentMapOf = (ns: any[]) => new Map(ns.map((n) => [n.id, n.parentNode]));
  const isAncestor = (ns: any[], maybeAncestorId: string, nodeId: string) => {
    const pmap = parentMapOf(ns); let cur = pmap.get(nodeId); let guard = 0;
    while (cur && guard++ < 100) { if (cur === maybeAncestorId) return true; cur = pmap.get(cur as string); }
    return false;
  };

  // Compute zIndex based on depth so children are always above containers
  useEffect(() => {
    const pmap = parentMapOf(nodes);
    const depthOf = (id: string) => { let d = 0, p = pmap.get(id) as string | undefined, guard = 0; while (p && guard++ < 100) { d++; p = pmap.get(p); } return d; };
    const updates: Record<string, number> = {};
    nodes.forEach((n) => {
      const d = depthOf(n.id);
      const targetZ = n.type === "container" ? d * 10 : d * 10 + 1;
      const currentZ = (n.style?.zIndex as number) ?? 0;
      if (currentZ !== targetZ) updates[n.id] = targetZ;
    });
    if (Object.keys(updates).length) {
      setNodes((nds) => nds.map((n) => (updates[n.id] !== undefined ? { ...n, style: { ...(n.style || {}), zIndex: updates[n.id] } } : n)));
    }
  }, [nodes, setNodes]);

  // Stable edge addition + auto color
  const addDefaultEdge = useCallback((params: any) => {
    setEdges((eds) => {
      const e = { ...params, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } } as any;
      const stroke = colorForEdge(e, nodes, edgeColorMode);
      return addEdge({ ...e, style: { ...(e.style || {}), stroke } }, eds);
    });
  }, [setEdges, nodes, edgeColorMode]);

  const onConnect = useCallback((params: any) => addDefaultEdge(params), [addDefaultEdge]);

  // Color edges when mode or relevant data changes
  useEffect(() => {
    setEdges((eds) => eds.map((e) => {
      const stroke = colorForEdge(e, nodes, edgeColorMode);
      if (e.style?.stroke === stroke) return e;
      return { ...e, style: { ...(e.style || {}), stroke } };
    }));
  }, [edgeColorMode, nodes, setEdges]);

  // Container hit test — with self/descendant exclusion to prevent cycles
  const findContainerAt = useCallback((absPos: { x: number; y: number }, excludeId?: string) => {
    const containers = nodes.filter((n) => n.type === "container" && n.id !== excludeId);
    for (const c of containers) {
      const width = (c.data?.width ?? c.style?.width ?? 520) as number;
      const height = (c.data?.height ?? c.style?.height ?? 320) as number;
      if (absPos.x >= c.position.x && absPos.y >= c.position.y && absPos.x <= c.position.x + width && absPos.y <= c.position.y + height) {
        if (excludeId && isAncestor(nodes, excludeId, c.id)) continue; // don't allow parenting into own descendant
        return c;
      }
    }
    return null;
  }, [nodes]);

  // DnD handlers
  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const bounds = reactFlowWrapper.current!.getBoundingClientRect();
    const id = (event.dataTransfer as DataTransfer).getData("application/x-id");
    const label = (event.dataTransfer as DataTransfer).getData("application/x-label");
    const icon = (event.dataTransfer as DataTransfer).getData("application/x-icon");
    const color = (event.dataTransfer as DataTransfer).getData("application/x-color");
    const absPos = { x: (event as any).clientX - bounds.left, y: (event as any).clientY - bounds.top };

    if (id === "group") {
      const containerId = `group-${Math.random().toString(36).slice(2, 8)}`;
      const width = 520, height = 320;
      const newNode = { id: containerId, type: "container", position: absPos, data: { label: "Container", color: "#475569", width, height, locked: false }, style: { width, height } };
      setNodes((nds) => nds.concat(newNode));
      return;
    }

    const parent = findContainerAt(absPos);
    const position = parent ? { x: absPos.x - parent.position.x - 20, y: absPos.y - parent.position.y - 40 } : absPos;
    const newNode = { id: `${id}-${Math.random().toString(36).slice(2, 8)}`, type: "service", position, data: { label, icon, color, features: {} }, parentNode: (parent as any)?.id, extent: parent ? "parent" : undefined };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, findContainerAt]);

  const onDragOver = useCallback((event: DragEvent) => { event.preventDefault(); (event.dataTransfer as DataTransfer).dropEffect = "move"; }, []);

  const onNodeDragStop = useCallback((_: any, node: any) => {
    // Re-parent both services and containers, but avoid cycles
    const parentNode = node.parentNode ? nodes.find((n) => n.id === node.parentNode) : null;
    const absPos = parentNode ? { x: node.position.x + parentNode.position.x, y: node.position.y + parentNode.position.y } : node.position;
    const container = findContainerAt(absPos, node.id);

    setNodes((nds) => nds.map((n) => {
      if (n.id !== node.id) return n;
      if (container) {
        // Respect lock on target container (cannot drop into locked)
        if (container.data?.locked) return n;
        return {
          ...n,
          parentNode: (container as any).id,
          extent: "parent",
          position: { x: absPos.x - (container as any).position.x - 20, y: absPos.y - (container as any).position.y - 40 },
        };
      }
      return { ...n, parentNode: undefined, extent: undefined };
    }));
  }, [findContainerAt, nodes, setNodes]);

  // Selection / connect
  const onNodeClick = useCallback((_: any, node: any) => {
    if (mode === MODES.CONNECT) {
      if (!connectSource) setConnectSource(node.id);
      else if (connectSource !== node.id) { addDefaultEdge({ source: connectSource, target: node.id }); setConnectSource(null); }
      return;
    }
    if (mode === MODES.EDIT) setSelection({ ...node, type: "node" });
  }, [mode, connectSource, addDefaultEdge]);

  const onEdgeClick = useCallback((_: any, edge: any) => { if (mode === MODES.EDIT) setSelection({ ...edge, type: "edge" }); }, [mode]);

  const updateSelection = useCallback((patch: any) => {
    if (!selection) return;
    if (selection.type === "node") {
      setNodes((nds) => nds.map((n) => (n.id === selection.id ? { ...n, ...patch, data: { ...n.data, ...(patch.data || {}) }, draggable: patch?.data?.locked !== undefined ? !patch.data.locked : n.draggable } : n)));
      setSelection((s: any) => ({ ...s, ...patch, data: { ...s.data, ...(patch.data || {}) } }));
      // If node color changed and mode is BY_SOURCE, recolor outgoing edges
      if (patch?.data?.color && edgeColorMode === EDGE_COLOR_MODE.BY_SOURCE) {
        setEdges((eds) => eds.map((e) => e.source === selection.id ? { ...e, style: { ...(e.style || {}), stroke: patch.data.color } } : e));
      }
    } else {
      setEdges((eds) => eds.map((e) => (e.id === selection.id ? { ...e, ...patch } : e)));
      setSelection((s: any) => ({ ...s, ...patch }));
      // If edge label changed and mode is BY_TYPE, recolor this edge
      if (patch?.label && edgeColorMode === EDGE_COLOR_MODE.BY_TYPE) {
        setEdges((eds) => eds.map((e) => e.id === selection.id ? { ...e, style: { ...(e.style || {}), stroke: colorForEdge({ ...e, label: patch.label }, nodes, edgeColorMode) } } : e));
      }
    }
  }, [selection, edgeColorMode, nodes]);

  const deleteSelection = useCallback(() => {
    if (!selection) return;
    if (selection.type === "node") setNodes((nds) => nds.filter((n) => n.id !== selection.id));
    else setEdges((eds) => eds.filter((e) => e.id !== selection.id));
    setSelection(null);
  }, [selection]);

  const onNodeDoubleClick = useCallback((_: any, node: any) => { if (mode !== MODES.EDIT) return; const label = prompt("Label", node.data?.label || ""); if (label !== null) setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label } } : n))); }, [mode]);
  const onEdgeDoubleClick = useCallback((_: any, edge: any) => { if (mode !== MODES.EDIT) return; const label = prompt("Label", edge.label || ""); if (label !== null) setEdges((eds) => eds.map((e) => (e.id === edge.id ? { ...e, label } : e))); }, [mode]);

  // Persistence
  const onSave = useCallback(() => { localStorage.setItem("server-arch:nodes", JSON.stringify(nodes)); localStorage.setItem("server-arch:edges", JSON.stringify(edges)); }, [nodes, edges]);
  const onLoad = useCallback(() => { const n = JSON.parse(localStorage.getItem("server-arch:nodes") || "null"); const e = JSON.parse(localStorage.getItem("server-arch:edges") || "null"); if (n && e) { setNodes(n); setEdges(e); setSelection(null); } }, [setNodes, setEdges]);
  const onClear = useCallback(() => { setNodes([]); setEdges([]); setSelection(null); setConnectSource(null); }, []);

  // Export
  const onExportPng = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    const node = reactFlowWrapper.current.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!node) return;
    const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "white" });
    const link = document.createElement("a");
    link.download = `architecture-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  // Auto-layout (simple DAG layering)
  const onAutoLayout = useCallback(() => {
    const byInbound = new Map<string, number>();
    nodes.forEach((n) => byInbound.set(n.id, 0));
    edges.forEach((e) => byInbound.set(e.target as string, (byInbound.get(e.target as string) || 0) + 1));
    const ranks = new Map<string, number>();
    const queue = nodes.filter((n) => (byInbound.get(n.id) || 0) === 0);
    queue.forEach((n) => ranks.set(n.id, 0));
    let idx = 0;
    while (idx < queue.length) {
      const n = queue[idx++];
      const r = ranks.get(n.id) || 0;
      edges.filter((e) => e.source === n.id).forEach((e) => {
        const cur = ranks.get(e.target as string);
        const next = Math.max(cur ?? 0, r + 1);
        ranks.set(e.target as string, next);
        byInbound.set(e.target as string, (byInbound.get(e.target as string) || 1) - 1);
        if ((byInbound.get(e.target as string) || 0) === 0) {
          const targetNode = nodes.find((x) => x.id === e.target);
          if (targetNode) queue.push(targetNode);
        }
      });
    }
    const layers = new Map<number, string[]>();
    nodes.forEach((n) => { const r = ranks.get(n.id) ?? 0; if (!layers.has(r)) layers.set(r, []); (layers.get(r) as string[]).push(n.id); });
    const spacingX = 260, spacingY = 180;
    setNodes(nodes.map((n) => { const r = ranks.get(n.id) ?? 0; const layer = (layers.get(r) || []) as string[]; const i = layer.indexOf(n.id); return { ...n, position: { x: 80 + i * spacingX, y: 40 + r * spacingY } }; }));
  }, [nodes, edges, setNodes]);

  // Drag from palette
  const onEntryDragStart = (event: DragEvent, entry: any) => {
    (event.dataTransfer as DataTransfer).setData("application/x-id", entry.id);
    (event.dataTransfer as DataTransfer).setData("application/x-label", entry.label);
    (event.dataTransfer as DataTransfer).setData("application/x-icon", entry.icon);
    (event.dataTransfer as DataTransfer).setData("application/x-color", entry.color);
    (event.dataTransfer as DataTransfer).effectAllowed = "move";
  };

  const viewLocked = mode === MODES.VIEW;

  return (
    <div className="h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100">
      <TooltipProvider>
        <div className="h-16 px-4 border-b bg-white/70 backdrop-blur flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow"><LayoutGrid className="h-5 w-5"/></div>
            <div className="text-lg font-semibold">Server Architecture Designer</div>
            {mode === MODES.CONNECT && (
              <div className="ml-4 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2">
                <LinkIcon className="h-3.5 w-3.5"/> Click a source node, then a target node to create a link.
              </div>
            )}
          </div>
          <Toolbar
            mode={mode}
            setMode={(m: any) => { setMode(m); setConnectSource(null); }}
            onSave={onSave}
            onLoad={onLoad}
            onExportPng={onExportPng}
            onClear={onClear}
            onAutoLayout={onAutoLayout}
          />
        </div>

        <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-64px)]">
          {/* Palette */}
          <div className="col-span-3 space-y-4 overflow-y-auto pr-1">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Palette</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {CATALOG.map((entry) => (
                    <PaletteItem key={entry.id} entry={entry} onDragStart={onEntryDragStart as any} />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Legend />
            <AutoLayoutButton onClick={onAutoLayout} />
            <DiagnosticsPanel />
          </div>

          {/* Canvas */}
          <div className="col-span-6">
            <Card className="rounded-2xl h-full">
              <CardContent className="h-full p-0">
                <div ref={reactFlowWrapper} className={`h-full ${viewLocked ? "pointer-events-auto" : ""}`}>
                  <ReactFlow
                    id="server-arch-flow"
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onDrop={onDrop as any}
                    onDragOver={onDragOver as any}
                    onNodeClick={onNodeClick}
                    onNodeDragStop={onNodeDragStop}
                    onEdgeClick={onEdgeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onEdgeDoubleClick={onEdgeDoubleClick}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable={!viewLocked}
                    nodesConnectable={!viewLocked}
                    elementsSelectable={!viewLocked}
                    edgesFocusable={!viewLocked}
                    edgesUpdatable={!viewLocked}
                    className="rounded-2xl"
                  >
                    <MiniMap
                      pannable
                      zoomable
                      className="!rounded-xl !bg-white/80"
                      nodeStrokeWidth={1}
                      nodeColor={miniMapNodeColorFn}
                    />
                    <Controls showInteractive={false} className="!rounded-xl" />
                    <Background variant={BackgroundVariant.Lines} gap={24} />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Properties + Options */}
          <div className="col-span-3 space-y-4 overflow-y-auto pl-1">
            <PropertiesPanel selection={selection} onChange={updateSelection} onDelete={deleteSelection} />

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Edge coloring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edgeColor" checked={edgeColorMode===EDGE_COLOR_MODE.BY_TYPE} onChange={() => setEdgeColorMode(EDGE_COLOR_MODE.BY_TYPE)} />
                    <span>By <b>type</b> (HTTP/HTTPS/MQTT/SSH)</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edgeColor" checked={edgeColorMode===EDGE_COLOR_MODE.BY_SOURCE} onChange={() => setEdgeColorMode(EDGE_COLOR_MODE.BY_SOURCE)} />
                    <span>By <b>source node color</b></span>
                  </label>
                </div>
                <div className="text-xs text-muted-foreground">
                  Type palette: HTTPS <span style={{background:TYPE_COLORS.HTTPS}} className="inline-block w-3 h-3 rounded-full align-middle"/> · HTTP <span style={{background:TYPE_COLORS.HTTP}} className="inline-block w-3 h-3 rounded-full align-middle"/> · MQTT <span style={{background:TYPE_COLORS.MQTT}} className="inline-block w-3 h-3 rounded-full align-middle"/> · SSH <span style={{background:TYPE_COLORS.SSH}} className="inline-block w-3 h-3 rounded-full align-middle"/>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Canvas tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4"/>
                  <span>Use node color picker to theme services</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4"/>
                  <span>Connect services by dragging between handles or using Connect mode</span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4"/>
                  <span>Replace icons with your own URLs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}

// =============================
// App wrapper (single provider)
// =============================
export default function App() {
  return (
    <ReactFlowProvider>
      <div className="min-h-screen w-full">
        <DiagramCanvas />
      </div>
    </ReactFlowProvider>
  );
}
