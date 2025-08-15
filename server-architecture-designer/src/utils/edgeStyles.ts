// Edge styling & color utilities
export const EDGE_COLOR_MODE = {
  BY_TYPE: 'BY_TYPE',
  BY_SOURCE: 'BY_SOURCE'
} as const;

export const TYPE_COLORS: Record<string,string> = {
  HTTPS: '#06b6d4',
  HTTP: '#f97316',
  MQTT: '#22c55e',
  SSH: '#8b5cf6'
};

export const normalizeType = (label?: string) => (label || '').trim().toUpperCase();

export const colorForEdge = (edge: any, nodes: any[], mode: string) => {
  if (mode === EDGE_COLOR_MODE.BY_SOURCE) {
    const src = nodes.find((n) => n.id === edge.source);
    return src?.data?.color || '#94a3b8';
  }
  const t = normalizeType(edge.label);
  return TYPE_COLORS[t] || '#94a3b8';
};

// Apply pattern utility
export const applyPatternToEdge = (e: any) => {
  const pattern = e?.data?.pattern;
  if (!pattern) return e;
  let classNames = (e.className || '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((c: string) => !/^edge-(?:dashed|anim-dash)$/.test(c));
  const style = { ...(e.style || {}) } as any;
  if (pattern === 'dashed') { classNames.push('edge-dashed'); style.strokeDasharray = '6 6'; }
  else if (pattern === 'animated') { classNames.push('edge-anim-dash'); style.strokeDasharray = '6 6'; }
  else if (pattern === 'solid') { delete style.strokeDasharray; }
  return { ...e, className: classNames.join(' '), style };
};
