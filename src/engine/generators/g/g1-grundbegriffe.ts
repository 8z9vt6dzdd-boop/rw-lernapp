// G1 – Grundbegriffe: Auszahlung/Ausgabe/Aufwand/Kosten und Einzahlung/Einnahme/Ertrag/Leistung
// (Lehrbrief K1 Kap. 1.2, eigene Formulierung und eigene Zahlen; Spezifikation in docs/m7/g.md).
import type { FirmaConfig } from '../../firma';
import { Val, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, RechenkettePart, TaskPart } from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, retry } from '../base';
import { JA, JA_NEIN, MONAT, NEIN, auswahl, buendeln, ziehe } from './common';

export type Seite = 'aus' | 'ein';
export type Stufen = [boolean, boolean, boolean, boolean];

export const STUFEN: Record<Seite, [string, string, string, string]> = {
  aus: ['Auszahlung', 'Ausgabe', 'Aufwand', 'Kosten'],
  ein: ['Einzahlung', 'Einnahme', 'Ertrag', 'Leistung'],
};

export interface VorfallG1 {
  id: string;
  seite: Seite;
  /** Liegt im betrachteten Monat vor? Reihenfolge wie STUFEN. */
  stufen: Stufen;
  /** Betragsbereich in € [min, max, Schritt] */
  bereich: [number, number, number];
  text: (b: string, f: FirmaConfig) => string;
  begruendung: string;
  /** Typische Denkfehler: diese Stufe wird umgekehrt beurteilt. */
  fehler: { stufe: number; fehlertyp: string }[];
}

const J = true;
const N = false;

