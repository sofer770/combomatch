import { useEffect, useState } from 'react';
import type { Food, VerificationStatus } from '../domain/types';
import { store, useDb, useUi } from '../state/AppContext';
import { Modal } from './ui';

type Draft = {
  nameHe: string; nameEn: string; categoryId: string; familyIds: string[]; aliases: string; icon: string;
  classificationStatus: VerificationStatus; classificationNote: string; active: boolean;
};

const empty = (name = '', categoryId = ''): Draft => ({
  nameHe: name, nameEn: '', categoryId, familyIds: [], aliases: '', icon: '🍽️',
  classificationStatus: 'unverified', classificationNote: '', active: true,
});

/** Add or edit a food, including its family classification. */
export function FoodForm({ open, onClose, food, initialName, onSaved }: {
  open: boolean; onClose: () => void; food?: Food | null; initialName?: string; onSaved?: (food: Food) => void;
}) {
  const { categories, families, foods } = useDb();
  const { toast } = useUi();
  const [d, setD] = useState<Draft>(empty());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setD(
      food
        ? {
            nameHe: food.nameHe, nameEn: food.nameEn ?? '', categoryId: food.categoryId, familyIds: [...food.familyIds],
            aliases: food.aliases.join(', '), icon: food.icon, classificationStatus: food.classificationStatus,
            classificationNote: food.classificationNote ?? '', active: food.active,
          }
        : empty(initialName ?? '', categories[0]?.id ?? ''),
    );
  }, [open, food, initialName, categories]);

  const toggleFamily = (id: string) =>
    setD((x) => ({ ...x, familyIds: x.familyIds.includes(id) ? x.familyIds.filter((f) => f !== id) : [...x.familyIds, id] }));

  const save = () => {
    const name = d.nameHe.trim();
    if (!name) return setError('יש להזין שם בעברית');
    if (foods.some((f) => f.nameHe.trim() === name && f.id !== food?.id)) return setError('כבר קיים מזון בשם זה');
    const data = {
      nameHe: name,
      nameEn: d.nameEn.trim() || undefined,
      categoryId: d.categoryId,
      familyIds: d.familyIds,
      aliases: d.aliases.split(/[,،]/).map((a) => a.trim()).filter(Boolean),
      icon: d.icon.trim() || '🍽️',
      classificationStatus: d.classificationStatus,
      classificationNote: d.classificationNote.trim() || undefined,
      active: d.active,
    };
    if (food) {
      store.updateFood(food.id, data);
      toast('המזון עודכן');
      onSaved?.({ ...food, ...data });
    } else {
      const created = store.addFood(data);
      toast(data.familyIds.length ? 'המזון נוסף למאגר' : 'המזון נוסף. כדי לבדוק איתו צירוף יש לשייך אותו למשפחה');
      onSaved?.(created);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={food ? `עריכת מזון: ${food.nameHe}` : 'הוספת מזון חדש'}
      wide
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn-primary" onClick={save}>שמירה</button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <div>
          <label className="label" htmlFor="ff-name">שם בעברית *</label>
          <input id="ff-name" className="input" value={d.nameHe} onChange={(e) => setD({ ...d, nameHe: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="ff-icon">אייקון</label>
          <input id="ff-icon" className="input text-center text-xl" value={d.icon} onChange={(e) => setD({ ...d, icon: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="ff-en">שם באנגלית</label>
          <input id="ff-en" dir="ltr" className="input text-left" value={d.nameEn} onChange={(e) => setD({ ...d, nameEn: e.target.value })} />
        </div>
        <div className="sm:col-span-1">
          <label className="label" htmlFor="ff-cat">קטגוריה (לניווט)</label>
          <select id="ff-cat" className="input" value={d.categoryId} onChange={(e) => setD({ ...d, categoryId: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="label">משפחת מזון (קובעת את תוצאת הבדיקה)</legend>
        <div className="flex flex-wrap gap-2">
          {families.map((f) => {
            const on = d.familyIds.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleFamily(f.id)}
                className={`chip ${on ? 'border-leaf bg-leaf text-white dark:text-bg' : 'hover:bg-cream'}`}
              >
                <span aria-hidden>{f.icon}</span>{f.name}
              </button>
            );
          })}
        </div>
        {d.familyIds.length === 0 && (
          <p className="mt-2 text-sm text-warn">מזון ללא משפחה יישמר במאגר, אך לא ניתן יהיה לבדוק איתו צירוף.</p>
        )}
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="ff-status">סטטוס הסיווג</label>
          <select id="ff-status" className="input" value={d.classificationStatus}
            onChange={(e) => setD({ ...d, classificationStatus: e.target.value as VerificationStatus })}>
            <option value="verified">מאומת</option>
            <option value="unverified">טעון אימות</option>
          </select>
        </div>
        <label className="mt-6 flex items-center gap-2">
          <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--leaf))]" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} />
          פעיל (מופיע בחיפוש)
        </label>
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="ff-alias">מילות חיפוש חלופיות (מופרדות בפסיק)</label>
        <input id="ff-alias" className="input" value={d.aliases} onChange={(e) => setD({ ...d, aliases: e.target.value })} />
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="ff-note">הערה על הסיווג</label>
        <textarea id="ff-note" rows={2} className="input" value={d.classificationNote} onChange={(e) => setD({ ...d, classificationNote: e.target.value })} />
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
    </Modal>
  );
}
