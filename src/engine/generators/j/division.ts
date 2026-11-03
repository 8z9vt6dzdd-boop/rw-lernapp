// J2 – Divisionskalkulation: einstufig, zweistufig, mehrstufig (K2 Kap. 2.2.2).
// Einstufig: Gesamtkosten ÷ Menge. Zweistufig: Herstellkosten ÷ produzierte Menge + Verwaltungs- und
// Vertriebskosten ÷ abgesetzte Menge. Mehrstufig: Stückherstellkosten je Stufe kumulieren (ein Stück der
// Vorstufe je Leistungseinheit), Lagerbestandsveränderungen mit den Stückherstellkosten der Stufe bewerten.
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, TaskPart } from '../../task';
import { betrag, defineGenerator, eur, isExact, isKrumm, plain, retry } from '../base';
import { Werte, felderAus } from './werte';

export type DivisionVariante = 'einstufig' | 'zweistufig' | 'mehrstufig';

export interface DivStufe {
  name: string;
  /** Kosten der Stufe in der Periode (bei Stufe 1 einschließlich Rohstoffeinsatz) */
  kosten: string;
  /** Bearbeitungsmenge der Stufe */
  menge: number;
}

export interface DivisionParams {
  variante: DivisionVariante;
  monat: string;
  produkt: string;
  einheit: 'Kartons' | 'hl';
  // einstufig
  kostenarten?: { name: string; betrag: string }[];
  menge?: number;
  // zweistufig
  herstellkosten?: string;
  /** gesetzt: Gesamtkosten einschließlich Verwaltung/Vertrieb, Herstellkosten = Gesamt − VV */
  gesamtkosten?: string;
  produziert?: number;
  /** gesetzt: Absatzmenge muss aus Lageranfangs- und -endbestand abgeleitet werden */
  lagerAnfang?: number;
  lagerEnde?: number;
  // zweistufig und mehrstufig
  vvKosten?: string;
  abgesetzt?: number;
  // mehrstufig
  stufen?: DivStufe[];
}

export interface DivisionSolution {
  werte: Werte;
}

interface Weg {
  /** Herstellkosten ÷ Absatz und VV ÷ Produktion */
  mengenVertauscht?: boolean;
  /** Alles ÷ produzierte Menge, obwohl sich der Lagerbestand verändert hat */
  einstufigTrotzLager?: boolean;
  /** VV nicht aus den Gesamtkosten herausgerechnet */
  hkInklVv?: boolean;
  /** Stückkosten der Vorstufe nicht übernommen */
  nichtKumuliert?: boolean;
  /** Summe aller Stufenkosten ÷ Menge der letzten Stufe */
  durchEndmenge?: boolean;
  /** Fertiglager mit Selbstkosten statt Herstellkosten bewertet */
  bestandZuSk?: boolean;
}

const BV_LABEL = '(Mehrung +, Minderung −)';

