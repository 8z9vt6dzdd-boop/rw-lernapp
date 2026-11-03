// Lektion C1 – Bestandsorientierte und aufwandsorientierte Erfassung des Werkstoffeinkaufs
// (eigene Formulierung und eigene Zahlen; geprüft gegen BA 3.1.1, 3.1.2 und 3.1.5;
// Golden Cases GC-C1-03/04 in docs/m7/c1.md). Alle Beträge rechnet die Engine.
import { solveC1, type C1Params } from '../../engine/generators/c1/c1-bestand-vs-aufwand';
import { formatEuro, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value);
const BASIS: C1Params = {
  variante: 'inventur-bestand',
  erfassung: 'bestand',
  stoff: 'Rohstoffe',
  gegenstand: 'Zucker',
  partner: 'Zuckerkontor Hellwegland KG (Lippstadt)',
  ustSatz: '0.19',
  netto: '0',
  ab: '6000',
  zugaenge: ['9000', '5000'],
  entnahmen: [],
  sb: '4500',
  vorlage: 0,
};
const BESTAND = solveC1(BASIS);
const AUFWAND = solveC1({ ...BASIS, variante: 'inventur-aufwand', erfassung: 'aufwand' });
const EINKAUF = solveC1({ ...BASIS, variante: 'einkauf', netto: '9000' });
const AB = formatEuro(BASIS.ab);
const SB = formatEuro(BASIS.sb);
const Z1 = formatEuro(BASIS.zugaenge[0]!);
const Z2 = formatEuro(BASIS.zugaenge[1]!);
const ZUGANG = e(BESTAND.zugaenge);
const VERBRAUCH = e(BESTAND.verbrauch);
const MINDER = e(AUFWAND.delta.abs());

