// Lektion H2 – Materialbewertung (eigene Formulierung; geprüft gegen K1 Kap. 2.2.2, S. 54–66).
// Alle Beträge werden von der Engine berechnet (Golden Case GC-H2 in docs/m7/h.md).
import { solveMatBew, type MatBewParams } from '../../engine/generators/h/materialbewertung';
import { Val, formatEuro, formatPlain } from '../../engine/money';
import type { Lektion } from './types';

const BASIS: Omit<MatBewParams, 'verfahren' | 'art'> = {
  material: 'Zitronenaroma',
  einheit: 'kg',
  monat: 3,
  ab: { menge: 50, preis: '30' },
  bewegungen: [
    { tag: 3, menge: 30 },
    { tag: 8, menge: 100, preis: '33' },
    { tag: 14, menge: 70 },
    { tag: 20, menge: 50, preis: '37' },
    { tag: 27, menge: 60 },
  ],
};
const per = (verfahren: MatBewParams['verfahren']) =>
  solveMatBew({ ...BASIS, verfahren, art: 'periodisch' });
const perm = (verfahren: MatBewParams['verfahren']) =>
  solveMatBew({ ...BASIS, verfahren, art: 'permanent' });
const DURCH = per('durchschnitt');
const UNGEW = solveMatBew(
  { ...BASIS, verfahren: 'durchschnitt', art: 'periodisch' },
  { ungewichtet: true },
);
const FIFO = per('fifo');
const LIFO = per('lifo');
const LIFO_P = perm('lifo');
const DURCH_P = perm('durchschnitt');
const e = (v: Val) => formatEuro(v.value);
const Z1 = BASIS.bewegungen[1]!;
const Z2 = BASIS.bewegungen[3]!;
// Permanente Durchschnittsbewertung: Bestand nach dem ersten Abgang
const REST1 = BASIS.ab.menge - BASIS.bewegungen[0]!.menge;
const FALSCH_PREIS = new Val(BASIS.ab.preis).plus(Z1.preis!).div(2);

