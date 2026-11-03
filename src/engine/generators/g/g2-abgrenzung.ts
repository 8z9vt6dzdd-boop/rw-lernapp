// G2 – Abgrenzung von Aufwand und Kosten: neutraler Aufwand, Grund-, Anders- und Zusatzkosten,
// Ergebnistabelle mit unternehmensbezogener Abgrenzung und kostenrechnerischen Korrekturen
// (Lehrbrief K1 Kap. 1.2 und 1.6; eigene Formulierung und eigene Zahlen; Spezifikation in docs/m7/g.md).
import type { FirmaConfig } from '../../firma';
import { Val, sum } from '../../money';
import type { ErrorVariant, RechenkettePart, TabellenZeile, TaskPart, Zelle } from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, retry } from '../base';
import { MONAT, auswahl, buendeln, ziehe } from './common';

// ---------- Variante Zuordnung ----------

export const BF = 'Neutraler Aufwand: betriebsfremd';
export const PF = 'Neutraler Aufwand: periodenfremd';
export const AO = 'Neutraler Aufwand: außerordentlich';
export const GK = 'Grundkosten (aufwandsgleiche Kosten)';
export const AK = 'Anderskosten';
export const ZK = 'Zusatzkosten';
export const WEDER = 'Weder Aufwand noch Kosten';
export const KATEGORIEN_G2 = [BF, PF, AO, GK, AK, ZK, WEDER];

export interface SachverhaltG2 {
  id: string;
  kategorie: string;
  bereich: [number, number, number];
  text: (b: string, f: FirmaConfig) => string;
  begruendung: string;
  /** Typische falsche Zuordnungen */
  fehler: { kategorie: string; fehlertyp: string }[];
}