/** Katalog der Geschäftsvorfälle (Abrechnungsperiode: ein Monat). */
export const VORFAELLE_G1: readonly VorfallG1[] = [
  {
    id: 'verbindlichkeit-bezahlt',
    seite: 'aus',
    stufen: [J, N, N, N],
    bereich: [2_000, 30_000, 500],
    text: (b, f) =>
      `Die MBG überweist ${eur(b)} an ${f.lieferanten.rohstoffe[0]} für eine Rohstofflieferung aus dem Dezember.`,
    begruendung:
      'Geld fließt ab (Auszahlung). Gleichzeitig sinkt die Verbindlichkeit um denselben Betrag, das Geldvermögen bleibt gleich: keine Ausgabe, kein Verbrauch.',
    fehler: [{ stufe: 1, fehlertyp: 'auszahlung-ausgabe-verwechselt' }],
  },
  {
    id: 'barkauf-lager',
    seite: 'aus',
    stufen: [J, J, N, N],
    bereich: [500, 6_000, 100],
    text: (b) =>
      `Die MBG kauft Etiketten für ${eur(b)} gegen Barzahlung und legt sie ins Lager. Verbraucht werden sie erst im Februar.`,
    begruendung:
      'Bar bezahlt: Auszahlung und Ausgabe zugleich. Die Etiketten liegen aber noch im Lager – im Januar wird nichts verbraucht, also weder Aufwand noch Kosten.',
    fehler: [{ stufe: 2, fehlertyp: 'ausgabe-aufwand-verwechselt' }],
  },
  {
    id: 'zielkauf-verbraucht',
    seite: 'aus',
    stufen: [N, J, J, J],
    bereich: [3_000, 25_000, 500],
    text: (b, f) =>
      `Die MBG kauft Fruchtsaftkonzentrat für ${eur(b)} auf Ziel bei ${f.lieferanten.rohstoffe[2]}. Es wird noch im ${MONAT} zu Sirup verarbeitet.`,
    begruendung:
      'Auf Ziel gekauft: Die Verbindlichkeit steigt (Ausgabe), Geld fließt noch nicht (keine Auszahlung). Das Konzentrat wird im Monat für die Produktion verbraucht: Aufwand und Kosten.',
    fehler: [{ stufe: 0, fehlertyp: 'auszahlung-ausgabe-verwechselt' }],
  },
  {
    id: 'zielkauf-lager',
    seite: 'aus',
    stufen: [N, J, N, N],
    bereich: [3_000, 30_000, 500],
    text: (b, f) =>
      `Die MBG kauft Aromen für ${eur(b)} auf Ziel bei ${f.lieferanten.rohstoffe[0]} und lagert sie ein. Verarbeitet werden sie erst ab März.`,
    begruendung:
      'Zieleinkauf: Ausgabe ohne Auszahlung. Solange die Aromen im Lager liegen, ist nichts verbraucht – kein Aufwand, keine Kosten.',
    fehler: [
      { stufe: 2, fehlertyp: 'ausgabe-aufwand-verwechselt' },
      { stufe: 0, fehlertyp: 'auszahlung-ausgabe-verwechselt' },
    ],
  },
  {
    id: 'lagerverbrauch',
    seite: 'aus',
    stufen: [N, N, J, J],
    bereich: [2_000, 20_000, 500],
    text: (b) =>
      `Zucker aus dem Lagerbestand vom Dezember im Wert von ${eur(b)} wird im ${MONAT} zu Sirup verarbeitet.`,
    begruendung:
      'Der Zucker wurde schon im Dezember gekauft – die Ausgabe lag dort. Im Januar wird er verbraucht: Aufwand und, weil für die Getränkeherstellung, auch Kosten.',
    fehler: [{ stufe: 1, fehlertyp: 'ausgabe-aufwand-verwechselt' }],
  },
  {
    id: 'gehalt',
    seite: 'aus',
    stufen: [J, J, J, J],
    bereich: [20_000, 90_000, 1_000],
    text: (b) =>
      `Die Gehälter der Verwaltung für ${MONAT}, insgesamt ${eur(b)}, werden per Bank überwiesen.`,
    begruendung:
      'Zahlung per Bank (Auszahlung) für eine Arbeitsleistung, die im Monat verbraucht wird (Ausgabe und Aufwand). Sie dient dem Betrieb: auch Kosten.',
    fehler: [{ stufe: 3, fehlertyp: 'kosten-als-neutral' }],
  },
  {
    id: 'versicherung',
    seite: 'aus',
    stufen: [J, J, J, J],
    bereich: [1_000, 8_000, 100],
    text: (b) =>
      `Die Feuerversicherung des Werks für ${MONAT}, ${eur(b)}, wird vom Bankkonto abgebucht.`,
    begruendung:
      'Abbuchung: Auszahlung und Ausgabe. Der Versicherungsschutz für Januar wird im Januar verbraucht und sichert den Betrieb: Aufwand und Kosten.',
    fehler: [{ stufe: 3, fehlertyp: 'kosten-als-neutral' }],
  },
  {
    id: 'spende',
    seite: 'aus',
    stufen: [J, J, J, N],
    bereich: [500, 5_000, 500],
    text: (b) => `Die MBG spendet ${eur(b)} per Überweisung an einen Sportverein in Paderborn.`,
    begruendung:
      'Geld fließt ab und das Geldvermögen sinkt: Auszahlung und Ausgabe. In der Buchhaltung ist die Spende Aufwand – mit der Herstellung von Getränken hat sie aber nichts zu tun: keine Kosten.',
    fehler: [{ stufe: 3, fehlertyp: 'neutral-als-kosten' }],
  },
  {
    id: 'steuer-vorjahr',
    seite: 'aus',
    stufen: [J, J, J, N],
    bereich: [1_000, 9_000, 500],
    text: (b) =>
      `Das Finanzamt fordert eine Gewerbesteuer-Nachzahlung für das Vorjahr. Die MBG überweist ${eur(b)}; eine Rückstellung war dafür nicht gebildet worden.`,
    begruendung:
      'Überweisung: Auszahlung und Ausgabe; in der Buchhaltung Aufwand. Die Ursache liegt im Vorjahr (periodenfremd) – für die Kosten des Januars zählt sie nicht.',
    fehler: [{ stufe: 3, fehlertyp: 'neutral-als-kosten' }],
  },
  {
    id: 'brandschaden',
    seite: 'aus',
    stufen: [N, N, J, N],
    bereich: [2_000, 15_000, 500],
    text: (b) =>
      `Ein Brand im Leergutlager vernichtet Paletten im Wert von ${eur(b)}. Eine Versicherung zahlt nicht.`,
    begruendung:
      'Kein Geld fließt und nichts wird gekauft. Der Wertverlust ist Aufwand, aber außerordentlich – er gehört nicht zum normalen Betriebsablauf, also keine Kosten.',
    fehler: [{ stufe: 3, fehlertyp: 'neutral-als-kosten' }],
  },
  {
    id: 'unternehmerlohn',
    seite: 'aus',
    stufen: [N, N, N, J],
    bereich: [6_000, 18_000, 1_000],
    text: (b, f) =>
      `${f.gesellschafter[0]} und ${f.gesellschafter[1]} arbeiten in der Geschäftsführung mit, ohne ein Gehalt zu beziehen. Das Controlling setzt dafür für ${MONAT} einen kalkulatorischen Unternehmerlohn von ${eur(b)} an.`,
    begruendung:
      'Es fließt kein Geld und die Buchhaltung bucht nichts: weder Auszahlung noch Ausgabe noch Aufwand. Die Arbeit wird aber verbraucht – die Kostenrechnung setzt Zusatzkosten an.',
    fehler: [{ stufe: 2, fehlertyp: 'zusatzkosten-als-aufwand' }],
  },
  {
    id: 'kalk-zinsen-ek',
    seite: 'aus',
    stufen: [N, N, N, J],
    bereich: [2_000, 12_000, 500],
    text: (b) =>
      `Für das Eigenkapital der Gesellschafter setzt das Controlling für ${MONAT} kalkulatorische Zinsen von ${eur(b)} an.`,
    begruendung:
      'Für Eigenkapital zahlt die MBG keine Zinsen – kein Geldabfluss, kein Aufwand. Die Kostenrechnung berücksichtigt die Kapitalnutzung trotzdem: Zusatzkosten.',
    fehler: [{ stufe: 2, fehlertyp: 'zusatzkosten-als-aufwand' }],
  },
  {
    id: 'tilgung',
    seite: 'aus',
    stufen: [J, N, N, N],
    bereich: [2_000, 20_000, 1_000],
    text: (b) => `Die MBG zahlt eine Tilgungsrate von ${eur(b)} für ihr Bankdarlehen.`,
    begruendung:
      'Geld fließt ab, gleichzeitig sinkt die Darlehensschuld: Das Geldvermögen bleibt gleich. Nur eine Auszahlung, kein Verbrauch.',
    fehler: [{ stufe: 1, fehlertyp: 'auszahlung-ausgabe-verwechselt' }],
  },
  {
    id: 'maschine-ziel',
    seite: 'aus',
    stufen: [N, J, N, N],
    bereich: [20_000, 120_000, 5_000],
    text: (b, f) =>
      `Die MBG kauft bei ${f.lieferanten.anlagen[0]} eine Etikettiermaschine für ${eur(b)} auf Ziel.`,
    begruendung:
      'Die Verbindlichkeit steigt: Ausgabe, aber noch keine Auszahlung. Die Maschine wird erst über die Nutzungsjahre verbraucht (Abschreibungen) – der Kauf selbst ist kein Aufwand.',
    fehler: [{ stufe: 2, fehlertyp: 'ausgabe-aufwand-verwechselt' }],
  },
  {
    id: 'forderung-bezahlt',
    seite: 'ein',
    stufen: [J, N, N, N],
    bereich: [2_000, 30_000, 500],
    text: (b, f) => `${f.kunden[0]} überweist ${eur(b)} für eine Lieferung aus dem Dezember.`,
    begruendung:
      'Geld fließt zu (Einzahlung). Die Forderung sinkt um denselben Betrag, das Geldvermögen bleibt gleich: keine Einnahme. Der Verkauf fand im Dezember statt.',
    fehler: [{ stufe: 1, fehlertyp: 'einzahlung-einnahme-verwechselt' }],
  },
  {
    id: 'zielverkauf',
    seite: 'ein',
    stufen: [N, J, J, J],
    bereich: [3_000, 40_000, 500],
    text: (b, f) =>
      `Die MBG liefert im ${MONAT} hergestellte ${f.produkte.lemon} für ${eur(b)} auf Ziel an ${f.kunden[2]}.`,
    begruendung:
      'Verkauf auf Ziel: Die Forderung steigt (Einnahme), Geld fließt erst später (keine Einzahlung). Die Getränke wurden im Monat hergestellt und gehören zur typischen Tätigkeit: Ertrag und Leistung.',
    fehler: [{ stufe: 0, fehlertyp: 'einzahlung-einnahme-verwechselt' }],
  },
  {
    id: 'barverkauf',
    seite: 'ein',
    stufen: [J, J, J, J],
    bereich: [300, 4_000, 50],
    text: (b, f) =>
      `Im Werksverkauf werden im ${MONAT} hergestellte Kisten ${f.produkte.energy} für ${eur(b)} bar verkauft.`,
    begruendung:
      'Bargeld fließt zu: Einzahlung und Einnahme. Die Getränke stammen aus der Produktion des Monats und sind die typische Leistung der MBG: auch Ertrag und Leistung.',
    fehler: [{ stufe: 3, fehlertyp: 'kosten-als-neutral' }],
  },
  {
    id: 'produktion-lager',
    seite: 'ein',
    stufen: [N, N, J, J],
    bereich: [5_000, 40_000, 1_000],
    text: (b, f) =>
      `Im ${MONAT} werden Dosen ${f.produkte.energy} im Wert von ${eur(b)} (Herstellkosten) abgefüllt und eingelagert. Verkauft werden sie erst im Februar.`,
    begruendung:
      'Noch nichts verkauft: keine Einzahlung, keine Einnahme. Die Herstellung erhöht aber das Vermögen im Januar – Ertrag (Mehrbestand) und betriebliche Leistung.',
    fehler: [{ stufe: 1, fehlertyp: 'einnahme-ertrag-verwechselt' }],
  },
  {
    id: 'miete-wohnung',
    seite: 'ein',
    stufen: [J, J, J, N],
    bereich: [600, 3_000, 50],
    text: (b) =>
      `Die MBG erhält per Überweisung ${eur(b)} Miete für ${MONAT} für eine Wohnung, die sie an Privatleute vermietet und betrieblich nicht nutzt.`,
    begruendung:
      'Geld fließt zu: Einzahlung und Einnahme; in der Buchhaltung ein Ertrag. Mit dem Getränkegeschäft hat die Vermietung nichts zu tun: neutraler Ertrag, keine Leistung.',
    fehler: [{ stufe: 3, fehlertyp: 'neutral-als-leistung' }],
  },
  {
    id: 'zinsgutschrift',
    seite: 'ein',
    stufen: [J, J, J, N],
    bereich: [200, 3_000, 50],
    text: (b) =>
      `Die Bank schreibt der MBG ${eur(b)} Zinsen für ein Festgeldkonto gut; sie betreffen nur den ${MONAT}.`,
    begruendung:
      'Gutschrift: Einzahlung und Einnahme, in der Buchhaltung Ertrag. Zinsen aus einer Geldanlage entstehen nicht aus der Getränkeherstellung: neutraler Ertrag, keine Leistung.',
    fehler: [{ stufe: 3, fehlertyp: 'neutral-als-leistung' }],
  },
  {
    id: 'patent',
    seite: 'ein',
    stufen: [N, N, N, J],
    bereich: [1_000, 8_000, 500],
    text: (b) =>
      `Die MBG nutzt im ${MONAT} ein selbst entwickeltes Patent für einen Dosenverschluss, das nicht in der Bilanz aktiviert ist. Das Controlling bewertet die Nutzung mit ${eur(b)}.`,
    begruendung:
      'Kein Geld, kein Verkauf, keine Buchung in der Buchhaltung. Die Kostenrechnung erfasst den Wert trotzdem: eine Zusatzleistung ohne Ertrag.',
    fehler: [{ stufe: 2, fehlertyp: 'zusatzleistung-als-ertrag' }],
  },
  {
    id: 'darlehen-aufnahme',
    seite: 'ein',
    stufen: [J, N, N, N],
    bereich: [10_000, 100_000, 5_000],
    text: (b) => `Die Sparkasse zahlt der MBG ein Darlehen über ${eur(b)} auf das Bankkonto aus.`,
    begruendung:
      'Geld fließt zu, gleichzeitig entsteht eine Schuld in gleicher Höhe: Das Geldvermögen bleibt gleich. Nur eine Einzahlung.',
    fehler: [{ stufe: 1, fehlertyp: 'einzahlung-einnahme-verwechselt' }],
  },
];

