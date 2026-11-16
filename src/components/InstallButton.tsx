import { useEffect, useState } from 'react';
import { canPromptInstall, isIos, onInstallChange, promptInstall } from '../install';
import { isStandalone } from '../analytics';
import { Modal } from './ui';

/**
 * "Install as an app" button, shown to everyone except inside the installed app.
 * Where the browser offers its install prompt (Chrome on Android/desktop) it installs directly;
 * otherwise (iPhone, incognito, other browsers) it shows short manual steps.
 */
export function InstallButton({ className = '' }: { className?: string }) {
  const [, force] = useState(0);
  const [help, setHelp] = useState(false);
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);

  if (isStandalone()) return null;
  const ios = isIos();

  return (
    <>
      <button type="button" className={`btn-soft ${className}`}
        onClick={() => (canPromptInstall() ? void promptInstall() : setHelp(true))}>
        📲 התקנה כאפליקציה
      </button>
      <Modal open={help} onClose={() => setHelp(false)} title="התקנה כאפליקציה">
        {ios ? (
          <ol className="list-decimal space-y-2 ps-5 text-ink/90">
            <li>פתחו את האתר בדפדפן Safari.</li>
            <li>לחצו על כפתור השיתוף (ריבוע עם חץ למעלה).</li>
            <li>בחרו "הוספה למסך הבית", ואז "הוספה".</li>
          </ol>
        ) : (
          <ol className="list-decimal space-y-2 ps-5 text-ink/90">
            <li>פתחו את האתר בדפדפן Chrome, בחלון רגיל (לא בגלישה בסתר ולא מתוך וואטסאפ).</li>
            <li>לחצו על שלוש הנקודות ⋮ בפינת המסך.</li>
            <li>בחרו "התקנת אפליקציה" (או "הוספה למסך הבית"), ואז "התקנה".</li>
            <li>אם האפשרות לא מופיעה או שהאייקון לא נוצר, רעננו את הדף, חכו כמה שניות ונסו שוב. לפעמים צריך שני ניסיונות או יותר. בטלפוני שיאומי כדאי לוודא גם שלדפדפן Chrome מותר ליצור "קיצורי דרך במסך הבית" (הגדרות ← אפליקציות ← Chrome ← הרשאות אחרות).</li>
          </ol>
        )}
        <p className="mt-3 text-sm text-muted">האפליקציה תופיע כאייקון במסך הבית ותיפתח במסך מלא, בלי שורת כתובת.</p>
      </Modal>
    </>
  );
}
