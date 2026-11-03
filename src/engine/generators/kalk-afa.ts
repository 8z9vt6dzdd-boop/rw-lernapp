// H4 – Kalkulatorische Abschreibung: linear, arithmetisch-degressiv, leistungsbezogen, geometrisch-degressiv.
import { Val, dec } from '../money';
import type { ErrorVariant, TaskPart, ZahlFeld } from '../task';
import { betrag, defineGenerator, eur, feld, isKrumm, pct, plain } from './base';

export type AfaVerfahren = 'linear' | 'arithmetisch' | 'leistung' | 'geometrisch';

export interface KalkAfaParams {
  verfahren: AfaVerfahren;
  anlage: string;
  ak: string;
  nebenkosten: string;
  nebenkostenArt: string;
  restwert: string;
  nd: number;
  /** leistungsbezogen: Gesamtleistung und Leistung im 1. Jahr (Betriebsstunden) */
  gesamtLeistung?: number;
  leistungJahr1?: number;
  /**
   * geometrisch-degressiv: Abschreibungssatz als Dezimal-String (Variante „Satz vorgegeben“).
   * Fehlt er, wird der Satz aus Anschaffungswert, Restwert und Nutzungsdauer ermittelt (K1 Kap. 2.4).
   */
  satz?: string;
}

export interface KalkAfaSolution {
  basis: Val;
  linear?: Val;
  summeZiffern?: number;
  degression?: Val;
  jahre?: Val[];
  satzJeEinheit?: Val;
  leistungJahr1?: Val;
  restbuchwert?: Val;
  /** geometrisch-degressiv: Abschreibungssatz als Dezimalzahl */
  geoSatz?: Val;
}

interface Rechenweg {
  ohneNebenkosten?: boolean;
  ohneRestwert?: boolean;
  zifferNd?: boolean;
  zifferUmgekehrt?: boolean;
  /** Fehler: Satz ohne Wurzel, p = (1 − Rn/A) ÷ n */
  ohneWurzel?: boolean;
}

/** p = 1 − ⁿ√(Rn ÷ A); Klausurweg: in Prozent auf 2 Nachkommastellen gerundet. */
export function geometrischerSatz(
  anschaffungswert: Val,
  restwert: string,
  nd: number,
  ohneWurzel = false,
): Val {
  const q = new Val(restwert).div(anschaffungswert).exact;
  const exact = ohneWurzel ? dec(1).minus(q).div(nd) : dec(1).minus(q.pow(dec(1).div(nd)));
  return new Val(exact).round(4);
}

export function solveKalkAfa(p: KalkAfaParams, w: Rechenweg = {}): KalkAfaSolution {
  let basis = new Val(p.ak);
  if (!w.ohneNebenkosten) basis = basis.plus(p.nebenkosten);
  if (!w.ohneRestwert && p.verfahren !== 'geometrisch') basis = basis.minus(p.restwert);
  switch (p.verfahren) {
    case 'linear':
      return { basis, linear: basis.div(p.nd).round() };
    case 'arithmetisch': {
      const summe = (p.nd * (p.nd + 1)) / 2;
      const degression = basis.div(w.zifferNd ? p.nd : summe).round();
      const jahre = [1, 2, 3].map((k) => degression.times(w.zifferUmgekehrt ? k : p.nd - k + 1));
      return { basis, summeZiffern: summe, degression, jahre };
    }
    case 'leistung': {
      const satzJeEinheit = basis.div(p.gesamtLeistung ?? 1).round();
      return {
        basis,
        satzJeEinheit,
        leistungJahr1: satzJeEinheit.times(p.leistungJahr1 ?? 0).round(),
      };
    }
    case 'geometrisch': {
      const s = p.satz ? new Val(p.satz) : geometrischerSatz(basis, p.restwert, p.nd, w.ohneWurzel);
      let rbw = basis;
      const jahre: Val[] = [];
      for (let k = 0; k < 3; k++) {
        const afa = rbw.times(s).round();
        jahre.push(afa);
        rbw = rbw.minus(afa);
      }
      return { basis, jahre, restbuchwert: rbw, geoSatz: s };
    }
  }
}