export function solveDivision(p: DivisionParams, w: Weg = {}): DivisionSolution {
  const werte = new Werte();
  const e = p.einheit === 'hl' ? '€/hl' : '€/Karton';
  if (p.variante === 'einstufig') {
    const gesamt = werte.put(
      'gesamt',
      'Gesamtkosten der Periode',
      p.kostenarten!.reduce((a, k) => a.plus(k.betrag), new Val(0)),
    );
    werte.put('ks', 'Selbstkosten je Einheit', gesamt.div(p.menge!).round(), 'satz', e);
    return { werte };
  }
  if (p.variante === 'zweistufig') {
    const P = p.produziert!;
    let A = p.abgesetzt!;
    if (p.lagerAnfang !== undefined) {
      A = p.lagerAnfang + P - p.lagerEnde!;
      werte.put('absatz', 'Abgesetzte Menge', new Val(A), 'menge', p.einheit);
    }
    const vv = new Val(p.vvKosten!);
    let hk: Val;
    if (p.gesamtkosten !== undefined) {
      hk = werte.put(
        'hk',
        'Herstellkosten der Periode',
        w.hkInklVv ? new Val(p.gesamtkosten) : new Val(p.gesamtkosten).minus(vv),
      );
    } else hk = new Val(p.herstellkosten!);
    const khs = werte.put(
      'khs',
      'Herstellkosten je Einheit',
      hk.div(w.mengenVertauscht ? A : P).round(),
      'satz',
      e,
    );
    const vvs = werte.put(
      'vvs',
      'Verwaltungs- und Vertriebskosten je Einheit',
      vv.div(w.mengenVertauscht ? P : A).round(),
      'satz',
      e,
    );
    werte.put(
      'ks',
      'Selbstkosten je Einheit',
      w.einstufigTrotzLager ? hk.plus(vv).div(P).round() : khs.plus(vvs),
      'satz',
      e,
    );
    werte.put('bv', `Wert der Bestandsveränderung ${BV_LABEL}`, khs.times(P - A).round());
    return { werte };
  }
  // mehrstufig
  const stufen = p.stufen!;
  const n = stufen.length;
  const kh: Val[] = [];
  let summeK = new Val(0);
  stufen.forEach((st, j) => {
    summeK = summeK.plus(st.kosten);
    const satz = new Val(st.kosten).div(st.menge).round();
    let wert: Val;
    if (j === 0 || w.nichtKumuliert) wert = satz;
    else if (w.durchEndmenge && j === n - 1) wert = summeK.div(st.menge).round();
    else wert = kh[j - 1]!.plus(satz);
    kh.push(wert);
    werte.put(`kh-${j}`, `Stückherstellkosten nach Stufe ${j + 1}`, wert, 'satz', '€/hl');
  });
  const vvs = werte.put(
    'vvs',
    'Verwaltungs- und Vertriebskosten je hl',
    new Val(p.vvKosten!).div(p.abgesetzt!).round(),
    'satz',
    '€/hl',
  );
  const ks = werte.put('ks', 'Selbstkosten je hl', kh[n - 1]!.plus(vvs), 'satz', '€/hl');
  let bv = new Val(0);
  stufen.forEach((st, j) => {
    const naechste = j < n - 1 ? stufen[j + 1]!.menge : p.abgesetzt!;
    const bewertung = j === n - 1 && w.bestandZuSk ? ks : kh[j]!;
    const v = bewertung.times(st.menge - naechste).round();
    bv = bv.plus(v);
    werte.put(
      `bv-${j}`,
      j < n - 1
        ? `Bestandsveränderung Zwischenlager nach Stufe ${j + 1} ${BV_LABEL}`
        : `Bestandsveränderung Fertiglager ${BV_LABEL}`,
      v,
    );
  });
  werte.put('bv', `Bestandsveränderungen insgesamt ${BV_LABEL}`, bv);
  return { werte };
}

const IDS: Record<DivisionVariante, (p: DivisionParams) => string[]> = {
  einstufig: () => ['gesamt', 'ks'],
  zweistufig: () => ['absatz', 'hk', 'khs', 'vvs', 'ks', 'bv'],
  mehrstufig: (p) => [
    ...p.stufen!.map((_, j) => `kh-${j}`),
    'vvs',
    'ks',
    ...p.stufen!.map((_, j) => `bv-${j}`),
    'bv',
  ],
};

function parts(p: DivisionParams, s: DivisionSolution): TaskPart[] {
  return [
    {
      typ: 'rechenkette',
      id: 'division',
      titel:
        p.variante === 'einstufig'
          ? 'Einstufige Divisionskalkulation'
          : p.variante === 'zweistufig'
            ? 'Zweistufige Divisionskalkulation'
            : 'Mehrstufige Divisionskalkulation',
      felder: felderAus(s.werte, IDS[p.variante](p)),
    },
  ];
}

const MONATE = ['Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September'];
const KOSTENARTEN = [
  'Rohstoffe (Sirup, Aromen, Zucker)',
  'Dosen, Deckel und Kartons',
  'Löhne und Gehälter',
  'Energie',
  'Abschreibungen',
  'Verwaltung und Vertrieb',
];
const STUFEN_NAMEN = {
  2: ['Sirupansatz (Fertigung I)', 'Abfüllung (Fertigung II)'],
  3: ['Sirupansatz (Fertigung I)', 'Ausmischen und Karbonisieren', 'Abfüllung (Fertigung II)'],
};

