// Weitere Visualisierungs-Bausteine im handgezeichneten Stil (09-lektionen.md, Abschnitt 6):
// Kontenkreislauf, Kostenstellen-Netz, Kalkulations-Treppe, Abschreibungs-Verlauf, Kostenfunktion.
import { Decimal, formatEuro, formatPlain } from '../../engine/money';
import { cx } from '../components/ui';
import { STRICH, handLinie } from './hand';

const PAPIER = 'rounded-lg bg-[color:var(--peep-paper)] p-3 text-[color:var(--peep-ink)]';

// ---------- Kontenkreislauf ----------

const KREISLAUF = [
  {
    titel: 'Eröffnungsbilanzkonto',
    text: 'Anfangsbestände auf die Konten verteilen',
    farbe: '#4a9fd8',
  },
  {
    titel: 'Bestandskonten',
    text: 'Aktiv- und Passivkonten nehmen Zu- und Abgänge auf',
    farbe: '#1c6670',
  },
  {
    titel: 'Erfolgskonten → GuV',
    text: 'Aufwendungen und Erträge sammeln sich im Gewinn- und Verlustkonto',
    farbe: '#e8792b',
  },
  {
    titel: 'Eigenkapital',
    text: 'Der Saldo der GuV (Gewinn oder Verlust) verändert das Eigenkapital',
    farbe: '#8cbf3f',
  },
  {
    titel: 'Schlussbilanzkonto',
    text: 'Schlussbestände aller Bestandskonten – Grundlage der nächsten Eröffnung',
    farbe: '#e2b13c',
  },
];