export const SACHVERHALTE_G2: readonly SachverhaltG2[] = [
  {
    id: 'spende',
    kategorie: BF,
    bereich: [500, 5_000, 500],
    text: (b) => `Spende über ${eur(b)} an ein Kinderhospiz in Paderborn`,
    begruendung:
      'Die Spende dient nicht der Herstellung und dem Absatz von Getränken: betriebsfremd.',
    fehler: [
      { kategorie: GK, fehlertyp: 'neutral-als-kosten' },
      { kategorie: AO, fehlertyp: 'neutral-art-verwechselt' },
    ],
  },
  {
    id: 'kursverlust',
    kategorie: BF,
    bereich: [1_000, 12_000, 500],
    text: (b) =>
      `Kursverlust von ${eur(b)} beim Verkauf von Aktien, die die MBG als Geldanlage gekauft hatte`,
    begruendung:
      'Spekulations- und Kursverluste haben mit dem Betriebszweck nichts zu tun: betriebsfremd.',
    fehler: [
      { kategorie: AO, fehlertyp: 'neutral-art-verwechselt' },
      { kategorie: GK, fehlertyp: 'neutral-als-kosten' },
    ],
  },
  {
    id: 'reparatur-wohnhaus',
    kategorie: BF,
    bereich: [1_000, 8_000, 100],
    text: (b) =>
      `Dachreparatur für ${eur(b)} an einem Wohnhaus, das die MBG vermietet und betrieblich nicht nutzt`,
    begruendung:
      'Das Wohnhaus dient nicht der betrieblichen Tätigkeit; seine Reparatur ist betriebsfremder Aufwand.',
    fehler: [{ kategorie: GK, fehlertyp: 'neutral-als-kosten' }],
  },
  {
    id: 'steuer-vorjahr',
    kategorie: PF,
    bereich: [1_000, 9_000, 500],
    text: (b) =>
      `Gewerbesteuer-Nachzahlung für das Vorjahr über ${eur(b)}; eine Rückstellung war nicht gebildet worden`,
    begruendung:
      'Die Ursache liegt im Vorjahr. Im Januar gebucht, würde sie das Ergebnis des Monats verzerren: periodenfremd.',
    fehler: [
      { kategorie: GK, fehlertyp: 'neutral-als-kosten' },
      { kategorie: BF, fehlertyp: 'neutral-art-verwechselt' },
    ],
  },
  {
    id: 'strom-nachberechnung',
    kategorie: PF,
    bereich: [500, 6_000, 100],
    text: (b) =>
      `Nachberechnung der Stadtwerke über ${eur(b)} für den Stromverbrauch des Vorjahres; eine Rückstellung oder Verbindlichkeit war dafür nicht gebildet worden`,
    begruendung:
      'Der Strom wurde im Vorjahr verbraucht; die Nachberechnung gehört nicht in den Januar: periodenfremd.',
    fehler: [{ kategorie: GK, fehlertyp: 'neutral-als-kosten' }],
  },
  {
    id: 'brandschaden',
    kategorie: AO,
    bereich: [2_000, 20_000, 500],
    text: (b) => `Nicht versicherter Brandschaden im Leergutlager: ${eur(b)}`,
    begruendung:
      'Ein Katastrophenschaden ohne Versicherung gehört nicht zum normalen Betriebsablauf: außerordentlich.',
    fehler: [
      { kategorie: GK, fehlertyp: 'neutral-als-kosten' },
      { kategorie: BF, fehlertyp: 'neutral-art-verwechselt' },
    ],
  },
  {
    id: 'sturmschaden',
    kategorie: AO,
    bereich: [5_000, 30_000, 500],
    text: (b) =>
      `Ein Orkan zerstört das Dach des Leergutlagers; keine Versicherung zahlt, der Schaden beträgt ${eur(b)}`,
    begruendung:
      'Ein Katastrophenschaden ohne Versicherung ist nicht Teil des normalen Betriebsablaufs: außerordentlicher Aufwand.',
    fehler: [{ kategorie: GK, fehlertyp: 'neutral-als-kosten' }],
  },
  {
    id: 'gehaelter',
    kategorie: GK,
    bereich: [20_000, 90_000, 1_000],
    text: (b) => `Gehälter der Verwaltung für ${MONAT}: ${eur(b)}`,
    begruendung:
      'Betrieblich, im Monat verbraucht, ordentlich – in gleicher Höhe Kosten: Grundkosten.',
    fehler: [{ kategorie: AK, fehlertyp: 'grundkosten-anderskosten-verwechselt' }],
  },
  {
    id: 'versicherung',
    kategorie: GK,
    bereich: [1_000, 8_000, 100],
    text: (b) => `Feuerversicherungsprämie des Werks für ${MONAT}: ${eur(b)}`,
    begruendung:
      'Versicherungsbeiträge übernimmt die Kostenrechnung in gleicher Höhe: Grundkosten.',
    fehler: [{ kategorie: BF, fehlertyp: 'kosten-als-neutral' }],
  },
  {
    id: 'zuckerverbrauch',
    kategorie: GK,
    bereich: [5_000, 40_000, 500],
    text: (b) =>
      `Verbrauch von Zucker für Sirup, bewertet wie in der Buchhaltung zum Anschaffungspreis: ${eur(b)}`,
    begruendung:
      'Betrieblicher Verbrauch, gleich bewertet wie in der Buchhaltung: Grundkosten (aufwandsgleich).',
    fehler: [{ kategorie: AK, fehlertyp: 'grundkosten-anderskosten-verwechselt' }],
  },
  {
    id: 'kfz-steuer',
    kategorie: GK,
    bereich: [300, 2_000, 50],
    text: (b) => `Kfz-Steuer für die Auslieferungs-Lkw, Anteil ${MONAT}: ${eur(b)}`,
    begruendung: 'Abgaben an die öffentliche Hand für den Betrieb des Monats: Grundkosten.',
    fehler: [{ kategorie: PF, fehlertyp: 'kosten-als-neutral' }],
  },
  {
    id: 'wartung-fremd',
    kategorie: GK,
    bereich: [1_000, 9_000, 100],
    text: (b) =>
      `Rechnung einer Fremdfirma über ${eur(b)} für die Wartung der Abfüllanlage im ${MONAT}`,
    begruendung: 'Leistungen Dritter für den Betrieb, gleich hoch übernommen: Grundkosten.',
    fehler: [{ kategorie: AK, fehlertyp: 'grundkosten-anderskosten-verwechselt' }],
  },
  {
    id: 'kalk-afa',
    kategorie: AK,
    bereich: [10_000, 40_000, 500],
    text: (b) =>
      `Kalkulatorische Abschreibung der Abfüllanlage vom Wiederbeschaffungswert: ${eur(b)}; die Buchhaltung schreibt einen niedrigeren Betrag ab`,
    begruendung:
      'Abschreibungen gibt es in beiden Rechnungen, die Kostenrechnung bewertet aber anders (tatsächlicher Wertverzehr, Wiederbeschaffungswert): Anderskosten.',
    fehler: [
      { kategorie: ZK, fehlertyp: 'anderskosten-zusatzkosten-verwechselt' },
      { kategorie: GK, fehlertyp: 'grundkosten-anderskosten-verwechselt' },
    ],
  },
  {
    id: 'tagespreis',
    kategorie: AK,
    bereich: [5_000, 30_000, 500],
    text: (b) =>
      `Verbrauch von Aromen, in der Kostenrechnung mit dem aktuellen Tagespreis statt mit dem niedrigeren Anschaffungspreis bewertet: ${eur(b)}`,
    begruendung:
      'Der Verbrauch ist auch Aufwand, wird aber mit einem anderen (höheren) Wert angesetzt: Anderskosten.',
    fehler: [{ kategorie: GK, fehlertyp: 'grundkosten-anderskosten-verwechselt' }],
  },
  {
    id: 'unternehmerlohn',
    kategorie: ZK,
    bereich: [6_000, 18_000, 1_000],
    text: (b, f) =>
      `Kalkulatorischer Unternehmerlohn über ${eur(b)} für ${f.gesellschafter[0]} und ${f.gesellschafter[1]}, die ohne Gehalt in der Geschäftsführung mitarbeiten`,
    begruendung:
      'Die Buchhaltung bucht dafür keinen Aufwand. Die Kostenrechnung setzt die Arbeitsleistung trotzdem an: Zusatzkosten.',
    fehler: [{ kategorie: AK, fehlertyp: 'anderskosten-zusatzkosten-verwechselt' }],
  },
  {
    id: 'ek-zinsen',
    kategorie: ZK,
    bereich: [2_000, 12_000, 500],
    text: (b) => `Kalkulatorische Zinsen auf das Eigenkapital der Gesellschafter: ${eur(b)}`,
    begruendung:
      'Für Eigenkapital entsteht kein Zinsaufwand; die Kostenrechnung setzt Zusatzkosten an.',
    fehler: [
      { kategorie: AK, fehlertyp: 'anderskosten-zusatzkosten-verwechselt' },
      { kategorie: GK, fehlertyp: 'zusatzkosten-als-aufwand' },
    ],
  },
  {
    id: 'kalk-miete',
    kategorie: ZK,
    bereich: [1_000, 5_000, 100],
    text: (b, f) =>
      `${f.gesellschafter[0]} überlässt der MBG eine private Lagerhalle ohne Miete; das Controlling setzt eine kalkulatorische Miete von ${eur(b)} an`,
    begruendung:
      'Es wird keine Miete gezahlt, also kein Aufwand – kalkulatorische Miete ist Zusatzkosten.',
    fehler: [{ kategorie: AK, fehlertyp: 'anderskosten-zusatzkosten-verwechselt' }],
  },
  {
    id: 'tilgung',
    kategorie: WEDER,
    bereich: [2_000, 20_000, 1_000],
    text: (b) => `Tilgung eines Bankdarlehens: ${eur(b)}`,
    begruendung: 'Nur eine Auszahlung: Die Schuld sinkt, nichts wird verbraucht.',
    fehler: [{ kategorie: GK, fehlertyp: 'zahlung-als-aufwand' }],
  },
  {
    id: 'privatentnahme',
    kategorie: WEDER,
    bereich: [500, 5_000, 100],
    text: (b, f) => `${f.gesellschafter[1]} entnimmt ${eur(b)} aus der Kasse für private Zwecke`,
    begruendung:
      'Eine Privatentnahme mindert das Eigenkapital, ist aber kein Werteverzehr des Betriebs.',
    fehler: [{ kategorie: BF, fehlertyp: 'zahlung-als-aufwand' }],
  },
  {
    id: 'etiketten-lager',
    kategorie: WEDER,
    bereich: [1_000, 8_000, 100],
    text: (b) => `Kauf von Etiketten für ${eur(b)} auf Ziel; sie liegen noch im Lager`,
    begruendung: 'Eine Ausgabe, aber im Monat wird nichts verbraucht: weder Aufwand noch Kosten.',
    fehler: [{ kategorie: GK, fehlertyp: 'ausgabe-aufwand-verwechselt' }],
  },
];

