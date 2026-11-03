// A6 – Eröffnung und Abschluss der Konten: Eröffnungsbuchungen über das EBK (auch Saldenvortrag),
// Abschluss der Bestandskonten über das SBK, der Erfolgskonten über die GuV und der GuV über das
// Eigenkapital (BA 2.3.1.6, 2.3.2.2; eigene Formulierung und Zahlen). Spezifikation: docs/m7/a.md.
import { getKonto } from '../../accounts';
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../../booking';
import { Val, sum } from '../../money';
import type { Rng } from '../../rng';
import type {
  BuchungPart,
  ErrorVariant,
  GenOptions,
  RechenkettePart,
  SolutionStep,
  TaskPart,
  TaskText,
  TKontoPart,
} from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, retry } from '../base';
import {
  BANK,
  DARLEHEN,
  EBK,
  EK,
  FORD,
  GUV,
  HABEN,
  KASSE,
  SBK,
  SEITEN,
  SOLL,
  VERB,
  abschlussKonto,
  auswahl,
  bilanzDaten,
  gegenseite,
  istBestandskonto,
  kontenart,
  saldoSeite,
  zugangsSeite,
  type Kontenart,
  type Seite,
} from './gemeinsam';
import { BESTAND_VORLAGEN, ERFOLG_VORLAGEN, bewegungen, type A3Bewegung } from './kontenarten';

const ES = 'a-eroeffnung-seiten-vertauscht';
const EU = 'a-eroeffnung-ueber-sbk';
const AR = 'a-abschluss-richtung';
const BG = 'a-bestandskonto-ueber-guv';
const ESB = 'a-erfolgskonto-ueber-sbk';
const SU = 'a-summe-statt-saldo';
const GV = 'a-guv-ergebnis-vertauscht';
const GS = 'a-guv-ueber-sbk';

const GEWINN = 'Gewinn';
const VERLUST = 'Verlust';

const OPT_EBK = 'Eröffnungsbilanzkonto (EBK)';
const OPT_SBK = 'Schlussbilanzkonto (SBK)';
const OPT_GUV = 'Gewinn- und Verlustkonto (GuV)';
const OPT_EK = 'Eigenkapital';
const OPTION: Record<string, string> = {
  [EBK]: OPT_EBK,
  [SBK]: OPT_SBK,
  [GUV]: OPT_GUV,
  [EK]: OPT_EK,
};

// ---------- Parameter und Lösung ----------

export type A6Variante = 'eroeffnung' | 'bestandskonto' | 'erfolgskonto' | 'guv';

export interface Posten {
  konto: string;
  betrag: string;
}

export interface A6Params {
  variante: A6Variante;
  /** eroeffnung */
  aktiva: Posten[];
  passiva: Posten[];
  /** bestandskonto, erfolgskonto */
  konto: string;
  ab: string;
  bewegungen: A3Bewegung[];
  /** guv: Salden der Erfolgskonten */
  salden: Posten[];
}

export interface A6Solution {
  /** eroeffnung: Bilanzsumme = Summe des EBK */
  summe: Val;
  /** Konto: Saldo, Seite, Kontosumme */
  saldo: Val;
  seite: Seite;
  kontosumme: Val;
  /** guv */
  aufwand: Val;
  ertrag: Val;
  erfolg: Val;
  ergebnis: string;
  buchung: BuchungsLoesung;
}

interface Abweichung {
  /** Gegenkonto bei Eröffnung oder Abschluss */
  gegen?: string;
  /** Seiten vertauscht */
  umgekehrt?: boolean;
  /** Kontosumme statt Saldo */
  summeStattSaldo?: boolean;
  /** GuV: Aufwandskonten falsch herum abgeschlossen */
  aufwandUmgekehrt?: boolean;
  /** GuV: Ergebnis falsch herum ins Eigenkapital */
  ergebnisUmgekehrt?: boolean;
  /** GuV: Gegenkonto für den Abschluss der GuV */
  guvGegen?: string;
}

