import { useMemo, useState, type KeyboardEvent } from 'react';
import type { Food, Id } from '../domain/types';
import { searchFoods } from '../engine/search';
import { useDb } from '../state/AppContext';
import { FoodForm } from './FoodForm';
import { missingFoodLink } from '../share';

/**
 * Hebrew type-ahead food search.
 * Shows results while typing; when nothing matches, offers to add the food to the database.
 */
export function FoodSearch({ selectedIds, onPick, placeholder = 'הקלידו שם של מזון, למשל: אורז', autoFocus }: {
  selectedIds: Id[]; onPick: (food: Food) => void; placeholder?: string; autoFocus?: boolean;
}) {
  const { foods, families } = useDb();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const results = useMemo(() => searchFoods(foods, q, 8), [foods, q]);
  const famName = (id: string) => families.find((f) => f.id === id)?.name ?? '';

  const pick = (f: Food) => {
    onPick(f);
    setQ('');
    setActive(0);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); const f = results[active]; if (f && !selectedIds.includes(f.id)) pick(f); }
    if (e.key === 'Escape') setQ('');
  };

  return (
    <div className="relative">
      <label htmlFor="food-search" className="sr-only">חיפוש מזון</label>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-muted">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </span>
      <input
        id="food-search"
        type="search"
        autoComplete="off"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={q.trim().length > 0}
        aria-controls="food-results"
        className="input ps-12 text-lg"
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setActive(0); }}
        onKeyDown={onKey}
      />
      {q.trim() && (
        <div id="food-results" role="listbox" className="card absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="font-medium">לא נמצא מזון בשם "{q.trim()}"</p>
              <p className="mt-1 text-sm text-muted">אפשר להוסיף אותו למאגר ולסווג אותו למשפחת מזון.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button type="button" className="btn-soft" onClick={() => setAdding(true)}>+ הוספת "{q.trim()}" למאגר</button>
                <a className="btn-ghost border border-line" href={missingFoodLink(q.trim())} target="_blank" rel="noopener noreferrer">💬 חסר לי מזון, עדכנו אותנו</a>
              </div>
            </div>
          ) : (
            results.map((f, i) => {
              const taken = selectedIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  disabled={taken}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(f)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start ${i === active ? 'bg-leaf-soft/70' : ''} disabled:opacity-50`}
                >
                  <span aria-hidden className="text-2xl">{f.icon}</span>
                  <span className="flex-1">
                    <span className="block font-medium">{f.nameHe}</span>
                    <span className="block text-xs text-muted">
                      {f.familyIds.length ? f.familyIds.map(famName).join(' + ') : 'לא מסווג למשפחה'}
                    </span>
                  </span>
                  {taken && <span className="text-xs text-muted">כבר נבחר</span>}
                </button>
              );
            })
          )}
        </div>
      )}
      <FoodForm open={adding} onClose={() => setAdding(false)} initialName={q.trim()} onSaved={(f) => { setQ(''); if (f.active) pick(f); }} />
    </div>
  );
}
