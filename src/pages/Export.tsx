import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Food, Level } from '../domain/types';
import { LEVEL_SEVERITY } from '../domain/types';
import { evaluateMeal, LEVEL_TEXT, type CheckResult } from '../engine/ruleEngine';
import { DISCLAIMER, formatDate, LEVEL_STYLE, PageTitle } from '../components/ui';
import { resolveFoods, store, useDb, useFoodMap } from '../state/AppContext';
import logo from '../assets/logo.png';

const safeEval = (foods: Food[], rules: Parameters<typeof evaluateMeal>[1]): CheckResult | null => {
  try { return evaluateMeal(foods, rules); } catch { return null; }
};

function Verdict({ level }: { level: Level }) {
  const s = LEVEL_STYLE[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${s.bg} ${s.text}`}>
      <span aria-hidden>{s.symbol}</span>{LEVEL_TEXT[level].short}
    </span>
  );
}

function PairList({ result }: { result: CheckResult }) {
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {[...result.pairs].sort((a, b) => LEVEL_SEVERITY[b.level] - LEVEL_SEVERITY[a.level]).map((p) => (
        <li key={`${p.foodA.id}-${p.foodB.id}`} className="flex gap-2">
          <span className={`mt-0.5 shrink-0 font-bold ${LEVEL_STYLE[p.level].text}`} aria-hidden>{LEVEL_STYLE[p.level].symbol}</span>
          <span>
            <strong>{p.foodA.nameHe} + {p.foodB.nameHe}:</strong>{' '}
            {p.decisive.rule?.explanation || LEVEL_TEXT[p.level].title}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Export() {
  const db = useDb();
  const foodMap = useFoodMap();
  const rules = useMemo(() => store.effectiveRules(db), [db]);
  const [params] = useSearchParams();
  const initial = params.get('include');
  const currentIds = (params.get('f') ?? '').split(',').filter(Boolean);
  const currentFoods = resolveFoods(currentIds, foodMap);
  const current = currentFoods.length >= 2 ? safeEval(currentFoods, rules) : null;
  const [withCurrent, setWithCurrent] = useState(!!current);
  const [withMeals, setWithMeals] = useState(!current && initial !== 'history');
  const [withHistory, setWithHistory] = useState(!current && initial !== 'meals');
  const [historyLimit, setHistoryLimit] = useState(20);

  const meals = db.savedMeals.map((m) => {
    const foods = resolveFoods(store.mealFoodIds(m.id, db), foodMap);
    return { meal: m, foods, result: safeEval(foods, rules) };
  });
  const history = db.history.slice(0, historyLimit);
  const nothing = (!withCurrent || !current) && (!withMeals || meals.length === 0) && (!withHistory || history.length === 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="print:hidden">
        <PageTitle title="ייצוא ל-PDF" subtitle="בחרו מה לכלול, ולחצו על שמירה כ-PDF." />
        <section className="card p-4 sm:p-5">
          <fieldset className="flex flex-wrap gap-x-6 gap-y-3">
            <legend className="sr-only">מה לכלול</legend>
            {current && <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--leaf))]" checked={withCurrent} onChange={(e) => setWithCurrent(e.target.checked)} />הבדיקה הנוכחית</label>}
            <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--leaf))]" checked={withMeals} onChange={(e) => setWithMeals(e.target.checked)} />ארוחות קבועות ({meals.length})</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--leaf))]" checked={withHistory} onChange={(e) => setWithHistory(e.target.checked)} />היסטוריית בדיקות ({db.history.length})</label>
            {withHistory && db.history.length > 0 && (
              <label className="flex items-center gap-2 text-sm">
                כמה בדיקות:
                <select className="input w-auto py-1.5" value={historyLimit} onChange={(e) => setHistoryLimit(Number(e.target.value))}>
                  {[10, 20, 50, 100, 1000].map((n) => <option key={n} value={n}>{n === 1000 ? 'הכל' : `${n} אחרונות`}</option>)}
                </select>
              </label>
            )}
          </fieldset>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" disabled={nothing} onClick={() => window.print()}>שמירה כ-PDF</button>
            <Link to="/" className="btn-soft">לאפליקציה</Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            בחלון שייפתח בחרו "שמירה כ-PDF" (במחשב ובאנדרואיד), או באייפון: שיתוף ואז "הדפסה", ושם שיתוף ושמירה בקבצים.
          </p>
        </section>
        <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">תצוגה מקדימה</h2>
      </div>

      {/* The printable report */}
      <article id="report" className="card p-5 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-center gap-3 border-b border-line pb-3">
          <img src={logo} alt="" width={48} height={48} className="h-12 w-12" />
          <div>
            <h1 className="text-xl font-bold text-leaf-dark">ComboMatch - שילובי וצירופי מזון</h1>
            <p className="text-sm text-muted">דוח צירופי מזון · {formatDate(new Date().toISOString())}</p>
          </div>
        </header>

        {nothing && <p className="py-8 text-center text-muted">אין עדיין נתונים לייצוא. שמרו ארוחה או בצעו בדיקה, וחזרו לכאן.</p>}

        {withCurrent && current && (
          <section className="mt-5 break-inside-avoid">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">בדיקת צירוף</h2>
              <Verdict level={current.level} />
            </div>
            <p className="mt-1">{currentFoods.map((f) => `${f.icon} ${f.nameHe}`).join('  ·  ')}</p>
            <PairList result={current} />
          </section>
        )}

        {withMeals && meals.length > 0 && (
          <section className="mt-5">
            <h2 className="text-lg font-semibold">ארוחות קבועות</h2>
            <ul className="mt-2 divide-y divide-line">
              {meals.map(({ meal, foods, result }) => (
                <li key={meal.id} className="break-inside-avoid py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{meal.name}</h3>
                    {result && <Verdict level={result.level} />}
                  </div>
                  <p className="mt-1">{foods.map((f) => `${f.icon} ${f.nameHe}`).join('  ·  ')}</p>
                  {result && <PairList result={result} />}
                </li>
              ))}
            </ul>
          </section>
        )}

        {withHistory && history.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">היסטוריית בדיקות</h2>
            <table className="mt-2 w-full text-sm">
              <thead className="bg-cream text-start">
                <tr>
                  <th scope="col" className="p-2 text-start font-medium">תאריך</th>
                  <th scope="col" className="p-2 text-start font-medium">מזונות</th>
                  <th scope="col" className="p-2 text-start font-medium">תוצאה</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="break-inside-avoid border-t border-line align-top">
                    <td className="whitespace-nowrap p-2">{formatDate(h.checkedAt)}</td>
                    <td className="p-2">{h.foodNames.join(' + ')}</td>
                    <td className="p-2"><Verdict level={h.level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="mt-6 border-t border-line pt-3 text-xs text-muted">
          <p>{DISCLAIMER}</p>
          <p className="mt-1">נוצר ע״י יאיר גלעדי - © - ״המרכז לבריאות טבעית״ · el-habriut.co.il · 054-2135831 · combo.el-habriut.co.il</p>
        </footer>
      </article>
    </div>
  );
}