function eroeffnungsSaetze(p: A6Params, w: Abweichung = {}): ErwSatz[] {
  const gegen = w.gegen ?? EBK;
  const sa = sum(p.aktiva.map((x) => x.betrag));
  const sp = sum(p.passiva.map((x) => x.betrag));
  const aktiv = p.aktiva.map((x) => zeile(x.konto, x.betrag));
  const passiv = p.passiva.map((x) => zeile(x.konto, x.betrag));
  if (w.umgekehrt)
    return [
      satz([zeile(gegen, sa)], aktiv, 'Eröffnung der Aktivkonten'),
      satz(passiv, [zeile(gegen, sp)], 'Eröffnung der Passivkonten'),
    ];
  return [
    satz(aktiv, [zeile(gegen, sa)], 'Eröffnung der Aktivkonten'),
    satz([zeile(gegen, sp)], passiv, 'Eröffnung der Passivkonten'),
  ];
}

/** Abschlussbuchung eines Kontos: Saldo auf der Abnahmeseite, Gegenkonto SBK bzw. GuV. */
function abschlussSatz(konto: string, b: Val, w: Abweichung = {}): ErwSatz {
  const art = kontenart(konto);
  const gegen = w.gegen ?? abschlussKonto(art);
  // Saldo im Haben (Aktiv, Aufwand): Gegenkonto an Konto; Saldo im Soll (Passiv, Ertrag): Konto an Gegenkonto
  let imHaben = saldoSeite(art) === HABEN;
  if (w.umgekehrt) imHaben = !imHaben;
  return imHaben
    ? satz([zeile(gegen, b)], [zeile(konto, b)], `Abschluss ${getKonto(konto).kurz}`)
    : satz([zeile(konto, b)], [zeile(gegen, b)], `Abschluss ${getKonto(konto).kurz}`);
}

function kontoWerte(p: A6Params) {
  const zugaenge = sum(p.bewegungen.filter((b) => b.zugang).map((b) => b.betrag));
  const abgaenge = sum(p.bewegungen.filter((b) => !b.zugang).map((b) => b.betrag));
  const kontosumme = new Val(p.ab).plus(zugaenge);
  return { saldo: kontosumme.minus(abgaenge), kontosumme, abgaenge };
}

function guvWerte(p: A6Params) {
  const aufwand = sum(
    p.salden.filter((x) => kontenart(x.konto) === 'aufwand').map((x) => x.betrag),
  );
  const ertrag = sum(p.salden.filter((x) => kontenart(x.konto) === 'ertrag').map((x) => x.betrag));
  const diff = ertrag.minus(aufwand);
  return { aufwand, ertrag, erfolg: diff.abs(), gewinn: !diff.isNegative() };
}

function guvSaetze(p: A6Params, w: Abweichung = {}): ErwSatz[] {
  const g = guvWerte(p);
  const saetze = p.salden.map((x) =>
    abschlussSatz(
      x.konto,
      new Val(x.betrag),
      w.aufwandUmgekehrt && kontenart(x.konto) === 'aufwand' ? { umgekehrt: true } : {},
    ),
  );
  const gegen = w.guvGegen ?? EK;
  const gewinn = w.ergebnisUmgekehrt ? !g.gewinn : g.gewinn;
  saetze.push(
    gewinn
      ? satz([zeile(GUV, g.erfolg)], [zeile(gegen, g.erfolg)], 'Abschluss der GuV')
      : satz([zeile(gegen, g.erfolg)], [zeile(GUV, g.erfolg)], 'Abschluss der GuV'),
  );
  return saetze;
}

export function solveEroeffnungAbschluss(p: A6Params): A6Solution {
  const null0 = new Val(0);
  const base: A6Solution = {
    summe: null0,
    saldo: null0,
    seite: SOLL,
    kontosumme: null0,
    aufwand: null0,
    ertrag: null0,
    erfolg: null0,
    ergebnis: GEWINN,
    buchung: loesung([]),
  };
  switch (p.variante) {
    case 'eroeffnung':
      return {
        ...base,
        summe: sum(p.aktiva.map((x) => x.betrag)),
        buchung: loesung(eroeffnungsSaetze(p), true),
      };
    case 'bestandskonto':
    case 'erfolgskonto': {
      const k = kontoWerte(p);
      return {
        ...base,
        saldo: k.saldo,
        seite: saldoSeite(kontenart(p.konto)),
        kontosumme: k.kontosumme,
        buchung: loesung([abschlussSatz(p.konto, k.saldo)]),
      };
    }
    case 'guv': {
      const g = guvWerte(p);
      return {
        ...base,
        aufwand: g.aufwand,
        ertrag: g.ertrag,
        erfolg: g.erfolg,
        ergebnis: g.gewinn ? GEWINN : VERLUST,
        buchung: loesung(guvSaetze(p), true),
      };
    }
  }
}

