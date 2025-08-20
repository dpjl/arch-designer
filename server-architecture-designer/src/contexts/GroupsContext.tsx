"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ServiceGroup = {
  id: string;
  label: string;
  color: string; // used for border & background tint
};

type GroupsContextValue = {
  groups: ServiceGroup[];
  setGroups: (groups: ServiceGroup[]) => void;
  addGroup: (label?: string, color?: string) => ServiceGroup;
  updateGroup: (id: string, patch: Partial<Pick<ServiceGroup, 'label'|'color'>>) => void;
  removeGroup: (id: string) => void;
  pickSmartColor: () => string;
  getById: (id?: string) => ServiceGroup | undefined;
};

const GroupsContext = createContext<GroupsContextValue | undefined>(undefined);

const BASE_PALETTE = [
  '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#84cc16', '#f97316', '#e11d48', '#14b8a6'
];

function normalizeHexColor(hex?: string): string | undefined {
  if (!hex) return undefined;
  const m = hex.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return undefined;
  let s = m[1];
  if (s.length === 3) s = s.split('').map(c=>c+c).join('');
  return `#${s.toLowerCase()}`;
}

export function GroupsProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<ServiceGroup[]>([]);

  const pickSmartColor = useCallback(() => {
    const used = new Set(groups.map(g => normalizeHexColor(g.color)));
    for (const c of BASE_PALETTE) {
      if (!used.has(normalizeHexColor(c))) return c;
    }
    // Fallback: slight hue shift based on count
    const i = groups.length;
    const alt = BASE_PALETTE[i % BASE_PALETTE.length];
    return alt || '#3b82f6';
  }, [groups]);

  const addGroup = useCallback((label?: string, color?: string) => {
    const id = `grp-${Math.random().toString(36).slice(2,8)}`;
    const g: ServiceGroup = { id, label: label || 'Groupe', color: normalizeHexColor(color) || pickSmartColor() };
    setGroups(prev => [...prev, g]);
    return g;
  }, [pickSmartColor]);

  const updateGroup = useCallback((id: string, patch: Partial<Pick<ServiceGroup, 'label'|'color'>>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...patch, color: normalizeHexColor(patch.color) || g.color } : g));
  }, []);

  const removeGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  const getById = useCallback((id?: string) => groups.find(g => g.id === id), [groups]);

  const value = useMemo(() => ({ groups, setGroups, addGroup, updateGroup, removeGroup, pickSmartColor, getById }), [groups, addGroup, updateGroup, removeGroup, pickSmartColor, getById]);
  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider');
  return ctx;
}
