import { CatalogEntry } from '@/types/diagram';

// Central catalog of draggable palette entries.
// If adding new entries, keep icons HTTPS safe (SVG strings or trusted CDN) and categorize properly.
const SI = (name: string) => `https://cdn.simpleicons.org/${name}`;

export const CATALOG: readonly CatalogEntry[] = [
  { id: 'traefik', label: 'Traefik', icon: SI('traefikproxy'), color: '#24A1C1', category: 'service' },
  { id: 'nextcloud', label: 'Nextcloud', icon: SI('nextcloud'), color: '#0082C9', category: 'service' },
  { id: 'homeassistant', label: 'Home Assistant', icon: SI('homeassistant'), color: '#41BDF5', category: 'service' },
  { id: 'jellyfin', label: 'Jellyfin', icon: SI('jellyfin'), color: '#6F3FF5', category: 'service' },
  { id: 'proxmox', label: 'Proxmox', icon: SI('proxmox'), color: '#E57000', category: 'service' },
  { id: 'docker', label: 'Docker', icon: SI('docker'), color: '#1D63ED', category: 'service' },
  { id: 'kubernetes', label: 'Kubernetes', icon: SI('kubernetes'), color: '#326CE5', category: 'service' },
  { id: 'nginx', label: 'Nginx', icon: SI('nginx'), color: '#119639', category: 'service' },
  { id: 'wireguard', label: 'WireGuard', icon: SI('wireguard'), color: '#88171A', category: 'service' },
  { id: 'grafana', label: 'Grafana', icon: SI('grafana'), color: '#F46800', category: 'service' },
  { id: 'prometheus', label: 'Prometheus', icon: SI('prometheus'), color: '#E6522C', category: 'service' },
  { id: 'vaultwarden', label: 'Vaultwarden (Bitwarden)', icon: SI('bitwarden'), color: '#175DDC', category: 'service' },
  { id: 'gitea', label: 'Gitea', icon: SI('gitea'), color: '#609926', category: 'service' },
  { id: 'postgresql', label: 'PostgreSQL', icon: SI('postgresql'), color: '#336791', category: 'service' },
  { id: 'mariadb', label: 'MariaDB', icon: SI('mariadb'), color: '#013D57', category: 'service' },
  // Generic
  { id: 'server', label: 'Server', icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='none' stroke='currentColor' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'><rect x='8' y='10' width='48' height='30' rx='4' ry='4' fill='%23f8fafc' stroke='%23474f5a'/><circle cx='22' cy='25' r='4' fill='%23474f5a'/><path d='M8 40h48' stroke='%23474f5a'/><rect x='26' y='44' width='12' height='8' rx='2' fill='%23474f5a'/></svg>", color: '#64748B', category: 'generic' },
  { id: 'database', label: 'Database', icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><ellipse cx='32' cy='14' rx='20' ry='8' fill='%23f8fafc' stroke='%23474f5a' stroke-width='4'/><path d='M12 14v28c0 4.4 9 8 20 8s20-3.6 20-8V14' fill='%23f8fafc' stroke='%23474f5a' stroke-width='4'/><path d='M12 30c0 4.4 9 8 20 8s20-3.6 20-8' stroke='%23474f5a' stroke-width='4' fill='none'/><path d='M12 22c0 4.4 9 8 20 8s20-3.6 20-8' stroke='%23474f5a' stroke-width='4' fill='none'/></svg>", color: '#64748B', category: 'generic' },
  { id: 'container', label: 'Container (shape)', icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect x='8' y='16' width='48' height='32' rx='4' ry='4' fill='%23f8fafc' stroke='%23474f5a' stroke-width='4'/><path stroke='%23474f5a' stroke-width='4' d='M20 16v32M32 16v32M44 16v32'/></svg>", color: '#64748B', category: 'generic' },
  { id: 'user', label: 'User', icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><circle cx='32' cy='22' r='12' fill='%23f1f5f9' stroke='%23474f5a' stroke-width='4'/><path d='M12 54c2-12 12-18 20-18s18 6 20 18' fill='%23f1f5f9' stroke='%23474f5a' stroke-width='4'/></svg>", color: '#64748B', category: 'generic' },
  { id: 'network', label: 'Network', icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><circle cx='32' cy='32' r='28' fill='%23f8fafc' stroke='%23474f5a' stroke-width='4'/><circle cx='32' cy='32' r='6' fill='%23474f5a'/><path d='M32 6v20M32 38v20M6 32h20M38 32h20M14 14l14 14M36 36l14 14M50 14 36 28M28 36 14 50' stroke='%23474f5a' stroke-width='4' fill='none'/></svg>", color: '#64748B', category: 'generic' },
  // Security
  { id: 'door', label: 'Firewall Door', icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect x='14' y='46' width='36' height='6' rx='3' fill='%23000000'/><path d='M20 46V30a12 12 0 0 1 24 0v16' fill='%23ffffff' stroke='%23000000' stroke-width='4' stroke-linejoin='round'/><path d='M26 34h12M26 38h12M26 42h12' stroke='%23000000' stroke-width='3'/></svg>", color: '#111827', category: 'security' },
  // Group container
  { id: 'group', label: 'Container (Group)', icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect x='6' y='14' width='52' height='36' rx='8' ry='8' fill='%23ffffff' stroke='%23475569' stroke-width='4'/><rect x='6' y='14' width='52' height='10' rx='8' ry='8' fill='%23e2e8f0' stroke='%23cbd5e1' stroke-width='0'/><circle cx='14' cy='19' r='2' fill='%2394a3b8'/><rect x='20' y='17' width='24' height='4' rx='2' fill='%23475569'/></svg>", color: '#475569', category: 'container' },
] as const;

export type CatalogId = (typeof CATALOG)[number]['id'];