// ---------- Teile ----------

function kurz(konto: string): string {
  return getKonto(konto).kurz;
}

function buchungPart(saetze: ErwSatz[], titel: string, zusammenfassbar: boolean): BuchungPart {
  return {
    typ: 'buchungssatz',
    id: 'buchung',
    titel,
    loesung: loesung(saetze, zusammenfassbar),
  };
}

function ebkPart(summe: Val, seiteAktiva: Seite, gegen: string): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'ebk',
    titel: 'Eröffnungsbilanzkonto',
    felder: [
      auswahl(
        'gegen',
        'Gegenkonto der Eröffnungsbuchungen',
        [OPT_EBK, OPT_SBK, OPT_GUV],
        OPTION[gegen]!,
      ),
      auswahl('seiteAktiva', 'Seite des EBK, auf der die Aktivposten stehen', SEITEN, seiteAktiva),
      feld('summe', 'Summe des Eröffnungsbilanzkontos', summe),
    ],
  };
}

function tkontoPart(p: A6Params, w: { saldo: Val; seite: Seite; gegen: string }): TKontoPart {
  const art = kontenart(p.konto);
  const zSeite = zugangsSeite(art);
  const soll: { text: string; betrag: string }[] = [];
  const haben: { text: string; betrag: string }[] = [];
  const auf = (s: Seite) => (s === SOLL ? soll : haben);
  if (istBestandskonto(art)) auf(zSeite).push({ text: 'EBK', betrag: p.ab });
  for (const b of p.bewegungen)
    auf(b.zugang ? zSeite : gegenseite(zSeite)).push({ text: kurz(b.gegen), betrag: b.betrag });
  return {
    typ: 'tkonto',
    id: 'konto',
    titel: `Konto ${kurz(p.konto)} zum 31.12.`,
    konto: p.konto,
    soll,
    haben,
    felder: [
      feld('saldo', 'Saldo', w.saldo),
      auswahl('seite', 'Seite, auf der der Saldo eingetragen wird', SEITEN, w.seite),
      auswahl('gegen', 'Gegenkonto beim Abschluss', [OPT_SBK, OPT_GUV, OPT_EK], OPTION[w.gegen]!),
    ],
  };
}

interface GuvWerte {
  aufwand: Val;
  ertrag: Val;
  erfolg: Val;
  ergebnis: string;
}

function guvPart(w: GuvWerte): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'guv',
    titel: 'Gewinn- und Verlustkonto',
    felder: [
      feld('aufwand', 'Summe der Aufwendungen', w.aufwand),
      feld('ertrag', 'Summe der Erträge', w.ertrag),
      feld('erfolg', 'Saldo des GuV-Kontos (Betrag)', w.erfolg),
      auswahl('ergebnis', 'Ergebnis', [GEWINN, VERLUST], w.ergebnis),
    ],
  };
}

function parts(p: A6Params, s: A6Solution): TaskPart[] {
  switch (p.variante) {
    case 'eroeffnung':
      return [
        ebkPart(s.summe, HABEN, EBK),
        buchungPart(s.buchung.saetze, 'Eröffnungsbuchungen', true),
      ];
    case 'bestandskonto':
    case 'erfolgskonto':
      return [
        tkontoPart(p, {
          saldo: s.saldo,
          seite: s.seite,
          gegen: abschlussKonto(kontenart(p.konto)),
        }),
        buchungPart(s.buchung.saetze, 'Abschlussbuchung', false),
      ];
    case 'guv':
      return [guvPart(s), buchungPart(s.buchung.saetze, 'Abschlussbuchungen', true)];
  }
}

// ---------- Fehlervarianten ----------

