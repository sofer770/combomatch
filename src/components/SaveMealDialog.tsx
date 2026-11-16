import { useEffect, useState } from 'react';
import { Modal } from './ui';

const PRESETS = ['ארוחת בוקר קבועה', 'ארוחת צהריים', 'סלט ערב', 'ארוחת ביניים'];

export function SaveMealDialog({ open, onClose, onSave, initial = '', title = 'שמירה כארוחה קבועה' }: {
  open: boolean; onClose: () => void; onSave: (name: string) => void; initial?: string; title?: string;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) { setName(initial); setError(''); }
  }, [open, initial]);
  const submit = () => {
    if (!name.trim()) return setError('יש לתת שם לארוחה');
    onSave(name.trim());
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><button className="btn-ghost" onClick={onClose}>ביטול</button><button className="btn-primary" onClick={submit}>שמירה</button></>}>
      <label className="label" htmlFor="meal-name">שם הארוחה</label>
      <input id="meal-name" className="input" value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="למשל: ארוחת בוקר קבועה" />
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => <button key={p} type="button" className="chip hover:bg-cream" onClick={() => setName(p)}>{p}</button>)}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}
    </Modal>
  );
}
