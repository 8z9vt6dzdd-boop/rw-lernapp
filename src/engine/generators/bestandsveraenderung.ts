// E4 – Bestandsveränderungen an unfertigen und fertigen Erzeugnissen.
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../booking';
import { Val, dec } from '../money';
import type { ErrorVariant, TaskPart } from '../task';
import { betrag, defineGenerator, eur, feld, isKrumm, retry } from './base';

export interface BestandParams {
  ueAB: string;
  ueEB: string;
  feAB: string;
  feEB: string;
  /** Optional: Erfolgsermittlung mit Umsatzerlösen und übrigen Aufwendungen. */
  erfolg?: { erloese: string; aufwendungen: string };
}

export interface BestandSolution {
  dUE: Val;
  dFE: Val;
  saldo: Val;
  gewinn?: Val;
  buchung: BuchungsLoesung;
}

const UE = 'Unfertige Erzeugnisse';
const FE = 'Fertige Erzeugnisse';
const BV = 'Bestandsveränderungen';
const GUV = 'Gewinn- und Verlustkonto';

const MEHR = 'Mehrbestand';
const MINDER = 'Minderbestand';
const SALDO_MEHR = 'Mehrbestand – erhöht den Erfolg';
const SALDO_MINDER = 'Minderbestand – mindert den Erfolg';

function bestandsSatz(konto: string, d: Val, umgekehrt = false): ErwSatz | null {
  if (d.exact.isZero()) return null;
  const mehr = d.isNegative() === umgekehrt;
  const b = d.abs();
  return mehr ? satz([zeile(konto, b)], [zeile(BV, b)]) : satz([zeile(BV, b)], [zeile(konto, b)]);
}

function saldoSatz(saldo: Val, umgekehrt = false): ErwSatz {
  const mehr = saldo.isNegative() === umgekehrt;
  const b = saldo.abs();
  return mehr
    ? satz([zeile(BV, b)], [zeile(GUV, b)], 'Abschluss')
    : satz([zeile(GUV, b)], [zeile(BV, b)], 'Abschluss');
}

export function solveBestand(p: BestandParams): BestandSolution {
  const dUE = new Val(p.ueEB).minus(p.ueAB);
  const dFE = new Val(p.feEB).minus(p.feAB);
  const saldo = dUE.plus(dFE);
  const saetze = [bestandsSatz(UE, dUE), bestandsSatz(FE, dFE), saldoSatz(saldo)].filter(
    (s): s is ErwSatz => s !== null,
  );
  const sol: BestandSolution = { dUE, dFE, saldo, buchung: loesung(saetze) };
  if (p.erfolg) sol.gewinn = new Val(p.erfolg.erloese).plus(saldo).minus(p.erfolg.aufwendungen);
  return sol;
}

function art(d: Val, umgekehrt = false): string {
  return d.isNegative() === umgekehrt ? MEHR : MINDER;
}

function parts(_p: BestandParams, s: BestandSolution, umgekehrt = false): TaskPart[] {
  const felder: TaskPart & { typ: 'rechenkette' } = {
    typ: 'rechenkette',
    id: 'veraenderung',
    titel: 'Bestandsveränderungen ermitteln',
    felder: [
      {
        typ: 'auswahl',
        id: 'ue-art',
        label: 'Unfertige Erzeugnisse',
        optionen: [MEHR, MINDER],
        soll: art(s.dUE, umgekehrt),
      },
      feld('ue-betrag', 'Veränderung unfertige Erzeugnisse', s.dUE.abs()),
      {
        typ: 'auswahl',
        id: 'fe-art',
        label: 'Fertige Erzeugnisse',
        optionen: [MEHR, MINDER],
        soll: art(s.dFE, umgekehrt),
      },
      feld('fe-betrag', 'Veränderung fertige Erzeugnisse', s.dFE.abs()),
      {
        typ: 'auswahl',
        id: 'saldo-art',
        label: 'Insgesamt',
        optionen: [SALDO_MEHR, SALDO_MINDER],
        soll: s.saldo.isNegative() === umgekehrt ? SALDO_MEHR : SALDO_MINDER,
      },
      feld('saldo-betrag', 'Saldo Bestandsveränderungen', s.saldo.abs()),
    ],
  };
  if (s.gewinn) felder.felder.push(feld('gewinn', 'Gewinn des Geschäftsjahres', s.gewinn));
  return [
    felder,
    {
      typ: 'buchungssatz',
      id: 'buchung',
      titel: 'Buchungen der Bestandsveränderungen und Abschluss',
      loesung: s.buchung,
    },
  ];
}

