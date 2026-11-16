import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { HistoryEntry, Level } from '../domain/types';
import { familyName } from '../engine/ruleEngine';
import { ConfirmDialog, EmptyState, LevelBadge, LevelDot, PageTitle, VerificationTag, formatDate } from '../components/ui';
import { store, useDb, useUi } from '../state/AppContext';

export default function History() {
  const db = useDb();
  const navigate = useNavigate();
  const { setSelection, toast } = useUi();
  const [open, setOpen] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all');

  const recheck = (h: HistoryEntry) => {
    const missing = h.foodIds.filter((id) => !db.foods.some((f) => f.id === id && f.active));
    if (missing.length) return toast('אחד המזונות בבדיקה זו כבר אינו פעיל במאגר', 'error');
    setSelection(h.foodIds);
    navigate(`/result?f=${h.foodIds.join(',')}`);
  };
  const list = db.history.filter((h) => levelFilter === 'all' || h.level === levelFilter);
  const foodName = (id: string, h: HistoryEntry) => db.foods.find((f) => f.id === id)?.nameHe ?? h.foodNames[h.foodIds.indexOf(id)] ?? id;

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="היסטוריית בדיקות"
        subtitle={db.settings.saveHistory ? 'כל בדיקה נשמרת עם הכללים שהופעלו וגרסת הכללים באותו זמן.' : 'שמירת ההיסטוריה כבויה בהגדרות.'}
        actions={db.history.length > 0 && <button className="btn-danger text-sm" onClick={() => setConfirmClear(true)}>ניקוי היסטוריה</button>} />

      {db.history.length === 0 ? (
        <EmptyState icon="🕒" title="עדיין אין בדיקות" text="כל צירוף שתבדקו יופיע כאן." action={<Link to="/" className="btn-primary">לבדיקת צירוף</Link>} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="סינון לפי תוצאה">
            {(['all', 'green', 'red', 'unknown'] as const).map((l) => (
              <button key={l} aria-pressed={levelFilter === l} onClick={() => setLevelFilter(l)}
                className={`chip ${levelFilter === l ? 'border-leaf bg-leaf-soft font-semibold' : ''}`}>
                {l === 'all' ? `הכל (${db.history.length})` : <LevelBadge level={l} />}
              </button>
            ))}
          </div>
          <ul className="grid gap-2">
            {list.map((h) => (
              <li key={h.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <LevelDot level={h.level} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{h.foodIds.map((id) => foodName(id, h)).join(' + ')}</p>
                    <p className="text-sm text-ink/80">{h.summary}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(h.checkedAt)} · גרסת כללים {h.rulesVersion}{h.demoMode && ' · במצב הדגמה'}
                      {h.rulesVersion !== db.settings.rulesVersion && <span className="text-earth"> · הכללים עודכנו מאז</span>}
                    </p>
                  </div>
                </div>
                {open === h.id && (
                  <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                    {h.appliedRules.map((r, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        <LevelBadge level={r.level} />
                        <span>{foodName(r.foodA, h)} + {foodName(r.foodB, h)}</span>
                        <span className="text-muted">({familyName(db.families, r.familyA)} + {familyName(db.families, r.familyB)}): {r.title}</span>
                        <VerificationTag status={r.verificationStatus} />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-primary px-4 py-1.5 text-sm" onClick={() => recheck(h)}>בדיקה חוזרת</button>
                  <button className="btn-soft px-4 py-1.5 text-sm" aria-expanded={open === h.id} onClick={() => setOpen(open === h.id ? null : h.id)}>
                    {open === h.id ? 'הסתרת הכללים' : 'הכללים שהופעלו'}
                  </button>
                  <button className="btn-ghost px-3 py-1.5 text-sm text-muted" onClick={() => { store.deleteHistory(h.id); toast('הבדיקה נמחקה מההיסטוריה'); }}>מחיקה</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <ConfirmDialog open={confirmClear} onClose={() => setConfirmClear(false)} title="ניקוי היסטוריה" danger confirmLabel="נקה הכל"
        text="כל היסטוריית הבדיקות תימחק. הארוחות השמורות לא יושפעו." onConfirm={() => { store.clearHistory(); toast('ההיסטוריה נוקתה'); }} />
    </div>
  );
}
