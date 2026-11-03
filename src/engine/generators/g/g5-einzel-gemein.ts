// G5 – Einzel- und Gemeinkosten, unechte Gemeinkosten, Sondereinzelkosten; Zusammenhang mit
// fixen und variablen Kosten (Lehrbrief K1 Kap. 1.4.2; eigene Formulierung, MBG-Beispiele).
import { FIRMA } from '../../../config';
import type { FirmaConfig } from '../../firma';
import type { ErrorVariant, RechenkettePart } from '../../task';
import { defineGenerator } from '../base';
import { auswahl, buendeln, ziehe } from './common';
import { FIX, VARIABEL } from './g4-fix-variabel';

export const EK = 'Einzelkosten';
export const SEK_F = 'Sondereinzelkosten der Fertigung';
export const SEK_V = 'Sondereinzelkosten des Vertriebs';
export const UGK = 'Unechte Gemeinkosten';
export const EGK = 'Echte Gemeinkosten';
export const ZURECHNUNG = [EK, SEK_F, SEK_V, UGK, EGK];

const EG = 'einzel-gemein-vertauscht';
const UN = 'unechte-gemeinkosten-verkannt';
const SE = 'sondereinzelkosten-verkannt';
const FV = 'fix-variabel-vertauscht';

export interface KostenartG5 {
  id: string;
  text: (f: FirmaConfig) => string;
  zurechnung: string;
  /** nur bei eindeutigem Verhalten (nicht bei Sondereinzelkosten) */
  verhalten?: string;
  begruendung: string;
  fehler: { zurechnung: string; fehlertyp: string }[];
}

