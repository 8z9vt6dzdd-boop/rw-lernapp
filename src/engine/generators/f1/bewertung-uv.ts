// F5 – Bewertung des Umlaufvermögens (BA 5.3.5.1): Endbestand gleichartiger Vorräte mit
// gewogenem Durchschnitt, Fifo oder Lifo bewerten, dann strenges Niederstwertprinzip anwenden.
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val, dec } from '../../money';
import type { ErrorVariant, Feld, SolutionStep, TaskPart } from '../../task';
import type { Rng } from '../../rng';
import { defineGenerator, eur, feld, isExact, isKrumm, plain, retry } from '../base';

export type VorratVerfahren = 'durchschnitt' | 'fifo' | 'lifo';
export type VorratArt = 'konzentrat' | 'etiketten' | 'wein';

export interface Lieferung {
  menge: number;
  preis: string;
}

export interface VorratParams {
  verfahren: VorratVerfahren;
  art: VorratArt;
  /** Anfangsbestand, danach Zugänge in zeitlicher Reihenfolge */
  ab: Lieferung;
  zugaenge: Lieferung[];
  /** Endbestand laut Inventur (Menge) */
  endbestand: number;
  /** Wiederbeschaffungspreis (Tageswert) je Einheit am Bilanzstichtag */
  tagespreis: string;
}

export interface Schicht {
  menge: number;
  preis: string;
  wert: Val;
}

export interface VorratSolution {
  durchschnitt?: Val;
  schichten: Schicht[];
  ak: Val;
  tageswert: Val;
  wahl: 'Anschaffungskosten' | 'Tageswert';
  ansatz: Val;
  abwertung: Val;
  buchung: BuchungsLoesung;
}

interface ArtInfo {
  name: string;
  konto: 'Rohstoffe' | 'Hilfsstoffe' | 'Handelswaren';
  einheit: string;
  lieferanten: 'rohstoffe' | 'hilfsstoffe' | 'handelswaren';
  menge: [number, number, number];
  preis: [number, number];
}

export const ARTEN: Record<VorratArt, ArtInfo> = {
  konzentrat: {
    name: 'Aromakonzentrat',
    konto: 'Rohstoffe',
    einheit: 'kg',
    lieferanten: 'rohstoffe',
    menge: [500, 3_000, 100],
    preis: [300, 800],
  },
  etiketten: {
    name: 'Etiketten für Senne Lemon',
    konto: 'Hilfsstoffe',
    einheit: 'Rollen',
    lieferanten: 'hilfsstoffe',
    menge: [40, 300, 10],
    preis: [2_000, 6_000],
  },
  wein: {
    name: 'Liboriwein',
    konto: 'Handelswaren',
    einheit: 'Flaschen',
    lieferanten: 'handelswaren',
    menge: [200, 2_400, 100],
    preis: [300, 900],
  },
};

const MONATE = ['März', 'Juli', 'Oktober'];
const WAHL = ['Anschaffungskosten', 'Tageswert'];
const SBK = 'Schlussbilanzkonto';

interface Rechenweg {
  /** Endbestand nach der jeweils anderen Verbrauchsfolge (Fifo ↔ Lifo) */
  vertauscht?: boolean;
  /** einfacher statt gewogener Durchschnitt der Einkaufspreise */
  ungewichtet?: boolean;
  /** Anschaffungskosten trotz niedrigerem Tageswert */
  akBehalten?: boolean;
  /** höheren Tageswert angesetzt */
  hoehererWert?: boolean;
}

function alle(p: VorratParams): Lieferung[] {
  return [p.ab, ...p.zugaenge];
}

function gesamtmenge(p: VorratParams): number {
  return alle(p).reduce((a, l) => a + l.menge, 0);
}

function gesamtwert(p: VorratParams): Val {
  return alle(p).reduce((a, l) => a.plus(new Val(l.preis).times(l.menge)), new Val(0));
}