const nice = (r: Rng, min: number, max: number, step: number) =>
  dec(r.step(Math.round(min * 100), Math.round(max * 100), Math.round(step * 100))).div(100);

function generate(rng: Rng, variante: DivisionVariante, krumm: boolean): DivisionParams {
  const monat = rng.pick(MONATE);
  if (variante === 'einstufig') {
    return retry(
      rng,
      (r) => {
        const menge = r.step(20_000, 120_000, 1_000);
        const gesamt = krumm
          ? dec(betrag(r, 60_000, 600_000, 1, true))
          : nice(r, 2.5, 7.5, 0.05).times(menge);
        const namen = r.shuffle(KOSTENARTEN).slice(0, r.int(3, 4));
        const kostenarten: { name: string; betrag: string }[] = [];
        let rest = gesamt;
        namen.forEach((name, i) => {
          if (i === namen.length - 1) {
            kostenarten.push({ name, betrag: rest.toFixed(2) });
            return;
          }
          const anteil = gesamt.times(r.int(15, 35)).div(10_000).toDecimalPlaces(0).times(100);
          const b = krumm ? anteil.plus(r.int(1, 99)).plus(dec(r.int(1, 99)).div(100)) : anteil;
          kostenarten.push({ name, betrag: b.toFixed(2) });
          rest = rest.minus(b);
        });
        return {
          variante,
          monat,
          produkt: 'Paderquell Energy 0,5 l',
          einheit: 'Kartons',
          kostenarten,
          menge,
        } satisfies DivisionParams;
      },
      (p) => p.kostenarten!.every((k) => dec(k.betrag).gt(1_000)),
    );
  }
  if (variante === 'zweistufig') {
    const P = rng.step(8_000, 60_000, 500);
    const delta = rng.step(500, Math.min(6_000, P / 4), 500) * (rng.chance(0.5) ? 1 : -1);
    const A = P - delta;
    const khs = nice(rng, 3, 12, 0.05);
    const vvs = nice(rng, 0.5, 3, 0.05);
    const hk = krumm ? dec(betrag(rng, 30_000, 600_000, 1, true)) : khs.times(P);
    const p: DivisionParams = {
      variante,
      monat,
      produkt: rng.pick(['Paderquell Energy 0,33 l', 'Senne Lemon 0,33 l']),
      einheit: 'Kartons',
      produziert: P,
      abgesetzt: A,
      vvKosten: vvs.times(A).toFixed(2),
    };
    if (rng.chance(0.4)) p.gesamtkosten = hk.plus(p.vvKosten!).toFixed(2);
    else p.herstellkosten = hk.toFixed(2);
    if (rng.chance(0.5)) {
      const ab = rng.step(1_000, 8_000, 500) + Math.max(0, -delta);
      p.lagerAnfang = ab;
      p.lagerEnde = ab + delta;
    }
    return p;
  }
  return retry(
    rng,
    (r) => {
      const n = r.chance(0.4) ? 3 : 2;
      const stufen: DivStufe[] = STUFEN_NAMEN[n].map((name, j) => {
        const menge = r.step(3_000, 9_000, 100);
        const satz = j === 0 ? nice(r, 6, 20, 0.1) : nice(r, 2, 9, 0.1);
        return { name, menge, kosten: satz.times(menge).toFixed(2) };
      });
      if (krumm) {
        const j = r.int(1, n - 1);
        stufen[j]!.kosten = betrag(r, 8_000, 60_000, 1, true);
      }
      const abgesetzt = r.step(3_000, 9_000, 100);
      return {
        variante,
        monat,
        produkt: 'Senne Lemon',
        einheit: 'hl',
        stufen,
        abgesetzt,
        vvKosten: nice(r, 1, 5, 0.05).times(abgesetzt).toFixed(2),
      } satisfies DivisionParams;
    },
    (p) => {
      // Mindestens ein Lager verändert sich, die Mengen sind nicht alle gleich.
      const m = [...p.stufen!.map((s) => s.menge), p.abgesetzt!];
      return new Set(m).size === m.length;
    },
  );
}

