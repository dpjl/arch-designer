"use client";
import React, { useState } from 'react';
import { LayoutGrid, Eye, Pencil, Upload, Save, Boxes, Magnet, FileDown, FileUp, Eraser, CornerUpLeft, CornerUpRight, Image as ImageIcon } from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';
import IconButton from './IconButton';
import { MODES } from './constants';

export interface ToolbarProps {
  mode: typeof MODES[keyof typeof MODES];
  setMode: (m: typeof MODES[keyof typeof MODES])=>void;
  onSave: ()=>void;
  onLoad: ()=>void;
  onExportPng: ()=>void;
  onExportPdf: ()=>void;
  onExportJson: ()=>void;
  onImportJson: ()=>void;
  onClear: ()=>void;
  onUndo: ()=>void;
  onRedo: ()=>void;
  canUndo: boolean;
  canRedo: boolean;
  snapEnabled: boolean;
  setSnapEnabled: (v:boolean)=>void;
  onSnapAll: ()=>void;
}

export function Toolbar(props: ToolbarProps) {
  const { mode, setMode, onSave, onLoad, onExportPng, onExportPdf, onExportJson, onImportJson, onClear, onUndo, onRedo, canUndo, canRedo, snapEnabled, setSnapEnabled, onSnapAll } = props;
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/70 backdrop-blur px-1 py-1 rounded-xl border shadow-sm">
        <IconButton label={mode===MODES.EDIT? 'Mode édition' : 'Mode visualisation'} onClick={() => setMode(mode === MODES.EDIT ? MODES.VIEW : MODES.EDIT)} icon={mode===MODES.EDIT? <Pencil className="h-4 w-4"/> : <Eye className="h-4 w-4"/>} active={mode===MODES.EDIT} />
        <IconButton label="Annuler" onClick={onUndo} icon={<CornerUpLeft className="h-4 w-4"/>} disabled={!canUndo} />
        <IconButton label="Rétablir" onClick={onRedo} icon={<CornerUpRight className="h-4 w-4"/>} disabled={!canRedo} />
        <div className="hidden md:flex items-center gap-1">
          <IconButton label="Sauvegarder" onClick={onSave} icon={<Save className="h-4 w-4"/>} />
          <IconButton label="Charger" onClick={onLoad} icon={<Upload className="h-4 w-4"/>} />
          <IconButton label="Exporter PNG" onClick={onExportPng} icon={<ImageIcon className="h-4 w-4"/>} />
          <IconButton label="Exporter PDF" onClick={onExportPdf} icon={<span className="inline-block h-4 w-4 relative" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2Z" />
              <path d="M14 2v4h4" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold tracking-tight" style={{fontFamily:'system-ui, sans-serif'}}>PDF</span>
          </span>} />
        </div>
        <div className="hidden lg:flex items-center gap-1">
          <IconButton label="Exporter JSON" onClick={onExportJson} icon={<FileDown className="h-4 w-4"/>} />
          <IconButton label="Importer JSON" onClick={onImportJson} icon={<FileUp className="h-4 w-4"/>} />
          <IconButton label="Effacer le diagramme" onClick={onClear} icon={<Eraser className="h-4 w-4"/>} />
        </div>
        <div className="hidden xl:flex items-center gap-1">
          <IconButton label="Aligner sur la grille" onClick={onSnapAll} icon={<Boxes className="h-4 w-4"/>} />
          <IconButton label={snapEnabled? 'Désactiver snap' : 'Activer snap'} onClick={()=>setSnapEnabled(!snapEnabled)} icon={<Magnet className="h-4 w-4"/>} active={snapEnabled} />
        </div>
        <IconButton label={open? 'Fermer menu' : 'Ouvrir menu'} onClick={()=>setOpen(o=>!o)} icon={<LayoutGrid className="h-4 w-4"/>} />
        <ThemeToggle />
      </div>
      
      {open && (
        <div className="absolute right-0 mt-2 w-48 p-2 rounded-xl border bg-white shadow-lg grid grid-cols-4 gap-2 z-50">
          <IconButton label="Sauvegarder" onClick={onSave} icon={<Save className="h-4 w-4"/>} />
          <IconButton label="Charger" onClick={onLoad} icon={<Upload className="h-4 w-4"/>} />
          <IconButton label="Exporter PNG" onClick={onExportPng} icon={<ImageIcon className="h-4 w-4"/>} />
          <IconButton label="Exporter PDF" onClick={onExportPdf} icon={<span className="inline-block h-4 w-4 relative" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2Z" />
              <path d="M14 2v4h4" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold tracking-tight" style={{fontFamily:'system-ui, sans-serif'}}>PDF</span>
          </span>} />
          <IconButton label="Exporter JSON" onClick={onExportJson} icon={<FileDown className="h-4 w-4"/>} />
          <IconButton label="Importer JSON" onClick={onImportJson} icon={<FileUp className="h-4 w-4"/>} />
          <IconButton label="Effacer le diagramme" onClick={onClear} icon={<Eraser className="h-4 w-4"/>} />
          <IconButton label="Aligner sur la grille" onClick={onSnapAll} icon={<Boxes className="h-4 w-4"/>} />
          <IconButton label={snapEnabled? 'Désactiver snap' : 'Activer snap'} onClick={()=>setSnapEnabled(!snapEnabled)} icon={<Magnet className="h-4 w-4"/>} active={snapEnabled} />
        </div>
      )}
    </div>
  );
}

export default Toolbar;