function variants(p: BestandParams): ErrorVariant[] {
  const s = solveBestand(p);
  const out: ErrorVariant[] = [];
  const umgekehrt = [
    bestandsSatz(UE, s.dUE, true),
    bestandsSatz(FE, s.dFE, true),
    saldoSatz(s.saldo, true),
  ].filter((x): x is ErwSatz => x !== null);
  out.push({
    fehlertyp: 'mehrung-als-aufwand',
    parts: parts(p, { ...s, buchung: loesung(umgekehrt) }, true),
  });
  const saldoFalsch = [
    bestandsSatz(UE, s.dUE),
    bestandsSatz(FE, s.dFE),
    saldoSatz(s.saldo, true),
  ].filter((x): x is ErwSatz => x !== null);
  out.push({
    fehlertyp: 'saldo-falsche-seite',
    parts: parts(p, { ...s, buchung: loesung(saldoFalsch) }),
  });
  // Unfertige und fertige Erzeugnisse verrechnet: nur ein Erzeugniskonto mit dem Saldo
  for (const konto of [UE, FE]) {
    const netto = [bestandsSatz(konto, s.saldo), saldoSatz(s.saldo)].filter(
      (x): x is ErwSatz => x !== null,
    );
    out.push({ fehlertyp: 'ue-fe-verrechnet', parts: parts(p, { ...s, buchung: loesung(netto) }) });
  }
  return out;
}

function veraenderungText(d: Val, name: string): string {
  if (d.exact.isZero()) return `${name}: unverändert`;
  return `${name}: ${d.isNegative() ? 'Minderbestand' : 'Mehrbestand'} ${eur(d.abs())}`;
}