const SV = new Map(SACHVERHALTE_G2.map((s) => [s.id, s]));
export function sachverhaltG2(id: string): SachverhaltG2 {
  const s = SV.get(id);
  if (!s) throw new Error(`Unbekannter Sachverhalt ${id}`);
  return s;
}

// ---------- Variante Ergebnistabelle ----------

export interface EtParams {
  umsatz: string;
  zinsertraege?: string;
  mietertraege?: string;
  rohstoffe: string;
  loehne: string;
  gehaelter?: string;
  afaFb: string;
  /** in afaFb enthaltene Abschreibung auf eine nicht betrieblich genutzte Wohnung */
  afaNeutral?: string;
  afaKalk: string;
  zinsFb: string;
  zinsKalk: string;
  steuern?: string;
  /** in den Betriebssteuern enthaltene Nachzahlung für das Vorjahr */
  steuerNachzahlung?: string;
  spende?: string;
  unternehmerlohn?: string;
}

export type Spalte = 'aufwand' | 'ertrag' | 'nA' | 'nE' | 'afb' | 'vk' | 'k' | 'l';
export const SPALTEN: readonly Spalte[] = ['aufwand', 'ertrag', 'nA', 'nE', 'afb', 'vk', 'k', 'l'];
export const SPALTEN_TITEL: Record<Spalte, string> = {
  aufwand: 'Aufwendungen (RK I)',
  ertrag: 'Erträge (RK I)',
  nA: 'Neutraler Aufwand',
  nE: 'Neutraler Ertrag',
  afb: 'Aufwand lt. FB',
  vk: 'Verrechnete Kosten',
  k: 'Kosten',
  l: 'Leistungen',
};

