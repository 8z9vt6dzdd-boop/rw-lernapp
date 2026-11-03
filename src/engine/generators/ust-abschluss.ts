// B3 – Umsatzsteuer-Abschluss: Zahllast oder Vorsteuerüberhang.
import { loesung, satz, zeile, type BuchungsLoesung } from '../booking';
import { Val, dec } from '../money';
import type { ErrorVariant, TaskPart } from '../task';
import { betrag, defineGenerator, eur, feld, isKrumm, retry } from './base';

export type UstFall = 'zahllast' | 'ueberhang';

export interface UstAbschlussParams {
  vorsteuer: string;
  umsatzsteuer: string;
  /** 'jahresabschluss': Passivierung bzw. Aktivierung über das SBK; 'voranmeldung': Überweisung der Zahllast. */
  anlass: 'jahresabschluss' | 'voranmeldung';
  monat: string;
}

export interface UstAbschlussSolution {
  fall: UstFall;
  verrechnung: Val;
  saldo: Val;
  buchung: BuchungsLoesung;
}

export function solveUstAbschluss(p: UstAbschlussParams): UstAbschlussSolution {
  const vst = new Val(p.vorsteuer);
  const ust = new Val(p.umsatzsteuer);
  const fall: UstFall = ust.cmp(vst) > 0 ? 'zahllast' : 'ueberhang';
  const verrechnung = fall === 'zahllast' ? vst : ust;
  const saldo = fall === 'zahllast' ? ust.minus(vst) : vst.minus(ust);
  const verrechnungsSatz = satz(
    [zeile('Umsatzsteuer', verrechnung)],
    [zeile('Vorsteuer', verrechnung)],
    'Verrechnung',
  );
  let zweiter;
  if (fall === 'zahllast') {
    zweiter =
      p.anlass === 'voranmeldung'
        ? satz([zeile('Umsatzsteuer', saldo)], [zeile('Bank', saldo)], 'Überweisung der Zahllast')
        : satz(
            [zeile('Umsatzsteuer', saldo)],
            [zeile('Schlussbilanzkonto', saldo)],
            'Passivierung der Zahllast',
          );
  } else {
    zweiter = satz(
      [zeile('Schlussbilanzkonto', saldo)],
      [zeile('Vorsteuer', saldo)],
      'Aktivierung des Überhangs',
    );
  }
  return { fall, verrechnung, saldo, buchung: loesung([verrechnungsSatz, zweiter], true) };
}

const FALL_TEXT: Record<UstFall, string> = {
  zahllast: 'Zahllast',
  ueberhang: 'Vorsteuerüberhang',
};

function parts(_p: UstAbschlussParams, s: UstAbschlussSolution): TaskPart[] {
  return [
    {
      typ: 'rechenkette',
      id: 'ermittlung',
      titel: 'Zahllast oder Vorsteuerüberhang?',
      felder: [
        {
          typ: 'auswahl',
          id: 'fall',
          label: 'Ergebnis',
          optionen: ['Zahllast', 'Vorsteuerüberhang'],
          soll: FALL_TEXT[s.fall],
        },
        feld('saldo', 'Betrag', s.saldo),
      ],
    },
    { typ: 'buchungssatz', id: 'buchung', titel: 'Abschlussbuchungen', loesung: s.buchung },
  ];
}

function variants(p: UstAbschlussParams): ErrorVariant[] {
  const s = solveUstAbschluss(p);
  const out: ErrorVariant[] = [];
  const mk = (fehlertyp: string, b: BuchungsLoesung, fall = s.fall) =>
    out.push({ fehlertyp, parts: parts(p, { ...s, fall, buchung: b }) });
  const [v, z] = s.buchung.saetze;
  if (!v || !z) return out;
  mk(
    'richtung-vertauscht',
    loesung(
      [satz([zeile('Vorsteuer', s.verrechnung)], [zeile('Umsatzsteuer', s.verrechnung)]), z],
      true,
    ),
  );
  if (s.fall === 'zahllast') {
    mk(
      'zahllast-aktiviert',
      loesung(
        [v, satz([zeile('Schlussbilanzkonto', s.saldo)], [zeile('Umsatzsteuer', s.saldo)])],
        true,
      ),
    );
  } else {
    mk(
      'ueberhang-passiviert',
      loesung(
        [v, satz([zeile('Vorsteuer', s.saldo)], [zeile('Schlussbilanzkonto', s.saldo)])],
        true,
      ),
    );
  }
  return out;
}