/** Vorfall mit zwei Beträgen für die Betragsvariante: Kauf auf Ziel, Teil davon verbraucht. */
export const TEILVERBRAUCH = {
  id: 'zielkauf-teilverbrauch',
  text: (b: string, v: string, f: FirmaConfig) =>
    `Die MBG kauft bei ${f.lieferanten.rohstoffe[0]} Aromen für ${eur(b)} auf Ziel. Davon werden im ${MONAT} Aromen für ${eur(v)} verbraucht, der Rest bleibt im Lager.`,
  begruendung:
    'Ausgabe in voller Höhe (Verbindlichkeit), noch keine Auszahlung. Aufwand und Kosten nur für den verbrauchten Teil.',
};

const VORFALL = new Map(VORFAELLE_G1.map((v) => [v.id, v]));

export function vorfallG1(id: string): VorfallG1 {
  const v = VORFALL.get(id);
  if (!v) throw new Error(`Unbekannter Vorfall ${id}`);
  return v;
}

// ---------- Parameter und Lösung ----------

export interface G1Vorfall {
  id: string;
  betrag: string;
  /** nur Teilverbrauch: verbrauchter Teil */
  verbrauch?: string;
}

export interface G1Params {
  variante: 'zuordnung' | 'betraege';
  vorfaelle: G1Vorfall[];
}