export interface EtZeile {
  id: string;
  konto: string;
  werte: Partial<Record<Spalte, Val>>;
}

export interface EtSolution {
  zeilen: EtZeile[];
  summen: Record<Spalte, Val>;
  gesamtergebnis: Val;
  ergebnisAbgrenzung: Val;
  ergebnisKorrekturen: Val;
  neutral: Val;
  betriebsergebnis: Val;
}

export interface EtWeg {
  vorzeichen?: boolean;
  bilanziell?: boolean;
  ohneZusatz?: boolean;
  neutralAlsKosten?: boolean;
}

const v = (x: string) => new Val(x);

export function solveErgebnistabelle(p: EtParams, w: EtWeg = {}): EtSolution {
  const zeilen: EtZeile[] = [];
  zeilen.push({
    id: 'umsatz',
    konto: 'Umsatzerlöse für eigene Erzeugnisse',
    werte: { ertrag: v(p.umsatz), l: v(p.umsatz) },
  });
  if (p.zinsertraege)
    zeilen.push({
      id: 'zinsertraege',
      konto: 'Zinserträge',
      werte: { ertrag: v(p.zinsertraege), nE: v(p.zinsertraege) },
    });
  if (p.mietertraege)
    zeilen.push({
      id: 'mietertraege',
      konto: 'Mieterträge',
      werte: { ertrag: v(p.mietertraege), nE: v(p.mietertraege) },
    });
  zeilen.push({
    id: 'rohstoffe',
    konto: 'Aufwendungen für Rohstoffe',
    werte: { aufwand: v(p.rohstoffe), k: v(p.rohstoffe) },
  });
  zeilen.push({ id: 'loehne', konto: 'Löhne', werte: { aufwand: v(p.loehne), k: v(p.loehne) } });
  if (p.gehaelter)
    zeilen.push({
      id: 'gehaelter',
      konto: 'Gehälter',
      werte: { aufwand: v(p.gehaelter), k: v(p.gehaelter) },
    });
  const afbAfa = v(p.afaFb).minus(p.afaNeutral ?? '0');
  const afa: EtZeile = {
    id: 'afa',
    konto: 'Abschreibungen auf Sachanlagen',
    werte: {
      aufwand: v(p.afaFb),
      afb: afbAfa,
      vk: v(p.afaKalk),
      k: w.bilanziell ? afbAfa : v(p.afaKalk),
    },
  };
  if (p.afaNeutral) afa.werte.nA = v(p.afaNeutral);
  zeilen.push(afa);
  zeilen.push({
    id: 'zinsen',
    konto: 'Zinsaufwendungen',
    werte: {
      aufwand: v(p.zinsFb),
      afb: v(p.zinsFb),
      vk: v(p.zinsKalk),
      k: w.bilanziell ? v(p.zinsFb) : v(p.zinsKalk),
    },
  });
  if (p.steuern) {
    const n = p.steuerNachzahlung ?? '0';
    const z: EtZeile = {
      id: 'steuern',
      konto: 'Betriebssteuern',
      werte: { aufwand: v(p.steuern) },
    };
    if (w.neutralAlsKosten || n === '0') z.werte.k = v(p.steuern);
    else {
      z.werte.nA = v(n);
      z.werte.k = v(p.steuern).minus(n);
    }
    zeilen.push(z);
  }
  if (p.spende) {
    const z: EtZeile = {
      id: 'spende',
      konto: 'Sonstige betriebliche Aufwendungen',
      werte: { aufwand: v(p.spende) },
    };
    if (w.neutralAlsKosten) z.werte.k = v(p.spende);
    else z.werte.nA = v(p.spende);
    zeilen.push(z);
  }
  if (p.unternehmerlohn && !w.ohneZusatz) {
    zeilen.push({
      id: 'unternehmerlohn',
      konto: 'Kalkulatorischer Unternehmerlohn',
      werte: { vk: v(p.unternehmerlohn), k: v(p.unternehmerlohn) },
    });
  }
  const summen = Object.fromEntries(
    SPALTEN.map((sp) => [sp, sum(zeilen.flatMap((z) => (z.werte[sp] ? [z.werte[sp]!] : [])))]),
  ) as Record<Spalte, Val>;
  const gesamtergebnis = summen.ertrag.minus(summen.aufwand);
  const ergebnisAbgrenzung = summen.nE.minus(summen.nA);
  const ergebnisKorrekturen = w.vorzeichen
    ? summen.afb.minus(summen.vk)
    : summen.vk.minus(summen.afb);
  const neutral = ergebnisAbgrenzung.plus(ergebnisKorrekturen);
  const betriebsergebnis = summen.l.minus(summen.k);
  return {
    zeilen,
    summen,
    gesamtergebnis,
    ergebnisAbgrenzung,
    ergebnisKorrekturen,
    neutral,
    betriebsergebnis,
  };
}