export const KOSTENARTEN_G5: readonly KostenartG5[] = [
  {
    id: 'konzentrat',
    text: (f) =>
      `Fruchtsaftkonzentrat für ${f.produkte.lemon} laut Materialentnahmeschein der Charge`,
    zurechnung: EK,
    verhalten: VARIABEL,
    begruendung: 'Die Menge je Charge ist bekannt; der Betrag lässt sich direkt zurechnen.',
    fehler: [{ zurechnung: EGK, fehlertyp: EG }],
  },
  {
    id: 'braumalz',
    text: (f) => `Braumalz für den Sud des ${f.produkte.bier}`,
    zurechnung: EK,
    verhalten: VARIABEL,
    begruendung: 'Fertigungsmaterial, das je Sud gemessen wird: Einzelkosten.',
    fehler: [{ zurechnung: UGK, fehlertyp: UN }],
  },
  {
    id: 'akkordlohn',
    text: () => 'Akkordlohn der Abfüllkräfte je abgefüllter Palette',
    zurechnung: EK,
    verhalten: VARIABEL,
    begruendung: 'Der Akkordlohn wird je Palette erfasst und direkt dem Produkt zugeordnet.',
    fehler: [{ zurechnung: EGK, fehlertyp: EG }],
  },
  {
    id: 'leim',
    text: () => 'Leim für die Etiketten',
    zurechnung: UGK,
    verhalten: VARIABEL,
    begruendung:
      'Man könnte den Leim je Flasche abwiegen, doch der Aufwand stünde in keinem Verhältnis: unechte Gemeinkosten.',
    fehler: [
      { zurechnung: EK, fehlertyp: UN },
      { zurechnung: EGK, fehlertyp: UN },
    ],
  },
  {
    id: 'co2',
    text: () => 'Kohlensäure, die nur für die ganze Abfüllanlage gemessen wird',
    zurechnung: UGK,
    verhalten: VARIABEL,
    begruendung:
      'Der Verbrauch hängt von jeder einzelnen Dose ab, wird aber aus Kostengründen nicht je Sorte gemessen: unechte Gemeinkosten.',
    fehler: [{ zurechnung: EGK, fehlertyp: UN }],
  },
  {
    id: 'folie',
    text: () => 'Schrumpffolie für die Paletten, als Rolle für alle Sorten verbraucht',
    zurechnung: UGK,
    verhalten: VARIABEL,
    begruendung:
      'Grundsätzlich je Palette zurechenbar, die genaue Erfassung lohnt sich aber nicht: unechte Gemeinkosten.',
    fehler: [{ zurechnung: EK, fehlertyp: UN }],
  },
  {
    id: 'werkleitung',
    text: () => 'Gehalt der Werkleiterin',
    zurechnung: EGK,
    verhalten: FIX,
    begruendung:
      'Sie arbeitet für alle Sorten zugleich; eine direkte Zurechnung ist nicht möglich.',
    fehler: [{ zurechnung: EK, fehlertyp: EG }],
  },
  {
    id: 'miete',
    text: () => 'Miete der Lagerhalle im Logistikzentrum',
    zurechnung: EGK,
    verhalten: FIX,
    begruendung:
      'Die Halle dient allen Produkten; die Miete muss über einen Schlüssel verteilt werden.',
    fehler: [{ zurechnung: UGK, fehlertyp: UN }],
  },
  {
    id: 'versicherung',
    text: () => 'Feuerversicherung des Werks',
    zurechnung: EGK,
    verhalten: FIX,
    begruendung: 'Versicherungsprämien betreffen den ganzen Betrieb: echte Gemeinkosten.',
    fehler: [{ zurechnung: EK, fehlertyp: EG }],
  },
  {
    id: 'afa-anlage',
    text: () => 'Zeitabhängige Abschreibung der Abfüllanlage, auf der alle Sorten laufen',
    zurechnung: EGK,
    verhalten: FIX,
    begruendung:
      'Die Anlage arbeitet für alle Sorten; der Wertverzehr ist keiner Dose direkt zuzuordnen.',
    fehler: [{ zurechnung: EK, fehlertyp: EG }],
  },
  {
    id: 'ruesten',
    text: (f) =>
      `Umrüsten der Abfüllanlage auf eine Sonderflasche für einen Auftrag von ${f.kunden[2]}`,
    zurechnung: SEK_F,
    begruendung:
      'Die Rüstkosten entstehen nur für diesen einen Auftrag, nicht für die einzelne Flasche: Sondereinzelkosten der Fertigung.',
    fehler: [
      { zurechnung: EGK, fehlertyp: SE },
      { zurechnung: SEK_V, fehlertyp: SE },
    ],
  },
  {
    id: 'druckplatte',
    text: (f) => `Druckplatte für ein eigenes Etikett im Auftrag von ${f.kunden[2]}`,
    zurechnung: SEK_F,
    begruendung:
      'Die Druckplatte wird nur für diesen Auftrag gebraucht und ihm ganz zugerechnet: Sondereinzelkosten der Fertigung.',
    fehler: [{ zurechnung: EGK, fehlertyp: SE }],
  },
  {
    id: 'ausgangsfracht',
    text: (f) => `Ausgangsfracht für die Lieferung an ${f.kunden[0]}`,
    zurechnung: SEK_V,
    begruendung:
      'Die Fracht gehört zu genau dieser Lieferung, entsteht aber im Vertrieb: Sondereinzelkosten des Vertriebs.',
    fehler: [
      { zurechnung: SEK_F, fehlertyp: SE },
      { zurechnung: EGK, fehlertyp: SE },
    ],
  },
  {
    id: 'geschenkkarton',
    text: (f) =>
      `Spezialverpackung (Geschenkkartons) für einen Weihnachtsauftrag von ${f.kunden[1]}`,
    zurechnung: SEK_V,
    begruendung:
      'Die Spezialverpackung fällt nur für diesen Auftrag an: Sondereinzelkosten des Vertriebs.',
    fehler: [{ zurechnung: EK, fehlertyp: SE }],
  },
];

const KA = new Map(KOSTENARTEN_G5.map((k) => [k.id, k]));
export function kostenartG5(id: string): KostenartG5 {
  const k = KA.get(id);
  if (!k) throw new Error(`Unbekannte Kostenart ${id}`);
  return k;
}

export interface G5Params {
  variante: 'zuordnung' | 'zusammenhang';
  kostenarten: string[];
}

export interface G5Solution {
  zurechnung: string[];
  verhalten: (string | null)[];
}

export function solveG5(p: G5Params): G5Solution {
  return {
    zurechnung: p.kostenarten.map((id) => kostenartG5(id).zurechnung),
    verhalten: p.kostenarten.map((id) =>
      p.variante === 'zusammenhang' ? (kostenartG5(id).verhalten ?? null) : null,
    ),
  };
}

function part(p: G5Params, f: FirmaConfig = FIRMA): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'zuordnung',
    titel:
      p.variante === 'zusammenhang'
        ? 'Zurechenbarkeit und Verhalten bei Beschäftigungsänderung'
        : 'Zurechenbarkeit auf den Kostenträger',
    felder: p.kostenarten.flatMap((id, i) => {
      const k = kostenartG5(id);
      const name = k.text(f);
      const out = [auswahl(`z${i + 1}`, `${i + 1}) ${name}`, ZURECHNUNG, k.zurechnung)];
      if (p.variante === 'zusammenhang' && k.verhalten)
        out.push(
          auswahl(`v${i + 1}`, `${i + 1}) fix oder variabel?`, [FIX, VARIABEL], k.verhalten),
        );
      return out;
    }),
  };
}

