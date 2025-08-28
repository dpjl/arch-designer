"use client";
import React from 'react';

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
  const colors = {
    default: {
      primary: "#059669",
      secondary: "rgba(34, 197, 94, 0.15)",
      accent: "#059669",
      highlight: "#ffffff"
    },
    secure: {
      primary: "#0891b2",
      secondary: "rgba(6, 182, 212, 0.15)", 
      accent: "#0891b2",
      highlight: "#ffffff"
    },
    warning: {
      primary: "#dc2626",
      secondary: "rgba(239, 68, 68, 0.15)",
      accent: "#dc2626",
      highlight: "#ffffff"
    }
  };

  const { primary, secondary, accent, highlight } = colors[variant];

  return (
    <svg 
      viewBox="0 0 24 24" 
      role="img" 
      aria-hidden="true" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      width={size}
      height={size}
      className={`firewall-icon ${className}`}
      style={{ 
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
        color: primary
      }}
    >
      <defs>
        <linearGradient id={`firewall-gradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.8" />
          <stop offset="50%" stopColor={accent} stopOpacity="0.6" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Shield shape with gradient fill */}
      <path 
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        fill={secondary}
        stroke={`url(#firewall-gradient-${variant})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      
      {/* Central security indicator */}
      <circle 
        cx="12" 
        cy="10" 
        r="1.2" 
        fill={accent}
        className="firewall-pulse"
      />
      
      {/* Vertical line indicator */}
      <path 
        d="M12 13.5v2.5"
        stroke={accent}
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      
      {/* Optional checkmark for secure variant */}
      {variant === 'secure' && (
        <path
          d="M9 11l2 2 4-4"
          stroke={highlight}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      
      {/* Optional warning indicator */}
      {variant === 'warning' && (
        <path
          d="M12 8v2m0 4h.01"
          stroke={highlight}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