function parts(p: KalkAfaParams, s: KalkAfaSolution): TaskPart[] {
  const felder: ZahlFeld[] = [feld('basis', 'Abschreibungsbasis', s.basis)];
  switch (p.verfahren) {
    case 'linear':
      felder.push(feld('jahr', 'Jährliche kalkulatorische Abschreibung', s.linear!));
      break;
    case 'arithmetisch':
      felder.push(
        feld('summe', 'Summe der Jahresziffern', s.summeZiffern!, 'menge', ''),
        feld('degression', 'Degressionsbetrag', s.degression!),
        ...s.jahre!.map((j, i) => feld(`j${i + 1}`, `Abschreibung im ${i + 1}. Jahr`, j)),
      );
      break;
    case 'leistung':
      felder.push(
        feld('satz', 'Abschreibung je Betriebsstunde', s.satzJeEinheit!, 'satz', '€/h'),
        feld('jahr', 'Abschreibung im 1. Jahr', s.leistungJahr1!),
      );
      break;
    case 'geometrisch':
      if (!p.satz) felder.push(feld('p', 'Abschreibungssatz p', s.geoSatz!.times(100), 'prozent'));
      felder.push(
        ...s.jahre!.map((j, i) => feld(`j${i + 1}`, `Abschreibung im ${i + 1}. Jahr`, j)),
        feld('rbw', 'Restbuchwert nach dem 3. Jahr', s.restbuchwert!),
      );
      break;
  }
  return [{ typ: 'rechenkette', id: 'afa', titel: 'Kalkulatorische Abschreibung', felder }];
}

function variants(p: KalkAfaParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveKalkAfa(p, w)) });
  if (!dec(p.nebenkosten).isZero()) add('nebenkosten-vergessen', { ohneNebenkosten: true });
  if (p.verfahren !== 'geometrisch' && !dec(p.restwert).isZero())
    add('restwert-vergessen', { ohneRestwert: true });
  if (p.verfahren === 'geometrisch' && !p.satz) add('wurzel-vergessen', { ohneWurzel: true });
  if (p.verfahren === 'arithmetisch') {
    add('jahresziffern-falsch', { zifferNd: true });
    add('jahresziffern-falsch', { zifferUmgekehrt: true });
  }
  return out;
}

const VERFAHREN_TEXT: Record<AfaVerfahren, string> = {
  linear: 'linear',
  arithmetisch: 'arithmetisch-degressiv',
  leistung: 'leistungsbezogen',
  geometrisch: 'geometrisch-degressiv',
};

const ANLAGEN = [
  'Abfüllanlage',
  'Sirupanlage',
  'Etikettiermaschine',
  'Palettieranlage',
  'Gabelstapler-Flotte',
];