export interface G1Solution {
  /** je Vorfall: Stufen (nur Zuordnung) */
  stufen: Stufen[];
  /** Betragsvariante: Summen Auszahlungen, Ausgaben, Aufwand, Kosten */
  summen: Val[];
}

/** Beträge eines Vorfalls je Stufe (Betragsvariante), optional mit einem Denkfehler. */
export function werteG1(v: G1Vorfall, fehlertyp?: string): Val[] {
  const b = new Val(v.betrag);
  const z = new Val(0);
  if (v.id === TEILVERBRAUCH.id) {
    const t = new Val(v.verbrauch ?? '0');
    if (fehlertyp === 'ausgabe-aufwand-verwechselt') return [z, b, b, b];
    if (fehlertyp === 'auszahlung-ausgabe-verwechselt') return [b, b, t, t];
    return [z, b, t, t];
  }
  const vf = vorfallG1(v.id);
  const stufen = [...vf.stufen];
  for (const f of vf.fehler) if (f.fehlertyp === fehlertyp) stufen[f.stufe] = !stufen[f.stufe];
  return stufen.map((s) => (s ? b : z));
}

export function solveG1(p: G1Params, fehler?: { index: number; fehlertyp: string }): G1Solution {
  const stufen = p.vorfaelle.map((v) =>
    v.id === TEILVERBRAUCH.id ? ([N, J, J, J] as Stufen) : vorfallG1(v.id).stufen,
  );
  const werte = p.vorfaelle.map((v, i) =>
    werteG1(v, fehler && fehler.index === i ? fehler.fehlertyp : undefined),
  );
  const summen = [0, 1, 2, 3].map((k) => sum(werte.map((w) => w[k]!)));
  return { stufen, summen };
}

