"use client";
import React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const effective = theme === 'system' ? resolvedTheme : theme;
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-white/70 dark:bg-slate-800/70 backdrop-blur px-1 py-1">
      <button aria-label="Light" onClick={()=>setTheme('light')} className={`h-7 w-7 flex items-center justify-center rounded-md text-xs ${effective==='light'?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'hover:bg-slate-200 dark:hover:bg-slate-700'}`}><Sun className="h-4 w-4"/></button>
      <button aria-label="Dark" onClick={()=>setTheme('dark')} className={`h-7 w-7 flex items-center justify-center rounded-md text-xs ${effective==='dark'?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'hover:bg-slate-200 dark:hover:bg-slate-700'}`}><Moon className="h-4 w-4"/></button>
      <button aria-label="System" onClick={()=>setTheme('system')} className={`h-7 w-7 flex items-center justify-center rounded-md text-xs ${theme==='system'?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'hover:bg-slate-200 dark:hover:bg-slate-700'}`}><Laptop className="h-4 w-4"/></button>
    </div>
  );
};

export default ThemeToggle;