function errorVariants(p: G5Params): ErrorVariant[] {
  const pt = part(p);
  const einzel = p.kostenarten.flatMap((id, i) =>
    kostenartG5(id).fehler.map((f) => ({
      fehlertyp: f.fehlertyp,
      feldId: `z${i + 1}`,
      soll: f.zurechnung,
    })),
  );
  if (p.variante === 'zusammenhang') {
    p.kostenarten.forEach((id, i) => {
      const v = kostenartG5(id).verhalten;
      if (v) einzel.push({ fehlertyp: FV, feldId: `v${i + 1}`, soll: v === FIX ? VARIABEL : FIX });
    });
  }
  return buendeln(pt, einzel);
}

export const g5EinzelGemein = defineGenerator<G5Params, G5Solution>({
  skillId: 'G5-einzel-gemein',
  titel: 'Einzel- und Gemeinkosten',
  variants: ['zuordnung', 'zusammenhang'],
  points: 4,
  generate: (rng, opts = {}) => {
    const variante =
      (opts.variant as G5Params['variante'] | undefined) ??
      (rng.chance(0.4) ? 'zusammenhang' : 'zuordnung');
    const von = (z: string) => KOSTENARTEN_G5.filter((k) => k.zurechnung === z);
    let gewaehlt: KostenartG5[];
    if (variante === 'zuordnung') {
      const sek = rng.chance(0.5) ? von(SEK_F) : von(SEK_V);
      gewaehlt = [
        ...ziehe(rng, von(EK), 1),
        ...ziehe(rng, von(UGK), 1),
        ...ziehe(rng, von(EGK), 2),
        ...ziehe(rng, sek, 1),
      ];
    } else {
      gewaehlt = [
        ...ziehe(rng, von(EK), 1),
        ...ziehe(rng, von(UGK), 1),
        ...ziehe(rng, von(EGK), 2),
      ];
    }
    return { variante, kostenarten: rng.shuffle(gewaehlt).map((k) => k.id) };
  },
  render: (p, f) => ({
    titel: 'Einzel- und Gemeinkosten',
    kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
    sachverhalt: [
      'Das Controlling prüft, welche Kosten sich einem Kostenträger (einer Charge, einem Auftrag) direkt zurechnen lassen:',
      ...p.kostenarten.map((id, i) => `${i + 1}) ${kostenartG5(id).text(f)}`),
    ],
    aufgabe:
      p.variante === 'zusammenhang'
        ? 'Ordne jede Kostenart nach ihrer Zurechenbarkeit zu und gib an, ob sie sich bei Beschäftigungsänderungen fix oder variabel verhält.'
        : 'Ordne jede Kostenart zu: Einzelkosten, Sondereinzelkosten der Fertigung oder des Vertriebs, unechte oder echte Gemeinkosten.',
  }),
  solve: solveG5,
  parts: (p) => [part(p)],
  steps: (p, s) =>
    p.kostenarten.map((id, i) => {
      const k = kostenartG5(id);
      return {
        titel: `Kostenart ${i + 1}`,
        ergebnis: s.verhalten[i] ? `${k.zurechnung}, ${s.verhalten[i]}` : k.zurechnung,
        erlaeuterung: k.begruendung,
      };
    }),
  hints: (p) => [
    'Frage je Kostenart: Lässt sich der Betrag ohne Schlüssel einer einzelnen Charge oder einem Auftrag zuordnen?',
    'Unechte Gemeinkosten wären eigentlich zurechenbar, aber die Erfassung je Stück lohnt sich nicht. Sondereinzelkosten gehören zu einem Auftrag, nicht zum einzelnen Stück.',
    p.variante === 'zusammenhang'
      ? 'Einzelkosten und unechte Gemeinkosten sind variabel; fixe Kosten sind regelmäßig (echte) Gemeinkosten.'
      : 'Rüstkosten und Sonderwerkzeuge: Fertigung. Ausgangsfrachten und Spezialverpackungen: Vertrieb.',
  ],
  errorVariants,
  verfahren: () => 'Einzel- und Gemeinkosten unterscheiden (Zurechenbarkeit auf Kostenträger)',
});
