"use client";
import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export interface IconButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ label, icon, onClick, active=false, disabled=false, className='' }) => (
  <TooltipPrimitive.Root delayDuration={150}>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors disabled:opacity-40 ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} ${className}`}
      >
        {icon}
      </button>
    </TooltipTrigger>
    <TooltipContent sideOffset={4}>{label}</TooltipContent>
  </TooltipPrimitive.Root>
);

export default IconButton;
