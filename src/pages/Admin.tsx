import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '../components/ui';
import { ADMIN_LOCK, fetchStats, fetchAllTimeTotals, getAdminKey, GOATCOUNTER_CODE, isAdmin, lockToken, setAdminKey, unlockToken, type DailyStats } from '../analytics';

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });

export default function Admin() {
  const [admin, setAdmin] = useState(isAdmin());
  const [key, setKey] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [lockCode, setLockCode] = useState('');

  const login = async () => {
    const v = key.trim();
    if (!v) return;
    setLoginError('');
    // a short entry is the owner's password, a long one is the API token itself
    if (v.length < 30) {
      if (!ADMIN_LOCK) { setLoginError('עדיין לא הוגדרה סיסמה קצרה. הדביקו את המפתח המלא.'); return; }
      setBusy(true);
      const token = await unlockToken(v);
      setBusy(false);
      if (!token) { setLoginError('הסיסמה שגויה'); return; }
      setAdminKey(token);
    } else {
      setAdminKey(v);
    }
    setAdmin(true);
  };
  const [state, setState] = useState<{ loading: boolean; error?: string; daily?: DailyStats[]; totalVisits?: number; totalInstalls?: number; allVisits?: number; allInstalls?: number; at?: Date }>({ loading: false });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const [r, all] = await Promise.all([fetchStats(30), fetchAllTimeTotals()]);
      setState({ loading: false, ...r, allVisits: all.visits, allInstalls: all.installs, at: new Date() });
    } catch (e) {
      setState({ loading: false, error: e instanceof Error ? e.message : 'שגיאה' });
    }
  }, []);

  useEffect(() => { if (admin) void load(); }, [admin, load]);

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg">
        <PageTitle title="כניסת מנהל" subtitle="אזור זה מיועד לבעל האפליקציה בלבד." />
        <form className="card p-4 sm:p-5" onSubmit={(e) => { e.preventDefault(); void login(); }}>
          <label className="label" htmlFor="admin-key">סיסמת מנהל</label>
          <input id="admin-key" className="input" dir="ltr" type="password" autoComplete="current-password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="סיסמה קצרה, או המפתח המלא" />
          {loginError && <p role="alert" className="mt-2 text-sm text-bad">{loginError}</p>}
          <p className="mt-2 text-xs text-muted">צריך להיכנס פעם אחת בכל מכשיר. מהרגע הזה הכניסה נשמרת, והכניסות מהמכשיר הזה לא נספרות.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'בודק…' : 'כניסה'}</button>
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

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => void load()} disabled={state.loading}>{state.loading ? 'מרענן…' : '🔄 רענון'}</button>
        {state.at && <span className="text-xs text-muted">עודכן בשעה {state.at.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>

      <section className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="סיכום">
        {[
          { label: 'כניסות היום', value: today?.visits },
          { label: 'כניסות ב-30 יום', value: state.totalVisits },
          { label: 'כניסות כללי', value: state.allVisits },
          { label: 'התקנות היום', value: today?.installs },
          { label: 'התקנות ב-30 יום', value: state.totalInstalls },
          { label: 'התקנות כללי', value: state.allInstalls },
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
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/" className="btn-soft">לאפליקציה</Link>
        <button className="btn-ghost ms-auto text-sm text-muted" onClick={() => { setAdminKey(null); setAdmin(false); }}>יציאה ממצב מנהל</button>
      </div>

      <details className="card mt-6 p-4 text-sm">
        <summary className="cursor-pointer font-semibold">{ADMIN_LOCK ? 'החלפת הסיסמה הקצרה' : 'הגדרת סיסמה קצרה'}</summary>
        <p className="mt-2 text-muted">בחרו סיסמה קצרה ולחצו "יצירת קוד". שלחו את הקוד שיופיע, והוא ייכנס לאפליקציה. מאז, בכל מכשיר חדש מספיק להקליד את הסיסמה.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="input w-48" dir="ltr" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="סיסמה קצרה" aria-label="סיסמה קצרה חדשה" />
          <button className="btn-soft" disabled={newPass.trim().length < 4}
            onClick={async () => { const t = getAdminKey(); if (t) setLockCode(await lockToken(t, newPass.trim())); }}>יצירת קוד</button>
        </div>
        {newPass && newPass.trim().length < 4 && <p className="mt-1 text-xs text-muted">לפחות 4 תווים</p>}
        {lockCode && (
          <div className="mt-3">
            <textarea readOnly dir="ltr" rows={3} className="input font-mono text-xs" value={lockCode} onFocus={(e) => e.currentTarget.select()} aria-label="הקוד לשליחה" />
            <button className="btn-soft mt-2" onClick={() => void navigator.clipboard?.writeText(lockCode)}>העתקת הקוד</button>
            <p className="mt-1 text-xs text-muted">הקוד מוצפן. אי אפשר לקרוא ממנו את הסיסמה.</p>
          </div>
        )}
      </details>
    </div>
  );
}