// ---------- Teile ----------

const SUMMEN_IDS = ['auszahlungen', 'ausgaben', 'aufwand', 'kosten'];
const SUMMEN_LABEL = [
  'Summe der Auszahlungen',
  'Summe der Ausgaben',
  'Summe der Aufwendungen',
  'Summe der Kosten',
];

/** Auswahlfelder ja/nein für einen Vorfall (auch für Lektionen nutzbar). */
export function stufenFelder(v: VorfallG1, nr: number, stufen: Stufen = v.stufen) {
  return STUFEN[v.seite].map((name, k) =>
    auswahl(`v${nr}-${k}`, `${nr}) ${name}?`, JA_NEIN, stufen[k] ? JA : NEIN),
  );
}

function zuordnungsPart(p: G1Params, s: G1Solution): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'stufen',
    titel: `Was liegt im ${MONAT} vor?`,
    felder: p.vorfaelle.flatMap((v, i) => stufenFelder(vorfallG1(v.id), i + 1, s.stufen[i])),
  };
}

function summenPart(s: G1Solution): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'summen',
    titel: `Summen für ${MONAT}`,
    felder: SUMMEN_IDS.map((id, k) => feld(id, SUMMEN_LABEL[k]!, s.summen[k]!)),
  };
}

function parts(p: G1Params, s: G1Solution): TaskPart[] {
  return [p.variante === 'zuordnung' ? zuordnungsPart(p, s) : summenPart(s)];
}

