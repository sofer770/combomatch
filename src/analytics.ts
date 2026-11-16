// Anonymous usage counting through GoatCounter (no cookies, no personal data).
// Counts one visit per app open and one install per device (first launch from the home screen).
// The owner's device is never counted: it holds the admin key, which also unlocks the stats screen.

/** The GoatCounter site code (the "xxx" in xxx.goatcounter.com). Empty = counting is off. */
export const GOATCOUNTER_CODE = '';

/** Only the published app is counted (not previews, local files or development). */
const COUNTED_HOSTS = ['combo.el-habriut.co.il', 'sofer770.github.io'];

const KEY_ADMIN = 'combomatch.admin.apiKey';
const KEY_INSTALL = 'combomatch.installCounted';

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage blocked */ }
};

export const getAdminKey = () => safeGet(KEY_ADMIN);
export const isAdmin = () => !!getAdminKey();
export const setAdminKey = (key: string | null) => {
  safeSet(KEY_ADMIN, key);
  window.dispatchEvent(new Event('combomatch-admin'));
};

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const countingOn = () => !!GOATCOUNTER_CODE && COUNTED_HOSTS.includes(location.hostname) && !isAdmin();

function send(path: string, title: string, event: boolean) {
  const q = new URLSearchParams({
    p: path, t: title, e: String(event), s: `${screen.width},${screen.height},${window.devicePixelRatio || 1}`,
    rnd: Math.random().toString(36).slice(2),
  });
  const img = new Image();
  img.src = `https://${GOATCOUNTER_CODE}.goatcounter.com/count?${q}`;
}

export const VISIT_PATH = 'visit';
export const INSTALL_PATH = 'install';

/** Called once when the app opens. */
export function trackOpen() {
  if (!countingOn()) return;
  send(VISIT_PATH, 'כניסה לאפליקציה', true);
  if (isStandalone() && !safeGet(KEY_INSTALL)) {
    safeSet(KEY_INSTALL, '1');
    send(INSTALL_PATH, 'התקנה במסך הבית', true);
  }
}

export interface DailyStats { day: string; visits: number; installs: number }

interface HitsResponse { hits?: { path: string; count: number; stats?: { day: string; daily: number }[] }[] }

/** Reads the last `days` days of counts with the owner's read-only API key. */
export async function fetchStats(days = 30): Promise<{ daily: DailyStats[]; totalVisits: number; totalInstalls: number }> {
  const key = getAdminKey();
  if (!key || !GOATCOUNTER_CODE) throw new Error('חסר קוד מונה או מפתח מנהל');
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const url = `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/hits?start=${ymd(start)}&end=${ymd(end)}&limit=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } });
  if (res.status === 401 || res.status === 403) throw new Error('המפתח אינו תקין או שאין לו הרשאת צפייה בסטטיסטיקה');
  if (!res.ok) throw new Error(`שגיאה בקבלת הנתונים (${res.status})`);
  const data = (await res.json()) as HitsResponse;
  const byDay = new Map<string, DailyStats>();
  for (let i = 0; i < days; i++) {
    const d = ymd(new Date(start.getTime() + i * 86400000));
    byDay.set(d, { day: d, visits: 0, installs: 0 });
  }
  let totalVisits = 0, totalInstalls = 0;
  for (const h of data.hits ?? []) {
    const kind = h.path.replace(/^\//, '') === VISIT_PATH ? 'visits' : h.path.replace(/^\//, '') === INSTALL_PATH ? 'installs' : null;
    if (!kind) continue;
    for (const s of h.stats ?? []) {
      const row = byDay.get(s.day);
      if (row) row[kind] += s.daily;
      if (kind === 'visits') totalVisits += s.daily; else totalInstalls += s.daily;
    }
  }
  return { daily: [...byDay.values()].reverse(), totalVisits, totalInstalls };
}