export const ustAbschluss = defineGenerator<UstAbschlussParams, UstAbschlussSolution>({
  skillId: 'B3-ust-abschluss',
  titel: 'Umsatzsteuer-Abschluss',
  variants: ['zahllast', 'ueberhang', 'voranmeldung'],
  points: 4,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const fallWunsch: UstFall | undefined =
      opts.variant === 'zahllast' || opts.variant === 'voranmeldung'
        ? 'zahllast'
        : opts.variant === 'ueberhang'
          ? 'ueberhang'
          : undefined;
    const anlass =
      opts.variant === 'voranmeldung' || (!opts.variant && rng.chance(0.25))
        ? 'voranmeldung'
        : 'jahresabschluss';
    const fall: UstFall =
      anlass === 'voranmeldung'
        ? 'zahllast'
        : (fallWunsch ?? (rng.chance(0.6) ? 'zahllast' : 'ueberhang'));
    return retry(
      rng,
      (r) => {
        const a = betrag(r, 5_000, 500_000, 100, krumm);
        const b = betrag(r, 5_000, 500_000, 100, krumm);
        const [gross, klein] = dec(a).gte(b) ? [a, b] : [b, a];
        return {
          vorsteuer: fall === 'zahllast' ? klein : gross,
          umsatzsteuer: fall === 'zahllast' ? gross : klein,
          anlass,
          monat: anlass === 'voranmeldung' ? r.pick(['Januar', 'Februar', 'März']) : 'Dezember',
        } satisfies UstAbschlussParams;
      },
      (p) => p.vorsteuer !== p.umsatzsteuer,
    );
  },
  render: (p) => ({
    titel: 'Umsatzsteuer-Abschluss',
    kontext:
      p.anlass === 'voranmeldung'
        ? `${p.monat}: Umsatzsteuer-Voranmeldung`
        : '31. Dezember: Jahresabschluss',
    sachverhalt: [
      p.anlass === 'voranmeldung'
        ? `Für den Voranmeldungszeitraum ${p.monat} zeigen die Konten der MBG folgende Summen:`
        : 'Zum Bilanzstichtag 31.12. zeigen die Steuerkonten der MBG folgende Summen:',
      `Vorsteuer: ${eur(p.vorsteuer)} · Umsatzsteuer: ${eur(p.umsatzsteuer)}`,
    ],
    aufgabe:
      p.anlass === 'voranmeldung'
        ? 'Ermittle die Zahllast und bilde die Buchungen für die Verrechnung und die Überweisung per Bank.'
        : 'Ermittle, ob eine Zahllast oder ein Vorsteuerüberhang vorliegt, und bilde die Abschlussbuchungen.',
  }),
  solve: solveUstAbschluss,
  parts,
  steps: (p, s) => [
    {
      titel: 'Vergleich',
      rechnung:
        s.fall === 'zahllast'
          ? `Umsatzsteuer ${eur(p.umsatzsteuer)} > Vorsteuer ${eur(p.vorsteuer)} → Zahllast ${eur(s.saldo)}`
          : `Vorsteuer ${eur(p.vorsteuer)} > Umsatzsteuer ${eur(p.umsatzsteuer)} → Vorsteuerüberhang ${eur(s.saldo)}`,
    },
    {
      titel: 'Verrechnung',
      rechnung: `Umsatzsteuer an Vorsteuer ${eur(s.verrechnung)}`,
      erlaeuterung: 'Das kleinere Konto wird über das größere abgeschlossen.',
    },
    {
      titel:
        s.fall === 'zahllast'
          ? p.anlass === 'voranmeldung'
            ? 'Überweisung'
            : 'Passivierung'
          : 'Aktivierung',
      rechnung:
        s.fall === 'zahllast'
          ? `Umsatzsteuer an ${p.anlass === 'voranmeldung' ? 'Bank' : 'SBK'} ${eur(s.saldo)}`
          : `SBK an Vorsteuer ${eur(s.saldo)}`,
      erlaeuterung:
        s.fall === 'zahllast'
          ? 'Die Zahllast ist eine Schuld gegenüber dem Finanzamt.'
          : 'Der Überhang ist ein Erstattungsanspruch und wird als sonstige Forderung ausgewiesen.',
    },
  ],
  hints: (p, s) => [
    'Vergleiche die Summen beider Steuerkonten: Ist die Umsatzsteuer höher, entsteht eine Zahllast, sonst ein Vorsteuerüberhang.',
    `Erste Buchung: Umsatzsteuer an Vorsteuer mit dem kleineren Betrag (${eur(s.verrechnung)}).`,
    s.fall === 'zahllast'
      ? `Zweite Buchung: Umsatzsteuer an ${p.anlass === 'voranmeldung' ? 'Bank' : 'Schlussbilanzkonto'} ${eur(s.saldo)}.`
      : `Zweite Buchung: Schlussbilanzkonto an Vorsteuer ${eur(s.saldo)}.`,
  ],
  errorVariants: variants,
  verfahren: () => 'Umsatzsteuer-Abschluss: Zahllast oder Vorsteuerüberhang',
});
