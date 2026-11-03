// Setzt eine Figur aus Open-Peeps-Bausteinen zusammen (Haltung, Frisur, Gesicht, Bart, Brille).
// Wird lazy geladen, weil die Pfaddaten groß sind.
import { memo } from 'react';
import { PARTS, type PeepPart } from '../../assets/peeps/parts';
import { GESICHT, type Ausdruck, type Figur } from '../../content/characters';

const INK = 'var(--peep-ink)';
const PAPIER = 'var(--peep-paper)';

function Part({ id, fill }: { id: string; fill: string }) {
  const p: PeepPart | undefined = PARTS[id];
  if (!p) return null;
  return (
    <g transform={p.transform ?? undefined}>
      {p.paths.map((x, i) => (
        <path
          key={i}
          d={x.d}
          transform={x.t ?? undefined}
          fill={x.fill === 'bg' ? fill : x.fill === 'stroke' ? INK : x.fill}
          fillRule={x.evenodd ? 'evenodd' : undefined}
        />
      ))}
    </g>
  );
}

function PeepSvgImpl({ figur, ausdruck }: { figur: Figur; ausdruck: Ausdruck }) {
  return (
    <svg viewBox="0 0 850 1200" className="h-full w-full overflow-visible" aria-hidden="true">
      <Part id={`pose/${figur.posen[ausdruck]}`} fill={figur.farbe} />
      <g transform="translate(225 0)">
        <Part id={`hair/${figur.frisur}`} fill={PAPIER} />
        <g transform="translate(159 186)">
          <Part id={`face/${GESICHT[ausdruck]}`} fill={PAPIER} />
        </g>
        {figur.bart ? (
          <g transform="translate(123 338)">
            <Part id={`facialHair/${figur.bart}`} fill={PAPIER} />
          </g>
        ) : null}
        {figur.brille ? (
          <g transform="translate(47 241)">
            <Part id={`accessories/${figur.brille}`} fill={PAPIER} />
          </g>
        ) : null}
      </g>
    </svg>
  );
}

const PeepSvg = memo(PeepSvgImpl);
export default PeepSvg;
