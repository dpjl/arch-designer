"use client";
import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

interface FirewallIconProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'secure' | 'warning';
}

export const FirewallIcon: React.FC<FirewallIconProps> = ({ 
  size = 24, 
  className = "",
  variant = 'default'
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Couleurs adaptées au mode sombre
  const colors = {
    default: isDark ? "#10b981" : "#059669", // Plus clair en mode sombre
    secure: isDark ? "#06b6d4" : "#0891b2",   // Plus clair en mode sombre  
    warning: isDark ? "#f87171" : "#dc2626"   // Plus clair en mode sombre
  };

  const color = colors[variant];

  return (
    <svg 
      viewBox="0 0 24 24" 
      role="img" 
      aria-hidden="true" 
      fill="none" 
      width={size}
      height={size}
      className={className}
      style={{ 
        color: color,
        shapeRendering: 'geometricPrecision'
      }}
    >
      {/* Forme de bouclier plus réaliste avec base pointue */}
      <path 
        d="M12 2.5L6.5 4.5C5.5 5 4.5 6 3.5 7.5C3.5 13.5 6.5 18.5 12 21C17.5 18.5 20.5 13.5 20.5 7.5C19.5 6 18.5 5 17.5 4.5L12 2.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Ligne centrale du bouclier pour plus de réalisme */}
      <path 
        d="M12 3.5v16.5"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
        strokeLinecap="round"
      />
      
      {/* Inner content based on variant */}
      {variant === 'default' && (
        <circle 
          cx="12" 
          cy="11" 
          r="2.5" 
          fill={color}
        />
      )}
      
      {variant === 'secure' && (
        <path
          d="M8.5 11.5l2.5 2.5 4.5-4.5"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      
      {variant === 'warning' && (
        <>
          <path
            d="M12 7.5v4"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle 
            cx="12" 
            cy="15" 
            r="1" 
            fill={color}
          />
        </>
      )}
    </svg>
  );
};
