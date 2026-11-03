// Wiederholungskarte (Interaktionstyp „theoriekarte“): Frage → Antwort aufdecken → Selbsteinschätzung (FSRS-Bewertung).
import { useState } from 'react';
import { merksatzKarten } from '../../learning/scheduler';
import type { FsrsRating } from '../../learning/types';
import { Button, Card, Chip, Icon } from './ui';

const BEWERTUNGEN: { rating: FsrsRating; label: string; text: string }[] = [
  { rating: 1, label: 'Nochmal', text: 'wusste ich nicht' },
  { rating: 2, label: 'Schwer', text: 'nur mit Mühe' },
  { rating: 3, label: 'Gut', text: 'wusste ich' },
  { rating: 4, label: 'Leicht', text: 'sofort klar' },
];

export function KarteRunner({
  merksatzId,
  position,
  total,
  onFertig,
  onExit,
}: {
  merksatzId: string;
  position: number;
  total: number;
  onFertig: (rating: FsrsRating, durationMs: number) => void;
  onExit: () => void;
}) {
  const [start] = useState(() => Date.now());
  const [offen, setOffen] = useState(false);
  const karte = merksatzKarten().find((k) => k.id === merksatzId);
  if (!karte) return null;
  return (
    <div className="flex flex-col gap-4 pb-32">
      <div className="flex items-center justify-between gap-2">
        <span className="num text-sm text-muted">
          Aufgabe {position} von {total}
        </span>
        <button
          type="button"
          onClick={onExit}
          className="flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
          aria-label="Sitzung beenden"
        >
          <Icon name="schliessen" className="h-5 w-5" /> Beenden
        </button>
      </div>
      <Card className="rotate-[-0.4deg] border-2 border-[color:var(--peep-ink)] bg-[#fdf4c9] text-[#1d1a17]">
        <Chip>Wiederholungskarte · Lektion {karte.lektionId}</Chip>
        <h2 className="hand mt-3 text-xl font-bold">{karte.frage}</h2>
        {offen ? (
          <p className="einblenden mt-4 border-t border-dashed border-[#1d1a17]/40 pt-3 text-[17px]">
            {karte.antwort}
          </p>
        ) : null}
      </Card>
      {!offen ? (
        <Button variant="primary" onClick={() => setOffen(true)}>
          Antwort zeigen
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">
            Wie gut wusstest du es? Ehrlich bewerten – danach richtet sich, wann die Karte
            wiederkommt.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BEWERTUNGEN.map((b) => (
              <Button
                key={b.rating}
                variant={b.rating >= 3 ? 'primary' : 'secondary'}
                onClick={() => onFertig(b.rating, Date.now() - start)}
              >
                <span className="flex flex-col">
                  <span>{b.label}</span>
                  <span className="text-xs font-normal opacity-80">{b.text}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
