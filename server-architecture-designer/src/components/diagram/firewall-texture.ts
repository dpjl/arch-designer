// Shared runtime-generated PNG brick texture for firewall top border.
// Modern, professional brick texture - optimized for top border only.
// Caches on window to avoid re-creating across components.

export type BrickTexture = { 
  urlH: string; 
  size: number; 
  offX: number; 
  offY: number; 
  shiftTopY: number; 
  shiftSideX: number;
  urlHDark?: string;
};

function generateModernBrick(isDark: boolean = false): { urlH: string } {
  if (typeof document === 'undefined') return { urlH: '' };
  
  const size = 28; // Larger tile for better detail
  const canvas = document.createElement('canvas'); 
  canvas.width = size; 
  canvas.height = size;
  const ctx = canvas.getContext('2d')!; 
  ctx.imageSmoothingEnabled = true; // Enable smoothing for better quality
  
  // Modern color palette
  const colors = isDark ? {
    mortar: '#1e293b',      // Dark slate for mortar
    brickBase: '#475569',   // Medium slate
    brickHighlight: '#64748b', // Lighter slate
    brickShadow: '#334155', // Darker slate
    accent: '#0f172a'       // Very dark accent
  } : {
    mortar: '#f1f5f9',      // Light gray mortar
    brickBase: '#dc2626',   // Modern red
    brickHighlight: '#ef4444', // Lighter red
    brickShadow: '#b91c1c', // Darker red
    accent: '#7f1d1d'       // Deep red accent
  };
  
  // Modern brick dimensions
  const gap = 3; 
  const margin = gap / 2; 
  const brickW = size - margin * 2; 
  const brickH = Math.round(size * 0.45); // Slightly taller bricks
  const cornerRadius = 1; // Subtle rounded corners
  
  // Fill background (mortar)
  ctx.fillStyle = colors.mortar;
  ctx.fillRect(0, 0, size, size);
  
  // Create brick with gradient and texture
  const brickY = Math.floor((size - brickH) / 2);
  
  // Main brick shape with rounded corners
  ctx.beginPath();
  ctx.roundRect(margin, brickY, brickW, brickH, cornerRadius);
  
  // Gradient fill for depth
  const gradient = ctx.createLinearGradient(margin, brickY, margin, brickY + brickH);
  gradient.addColorStop(0, colors.brickHighlight);
  gradient.addColorStop(0.3, colors.brickBase);
  gradient.addColorStop(0.7, colors.brickBase);
  gradient.addColorStop(1, colors.brickShadow);
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add subtle texture lines
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;
  
  // Horizontal texture lines
  for (let i = 0; i < 2; i++) {
    const y = brickY + (brickH / 3) * (i + 1);
    ctx.beginPath();
    ctx.moveTo(margin + 2, y);
    ctx.lineTo(margin + brickW - 2, y);
    ctx.stroke();
  }
  
  // Vertical texture line
  const centerX = margin + brickW / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, brickY + 2);
  ctx.lineTo(centerX, brickY + brickH - 2);
  ctx.stroke();
  
  ctx.globalAlpha = 1; // Reset alpha
  
  // Subtle border for definition
  ctx.strokeStyle = isDark ? colors.accent : colors.brickShadow;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.roundRect(margin, brickY, brickW, brickH, cornerRadius);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Add highlight edge for 3D effect
  ctx.strokeStyle = colors.brickHighlight;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(margin + cornerRadius, brickY);
  ctx.lineTo(margin + brickW - cornerRadius, brickY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  const urlH = canvas.toDataURL('image/png');
  
  return { urlH };
}

function generate(): BrickTexture {
  if (typeof document === 'undefined') return { 
    urlH: '', size: 28, offX: 0, offY: 0, shiftTopY: 0, shiftSideX: 0 
  };
  
  const size = 28;
  
  // Generate both light and dark versions
  const lightTextures = generateModernBrick(false);
  const darkTextures = generateModernBrick(true);
  
  // Calculate offsets for proper alignment
  const gap = 3;
  const margin = gap / 2;
  const brickH = Math.round(size * 0.45);
  const T = 14; // Ring thickness
  const yOffset = Math.floor((size - brickH) / 2);
  const brickCenterY = yOffset + brickH / 2;
  const brickCenterX = margin + (size - margin * 2) / 2;
  const shiftTopY = Math.round(-(brickCenterY - T / 2));
  const shiftSideX = Math.round(-(brickCenterX - T / 2));
  
  return { 
    urlH: lightTextures.urlH, 
    urlHDark: darkTextures.urlH,
    size, 
    offX: margin, 
    offY: yOffset, 
    shiftTopY, 
    shiftSideX 
  };
}

export function getBrickTexture(): BrickTexture {
  if (typeof window === 'undefined') return { 
    urlH: '', size: 28, offX: 0, offY: 0, shiftTopY: 0, shiftSideX: 0 
  };
  
  const w = window as any;
  // Cache key pour invalider quand nécessaire
  const cacheKey = '__modernBrickTexCache';
  
  if (!w[cacheKey]) {
    try { 
      w[cacheKey] = generate(); 
    } catch { 
      w[cacheKey] = { 
        urlH:'', size:28, offX:0, offY:0, shiftTopY:0, shiftSideX:0 
      }; 
    }
  }
  return w[cacheKey] as BrickTexture;
}

// Fonction pour forcer la régénération du cache (utile pour les changements de thème)
export function invalidateBrickTextureCache(): void {
  if (typeof window !== 'undefined') {
    const w = window as any;
    delete w.__modernBrickTexCache;
  }
}
