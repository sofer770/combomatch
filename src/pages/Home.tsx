import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Food } from '../domain/types';
import logo from '../assets/logo.png';
import { FoodSearch } from '../components/FoodSearch';
import { FoodForm } from '../components/FoodForm';
import { FoodChip } from '../components/ui';
import { resolveFoods, useDb, useFoodMap, useUi } from '../state/AppContext';

export default function Home() {
  const db = useDb();
  const foodMap = useFoodMap();
  const { selection, setSelection, toggleFood, toast } = useUi();
  const navigate = useNavigate();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [classify, setClassify] = useState<Food | null>(null);
  const { minFoods, maxFoods } = db.settings;

  const selected = resolveFoods(selection, foodMap);
  const unclassified = selected.filter((f) => f.familyIds.length === 0);
  const canCheck = selected.length >= minFoods && unclassified.length === 0;

  const add = (f: Food) => {
    const r = toggleFood(f.id);
    if (!r.ok) toast(r.reason!, 'error');
  };

  const catFoods = useMemo(
    () => (openCat ? db.foods.filter((f) => f.active && f.categoryId === openCat).sort((a, b) => a.nameHe.localeCompare(b.nameHe, 'he')) : []),
    [db.foods, openCat],
  );

  const check = () => {
    if (!canCheck) return;
    navigate(`/result?f=${selection.join(',')}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <section className="mb-6 text-center sm:mb-8">
        <img src={logo} alt="" width={112} height={112} className="mx-auto mb-3 h-24 w-24 animate-pop sm:h-28 sm:w-28" />
        <h1 className="text-4xl font-bold tracking-tight text-leaf-dark sm:text-5xl">ComboMatch</h1>
        <p className="mt-1 text-xl font-semibold text-ink sm:text-2xl">שילובי וצירופי מזון</p>
        <p className="mt-2 text-lg text-muted">בודקים צירוף. אוכלים בראש שקט</p>
      </section>


      <section className="card p-4 sm:p-6" aria-labelledby="pick-title">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="pick-title" className="text-lg font-semibold">מה אוכלים?</h2>
          <span className="text-sm text-muted">{selected.length} מתוך {maxFoods} מזונות</span>
        </div>

        <FoodSearch selectedIds={selection} onPick={add} />

        <div className="mt-4 min-h-[3rem]" aria-live="polite">
          {selected.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-muted">
              בחרו {minFoods} עד {maxFoods} מזונות מהחיפוש או מהקטגוריות
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selected.map((f) => <FoodChip key={f.id} food={f} onRemove={() => toggleFood(f.id)} />)}
              {selected.length > 0 && (
                <button className="text-sm text-muted underline-offset-2 hover:underline" onClick={() => setSelection([])}>נקה הכל</button>
              )}
            </div>
          )}
        </div>

        {unclassified.length > 0 && (
          <div role="alert" className="mt-3 rounded-xl bg-warn-soft px-4 py-3 text-sm">
            <strong>{unclassified.map((f) => f.nameHe).join(', ')}</strong> עדיין לא שויך למשפחת מזון, ולכן לא ניתן לבדוק איתו צירוף.{' '}
            <button className="font-semibold text-leaf-dark underline" onClick={() => setClassify(unclassified[0])}>סווגו עכשיו</button>
          </div>
        )}

        <button className="btn-primary mt-5 w-full py-4 text-xl shadow-card" disabled={!canCheck} onClick={check}>
          בדוק צירוף
        </button>
        {selected.length < minFoods && (
          <p className="mt-2 text-center text-sm text-muted">הכפתור יופעל לאחר בחירת {minFoods} מזונות לפחות</p>
        )}
      </section>

      <section className="mt-6" aria-labelledby="cat-title">
        <h2 id="cat-title" className="mb-3 text-lg font-semibold">בחירה מהירה לפי קטגוריה</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {db.categories.map((c) => (
            <button
              key={c.id}
              aria-expanded={openCat === c.id}
              onClick={() => setOpenCat(openCat === c.id ? null : c.id)}
              className={`card flex flex-col items-center gap-1 px-2 py-3 text-center transition hover:-translate-y-0.5 ${
                openCat === c.id ? 'border-leaf ring-2 ring-leaf/30' : ''
              }`}
            >
              <span aria-hidden className="text-3xl">{c.icon}</span>
              <span className="text-sm font-medium leading-tight">{c.name}</span>
            </button>
          ))}
        </div>
        {openCat && (
          <div className="card mt-3 animate-pop p-3">
            <p className="mb-2 px-1 text-xs text-muted">הקטגוריות נועדו לניווט בלבד. תוצאת הבדיקה נקבעת לפי משפחת המזון של כל פריט.</p>
            <div className="flex flex-wrap gap-2">
              {catFoods.map((f) => {
                const on = selection.includes(f.id);
                return (
                  <button
                    key={f.id}
                    aria-pressed={on}
                    onClick={() => add(f)}
                    className={`chip ${on ? 'border-leaf bg-leaf text-white dark:text-bg' : 'hover:bg-cream'}`}
                  >
                    <span aria-hidden>{f.icon}</span>{f.nameHe}{on && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <nav className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="קישורים מהירים">
        <Link to="/meals" className="card flex items-center gap-3 p-4 hover:border-leaf">
          <span aria-hidden className="text-3xl">⭐</span>
          <span><span className="block font-semibold">הארוחות השמורות שלי</span><span className="text-sm text-muted">{db.savedMeals.length} ארוחות קבועות</span></span>
        </Link>
        <Link to="/rules" className="card flex items-center gap-3 p-4 hover:border-leaf">
          <span aria-hidden className="text-3xl">📖</span>
          <span><span className="block font-semibold">כללי צירופי המזון</span><span className="text-sm text-muted">משפחות המזון ומטריצת הצירופים</span></span>
        </Link>
      </nav>

      <FoodForm open={!!classify} food={classify} onClose={() => setClassify(null)} />
    </div>
  );
}