export const lektionC1: Lektion = {
  id: 'C1',
  skillId: 'C1-bestand-vs-aufwand',
  abschnitt: 'C',
  titel: 'Erst ins Lager oder gleich in den Kessel?',
  kernAha:
    'Ein Einkauf kann erst als Bestand (Lager) oder gleich als Aufwand (Verbrauch) gebucht werden. Am Periodenende steht bei beiden Wegen derselbe Verbrauch als Aufwand in der GuV – nur der Weg dorthin ist ein anderer.',
  dauerMin: 8,
  figuren: ['jana', 'leni', 'tobias'],
  ort: 'lager',
  quelle:
    'BA 3.1.1, 3.1.2 (Fußnote zur Just-in-time-Buchung), 3.1.5; docs/m7/c1.md (GC-C1-03, GC-C1-04)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: `Wir kaufen Zucker für ${ZUGANG}. Ist das jetzt Aufwand oder liegt das Geld im Lager?`,
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'lager',
        titel: 'Zuckersilo im Werk Paderborn, Februar',
        tanks: [
          { name: 'Zucker 1. Februar', fuellung: 0.4, farbe: '#e2b13c' },
          { name: 'nach zwei Lieferungen', fuellung: 0.95, farbe: '#e2b13c' },
          { name: 'Inventur 31. März', fuellung: 0.3, farbe: '#e2b13c' },
        ],
      },
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Zwei Lieferungen Zucker für zusammen ${ZUGANG}. Haben wir jetzt ${ZUGANG} Kosten?`,
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Kommt darauf an, wie wir den Einkauf erfassen. Es gibt zwei Wege.',
        },
      ],
      frage: 'Ist ein Einkauf sofort Aufwand – oder erst, wenn der Zucker verbraucht ist?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Den Wocheneinkauf räumst du erst in den Vorratsschrank und kochst nach und nach davon. Das Brötchen vom Bäcker isst du dagegen sofort.',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Und am Sonntagabend ist trotzdem beides weg. Hauptsache satt.',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Genau so gibt es zwei Wege, einen Einkauf zu buchen: erst Vorrat, oder gleich Verbrauch.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die MBG legt Zucker für ${Z1} netto ins Silo. Noch ist kein Gramm davon verarbeitet. Was ist passiert?`,
      optionen: [
        { text: `Die MBG hat ${Z1} Aufwand.` },
        {
          text: 'Die MBG hat jetzt mehr Vorräte – Aufwand entsteht erst beim Verbrauch.',
          richtig: true,
        },
        { text: 'Gar nichts, solange die Rechnung nicht bezahlt ist.' },
      ],
      aufloesung: `Solange der Zucker im Silo liegt, ist er Vermögen. Bestandsorientiert wird er deshalb auf dem Bestandskonto Rohstoffe gebucht: Rohstoffe ${Z1}, Vorsteuer ${e(EINKAUF.vorsteuer)} an Verbindlichkeiten a. LL ${e(EINKAUF.rechnung)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Zwei Wege für denselben Zucker',
      text: 'Bestandsorientiert: Einkauf aufs Bestandskonto, der Verbrauch wird später Aufwand. Aufwandsorientiert („Just-in-time“): Einkauf sofort als Aufwand, am Periodenende wird nur die Bestandsveränderung nachgebucht.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Bestandsorientiert',
            text: 'Rohstoffe an Verbindlichkeiten – später Aufwendungen für Rohstoffe an Rohstoffe (Verbrauch).',
            farbe: '#1c6670',
          },
          {
            titel: 'Aufwandsorientiert',
            text: 'Aufwendungen für Rohstoffe an Verbindlichkeiten – am Ende nur Mehr- oder Minderbestand buchen.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welcher Weg passt am besten?',
      text: 'Aufwandsorientiert lohnt sich vor allem, wenn die Lieferung direkt in die Produktion geht.',
      kategorien: ['Eher bestandsorientiert', 'Eher aufwandsorientiert'],
      elemente: [
        {
          text: 'Etiketten für die ganze Sommersaison kommen ins Hochregal.',
          kategorie: 'Eher bestandsorientiert',
          erklaerung: 'Die Ware liegt Wochen im Lager – sie ist zunächst Vorrat.',
        },
        {
          text: 'Der Getränkegrundstoff wird morgens angeliefert und läuft mittags in den Sirupkessel.',
          kategorie: 'Eher aufwandsorientiert',
          erklaerung: 'Lieferung direkt in die Produktion: klassischer Just-in-time-Fall.',
        },
        {
          text: 'Das Zuckersilo wird für drei Monate aufgefüllt.',
          kategorie: 'Eher bestandsorientiert',
          erklaerung: 'Großer Vorrat, der nach und nach verbraucht wird.',
        },
        {
          text: 'Frische Aromen werden täglich passend zur Abfüllmenge geliefert.',
          kategorie: 'Eher aufwandsorientiert',
          erklaerung: 'Was kommt, wird sofort verarbeitet – kaum Lagerbestand.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Bestandsorientiert: Verbrauch per Inventur',
      text: `Anfangsbestand Zucker ${AB}, Einkäufe ${Z1} und ${Z2}, Schlussbestand laut Inventur am 31. März ${SB}.`,
      schritte: [
        {
          text: 'Einkäufe stehen im Soll des Kontos Rohstoffe',
          rechnung: `${AB} + ${Z1} + ${Z2} = ${e(BESTAND.zugaenge.plus(BASIS.ab))}`,
          warum: 'So viel Zucker war im Quartal insgesamt verfügbar.',
        },
        {
          text: 'Schlussbestand ins Schlussbilanzkonto',
          rechnung: `SBK an Rohstoffe ${SB}`,
          warum: 'Was laut Inventur noch im Silo liegt, ist weiter Vermögen.',
        },
        {
          text: 'Der Rest ist Verbrauch',
          rechnung: `${AB} + ${ZUGANG} − ${SB} = ${VERBRAUCH}`,
          warum: 'Was weder im Silo noch in der Bilanz steht, wurde verarbeitet.',
        },
        {
          text: 'Verbrauch als Aufwand buchen',
          rechnung: `Aufwendungen für Rohstoffe an Rohstoffe ${VERBRAUCH}`,
          warum: 'Erst jetzt wird aus dem Vorrat Aufwand.',
        },
      ],
      visual: {
        typ: 'tkonto',
        name: 'Rohstoffe',
        soll: [
          { text: 'Anfangsbestand', betrag: BASIS.ab },
          { text: 'Einkauf 1', betrag: BASIS.zugaenge[0]! },
          { text: 'Einkauf 2', betrag: BASIS.zugaenge[1]! },
        ],
        haben: [
          { text: 'SBK', betrag: BASIS.sb },
          {
            text: 'Aufwendungen für Rohstoffe',
            betrag: BESTAND.verbrauch.value.toString(),
            neu: true,
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Gleiche Zahlen, aber aufwandsorientiert: Die ${ZUGANG} stehen schon als Aufwand im Soll. Wie hoch ist der Aufwand am Ende?`,
      optionen: [{ text: ZUGANG }, { text: VERBRAUCH, richtig: true }, { text: SB }],
      aufloesung: `Das Silo ist leerer als am Anfang: Minderbestand ${MINDER}. Es wurde also mehr verbraucht als eingekauft. Gebucht wird „Aufwendungen für Rohstoffe an Rohstoffe ${MINDER}“ – der Aufwand steigt auf ${VERBRAUCH}. Genau wie beim anderen Weg.`,
    },
    {
      typ: 'erkunden',
      titel: 'Der Aufwand wächst zusammen',
      text: 'Buche die Vorgänge auf das Aufwandskonto und sieh zu, wie der Saldo entsteht.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Aufwendungen für Rohstoffe',
        vorgaenge: [
          { text: 'Einkauf 1 (direkt als Aufwand)', betrag: BASIS.zugaenge[0]!, seite: 'soll' },
          { text: 'Einkauf 2 (direkt als Aufwand)', betrag: BASIS.zugaenge[1]!, seite: 'soll' },
          {
            text: 'Minderbestand laut Inventur',
            betrag: AUFWAND.delta.abs().value.toString(),
            seite: 'soll',
          },
        ],
      },
      fazit: `Saldo ${VERBRAUCH} – er geht in die GuV. Bei einem Mehrbestand stünde die Bestandsveränderung dagegen im Haben und würde den Aufwand mindern.`,
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Welcher Weg macht die MBG reicher?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Aufwandsorientiert natürlich! Mehr Aufwand, weniger Gewinn, weniger Steuern.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Am Periodenende ist der Aufwand bei beiden Wegen gleich. Der Weg ist nur eine Frage der Organisation.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die Bestandsveränderung korrigiert den Aufwand auf den tatsächlichen Verbrauch.',
          richtig: true,
        },
        { text: 'Aufwandsorientiert darf man die Vorsteuer nicht abziehen.' },
        { text: 'Bestandsorientiert gibt es keinen Aufwand, nur Bestände.' },
      ],
      aufloesung: `Beide Wege enden bei ${VERBRAUCH} Aufwand. Aufwandsorientiert spart Buchungsarbeit, wenn die Ware sofort verarbeitet wird; bestandsorientiert zeigt das Bestandskonto laufend, was im Lager liegt.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Neue Werte, aufwandsorientiert. Ergänze den Betrag der Bestandsveränderung und den Aufwand der Periode.',
      skillId: 'C1-bestand-vs-aufwand',
      seed: 5,
      variant: 'inventur-aufwand',
      partId: 'rechnung',
      gefragt: ['delta', 'verbrauch'],
    },
    {
      typ: 'merksatz',
      id: 'C1-m1',
      frage: 'Wie unterscheiden sich bestands- und aufwandsorientierte Erfassung des Einkaufs?',
      text: 'Bestandsorientiert: Einkauf aufs Bestandskonto, Verbrauch = Anfangsbestand + Zugänge − Schlussbestand wird als Aufwand gebucht. Aufwandsorientiert: Einkauf sofort als Aufwand, am Ende nur die Bestandsveränderung (Mehrbestand mindert, Minderbestand erhöht den Aufwand).',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe:
        'Die Einkäufe wurden bestandsorientiert erfasst. Bilden Sie die Abschlussbuchungen für das Rohstoffkonto.',
      part: {
        skillId: 'C1-bestand-vs-aufwand',
        seed: 3,
        variant: 'inventur-bestand',
        partId: 'buchung',
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Moment, auf der nächsten Zuckerrechnung steht noch Fracht! Ist das jetzt Zucker oder eine Ausgangsfracht?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Aufwandsorientierte Erfassung: Anfangsbestand 2.000 €, Schlussbestand 3.500 €. Wie wird die Bestandsveränderung gebucht?',
      optionen: [
        { text: 'Rohstoffe an Aufwendungen für Rohstoffe 1.500 €', richtig: true },
        { text: 'Aufwendungen für Rohstoffe an Rohstoffe 1.500 €' },
        { text: 'Rohstoffe an SBK 1.500 €' },
      ],
    },
    {
      frage:
        'Bestandsorientiert: Anfangsbestand 4.000 €, Zugänge 10.000 €, Schlussbestand 3.000 €. Wie hoch ist der Verbrauch?',
      optionen: [{ text: '11.000 €', richtig: true }, { text: '7.000 €' }, { text: '13.000 €' }],
    },
    {
      frage:
        'Eine Lieferung geht direkt in die Produktion und wird aufwandsorientiert erfasst. Welches Konto steht im Soll?',
      optionen: [
        { text: 'Aufwendungen für Rohstoffe', richtig: true },
        { text: 'Rohstoffe' },
        { text: 'Bestandsveränderungen' },
      ],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'Gegen BA 3.1.1 (Inventurmethode), 3.1.5 und Abb. 66/67 geprüft (Minderbestand: Aufwendungen an Rohstoffe); Zahlen aus der Engine (GC-C1-03/04); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