export const lektionH2: Lektion = {
  id: 'H2',
  skillId: 'H2-materialbewertung',
  abschnitt: 'H',
  titel: 'Welcher Preis gilt? Materialbewertung',
  kernAha:
    'Wird Material zu verschiedenen Preisen eingekauft, braucht die Bewertung eine Regel: entweder ein mengengewichteter Durchschnittspreis oder eine angenommene Verbrauchsfolge (Fifo, Lifo, Hifo, Lofo). Periodisch wird einmal am Monatsende gerechnet, permanent bei jedem Abgang.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'lager',
  quelle: 'K1 2.2.2 (S. 54–66); 04-fachregeln.md (GC-15)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Zitronenaroma zu 30, 33 und 37 € je kg eingekauft. Was kostet uns dann das verbrauchte Kilo?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Im März haben wir ${formatPlain(DURCH.verbrauchMenge)} kg Zitronenaroma verbraucht. Im Lager lag es zu ${formatEuro(BASIS.ab.preis)}, ${formatEuro(Z1.preis!)} und ${formatEuro(Z2.preis!)} je kg.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Nimm doch einfach den neuesten Preis. Der ist am ehrlichsten!',
        },
      ],
      frage:
        'Mit welchem Preis bewertet man den Verbrauch, wenn dasselbe Material zu verschiedenen Preisen gekauft wurde?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie beim Tanken: Du füllst dreimal zu verschiedenen Literpreisen in denselben Tank. Welcher Liter beim Fahren gerade verbrennt, weiß niemand.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Also braucht man eine Regel: einen Durchschnittspreis oder eine angenommene Reihenfolge des Verbrauchs.',
        },
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: 'Bewertet wird dabei immer mit dem Einstandspreis frei Lager, ohne Umsatzsteuer.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Anfangsbestand ${BASIS.ab.menge} kg zu ${formatEuro(BASIS.ab.preis)}, Zugang ${Z1.menge} kg zu ${formatEuro(Z1.preis!)}, Zugang ${Z2.menge} kg zu ${formatEuro(Z2.preis!)}. Welcher Durchschnittspreis gilt für den Monat?`,
      optionen: [
        { text: e(DURCH.durchschnittspreis!), richtig: true },
        { text: e(UNGEW.durchschnittspreis!) },
        { text: formatEuro(Z2.preis!) },
      ],
      aufloesung: `Gesamtwert ${e(DURCH.gesamtWert)} ÷ ${formatPlain(DURCH.gesamtMenge)} kg = ${e(DURCH.durchschnittspreis!)}. Jeder Preis zählt mit seiner Menge – vom 33-€-Aroma lag am meisten auf Lager. Der einfache Mittelwert der Preise (${e(UNGEW.durchschnittspreis!)}) übersieht das.`,
    },
    {
      typ: 'konzept',
      titel: 'Vier angenommene Reihenfolgen',
      text: 'Verbrauchsfolgeverfahren unterstellen eine Reihenfolge, unabhängig davon, wie wirklich entnommen wird. Fifo: älteste Partie zuerst. Lifo: jüngste zuerst. Hifo: teuerste zuerst. Lofo: billigste zuerst.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Fifo', text: 'first in – first out', farbe: '#1c6670' },
          { titel: 'Lifo', text: 'last in – first out', farbe: '#e8792b' },
          { titel: 'Hifo', text: 'highest in – first out', farbe: '#8cbf3f' },
          { titel: 'Lofo', text: 'lowest in – first out', farbe: '#e2b13c' },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welche Regel passt?',
      text: 'Ordne jedes Bild der Verbrauchsfolge zu, die es beschreibt.',
      kategorien: ['Fifo', 'Lifo', 'Hifo', 'Lofo'],
      elemente: [
        {
          text: 'Ein Silo wird oben befüllt und unten entleert.',
          kategorie: 'Fifo',
          erklaerung: 'Was zuerst hineinkam, kommt zuerst wieder heraus.',
        },
        {
          text: 'Schwere Paletten werden gestapelt; genommen wird immer die oberste.',
          kategorie: 'Lifo',
          erklaerung: 'Die zuletzt eingelagerte Partie geht zuerst raus.',
        },
        {
          text: 'Unterstellt: Die am teuersten gekaufte Partie wird zuerst verbraucht.',
          kategorie: 'Hifo',
        },
        {
          text: 'Unterstellt: Die am günstigsten gekaufte Partie wird zuerst verbraucht, der Endbestand ist also teuer bewertet.',
          kategorie: 'Lofo',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Fifo periodisch Schritt für Schritt',
      text: `Gesamtverbrauch im März: ${formatPlain(FIFO.verbrauchMenge)} kg.`,
      schritte: [
        {
          text: 'Zuerst der Anfangsbestand',
          rechnung: `${BASIS.ab.menge} kg × ${formatEuro(BASIS.ab.preis)} = ${formatEuro(new Val(BASIS.ab.preis).times(BASIS.ab.menge).value)}`,
          warum: 'Fifo: Was am längsten im Lager liegt, gilt als zuerst verbraucht.',
        },
        {
          text: 'Dann die Zugänge der Reihe nach',
          rechnung: FIFO.entnahmen!.slice(1)
            .map((x) => `${x.menge} kg × ${formatEuro(x.preis)}`)
            .join(' + '),
          warum: 'Periodisch wird nur der Gesamtverbrauch des Monats auf die Partien verteilt.',
        },
        {
          text: 'Verbrauch und Endbestand',
          rechnung: `Verbrauch ${e(FIFO.verbrauch)}; Endbestand ${e(FIFO.gesamtWert)} − ${e(FIFO.verbrauch)} = ${e(FIFO.endbestand)}`,
          warum: 'Übrig bleibt bei Fifo die jüngste Partie.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: 'Und nach dem Lifo-Verfahren, periodisch gerechnet?',
      optionen: [
        {
          text: e(LIFO.verbrauch),
          richtig: true,
          erklaerung: `${LIFO.entnahmen!.map((x) => `${x.menge} kg × ${formatEuro(x.preis)}`).join(' + ')} = ${e(LIFO.verbrauch)}. Periodisch beginnt Lifo beim letzten Zugang des Monats.`,
        },
        {
          text: e(FIFO.verbrauch),
          erklaerung:
            'Das ist das Fifo-Ergebnis. Bei Lifo gelten die jüngsten Partien als zuerst verbraucht.',
        },
        {
          text: e(LIFO.endbestand),
          erklaerung: 'Das ist der Wert des Endbestands, nicht der Verbrauch.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Kommt bei Lifo periodisch und permanent dasselbe heraus?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Lifo ist Lifo. Ob ich am Monatsende oder bei jedem Abgang rechne, ist doch egal.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: `Permanent darf nur verbraucht werden, was am Tag des Abgangs schon im Lager liegt. Am ${BASIS.bewegungen[2]!.tag}. März gab es die Partie zu ${formatEuro(Z2.preis!)} noch gar nicht.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Permanent wird jeder Abgang mit den Partien bewertet, die zu diesem Zeitpunkt vorhanden sind.',
          richtig: true,
        },
        { text: 'Permanent wird immer mit dem Durchschnittspreis gerechnet.' },
        { text: 'Periodisch werden Abgänge gar nicht bewertet.' },
      ],
      aufloesung: `Lifo periodisch: ${e(LIFO.verbrauch)}. Lifo permanent: ${LIFO_P.abgaenge!.map((a) => e(a.wert)).join(' + ')} = ${e(LIFO_P.verbrauch)}. Nur bei Fifo stimmen beide Wege immer überein.`,
    },
    {
      typ: 'fehlerjagd',
      titel: 'Permanente Durchschnittsbewertung',
      text: 'Ein Kollege bewertet jeden Abgang mit dem aktuellen Durchschnittspreis. In einer Zeile steckt der Fehler.',
      zeilen: [
        `3.3.: Abgang ${BASIS.bewegungen[0]!.menge} kg × ${formatEuro(BASIS.ab.preis)} = ${e(DURCH_P.abgaenge![0]!.wert)}`,
        `8.3.: Zugang ${Z1.menge} kg; neuer Preis (${formatEuro(BASIS.ab.preis)} + ${formatEuro(Z1.preis!)}) ÷ 2 = ${e(FALSCH_PREIS)}`,
        `14.3.: Abgang ${BASIS.bewegungen[2]!.menge} kg × aktueller Preis`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: `Der neue Preis muss mit den Mengen gewichtet werden: (${REST1} kg × ${formatEuro(BASIS.ab.preis)} + ${Z1.menge} kg × ${formatEuro(Z1.preis!)}) ÷ ${REST1 + Z1.menge} kg.`,
          richtig: true,
        },
        { text: 'Nach einem Zugang bleibt der alte Preis bis zum Monatsende gültig.' },
        { text: 'Der erste Abgang hätte mit dem Zugangspreis bewertet werden müssen.' },
      ],
      aufloesung: `Richtig: ${e(DURCH_P.abgaenge![1]!.preis!)} je kg. Nach dem nächsten Zugang ergeben sich ${e(DURCH_P.abgaenge![2]!.preis!)}; insgesamt ${e(DURCH_P.verbrauch)} Materialverbrauchskosten.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Periodische Durchschnittsbewertung mit neuen Zahlen: Ergänze Durchschnittspreis und Materialverbrauchskosten.',
      skillId: 'H2-materialbewertung',
      seed: 7,
      variant: 'durchschnitt-periodisch',
      partId: 'bewertung',
      gefragt: ['preis', 'verbrauch'],
    },
    {
      typ: 'merksatz',
      id: 'H2-m1',
      frage:
        'Wie bewertet man den Materialverbrauch mit Durchschnittspreisen und mit Verbrauchsfolgeverfahren?',
      text: 'Durchschnitt: Gesamtwert ÷ Gesamtmenge (gewogen); periodisch einmal je Periode, permanent nach jedem Zugang neu. Fifo, Lifo, Hifo, Lofo unterstellen eine Verbrauchsreihenfolge; permanent nur aus dem Bestand am Tag des Abgangs.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Bewerten Sie den Materialverbrauch des Monats periodisch nach dem Fifo-Verfahren und geben Sie den Wert des Endbestands an.',
      part: {
        skillId: 'H2-materialbewertung',
        seed: 9,
        variant: 'fifo-periodisch',
        partId: 'bewertung',
      },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'ueberrascht',
        text: 'Material ist bewertet, jetzt kommt das Personal. Im November zahlen wir das ganze Weihnachtsgeld – sind die Novemberdosen dann teurer?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Anfangsbestand 100 kg zu 10 €, Zugang 300 kg zu 14 €. Periodischer Durchschnittspreis?',
      optionen: [{ text: '13,00 €', richtig: true }, { text: '12,00 €' }, { text: '14,00 €' }],
    },
    {
      frage: 'Gleiche Daten, Verbrauch 200 kg, Fifo periodisch. Materialverbrauchskosten?',
      optionen: [{ text: '2.400 €', richtig: true }, { text: '2.800 €' }, { text: '2.600 €' }],
    },
    {
      frage: 'Bei welchem Verfahren stimmen periodische und permanente Rechnung immer überein?',
      optionen: [{ text: 'Fifo', richtig: true }, { text: 'Lifo' }, { text: 'Hifo' }],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'K1 Kap. 2.2.2 (S. 54–66: Einstandspreis frei Lager ohne USt, periodische und permanente Durchschnittsbewertung mit/ohne Anfangsbestand, Fifo/Lifo/Hifo/Lofo periodisch und permanent, Rundung der Durchschnittspreise auf 2 Stellen) und GC-15 abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
