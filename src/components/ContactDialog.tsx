import { useEffect, useRef, useState } from 'react';

export const PHONE_DISPLAY = '054-2135831';
const PHONE_INTL = '972542135831';

/** Contact chooser opened from the phone number in the footer: WhatsApp, call, or copy. */
export function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const numberRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PHONE_DISPLAY.replace('-', ''));
      setCopied(true);
    } catch {
      const range = document.createRange();
      if (numberRef.current) {
        range.selectNodeContents(numberRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-pop w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-xl"
      >
        <h2 id="contact-title" className="text-xl font-bold">המרכז לבריאות טבעית</h2>
        <p ref={numberRef} dir="ltr" className="mt-3 select-all text-2xl tabular-nums">{PHONE_DISPLAY}</p>
        <div className="mt-5 grid gap-3">
          <a
            href={`https://wa.me/${PHONE_INTL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#2f6f68] px-4 py-3.5 font-semibold text-white hover:bg-[#285e58]"
          >
            <span aria-hidden>💬</span> הודעה בוואטסאפ
          </a>
          <a href={`tel:+${PHONE_INTL}`} className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3.5 font-medium hover:bg-cream">
            <span aria-hidden>📞</span> חיוג
          </a>
          <button type="button" onClick={copy} className="rounded-xl border border-line px-4 py-3.5 font-medium hover:bg-cream">
            {copied ? 'המספר הועתק ✓' : 'העתקת המספר'}
          </button>
        </div>
        <div className="mt-5 flex justify-start">
          <button type="button" onClick={onClose} className="rounded-xl border border-line px-5 py-2.5 hover:bg-cream">סגירה</button>
        </div>
      </div>
    </div>
  );
}
