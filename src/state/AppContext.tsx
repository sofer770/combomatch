import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Food, Id } from '../domain/types';
import { browserStorage, createStore, type DbState, type Store } from '../storage/store';

export const store: Store = createStore(browserStorage());

/** Subscribes a component to the local database. */
export function useDb(): DbState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function useFoodMap() {
  const { foods } = useDb();
  return useMemo(() => new Map(foods.map((f) => [f.id, f] as const)), [foods]);
}

export function useFamilyMap() {
  const { families } = useDb();
  return useMemo(() => new Map(families.map((f) => [f.id, f] as const)), [families]);
}

export function resolveFoods(ids: Id[], map: Map<Id, Food>): Food[] {
  return ids.map((id) => map.get(id)).filter((f): f is Food => Boolean(f));
}

// ---- toasts
export type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; text: string }

// ---- selection shared between home and results
interface UiCtx {
  selection: Id[];
  setSelection: (ids: Id[]) => void;
  toggleFood: (id: Id) => { ok: boolean; reason?: string };
  toasts: Toast[];
  toast: (text: string, kind?: ToastKind) => void;
}

const Ctx = createContext<UiCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Id[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const toggleFood = useCallback(
    (id: Id) => {
      const max = store.getState().settings.maxFoods;
      if (selection.includes(id)) {
        setSelection(selection.filter((x) => x !== id));
        return { ok: true };
      }
      if (selection.length >= max) return { ok: false, reason: `ניתן לבחור עד ${max} מזונות. הסירו מזון כדי להוסיף אחר.` };
      setSelection([...selection, id]);
      return { ok: true };
    },
    [selection],
  );

  const value = useMemo(() => ({ selection, setSelection, toggleFood, toasts, toast }), [selection, toggleFood, toasts, toast]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUi outside provider');
  return c;
}
