import { useEffect, useState } from 'react';
import { canPromptInstall, isIos, onInstallChange, promptInstall } from '../install';
import { isStandalone } from '../analytics';
import { Modal } from './ui';

/** "Install as an app" button. Hidden inside the installed app and where installing is not possible. */
export function InstallButton({ className = '' }: { className?: string }) {
  const [, force] = useState(0);
  const [help, setHelp] = useState(false);
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);

  if (isStandalone()) return null;
  const ios = isIos();
  if (!canPromptInstall() && !ios) return null;

  return (
    <>
      <button type="button" className={`btn-soft ${className}`}
        onClick={() => (ios ? setHelp(true) : void promptInstall())}>
        📲 התקנה כאפליקציה
      </button>
      <Modal open={help} onClose={() => setHelp(false)} title="התקנה באייפון">
        <ol className="list-decimal space-y-2 ps-5 text-ink/90">
          <li>פתחו את האתר בדפדפן Safari.</li>
          <li>לחצו על כפתור השיתוף (ריבוע עם חץ למעלה) בתחתית המסך.</li>
          <li>גללו ובחרו "הוספה למסך הבית", ואז "הוספה".</li>
        </ol>
        <p className="mt-3 text-sm text-muted">האפליקציה תופיע כאייקון במסך הבית ותיפתח במסך מלא, בלי שורת כתובת.</p>
      </Modal>
    </>
  );
}
