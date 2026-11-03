// A3 – Kontenarten: Konten zuordnen, Seite von Zugang/Abgang, Kontostand mit Anfangsbestand,
// Saldo im T-Konto (BA 2.3.1.4, 2.3.2.1; eigene Formulierung und Zahlen). Spezifikation: docs/m7/a.md.
import { FIRMA } from '../../../config';
import { getKonto } from '../../accounts';
import { Val, sum } from '../../money';
import type { Rng } from '../../rng';
import type {
  ErrorVariant,
  Feld,
  GenOptions,
  RechenkettePart,
  SolutionStep,
  TaskPart,
  TaskText,
  TKontoPart,
} from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, retry } from '../base';
import {
  AKTIVKONTO,
  AUFWANDSKONTO,
  BANK,
  DARLEHEN,
  ERTRAGSKONTO,
  FORD,
  KASSE,
  KONTENART_LABEL,
  KONTENARTEN,
  PASSIVKONTO,
  SEITEN,
  SOLL,
  VERB,
  auswahl,
  auswahlVarianten,
  gegenseite,
  istBestandskonto,
  kontenart,
  saldoSeite,
  zugangsSeite,
  type Kontenart,
  type Seite,
} from './gemeinsam';

const AP = 'a-aktiv-passiv-vertauscht';
const AE = 'a-aufwand-ertrag-vertauscht';
const BE = 'a-bestand-erfolg-verwechselt';
const KS = 'a-kontoseite-vertauscht';
const SS = 'a-saldo-seite';
const AA = 'a-abgaenge-addiert';
const AV = 'a-anfangsbestand-vergessen';
const ZA = 'a-zugang-abgang-verwechselt';
const SU = 'a-summe-statt-saldo';

// ---------- Kontenkatalog für die Zuordnung ----------

export interface KatalogKonto {
  konto: string;
  /** typische falsche Kontenart und der zugrunde liegende Denkfehler */
  falsch: string;
  fehlertyp: string;
  warum: string;
}

