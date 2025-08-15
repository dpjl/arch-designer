export const DEFAULT_BORDER_LIGHT = '#94a3b8'; // slate-400
export const DEFAULT_BORDER_DARK = '#64748b';  // slate-500
export const DEFAULT_BG_LIGHT = '#ffffff';
export const DEFAULT_BG_DARK = '#1e293b'; // slate-800

export function isAuto(value: any): boolean {
  return value === undefined || value === null || value === '' || value === 'auto';
}

export function effectiveBorderColor(raw: string | undefined, isDark: boolean) {
  return isAuto(raw) ? (isDark ? DEFAULT_BORDER_DARK : DEFAULT_BORDER_LIGHT) : raw!;
}

export function effectiveBgColor(raw: string | undefined, isDark: boolean) {
  return isAuto(raw) ? (isDark ? DEFAULT_BG_DARK : DEFAULT_BG_LIGHT) : raw!;
}
