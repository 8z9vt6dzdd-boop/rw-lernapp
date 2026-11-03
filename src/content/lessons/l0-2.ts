// Lektion 0.2 – Inventur: Die MBG zählt alles (eigene Formulierung; geprüft gegen BA 2.3.1.1)
import { formatEuro, sum } from '../../engine/money';
import type { Lektion } from './types';

// Verständnisfrage und Klausurbrücke: Werte von der Engine berechnet
const VERMOEGEN_FRAGE = sum(['620000']);
const SCHULDEN_FRAGE = sum(['410000']);
const EK_FRAGE = VERMOEGEN_FRAGE.minus(SCHULDEN_FRAGE);

const VERMOEGEN = sum(['380000', '75000', '45000']);
const SCHULDEN = sum(['260000', '40000']);
const EIGENKAPITAL = VERMOEGEN.minus(SCHULDEN);

const e = (v: { value: { toString(): string } }) => formatEuro(v.value.toString());

export const lektion02: Lektion = {
  id: '0.2',
  skillId: '0.2-inventur',
  abschnitt: '0',
  titel: 'Inventur: Die MBG zählt alles',
  kernAha:
    'Inventur heißt zählen, messen, wiegen und bewerten. Das Inventar ist die vollständige Liste von allem, was die Firma hat und schuldet – der Rest ist Eigenkapital.',
  dauerMin: 5,
  figuren: ['frank', 'jana', 'tobias', 'leni'],
  ort: 'lager',
  quelle: 'BA 2.3.1.1',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Die Sparkasse will eine vollständige Liste von allem, was wir haben. Wirklich alles.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Bevor die Sparkasse irgendein Foto sieht, will sie eine vollständige Liste von allem, was wir haben – und was wir schulden.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Dann wird gezählt. Jede Dose, jede Palette, jeder Euro.',
        },
      ],
      frage: 'Wie findet man heraus, was eine ganze Firma besitzt?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Wie beim Umzug: Bevor ich Kisten packe, schreibe ich auf, was überhaupt da ist.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Genau so. Bei uns heißt das Zählen Inventur, und die fertige Liste heißt Inventar.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Ein Tag Inventur bei der MBG',
      text: 'Tippe auf jede Karte: Was passiert bei der Inventur?',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Zählen',
            text: 'Paletten mit Dosen, Kisten mit Etiketten, Gabelstapler: Alles, was man zählen kann, wird Stück für Stück gezählt.',
            farbe: '#1c6670',
          },
          {
            titel: 'Messen und Wiegen',
            text: 'Sirup im Tank wird gemessen, Zucker im Silo gewogen. Nicht alles lässt sich zählen.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Bewerten',
            text: 'Aus Mengen werden Euro: Menge mal Preis. Erst dann lassen sich Dosen und Zucker zusammenrechnen.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Schulden aufnehmen',
            text: 'Offene Rechnungen und Darlehen gehören auch dazu. Sie liegen nicht im Lager – aber auf dem Schreibtisch.',
            farbe: '#e8792b',
          },
        ],
      },
      fazit:
        'Inventur ist die Bestandsaufnahme nach Menge und Wert – für Vermögen und Schulden. Bei der MBG passiert das zum Ende jedes Geschäftsjahres.',
    },
    {
      typ: 'konzept',
      titel: 'Inventur und Inventar',
      text: 'Inventur heißt: Bestände nach Menge und Wert aufnehmen – zählen, messen, wiegen. Das Ergebnis ist das Inventar, eine ausführliche Liste aller Vermögensteile und Schulden. Vermögen minus Schulden ergibt das Eigenkapital.',
      visual: {
        typ: 'lager',
        titel: 'Logistikzentrum der MBG am 31.12.',
        regal: [
          { name: 'Paderquell Energy (Paletten)', paletten: 6, farbe: '#1c6670' },
          { name: 'Senne Lemon (Paletten)', paletten: 4, farbe: '#e2b13c' },
          { name: 'Leergut Dosen (Paletten)', paletten: 3, farbe: '#e8792b' },
        ],
        tanks: [
          { name: 'Sirup', fuellung: 0.6, farbe: '#8cbf3f' },
          { name: 'Zucker', fuellung: 0.35, farbe: '#e2b13c' },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Was gehört ins Inventar der MBG?',
      text: 'Sortiere die Fundstücke vom Inventurtag.',
      kategorien: ['Vermögen', 'Schulden', 'Gehört nicht hinein'],
      elemente: [
        { text: 'Abfüllanlage im Werk', kategorie: 'Vermögen' },
        { text: 'Darlehen der Sparkasse', kategorie: 'Schulden' },
        { text: 'Paletten mit Dosen im Lager', kategorie: 'Vermögen' },
        {
          text: 'Franks privates Auto, das nur er privat fährt',
          kategorie: 'Gehört nicht hinein',
          erklaerung: 'Privatvermögen der Gesellschafter gehört nicht ins Inventar der Firma.',
        },
        { text: 'Offene Rechnung des Etikettendruckers', kategorie: 'Schulden' },
        { text: 'Guthaben auf dem Bankkonto', kategorie: 'Vermögen' },
      ],
    },
    {
      typ: 'vorhersage',
      frage: 'Das fertige Inventar der MBG ist 40 Seiten lang. Was schickt Jana der Sparkasse?',
      optionen: [
        { text: 'Alle 40 Seiten – je genauer, desto besser.' },
        { text: 'Eine kurze Übersicht, die alles zu wenigen Posten zusammenfasst.', richtig: true },
        { text: 'Nur die Seiten mit den Schulden.' },
      ],
      aufloesung:
        'Das Inventar ist sehr ausführlich: jede Position mit Art, Menge und Wert. Für einen schnellen Überblick fasst man es zu einer Kurzfassung ohne Mengenangaben zusammen – das ist die Bilanz. Genau das „Foto“, von dem Jana gesprochen hat.',
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Wie genau muss die Inventur sein?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Einmal im Jahr grob durchzählen reicht. Hauptsache ungefähr.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Ungefähr reicht nicht. Jede Position braucht eine Menge und einen Wert.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Aus dem Inventar entsteht die Bilanz – falsche Mengen führen zu falschen Zahlen für Bank und Finanzamt.',
          richtig: true,
        },
        { text: 'Die Sparkasse zählt ohnehin selbst noch einmal nach.' },
        { text: 'Genau zählen muss man nur das Bargeld.' },
      ],
      aufloesung:
        'Die Inventur ist die Grundlage für alles, was danach kommt. Jeder Vermögensgegenstand und jede Schuld wird einzeln nach Menge und Wert aufgenommen.',
    },
    {
      typ: 'verstaendnis',
      frage: `Das Inventar der MBG zeigt Vermögen von ${e(VERMOEGEN_FRAGE)} und Schulden von ${e(SCHULDEN_FRAGE)}. Wie hoch ist das Eigenkapital?`,
      optionen: [
        {
          text: e(EK_FRAGE),
          richtig: true,
          erklaerung:
            'Richtig: Eigenkapital ist das, was nach Abzug der Schulden vom Vermögen übrig bleibt.',
        },
        {
          text: e(VERMOEGEN_FRAGE.plus(SCHULDEN_FRAGE)),
          erklaerung: 'Schulden werden vom Vermögen abgezogen, nicht addiert.',
        },
        {
          text: e(SCHULDEN_FRAGE),
          erklaerung:
            'Das sind die Schulden. Das Eigenkapital ist der Rest: Vermögen minus Schulden.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: '0.2-m1',
      frage: 'Was ist der Unterschied zwischen Inventur und Inventar?',
      text: 'Inventur = Bestände nach Menge und Wert aufnehmen (zählen, messen, wiegen). Inventar = ausführliche Liste aller Vermögensteile und Schulden. Eigenkapital = Vermögen minus Schulden.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Die Inventur der MBG ergibt: Technische Anlagen und Maschinen 380.000,00 €, Vorräte 75.000,00 €, Bankguthaben 45.000,00 €, Darlehensschulden 260.000,00 €, Verbindlichkeiten aus Lieferungen und Leistungen 40.000,00 €. Ermitteln Sie Vermögen, Schulden und Eigenkapital (Reinvermögen).',
      part: {
        typ: 'rechenkette',
        id: 'inventar',
        titel: 'Inventar der MBG',
        felder: [
          {
            typ: 'zahl',
            id: 'vermoegen',
            label: 'Summe des Vermögens',
            kind: 'betrag',
            einheit: '€',
            soll: VERMOEGEN,
          },
          {
            typ: 'zahl',
            id: 'schulden',
            label: 'Summe der Schulden',
            kind: 'betrag',
            einheit: '€',
            soll: SCHULDEN,
          },
          {
            typ: 'zahl',
            id: 'ek',
            label: 'Eigenkapital (Reinvermögen)',
            kind: 'betrag',
            einheit: '€',
            soll: EIGENKAPITAL,
          },
        ],
      },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'freut',
        text: 'Und jetzt machen wir aus 40 Seiten Inventar ein einziges Foto für die Sparkasse.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was ist eine Inventur?',
      optionen: [
        {
          text: 'Die Bestandsaufnahme von Vermögen und Schulden nach Menge und Wert',
          richtig: true,
        },
        { text: 'Die Liste aller Kunden' },
        { text: 'Die Berechnung des Gewinns' },
      ],
    },
    {
      frage: 'Wie heißt das Ergebnis der Inventur?',
      optionen: [
        { text: 'Inventar', richtig: true },
        { text: 'Bilanz' },
        { text: 'Gewinn- und Verlustrechnung' },
      ],
    },
    {
      frage: 'Vermögen 500.000 €, Schulden 320.000 €. Eigenkapital?',
      optionen: [
        { text: '180.000 €', richtig: true },
        { text: '820.000 €' },
        { text: '320.000 €' },
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
      'BA 2.3.1.1 (Inventur als mengen- und wertmäßige Bestandsaufnahme, Inventar mit Vermögen, Schulden und Eigenkapital als Residualgröße, Privatvermögen nicht im Inventar, Bilanz als Kurzfassung) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