const KATALOG: readonly KatalogKonto[] = [
  {
    konto: 'Technische Anlagen und Maschinen',
    falsch: PASSIVKONTO,
    fehlertyp: AP,
    warum: 'Die Abfüllanlage gehört der MBG und wird jahrelang genutzt: Vermögen.',
  },
  {
    konto: 'Betriebs- und Geschäftsausstattung',
    falsch: AUFWANDSKONTO,
    fehlertyp: BE,
    warum: 'Schreibtische und Regale werden über Jahre genutzt: Vermögen, kein Aufwand.',
  },
  {
    konto: 'Fuhrpark',
    falsch: PASSIVKONTO,
    fehlertyp: AP,
    warum: 'Gabelstapler und Lkw gehören der MBG: Vermögen.',
  },
  {
    konto: 'Rohstoffe',
    falsch: AUFWANDSKONTO,
    fehlertyp: BE,
    warum:
      'Die Aromen im Lager sind Vermögen. Erst ihr Verbrauch ist Aufwand (Aufwendungen für Rohstoffe).',
  },
  {
    konto: 'Hilfsstoffe',
    falsch: AUFWANDSKONTO,
    fehlertyp: BE,
    warum: 'Dosen und Etiketten auf Lager sind Vermögen; Aufwand wird erst ihr Verbrauch.',
  },
  {
    konto: 'Fertige Erzeugnisse',
    falsch: ERTRAGSKONTO,
    fehlertyp: BE,
    warum:
      'Abgefüllte Ware im Logistikzentrum ist Vermögen. Ertrag entsteht erst beim Verkauf (Umsatzerlöse).',
  },
  {
    konto: FORD,
    falsch: PASSIVKONTO,
    fehlertyp: AP,
    warum: 'Kunden schulden der MBG Geld – ein Anspruch und damit Vermögen.',
  },
  {
    konto: 'Vorsteuer',
    falsch: AUFWANDSKONTO,
    fehlertyp: BE,
    warum: 'Die Vorsteuer erstattet das Finanzamt: eine Forderung, also ein Aktivkonto.',
  },
  {
    konto: BANK,
    falsch: PASSIVKONTO,
    fehlertyp: AP,
    warum: 'Das Bankguthaben gehört der MBG: Vermögen.',
  },
  {
    konto: KASSE,
    falsch: PASSIVKONTO,
    fehlertyp: AP,
    warum: 'Bargeld in der Kasse ist Vermögen.',
  },
  {
    konto: 'Eigenkapital',
    falsch: AKTIVKONTO,
    fehlertyp: AP,
    warum:
      'Das Eigenkapital zeigt, welche Mittel die Gesellschafter bereitstellen. Es steht auf der Passivseite.',
  },
  {
    konto: DARLEHEN,
    falsch: AKTIVKONTO,
    fehlertyp: AP,
    warum:
      'Ein Darlehen ist eine Schuld gegenüber der Bank – auch wenn das ausgezahlte Geld auf dem Bankkonto liegt.',
  },
  {
    konto: VERB,
    falsch: AKTIVKONTO,
    fehlertyp: AP,
    warum: 'Offene Rechnungen von Lieferanten sind Schulden: Passivkonto.',
  },
  {
    konto: 'Umsatzsteuer',
    falsch: ERTRAGSKONTO,
    fehlertyp: BE,
    warum:
      'Die Umsatzsteuer kassiert die MBG mit dem Verkaufspreis, schuldet sie aber dem Finanzamt: eine Verbindlichkeit, kein Ertrag.',
  },
  {
    konto: 'Sonstige Verbindlichkeiten',
    falsch: AKTIVKONTO,
    fehlertyp: AP,
    warum: 'Verbindlichkeiten sind Schulden: Passivkonto.',
  },
  {
    konto: 'Aufwendungen für Rohstoffe',
    falsch: AKTIVKONTO,
    fehlertyp: BE,
    warum: 'Verbrauchte Aromen sind weg: Werteverzehr, also Aufwand.',
  },
  {
    konto: 'Löhne',
    falsch: PASSIVKONTO,
    fehlertyp: BE,
    warum: 'Löhne sind der Werteverzehr für die Arbeit im Werk – Aufwand, keine Schuld.',
  },
  {
    konto: 'Gehälter',
    falsch: PASSIVKONTO,
    fehlertyp: BE,
    warum:
      'Gehälter mindern als Aufwand den Erfolg; eine Schuld entsteht erst, wenn sie offen sind.',
  },
  {
    konto: 'Mietaufwendungen',
    falsch: ERTRAGSKONTO,
    fehlertyp: AE,
    warum: 'Die MBG zahlt Miete für eine Lagerhalle: Aufwand. Mieterträge hätte der Vermieter.',
  },
  {
    konto: 'Zinsaufwendungen',
    falsch: ERTRAGSKONTO,
    fehlertyp: AE,
    warum: 'Zinsen für das Darlehen muss die MBG bezahlen: Aufwand.',
  },
  {
    konto: 'Werbung',
    falsch: AKTIVKONTO,
    fehlertyp: BE,
    warum: 'Eine Anzeige ist nach dem Erscheinen verbraucht: Aufwand, kein Vermögen.',
  },
  {
    konto: 'Abschreibungen auf Sachanlagen',
    falsch: PASSIVKONTO,
    fehlertyp: BE,
    warum: 'Abschreibungen erfassen den Wertverlust der Anlagen: Aufwand.',
  },
  {
    konto: 'Büromaterial',
    falsch: AKTIVKONTO,
    fehlertyp: BE,
    warum: 'Papier und Toner werden laufend verbraucht und als Aufwand gebucht.',
  },
  {
    konto: 'Umsatzerlöse für eigene Erzeugnisse',
    falsch: AKTIVKONTO,
    fehlertyp: BE,
    warum: 'Umsatzerlöse sind der Wertzuwachs aus dem Verkauf: Ertrag, kein Bestand.',
  },
  {
    konto: 'Umsatzerlöse für Handelswaren',
    falsch: AKTIVKONTO,
    fehlertyp: BE,
    warum: 'Erlöse aus dem Weinverkauf sind Ertrag der Periode.',
  },
  {
    konto: 'Zinserträge',
    falsch: AUFWANDSKONTO,
    fehlertyp: AE,
    warum: 'Zinsen, die die Bank der MBG gutschreibt, sind Ertrag.',
  },
  {
    konto: 'Mieterträge',
    falsch: AUFWANDSKONTO,
    fehlertyp: AE,
    warum: 'Vermietet die MBG eine Fläche, erhält sie Miete: Ertrag.',
  },
  {
    konto: 'Provisionserträge',
    falsch: AUFWANDSKONTO,
    fehlertyp: AE,
    warum: 'Eine Provision, die die MBG erhält, ist Ertrag.',
  },
];

export function katalog(konto: string): KatalogKonto {
  const k = KATALOG.find((x) => x.konto === konto);
  if (!k) throw new Error(`Konto nicht im Katalog: ${konto}`);
  return k;
}

// ---------- Vorlagen für Kontostand und T-Konto ----------

export interface Bewegung {
  text: string;
  gegen: string;
}