export const division = defineGenerator<DivisionParams, DivisionSolution>({
  skillId: 'J2-division',
  titel: 'Divisionskalkulation',
  variants: ['einstufig', 'zweistufig', 'mehrstufig'],
  points: 6,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as DivisionVariante | undefined) ??
      rng.pick<DivisionVariante>(['einstufig', 'zweistufig', 'zweistufig', 'mehrstufig']);
    return generate(rng, variante, krumm);
  },
  render: (p) => {
    if (p.variante === 'einstufig') {
      return {
        titel: 'Einstufige Divisionskalkulation',
        kontext: 'Kalkulation einer Abfülllinie',
        sachverhalt: [
          `Auf Linie 2 im Werk Paderborn läuft im ${p.monat} ausschließlich ${p.produkt}. Es wurden ${plain(p.menge!)} Kartons hergestellt und im selben Monat vollständig verkauft; Lagerbestände entstehen nicht.`,
          'Für die Linie sind im Monat folgende Kosten angefallen:',
        ],
        daten: {
          spalten: ['Kostenart', 'Betrag'],
          zeilen: p.kostenarten!.map((k) => [k.name, eur(k.betrag)]),
        },
        aufgabe: 'Ermittle die Gesamtkosten und die Selbstkosten je Karton.',
      };
    }
    if (p.variante === 'zweistufig') {
      const zeilen: string[][] = [['Produktionsmenge', `${plain(p.produziert!)} Kartons`]];
      if (p.lagerAnfang !== undefined)
        zeilen.push(
          ['Lagerbestand am Monatsanfang', `${plain(p.lagerAnfang)} Kartons`],
          ['Lagerbestand am Monatsende', `${plain(p.lagerEnde!)} Kartons`],
        );
      else zeilen.push(['Absatzmenge', `${plain(p.abgesetzt!)} Kartons`]);
      if (p.gesamtkosten !== undefined)
        zeilen.push(
          ['Gesamtkosten der Periode', eur(p.gesamtkosten)],
          ['davon Verwaltungs- und Vertriebskosten', eur(p.vvKosten!)],
        );
      else
        zeilen.push(
          ['Herstellkosten der Periode', eur(p.herstellkosten!)],
          ['Verwaltungs- und Vertriebskosten', eur(p.vvKosten!)],
        );
      return {
        titel: 'Zweistufige Divisionskalkulation',
        kontext: 'Kalkulation einer Abfülllinie',
        sachverhalt: [
          `Linie 3 füllt im ${p.monat} nur ${p.produkt} ab. Produktion und Absatz laufen nicht gleich: Ein Teil geht ins Logistikzentrum oder wird von dort verkauft.`,
        ],
        daten: { spalten: ['Angabe', 'Wert'], zeilen },
        aufgabe:
          'Ermittle die Herstellkosten, die Verwaltungs- und Vertriebskosten sowie die Selbstkosten je Karton und bewerte die Bestandsveränderung des Monats.',
      };
    }
    const n = p.stufen!.length;
    return {
      titel: 'Mehrstufige Divisionskalkulation',
      kontext: 'Kalkulation über mehrere Fertigungsstufen',
      sachverhalt: [
        `${p.produkt} entsteht im ${p.monat} in ${n} Fertigungsstufen. Zwischen den Stufen liegen Lagertanks, am Ende steht das Fertiglager im Logistikzentrum. Alle Mengen sind in Hektolitern (hl) Getränk angegeben; jede Stufe verarbeitet je hl genau 1 hl der Vorstufe. Die Anfangsbestände reichen für jede Entnahme aus.`,
        `Die Verwaltungs- und Vertriebskosten betragen ${eur(p.vvKosten!)}; abgesetzt wurden ${plain(p.abgesetzt!)} hl.`,
      ],
      daten: {
        spalten: ['Stufe', 'Kosten der Stufe', 'Bearbeitungsmenge'],
        zeilen: p.stufen!.map((s, j) => [
          `${j + 1}. ${s.name}`,
          eur(s.kosten),
          `${plain(s.menge)} hl`,
        ]),
      },
      aufgabe:
        'Ermittle die Stückherstellkosten je Stufe, die Selbstkosten je hl und den Wert der Lagerbestandsveränderungen. Runde jeden Zwischenwert auf Cent.',
    };
  },
  solve: (p) => solveDivision(p),
  parts,
  steps: (p, s) => {
    const v = (id: string) => s.werte.get(id);
    if (p.variante === 'einstufig') {
      return [
        {
          titel: 'Gesamtkosten',
          rechnung: `${p.kostenarten!.map((k) => eur(k.betrag)).join(' + ')} = ${eur(v('gesamt'))}`,
        },
        {
          titel: 'Selbstkosten je Karton',
          rechnung: `${eur(v('gesamt'))} ÷ ${plain(p.menge!)} = ${eur(v('ks'))}`,
          erlaeuterung: 'Produktion = Absatz, deshalb reicht eine einzige Division.',
        },
      ];
    }
    if (p.variante === 'zweistufig') {
      const out = [];
      const A = s.werte.has('absatz') ? v('absatz').exact.toNumber() : p.abgesetzt!;
      if (p.lagerAnfang !== undefined)
        out.push({
          titel: 'Abgesetzte Menge',
          rechnung: `${plain(p.lagerAnfang)} + ${plain(p.produziert!)} − ${plain(p.lagerEnde!)} = ${plain(A)} Kartons`,
          erlaeuterung: 'Anfangsbestand + Produktion − Endbestand.',
        });
      const hk = p.gesamtkosten !== undefined ? v('hk') : new Val(p.herstellkosten!);
      if (p.gesamtkosten !== undefined)
        out.push({
          titel: 'Herstellkosten',
          rechnung: `${eur(p.gesamtkosten)} − ${eur(p.vvKosten!)} = ${eur(hk)}`,
        });
      out.push(
        {
          titel: 'Herstellkosten je Karton',
          rechnung: `${eur(hk)} ÷ ${plain(p.produziert!)} = ${eur(v('khs'))}`,
          erlaeuterung: 'Herstellkosten entstehen für die gesamte Produktion.',
        },
        {
          titel: 'Verwaltungs- und Vertriebskosten je Karton',
          rechnung: `${eur(p.vvKosten!)} ÷ ${plain(A)} = ${eur(v('vvs'))}`,
          erlaeuterung: 'Diese Kosten fallen erst mit dem Verkauf an.',
        },
        {
          titel: 'Selbstkosten je Karton',
          rechnung: `${eur(v('khs'))} + ${eur(v('vvs'))} = ${eur(v('ks'))}`,
        },
        {
          titel: 'Bestandsveränderung',
          rechnung: `(${plain(p.produziert!)} − ${plain(A)}) × ${eur(v('khs'))} = ${eur(v('bv'))}`,
          erlaeuterung: 'Lagerbestände werden zu Herstellkosten bewertet.',
        },
      );
      return out;
    }
    const stufen = p.stufen!;
    const out = stufen.map((st, j) => ({
      titel: `Stufe ${j + 1}: ${st.name}`,
      rechnung:
        j === 0
          ? `${eur(st.kosten)} ÷ ${plain(st.menge)} hl = ${eur(v('kh-0'))}`
          : `${eur(v(`kh-${j - 1}`))} + ${eur(st.kosten)} ÷ ${plain(st.menge)} hl = ${eur(v(`kh-${j}`))}`,
      erlaeuterung:
        j === 0
          ? 'Erste Stufe: Kosten ÷ Bearbeitungsmenge.'
          : 'Stückkosten der Vorstufe + Kostensatz dieser Stufe.',
    }));
    out.push({
      titel: 'Selbstkosten je hl',
      rechnung: `${eur(v(`kh-${stufen.length - 1}`))} + ${eur(p.vvKosten!)} ÷ ${plain(p.abgesetzt!)} hl = ${eur(v('ks'))}`,
      erlaeuterung: 'Verwaltung und Vertrieb werden auf die abgesetzte Menge verteilt.',
    });
    out.push({
      titel: 'Bestandsveränderungen',
      rechnung: stufen
        .map((st, j) => {
          const naechste = j < stufen.length - 1 ? stufen[j + 1]!.menge : p.abgesetzt!;
          return `(${plain(st.menge)} − ${plain(naechste)}) × ${eur(v(`kh-${j}`))} = ${eur(v(`bv-${j}`))}`;
        })
        .join('; '),
      erlaeuterung: `Summe ${eur(v('bv'))}. Probe: Selbstkosten des Absatzes + Bestandsveränderungen ≈ alle Kosten der Periode.`,
    });
    return out;
  },
  hints: (p, s) => {
    if (p.variante === 'einstufig')
      return [
        'Einstufige Divisionskalkulation: alle Kosten der Periode ÷ hergestellte Menge.',
        `Zähle zuerst alle Kostenarten zusammen: ${eur(s.werte.get('gesamt'))}.`,
        `Teile durch ${plain(p.menge!)} Kartons.`,
      ];
    if (p.variante === 'zweistufig')
      return [
        'Zweistufig: Herstellkosten ÷ produzierte Menge + Verwaltungs- und Vertriebskosten ÷ abgesetzte Menge.',
        p.lagerAnfang !== undefined
          ? 'Abgesetzte Menge = Anfangsbestand + Produktion − Endbestand.'
          : p.gesamtkosten !== undefined
            ? 'Ziehe die Verwaltungs- und Vertriebskosten von den Gesamtkosten ab, dann bleiben die Herstellkosten.'
            : `Herstellkosten je Karton: ${eur(p.herstellkosten!)} ÷ ${plain(p.produziert!)}.`,
        'Die Bestandsveränderung (produziert − abgesetzt) wird mit den Herstellkosten je Karton bewertet.',
      ];
    return [
      'Mehrstufig: Jede Stufe übernimmt die Stückherstellkosten der Vorstufe und addiert ihren eigenen Kostensatz.',
      `Stufe 1: ${eur(p.stufen![0]!.kosten)} ÷ ${plain(p.stufen![0]!.menge)} hl = ${eur(s.werte.get('kh-0'))}.`,
      'Lager zwischen zwei Stufen: Menge der Stufe − Menge der nächsten Stufe, bewertet mit den Stückherstellkosten der Stufe davor.',
    ];
  },
  errorVariants: (p) => {
    const out: ErrorVariant[] = [];
    const add = (fehlertyp: string, w: Weg) =>
      out.push({ fehlertyp, parts: parts(p, solveDivision(p, w)) });
    if (p.variante === 'zweistufig') {
      add('division-mengen-vertauscht', { mengenVertauscht: true });
      add('division-einstufig-trotz-lager', { einstufigTrotzLager: true });
      if (p.gesamtkosten !== undefined) add('hk-inkl-vv', { hkInklVv: true });
    }
    if (p.variante === 'mehrstufig') {
      add('stufen-nicht-kumuliert', { nichtKumuliert: true });
      add('stufenkosten-durch-endmenge', { durchEndmenge: true });
      add('bestand-zu-selbstkosten', { bestandZuSk: true });
    }
    return out;
  },
  verfahren: (p) =>
    p.variante === 'einstufig'
      ? 'Einstufige Divisionskalkulation (ein Produkt, keine Lagerveränderung)'
      : p.variante === 'zweistufig'
        ? 'Zweistufige Divisionskalkulation (Lagerveränderung bei Fertigerzeugnissen)'
        : 'Mehrstufige Divisionskalkulation (Zwischenlager zwischen Fertigungsstufen)',
});

/** Für Tests: klausurfreundliche Fälle gehen auf den Cent auf. */
export function divisionGlatt(p: DivisionParams): boolean {
  return solveDivision(p).werte.liste.every((w) => isExact(w.wert.exact));
}
