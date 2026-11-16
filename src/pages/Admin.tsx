import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '../components/ui';
import { fetchStats, GOATCOUNTER_CODE, isAdmin, setAdminKey, type DailyStats } from '../analytics';

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });

export default function Admin() {
  const [admin, setAdmin] = useState(isAdmin());
  const [key, setKey] = useState('');
  const [state, setState] = useState<{ loading: boolean; error?: string; daily?: DailyStats[]; totalVisits?: number; totalInstalls?: number; at?: Date }>({ loading: false });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const r = await fetchStats(30);
      setState({ loading: false, ...r, at: new Date() });
    } catch (e) {
      setState({ loading: false, error: e instanceof Error ? e.message : 'שגיאה' });
    }
  }, []);

  useEffect(() => { if (admin) void load(); }, [admin, load]);

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg">
        <PageTitle title="כניסת מנהל" subtitle="אזור זה מיועד לבעל האפליקציה בלבד." />
        <form className="card p-4 sm:p-5" onSubmit={(e) => { e.preventDefault(); if (key.trim()) { setAdminKey(key.trim()); setAdmin(true); } }}>
          <label className="label" htmlFor="admin-key">מפתח מנהל</label>
          <input id="admin-key" className="input" dir="ltr" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="מפתח API לקריאת סטטיסטיקה" />
          <p className="mt-2 text-xs text-muted">המפתח נשמר רק במכשיר הזה. מהרגע שהוא שמור, הכניסות מהמכשיר הזה לא נספרות.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" type="submit">כניסה</button>
            <Link to="/" className="btn-ghost border border-line">לאפליקציה</Link>
          </div>
        </form>
      </div>
    );
  }

  const today = state.daily?.[0];
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="נתוני שימוש" subtitle="רק עבורך. הכניסות שלך מהמכשיר הזה אינן נספרות." />
      {!GOATCOUNTER_CODE && <p className="card mb-4 p-4 text-sm text-bad">המונה עדיין לא הוגדר באפליקציה.</p>}
      {state.error && <p role="alert" className="card mb-4 p-4 text-sm text-bad">{state.error}</p>}

      <section className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="סיכום">
        {[
          { label: 'כניסות היום', value: today?.visits },
          { label: 'כניסות ב-30 יום', value: state.totalVisits },
          { label: 'התקנות בטלפון', value: state.totalInstalls },
        ].map((c) => (
          <div key={c.label} className="card p-3 text-center sm:p-4">
            <p className="text-3xl font-bold text-leaf-dark">{state.loading && c.value === undefined ? '…' : c.value ?? '-'}</p>
            <p className="mt-1 text-xs text-muted sm:text-sm">{c.label}</p>
          </div>
        ))}
      </section>

      <section className="card mt-4 overflow-hidden" aria-labelledby="daily-title">
        <h2 id="daily-title" className="border-b border-line p-3 font-semibold">כניסות לפי יום</h2>
        <table className="w-full text-sm">
          <thead className="bg-cream text-muted">
            <tr><th scope="col" className="p-2 text-start font-medium">יום</th><th scope="col" className="p-2 text-center font-medium">כניסות</th><th scope="col" className="p-2 text-center font-medium">התקנות</th></tr>
          </thead>
          <tbody>
            {(state.daily ?? []).map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="p-2">{fmtDay(d.day)}</td>
                <td className="p-2 text-center font-semibold">{d.visits}</td>
                <td className="p-2 text-center">{d.installs}</td>
              </tr>
            ))}
            {!state.daily && !state.loading && <tr><td colSpan={3} className="p-4 text-center text-muted">אין נתונים להצגה</td></tr>}
          </tbody>
        </table>
      </section>
      {state.at && <p className="mt-2 text-xs text-muted">עודכן בשעה {state.at.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => void load()} disabled={state.loading}>{state.loading ? 'מרענן…' : 'רענון'}</button>
        <Link to="/" className="btn-soft">לאפליקציה</Link>
        <button className="btn-ghost ms-auto text-sm text-muted" onClick={() => { setAdminKey(null); setAdmin(false); }}>יציאה ממצב מנהל</button>
      </div>
    </div>
  );
}
