// Kleine, wiederverwendbare Bausteine im ruhigen Finanzsoftware-Stil.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export function Button({
  variant = 'secondary',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-[15px] font-medium whitespace-nowrap transition-colors sm:px-4 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-on-accent hover:bg-accent-hover',
        variant === 'secondary' &&
          'border border-line-strong bg-surface text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-accent hover:bg-accent-soft',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cx('rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5', className)}
    >
      {children}
    </section>
  );
}

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'neutral' ? 'bg-surface-2 text-muted' : 'bg-accent-soft text-accent',
      )}
    >
      {children}
    </span>
  );
}

/** Statussymbol – Bedeutung nie nur über Farbe: immer Zeichen plus Text für Screenreader. */
export function StatusIcon({ status }: { status: 'richtig' | 'rundung' | 'falsch' }) {
  const label =
    status === 'richtig' ? 'richtig' : status === 'rundung' ? 'richtig (Rundung)' : 'falsch';
  return (
    <span
      role="img"
      aria-label={label}
      className={cx(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold',
        status === 'falsch' ? 'bg-err-soft text-err' : 'bg-ok-soft text-ok',
      )}
    >
      {status === 'richtig' ? '✓' : status === 'rundung' ? '≈' : '✗'}
    </span>
  );
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cx('h-6 w-6', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

export type IconName =
  | 'start'
  | 'pfad'
  | 'firma'
  | 'statistik'
  | 'einstellungen'
  | 'schliessen'
  | 'plus'
  | 'minus'
  | 'suche'
  | 'hilfe'
  | 'pfeil';

const ICONS: Record<IconName, ReactNode> = {
  start: <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />,
  pfad: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.3 7.2 15.7 10.8M15.7 13.2 8.3 16.8" />
    </>
  ),
  firma: <path d="M4 20V8l5 3V8l5 3V5h6v15H4Zm4-4h2m4 0h2" />,
  statistik: <path d="M4 20h16M7 16v-5m5 5V7m5 9v-8" />,
  einstellungen: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2m0 14.6v2.2M4.6 4.6l1.6 1.6m11.6 11.6 1.6 1.6M2.5 12h2.2m14.6 0h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </>
  ),
  schliessen: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  suche: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  hilfe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 17h.01" />
    </>
  ),
  pfeil: <path d="M5 12h14m-6-6 6 6-6 6" />,
};
