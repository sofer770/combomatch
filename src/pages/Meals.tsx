import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Id, SavedMeal } from '../domain/types';
import { evaluateMeal } from '../engine/ruleEngine';
import { FoodSearch } from '../components/FoodSearch';
import { ConfirmDialog, EmptyState, FoodChip, LevelBadge, Modal, PageTitle, formatDate } from '../components/ui';
import { resolveFoods, store, useDb, useFoodMap, useUi } from '../state/AppContext';

export default function Meals() {
  const db = useDb();
  const foodMap = useFoodMap();
  const { setSelection, toast } = useUi();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<SavedMeal | null>(null);
  const [deleting, setDeleting] = useState<SavedMeal | null>(null);

  const load = (m: SavedMeal) => {
    setSelection(store.mealFoodIds(m.id));
    navigate('/');
    toast(`"${m.name}" נטענה למסך הבית`, 'info');
  };
  const recheck = (m: SavedMeal) => {
    const ids = store.mealFoodIds(m.id);
    setSelection(ids);
    navigate(`/result?f=${ids.join(',')}&meal=${m.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="ארוחות קבועות" subtitle="שילובים שאתם אוכלים לעיתים קרובות. לחיצה על ארוחה טוענת אותה למסך הבית." />
      {db.savedMeals.length === 0 ? (
        <EmptyState icon="⭐" title="עדיין אין ארוחות שמורות"
          text='אחרי בדיקת צירוף, לחצו על "שמור כארוחה קבועה" כדי לשמור אותו כאן.'
          action={<Link to="/" className="btn-primary">לבדיקת צירוף</Link>} />
      ) : (
        <ul className="grid gap-3">
          {db.savedMeals.map((m) => {
            const foods = resolveFoods(store.mealFoodIds(m.id, db), foodMap);
            const stale = m.lastCheck && m.lastCheck.rulesVersion !== db.settings.rulesVersion;
            return (
              <li key={m.id} className="card p-4">
                <button className="block w-full text-start" onClick={() => load(m)} aria-label={`טען את ${m.name} למסך הבית`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{m.name}</h2>
                    {m.lastCheck ? <LevelBadge level={m.lastCheck.level} size="md" /> : <span className="text-sm text-muted">טרם נבדק</span>}
                  </div>
                  <p className="mt-1 text-lg">
                    {foods.map((f) => <span key={f.id} className="me-3 inline-flex items-center gap-1"><span aria-hidden>{f.icon}</span>{f.nameHe}</span>)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    נשמרה {formatDate(m.createdAt)}
                    {m.lastCheck && <> · נבדקה לאחרונה {formatDate(m.lastCheck.checkedAt)} (גרסת כללים {m.lastCheck.rulesVersion})</>}
                    {stale && <span className="text-earth"> · הכללים עודכנו מאז, כדאי לבדוק שוב</span>}
                  </p>
                </button>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-primary px-4 py-2 text-sm" onClick={() => recheck(m)}>בדוק שוב</button>
                  <button className="btn-soft px-4 py-2 text-sm" onClick={() => setEditing(m)}>ערוך</button>
                  <button className="btn-danger px-4 py-2 text-sm" onClick={() => setDeleting(m)}>מחק</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <EditMealDialog meal={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        title="מחיקת ארוחה"
        text={`למחוק את "${deleting?.name}"? לא ניתן לבטל פעולה זו.`}
        confirmLabel="מחק"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { store.deleteMeal(deleting.id); toast('הארוחה נמחקה'); } }}
      />
    </div>
  );
}

function EditMealDialog({ meal, onClose }: { meal: SavedMeal | null; onClose: () => void }) {
  const db = useDb();
  const foodMap = useFoodMap();
  const { toast } = useUi();
  const [name, setName] = useState('');
  const [ids, setIds] = useState<Id[]>([]);
  const [error, setError] = useState('');
  const { minFoods, maxFoods } = db.settings;

  useEffect(() => {
    if (meal) { setName(meal.name); setIds(store.mealFoodIds(meal.id)); setError(''); }
  }, [meal]);

  const save = () => {
    if (!meal) return;
    if (!name.trim()) return setError('יש לתת שם לארוחה');
    if (ids.length < minFoods) return setError(`ארוחה צריכה לכלול לפחות ${minFoods} מזונות`);
    const foods = resolveFoods(ids, foodMap);
    let lastCheck = meal.lastCheck;
    try {
      const r = evaluateMeal(foods, store.effectiveRules(), { minFoods, maxFoods });
      lastCheck = { level: r.level, checkedAt: new Date().toISOString(), rulesVersion: db.settings.rulesVersion, demoMode: db.settings.demoMode };
    } catch {
      lastCheck = undefined; // e.g. an unclassified food: no valid result
    }
    store.updateMeal(meal.id, { name, foodIds: ids, lastCheck });
    toast('הארוחה עודכנה');
    onClose();
  };

  return (
    <Modal open={!!meal} onClose={onClose} title="עריכת ארוחה"
      footer={<><button className="btn-ghost" onClick={onClose}>ביטול</button><button className="btn-primary" onClick={save}>שמירה</button></>}>
      <label className="label" htmlFor="edit-meal-name">שם הארוחה</label>
      <input id="edit-meal-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <p className="label mt-4">מזונות ({ids.length} מתוך {maxFoods})</p>
      <div className="mb-3 flex min-h-[2.5rem] flex-wrap gap-2">
        {resolveFoods(ids, foodMap).map((f) => <FoodChip key={f.id} food={f} onRemove={() => setIds(ids.filter((x) => x !== f.id))} />)}
      </div>
      {ids.length < maxFoods ? (
        <div className="min-h-[14rem]">
          <FoodSearch selectedIds={ids} onPick={(f) => setIds([...ids, f.id])} placeholder="הוספת מזון לארוחה" />
        </div>
      ) : (
        <p className="text-sm text-muted">הגעתם למספר המזונות המרבי. הסירו מזון כדי להוסיף אחר.</p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}
    </Modal>
  );
}
