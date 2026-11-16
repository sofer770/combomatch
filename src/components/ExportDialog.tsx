import { useRef } from 'react';
import { Modal } from './ui';
import { useUi } from '../state/AppContext';

/** Shows exported JSON with copy and download options (downloads can be blocked in embedded views). */
export function ExportDialog({ open, onClose, title, filename, text }: {
  open: boolean; onClose: () => void; title: string; filename: string; text: string;
}) {
  const { toast } = useUi();
  const ref = useRef<HTMLTextAreaElement>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('הועתק ללוח');
    } catch {
      ref.current?.select();
      toast('סמנו את הטקסט והעתיקו ידנית', 'info');
    }
  };
  const download = () => {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast('ההורדה אינה זמינה כאן. השתמשו בהעתקה', 'error');
    }
  };
  return (
    <Modal open={open} onClose={onClose} title={title} wide
      footer={<><button className="btn-soft" onClick={download}>הורדת קובץ</button><button className="btn-primary" onClick={copy}>העתקה</button></>}>
      <p className="mb-2 text-sm text-muted">שמרו את התוכן כקובץ {filename}. ניתן לייבא אותו בחזרה במסך הכללים.</p>
      <textarea ref={ref} readOnly dir="ltr" rows={12} className="input font-mono text-xs" value={text} aria-label="תוכן הייצוא" />
    </Modal>
  );
}
