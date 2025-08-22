"use client";
import React, { memo, useState } from 'react';
import type { ToolbarProps } from './Toolbar';

export interface MobileMenuProps extends Pick<ToolbarProps,
  'mode' | 'setMode' | 'onSave' | 'onLoad' | 'onExportPng' | 'onExportJson' | 'onImportJson' | 'onClear' | 'onUndo' | 'onRedo' | 'canUndo' | 'canRedo' | 'snapEnabled' | 'setSnapEnabled' | 'onSnapAll'
> {
  // Backward-compat aliases (optional)
  undo?: () => void;
  redo?: () => void;
}

export const MobileMenu = memo(({ mode, setMode, onSave, onLoad, onExportPng, onExportJson, onImportJson, onClear, undo, redo, onUndo, onRedo, canUndo, canRedo, snapEnabled, setSnapEnabled, onSnapAll }: MobileMenuProps) => {
  const [open, setOpen] = useState(false);
  const doUndo = onUndo || undo || (()=>{});
  const doRedo = onRedo || redo || (()=>{});
  return (
    <div className="md:hidden relative">
      <button onClick={()=>setOpen(o=>!o)} aria-label="Menu" className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow">
        {open ? '×' : '≡'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 p-3 rounded-xl bg-white shadow-lg border space-y-2 z-50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Mode</span>
            <button onClick={()=>setMode(mode==='edit'?'view':'edit')} className="px-2 py-1 rounded bg-slate-800 text-white text-[11px]">{mode==='edit'?'View':'Edit'}</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button onClick={onSave} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Save</button>
            <button onClick={onLoad} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Load</button>
            <button onClick={onExportPng} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">PNG</button>
            <button onClick={onExportJson} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">JSON</button>
            <button onClick={onImportJson} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Import</button>
            <button onClick={onClear} className="px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700">Clear</button>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <button disabled={!canUndo} onClick={doUndo} className="flex-1 px-2 py-1 rounded bg-slate-100 disabled:opacity-40">↺</button>
            <button disabled={!canRedo} onClick={doRedo} className="flex-1 px-2 py-1 rounded bg-slate-100 disabled:opacity-40">↻</button>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <label className="flex items-center gap-1"><input type="checkbox" checked={snapEnabled} onChange={(e)=>setSnapEnabled(e.target.checked)} />Snap</label>
            <button onClick={onSnapAll} className="px-2 py-1 rounded bg-slate-100">Snap All</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default MobileMenu;
