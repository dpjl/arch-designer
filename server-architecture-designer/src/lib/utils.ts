import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Contrast-aware text color from background hex
export function autoTextColor(hex?: string): string {
  if (!hex) return '#0f172a';
  const h = hex.replace('#','');
  const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const int = parseInt(full,16);
  const r=(int>>16)&255, g=(int>>8)&255, b=int&255;
  // luminance approximation
  const lum = 0.2126*r + 0.7152*g + 0.0722*b;
  return lum > 150 ? '#0f172a' : '#f8fafc';
}