export function Kreislauf({ aktiv }: { aktiv?: number | undefined }) {
  return (
    <figure className={PAPIER} aria-label="Kontenkreislauf">
      <ol className="flex flex-col gap-1.5">
        {KREISLAUF.map((k, i) => (
          <li key={k.titel} className="flex flex-col items-stretch">
            <div
              className={cx(
                'rounded-lg border-2 px-3 py-2 transition-all',
                aktiv === i + 1
                  ? 'scale-[1.02] border-[color:var(--peep-ink)] shadow-md'
                  : 'border-[color:var(--peep-ink)]/40',
                aktiv !== undefined && aktiv !== i + 1 && 'opacity-60',
              )}
              style={{ background: `color-mix(in srgb, ${k.farbe} 20%, var(--peep-paper))` }}
            >
              <div className="hand text-[15px] font-bold">
                {i + 1}. {k.titel}
              </div>
              <div className="text-xs opacity-80">{k.text}</div>
            </div>
            {i < KREISLAUF.length - 1 ? (
              <div className="text-center text-lg leading-none" aria-hidden="true">
                ↓
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-center text-xs opacity-70">
        … und im neuen Jahr beginnt der Kreislauf wieder beim Eröffnungsbilanzkonto.
      </p>
    </figure>
  );
}

// ---------- Kostenstellen-Netz ----------

export function Kostenstellen({
  hilfs,
  haupt,
  pfeile,
}: {
  hilfs: { name: string; primaer?: string; einheit: string }[];
  haupt: { name: string; primaer?: string }[];
  pfeile: { von: string; an: string; menge: string }[];
}) {
  const W = 360;
  const pos = new Map<string, { x: number; y: number }>();
  hilfs.forEach((h, i) => pos.set(h.name, { x: ((i + 1) * W) / (hilfs.length + 1), y: 40 }));
  haupt.forEach((h, i) => pos.set(h.name, { x: ((i + 1) * W) / (haupt.length + 1), y: 190 }));
  const einheit = new Map(hilfs.map((h) => [h.name, h.einheit]));
  const box = (name: string, primaer: string | undefined, farbe: string) => {
    const p = pos.get(name)!;
    return (
      <g key={name}>
        <rect
          x={p.x - 52}
          y={p.y - 20}
          width={104}
          height={primaer ? 40 : 30}
          rx={8}
          fill={farbe}
          opacity={0.35}
        />
        <rect
          x={p.x - 52}
          y={p.y - 20}
          width={104}
          height={primaer ? 40 : 30}
          rx={8}
          {...STRICH}
          strokeWidth={1.8}
        />
        <text
          x={p.x}
          y={p.y - 3}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="currentColor"
        >
          {name.length > 18 ? name.slice(0, 17) + '…' : name}
        </text>
        {primaer ? (
          <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize="9.5" fill="currentColor">
            {formatEuro(primaer, 0)}
          </text>
        ) : null}
      </g>
    );
  };
  return (
    <figure
      className={PAPIER}
      aria-label={`Kostenstellen: ${pfeile.map((p) => `${p.von} an ${p.an} ${p.menge} ${einheit.get(p.von) ?? ''}`).join(', ')}`}
    >
      <svg viewBox={`0 0 ${W} 230`} className="w-full">
        <defs>
          <marker
            id="pfeil"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill="var(--peep-ink)" />
          </marker>
        </defs>
        {pfeile.map((p, i) => {
          const a = pos.get(p.von);
          const b = pos.get(p.an);
          if (!a || !b) return null;
          const zwischenHilfs = a.y === b.y;
          const y1 = a.y + (zwischenHilfs ? -2 : 20);
          const y2 = b.y + (zwischenHilfs ? -2 : -20);
          const mx = (a.x + b.x) / 2;
          const my = zwischenHilfs ? a.y - 32 - (i % 2) * 6 : (y1 + y2) / 2;
          const d = zwischenHilfs
            ? `M${a.x + (b.x > a.x ? 30 : -30)} ${a.y - 20} Q${mx} ${my - 18} ${b.x + (b.x > a.x ? -30 : 30)} ${b.y - 20}`
            : `M${a.x} ${y1} L${b.x} ${y2}`;
          return (
            <g key={i}>
              <path d={d} {...STRICH} strokeWidth={1.4} markerEnd="url(#pfeil)" opacity={0.8} />
              <rect x={mx - 26} y={my - 9} width={52} height={14} rx={4} fill="var(--peep-paper)" />
              <text x={mx} y={my + 1.5} textAnchor="middle" fontSize="9" fill="currentColor">
                {/^-?\d+(\.\d+)?$/.test(p.menge) ? formatPlain(p.menge) : p.menge}{' '}
                {einheit.get(p.von) ?? ''}
              </text>
            </g>
          );
        })}
        {hilfs.map((h) => box(h.name, h.primaer, '#4a9fd8'))}
        {haupt.map((h) => box(h.name, h.primaer, '#e2b13c'))}
        <text x={6} y={14} fontSize="9" fill="currentColor" opacity={0.7}>
          Vorkostenstellen
        </text>
        <text x={6} y={226} fontSize="9" fill="currentColor" opacity={0.7}>
          Hauptkostenstellen
        </text>
      </svg>
    </figure>
  );
}

// ---------- Kalkulations-Treppe ----------

export function Treppe({
  stufen,
}: {
  stufen: { label: string; betrag: string; art: 'basis' | 'zuschlag' | 'summe' }[];
}) {
  const max = Decimal.max(...stufen.map((s) => new Decimal(s.betrag)), 1);
  return (
    <figure className={PAPIER} aria-label="Kalkulations-Treppe">
      <ol className="flex flex-col gap-1">
        {stufen.map((s, i) => {
          const breite = new Decimal(s.betrag).div(max).times(100).toNumber();
          return (
            <li
              key={i}
              className={cx('einblenden', s.art === 'summe' && 'mt-1')}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <span
                  className={cx(s.art === 'summe' && 'font-bold', s.art === 'zuschlag' && 'pl-3')}
                >
                  {s.art === 'zuschlag' ? '+ ' : s.art === 'summe' ? '= ' : ''}
                  {s.label}
                </span>
                <span className={cx('num shrink-0', s.art === 'summe' && 'font-bold')}>
                  {formatEuro(s.betrag)}
                </span>
              </div>
              <div className="mt-0.5 h-2.5 rounded-full bg-black/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${breite}%`,
                    background:
                      s.art === 'summe' ? '#1c6670' : s.art === 'zuschlag' ? '#e8792b' : '#e2b13c',
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

// ---------- Abschreibungs-Verlauf ----------

export type AfaVerfahrenDiagramm = 'linear' | 'arithmetisch' | 'geometrisch';

const AFA_FARBE: Record<AfaVerfahrenDiagramm, string> = {
  linear: '#1c6670',
  arithmetisch: '#e8792b',
  geometrisch: '#8cbf3f',
};
export const AFA_NAME: Record<AfaVerfahrenDiagramm, string> = {
  linear: 'linear',
  arithmetisch: 'arithmetisch-degressiv',
  geometrisch: 'geometrisch-degressiv',
};

/** Buchwerte am Ende jedes Jahres (0 … nd), exakt mit decimal.js. */
export function buchwerte(
  v: AfaVerfahrenDiagramm,
  basis: string,
  restwert: string,
  nd: number,
  satz?: string,
): InstanceType<typeof Decimal>[] {
  const a = new Decimal(basis);
  const r = new Decimal(restwert);
  const out = [a];
  if (v === 'linear') for (let t = 1; t <= nd; t++) out.push(a.minus(a.minus(r).times(t).div(nd)));
  if (v === 'arithmetisch') {
    const d = a.minus(r).div((nd * (nd + 1)) / 2);
    let bw = a;
    for (let k = 1; k <= nd; k++) out.push((bw = bw.minus(d.times(nd - k + 1))));
  }
  if (v === 'geometrisch') {
    const p = satz ? new Decimal(satz) : new Decimal(1).minus(r.div(a).pow(new Decimal(1).div(nd)));
    let bw = a;
    for (let t = 1; t <= nd; t++) out.push((bw = bw.times(new Decimal(1).minus(p))));
  }
  return out;
}

export function AfaVerlauf({
  basis,
  restwert,
  nd,
  verfahren,
  satz,
}: {
  basis: string;
  restwert: string;
  nd: number;
  verfahren: AfaVerfahrenDiagramm[];
  satz?: string | undefined;
}) {
  const W = 340;
  const H = 180;
  const max = new Decimal(basis);
  const x = (t: number) => 34 + (t / nd) * (W - 48);
  const y = (bw: InstanceType<typeof Decimal>) => 14 + (1 - bw.div(max).toNumber()) * (H - 40);
  return (
    <figure
      className={PAPIER}
      aria-label={`Buchwertverlauf über ${nd} Jahre: ${verfahren.map((v) => AFA_NAME[v]).join(', ')}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path
          d={handLinie(34, 14, 34, H - 26, 71) + ' ' + handLinie(34, H - 26, W - 10, H - 26, 72)}
          {...STRICH}
          strokeWidth={1.6}
        />
        {Array.from({ length: nd + 1 }, (_, t) => (
          <text key={t} x={x(t)} y={H - 12} fontSize="9" textAnchor="middle" fill="currentColor">
            {t}
          </text>
        ))}
        <text x={W - 10} y={H - 2} fontSize="9" textAnchor="end" fill="currentColor" opacity={0.7}>
          Jahre
        </text>
        <text x={4} y={12} fontSize="9" fill="currentColor" opacity={0.7}>
          Buchwert
        </text>
        {verfahren.map((v) => {
          const bw = buchwerte(v, basis, restwert, nd, satz);
          const d = bw
            .map((b, t) => `${t === 0 ? 'M' : 'L'}${x(t).toFixed(1)} ${y(b).toFixed(1)}`)
            .join(' ');
          return (
            <path
              key={v}
              d={d}
              stroke={AFA_FARBE[v]}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'all 0.5s' }}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-xs">
        {verfahren.map((v) => (
          <span key={v} className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-4 rounded" style={{ background: AFA_FARBE[v] }} />{' '}
            {AFA_NAME[v]}
          </span>
        ))}
      </div>
    </figure>
  );
}

// ---------- Kostenfunktion ----------

export function Kostenfunktion({
  preis,
  kv,
  kf,
  xmax,
  x,
  einheit = 'Stück',
}: {
  preis: string;
  kv: string;
  kf: string;
  xmax: number;
  x?: number | undefined;
  einheit?: string | undefined;
}) {
  const W = 340;
  const H = 200;
  const p = new Decimal(preis);
  const v = new Decimal(kv);
  const f = new Decimal(kf);
  const ymax = Decimal.max(p.times(xmax), f.plus(v.times(xmax)));
  const sx = (m: number) => 40 + (m / xmax) * (W - 54);
  const sy = (e: InstanceType<typeof Decimal>) => H - 28 - e.div(ymax).toNumber() * (H - 44);
  const db = p.minus(v);
  const bep = db.gt(0) ? f.div(db) : null;
  return (
    <figure
      className={PAPIER}
      aria-label={`Kostenfunktion: Preis ${formatEuro(preis)}, variable Kosten ${formatEuro(kv)} je ${einheit}, Fixkosten ${formatEuro(kf)}${bep ? `, Gewinnschwelle bei ${formatPlain(bep.ceil())} ${einheit}` : ''}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path
          d={handLinie(40, 10, 40, H - 28, 81) + ' ' + handLinie(40, H - 28, W - 10, H - 28, 82)}
          {...STRICH}
          strokeWidth={1.6}
        />
        <line
          x1={sx(0)}
          y1={sy(new Decimal(0))}
          x2={sx(xmax)}
          y2={sy(p.times(xmax))}
          stroke="#1c6670"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <line
          x1={sx(0)}
          y1={sy(f)}
          x2={sx(xmax)}
          y2={sy(f.plus(v.times(xmax)))}
          stroke="#e8792b"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <line
          x1={sx(0)}
          y1={sy(f)}
          x2={sx(xmax)}
          y2={sy(f)}
          stroke="#e8792b"
          strokeWidth={1.4}
          strokeDasharray="4 4"
          opacity={0.7}
        />
        {bep && bep.lte(xmax) ? (
          <g>
            <circle
              cx={sx(bep.toNumber())}
              cy={sy(p.times(bep))}
              r={5}
              fill="#e2b13c"
              stroke="var(--peep-ink)"
              strokeWidth={1.5}
            />
            <text
              x={sx(bep.toNumber())}
              y={sy(p.times(bep)) - 10}
              fontSize="9.5"
              textAnchor="middle"
              fill="currentColor"
            >
              Gewinnschwelle
            </text>
          </g>
        ) : null}
        {x !== undefined ? (
          <line
            x1={sx(x)}
            y1={14}
            x2={sx(x)}
            y2={H - 28}
            stroke="var(--peep-ink)"
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
        ) : null}
        <text x={W - 10} y={H - 12} fontSize="9" textAnchor="end" fill="currentColor" opacity={0.7}>
          Menge ({einheit})
        </text>
      </svg>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-4 rounded bg-[#1c6670]" /> Erlöse
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-4 rounded bg-[#e8792b]" /> Gesamtkosten
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-[#e8792b]" />{' '}
          Fixkosten
        </span>
      </div>
    </figure>
  );
}
