import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog, DISCLAIMER, PageTitle } from '../components/ui';
import { store, useDb, useUi } from '../state/AppContext';
import { ExportDialog } from '../components/ExportDialog';
import { METHOD_MATRIX_VERSION, METHOD_SOURCE_DOC } from '../data/methodRules';

function Toggle({ id, label, help, checked, onChange }: { id: string; label: string; help: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <label htmlFor={id} className="font-medium">{label}</label>
        <p className="text-sm text-muted">{help}</p>
      </div>
      <button id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-leaf' : 'bg-line'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'start-6' : 'start-1'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const db = useDb();
  const { toast } = useUi();
  const [confirmReset, setConfirmReset] = useState(false);
  const [exporting, setExporting] = useState(false);
  const s = db.settings;

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="הגדרות" />
      <section className="card divide-y divide-line px-4 sm:px-5">
        <Toggle id="hist" label="שמירת היסטוריית בדיקות" checked={s.saveHistory}
          help="כל בדיקה נשמרת במכשיר זה בלבד." onChange={(v) => store.updateSettings({ saveHistory: v })} />
        <div className="py-4">
          <label htmlFor="max" className="font-medium">מספר מזונות מרבי בבדיקה</label>
          <select id="max" className="input mt-2 w-auto" value={s.maxFoods} onChange={(e) => store.updateSettings({ maxFoods: Number(e.target.value) })}>
            <option value={2}>2</option><option value={3}>3</option>
          </select>
        </div>
      </section>

      <section className="card mt-4 p-4 sm:p-5">
        <h2 className="font-semibold">נתונים</h2>
        <p className="mt-1 text-sm text-muted">
          כל הנתונים נשמרים במכשיר הזה בלבד (ללא הרשמה וללא שרת). מומלץ לייצא גיבוי מדי פעם.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-soft" onClick={() => setExporting(true)}>ייצוא גיבוי מלא</button>
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>איפוס כל הנתונים</button>
        </div>
        {store.getPersistError() && <p role="alert" className="mt-3 text-sm text-bad">{store.getPersistError()}</p>}
      </section>

      <section className="card mt-4 p-4 text-sm sm:p-5">
        <h2 className="font-semibold">אודות</h2>
        <p className="mt-1 text-ink/80">ComboMatch גרסה 1.0. מקור הכללים: {METHOD_SOURCE_DOC} (טיוטת מטריצה {METHOD_MATRIX_VERSION}). גרסת הכללים הנוכחית במכשיר: {s.rulesVersion}.</p>
        <p className="mt-2 text-muted">{DISCLAIMER}</p>
        <p className="mt-2 text-muted">האפליקציה סופרת כניסות והתקנות באופן אנונימי, בלי עוגיות ובלי מידע אישי.</p>
        <Link to="/admin" className="mt-3 inline-block text-xs text-muted underline-offset-2 hover:underline">כניסת מנהל</Link>
      </section>

      <ExportDialog open={exporting} onClose={() => setExporting(false)} title="גיבוי מלא"
        filename={`combomatch-backup-${new Date().toISOString().slice(0, 10)}.json`} text={exporting ? store.exportAll() : ''} />
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} danger title="איפוס כל הנתונים" confirmLabel="איפוס"
        text="כל הארוחות השמורות, ההיסטוריה, המזונות שהוספתם והשינויים בכללים יימחקו, והאפליקציה תחזור למצב ההתחלתי."
        onConfirm={() => { store.resetAll(); toast('הנתונים אופסו'); }} />
    </div>
  );
}