function variants(p: A6Params): ErrorVariant[] {
  const s = solveEroeffnungAbschluss(p);
  switch (p.variante) {
    case 'eroeffnung':
      return [
        {
          fehlertyp: ES,
          parts: [
            ebkPart(s.summe, SOLL, EBK),
            buchungPart(eroeffnungsSaetze(p, { umgekehrt: true }), 'Eröffnungsbuchungen', true),
          ],
        },
        {
          fehlertyp: EU,
          parts: [
            ebkPart(s.summe, HABEN, SBK),
            buchungPart(eroeffnungsSaetze(p, { gegen: SBK }), 'Eröffnungsbuchungen', true),
          ],
        },
      ];
    case 'bestandskonto':
    case 'erfolgskonto': {
      const art: Kontenart = kontenart(p.konto);
      const richtig = abschlussKonto(art);
      const k = kontoWerte(p);
      const mk = (fehlertyp: string, w: Abweichung): ErrorVariant => {
        const b = w.summeStattSaldo ? k.kontosumme : k.saldo;
        return {
          fehlertyp,
          parts: [
            tkontoPart(p, {
              saldo: b,
              seite: w.umgekehrt ? gegenseite(s.seite) : s.seite,
              gegen: w.gegen ?? richtig,
            }),
            buchungPart([abschlussSatz(p.konto, b, w)], 'Abschlussbuchung', false),
          ],
        };
      };
      const out = [
        mk(AR, { umgekehrt: true }),
        mk(istBestandskonto(art) ? BG : ESB, { gegen: istBestandskonto(art) ? GUV : SBK }),
      ];
      if (k.abgaenge.exact.gt(0)) out.push(mk(SU, { summeStattSaldo: true }));
      return out;
    }
    case 'guv': {
      const g: GuvWerte = {
        aufwand: s.aufwand,
        ertrag: s.ertrag,
        erfolg: s.erfolg,
        ergebnis: s.ergebnis,
      };
      const titel = 'Abschlussbuchungen';
      return [
        {
          fehlertyp: GV,
          parts: [
            guvPart({ ...g, ergebnis: s.ergebnis === GEWINN ? VERLUST : GEWINN }),
            buchungPart(guvSaetze(p, { ergebnisUmgekehrt: true }), titel, true),
          ],
        },
        {
          fehlertyp: GS,
          parts: [guvPart(g), buchungPart(guvSaetze(p, { guvGegen: SBK }), titel, true)],
        },
        {
          fehlertyp: AR,
          parts: [guvPart(g), buchungPart(guvSaetze(p, { aufwandUmgekehrt: true }), titel, true)],
        },
      ];
    }
  }
}

// ---------- Texte ----------

function render(p: A6Params): TaskText {
  switch (p.variante) {
    case 'eroeffnung': {
      const summe = sum(p.aktiva.map((x) => x.betrag));
      return {
        titel: 'Konten eröffnen',
        kontext: 'Januar: Eröffnungsbilanz der MBG',
        sachverhalt: [
          'Die Schlussbilanz des Vorjahres ist die Eröffnungsbilanz der MBG zum 1. Januar (Beträge in €):',
        ],
        daten: bilanzDaten(p.aktiva, p.passiva, summe.value.toFixed(2)),
        aufgabe:
          'Bilde die Eröffnungsbuchungen für alle Bestandskonten und beantworte die Fragen zum Eröffnungsbilanzkonto. (Statt EBK darfst du auch „Saldenvortrag“ schreiben.)',
      };
    }
    case 'bestandskonto':
    case 'erfolgskonto':
      return {
        titel: `Konto ${kurz(p.konto)} abschließen`,
        kontext: 'Dezember: Jahresabschluss',
        sachverhalt: [
          `Am 31.12. zeigt das Konto ${p.konto} der MBG die abgebildeten Einträge. Neben jedem Betrag steht das Gegenkonto.`,
        ],
        aufgabe: 'Ermittle den Saldo, gib Seite und Gegenkonto an und bilde die Abschlussbuchung.',
      };
    case 'guv':
      return {
        titel: 'Erfolgskonten und GuV abschließen',
        kontext: 'Dezember: Jahresabschluss',
        sachverhalt: [
          'Zum 31.12. weisen die Erfolgskonten der MBG diese Salden aus (vereinfacht: es gibt nur diese Erfolgskonten).',
        ],
        daten: {
          spalten: ['Konto', 'Saldo'],
          zeilen: p.salden.map((x) => [x.konto, eur(x.betrag)]),
        },
        aufgabe:
          'Schließe die Erfolgskonten über das Gewinn- und Verlustkonto ab, ermittle das Ergebnis und schließe das GuV-Konto ab.',
      };
  }
}

