import { useCallback, useRef, useState } from 'react';
import { HISTORY_STORAGE_KEY } from '../../diagram/constants';

export interface HistorySnapshot { nodes: any[]; edges: any[] }
interface HistoryState { past: HistorySnapshot[]; present: HistorySnapshot; future: HistorySnapshot[] }

export function useDiagramHistory(setNodes: any, setEdges: any, showFlash: (msg:string)=>void) {
  const historyRef = useRef<HistoryState>({ past: [], present: { nodes: [], edges: [] }, future: [] });
  const lastCommitRef = useRef<number>(Date.now());
  const [tick, setTick] = useState(0);
  const COMMIT_GROUP_MS = 500;

  const commitIfChanged = useCallback((nodes:any[], edges:any[]) => {
    const cur: HistorySnapshot = { nodes, edges };
    const ser = JSON.stringify(cur);
    const presSer = JSON.stringify(historyRef.current.present);
    if (ser === presSer) return;
    const now = Date.now();
    const elapsed = now - lastCommitRef.current;
    if (elapsed < COMMIT_GROUP_MS && historyRef.current.past.length) {
      historyRef.current.present = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
    } else {
      historyRef.current.past.push(historyRef.current.present);
      if (historyRef.current.past.length > 100) historyRef.current.past.shift();
      historyRef.current.present = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
      historyRef.current.future = [];
      lastCommitRef.current = now;
    }
    setTick(t=>t+1);
    try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRef.current)); } catch {}
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current; if(!h.past.length) return;
    const prev = h.past.pop() as HistorySnapshot; h.future.unshift(h.present); h.present = prev;
    setNodes(prev.nodes.map(n=>({...n}))); setEdges(prev.edges.map(e=>({...e})));
    lastCommitRef.current = Date.now(); setTick(t=>t+1);
    try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(h)); } catch {}
    showFlash('Undo');
  }, [setNodes,setEdges,showFlash]);

  const redo = useCallback(() => {
    const h = historyRef.current; if(!h.future.length) return;
    const next = h.future.shift() as HistorySnapshot; h.past.push(h.present); h.present = next;
    setNodes(next.nodes.map(n=>({...n}))); setEdges(next.edges.map(e=>({...e})));
    lastCommitRef.current = Date.now(); setTick(t=>t+1);
    try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(h)); } catch {}
    showFlash('Redo');
  }, [setNodes,setEdges,showFlash]);

  const replaceAll = useCallback((nodes:any[], edges:any[]) => {
    historyRef.current = { past: [], present: { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, future: [] };
    lastCommitRef.current = Date.now(); setTick(t=>t+1);
    try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRef.current)); } catch {}
  }, []);

  const clear = useCallback(()=>{
    historyRef.current = { past: [], present: { nodes: [], edges: [] }, future: [] };
    lastCommitRef.current = Date.now(); setTick(t=>t+1);
    try { localStorage.removeItem(HISTORY_STORAGE_KEY); } catch {}
  }, []);

  return { historyRef, lastCommitRef, commitIfChanged, undo, redo, replaceAll, clear, tick };
}
