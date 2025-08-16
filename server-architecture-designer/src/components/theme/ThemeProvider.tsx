"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
interface ThemeContextValue { theme: Theme; resolvedTheme: 'light'|'dark'; setTheme: (t:Theme)=>void; toggleTheme: ()=>void; }

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'server-arch:theme';

function getSystemTheme(): 'light'|'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ initialTheme?: Theme; children: React.ReactNode }> = ({ initialTheme='system', children }) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolved, setResolved] = useState<'light'|'dark'>(getSystemTheme());

  useEffect(()=>{ try { const stored = localStorage.getItem(STORAGE_KEY) as Theme|null; if (stored) setThemeState(stored); } catch{} }, []);
  useEffect(()=>{
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => { setResolved(mq.matches? 'dark':'light'); };
    listener();
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);
  useEffect(()=>{ const root = document.documentElement; const effective = theme === 'system' ? resolved : theme; if (effective === 'dark') root.classList.add('dark'); else root.classList.remove('dark'); }, [theme, resolved]);

  const setTheme = useCallback((t:Theme)=>{ setThemeState(t); try { localStorage.setItem(STORAGE_KEY, t); } catch{} }, []);
  const toggleTheme = useCallback(()=>{
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value: ThemeContextValue = { theme, resolvedTheme: theme==='system'? resolved : (theme as any), setTheme, toggleTheme };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(){ const ctx = useContext(ThemeContext); if(!ctx) throw new Error('useTheme must be used inside ThemeProvider'); return ctx; }