const RK_I: readonly Spalte[] = ['aufwand', 'ertrag'];

function etParts(s: EtSolution): TaskPart[] {
  const zeilen: TabellenZeile[] = s.zeilen.map((z) => ({
    label: z.konto,
    zellen: SPALTEN.map((sp): Zelle => {
      const w = z.werte[sp];
      if (!w) return { typ: 'leer' };
      if (RK_I.includes(sp)) return { typ: 'fest', text: eur(w) };
      return feld(`${z.id}-${sp}`, `${z.konto}: ${SPALTEN_TITEL[sp]}`, w);
    }),
  }));
  zeilen.push({
    label: 'Summe',
    summe: true,
    zellen: SPALTEN.map((sp) => feld(`summe-${sp}`, `Summe ${SPALTEN_TITEL[sp]}`, s.summen[sp])),
  });
  return [
    {
      typ: 'tabelle',
      id: 'ergebnistabelle',
      titel: `Ergebnistabelle ${MONAT}`,
      spalten: SPALTEN.map((sp) => SPALTEN_TITEL[sp]),
      zeilen,
      hinweis:
        'Leere Zellen bleiben frei. Rechnungskreis I ist vorgegeben; trage die Beträge in Abgrenzungsbereich und Kostenrechnung ein.',
    },
    {
      typ: 'rechenkette',
      id: 'ergebnisse',
      titel: 'Ergebnisse und Abstimmung',
      felder: [
        feld('gesamtergebnis', 'Gesamtergebnis (Erträge − Aufwendungen)', s.gesamtergebnis),
        feld(
          'ergebnis-abgrenzung',
          'Ergebnis aus unternehmensbezogenen Abgrenzungen',
          s.ergebnisAbgrenzung,
        ),
        feld(
          'ergebnis-korrekturen',
          'Ergebnis aus kostenrechnerischen Korrekturen',
          s.ergebnisKorrekturen,
        ),
        feld('neutral', 'Neutrales Ergebnis', s.neutral),
        feld('betriebsergebnis', 'Betriebsergebnis (Leistungen − Kosten)', s.betriebsergebnis),
      ],
    },
  ];
}

// ---------- Generator ----------

export interface G2Params {
  variante: 'zuordnung' | 'ergebnistabelle';
  sachverhalte?: { id: string; betrag: string }[];
  tabelle?: EtParams;
}

export interface G2Solution {
  kategorien?: string[];
  tabelle?: EtSolution;
}

function zuordnungsPart(p: G2Params): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'zuordnung',
    titel: 'Aufwand oder Kosten?',
    felder: (p.sachverhalte ?? []).map((x, i) =>
      auswahl(`s${i + 1}`, `Sachverhalt ${i + 1}`, KATEGORIEN_G2, sachverhaltG2(x.id).kategorie),
    ),
  };
}