export const bestandsveraenderung = defineGenerator<BestandParams, BestandSolution>({
  skillId: 'E4-bestandsveraenderung',
  titel: 'Bestandsveränderungen',
  variants: ['buchung', 'erfolg'],
  points: 5,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const mitErfolg = opts.variant === 'erfolg' || (opts.variant === undefined && rng.chance(0.3));
    return retry(
      rng,
      (r) => {
        const p: BestandParams = {
          ueAB: betrag(r, 5_000, 80_000, 1_000, krumm),
          ueEB: betrag(r, 5_000, 80_000, 1_000, krumm),
          feAB: betrag(r, 10_000, 150_000, 1_000, krumm),
          feEB: betrag(r, 10_000, 150_000, 1_000, krumm),
        };
        if (mitErfolg) {
          p.erfolg = {
            erloese: betrag(r, 400_000, 900_000, 10_000, false),
            aufwendungen: betrag(r, 250_000, 700_000, 10_000, false),
          };
        }
        return p;
      },
      (p) => {
        const s = solveBestand(p);
        return (
          !s.dUE.exact.isZero() &&
          !s.dFE.exact.isZero() &&
          !s.saldo.exact.isZero() &&
          // Gegenläufige Veränderungen sind lehrreicher (Saldo nicht trivial)
          (s.dUE.isNegative() !== s.dFE.isNegative() || r50(p)) &&
          (!s.gewinn || s.gewinn.exact.gt(dec(10_000)))
        );
      },
    );
  },
  render: (p) => ({
    titel: 'Bestandsveränderungen',
    kontext: '31. Dezember: Inventur im Tanklager und Logistikzentrum',
    sachverhalt: [
      'Die Inventur der MBG zum 31.12. ergibt folgende Bestände (Werte zu Herstellungskosten):',
      ...(p.erfolg
        ? [
            `Außerdem sind bekannt: Umsatzerlöse ${eur(p.erfolg.erloese)}, übrige Aufwendungen ${eur(p.erfolg.aufwendungen)}.`,
          ]
        : []),
    ],
    daten: {
      spalten: ['', 'Anfangsbestand', 'Endbestand'],
      zeilen: [
        ['Unfertige Erzeugnisse (Sirup und Bier in den Lagertanks)', eur(p.ueAB), eur(p.ueEB)],
        ['Fertige Erzeugnisse (abgefüllte Ware im Logistikzentrum)', eur(p.feAB), eur(p.feEB)],
      ],
    },
    aufgabe: p.erfolg
      ? 'Ermittle die Bestandsveränderungen, bilde die Buchungen einschließlich Abschluss des Kontos Bestandsveränderungen und ermittle den Gewinn.'
      : 'Ermittle die Bestandsveränderungen und bilde die Buchungen einschließlich Abschluss des Kontos Bestandsveränderungen.',
  }),
  solve: solveBestand,
  parts: (p, s) => parts(p, s),
  steps: (p, s) => {
    const steps = [
      {
        titel: 'Veränderungen',
        rechnung: `${veraenderungText(s.dUE, 'Unfertige Erzeugnisse')}; ${veraenderungText(s.dFE, 'Fertige Erzeugnisse')}`,
        erlaeuterung:
          'Endbestand − Anfangsbestand: positiv = Mehrbestand, negativ = Minderbestand.',
      },
      {
        titel: 'Buchungen',
        erlaeuterung:
          'Mehrbestand: Erzeugniskonto an Bestandsveränderungen. Minderbestand: Bestandsveränderungen an Erzeugniskonto. Jedes Erzeugniskonto wird einzeln gebucht.',
      },
      {
        titel: 'Abschluss',
        rechnung: `Saldo ${eur(s.saldo.abs())} (${s.saldo.isNegative() ? 'Minderbestand' : 'Mehrbestand'}) → ${
          s.saldo.isNegative() ? 'GuV an Bestandsveränderungen' : 'Bestandsveränderungen an GuV'
        }`,
        erlaeuterung: s.saldo.isNegative()
          ? 'Ein Minderbestand wirkt wie Aufwand und mindert den Erfolg.'
          : 'Ein Mehrbestand wirkt wie Ertrag und erhöht den Erfolg.',
      },
    ];
    if (p.erfolg && s.gewinn) {
      steps.push({
        titel: 'Gewinn',
        rechnung: `${eur(p.erfolg.erloese)} ${s.saldo.isNegative() ? '−' : '+'} ${eur(s.saldo.abs())} − ${eur(p.erfolg.aufwendungen)} = ${eur(s.gewinn)}`,
        erlaeuterung: 'Umsatzerlöse ± Bestandsveränderungen − Aufwendungen.',
      });
    }
    return steps;
  },
  hints: (_p, s) => [
    'Je Erzeugnisart: Endbestand mit Anfangsbestand vergleichen. Danach das Konto Bestandsveränderungen über die GuV abschließen.',
    `Unfertige Erzeugnisse: ${s.dUE.isNegative() ? 'Minderbestand' : 'Mehrbestand'}. Fertige Erzeugnisse: ${
      s.dFE.isNegative() ? 'Minderbestand' : 'Mehrbestand'
    }.`,
    `Saldo ${eur(s.saldo.abs())}: ${s.saldo.isNegative() ? 'GuV an Bestandsveränderungen' : 'Bestandsveränderungen an GuV'}.`,
  ],
  errorVariants: variants,
  verfahren: () => 'Bestandsveränderungen buchen und über die GuV abschließen',
});

// Etwa die Hälfte der gleichgerichteten Fälle zulassen (deterministisch über die Werte).
function r50(p: BestandParams): boolean {
  return dec(p.ueAB).plus(p.feEB).mod(2_000).lt(1_000);
}