export interface KontoVorlage {
  konto: string;
  /** Spanne des Anfangsbestands (nur Bestandskonten) */
  ab?: [number, number, number];
  betrag: [number, number, number];
  zugang: Bewegung[];
  abgang: Bewegung[];
}

const P = FIRMA.produkte;
const UE = 'Umsatzerlöse für eigene Erzeugnisse';
const AR = 'Aufwendungen für Rohstoffe';

export const BESTAND_VORLAGEN: readonly KontoVorlage[] = [
  {
    konto: BANK,
    ab: [20_000, 90_000, 1_000],
    betrag: [1_000, 18_000, 100],
    zugang: [
      { text: 'Ein Kunde überweist eine offene Rechnung.', gegen: FORD },
      { text: 'Die Sparkasse zahlt ein Darlehen aus.', gegen: DARLEHEN },
      { text: 'Die Tageseinnahmen aus der Kasse werden eingezahlt.', gegen: KASSE },
    ],
    abgang: [
      { text: 'Die Miete für die Lagerhalle wird überwiesen.', gegen: 'Mietaufwendungen' },
      { text: 'Eine Lieferantenrechnung wird per Überweisung bezahlt.', gegen: VERB },
      { text: 'Die Löhne für das Werk werden überwiesen.', gegen: 'Löhne' },
    ],
  },
  {
    konto: KASSE,
    ab: [1_000, 6_000, 100],
    betrag: [100, 1_500, 10],
    zugang: [
      { text: 'Bargeld wird vom Bankkonto abgehoben.', gegen: BANK },
      { text: 'Ein Gastronom begleicht eine kleine Rechnung bar.', gegen: FORD },
      { text: 'Im Werksverkauf wird bar verkauft.', gegen: UE },
    ],
    abgang: [
      { text: 'Büromaterial wird bar bezahlt.', gegen: 'Büromaterial' },
      { text: 'Eine Anzeige im Lokalblatt wird bar bezahlt.', gegen: 'Werbung' },
      { text: 'Ein Teil des Bargelds wird zur Bank gebracht.', gegen: BANK },
    ],
  },
  {
    konto: 'Rohstoffe',
    ab: [20_000, 70_000, 1_000],
    betrag: [2_000, 15_000, 500],
    zugang: [
      { text: 'Zitronenaroma wird auf Ziel eingekauft.', gegen: VERB },
      { text: 'Kräuteraroma wird gekauft und sofort überwiesen.', gegen: BANK },
      { text: 'Aromakonzentrat wird auf Rechnung geliefert.', gegen: VERB },
    ],
    abgang: [
      { text: 'Aromen werden für die Produktion entnommen.', gegen: AR },
      { text: 'Aromakonzentrat wandert in den Sirupkessel (Verbrauch).', gegen: AR },
      { text: 'Kräuteraroma wird für eine Charge verbraucht.', gegen: AR },
    ],
  },
  {
    konto: FORD,
    ab: [15_000, 60_000, 1_000],
    betrag: [1_500, 14_000, 100],
    zugang: [
      { text: `„${P.lemon}“ wird auf Ziel an einen Getränkemarkt geliefert.`, gegen: UE },
      { text: `„${P.energy}“ geht auf Rechnung an ein Hotel.`, gegen: UE },
      { text: `„${P.bier}“ wird auf Ziel an einen Großhändler verkauft.`, gegen: UE },
    ],
    abgang: [
      { text: 'Ein Kunde überweist seine Rechnung.', gegen: BANK },
      { text: 'Ein Gastronom gleicht seine Rechnung per Überweisung aus.', gegen: BANK },
      { text: 'Ein Kunde bezahlt seine Rechnung bar.', gegen: KASSE },
    ],
  },
  {
    konto: VERB,
    ab: [15_000, 60_000, 1_000],
    betrag: [1_500, 14_000, 100],
    zugang: [
      { text: 'Dosen werden auf Ziel geliefert.', gegen: 'Hilfsstoffe' },
      { text: 'Etiketten werden auf Rechnung eingekauft.', gegen: 'Hilfsstoffe' },
      { text: 'Ein gebrauchter Gabelstapler wird auf Ziel gekauft.', gegen: 'Fuhrpark' },
    ],
    abgang: [
      { text: 'Eine Lieferantenrechnung wird überwiesen.', gegen: BANK },
      { text: 'Eine Lieferantenschuld wird in ein Darlehen umgewandelt.', gegen: DARLEHEN },
      { text: 'Die Rechnung der Etikettendruckerei wird per Bank bezahlt.', gegen: BANK },
    ],
  },
  {
    konto: DARLEHEN,
    ab: [60_000, 240_000, 5_000],
    betrag: [5_000, 40_000, 1_000],
    zugang: [
      { text: 'Die Sparkasse zahlt ein weiteres Darlehen aus.', gegen: BANK },
      { text: 'Eine Lieferantenschuld wird in ein Darlehen umgewandelt.', gegen: VERB },
      { text: 'Für die neue Abfülllinie wird ein Kredit aufgenommen.', gegen: BANK },
    ],
    abgang: [
      { text: 'Eine Tilgungsrate wird überwiesen.', gegen: BANK },
      { text: 'Eine Sondertilgung wird per Bank geleistet.', gegen: BANK },
      { text: 'Die Halbjahrestilgung wird vom Bankkonto abgebucht.', gegen: BANK },
    ],
  },
];

