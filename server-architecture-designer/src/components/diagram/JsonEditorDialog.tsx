"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import Editor, { DiffEditor } from '@monaco-editor/react';
import { DiagramPayloadSchema } from '@/lib/validation/diagramSchema';

export type DiagramJsonPayload = {
  nodes: any[];
  edges: any[];
  groups?: any[];
  instanceGroups?: any[];
  globalAutoLayoutConfig?: any;
};

interface JsonEditorDialogProps {
  open: boolean;
  initialValue: DiagramJsonPayload;
  onClose: () => void;
  onApply: (payload: DiagramJsonPayload) => void;
}

export default function JsonEditorDialog({ open, initialValue, onClose, onApply }: JsonEditorDialogProps) {
  const [text, setText] = useState<string>("\n");
  const [error, setError] = useState<string | null>(null);
  const [validPayload, setValidPayload] = useState<DiagramJsonPayload | null>(null);
  // no dirty tracking currently used
  const [showDiff, setShowDiff] = useState(false);
  const [diffMounted, setDiffMounted] = useState(false);
  const original = useRef<string>("");
  const diffRef = useRef<any>(null);
  const handleClose = useCallback(() => {
    try {
      const ed: any = diffRef.current;
      if (ed && typeof ed.setModel === 'function') {
        // Detach model to avoid disposal/reset race inside Monaco
        ed.setModel(null);
      }
    } catch {}
    setTimeout(() => onClose(), 0);
  }, [onClose]);

  // Initialize on open
  useEffect(() => {
    if (!open) return;
  const pretty = JSON.stringify(initialValue, null, 2);
  setText(pretty);
    setError(null);
    setValidPayload(initialValue);
  // reset state
  original.current = pretty;
  setShowDiff(false);
  setDiffMounted(false);
  }, [open, initialValue]);

  // Ensure DiffEditor remounts cleanly when re-opened
  useEffect(() => {
    if (showDiff && !diffMounted) setDiffMounted(true);
    if (diffRef.current?.layout) {
      setTimeout(() => { try { diffRef.current.layout(); } catch {} }, 0);
    }
  }, [showDiff, diffMounted]);

  useEffect(() => {
    return () => {
      try {
        const ed: any = diffRef.current;
        if (ed?.setModel) ed.setModel(null);
      } catch {}
    };
  }, []);

  // Debounced validation
  useEffect(() => {
    if (!open) return;
    const h = setTimeout(() => {
      try {
        const parsed = JSON.parse(text);
        let ok = true; let msg = '';
        try {
          const safe = (DiagramPayloadSchema as any);
          const res = safe?.safeParse ? safe.safeParse(parsed) : { success: true, data: parsed };
          if (!res.success) {
            ok = false;
            msg = formatZodIssues(res.error.issues);
          }
        } catch (ze: any) {
          // zod misbehaved: fall back to manual validation
          const issues = manualValidate(parsed);
          ok = issues.length === 0;
          msg = issues[0] || 'Erreur de validation';
        }
        if (!ok) {
          setValidPayload(null);
          setError(msg);
        } else {
          setValidPayload(parsed as any);
          setError(null);
        }
      } catch (e: any) {
        setValidPayload(null);
        // Show more useful message while keeping it safe
        if (e?.name === 'SyntaxError') {
          setError(`Syntaxe JSON: ${e?.message}`);
        } else if (e?.errors || e?.issues) {
          setError(formatZodIssues(e?.errors || e?.issues));
        } else if (e?.message) {
          setError(e.message);
        } else {
          setError('Erreur de validation');
        }
      }
    }, 300);
    return () => clearTimeout(h);
  }, [text, open]);

  // With built-in original/modified props, no manual model sync is required.

  const format = useCallback(() => {
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore format when invalid
    }
  }, [text]);

  const apply = useCallback(() => {
    if (!validPayload) return;
    onApply(validPayload);
    onClose();
  }, [validPayload, onApply, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="absolute inset-x-3 md:inset-x-10 lg:left-1/2 lg:-translate-x-1/2 top-10 bottom-6 lg:w-[min(1100px,90vw)] flex flex-col">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border overflow-hidden flex flex-col h-full">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">Éditer le JSON du diagramme</div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={()=> setShowDiff(v=>!v)} aria-pressed={showDiff}>Diff</Button>
              <Button variant="secondary" onClick={format}>Formater</Button>
              <Button variant="secondary" onClick={handleClose}>Annuler</Button>
              <Button disabled={!validPayload} onClick={()=>{ apply(); handleClose(); }}>Appliquer</Button>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="w-full flex-1 min-h-0">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme="vs-dark"
                value={text}
                onChange={(val)=>{ setText((val as string) || ''); }}
                options={{ minimap: { enabled: false }, fontSize: 12, tabSize: 2, wordWrap: 'on' }}
              />
            </div>
            {diffMounted && (
              <div className="border-t shrink-0 grow-0" style={{ height: '45vh', minHeight: 220, display: showDiff ? 'block' : 'none' }}>
                <DiffEditor
                  height="100%"
                  original={original.current}
                  modified={text}
                  language="json"
                  theme="vs-dark"
                  onMount={(editor)=>{ diffRef.current = editor; setTimeout(()=> editor.layout(), 0); }}
                  options={{ readOnly: true, renderIndicators: true, minimap: { enabled: false }, fontSize: 12, wordWrap: 'on', automaticLayout: true }}
                />
              </div>
            )}
            <div className="border-t px-3 py-2 text-xs flex items-center justify-between shrink-0">
              {error ? (
                <div className="text-rose-600 dark:text-rose-400 truncate">{error}</div>
              ) : (
                <div className="text-emerald-600 dark:text-emerald-400">JSON valide</div>
              )}
              <div className="flex items-center gap-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatZodIssues(issues: any[]): string {
  if (!issues?.length) return 'JSON invalide';
  const first = issues[0];
  const path = (first?.path && Array.isArray(first.path) && first.path.length) ? first.path.join('.') : 'payload';
  return `${path}: ${first?.message || 'invalide'}`;
}

function manualValidate(parsed: any): string[] {
  const errs: string[] = [];
  if (!parsed || typeof parsed !== 'object') return ['payload: objet requis'];
  if (!Array.isArray(parsed.nodes)) errs.push('nodes: tableau requis');
  if (!Array.isArray(parsed.edges)) errs.push('edges: tableau requis');
  if (Array.isArray(parsed.edges)) {
    parsed.edges.forEach((e: any, i: number) => {
      if (!e || typeof e !== 'object') errs.push(`edges[${i}]: objet requis`);
      if (!e?.source) errs.push(`edges[${i}].source: requis`);
      if (!e?.target) errs.push(`edges[${i}].target: requis`);
    });
  }
  return errs;
}
