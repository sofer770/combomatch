import { useEffect, useMemo, useRef, useState } from 'react';
import type { CombinationRule, FoodFamily, Level, VerificationStatus } from '../domain/types';
import { buildRuleIndex, LEVEL_TEXT, pairKey, SEVERITY_ORDER_TEXT } from '../engine/ruleEngine';
import { METHOD_SOURCE_DOC } from '../data/methodRules';
import { ConfirmDialog, LEVEL_STYLE, Modal, PageTitle, VerificationTag } from '../components/ui';
import { store, useDb, useUi } from '../state/AppContext';
import { ExportDialog } from '../components/ExportDialog';

const LEVEL_HELP: Record<Level, string> = {
  green: 'שילוב מומלץ לפי כללי שיטת הבריאות הטבעית.',
  yellow: 'שילוב שאינו אידיאלי או דורש תשומת לב. (מסמך שיטת הבריאות הטבעית אינו מגדיר רמה זו.)',
  red: 'שילוב שאינו מומלץ לפי כללי שיטת הבריאות הטבעית.',
  unknown: 'אין כלל מוגדר. האפליקציה לא מנחשת ומציגה "טרם הוגדר".',
};

export default function Rules() {
  const db = useDb();
  const { toast } = useUi();
  const rules = useMemo(() => store.effectiveRules(db), [db]);
  const index = useMemo(() => buildRuleIndex(rules), [rules]);
  const fams = useMemo(() => [...db.families].sort((a, b) => a.order - b.order), [db.families]);
  const [cell, setCell] = useState<{ a: FoodFamily; b: FoodFamily } | null>(null);
  const [famEdit, setFamEdit] = useState<FoodFamily | 'new' | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [exporting, setExporting] = useState(false);

  const totalCells = (fams.length * (fams.length + 1)) / 2;
  const defined = fams.flatMap((a, i) => fams.slice(i).map((b) => index.get(pairKey(a.id, b.id)))).filter((r) => r && r.level !== 'unknown');
  const unverified = defined.filter((r) => r?.verificationStatus === 'unverified').length;
  const foodsPerFamily = (id: string) => db.foods.filter((f) => f.active && f.familyIds.includes(id)).length;

  const onImport = async (file: File) => {
    try {
      const n = store.importRules(await file.text(), importMode);
      toast(`יובאו ${n} כללים`);
    } catch (e) {
      toast(`הייבוא נכשל: ${e instanceof Error ? e.message : 'קובץ לא תקין'}`, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="כללי צירופי המזון" subtitle={`משפחות המזון ומטריצת הצירופים לפי ${METHOD_SOURCE_DOC}.`} />

      <section className="grid gap-2 sm:grid-cols-3 sm:gap-3" aria-label="מקרא צבעים">
        {(['green', 'red', 'unknown'] as Level[]).map((l) => (
          <div key={l} className={`rounded-2xl p-3 sm:p-4 ${LEVEL_STYLE[l].bg}`}>
            <p className={`flex items-center gap-2 font-semibold ${LEVEL_STYLE[l].text}`}>
              <span aria-hidden className={`grid h-6 w-6 place-items-center rounded-full text-xs text-white ${LEVEL_STYLE[l].dot}`}>{LEVEL_STYLE[l].symbol}</span>
              {LEVEL_TEXT[l].short}
            </p>
            <p className="mt-1 text-sm text-ink/80">{LEVEL_HELP[l]}</p>
          </div>
        ))}
      </section>

      <section className="card mt-4 flex flex-wrap gap-x-6 gap-y-2 p-4 text-sm">
        <span><strong>{defined.length}</strong> מתוך {totalCells} צירופים מוגדרים</span>
        <span><strong>{totalCells - defined.length}</strong> טרם הוגדרו</span>
        <span><strong>{unverified}</strong> מבוססים על פרשנות וטעונים אימות</span>
        <span>גרסת כללים: <strong>{db.settings.rulesVersion}</strong></span>
        <span>סדר עדיפות כשיש כמה כללים: {SEVERITY_ORDER_TEXT}</span>
      </section>

      {/* Simple allowed / not allowed table */}
      <section className="mt-6" aria-labelledby="simple-title">
        <h2 id="simple-title" className="mb-1 text-xl font-semibold">טבלה פשוטה: מה מותר ומה אסור</h2>
        <p className="mb-3 text-sm text-muted">לכל משפחת מזון: עם אילו משפחות מותר לשלב אותה ועם אילו לא. "סוג נוסף" פירושו שני מזונות שונים מאותה משפחה.</p>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="hidden bg-cream sm:table-header-group">
              <tr>
                <th scope="col" className="p-3 text-start font-semibold">משפחה</th>
                <th scope="col" className="p-3 text-start font-semibold text-ok">✓ מותר עם</th>
                <th scope="col" className="p-3 text-start font-semibold text-bad">✗ אסור עם</th>
              </tr>
            </thead>
            <tbody>
              {fams.map((a) => {
                const by = (lvl: Level) => fams.filter((b) => (index.get(pairKey(a.id, b.id))?.level ?? 'unknown') === lvl);
                const label = (b: FoodFamily) => (b.id === a.id ? `${b.name} (סוג נוסף)` : b.name);
                const chips = (list: FoodFamily[], cls: string) =>
                  list.length === 0 ? <span className="text-muted">אין</span> : (
                    <span className="flex flex-wrap gap-1.5">
                      {list.map((b) => (
                        <button key={b.id} onClick={() => setCell({ a, b })}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
                          <span aria-hidden className="me-1">{b.icon}</span>{label(b)}
                        </button>
                      ))}
                    </span>
                  );
                const unknown = by('unknown');
                return (
                  <tr key={a.id} className="block border-t border-line p-3 first:border-t-0 sm:table-row sm:p-0">
                    <th scope="row" className="block pb-2 text-start text-base font-semibold sm:table-cell sm:w-44 sm:p-3 sm:align-top">
                      <span aria-hidden className="me-1">{a.icon}</span>{a.name}
                    </th>
                    <td className="block pb-2 sm:table-cell sm:p-3 sm:align-top">
                      <span className="mb-1 block text-xs font-semibold text-ok sm:hidden">✓ מותר עם</span>
                      {chips(by('green'), 'bg-ok-soft text-ok')}
                    </td>
                    <td className="block sm:table-cell sm:p-3 sm:align-top">
                      <span className="mb-1 block text-xs font-semibold text-bad sm:hidden">✗ אסור עם</span>
                      {chips(by('red'), 'bg-bad-soft text-bad')}
                      {unknown.length > 0 && (
                        <span className="mt-2 block text-xs text-muted">טרם הוגדר: {unknown.map(label).join(', ')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Matrix */}
      <section className="mt-6" aria-labelledby="matrix-title">
        <h2 id="matrix-title" className="mb-1 text-xl font-semibold">מטריצת הצירופים המלאה</h2>
        <p className="mb-3 text-sm text-muted">לחצו על משבצת כדי לראות את ההסבר או לערוך את הכלל. סימון * = פרשנות שטעונה אימות.</p>
        <div className="card overflow-x-auto p-2">
          <table className="mx-auto border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="sticky start-0 z-10 bg-surface" />
                {fams.map((f) => (
                  <th key={f.id} scope="col" className="w-14 align-bottom font-medium">
                    <div className="mx-auto flex w-14 flex-col items-center gap-0.5 pb-1">
                      <span aria-hidden className="text-lg">{f.icon}</span>
                      <span className="text-[10px] leading-tight">{f.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fams.map((a) => (
                <tr key={a.id}>
                  <th scope="row" className="sticky start-0 z-10 whitespace-nowrap bg-surface pe-2 text-start font-medium">
                    <span aria-hidden className="me-1">{a.icon}</span>{a.name}
                  </th>
                  {fams.map((b) => {
                    const r = index.get(pairKey(a.id, b.id));
                    const level: Level = r?.level ?? 'unknown';
                    const s = LEVEL_STYLE[level];
                    return (
                      <td key={b.id} className="p-0">
                        <button
                          onClick={() => setCell({ a, b })}
                          title={`${a.name} + ${b.name}: ${r ? r.title : 'טרם הוגדר'}`}
                          aria-label={`${a.name} + ${b.name}: ${LEVEL_TEXT[level].short}`}
                          className={`relative grid h-11 w-14 place-items-center rounded-lg font-bold transition hover:scale-105 ${s.bg} ${s.text} ${
                            r?.verificationStatus === 'demo' ? 'border-2 border-dashed border-warn' : ''
                          }`}
                        >
                          {s.symbol}
                          {r?.verificationStatus === 'unverified' && <span className="absolute end-1 top-0 text-xs">*</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Families */}
      <section className="mt-8" aria-labelledby="fam-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="fam-title" className="text-xl font-semibold">משפחות המזון</h2>
          <button className="btn-soft text-sm" onClick={() => setFamEdit('new')}>+ משפחה חדשה</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fams.map((f) => (
            <article key={f.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="flex items-center gap-2 font-semibold"><span aria-hidden className="text-2xl">{f.icon}</span>{f.name}</h3>
                <button className="text-sm text-leaf-dark underline-offset-2 hover:underline" onClick={() => setFamEdit(f)}>עריכה</button>
              </div>
              <p className="mt-2 text-sm text-ink/80">{f.description}</p>
              <p className="mt-2 text-xs text-muted">{foodsPerFamily(f.id)} מזונות במאגר</p>
            </article>
          ))}
        </div>
      </section>

      {/* Management */}
      <section className="card mt-8 p-4 sm:p-5" aria-labelledby="manage-title">
        <h2 id="manage-title" className="text-lg font-semibold">ניהול המטריצה</h2>
        <p className="mt-1 text-sm text-muted">
          הכללים נשמרים כנתונים ולא כקוד. ניתן לערוך כל משבצת, לייצא את המטריצה לקובץ JSON, או לייבא מטריצה מעודכנת.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn-soft" onClick={() => setExporting(true)}>ייצוא כללים</button>
          <select aria-label="אופן הייבוא" className="input w-auto py-2" value={importMode} onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}>
            <option value="merge">ייבוא: מיזוג עם הקיים</option>
            <option value="replace">ייבוא: החלפת כל הכללים</option>
          </select>
          <button className="btn-soft" onClick={() => fileRef.current?.click()}>ייבוא מקובץ</button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImport(f); e.target.value = ''; }} />
          <button className="btn-ghost border border-line" onClick={() => setConfirmRestore(true)}>שחזור כללי שיטת הבריאות הטבעית המקוריים</button>
        </div>
      </section>


      <ExportDialog open={exporting} onClose={() => setExporting(false)} title="ייצוא כללים"
        filename={`combomatch-rules-v${db.settings.rulesVersion}.json`} text={exporting ? store.exportRules() : ''} />
      <RuleEditor cell={cell} onClose={() => setCell(null)} rule={cell ? index.get(pairKey(cell.a.id, cell.b.id)) : undefined} />
      <FamilyEditor family={famEdit} onClose={() => setFamEdit(null)} />
      <ConfirmDialog open={confirmRestore} onClose={() => setConfirmRestore(false)} title="שחזור כללי שיטת הבריאות הטבעית"
        text="כל השינויים שביצעתם במטריצה יוחלפו בכללים המקוריים שנגזרו ממסמך שיטת הבריאות הטבעית. להמשיך?"
        confirmLabel="שחזור" danger onConfirm={() => { store.restoreMethodRules(); toast('כללי שיטת הבריאות הטבעית שוחזרו'); }} />
    </div>
  );
}

function RuleEditor({ cell, rule, onClose }: { cell: { a: FoodFamily; b: FoodFamily } | null; rule?: CombinationRule; onClose: () => void }) {
  const { toast } = useUi();
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState({ level: 'unknown' as Level, title: '', explanation: '', suggestion: '', source: '', verificationStatus: 'verified' as VerificationStatus });
  const isDemo = rule?.verificationStatus === 'demo';

  const startEdit = () => {
    setD({
      level: rule?.level ?? 'green',
      title: isDemo ? '' : rule?.title ?? '',
      explanation: isDemo ? '' : rule?.explanation ?? '',
      suggestion: isDemo ? '' : rule?.suggestion ?? '',
      source: isDemo ? '' : rule?.source ?? '',
      verificationStatus: rule && !isDemo ? rule.verificationStatus : 'verified',
    });
    setEditing(true);
  };
  const close = () => { setEditing(false); onClose(); };
  if (!cell) return null;

  const save = () => {
    store.upsertRule({ ...d, id: isDemo ? undefined : rule?.id, familyA: cell.a.id, familyB: cell.b.id, title: d.title.trim() || `${cell.a.name} + ${cell.b.name}` });
    toast('הכלל נשמר. גרסת הכללים עודכנה');
    close();
  };
  const remove = () => {
    if (rule && !isDemo) { store.deleteRule(rule.id); toast('הכלל נמחק. הצירוף יוצג כ"טרם הוגדר"'); }
    close();
  };

  return (
    <Modal open onClose={close} title={`${cell.a.name} + ${cell.b.name}`} wide
      footer={editing ? (
        <><button className="btn-ghost" onClick={() => setEditing(false)}>ביטול</button><button className="btn-primary" onClick={save}>שמירת הכלל</button></>
      ) : (
        <>
          {rule && !isDemo && <button className="btn-danger" onClick={remove}>מחיקת הכלל</button>}
          <button className="btn-primary" onClick={startEdit}>{rule && !isDemo ? 'עריכת הכלל' : 'הגדרת כלל'}</button>
        </>
      )}>
      {!editing ? (
        rule ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${LEVEL_STYLE[rule.level].bg} ${LEVEL_STYLE[rule.level].text}`}>{LEVEL_TEXT[rule.level].short}</span>
              <VerificationTag status={rule.verificationStatus} />
            </div>
            <p className="font-medium">{rule.title}</p>
            <p className="text-ink/80">{rule.explanation}</p>
            {rule.suggestion && <p className="text-sm"><strong>הצעת שיפור:</strong> {rule.suggestion}</p>}
            <p className="text-xs text-muted">מקור: {rule.source} · עודכן: {new Date(rule.updatedAt).toLocaleDateString('he-IL')} · מזהה: {rule.id}</p>
            {isDemo && <p className="rounded-xl bg-warn-soft px-3 py-2 text-sm">זהו כלל הדגמה בלבד, ואינו חלק משיטת הבריאות הטבעית. ניתן להגדיר במקומו כלל אמיתי.</p>}
          </div>
        ) : (
          <p className="text-ink/80">טרם הוגדר כלל לצירוף זה. מסמך שיטת הבריאות הטבעית אינו מתייחס אליו במפורש, ולכן הבדיקה תציג "טרם הוגדר".</p>
        )
      ) : (
        <div className="grid gap-4">
          <fieldset>
            <legend className="label">רמת התאמה</legend>
            <div className="flex flex-wrap gap-2">
              {(['green', 'red', 'unknown'] as Level[]).map((l) => (
                <button key={l} type="button" aria-pressed={d.level === l} onClick={() => setD({ ...d, level: l })}
                  className={`chip ${d.level === l ? `${LEVEL_STYLE[l].bg} ${LEVEL_STYLE[l].text} border-current font-semibold` : ''}`}>
                  {LEVEL_STYLE[l].symbol} {LEVEL_TEXT[l].short}
                </button>
              ))}
            </div>
          </fieldset>
          <div><label className="label" htmlFor="r-title">כותרת קצרה</label><input id="r-title" className="input" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
          <div><label className="label" htmlFor="r-exp">הסבר מפורט</label><textarea id="r-exp" rows={3} className="input" value={d.explanation} onChange={(e) => setD({ ...d, explanation: e.target.value })} placeholder="על פי כללי שיטת הבריאות הטבעית..." /></div>
          <div><label className="label" htmlFor="r-sug">הצעת שיפור</label><input id="r-sug" className="input" value={d.suggestion} onChange={(e) => setD({ ...d, suggestion: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="r-src">מקור הכלל</label><input id="r-src" className="input" value={d.source} onChange={(e) => setD({ ...d, source: e.target.value })} /></div>
            <div><label className="label" htmlFor="r-ver">סטטוס אימות</label>
              <select id="r-ver" className="input" value={d.verificationStatus} onChange={(e) => setD({ ...d, verificationStatus: e.target.value as VerificationStatus })}>
                <option value="verified">מאומת</option><option value="unverified">טעון אימות</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function FamilyEditor({ family, onClose }: { family: FoodFamily | 'new' | null; onClose: () => void }) {
  const { toast } = useUi();
  const isNew = family === 'new';
  const f = family && family !== 'new' ? family : null;
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('🍽️');
  const [confirmDel, setConfirmDel] = useState(false);
  useEffect(() => {
    setName(f?.name ?? ''); setDesc(f?.description ?? ''); setIcon(f?.icon ?? '🍽️');
  }, [family, f]);
  if (!family) return null;
  const save = () => {
    if (!name.trim()) return toast('יש להזין שם למשפחה', 'error');
    if (isNew) { store.addFamily({ name: name.trim(), description: desc.trim(), icon }); toast('המשפחה נוספה. כל הצירופים שלה מוגדרים כ"טרם הוגדר"'); }
    else if (f) { store.updateFamily(f.id, { name: name.trim(), description: desc.trim(), icon }); toast('המשפחה עודכנה'); }
    onClose();
  };
  return (
    <>
      <Modal open onClose={onClose} title={isNew ? 'משפחת מזון חדשה' : `עריכת ${f?.name}`}
        footer={<>
          {f && !f.builtIn && <button className="btn-danger" onClick={() => setConfirmDel(true)}>מחיקה</button>}
          <button className="btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn-primary" onClick={save}>שמירה</button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
          <div><label className="label" htmlFor="fam-name">שם</label><input id="fam-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label" htmlFor="fam-icon">אייקון</label><input id="fam-icon" className="input text-center text-xl" value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
        </div>
        <label className="label mt-4" htmlFor="fam-desc">תיאור ודוגמאות</label>
        <textarea id="fam-desc" rows={3} className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Modal>
      <ConfirmDialog open={confirmDel} onClose={() => setConfirmDel(false)} title="מחיקת משפחה" danger confirmLabel="מחק"
        text="המשפחה תימחק, תוסר מכל המזונות, וכל הכללים שלה יימחקו. להמשיך?"
        onConfirm={() => { if (f) { store.deleteFamily(f.id); toast('המשפחה נמחקה'); } onClose(); }} />
    </>
  );
}