function errorVariants(p: G1Params): ErrorVariant[] {
  const s = solveG1(p);
  if (p.variante === 'zuordnung') {
    const part = zuordnungsPart(p, s);
    const einzel = p.vorfaelle.flatMap((v, i) =>
      vorfallG1(v.id).fehler.map((f) => ({
        fehlertyp: f.fehlertyp,
        feldId: `v${i + 1}-${f.stufe}`,
        soll: s.stufen[i]![f.stufe] ? NEIN : JA,
      })),
    );
    return buendeln(part, einzel);
  }
  const out: ErrorVariant[] = [];
  p.vorfaelle.forEach((v, i) => {
    const typen =
      v.id === TEILVERBRAUCH.id
        ? ['ausgabe-aufwand-verwechselt', 'auszahlung-ausgabe-verwechselt']
        : vorfallG1(v.id).fehler.map((f) => f.fehlertyp);
    for (const fehlertyp of new Set(typen)) {
      out.push({ fehlertyp, parts: [summenPart(solveG1(p, { index: i, fehlertyp }))] });
    }
  });
  return out;
}

// ---------- Erzeugung ----------

function betragFuer(rng: Rng, v: VorfallG1, krumm: boolean): string {
  const [min, max, step] = v.bereich;
  return betrag(rng, min, max, step, krumm);
}

const AUS_BETRAEGE = VORFAELLE_G1.filter(
  (v) =>
    v.seite === 'aus' && !['maschine-ziel', 'zielkauf-verbraucht', 'zielkauf-lager'].includes(v.id),
);

export function vorfallText(v: G1Vorfall, f: FirmaConfig): string {
  if (v.id === TEILVERBRAUCH.id) return TEILVERBRAUCH.text(v.betrag, v.verbrauch ?? '0', f);
  return vorfallG1(v.id).text(v.betrag, f);
}