export const ERFOLG_VORLAGEN: readonly KontoVorlage[] = [
  {
    konto: 'Mietaufwendungen',
    betrag: [1_500, 6_000, 100],
    zugang: [
      { text: 'Miete Lagerhalle', gegen: BANK },
      { text: 'Miete Stellplätze', gegen: BANK },
      { text: 'Miete Messestand', gegen: KASSE },
    ],
    abgang: [{ text: 'Erstattung zu viel gezahlter Miete', gegen: BANK }],
  },
  {
    konto: 'Löhne',
    betrag: [8_000, 30_000, 100],
    zugang: [
      { text: 'Löhne Abfüllung', gegen: BANK },
      { text: 'Löhne Sirupkeller', gegen: BANK },
      { text: 'Löhne Logistik', gegen: BANK },
    ],
    abgang: [],
  },
  {
    konto: 'Werbung',
    betrag: [300, 4_000, 50],
    zugang: [
      { text: 'Plakate', gegen: BANK },
      { text: 'Anzeige', gegen: KASSE },
      { text: 'Messeprospekte', gegen: VERB },
    ],
    abgang: [{ text: 'Gutschrift der Agentur', gegen: VERB }],
  },
  {
    konto: UE,
    betrag: [3_000, 25_000, 100],
    zugang: [
      { text: 'Verkauf auf Ziel', gegen: FORD },
      { text: 'Verkauf gegen Überweisung', gegen: BANK },
      { text: 'Werksverkauf bar', gegen: KASSE },
    ],
    abgang: [{ text: 'Rücksendung (Storno)', gegen: FORD }],
  },
  {
    konto: 'Zinserträge',
    betrag: [100, 2_500, 10],
    zugang: [
      { text: 'Zinsgutschrift Festgeld', gegen: BANK },
      { text: 'Zinsgutschrift Tagesgeld', gegen: BANK },
    ],
    abgang: [],
  },
  {
    konto: 'Mieterträge',
    betrag: [400, 3_000, 50],
    zugang: [
      { text: 'Untervermietung Lagerfläche', gegen: BANK },
      { text: 'Vermietung Stellplätze', gegen: BANK },
    ],
    abgang: [],
  },
];

// ---------- Parameter und Lösung ----------

export type A3Variante = 'zuordnen' | 'seiten' | 'kontostand' | 'tkonto';

export type Vorgang = 'ab' | 'zugang' | 'abgang' | 'saldo';

export interface A3Bewegung {
  text: string;
  gegen: string;
  zugang: boolean;
  betrag: string;
}

export interface A3Params {
  variante: A3Variante;
  /** zuordnen */
  konten: string[];
  /** seiten */
  seiten: { konto: string; vorgang: Vorgang }[];
  /** kontostand und tkonto */
  konto: string;
  ab: string;
  bewegungen: A3Bewegung[];
}

export interface A3Solution {
  arten: string[];
  seiten: Seite[];
  art: Kontenart;
  zugaenge: Val;
  abgaenge: Val;
  saldo: Val;
  /** Summe der größeren Kontoseite (Kontosumme) */
  kontosumme: Val;
  seiteAB: Seite;
  seiteSaldo: Seite;
}

export function vorgangsSeite(art: Kontenart, vorgang: Vorgang): Seite {
  switch (vorgang) {
    case 'ab':
    case 'zugang':
      return zugangsSeite(art);
    case 'abgang':
      return gegenseite(zugangsSeite(art));
    case 'saldo':
      return saldoSeite(art);
  }
}

