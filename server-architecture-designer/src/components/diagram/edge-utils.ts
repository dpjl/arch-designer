// Edge related utilities

// Apply pattern classes / strokeDasharray based on edge.data.pattern
export function applyPatternToEdge(edge: any) {
  const pattern = edge?.data?.pattern;
  if (!pattern) return edge;
  let classNames = (edge.className || '').split(/\s+/).filter(Boolean).filter((c: string) => !/^edge-(?:dashed|anim-dash)$/.test(c));
  const style = { ...(edge.style || {}) } as any;
  if (pattern === 'dashed') { classNames.push('edge-dashed'); style.strokeDasharray = '6 6'; }
  else if (pattern === 'animated') { classNames.push('edge-anim-dash'); style.strokeDasharray = '6 6'; }
  else if (pattern === 'solid') { delete style.strokeDasharray; }
  return { ...edge, className: classNames.join(' '), style };
}
