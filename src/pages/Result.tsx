import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Food } from '../domain/types';
import { LEVEL_SEVERITY } from '../domain/types';
import { tipsForFamilies } from '../data/tips';
import { suggestAlternatives } from '../engine/alternatives';
import {
  CheckError, evaluateMeal, familyName, LEVEL_TEXT, SEVERITY_ORDER_TEXT, summarize, toAppliedRecords, type CheckResult,
} from '../engine/ruleEngine';
import { FoodSearch } from '../components/FoodSearch';
import { SaveMealDialog } from '../components/SaveMealDialog';
import { EmptyState, LEVEL_STYLE, LevelBadge, LevelDot, Modal, VerificationTag } from '../components/ui';
import { resolveFoods, store, useDb, useFoodMap, useUi } from '../state/AppContext';

const HERO_TEXT = {
  green: { head: 'צירוף מתאים', body: 'על פי כללי שיטת הבריאות הטבעית שהוגדרו באפליקציה, כל הזוגות בארוחה מתאימים לשילוב.' },
  yellow: { head: 'צירוף עם הסתייגות', body: 'על פי כללי שיטת הבריאות הטבעית שהוגדרו באפליקציה, יש בארוחה שילוב שדורש תשומת לב.' },
  red: { head: 'כדאי לשקול שינוי בצירוף', body: 'על פי כללי שיטת הבריאות הטבעית שהוגדרו באפליקציה, השילוב בין משפחות המזון הללו אינו מומלץ.' },
  unknown: { head: 'המידע אינו מוגדר', body: 'לחלק מהזוגות בארוחה אין עדיין כלל מוגדר במטריצה, ולכן האפליקציה לא מנחשת תוצאה.' },
} as const;

const LEVEL_VAR = { green: 'ok', yellow: 'warn', red: 'bad', unknown: 'unk' } as const;

