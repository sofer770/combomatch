import { useMemo, useState } from 'react';
import type { Food } from '../domain/types';
import { normalizeHe } from '../engine/search';
import { FoodForm } from '../components/FoodForm';
import { ConfirmDialog, EmptyState, PageTitle } from '../components/ui';
import { store, useDb, useFamilyMap, useUi } from '../state/AppContext';
import { missingFoodLink } from '../share';

type Filter = 'all' | 'unverified' | 'unclassified' | 'inactive' | string;

export default function Foods() {
  const db = useDb();
  const famMap = useFamilyMap();
  const { toast } = useUi();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Food | 'new' | null>(null);
  const [removing, setRemoving] = useState<Food | null>(null);

  const list = useMemo(() => {
    const nq = normalizeHe(q);
    return db.foods
      .filter((f) => {
        if (filter === 'unverified' && f.classificationStatus === 'verified') return false;
        if (filter === 'unclassified' && f.familyIds.length > 0) return false;
        if (filter === 'inactive' && f.active) return false;
        if (filter !== 'inactive' && !f.active && filter !== 'all') return false;
        if (filter.startsWith('fam:') && !f.familyIds.includes(filter.slice(4))) return false;
        if (nq && ![f.nameHe, ...f.aliases, f.nameEn ?? ''].some((t) => normalizeHe(t).includes(nq))) return false;
        return true;
      })
      .sort((a, b) => Number(b.active) - Number(a.active) || a.nameHe.localeCompare(b.nameHe, 'he'));
  }, [db.foods, q, filter]);

  const counts = {
    unverified: db.foods.filter((f) => f.classificationStatus !== 'verified').length,
    unclassified: db.foods.filter((f) => f.familyIds.length === 0).length,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="מאגר המזונות" subtitle={`${db.foods.filter((f) => f.active).length} מזונות פעילים. כאן מוסיפים מזונות ומסווגים אותם למשפחות.`}
        actions={<button className="btn-primary" onClick={() => setEditing('new')}>+ מזון חדש</button>} />
      <p className="-mt-2 mb-4 text-sm text-muted">
        חסר מזון ברשימה?{' '}
        <a href={missingFoodLink()} target="_blank" rel="noopener noreferrer" className="font-medium text-leaf-dark hover:underline">💬 חסר לי מזון, עדכנו אותנו</a>
      </p>

      <div className="card mb-4 grid gap-3 p-3 sm:grid-cols-[1fr_16rem]">
        <input type="search" aria-label="סינון לפי שם" className="input" placeholder="חיפוש במאגר" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="סינון" className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">כל המזונות</option>
          <option value="unverified">סיווג טעון אימות ({counts.unverified})</option>
          <option value="unclassified">ללא משפחה ({counts.unclassified})</option>
          <option value="inactive">לא פעילים</option>
          {db.families.map((f) => <option key={f.id} value={`fam:${f.id}`}>משפחה: {f.name}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState icon="🔍" title="לא נמצאו מזונות" text="נסו חיפוש אחר, או הוסיפו מזון חדש למאגר."
          action={<button className="btn-soft" onClick={() => setEditing('new')}>+ מזון חדש</button>} />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map((f) => (
            <li key={f.id} className={`card flex items-center gap-3 p-3 ${f.active ? '' : 'opacity-60'}`}>
              <span aria-hidden className="text-3xl">{f.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{f.nameHe} {f.nameEn && <span className="text-xs font-normal text-muted" dir="ltr">{f.nameEn}</span>}</p>
                <p className="truncate text-sm text-muted">
                  {f.familyIds.length ? f.familyIds.map((id) => famMap.get(id)?.name ?? id).join(' + ') : <span className="text-warn">ללא משפחה</span>}
                </p>
                <p className="mt-1 flex flex-wrap gap-1 text-xs">
                  {f.classificationStatus === 'verified'
                    ? <span className="rounded-full bg-leaf-soft px-2 py-0.5 text-leaf-dark">מופיע במסמך שיטת הבריאות הטבעית</span>
                    : <span className="rounded-full bg-earth-soft px-2 py-0.5 text-earth" title={f.classificationNote}>סיווג טעון אימות</span>}
                  {f.custom && <span className="rounded-full bg-cream px-2 py-0.5">נוסף ידנית</span>}
                  {!f.active && <span className="rounded-full bg-unk-soft px-2 py-0.5">לא פעיל</span>}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <button className="btn-soft px-3 py-1.5 text-sm" onClick={() => setEditing(f)}>עריכה</button>
                {f.active
                  ? <button className="btn-ghost px-3 py-1.5 text-sm text-bad" onClick={() => setRemoving(f)}>{f.custom ? 'מחיקה' : 'השבתה'}</button>
                  : <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => { store.updateFood(f.id, { active: true }); toast('המזון הופעל מחדש'); }}>הפעלה</button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <FoodForm open={!!editing} food={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} danger
        title={removing?.custom ? 'מחיקת מזון' : 'השבתת מזון'}
        confirmLabel={removing?.custom ? 'מחק' : 'השבת'}
        text={removing?.custom
          ? `למחוק את "${removing?.nameHe}" מהמאגר? אם הוא חלק מארוחה שמורה, הוא יושבת במקום להימחק.`
          : `להשבית את "${removing?.nameHe}"? הוא לא יופיע בחיפוש, וניתן להפעילו מחדש בכל עת.`}
        onConfirm={() => { if (removing) { store.removeFood(removing.id); toast('בוצע'); } }} />
    </div>
  );
}
