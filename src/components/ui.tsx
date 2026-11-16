import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { Food, Level, VerificationStatus } from '../domain/types';
import { LEVEL_TEXT } from '../engine/ruleEngine';
import { useUi } from '../state/AppContext';

export const LEVEL_STYLE: Record<Level, { bg: string; text: string; ring: string; dot: string; symbol: string }> = {
  green: { bg: 'bg-ok-soft', text: 'text-ok', ring: 'ring-ok/30', dot: 'bg-ok', symbol: '✓' },
  yellow: { bg: 'bg-warn-soft', text: 'text-warn', ring: 'ring-warn/30', dot: 'bg-warn', symbol: '!' },
  red: { bg: 'bg-bad-soft', text: 'text-bad', ring: 'ring-bad/30', dot: 'bg-bad', symbol: '✕' },
  unknown: { bg: 'bg-unk-soft', text: 'text-unk', ring: 'ring-unk/30', dot: 'bg-unk', symbol: '?' },
};

export function LevelBadge({ level, size = 'sm' }: { level: Level; size?: 'sm' | 'md' }) {
  const s = LEVEL_STYLE[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${s.bg} ${s.text} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span aria-hidden className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold text-white ${s.dot}`}>
        {s.symbol}
      </span>
      {LEVEL_TEXT[level].short}
    </span>
  );
}

export function LevelDot({ level }: { level: Level }) {
  const s = LEVEL_STYLE[level];
  return (
    <span aria-label={LEVEL_TEXT[level].short} className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold text-white ${s.dot}`}>
      {s.symbol}
    </span>
  );
}

export function VerificationTag({ status }: { status: VerificationStatus | null }) {
  if (status === 'verified') return <span className="rounded-full bg-leaf-soft px-2 py-0.5 text-xs text-leaf-dark">מאומת לפי מקור</span>;
  if (status === 'unverified') return <span className="rounded-full bg-earth-soft px-2 py-0.5 text-xs text-earth">פרשנות, טעון אימות</span>;
  if (status === 'demo') return <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs text-warn">נתוני הדגמה, לא כלל השיטה</span>;
  return <span className="rounded-full bg-unk-soft px-2 py-0.5 text-xs text-unk">טרם הוגדר</span>;
}

export function FoodChip({ food, onRemove, onClick }: { food: Food; onRemove?: () => void; onClick?: () => void }) {
  return (
    <span className="chip animate-pop bg-leaf-soft/60 border-leaf/20 text-base">
      <button type="button" onClick={onClick} className="flex items-center gap-1.5" disabled={!onClick}>
        <span aria-hidden className="text-lg leading-none">{food.icon}</span>
        <span className="font-medium">{food.nameHe}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`הסר ${food.nameHe}`}
          className="-me-1 ms-1 grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-bad-soft hover:text-bad"
        >
          ✕
        </button>
      )}
    </span>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        onMouseDown={(e) => e.stopPropagation()}
        className={`animate-pop flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-surface shadow-xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={id} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="סגור" className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream">✕</button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, text, confirmLabel = 'אישור', danger, onConfirm, onClose }: {
  open: boolean; title: string; text: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>ביטול</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
        </>
      }
    >
      <p className="text-ink">{text}</p>
    </Modal>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div aria-hidden className="text-5xl">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="max-w-sm text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Toaster() {
  const { toasts } = useUi();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`animate-pop pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
            t.kind === 'error' ? 'bg-bad text-white' : t.kind === 'info' ? 'bg-ink text-bg' : 'bg-leaf-dark text-white dark:text-bg'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

export const DISCLAIMER =
  'האפליקציה מבוססת על כללי צירופי מזון של השיטה ואינה מהווה ייעוץ רפואי או תחליף לייעוץ של איש מקצוע מוסמך.';

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