function solveG2(p: G2Params): G2Solution {
  if (p.variante === 'zuordnung')
    return { kategorien: (p.sachverhalte ?? []).map((x) => sachverhaltG2(x.id).kategorie) };
  return { tabelle: solveErgebnistabelle(p.tabelle!) };
}

function parts(p: G2Params, s: G2Solution): TaskPart[] {
  if (p.variante === 'zuordnung') return [zuordnungsPart(p)];
  return etParts(s.tabelle!);
}

function errorVariants(p: G2Params): ErrorVariant[] {
  if (p.variante === 'zuordnung') {
    const part = zuordnungsPart(p);
    return buendeln(
      part,
      (p.sachverhalte ?? []).flatMap((x, i) =>
        sachverhaltG2(x.id).fehler.map((f) => ({
          fehlertyp: f.fehlertyp,
          feldId: `s${i + 1}`,
          soll: f.kategorie,
        })),
      ),
    );
  }
  const t = p.tabelle!;
  const out: ErrorVariant[] = [
    {
      fehlertyp: 'korrektur-vorzeichen',
      parts: etParts(solveErgebnistabelle(t, { vorzeichen: true })),
    },
    {
      fehlertyp: 'bilanziell-statt-kalkulatorisch',
      parts: etParts(solveErgebnistabelle(t, { bilanziell: true })),
    },
  ];
  if (t.unternehmerlohn)
    out.push({
      fehlertyp: 'zusatzkosten-vergessen',
      parts: etParts(solveErgebnistabelle(t, { ohneZusatz: true })),
    });
  if (t.spende || t.steuerNachzahlung)
    out.push({
      fehlertyp: 'neutral-als-kosten',
      parts: etParts(solveErgebnistabelle(t, { neutralAlsKosten: true })),
    });
  return out;
}

function etText(t: EtParams, f: FirmaConfig): string[] {
  const out = [
    `Die Finanzbuchhaltung (Rechnungskreis I) weist für den ${MONAT} die Aufwendungen und Erträge der Tabelle aus. Das Controlling stimmt sie mit der Kosten- und Leistungsrechnung (Rechnungskreis II) ab:`,
  ];
  if (t.zinsertraege) out.push('• Die Zinserträge stammen aus einer Festgeldanlage.');
  if (t.mietertraege)
    out.push('• Die Mieterträge stammen aus einem Wohnhaus, das die MBG betrieblich nicht nutzt.');
  out.push(
    t.afaNeutral
      ? `• In den Abschreibungen auf Sachanlagen sind ${eur(t.afaNeutral)} für dieses Wohnhaus enthalten. Für die betrieblichen Anlagen verrechnet die Kostenrechnung kalkulatorische Abschreibungen von ${eur(t.afaKalk)}.`
      : `• Statt der bilanziellen Abschreibungen verrechnet die Kostenrechnung kalkulatorische Abschreibungen von ${eur(t.afaKalk)}.`,
    `• Statt der Zinsaufwendungen verrechnet die Kostenrechnung kalkulatorische Zinsen von ${eur(t.zinsKalk)}.`,
  );
  if (t.steuern && t.steuerNachzahlung)
    out.push(
      `• In den Betriebssteuern ist eine Nachzahlung für das Vorjahr von ${eur(t.steuerNachzahlung)} enthalten.`,
    );
  if (t.spende)
    out.push('• Die sonstigen betrieblichen Aufwendungen sind eine Spende an einen Sportverein.');
  if (t.unternehmerlohn)
    out.push(
      `• Für ${f.gesellschafter[0]} und ${f.gesellschafter[1]}, die ohne Gehalt mitarbeiten, wird ein kalkulatorischer Unternehmerlohn von ${eur(t.unternehmerlohn)} verrechnet.`,
    );
  out.push(
    '• Alle übrigen Aufwendungen und Erträge übernimmt die Kostenrechnung in gleicher Höhe.',
  );
  return out;
}