export const g1Grundbegriffe = defineGenerator<G1Params, G1Solution>({
  skillId: 'G1-grundbegriffe',
  titel: 'Grundbegriffe des Rechnungswesens',
  variants: ['zuordnung', 'betraege'],
  points: 4,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as G1Params['variante'] | undefined) ??
      (rng.chance(0.35) ? 'betraege' : 'zuordnung');
    if (variante === 'zuordnung') {
      return retry(
        rng,
        (r) => {
          const aus = ziehe(
            r,
            VORFAELLE_G1.filter((v) => v.seite === 'aus'),
            r.int(2, 3),
          );
          const ein = ziehe(
            r,
            VORFAELLE_G1.filter((v) => v.seite === 'ein'),
            4 - aus.length,
          );
          const gewaehlt = r.shuffle([...aus, ...ein]);
          return {
            variante,
            vorfaelle: gewaehlt.map((v) => ({ id: v.id, betrag: betragFuer(r, v, krumm) })),
          } satisfies G1Params;
        },
        // Nicht nur Vorfälle, bei denen alle vier Stufen gleich sind
        (p) => p.vorfaelle.filter((v) => new Set(vorfallG1(v.id).stufen).size > 1).length >= 3,
      );
    }
    return retry(
      rng,
      (r) => {
        const kauf = betrag(r, 8_000, 40_000, 1_000, krumm);
        const anteil = r.pick([0.25, 0.4, 0.5, 0.6, 0.75]);
        const verbrauch = new Val(kauf).times(anteil).value.toFixed(2);
        const andere = ziehe(r, AUS_BETRAEGE, 3).map((v) => ({
          id: v.id,
          betrag: betragFuer(r, v, krumm),
        }));
        return {
          variante,
          vorfaelle: r.shuffle([{ id: TEILVERBRAUCH.id, betrag: kauf, verbrauch }, ...andere]),
        } satisfies G1Params;
      },
      // Jede Summe soll aus mindestens einem Vorfall bestehen
      (p) => solveG1(p).summen.every((x) => !x.exact.isZero()),
    );
  },
  render: (p, f) => ({
    titel: 'Auszahlung, Ausgabe, Aufwand, Kosten',
    kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
    sachverhalt: [
      `Abrechnungsperiode ist der ${MONAT}. Im Werk Paderborn fallen folgende Vorgänge an:`,
      ...p.vorfaelle.map((v, i) => `${i + 1}) ${vorfallText(v, f)}`),
    ],
    aufgabe:
      p.variante === 'zuordnung'
        ? `Prüfe für jeden Vorgang, ob im ${MONAT} eine Auszahlung, Ausgabe, ein Aufwand oder Kosten vorliegen – bei Verkäufen und Erlösen entsprechend Einzahlung, Einnahme, Ertrag oder Leistung.`
        : `Ermittle für den ${MONAT} die Summe der Auszahlungen, der Ausgaben, der Aufwendungen und der Kosten.`,
  }),
  solve: (p) => solveG1(p),
  parts,
  steps: (p, s) => {
    const out = p.vorfaelle.map((v, i) => {
      if (v.id === TEILVERBRAUCH.id) {
        return {
          titel: `Vorgang ${i + 1}`,
          ergebnis: `Auszahlung 0,00 €, Ausgabe ${eur(v.betrag)}, Aufwand und Kosten ${eur(v.verbrauch ?? '0')}`,
          erlaeuterung: TEILVERBRAUCH.begruendung,
        };
      }
      const vf = vorfallG1(v.id);
      const namen = STUFEN[vf.seite];
      return {
        titel: `Vorgang ${i + 1}`,
        ergebnis: namen.map((n, k) => `${n}: ${s.stufen[i]![k] ? JA : NEIN}`).join(', '),
        erlaeuterung: vf.begruendung,
      };
    });
    if (p.variante === 'betraege') {
      out.push({
        titel: 'Summen',
        ergebnis: SUMMEN_LABEL.map((l, k) => `${l}: ${eur(s.summen[k]!)}`).join('; '),
        erlaeuterung:
          'Jede Stufe wird für sich addiert. Kreditvorgänge trennen Auszahlung und Ausgabe, Lagervorgänge trennen Ausgabe und Aufwand, neutrale und kalkulatorische Posten trennen Aufwand und Kosten.',
      });
    }
    return out;
  },
  hints: (p) => [
    'Gehe für jeden Vorgang die Stufen nacheinander durch: Fließt Geld? Ändert sich das Geldvermögen (Kasse + Forderungen − Verbindlichkeiten)? Wird etwas verbraucht? Dient der Verbrauch dem Betrieb?',
    p.vorfaelle.some((v) =>
      ['zielkauf-lager', 'zielkauf-teilverbrauch', 'maschine-ziel'].includes(v.id),
    )
      ? 'Ein Kauf auf Ziel ist eine Ausgabe, aber noch keine Auszahlung. Aufwand entsteht erst mit dem Verbrauch.'
      : 'Bezahlt die MBG eine alte Rechnung oder tilgt sie ein Darlehen, sinkt mit dem Geld auch die Schuld: Auszahlung, aber keine Ausgabe.',
    'Spenden, Steuernachzahlungen für Vorjahre und Katastrophenschäden sind Aufwand, aber keine Kosten. Kalkulatorischer Unternehmerlohn und Eigenkapitalzinsen sind Kosten ohne Aufwand.',
  ],
  errorVariants,
  verfahren: () => 'Grundbegriffe abgrenzen (Auszahlung, Ausgabe, Aufwand, Kosten)',
});