function satzText(x: ErwSatz): string {
  return `${x.soll.map((z) => kurz(z.konto)).join(', ')} an ${x.haben.map((z) => kurz(z.konto)).join(', ')} ${eur(x.soll.reduce((a, z) => a.plus(z.betrag), new Val(0)))}`;
}

function steps(p: A6Params, s: A6Solution): SolutionStep[] {
  switch (p.variante) {
    case 'eroeffnung':
      return [
        {
          titel: 'Aktivkonten eröffnen',
          ergebnis: `${p.aktiva.map((x) => kurz(x.konto)).join(', ')} an EBK`,
          erlaeuterung:
            'Aktivkonten haben ihren Anfangsbestand im Soll. Die Gegenbuchung steht im Haben des EBK – das EBK ist das Spiegelbild der Eröffnungsbilanz.',
        },
        {
          titel: 'Passivkonten eröffnen',
          ergebnis: `EBK an ${p.passiva.map((x) => kurz(x.konto)).join(', ')}`,
          erlaeuterung:
            'Passivkonten haben ihren Anfangsbestand im Haben, das EBK erhält die Gegenbuchung im Soll.',
        },
        {
          titel: 'Summe des EBK',
          ergebnis: eur(s.summe),
          erlaeuterung: 'Beide Seiten des EBK entsprechen der Bilanzsumme der Eröffnungsbilanz.',
        },
      ];
    case 'bestandskonto':
    case 'erfolgskonto': {
      const art = kontenart(p.konto);
      const k = kontoWerte(p);
      return [
        {
          titel: 'Saldo',
          rechnung: `${eur(k.kontosumme)} − ${eur(k.abgaenge)} = ${eur(s.saldo)}`,
          ergebnis: eur(s.saldo),
          erlaeuterung: `Die größere Seite (${zugangsSeite(art)}) ergibt die Kontosumme. Der Saldo ist der Unterschied zur kleineren Seite und steht dort: im ${s.seite}.`,
        },
        {
          titel: 'Abschlussbuchung',
          ergebnis: satzText(s.buchung.saetze[0]!),
          erlaeuterung: istBestandskonto(art)
            ? 'Bestandskonten werden über das Schlussbilanzkonto abgeschlossen: SBK an Aktivkonto, Passivkonto an SBK.'
            : 'Erfolgskonten werden über das GuV-Konto abgeschlossen: GuV an Aufwandskonto, Ertragskonto an GuV.',
        },
      ];
    }
    case 'guv':
      return [
        {
          titel: 'Erfolgskonten abschließen',
          ergebnis: s.buchung.saetze.slice(0, -1).map(satzText).join('; '),
          erlaeuterung:
            'GuV an Aufwandskonto, Ertragskonto an GuV – die Salden wandern in das GuV-Konto.',
        },
        {
          titel: 'Ergebnis',
          rechnung: `${eur(s.ertrag)} − ${eur(s.aufwand)}`,
          ergebnis: `${s.ergebnis} ${eur(s.erfolg)}`,
        },
        {
          titel: 'GuV abschließen',
          ergebnis: satzText(s.buchung.saetze[s.buchung.saetze.length - 1]!),
          erlaeuterung:
            s.ergebnis === GEWINN
              ? 'Ein Gewinn erhöht das Eigenkapital (Haben): GuV an Eigenkapital.'
              : 'Ein Verlust mindert das Eigenkapital (Soll): Eigenkapital an GuV.',
        },
      ];
  }
}