export const g2Abgrenzung = defineGenerator<G2Params, G2Solution>({
  skillId: 'G2-abgrenzung',
  titel: 'Abgrenzung von Aufwand und Kosten',
  variants: ['zuordnung', 'ergebnistabelle'],
  points: 6,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as G2Params['variante'] | undefined) ??
      (rng.chance(0.4) ? 'ergebnistabelle' : 'zuordnung');
    if (variante === 'zuordnung') {
      return retry(
        rng,
        (r) => {
          const gewaehlt = ziehe(r, SACHVERHALTE_G2, 5);
          return {
            variante,
            sachverhalte: gewaehlt.map((s) => ({
              id: s.id,
              betrag: betrag(r, s.bereich[0], s.bereich[1], s.bereich[2], krumm),
            })),
          } satisfies G2Params;
        },
        (p) => {
          const k = p.sachverhalte.map((x) => sachverhaltG2(x.id).kategorie);
          const neutral = k.some((x) => x === BF || x === PF || x === AO);
          const kalk = k.some((x) => x === AK || x === ZK);
          return neutral && kalk && new Set(k).size >= 4;
        },
      );
    }
    return retry(
      rng,
      (r) => {
        // Krumme Werte nur in einzelnen Zeilen, damit die Tabelle lesbar bleibt
        const b = (min: number, max: number, step: number, k = false) =>
          betrag(r, min, max, step, k && krumm);
        const afaFb = b(40_000, 90_000, 1_000);
        const t: EtParams = {
          umsatz: '0',
          rohstoffe: b(150_000, 400_000, 5_000, true),
          loehne: b(100_000, 250_000, 5_000, true),
          afaFb,
          afaKalk: b(35_000, 100_000, 1_000),
          zinsFb: b(3_000, 15_000, 500),
          zinsKalk: b(8_000, 25_000, 500, true),
        };
        if (r.chance(0.7)) t.gehaelter = b(50_000, 120_000, 1_000);
        const ertrag = r.int(0, 2);
        if (ertrag !== 1) t.zinsertraege = b(1_000, 8_000, 500);
        if (ertrag !== 0) {
          t.mietertraege = b(1_000, 5_000, 100);
          if (r.chance(0.5)) t.afaNeutral = b(1_000, 3_000, 500);
        }
        if (r.chance(0.7)) {
          t.steuern = b(10_000, 30_000, 500);
          if (r.chance(0.7)) t.steuerNachzahlung = b(1_000, 8_000, 500);
        }
        if (r.chance(0.7)) t.spende = b(500, 5_000, 500);
        if (r.chance(0.6)) t.unternehmerlohn = b(8_000, 16_000, 1_000);
        // Umsatz passend zum Aufwand (Gewinnaufschlag 10–35 %), auf 10.000 € gerundet
        const aufwand = solveErgebnistabelle(t).summen.aufwand.exact;
        t.umsatz = aufwand
          .times(r.pick(['1.1', '1.15', '1.2', '1.25', '1.3', '1.35']))
          .div(10_000)
          .toDecimalPlaces(0)
          .times(10_000)
          .toFixed(0);
        return { variante, tabelle: t } satisfies G2Params;
      },
      (p) => {
        const t = p.tabelle;
        const s = solveErgebnistabelle(t);
        const kalkAnders = !s.zeilen
          .find((z) => z.id === 'afa')!
          .werte.afb!.exact.equals(new Val(t.afaKalk).exact);
        return (
          kalkAnders &&
          !new Val(t.zinsFb).exact.equals(new Val(t.zinsKalk).exact) &&
          !s.summen.nA.exact.isZero() &&
          s.betriebsergebnis.exact.gt(0) &&
          s.ergebnisKorrekturen.abs().exact.gte(500) &&
          // Nachzahlung kleiner als die Steuern insgesamt
          (!t.steuern || !t.steuerNachzahlung || new Val(t.steuerNachzahlung).cmp(t.steuern) < 0)
        );
      },
    );
  },
  render: (p, f) => {
    if (p.variante === 'zuordnung') {
      return {
        titel: 'Aufwand und Kosten abgrenzen',
        kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
        sachverhalt: [
          `Das Controlling prüft für den ${MONAT} folgende Sachverhalte:`,
          ...(p.sachverhalte ?? []).map(
            (x, i) => `${i + 1}) ${sachverhaltG2(x.id).text(x.betrag, f)}`,
          ),
        ],
        aufgabe:
          'Ordne jeden Sachverhalt zu: neutraler Aufwand (mit Art), Grundkosten, Anderskosten, Zusatzkosten oder weder Aufwand noch Kosten.',
      };
    }
    const t = p.tabelle!;
    const s = solveErgebnistabelle(t);
    return {
      titel: 'Ergebnistabelle',
      kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
      sachverhalt: etText(t, f),
      daten: {
        spalten: ['Konto', 'Aufwendungen', 'Erträge'],
        zeilen: s.zeilen
          .filter((z) => z.werte.aufwand || z.werte.ertrag)
          .map((z) => [
            z.konto,
            z.werte.aufwand ? eur(z.werte.aufwand) : '',
            z.werte.ertrag ? eur(z.werte.ertrag) : '',
          ]),
      },
      aufgabe:
        'Erstelle die Ergebnistabelle mit unternehmensbezogener Abgrenzung und kostenrechnerischen Korrekturen. Ermittle Gesamtergebnis, neutrales Ergebnis und Betriebsergebnis und stimme sie ab.',
    };
  },
  solve: solveG2,
  parts,
  steps: (p, s) => {
    if (p.variante === 'zuordnung') {
      return (p.sachverhalte ?? []).map((x, i) => {
        const sv = sachverhaltG2(x.id);
        return {
          titel: `Sachverhalt ${i + 1}`,
          ergebnis: sv.kategorie,
          erlaeuterung: sv.begruendung,
        };
      });
    }
    const e = s.tabelle!;
    return [
      {
        titel: 'Gesamtergebnis (Rechnungskreis I)',
        rechnung: `${eur(e.summen.ertrag)} − ${eur(e.summen.aufwand)} = ${eur(e.gesamtergebnis)}`,
      },
      {
        titel: 'Unternehmensbezogene Abgrenzung',
        rechnung: `${eur(e.summen.nE)} − ${eur(e.summen.nA)} = ${eur(e.ergebnisAbgrenzung)}`,
        erlaeuterung:
          'Neutrale Erträge und neutrale Aufwendungen (betriebsfremd, periodenfremd, außerordentlich) werden aus dem Betriebsergebnis herausgehalten.',
      },
      {
        titel: 'Kostenrechnerische Korrekturen',
        rechnung: `${eur(e.summen.vk)} − ${eur(e.summen.afb)} = ${eur(e.ergebnisKorrekturen)}`,
        erlaeuterung:
          'Verrechnete (kalkulatorische) Kosten minus der Aufwand laut Finanzbuchhaltung, den sie ersetzen. Zusatzkosten stehen nur bei den verrechneten Kosten.',
      },
      {
        titel: 'Betriebsergebnis',
        rechnung: `${eur(e.summen.l)} − ${eur(e.summen.k)} = ${eur(e.betriebsergebnis)}`,
      },
      {
        titel: 'Abstimmung',
        rechnung: `${eur(e.ergebnisAbgrenzung)} + ${eur(e.ergebnisKorrekturen)} + ${eur(e.betriebsergebnis)} = ${eur(e.gesamtergebnis)}`,
        erlaeuterung: 'Gesamtergebnis = neutrales Ergebnis + Betriebsergebnis.',
      },
    ];
  },
  hints: (p, s) => {
    if (p.variante === 'zuordnung')
      return [
        'Frage je Sachverhalt: Bucht die Buchhaltung Aufwand? Dient der Verbrauch dem Betrieb, gehört er in den Monat, ist er gewöhnlich? Und: Setzt die Kostenrechnung denselben Betrag an?',
        'Neutral ist Aufwand, der betriebsfremd, periodenfremd oder außerordentlich ist. Anderskosten haben einen Aufwand, aber in anderer Höhe; Zusatzkosten haben gar keinen Aufwand.',
        'Tilgungen, Privatentnahmen und Käufe auf Lager sind weder Aufwand noch Kosten – es wird nichts verbraucht.',
      ];
    const e = s.tabelle!;
    return [
      'Je Zeile: Ist der Betrag neutral (dann Abgrenzungsbereich), wird er in anderer Höhe verrechnet (dann kostenrechnerische Korrektur und kalkulatorischer Wert als Kosten) oder unverändert übernommen (direkt Kosten bzw. Leistungen)?',
      'Bei Abschreibungen und Zinsen: den betrieblichen Teil des Aufwands lt. FB in die Spalte „Aufwand lt. FB“, den kalkulatorischen Betrag in „Verrechnete Kosten“ und in „Kosten“.',
      `Summe Kosten: ${eur(e.summen.k)}; Betriebsergebnis ${eur(e.betriebsergebnis)}. Kontrolle: neutrales Ergebnis + Betriebsergebnis = Gesamtergebnis.`,
    ];
  },
  errorVariants,
  verfahren: (p) =>
    p.variante === 'zuordnung'
      ? 'Abgrenzung neutraler Aufwand, Grund-, Anders- und Zusatzkosten'
      : 'Ergebnistabelle (Abgrenzungsrechnung)',
});
