"use client";
import React, { memo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Toolbar, ToolbarProps } from './Toolbar';
import { MobileMenu } from './MobileMenu';

type ResponsiveTopBarProps = { title: string } & ToolbarProps;

export const ResponsiveTopBar = memo(({ title, ...rest }: ResponsiveTopBarProps) => {
  return (
    <div className="h-14 sm:h-16 px-2 sm:px-4 border-b bg-white/80 backdrop-blur flex items-center justify-between sticky top-0 z-50 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow"><LayoutGrid className="h-5 w-5"/></div>
        <div className="font-semibold text-sm sm:text-base truncate max-w-[45vw] sm:max-w-xs" title={title}>{title}</div>
      </div>
      <div className="hidden md:flex">
        <Toolbar {...rest} />
      </div>
      <MobileMenu {...rest} />
    </div>
  );
});

export default ResponsiveTopBar;