export function solveKontenarten(p: A3Params): A3Solution {
  const art = p.variante === 'kontostand' || p.variante === 'tkonto' ? kontenart(p.konto) : 'aktiv';
  const zugaenge = sum(p.bewegungen.filter((b) => b.zugang).map((b) => b.betrag));
  const abgaenge = sum(p.bewegungen.filter((b) => !b.zugang).map((b) => b.betrag));
  const zugangsSumme = new Val(p.ab).plus(zugaenge);
  const saldo = zugangsSumme.minus(abgaenge);
  return {
    arten: p.konten.map((k) => KONTENART_LABEL[kontenart(k)]),
    seiten: p.seiten.map((s) => vorgangsSeite(kontenart(s.konto), s.vorgang)),
    art,
    zugaenge,
    abgaenge,
    saldo,
    kontosumme: zugangsSumme,
    seiteAB: zugangsSeite(art),
    seiteSaldo: saldoSeite(art),
  };
}

// ---------- Texte ----------

function vorgangText(art: Kontenart, v: Vorgang): string {
  if (istBestandskonto(art)) {
    return {
      ab: 'Anfangsbestand',
      zugang: 'Zugang (der Bestand nimmt zu)',
      abgang: 'Abgang (der Bestand nimmt ab)',
      saldo: 'Schlussbestand',
    }[v];
  }
  return {
    ab: 'Anfangsbestand',
    zugang:
      art === 'aufwand'
        ? 'neuer Aufwand (das Konto nimmt zu)'
        : 'neuer Ertrag (das Konto nimmt zu)',
    abgang: 'Minderung (z. B. Gutschrift oder Storno)',
    saldo: 'Saldo beim Abschluss',
  }[v];
}

function kurz(konto: string): string {
  return getKonto(konto).kurz;
}

// ---------- Teile ----------

function zuordnenPart(p: A3Params, s: A3Solution): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'kontenarten',
    titel: 'Kontenart',
    felder: p.konten.map((k, i) => auswahl(`k${i}`, k, KONTENARTEN, s.arten[i]!)),
  };
}

function seitenPart(p: A3Params, s: A3Solution): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'seiten',
    titel: 'Soll oder Haben?',
    felder: p.seiten.map((x, i) =>
      auswahl(
        `s${i}`,
        `${kurz(x.konto)}: ${vorgangText(kontenart(x.konto), x.vorgang)}`,
        SEITEN,
        s.seiten[i]!,
      ),
    ),
  };
}

interface KontostandWerte {
  art: string;
  seiteAB: Seite;
  zugaenge: Val;
  abgaenge: Val;
  saldo: Val;
  seiteSaldo: Seite;
}

function werteAus(s: A3Solution): KontostandWerte {
  return {
    art: KONTENART_LABEL[s.art],
    seiteAB: s.seiteAB,
    zugaenge: s.zugaenge,
    abgaenge: s.abgaenge,
    saldo: s.saldo,
    seiteSaldo: s.seiteSaldo,
  };
}

function kontostandPart(w: KontostandWerte): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'kontostand',
    titel: 'Kontostand ermitteln',
    felder: [
      auswahl('art', 'Kontenart', KONTENARTEN, w.art),
      auswahl('seiteAB', 'Seite des Anfangsbestands', SEITEN, w.seiteAB),
      feld('zugaenge', 'Summe der Zugänge', w.zugaenge),
      feld('abgaenge', 'Summe der Abgänge', w.abgaenge),
      feld('saldo', 'Schlussbestand', w.saldo),
      auswahl('seiteSaldo', 'Seite des Schlussbestands im Konto', SEITEN, w.seiteSaldo),
    ],
  };
}

function tkontoPart(p: A3Params, w: { art: string; saldo: Val; seite: Seite }): TKontoPart {
  const art = kontenart(p.konto);
  const zSeite = zugangsSeite(art);
  const eintraege = {
    soll: [] as { text: string; betrag: string }[],
    haben: [] as { text: string; betrag: string }[],
  };
  const seiteKey = (s: Seite) => (s === SOLL ? 'soll' : 'haben');
  if (istBestandskonto(art)) eintraege[seiteKey(zSeite)].push({ text: 'EBK', betrag: p.ab });
  for (const b of p.bewegungen) {
    const s = b.zugang ? zSeite : gegenseite(zSeite);
    eintraege[seiteKey(s)].push({ text: kurz(b.gegen), betrag: b.betrag });
  }
  const felder: Feld[] = [
    auswahl('art', 'Kontenart', KONTENARTEN, w.art),
    feld('saldo', istBestandskonto(art) ? 'Saldo (Schlussbestand)' : 'Saldo', w.saldo),
    auswahl('seite', 'Seite, auf der der Saldo eingetragen wird', SEITEN, w.seite),
  ];
  return {
    typ: 'tkonto',
    id: 'tkonto',
    titel: `Konto ${kurz(p.konto)}`,
    konto: p.konto,
    soll: eintraege.soll,
    haben: eintraege.haben,
    felder,
  };
}

