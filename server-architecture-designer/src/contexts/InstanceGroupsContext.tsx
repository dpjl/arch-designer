"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type InstanceGroup = {
  id: string;
  label: string;
  color: string;
};

type InstanceGroupsContextValue = {
  groups: InstanceGroup[];
  setGroups: (groups: InstanceGroup[]) => void;
  addGroup: (label?: string, color?: string) => InstanceGroup;
  updateGroup: (id: string, patch: Partial<Pick<InstanceGroup, 'label'|'color'>>) => void;
  removeGroup: (id: string) => void;
  pickSmartColor: () => string;
  getById: (id?: string) => InstanceGroup | undefined;
};

const InstanceGroupsContext = createContext<InstanceGroupsContextValue | undefined>(undefined);

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

export function InstanceGroupsProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<InstanceGroup[]>([]);

  const pickSmartColor = useCallback(() => {
    const used = new Set(groups.map(g => normalizeHexColor(g.color)));
    for (const c of BASE_PALETTE) {
      if (!used.has(normalizeHexColor(c))) return c;
    }
    const i = groups.length;
    const alt = BASE_PALETTE[i % BASE_PALETTE.length];
    return alt || '#3b82f6';
  }, [groups]);

  const addGroup = useCallback((label?: string, color?: string) => {
    const id = `igrp-${Math.random().toString(36).slice(2,8)}`;
    const g: InstanceGroup = { id, label: label || 'Groupe d’instances', color: normalizeHexColor(color) || pickSmartColor() };
    setGroups(prev => [...prev, g]);
    return g;
  }, [pickSmartColor]);

  const updateGroup = useCallback((id: string, patch: Partial<Pick<InstanceGroup, 'label'|'color'>>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...patch, color: normalizeHexColor(patch.color) || g.color } : g));
  }, []);

  const removeGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  const getById = useCallback((id?: string) => groups.find(g => g.id === id), [groups]);

  const value = useMemo(() => ({ groups, setGroups, addGroup, updateGroup, removeGroup, pickSmartColor, getById }), [groups, addGroup, updateGroup, removeGroup, pickSmartColor, getById]);
  return <InstanceGroupsContext.Provider value={value}>{children}</InstanceGroupsContext.Provider>;
}

export function useInstanceGroups() {
  const ctx = useContext(InstanceGroupsContext);
  if (!ctx) throw new Error('useInstanceGroups must be used within InstanceGroupsProvider');
  return ctx;
}
