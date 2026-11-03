// „Fehler melden“: Inhalt verschwindet sofort aus den Sitzungen und wird geprüft (07-content-pipeline.md).
import { useState } from 'react';
import { meldungSpeichern } from '../../learning/ereignisse';
import { Button, cx } from './ui';

export function MeldenKnopf({
  elementId,
  skillId,
  seed,
  variant,
  className,
}: {
  elementId: string;
  skillId?: string;
  seed?: number;
  variant?: string;
  className?: string;
}) {
  const [offen, setOffen] = useState(false);
  const [kommentar, setKommentar] = useState('');
  const [gesendet, setGesendet] = useState(false);
  if (gesendet)
    return (
      <p className={cx('text-sm text-muted', className)} role="status">
        Danke! Der Inhalt wird geprüft und kommt bis dahin nicht mehr in deinen Sitzungen vor.
      </p>
    );
  if (!offen)
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className={cx('min-h-10 text-sm text-muted underline hover:text-ink', className)}
      >
        Fehler melden
      </button>
    );
  return (
    <div className={cx('rounded-lg border border-line bg-surface-2 p-3', className)}>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Was stimmt hier nicht? (freiwillig)</span>
        <textarea
          aria-label="Kommentar zur Meldung"
          rows={2}
          value={kommentar}
          onChange={(e) => setKommentar(e.target.value)}
          className="rounded-lg border border-line-strong bg-surface p-2 text-[15px]"
          placeholder="z. B. „Lösung passt nicht zum Lehrbrief“"
        />
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => {
            const d: Parameters<typeof meldungSpeichern>[0] = { elementId, kommentar };
            if (skillId) d.skillId = skillId;
            if (seed !== undefined) d.seed = seed;
            if (variant) d.variant = variant;
            void meldungSpeichern(d).then(() => setGesendet(true));
          }}
        >
          Melden
        </Button>
        <Button variant="ghost" onClick={() => setOffen(false)}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