function parts(p: A3Params, s: A3Solution): TaskPart[] {
  switch (p.variante) {
    case 'zuordnen':
      return [zuordnenPart(p, s)];
    case 'seiten':
      return [seitenPart(p, s)];
    case 'kontostand':
      return [kontostandPart(werteAus(s))];
    case 'tkonto':
      return [tkontoPart(p, { art: KONTENART_LABEL[s.art], saldo: s.saldo, seite: s.seiteSaldo })];
  }
}

// ---------- Fehlervarianten ----------

function variants(p: A3Params): ErrorVariant[] {
  const s = solveKontenarten(p);
  switch (p.variante) {
    case 'zuordnen':
      return auswahlVarianten(
        zuordnenPart(p, s),
        p.konten.map((k, i) => {
          const kat = katalog(k);
          return { fehlertyp: kat.fehlertyp, feldId: `k${i}`, soll: kat.falsch };
        }),
      );
    case 'seiten':
      return auswahlVarianten(
        seitenPart(p, s),
        p.seiten.map((x, i) => ({
          fehlertyp: x.vorgang === 'saldo' ? SS : KS,
          feldId: `s${i}`,
          soll: gegenseite(s.seiten[i]!),
        })),
      );
    case 'kontostand': {
      const w = werteAus(s);
      const out: ErrorVariant[] = [];
      const add = (fehlertyp: string, x: Partial<KontostandWerte>) =>
        out.push({ fehlertyp, parts: [kontostandPart({ ...w, ...x })] });
      const gegenArt = s.art === 'aktiv' ? PASSIVKONTO : AKTIVKONTO;
      add(AP, {
        art: gegenArt,
        seiteAB: gegenseite(w.seiteAB),
        seiteSaldo: gegenseite(w.seiteSaldo),
      });
      add(SS, { seiteSaldo: w.seiteAB });
      add(AA, { saldo: new Val(p.ab).plus(s.zugaenge).plus(s.abgaenge) });
      const ohneAB = s.zugaenge.minus(s.abgaenge);
      if (ohneAB.exact.gt(0)) add(AV, { saldo: ohneAB });
      const vertauscht = new Val(p.ab).minus(s.zugaenge).plus(s.abgaenge);
      if (vertauscht.exact.gt(0))
        add(ZA, { zugaenge: s.abgaenge, abgaenge: s.zugaenge, saldo: vertauscht });
      return out;
    }
    case 'tkonto': {
      const base = { art: KONTENART_LABEL[s.art], saldo: s.saldo, seite: s.seiteSaldo };
      const kat = katalog(p.konto);
      const out: ErrorVariant[] = [
        { fehlertyp: SS, parts: [tkontoPart(p, { ...base, seite: s.seiteAB })] },
        { fehlertyp: kat.fehlertyp, parts: [tkontoPart(p, { ...base, art: kat.falsch })] },
      ];
      if (s.abgaenge.exact.gt(0))
        out.push({ fehlertyp: SU, parts: [tkontoPart(p, { ...base, saldo: s.kontosumme })] });
      return out;
    }
  }
}

// ---------- Render, Rechenweg, Hilfen ----------

function render(p: A3Params): TaskText {
  switch (p.variante) {
    case 'zuordnen':
      return {
        titel: 'Kontenarten zuordnen',
        kontext: 'Januar: Eröffnungsbilanz der MBG',
        sachverhalt: [
          'Jana Kröger richtet in der Buchhaltung der MBG die Konten für das neue Geschäftsjahr ein. Jedes Konto gehört zu genau einer Kontenart.',
        ],
        aufgabe: 'Ordne jedes Konto der richtigen Kontenart zu.',
      };
    case 'seiten':
      return {
        titel: 'Soll oder Haben?',
        kontext: 'Januar: erste Buchungen',
        sachverhalt: [
          'Tobias Hesse hilft in der Buchhaltung aus und fragt bei jedem Eintrag, auf welche Seite des Kontos er gehört.',
        ],
        aufgabe: 'Gib für jeden Eintrag an, auf welcher Kontoseite er steht.',
      };
    case 'kontostand':
      return {
        titel: `Kontostand ${kurz(p.konto)}`,
        kontext: 'Januar: erste Buchungen',
        sachverhalt: [
          `Das Konto ${p.konto} der MBG startet mit einem Anfangsbestand von ${eur(p.ab)}. Im Januar gibt es folgende Vorfälle:`,
        ],
        daten: {
          spalten: ['Vorfall', 'Betrag'],
          zeilen: p.bewegungen.map((b) => [b.text, eur(b.betrag)]),
        },
        aufgabe:
          'Bestimme die Kontenart, ordne Anfangs- und Schlussbestand der richtigen Kontoseite zu und ermittle den Schlussbestand zum 31.01.',
      };
    case 'tkonto':
      return {
        titel: `T-Konto ${kurz(p.konto)}`,
        kontext: 'Dezember: Jahresabschluss',
        sachverhalt: [
          `Am Jahresende zeigt das Konto ${p.konto} der MBG die abgebildeten Einträge. Neben jedem Betrag steht das Gegenkonto.`,
        ],
        aufgabe:
          'Bestimme die Kontenart und den Saldo des Kontos und gib an, auf welcher Seite der Saldo eingetragen wird.',
      };
  }
}

