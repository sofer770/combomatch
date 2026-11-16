// Anonymous usage counting through GoatCounter (no cookies, no personal data).
// Counts one visit per app open and one install per device (first launch from the home screen).
// The owner's device is never counted: it holds the admin key, which also unlocks the stats screen.

/** The GoatCounter site code (the "xxx" in xxx.goatcounter.com). Empty = counting is off. */
export const GOATCOUNTER_CODE = 'yair770';

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

interface HitsResponse { hits?: { path: string; count?: number; stats?: { day: string; daily?: number; hourly?: number[] }[] }[] }

/** Reads the last `days` days of counts with the owner's read-only API key. */
export async function fetchStats(days = 30): Promise<{ daily: DailyStats[]; totalVisits: number; totalInstalls: number }> {
  const key = getAdminKey();
  if (!key || !GOATCOUNTER_CODE) throw new Error('חסר קוד מונה או מפתח מנהל');
  // GoatCounter reads a bare date as midnight, so "end=today" would leave out all of today.
  // Ask from local midnight `days` days ago, and leave out `end` so it defaults to the current time.
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const url = `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/hits?start=${encodeURIComponent(iso(start))}&limit=100&daily=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } });
  if (res.status === 401 || res.status === 403) throw new Error('המפתח אינו תקין או שאין לו הרשאת צפייה בסטטיסטיקה');
  if (!res.ok) throw new Error(`שגיאה בקבלת הנתונים (${res.status})`);
  const data = (await res.json()) as HitsResponse;
  const byDay = new Map<string, DailyStats>();
  for (let i = 0; i < days; i++) {
    const d = ymd(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    byDay.set(d, { day: d, visits: 0, installs: 0 });
  }
  let totalVisits = 0, totalInstalls = 0;
  for (const h of data.hits ?? []) {
    const kind = h.path.replace(/^\//, '') === VISIT_PATH ? 'visits' : h.path.replace(/^\//, '') === INSTALL_PATH ? 'installs' : null;
    if (!kind) continue;
    let sum = 0;
    for (const s of h.stats ?? []) {
      // `daily` is filled when grouping by day; fall back to adding up the hourly counts
      const n = s.daily || (s.hourly ?? []).reduce((a, b) => a + b, 0);
      if (n && !byDay.has(s.day)) byDay.set(s.day, { day: s.day, visits: 0, installs: 0 });
      const row = byDay.get(s.day);
      if (row) row[kind] += n;
      sum += n;
    }
    const total = Math.max(sum, h.count ?? 0);
    if (kind === 'visits') totalVisits += total; else totalInstalls += total;
  }
  return { daily: [...byDay.values()].sort((a, b) => b.day.localeCompare(a.day)), totalVisits, totalInstalls };
}

// ---- Short admin password ----
// The long API token is stored encrypted with the owner's short password (PBKDF2 + AES-GCM).
// Typing the password on any device decrypts the token and saves it on that device.
// The token only allows reading visit counts.

/** Encrypted token, created on the admin screen ("סיסמה קצרה") and pasted here. Empty = not set. */
export const ADMIN_LOCK = 'RJuefCZAhTjDK30twtlLwQ==.7XrTxbr3FkPKAb1u.N74C2NkQjcsSRnBPfqbhxxv3zJjnjuOyLjFUPGb8j8yRBt7LrO+5UTqPV/SFfuSOO44qmi6NbLZmKQQ9wao5VOlP';

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 300000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function lockToken(token: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token)));
  return `${b64(salt)}.${b64(iv)}.${b64(c)}`;
}

/** Returns the token if the password is right, otherwise null. */
export async function unlockToken(password: string, lock = ADMIN_LOCK): Promise<string | null> {
  if (!lock) return null;
  try {
    const [s, i, c] = lock.split('.').map(unb64);
    const key = await deriveKey(password, s);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: i }, key, c));
  } catch {
    return null;
  }
}