export const kalkAfa = defineGenerator<KalkAfaParams, KalkAfaSolution>({
  skillId: 'H4-kalk-afa',
  titel: 'Kalkulatorische Abschreibung',
  variants: ['linear', 'arithmetisch', 'leistung', 'geometrisch'],
  points: 6,
  generate: (rng, opts = {}) => {
    const verfahren =
      (opts.variant as AfaVerfahren | undefined) ??
      rng.pick<AfaVerfahren>([
        'linear',
        'arithmetisch',
        'arithmetisch',
        'leistung',
        'leistung',
        'geometrisch',
      ]);
    const krumm = isKrumm(rng, opts.krummAnteil);
    const nd = rng.pick([4, 5, 6, 8, 10]);
    let basis: string;
    const p: Partial<KalkAfaParams> = { verfahren, nd, anlage: rng.pick(ANLAGEN) };
    switch (verfahren) {
      case 'linear':
        basis = krumm
          ? betrag(rng, 20_000, 400_000, 1, true)
          : String(rng.step(5_000, 60_000, 500) * nd);
        break;
      case 'arithmetisch':
        basis = krumm
          ? betrag(rng, 20_000, 400_000, 1, true)
          : String(rng.step(1_000, 15_000, 500) * ((nd * (nd + 1)) / 2));
        break;
      case 'leistung': {
        const gesamt = rng.step(10_000, 60_000, 1_000);
        p.gesamtLeistung = gesamt;
        p.leistungJahr1 = rng.step(
          Math.floor(gesamt / (nd + 2)),
          Math.floor(gesamt / Math.max(nd - 1, 2)),
          100,
        );
        basis = krumm
          ? betrag(rng, 50_000, 600_000, 100, false)
          : dec(rng.pick(['1.5', '2', '2.5', '3', '4', '5', '6', '8']))
              .times(gesamt)
              .toFixed(2);
        break;
      }
      case 'geometrisch': {
        const satz = rng.pick(['0.15', '0.2', '0.25', '0.3']);
        basis = String(rng.step(40_000, 400_000, 10_000));
        // Variante a: Satz aus Restwert ermitteln; Variante b: Satz vorgegeben
        if (rng.chance(0.5)) p.satz = satz;
        else
          p.restwert = dec(basis).times(dec(1).minus(satz).pow(nd)).toDecimalPlaces(0).toFixed(0);
        break;
      }
    }
    const b = dec(basis);
    const nebenkosten = String(rng.step(500, Math.max(1_000, b.times('0.08').toNumber()), 500));
    const restwert =
      verfahren === 'geometrisch'
        ? (p.restwert ?? '0')
        : String(rng.step(0, Math.max(1_000, b.times('0.1').toNumber()), 1_000));
    p.nebenkosten = nebenkosten;
    p.nebenkostenArt = rng.pick([
      'Montagekosten',
      'Transport- und Montagekosten',
      'Fundamentarbeiten',
    ]);
    p.restwert = restwert;
    // Abschreibungsbasis: geometrisch = Anschaffungswert (Restwert wird nicht abgezogen)
    p.ak = (
      verfahren === 'geometrisch' ? b.minus(nebenkosten) : b.minus(nebenkosten).plus(restwert)
    ).toFixed(2);
    return p as KalkAfaParams;
  },
  render: (p) => {
    const sachverhalt = [
      `Das Controlling der MBG ermittelt die kalkulatorische Abschreibung für eine neue ${p.anlage}.`,
      `Anschaffungspreis ${eur(p.ak)}, zusätzlich ${p.nebenkostenArt} ${eur(p.nebenkosten)}. Nutzungsdauer ${p.nd} Jahre${
        p.verfahren === 'geometrisch' && p.satz
          ? ''
          : `, erwarteter Restwert am Ende ${eur(p.restwert)}`
      }.`,
    ];
    if (p.verfahren === 'leistung') {
      sachverhalt.push(
        `Die Anlage ist auf ${plain(p.gesamtLeistung!)} Betriebsstunden ausgelegt; im ersten Jahr läuft sie ${plain(p.leistungJahr1!)} Stunden.`,
      );
    }
    if (p.verfahren === 'geometrisch' && p.satz)
      sachverhalt.push(`Abschreibungssatz: ${pct(p.satz)} vom jeweiligen Restbuchwert.`);
    return {
      titel: 'Kalkulatorische Abschreibung',
      kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
      sachverhalt,
      aufgabe:
        p.verfahren === 'linear'
          ? 'Ermittle die jährliche kalkulatorische Abschreibung (linear).'
          : p.verfahren === 'arithmetisch'
            ? 'Ermittle die kalkulatorische Abschreibung arithmetisch-degressiv für die ersten drei Jahre.'
            : p.verfahren === 'leistung'
              ? 'Ermittle die leistungsbezogene kalkulatorische Abschreibung für das erste Jahr.'
              : p.satz
                ? 'Ermittle die geometrisch-degressive Abschreibung der ersten drei Jahre und den Restbuchwert.'
                : 'Ermittle den Abschreibungssatz (geometrisch-degressiv, in Prozent auf 2 Nachkommastellen), die Abschreibung der ersten drei Jahre und den Restbuchwert.',
    };
  },
  solve: (p) => solveKalkAfa(p),
  parts,
  steps: (p, s) => {
    const steps = [
      {
        titel: 'Abschreibungsbasis',
        rechnung:
          p.verfahren === 'geometrisch'
            ? `${eur(p.ak)} + ${eur(p.nebenkosten)} = ${eur(s.basis)}`
            : `${eur(p.ak)} + ${eur(p.nebenkosten)} − ${eur(p.restwert)} = ${eur(s.basis)}`,
        erlaeuterung:
          p.verfahren === 'geometrisch'
            ? 'Anschaffungswert einschließlich Nebenkosten; der Restwert steckt im Satz.'
            : 'Anschaffungskosten einschließlich Nebenkosten, abzüglich Restwert.',
      },
    ];
    if (p.verfahren === 'geometrisch' && !p.satz && s.geoSatz) {
      steps.push({
        titel: 'Abschreibungssatz',
        rechnung: `p = 100 · (1 − ${p.nd}√(${eur(p.restwert)} ÷ ${eur(s.basis)})) = ${pct(s.geoSatz.valueDp(4))}`,
        erlaeuterung:
          'Der Satz ist so gewählt, dass nach der Nutzungsdauer genau der Restwert übrig bleibt.',
      });
    }
    if (s.linear)
      steps.push({
        titel: 'Jährlicher Betrag',
        rechnung: `${eur(s.basis)} ÷ ${p.nd} = ${eur(s.linear)}`,
        erlaeuterung: '',
      });
    if (s.degression && s.jahre) {
      steps.push(
        {
          titel: 'Degressionsbetrag',
          rechnung: `Summe der Jahresziffern 1 + … + ${p.nd} = ${s.summeZiffern}; ${eur(s.basis)} ÷ ${s.summeZiffern} = ${eur(s.degression)}`,
          erlaeuterung: '',
        },
        {
          titel: 'Jahresbeträge',
          rechnung: s.jahre
            .map((j, i) => `Jahr ${i + 1}: ${p.nd - i} × ${eur(s.degression!)} = ${eur(j)}`)
            .join('; '),
          erlaeuterung: 'Im ersten Jahr mit der höchsten Ziffer multiplizieren.',
        },
      );
    }
    if (s.satzJeEinheit && s.leistungJahr1) {
      steps.push(
        {
          titel: 'Satz je Betriebsstunde',
          rechnung: `${eur(s.basis)} ÷ ${plain(p.gesamtLeistung!)} h = ${plain(s.satzJeEinheit.exact, 4)} €/h`,
          erlaeuterung: 'Den Satz möglichst ungerundet weiterverwenden.',
        },
        {
          titel: 'Abschreibung im 1. Jahr',
          rechnung: `${plain(s.satzJeEinheit.exact, 4)} €/h × ${plain(p.leistungJahr1!)} h = ${eur(s.leistungJahr1)}`,
          erlaeuterung: '',
        },
      );
    }
    if (p.verfahren === 'geometrisch' && s.jahre && s.restbuchwert) {
      let rbw = s.basis;
      const zeilen = s.jahre.map((j, i) => {
        const z = `Jahr ${i + 1}: ${eur(rbw)} × ${pct(s.geoSatz!.stepped)} = ${eur(j)}`;
        rbw = rbw.minus(j);
        return z;
      });
      steps.push({
        titel: 'Jahresbeträge',
        rechnung: zeilen.join('; '),
        erlaeuterung: `Restbuchwert: ${eur(s.restbuchwert)}`,
      });
    }
    return steps;
  },
  hints: (p, s) => {
    const h1 = `Verfahren: ${VERFAHREN_TEXT[p.verfahren]}. Beginne mit der Abschreibungsbasis.`;
    switch (p.verfahren) {
      case 'linear':
        return [
          h1,
          'Basis = Anschaffungspreis + Nebenkosten − Restwert.',
          `Jährlich: ${eur(s.basis)} ÷ ${p.nd} Jahre.`,
        ];
      case 'arithmetisch':
        return [
          h1,
          `Summe der Jahresziffern bei ${p.nd} Jahren: ${p.nd} × ${p.nd + 1} ÷ 2 = ${s.summeZiffern}.`,
          `Degressionsbetrag ${eur(s.degression!)}; Jahr 1 = ${p.nd} × Degressionsbetrag.`,
        ];
      case 'leistung':
        return [
          h1,
          'Satz je Stunde = Abschreibungsbasis ÷ Gesamtleistung.',
          `Jahr 1 = Satz × ${plain(p.leistungJahr1!)} h.`,
        ];
      case 'geometrisch':
        return [
          h1,
          p.satz
            ? 'Jahresbetrag = Satz × Restbuchwert des Vorjahres; im 1. Jahr ist das der Anschaffungswert.'
            : `Satz: p = 100 · (1 − n-te Wurzel aus Restwert ÷ Anschaffungswert), hier n = ${p.nd}.`,
          `Jahr 1: ${eur(s.basis)} × ${pct(s.geoSatz!.stepped)}.`,
        ];
    }
  },
  errorVariants: variants,
  verfahren: (p) => `Kalkulatorische Abschreibung (${VERFAHREN_TEXT[p.verfahren]})`,
});