export default function Result() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const db = useDb();
  const foodMap = useFoodMap();
  const { setSelection, toast } = useUi();
  const ids = useMemo(() => (params.get('f') ?? '').split(',').filter(Boolean), [params]);
  const mealId = params.get('meal');
  const foods = useMemo(() => resolveFoods(ids, foodMap), [ids, foodMap]);
  const rules = useMemo(() => store.effectiveRules(db), [db]);

  const [details, setDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapChooser, setSwapChooser] = useState(false);

  const outcome = useMemo((): { result?: CheckResult; error?: string } => {
    if (ids.length === 0) return { error: 'לא נבחרו מזונות לבדיקה.' };
    if (foods.length !== ids.length) return { error: 'אחד המזונות אינו קיים עוד במאגר.' };
    try {
      return { result: evaluateMeal(foods, rules, { minFoods: db.settings.minFoods, maxFoods: db.settings.maxFoods }) };
    } catch (e) {
      return { error: e instanceof CheckError ? e.message : 'אירעה שגיאה בבדיקה' };
    }
  }, [foods, ids.length, rules, db.settings.minFoods, db.settings.maxFoods]);
  const result = outcome.result;

  const alternatives = useMemo(
    () => (result ? suggestAlternatives(foods, result, db.foods, rules, 3) : []),
    [result, foods, db.foods, rules],
  );

  // Record history once per (foods, rules version, demo mode), and refresh the saved meal's last result.
  const recorded = useRef(new Set<string>());
  useEffect(() => {
    if (!result) return;
    const key = `${ids.join(',')}|${db.settings.rulesVersion}|${db.settings.demoMode}`;
    if (recorded.current.has(key)) return;
    recorded.current.add(key);
    const snapshot = {
      level: result.level, checkedAt: new Date().toISOString(), rulesVersion: db.settings.rulesVersion, demoMode: db.settings.demoMode,
    };
    store.addHistory({
      checkedAt: snapshot.checkedAt,
      foodIds: ids,
      foodNames: foods.map((f) => f.nameHe),
      level: result.level,
      summary: summarize(result, db.families),
      rulesVersion: db.settings.rulesVersion,
      demoMode: db.settings.demoMode,
      appliedRules: toAppliedRecords(result),
    });
    if (mealId && store.getState().savedMeals.some((m) => m.id === mealId)) store.updateMeal(mealId, { lastCheck: snapshot });
  }, [result, ids, foods, mealId, db.settings.rulesVersion, db.settings.demoMode, db.families]);

  const goWith = (newFoods: Food[]) => {
    setSelection(newFoods.map((f) => f.id));
    navigate(`/result?f=${newFoods.map((f) => f.id).join(',')}`);
  };

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon="⚠️" title="לא ניתן לבצע את הבדיקה" text={outcome.error}
          action={<Link className="btn-primary" to="/">חזרה למסך הבית</Link>} />
      </div>
    );
  }

  const style = LEVEL_STYLE[result.level];
  const hero = HERO_TEXT[result.level];
  const problemPairs = result.pairs.filter((p) => p.level === result.level && result.level !== 'green');
  const suggestions = [...new Set(problemPairs.map((p) => p.decisive.rule?.suggestion).filter(Boolean))] as string[];
  const fam = (id: string) => familyName(db.families, id);
  const unverifiedFoods = foods.filter((f) => f.classificationStatus !== 'verified');

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-lg">
        {foods.map((f, i) => (
          <span key={f.id} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="text-muted">+</span>}
            <span className="chip text-base"><span aria-hidden className="text-xl">{f.icon}</span>{f.nameHe}</span>
          </span>
        ))}
      </div>

      <section aria-live="polite" data-level={result.level} className={`animate-pop rounded-3xl p-6 text-center ring-4 ${style.bg} ${style.ring}`}>
        <div aria-hidden className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-4xl font-bold text-white shadow-card ${style.dot}`}>
          {style.symbol}
        </div>
        <p className={`mt-3 text-sm font-semibold ${style.text}`}>{LEVEL_TEXT[result.level].title}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{hero.head}</h1>
        <p className="mx-auto mt-2 max-w-xl text-ink/80">{hero.body}</p>
        {(result.usesDemoRules || result.usesUnverifiedRules) && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {result.usesDemoRules && <VerificationTag status="demo" />}
            {result.usesUnverifiedRules && <VerificationTag status="unverified" />}
          </div>
        )}
      </section>

      <section className="card mt-4 p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">{foods.length > 2 ? `בדיקת כל הזוגות בארוחה (${result.pairs.length})` : 'הסיבה לסיווג'}</h2>
        <ul className="space-y-3">
          {[...result.pairs].sort((a, b) => LEVEL_SEVERITY[b.level] - LEVEL_SEVERITY[a.level]).map((p) => (
            <li key={`${p.foodA.id}-${p.foodB.id}`} className="flex gap-3">
              <LevelDot level={p.level} />
              <div className="flex-1">
                <p className="font-medium">
                  {p.foodA.nameHe} + {p.foodB.nameHe}{' '}
                  <span className="text-sm font-normal text-muted">({fam(p.decisive.familyA)} + {fam(p.decisive.familyB)})</span>
                </p>
                <p className="text-sm text-ink/80">
                  {p.decisive.rule && p.decisive.level !== 'unknown'
                    ? p.decisive.rule.explanation
                    : 'טרם הוגדר כלל לצירוף בין משפחות אלו. ניתן להגדיר אותו במסך הכללים.'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {(result.level === 'red' || result.level === 'yellow') && (
        <section className="card mt-4 p-4 sm:p-5">
          <h2 className="mb-2 font-semibold">איך לשפר את הארוחה</h2>
          {suggestions.map((s) => <p key={s} className="mb-3 text-ink/80">{s}</p>)}
          {alternatives.length > 0 ? (
            <ul className="grid gap-2" aria-label="חלופות מוצעות">
              {alternatives.map((a) => (
                <li key={`${a.replaceIndex}-${a.candidate.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-3">
                  <span aria-hidden className="text-2xl">{a.candidate.icon}</span>
                  <div className="min-w-[12rem] flex-1">
                    <p className="font-medium">
                      להחליף את {a.replaced.nameHe} ב{a.candidate.nameHe} <LevelBadge level={a.newLevel} />
                    </p>
                    <p className="text-sm text-muted">{a.explanation}</p>
                  </div>
                  <button className="btn-soft" onClick={() => { goWith(a.newFoods); toast(`${a.replaced.nameHe} הוחלף ב${a.candidate.nameHe}`); }}>
                    החלף
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">לא נמצאה במאגר החלפה של רכיב אחד שמובילה לצירוף מתאים לפי הכללים המוגדרים.</p>
          )}
        </section>
      )}

      {result.level === 'unknown' && (
        <section className="card mt-4 p-4 text-sm sm:p-5">
          <p>
            אפשר להגדיר את הכלל החסר ב<Link to="/rules" className="font-semibold text-leaf-dark underline">מסך הכללים</Link>.
            עד אז האפליקציה לא תסווג את הצירוף.
          </p>
        </section>
      )}

      {(() => {
        const tips = tipsForFamilies(foods.flatMap((f) => f.familyIds));
        return tips.length > 0 && (
          <section className="card mt-4 border-s-4 border-leaf p-4 sm:p-5" aria-labelledby="tip-title">
            <h2 id="tip-title" className="font-semibold">💡 טיפ משיטת הבריאות הטבעית</h2>
            <ul className="mt-2 space-y-2">
              {tips.map((t) => (
                <li key={t.id} className="flex gap-2">
                  <span aria-hidden>{t.icon}</span>
                  <span><strong>{t.title}:</strong> {t.text}</span>
                </li>
              ))}
            </ul>
            <Link to="/tips" className="mt-2 inline-block text-sm font-medium text-leaf-dark hover:underline">לכל הטיפים ←</Link>
          </section>
        );
      })()}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button className="btn-soft" onClick={() => setSwapChooser(true)}>🔄 החלף רכיב</button>
        <button className="btn-soft" onClick={() => setSaving(true)}>⭐ שמור כארוחה קבועה</button>
        <Link className="btn-soft" to={`/export?f=${ids.join(',')}`}>📄 שמירה כ-PDF</Link>
        <button className="btn-soft" aria-expanded={details} onClick={() => setDetails(!details)}>
          📋 {details ? 'הסתר הסבר מפורט' : 'הצג הסבר מפורט'}
        </button>
        <button className="btn-ghost border border-line" onClick={() => { setSelection([]); navigate('/'); }}>בדוק צירוף אחר</button>
        <button className="btn-ghost border border-line" onClick={() => { setSelection(ids); navigate('/'); }}>חזור למסך הבית</button>
      </div>

      {details && (
        <section className="card mt-4 animate-pop p-4 text-sm sm:p-5">
          <h2 className="mb-3 font-semibold">הסבר מפורט</h2>
          <p className="mb-3 text-muted">
            כל זוג מזונות נבדק בנפרד, ולכל זוג נבדקו כל צירופי המשפחות שלו. סדר העדיפות בין תוצאות: {SEVERITY_ORDER_TEXT}.
            {' '}גרסת הכללים: {db.settings.rulesVersion}.
          </p>
          <div className="space-y-4">
            {result.pairs.map((p) => (
              <div key={`${p.foodA.id}-${p.foodB.id}`} className="rounded-2xl border border-line p-3">
                <p className="mb-2 font-semibold">{p.foodA.nameHe} + {p.foodB.nameHe} <LevelBadge level={p.level} /></p>
                {p.checks.map((c) => (
                  <div key={`${c.familyA}-${c.familyB}`} className="mb-2 border-s-4 ps-3" style={{ borderColor: `rgb(var(--${LEVEL_VAR[c.level]}))` }}>
                    <p className="font-medium">{fam(c.familyA)} + {fam(c.familyB)}</p>
                    {c.rule ? (
                      <>
                        <p>{c.rule.explanation}</p>
                        {c.rule.suggestion && <p className="text-muted">הצעה: {c.rule.suggestion}</p>}
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">מקור: {c.rule.source} <VerificationTag status={c.rule.verificationStatus} /></p>
                      </>
                    ) : (
                      <p className="text-muted">טרם הוגדר כלל במטריצה.</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {unverifiedFoods.length > 0 && (
            <p className="mt-3 rounded-xl bg-earth-soft px-3 py-2 text-earth">
              הסיווג של {unverifiedFoods.map((f) => f.nameHe).join(', ')} למשפחת מזון טרם אומת מול מסמך שיטת הבריאות הטבעית.
            </p>
          )}
        </section>
      )}


      <SaveMealDialog
        open={saving}
        onClose={() => setSaving(false)}
        onSave={(name) => {
          store.saveMeal(name, ids, {
            level: result.level, checkedAt: new Date().toISOString(), rulesVersion: db.settings.rulesVersion, demoMode: db.settings.demoMode,
          });
          toast(`הארוחה "${name}" נשמרה`);
        }}
      />

      <Modal
        open={swapChooser}
        onClose={() => { setSwapChooser(false); setSwapIndex(null); }}
        title={swapIndex === null ? 'איזה רכיב להחליף?' : `החלפת ${foods[swapIndex]?.nameHe}`}
      >
        {swapIndex === null ? (
          <div className="grid gap-2">
            {foods.map((f, i) => (
              <button key={f.id} className="chip justify-start py-3 text-base hover:bg-cream" onClick={() => setSwapIndex(i)}>
                <span aria-hidden className="text-xl">{f.icon}</span>{f.nameHe}
              </button>
            ))}
          </div>
        ) : (
          <div className="min-h-[18rem]">
            <FoodSearch
              autoFocus
              selectedIds={ids}
              placeholder="חפשו מזון חלופי"
              onPick={(f) => {
                const next = foods.map((x, k) => (k === swapIndex ? f : x));
                setSwapChooser(false);
                setSwapIndex(null);
                goWith(next);
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