function steps(p: A3Params, s: A3Solution): SolutionStep[] {
  switch (p.variante) {
    case 'zuordnen':
      return p.konten.map((k, i) => ({
        titel: k,
        ergebnis: s.arten[i]!,
        erlaeuterung: katalog(k).warum,
      }));
    case 'seiten':
      return p.seiten.map((x, i) => {
        const art = kontenart(x.konto);
        return {
          titel: `${kurz(x.konto)}: ${vorgangText(art, x.vorgang)}`,
          ergebnis: s.seiten[i]!,
          erlaeuterung: `${KONTENART_LABEL[art]}: Zugänge im ${zugangsSeite(art)}, Abgänge und ${istBestandskonto(art) ? 'Schlussbestand' : 'Saldo'} im ${saldoSeite(art)}.${istBestandskonto(art) ? ` Der Anfangsbestand steht wie die Zugänge im ${zugangsSeite(art)}.` : ''}`,
        };
      });
    case 'kontostand':
    case 'tkonto': {
      const out: SolutionStep[] = [
        {
          titel: 'Kontenart',
          ergebnis: KONTENART_LABEL[s.art],
          erlaeuterung: katalog(p.konto).warum,
        },
        {
          titel: 'Seiten',
          erlaeuterung: `Zugänge${istBestandskonto(s.art) ? ' und Anfangsbestand' : ''} stehen im ${zugangsSeite(s.art)}, Abgänge im ${saldoSeite(s.art)}.`,
        },
        {
          titel: istBestandskonto(s.art) ? 'Schlussbestand' : 'Saldo',
          rechnung: `${istBestandskonto(s.art) ? `${eur(p.ab)} + ` : ''}${eur(s.zugaenge)} − ${eur(s.abgaenge)} = ${eur(s.saldo)}`,
          ergebnis: eur(s.saldo),
          erlaeuterung: `Der Saldo gleicht das Konto aus und steht deshalb auf der kleineren Seite: im ${s.seiteSaldo}. Die Kontosumme (${eur(s.kontosumme)}) ist nicht der Saldo.`,
        },
      ];
      return out;
    }
  }
}

function hints(p: A3Params, s: A3Solution): [string, string, string] {
  switch (p.variante) {
    case 'zuordnen':
      return [
        'Frage bei jedem Konto: Besitzt die MBG etwas (Vermögen), schuldet sie etwas (Kapital), verbraucht sie etwas (Aufwand) oder verdient sie etwas (Ertrag)?',
        'Bestände stehen in der Bilanz, Aufwand und Ertrag in der GuV. Vorsteuer ist eine Forderung ans Finanzamt, Umsatzsteuer eine Schuld.',
        `Lösung: ${p.konten.map((k, i) => `${kurz(k)} → ${s.arten[i]}`).join('; ')}.`,
      ];
    case 'seiten':
      return [
        'Bestimme zuerst die Kontenart. Aktiv- und Aufwandskonten nehmen im Soll zu, Passiv- und Ertragskonten im Haben.',
        'Abnahmen stehen auf der Gegenseite der Zugänge. Der Saldo (Schlussbestand) steht immer auf der Abnahmeseite.',
        `Lösung: ${p.seiten.map((x, i) => `${kurz(x.konto)} → ${s.seiten[i]}`).join('; ')}.`,
      ];
    case 'kontostand':
    case 'tkonto':
      return [
        `${kurz(p.konto)} ist ein ${KONTENART_LABEL[s.art]}. Auf welcher Seite nimmt es zu?`,
        'Addiere die Zugangsseite (mit Anfangsbestand) und ziehe die Abgänge ab. Der Saldo steht auf der kleineren Seite.',
        `Saldo ${eur(s.saldo)} im ${s.seiteSaldo}.`,
      ];
  }
}

