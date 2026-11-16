import { useEffect, useState } from 'react';
import { ContactDialog } from './components/ContactDialog';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { DISCLAIMER, Toaster } from './components/ui';
import Home from './pages/Home';
import Result from './pages/Result';
import Meals from './pages/Meals';
import Rules from './pages/Rules';
import History from './pages/History';
import Foods from './pages/Foods';
import Settings from './pages/Settings';
import { useDb } from './state/AppContext';
import logo from './assets/logo.png';
import centerLogo from './assets/center-logo.png';

const SITE_URL = 'https://el-habriut.co.il';

const NAV = [
  { to: '/', label: 'בדיקה', icon: '🥗', end: true },
  { to: '/meals', label: 'ארוחות', icon: '⭐' },
  { to: '/history', label: 'היסטוריה', icon: '🕒' },
  { to: '/rules', label: 'כללים', icon: '📖' },
  { to: '/foods', label: 'מזונות', icon: '🥕' },
];

function ScrollTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname, search]);
  return null;
}

export default function App() {
  const { savedMeals } = useDb();
  const [contactOpen, setContactOpen] = useState(false);
  return (
    <div className="min-h-screen pb-24 sm:pb-8">
      <ScrollTop />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-2">דלג לתוכן</a>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-leaf-dark">
            <img src={logo} alt="" width={40} height={40} className="h-10 w-10" />
            <span className="text-lg">ComboMatch</span>
          </Link>
          <nav aria-label="ניווט ראשי" className="hidden gap-1 sm:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `rounded-full px-3 py-2 text-sm font-medium ${isActive ? 'bg-leaf-soft text-leaf-dark' : 'text-muted hover:bg-cream'}`}>
                {n.label}{n.to === '/meals' && savedMeals.length > 0 && <span className="ms-1 text-xs">({savedMeals.length})</span>}
              </NavLink>
            ))}
          </nav>
          <NavLink to="/settings" aria-label="הגדרות"
            className={({ isActive }) => `grid h-10 w-10 place-items-center rounded-full text-xl ${isActive ? 'bg-leaf-soft' : 'hover:bg-cream'}`}>
            ⚙️
          </NavLink>
        </div>
      </header>

      <main id="main" className="px-4 pt-6 sm:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/history" element={<History />} />
          <Route path="/foods" element={<Foods />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<div className="py-20 text-center"><p className="text-lg">הדף לא נמצא</p><Link to="/" className="btn-primary mt-4">למסך הבית</Link></div>} />
        </Routes>
      </main>

      <footer className="mx-auto mt-10 max-w-3xl px-4 text-center">
        <p className="text-xs text-muted">{DISCLAIMER}</p>
        <div className="mt-4 border-t border-line pt-4 text-sm text-ink/80">
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="mx-auto mb-2 block w-fit" aria-label="המרכז לבריאות טבעית">
            <img src={centerLogo} alt="לוגו המרכז לבריאות טבעית" width={64} height={60} className="h-16 w-auto" />
          </a>
          <p>
            נוצר ע״י יאיר גלעדי - © - ״המרכז לבריאות טבעית״
          </p>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <a href={SITE_URL} target="_blank" rel="noopener noreferrer" dir="ltr" className="font-medium text-leaf-dark underline-offset-2 hover:underline">
              el-habriut.co.il
            </a>
            <span aria-hidden>-</span>
            <button type="button" onClick={() => setContactOpen(true)} dir="ltr" aria-haspopup="dialog"
              className="font-medium text-leaf-dark underline-offset-2 hover:underline">
              0542135831
            </button>
          </p>
        </div>
      </footer>

      <nav aria-label="ניווט תחתון" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-leaf-dark' : 'text-muted'}`}>
              {({ isActive }) => (
                <>
                  <span aria-hidden className={`grid h-8 w-12 place-items-center rounded-full text-lg ${isActive ? 'bg-leaf-soft' : ''}`}>{n.icon}</span>
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
      <Toaster />
    </div>
  );
}