function hints(p: A6Params, s: A6Solution): [string, string, string] {
  switch (p.variante) {
    case 'eroeffnung':
      return [
        'Jedes Bestandskonto bekommt seinen Anfangsbestand dort, wo es zunimmt. Das Gegenkonto bei der Eröffnung ist das Eröffnungsbilanzkonto.',
        'Aktivkonten an EBK, EBK an Passivkonten. Das EBK ist spiegelbildlich zur Eröffnungsbilanz: Aktiva stehen dort im Haben.',
        `Summe des EBK ${eur(s.summe)}.`,
      ];
    case 'bestandskonto':
    case 'erfolgskonto':
      return [
        'Addiere die größere Seite. Der Saldo ist der Unterschied zur kleineren Seite und wird dort eingetragen.',
        istBestandskonto(kontenart(p.konto))
          ? 'Bestandskonten schließt du über das Schlussbilanzkonto ab.'
          : 'Erfolgskonten schließt du über das Gewinn- und Verlustkonto ab.',
        `${satzText(s.buchung.saetze[0]!)}.`,
      ];
    case 'guv':
      return [
        'Zuerst die Erfolgskonten: GuV an Aufwandskonto, Ertragskonto an GuV.',
        'Erträge größer als Aufwendungen: Gewinn, GuV an Eigenkapital. Sonst Verlust: Eigenkapital an GuV.',
        `${s.ergebnis} ${eur(s.erfolg)}.`,
      ];
  }
}

// ---------- Erzeugung ----------

const AKTIV_POSTEN: { konto: string; spanne: [number, number, number] }[] = [
  { konto: 'Technische Anlagen und Maschinen', spanne: [150_000, 500_000, 10_000] },
  { konto: 'Betriebs- und Geschäftsausstattung', spanne: [20_000, 80_000, 1_000] },
  { konto: 'Fuhrpark', spanne: [30_000, 150_000, 5_000] },
  { konto: 'Rohstoffe', spanne: [20_000, 90_000, 1_000] },
  { konto: 'Fertige Erzeugnisse', spanne: [10_000, 60_000, 1_000] },
  { konto: FORD, spanne: [20_000, 90_000, 1_000] },
  { konto: BANK, spanne: [30_000, 150_000, 1_000] },
  { konto: KASSE, spanne: [1_000, 8_000, 100] },
];

const AUFWAND_SALDEN: { konto: string; spanne: [number, number, number] }[] = [
  { konto: 'Aufwendungen für Rohstoffe', spanne: [80_000, 300_000, 1_000] },
  { konto: 'Löhne', spanne: [60_000, 250_000, 1_000] },
  { konto: 'Gehälter', spanne: [40_000, 150_000, 1_000] },
  { konto: 'Mietaufwendungen', spanne: [10_000, 60_000, 500] },
  { konto: 'Werbung', spanne: [5_000, 40_000, 500] },
  { konto: 'Zinsaufwendungen', spanne: [2_000, 20_000, 100] },
  { konto: 'Abschreibungen auf Sachanlagen', spanne: [20_000, 90_000, 1_000] },
];

const ERTRAG_NEBEN: { konto: string; spanne: [number, number, number] }[] = [
  { konto: 'Zinserträge', spanne: [500, 8_000, 100] },
  { konto: 'Mieterträge', spanne: [2_000, 24_000, 500] },
  { konto: 'Provisionserträge', spanne: [1_000, 15_000, 100] },
];

function eroeffnung(rng: Rng, krumm: boolean): [Posten[], Posten[]] {
  const n = rng.int(3, 5);
  const auswahlListe = rng.shuffle(AKTIV_POSTEN).slice(0, n);
  // Reihenfolge wie in der Bilanz (Anlagevermögen zuerst, flüssige Mittel zuletzt)
  const gewaehlt = AKTIV_POSTEN.filter((x) => auswahlListe.includes(x));
  const aktiva = gewaehlt.map((x) => ({
    konto: x.konto,
    betrag: betrag(rng, x.spanne[0], x.spanne[1], x.spanne[2], krumm),
  }));
  const summe = sum(aktiva.map((x) => x.betrag));
  const darlehen = rng.step(50_000, 200_000, 10_000);
  const verb = rng.step(10_000, 60_000, 1_000);
  const ek = summe.minus(darlehen).minus(verb);
  return [
    aktiva,
    [
      { konto: EK, betrag: ek.value.toFixed(2) },
      { konto: DARLEHEN, betrag: String(darlehen) },
      { konto: VERB, betrag: String(verb) },
    ],
  ];
}