/** Schichten des Endbestands: Fifo aus den letzten Zugängen, Lifo aus Anfangsbestand und ersten Zugängen. */
export function schichtenEndbestand(
  posten: readonly Lieferung[],
  menge: number,
  verfahren: 'fifo' | 'lifo',
): Schicht[] {
  const reihe = verfahren === 'fifo' ? [...posten].reverse() : [...posten];
  const out: Schicht[] = [];
  let rest = menge;
  for (const l of reihe) {
    if (rest <= 0) break;
    const m = Math.min(rest, l.menge);
    out.push({ menge: m, preis: l.preis, wert: new Val(l.preis).times(m) });
    rest -= m;
  }
  if (rest > 0) throw new Error('Endbestand größer als verfügbare Menge');
  return out;
}

export function solveVorrat(p: VorratParams, w: Rechenweg = {}): VorratSolution {
  const posten = alle(p);
  let durchschnitt: Val | undefined;
  let schichten: Schicht[];
  let ak: Val;
  if (p.verfahren === 'durchschnitt') {
    const menge = gesamtmenge(p);
    const wert = gesamtwert(p);
    durchschnitt = w.ungewichtet
      ? posten
          .reduce((a, l) => a.plus(l.preis), new Val(0))
          .div(posten.length)
          .round()
      : wert.div(menge).round();
    ak = durchschnitt.times(p.endbestand).round();
    schichten = [];
  } else {
    const v = w.vertauscht ? (p.verfahren === 'fifo' ? 'lifo' : 'fifo') : p.verfahren;
    schichten = schichtenEndbestand(posten, p.endbestand, v);
    ak = schichten.reduce((a, s) => a.plus(s.wert), new Val(0));
  }
  const tageswert = new Val(p.tagespreis).times(p.endbestand);
  let wahl: VorratSolution['wahl'] = tageswert.cmp(ak) < 0 ? 'Tageswert' : 'Anschaffungskosten';
  if (w.akBehalten) wahl = 'Anschaffungskosten';
  if (w.hoehererWert) wahl = 'Tageswert';
  const ansatz = wahl === 'Tageswert' ? tageswert : ak;
  const abwertung = ansatz.cmp(ak) < 0 ? ak.minus(ansatz) : new Val(0);
  const konto = ARTEN[p.art].konto;
  const buchung = loesung([satz([zeile(SBK, ansatz)], [zeile(konto, ansatz)])]);
  const s: VorratSolution = { schichten, ak, tageswert, wahl, ansatz, abwertung, buchung };
  if (durchschnitt) s.durchschnitt = durchschnitt;
  return s;
}

function je(info: ArtInfo): string {
  return info.einheit === 'kg' ? 'kg' : info.einheit === 'Rollen' ? 'Rolle' : 'Flasche';
}

function parts(p: VorratParams, s: VorratSolution): TaskPart[] {
  const info = ARTEN[p.art];
  const felder: Feld[] = [];
  if (p.verfahren === 'durchschnitt')
    felder.push(
      feld('oe', 'Gewogener Durchschnittspreis', s.durchschnitt!, 'satz', `€/${je(info)}`),
    );
  felder.push(
    feld('ak', 'Anschaffungskosten des Endbestands', s.ak),
    feld('tw', 'Tageswert des Endbestands', s.tageswert),
    { typ: 'auswahl', id: 'wahl', label: 'Anzusetzen ist', optionen: WAHL, soll: s.wahl },
    feld('ansatz', 'Bilanzansatz am 31.12.', s.ansatz),
    feld('abwertung', 'Abschreibung auf den niedrigeren Wert', s.abwertung),
  );
  return [
    { typ: 'rechenkette', id: 'bewertung', titel: 'Bewertung des Endbestands', felder },
    {
      typ: 'buchungssatz',
      id: 'sbk',
      titel: 'Übernahme des Endbestands in das Schlussbilanzkonto',
      loesung: s.buchung,
    },
  ];
}

function variants(p: VorratParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveVorrat(p, w)) });
  if (p.verfahren === 'durchschnitt') add('durchschnitt-ungewichtet', { ungewichtet: true });
  else add('endbestand-fifo-lifo-vertauscht', { vertauscht: true });
  const s = solveVorrat(p);
  if (s.tageswert.cmp(s.ak) < 0) add('niederstwert-missachtet', { akBehalten: true });
  else add('tageswert-ueber-ak', { hoehererWert: true });
  return out;
}

