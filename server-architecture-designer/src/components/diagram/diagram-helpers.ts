import { CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT } from './constants';

export function hexToRgba(hex: string, alpha: number) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  const h = hex.replace('#','');
  const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const v = parseInt(full,16);
  const r=(v>>16)&255,g=(v>>8)&255,b=v&255; return `rgba(${r},${g},${b},${alpha})`;
}

export function autoTextColor(hex?: string): string {
  if (!hex || typeof hex !== 'string') return '#111827';
  const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return '#111827';
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  const srgb = [r, g, b].map(v => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L > 0.6 ? '#111827' : '#ffffff';
}

export function computeAbsolutePosition(node: any, nodes: any[]): { x: number; y: number } {
  let x = node.position.x; let y = node.position.y; let cur = node.parentNode ? nodes.find(n=>n.id===node.parentNode) : null; let guard = 0;
  while (cur && guard++ < 100) {
    x += cur.position.x;
    y += cur.position.y + (cur.type==='network'?NETWORK_HEADER_HEIGHT:(cur.data?.isContainer?CONTAINER_HEADER_HEIGHT:0));
    cur = cur.parentNode ? nodes.find(n=>n.id===cur.parentNode) : null;
  }
  return { x, y };
}

export function exclusiveAuthToggle(
  features: { auth1?: boolean; auth2?: boolean; hourglass?: boolean; firewall?: boolean } = {},
  which: 'auth1' | 'auth2', value: boolean
) {
  const base = { ...(features||{}) } as any;
  if (which === 'auth1') { if (value) { base.auth1=true; base.auth2=false; } else base.auth1=false; }
  else { if (value) { base.auth2=true; base.auth1=false; } else base.auth2=false; }
  return base;
}

export function parentMap(nodes: any[]) { return new Map(nodes.map(n=>[n.id,n.parentNode])); }
export function isAncestor(nodes: any[], maybeAncestorId: string, nodeId: string) {
  const p = parentMap(nodes); let cur = p.get(nodeId); let g=0; while(cur && g++<100){ if(cur===maybeAncestorId) return true; cur = p.get(cur as string); } return false;
}