function guvSalden(rng: Rng, krumm: boolean, verlust: boolean): Posten[] {
  const nA = rng.int(2, 3);
  const nE = rng.int(1, 4 - nA);
  const aufwand = rng.shuffle(AUFWAND_SALDEN).slice(0, nA);
  const neben = rng.shuffle(ERTRAG_NEBEN).slice(0, nE - 1);
  const mk = (x: { konto: string; spanne: [number, number, number] }) => ({
    konto: x.konto,
    betrag: betrag(rng, x.spanne[0], x.spanne[1], x.spanne[2], krumm),
  });
  const aufwandPosten = aufwand.map(mk);
  const summeAufwand = sum(aufwandPosten.map((x) => x.betrag)).value.toNumber();
  // Umsatzerlöse so wählen, dass das gewünschte Ergebnis entsteht
  const faktor = verlust ? rng.int(70, 95) / 100 : rng.int(110, 160) / 100;
  const ue = {
    konto: 'Umsatzerlöse für eigene Erzeugnisse',
    betrag: betrag(
      rng,
      Math.round(summeAufwand * faktor),
      Math.round(summeAufwand * faktor) + 5_000,
      1_000,
      krumm,
    ),
  };
  return [...aufwandPosten, ue, ...neben.map(mk)];
}

function generate(rng: Rng, opts: GenOptions = {}): A6Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const variante =
    (opts.variant as A6Variante | undefined) ??
    rng.pick([
      'eroeffnung',
      'bestandskonto',
      'bestandskonto',
      'erfolgskonto',
      'erfolgskonto',
      'guv',
    ] as const);
  const leer: A6Params = {
    variante,
    aktiva: [],
    passiva: [],
    konto: BANK,
    ab: '0',
    bewegungen: [],
    salden: [],
  };
  switch (variante) {
    case 'eroeffnung':
      return retry(
        rng,
        (r) => {
          const [aktiva, passiva] = eroeffnung(r, krumm);
          return { ...leer, aktiva, passiva };
        },
        (p) => new Val(p.passiva[0]!.betrag).exact.gt(30_000),
      );
    case 'bestandskonto':
    case 'erfolgskonto': {
      const erfolg = variante === 'erfolgskonto';
      const vorlage = rng.pick(erfolg ? ERFOLG_VORLAGEN : BESTAND_VORLAGEN);
      return retry(
        rng,
        (r) => ({
          ...leer,
          konto: vorlage.konto,
          ab: vorlage.ab ? betrag(r, vorlage.ab[0], vorlage.ab[1], vorlage.ab[2], krumm) : '0',
          bewegungen: bewegungen(r, vorlage, krumm, erfolg),
        }),
        (p) => kontoWerte(p).saldo.exact.gt(0),
      );
    }
    case 'guv': {
      const verlust = rng.chance(0.25);
      return retry(
        rng,
        (r) => ({ ...leer, salden: guvSalden(r, krumm, verlust) }),
        (p) => {
          const g = guvWerte(p);
          return g.gewinn !== verlust && g.erfolg.exact.gt(0);
        },
      );
    }
  }
}

export const eroeffnungAbschluss = defineGenerator<A6Params, A6Solution>({
  skillId: 'A6-eroeffnung-abschluss',
  titel: 'Eröffnung und Abschluss der Konten',
  variants: ['eroeffnung', 'bestandskonto', 'erfolgskonto', 'guv'],
  points: 3,
  generate,
  render,
  solve: solveEroeffnungAbschluss,
  parts,
  steps,
  hints,
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'eroeffnung'
      ? 'Bestandskonten eröffnen: Aktivkonten an EBK, EBK an Passivkonten'
      : p.variante === 'guv'
        ? 'Erfolgskonten über die GuV abschließen, GuV über das Eigenkapital'
        : 'Konto abschließen: Saldo bilden, Bestandskonten über SBK, Erfolgskonten über GuV',
});