function lieferung(rng: Rng, info: ArtInfo, krumm: boolean): Lieferung {
  const [lo, hi, st] = info.menge;
  const cent = krumm
    ? rng.int(info.preis[0], info.preis[1])
    : rng.step(info.preis[0], info.preis[1], 10);
  return { menge: rng.step(lo, hi, st), preis: dec(cent).div(100).toFixed(2) };
}

function preiseImEndbestand(p: VorratParams, s: VorratSolution): string[] {
  return p.verfahren === 'durchschnitt'
    ? [s.durchschnitt!.value.toFixed(2)]
    : s.schichten.map((x) => x.preis);
}

export const bewertungUv = defineGenerator<VorratParams, VorratSolution>({
  skillId: 'F5-bewertung-uv',
  titel: 'Bewertung der Vorräte',
  variants: ['durchschnitt', 'fifo', 'lifo'],
  points: 5,
  generate: (rng, opts = {}) => {
    const verfahren =
      (opts.variant as VorratVerfahren | undefined) ??
      rng.pick<VorratVerfahren>(['durchschnitt', 'fifo', 'lifo']);
    const krumm = isKrumm(rng, opts.krummAnteil);
    const art = rng.pick<VorratArt>(['konzentrat', 'konzentrat', 'etiketten', 'wein']);
    const info = ARTEN[art];
    return retry(
      rng,
      (r) => {
        const ab = lieferung(r, info, krumm);
        const zugaenge = Array.from({ length: r.pick([2, 3]) }, () => lieferung(r, info, krumm));
        const gesamt = ab.menge + zugaenge.reduce((a, l) => a + l.menge, 0);
        const st = info.menge[2];
        const endbestand = r.step(
          Math.ceil((gesamt * 0.2) / st) * st,
          Math.floor((gesamt * 0.6) / st) * st,
          st,
        );
        const p: VorratParams = { verfahren, art, ab, zugaenge, endbestand, tagespreis: '0' };
        const s = solveVorrat(p);
        const preise = preiseImEndbestand(p, s).map((x) => dec(x));
        const tief = preise.reduce((a, b) => (a.lt(b) ? a : b));
        const hoch = preise.reduce((a, b) => (a.gt(b) ? a : b));
        // Tageswert klar unter allen bzw. über allen Preisen des Endbestands (eindeutiger Vergleich)
        const abstand = dec(r.step(10, 60, 5)).div(100);
        p.tagespreis = (r.chance(0.65) ? tief.minus(abstand) : hoch.plus(abstand)).toFixed(2);
        return p;
      },
      (p) => {
        const s = solveVorrat(p);
        const lehrreich =
          p.verfahren === 'durchschnitt'
            ? krumm || isExact(gesamtwert(p).div(gesamtmenge(p)))
            : s.schichten.length >= 2 &&
              !solveVorrat(p, { vertauscht: true }).ak.value.equals(s.ak.value);
        return lehrreich && dec(p.tagespreis).gt(0) && p.endbestand > 0;
      },
    );
  },
  render: (p, firma) => {
    const info = ARTEN[p.art];
    const lieferant = firma.lieferanten[info.lieferanten][0] ?? 'einem Stammlieferanten';
    return {
      titel: `Inventur: ${info.name} bewerten`,
      kontext: 'Dezember: Inventur und Jahresabschluss',
      sachverhalt: [
        `Für den Jahresabschluss der ${firma.kurz} ist der Endbestand an ${info.name} (Konto ${info.konto}) zu bewerten. Bezogen wurde überwiegend bei ${lieferant}.`,
        `Laut Inventur sind am 31.12. noch ${plain(p.endbestand)} ${info.einheit} vorhanden. Der Wiederbeschaffungspreis (Tageswert) am Bilanzstichtag beträgt ${eur(p.tagespreis)} je ${je(info)}.`,
      ],
      daten: {
        spalten: ['', `Menge (${info.einheit})`, 'Preis je Einheit'],
        zeilen: [
          ['Anfangsbestand 1.1.', plain(p.ab.menge), eur(p.ab.preis)],
          ...p.zugaenge.map((z, i) => [`Zugang ${MONATE[i]}`, plain(z.menge), eur(z.preis)]),
        ],
      },
      aufgabe:
        p.verfahren === 'durchschnitt'
          ? 'Bewerte den Endbestand mit dem gewogenen Durchschnitt (§ 240 Abs. 4 HGB), wende das Niederstwertprinzip an und buche die Übernahme in das Schlussbilanzkonto.'
          : `Bewerte den Endbestand nach dem ${p.verfahren === 'fifo' ? 'Fifo' : 'Lifo'}-Verfahren, wende das Niederstwertprinzip an und buche die Übernahme in das Schlussbilanzkonto.`,
    };
  },
  solve: (p) => solveVorrat(p),
  parts,
  steps: (p, s) => {
    const info = ARTEN[p.art];
    const steps: SolutionStep[] = [];
    if (p.verfahren === 'durchschnitt') {
      const menge = gesamtmenge(p);
      const wert = gesamtwert(p);
      steps.push(
        {
          titel: 'Gewogener Durchschnitt',
          rechnung: `${eur(wert)} ÷ ${plain(menge)} ${info.einheit} = ${plain(s.durchschnitt!.exact, 4)} €`,
          erlaeuterung: 'Gesamtwert aus Anfangsbestand und Zugängen durch die Gesamtmenge.',
        },
        {
          titel: 'Anschaffungskosten des Endbestands',
          rechnung: `${plain(p.endbestand)} × ${eur(s.durchschnitt!)} = ${eur(s.ak)}`,
        },
      );
    } else {
      steps.push({
        titel: `Endbestand nach ${p.verfahren === 'fifo' ? 'Fifo' : 'Lifo'}`,
        rechnung:
          s.schichten
            .map((x) => `${plain(x.menge)} × ${eur(x.preis)} = ${eur(x.wert)}`)
            .join('; ') + ` → ${eur(s.ak)}`,
        erlaeuterung:
          p.verfahren === 'fifo'
            ? 'Fifo: Das zuerst Beschaffte gilt als zuerst verbraucht, der Endbestand stammt aus den letzten Zugängen.'
            : 'Lifo: Das zuletzt Beschaffte gilt als zuerst verbraucht, der Endbestand stammt aus Anfangsbestand und ersten Zugängen.',
      });
    }
    steps.push(
      {
        titel: 'Niederstwertprinzip',
        rechnung: `Tageswert ${plain(p.endbestand)} × ${eur(p.tagespreis)} = ${eur(s.tageswert)}; angesetzt: ${eur(s.ansatz)}`,
        erlaeuterung:
          'Umlaufvermögen: strenges Niederstwertprinzip – der niedrigere Wert zählt, höchstens die Anschaffungskosten.',
      },
      {
        titel: 'Schlussbilanzkonto',
        rechnung: `${SBK} an ${info.konto} ${eur(s.ansatz)}`,
      },
    );
    return steps;
  },
  hints: (p, s) => [
    'Zwei Schritte: erst die Anschaffungskosten des Endbestands mit dem verlangten Verfahren, dann der Niederstwerttest.',
    p.verfahren === 'durchschnitt'
      ? 'Gewogener Durchschnitt = Gesamtwert aller Posten ÷ Gesamtmenge, dann × Endbestand.'
      : p.verfahren === 'fifo'
        ? 'Fifo: Der Endbestand besteht aus den letzten Zugängen – von unten in der Tabelle nach oben auffüllen.'
        : 'Lifo: Der Endbestand besteht aus dem Anfangsbestand und den ersten Zugängen – von oben auffüllen.',
    `Vergleiche ${eur(s.ak)} mit dem Tageswert ${eur(s.tageswert)}; der niedrigere Wert geht in das Schlussbilanzkonto.`,
  ],
  errorVariants: variants,
  verfahren: (p) =>
    `Bewertung der Vorräte (${p.verfahren === 'durchschnitt' ? 'gewogener Durchschnitt' : p.verfahren === 'fifo' ? 'Fifo' : 'Lifo'}) mit Niederstwertprinzip`,
});