// ---------- Erzeugung ----------

function waehleKonten(rng: Rng, n: number): string[] {
  const arten: Kontenart[] = ['aktiv', 'passiv', 'aufwand', 'ertrag'];
  const gemischt = rng.shuffle(KATALOG.map((k) => k.konto));
  const out: string[] = [];
  for (const art of arten) {
    const k = gemischt.find((x) => kontenart(x) === art && !out.includes(x));
    if (k) out.push(k);
  }
  for (const k of gemischt) {
    if (out.length >= n) break;
    if (!out.includes(k)) out.push(k);
  }
  return rng.shuffle(out);
}

function waehleSeiten(rng: Rng): A3Params['seiten'] {
  const konten = rng.shuffle(KATALOG.map((k) => k.konto));
  const bestand = konten.filter((k) => istBestandskonto(kontenart(k))).slice(0, 2);
  const erfolg = konten.filter((k) => !istBestandskonto(kontenart(k))).slice(0, 2);
  return rng.shuffle([...bestand, ...erfolg]).map((konto) => ({
    konto,
    vorgang: rng.pick(
      istBestandskonto(kontenart(konto))
        ? (['ab', 'zugang', 'abgang', 'saldo'] as const)
        : (['zugang', 'abgang', 'saldo'] as const),
    ),
  }));
}

export function bewegungen(
  rng: Rng,
  v: KontoVorlage,
  krumm: boolean,
  erfolg: boolean,
): A3Bewegung[] {
  const [min, max, step] = v.betrag;
  const nZu = erfolg ? rng.int(2, Math.min(3, v.zugang.length)) : rng.int(1, 2);
  const nAb = erfolg ? (v.abgang.length > 0 && rng.chance(0.5) ? 1 : 0) : 4 - nZu - rng.int(0, 1);
  const zu = rng.shuffle(v.zugang).slice(0, nZu);
  const ab = rng.shuffle(v.abgang).slice(0, Math.max(erfolg ? 0 : 1, nAb));
  const mk = (b: Bewegung, zugang: boolean, faktor = 1): A3Bewegung => ({
    ...b,
    zugang,
    betrag: betrag(rng, Math.round(min / faktor), Math.round(max / faktor), step, krumm),
  });
  // Minderungen bei Erfolgskonten bleiben klein (Gutschrift, Storno)
  return rng.shuffle([
    ...zu.map((b) => mk(b, true)),
    ...ab.map((b) => mk(b, false, erfolg ? 4 : 1)),
  ]);
}

function generate(rng: Rng, opts: GenOptions = {}): A3Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const v = opts.variant as A3Variante | undefined;
  const variante: A3Variante =
    v ??
    rng.pick(['zuordnen', 'zuordnen', 'seiten', 'kontostand', 'kontostand', 'tkonto'] as const);
  const leer: A3Params = { variante, konten: [], seiten: [], konto: BANK, ab: '0', bewegungen: [] };
  if (variante === 'zuordnen') return { ...leer, konten: waehleKonten(rng, 5) };
  if (variante === 'seiten') return { ...leer, seiten: waehleSeiten(rng) };
  const erfolg = variante === 'tkonto' && rng.chance(0.4);
  const vorlage = rng.pick(erfolg ? ERFOLG_VORLAGEN : BESTAND_VORLAGEN);
  const make = (r: Rng): A3Params => ({
    ...leer,
    konto: vorlage.konto,
    ab: vorlage.ab ? betrag(r, vorlage.ab[0], vorlage.ab[1], vorlage.ab[2], krumm) : '0',
    bewegungen: bewegungen(r, vorlage, krumm, erfolg),
  });
  return retry(rng, make, (p) => {
    const s = solveKontenarten(p);
    // Saldo positiv: Abgänge kleiner als die Zugangsseite
    return s.saldo.exact.gt(0);
  });
}

export const kontenarten = defineGenerator<A3Params, A3Solution>({
  skillId: 'A3-kontenarten',
  titel: 'Kontenarten',
  variants: ['zuordnen', 'seiten', 'kontostand', 'tkonto'],
  points: 2,
  generate,
  render,
  solve: solveKontenarten,
  parts,
  steps,
  hints,
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'zuordnen' || p.variante === 'seiten'
      ? 'Kontenarten bestimmen: Aktiv, Passiv, Aufwand, Ertrag und ihre Zugangsseiten'
      : 'Konto fortschreiben: Anfangsbestand + Zugänge − Abgänge = Schlussbestand',
});
