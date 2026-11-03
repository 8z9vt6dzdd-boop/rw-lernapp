// Das Geschäftsjahr der MBG (Lernversion, fiktive Zahlen) für das Firmen-Dashboard:
// Jedes abgeschlossene Kapitel (Abschnitt A–F) bucht seine Geschäftsvorfälle ins Hauptbuch.
import { satz, zeile, type ErwSatz } from './booking';
import { Hauptbuch } from './hauptbuch';
import { Decimal, type Dec } from './money';

export interface Vorfall {
  text: string;
  satz: ErwSatz;
}

const s = (soll: [string, number][], haben: [string, number][]): ErwSatz =>
  satz(
    soll.map(([k, b]) => zeile(k, b)),
    haben.map(([k, b]) => zeile(k, b)),
  );

const FORD = 'Forderungen aus Lieferungen und Leistungen';
const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';
const UE = 'Umsatzerlöse für eigene Erzeugnisse';

export const ANFANGSBESTAENDE: [string, number][] = [
  ['Technische Anlagen und Maschinen', 1_200_000],
  ['Fuhrpark', 180_000],
  ['Rohstoffe', 140_000],
  ['Fertige Erzeugnisse', 90_000],
  [FORD, 210_000],
  ['Bank', 260_000],
  ['Kasse', 5_000],
  ['Darlehensschulden', 800_000],
  [VERB, 175_000],
];

/** Geschäftsvorfälle je Kapitel (Abschnitts-ID). */
export const KAPITEL_VORFAELLE: Record<string, Vorfall[]> = {
  A: [
    {
      text: 'Ein Großhändler überweist eine offene Rechnung',
      satz: s([['Bank', 60_000]], [[FORD, 60_000]]),
    },
    {
      text: 'Tilgung eines Teils des Darlehens',
      satz: s([['Darlehensschulden', 50_000]], [['Bank', 50_000]]),
    },
  ],
  B: [
    {
      text: 'Verkauf von Energydrinks auf Ziel',
      satz: s(
        [[FORD, 476_000]],
        [
          [UE, 400_000],
          ['Umsatzsteuer', 76_000],
        ],
      ),
    },
    {
      text: 'Einkauf von Zucker und Aromen auf Ziel',
      satz: s(
        [
          ['Rohstoffe', 150_000],
          ['Vorsteuer', 28_500],
        ],
        [[VERB, 178_500]],
      ),
    },
  ],
  C: [
    {
      text: 'Rohstoffe für die Sommersaison auf Ziel',
      satz: s(
        [
          ['Rohstoffe', 120_000],
          ['Vorsteuer', 22_800],
        ],
        [[VERB, 142_800]],
      ),
    },
    {
      text: 'Bezahlung mit 2 % Skonto',
      satz: s(
        [[VERB, 142_800]],
        [
          ['Bank', 139_944],
          ['Nachlässe für Rohstoffe', 2_400],
          ['Vorsteuer', 456],
        ],
      ),
    },
  ],
  D: [
    {
      text: 'Saisonstart: Lieferungen an die Gastronomie',
      satz: s(
        [[FORD, 773_500]],
        [
          [UE, 650_000],
          ['Umsatzsteuer', 123_500],
        ],
      ),
    },
    { text: 'Kunden zahlen offene Rechnungen', satz: s([['Bank', 700_000]], [[FORD, 700_000]]) },
    {
      text: 'Löhne und Gehälter',
      satz: s(
        [
          ['Löhne', 180_000],
          ['Gehälter', 90_000],
        ],
        [['Bank', 270_000]],
      ),
    },
    {
      text: 'Privatentnahme eines Gesellschafters',
      satz: s([['Privat', 12_000]], [['Bank', 12_000]]),
    },
  ],
  E: [
    {
      text: 'Neue Abfülllinie, finanziert über ein Investitionsdarlehen',
      satz: s(
        [
          ['Technische Anlagen und Maschinen', 300_000],
          ['Vorsteuer', 57_000],
        ],
        [
          ['Darlehensschulden', 300_000],
          ['Bank', 57_000],
        ],
      ),
    },
    {
      text: 'Abschreibungen auf Anlagen und Fuhrpark',
      satz: s(
        [['Abschreibungen auf Sachanlagen', 190_000]],
        [
          ['Technische Anlagen und Maschinen', 160_000],
          ['Fuhrpark', 30_000],
        ],
      ),
    },
    {
      text: 'Mehrbestand im Tanklager (fertige Erzeugnisse)',
      satz: s([['Fertige Erzeugnisse', 15_000]], [['Bestandsveränderungen', 15_000]]),
    },
  ],
  F: [
    {
      text: 'Inventur: Rohstoffverbrauch des Jahres',
      satz: s([['Aufwendungen für Rohstoffe', 297_600]], [['Rohstoffe', 297_600]]),
    },
  ],
};

export interface MbgJahr {
  aktiva: { konto: string; betrag: Dec }[];
  passiva: { konto: string; betrag: Dec }[];
  summe: Dec;
  aufwand: { konto: string; betrag: Dec }[];
  ertrag: { konto: string; betrag: Dec }[];
  erfolg: Dec;
  vorfaelle: { abschnitt: string; text: string }[];
}

export function mbgJahr(erledigt: ReadonlySet<string>): MbgJahr {
  const hb = new Hauptbuch();
  const ekAnfang = ANFANGSBESTAENDE.reduce(
    (a, [k, b]) => (['Darlehensschulden', VERB].includes(k) ? a.minus(b) : a.plus(b)),
    new Decimal(0),
  );
  for (const [k, b] of ANFANGSBESTAENDE) hb.eroeffne(k, String(b));
  hb.eroeffne('Eigenkapital', ekAnfang);
  const vorfaelle: MbgJahr['vorfaelle'] = [];
  for (const [abschnitt, liste] of Object.entries(KAPITEL_VORFAELLE)) {
    if (!erledigt.has(abschnitt)) continue;
    for (const v of liste) {
      hb.buche(v.satz);
      vorfaelle.push({ abschnitt, text: v.text });
    }
  }
  const seiten = hb.guvSeiten();
  const aufwand = seiten.aufwand;
  const ertrag = seiten.ertrag;
  const bil = hb.abgeschlossen().bilanz();
  return {
    aktiva: bil.aktiva,
    passiva: bil.passiva,
    summe: bil.summeAktiva,
    aufwand,
    ertrag,
    erfolg: hb.erfolg(),
    vorfaelle,
  };
}
