// Durchsuchbare Kontenliste als Overlay (auf dem Handy bildschirmfüllend).
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KONTEN,
  KONTOTYP_LABEL,
  searchKonten,
  type Konto,
  type KontoTyp,
} from '../../engine/accounts';
import { Icon, cx } from './ui';

const REIHENFOLGE: KontoTyp[] = ['aktiv', 'passiv', 'aufwand', 'ertrag', 'abschluss'];

export function KontoPicker({
  seite,
  onSelect,
  onClose,
}: {
  seite: 'soll' | 'haben';
  onSelect: (konto: Konto) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const treffer = useMemo(() => (query.trim() ? searchKonten(query, 40) : null), [query]);

  const zeile = (k: Konto) => (
    <li key={k.name}>
      <button
        type="button"
        onClick={() => onSelect(k)}
        className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-line px-4 py-2 text-left hover:bg-surface-2"
      >
        <span>
          <span className="block text-[15px]">{k.name}</span>
          {k.kurz !== k.name ? <span className="block text-xs text-muted">{k.kurz}</span> : null}
        </span>
        <span className="shrink-0 text-xs text-muted">
          {KONTOTYP_LABEL[k.typ].replace('konto', '')}
        </span>
      </button>
    </li>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Konto für ${seite === 'soll' ? 'Soll' : 'Haben'} wählen`}
      onClick={onClose}
    >
      <div
        className="safe-bottom flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface sm:h-[80vh] sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line p-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3">
            <Icon name="suche" className="h-5 w-5 text-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Konto suchen, z. B. „Vorst“"
              aria-label="Konto suchen"
              className="h-11 w-full bg-transparent outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && treffer?.[0]) onSelect(treffer[0]);
              }}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-2"
            aria-label="Schließen"
          >
            <Icon name="schliessen" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {treffer ? (
            treffer.length > 0 ? (
              <ul>{treffer.map(zeile)}</ul>
            ) : (
              <p className="p-4 text-muted">Kein Konto gefunden.</p>
            )
          ) : (
            REIHENFOLGE.map((typ) => (
              <div key={typ}>
                <h3
                  className={cx(
                    'sticky top-0 bg-surface-2 px-4 py-1.5 text-xs font-semibold tracking-wide text-muted uppercase',
                  )}
                >
                  {KONTOTYP_LABEL[typ].replace('konto', 'konten')}
                </h3>
                <ul>{KONTEN.filter((k) => k.typ === typ).map(zeile)}</ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
