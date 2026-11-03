// Lektion F8 – Rückstellungen (eigene Formulierung; BA 6.4, § 249 HGB; 03-aufgabentypen.md F8).
// Alle Beträge werden von der Engine berechnet.
import { formatSatz } from '../../engine/booking';
import { Val, formatEuro } from '../../engine/money';
import { solveF8, type F8Params } from '../../engine/generators/f2/rueckstellungen';
import type { Lektion } from './types';

const e = (v: { value: { toString(): string } } | string) =>
  formatEuro(typeof v === 'string' ? v : v.value.toString());
const satzText = (p: F8Params) => formatSatz(solveF8(p).buchung.saetze[0]!).replace(/\u00a0/g, ' ');

// Rechtsstreit mit einem Gastronomen: Rückstellung 20.000 €, ohne Umsatzsteuer
const KLAGE: F8Params = {
  fall: 'bildung',
  anlass: 'prozess',
  rueckstellung: '20000',
  tatsaechlich: '20000',
  ustSatz: '0.19',
};
// Unterlassene Instandhaltung: Kostenvoranschlag 12.000 € zzgl. USt, Rechnung im Februar 13.500 € zzgl. USt
const WARTUNG: F8Params = {
  ...KLAGE,
  anlass: 'instandhaltung',
  rueckstellung: '12000',
  tatsaechlich: '12000',
};
const WARTUNG_UST = new Val(WARTUNG.rueckstellung).times(WARTUNG.ustSatz).fix();
const WARTUNG_SPAETER: F8Params = { ...WARTUNG, fall: 'inanspruchnahme', tatsaechlich: '13500' };
const SPAETER = solveF8(WARTUNG_SPAETER);
const MINDER: F8Params = { ...WARTUNG, fall: 'inanspruchnahme', tatsaechlich: '11500' };
const MINDER_S = solveF8(MINDER);

export const lektionF8: Lektion = {
  id: 'F8',
  skillId: 'F8-rueckstellungen',
  abschnitt: 'F',
  titel: 'Schulden mit Fragezeichen',
  kernAha:
    'Eine Rückstellung ist eine Schuld, deren Grund feststeht, deren Höhe und/oder Fälligkeit aber noch ungewiss ist. Der Aufwand gehört ins alte Jahr (ohne Umsatzsteuer); weicht die Zahlung später ab, entsteht im neuen Jahr ein periodenfremder Aufwand oder ein Ertrag aus der Auflösung.',
  dauerMin: 8,
  figuren: ['frank', 'jana', 'leni', 'tobias', 'sabine'],
  ort: 'besprechung',
  quelle: 'BA 6.4 (§ 249 HGB); 03-aufgabentypen.md (F8)',
  teaser: {
    figur: 'frank',
    ausdruck: 'entsetzt',
    text: 'Eine Klage wegen Fassbier. Und das kurz vor Silvester.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'entsetzt',
          text: `Der Gastronom verlangt Schadenersatz. Unsere Anwältin rechnet mit etwa ${e(KLAGE.rueckstellung)}.`,
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Ob wir zahlen müssen und wie viel, entscheidet sich erst im nächsten Jahr.',
        },
      ],
      frage:
        'Gehört die Klage schon in den Abschluss des alten Jahres – obwohl noch nichts feststeht?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Wie bei der Nebenkostenabrechnung: Du weißt, dass eine Nachzahlung kommt, nur nicht wie hoch. Kluge Leute legen schon mal etwas zurück.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'In der Bilanz heißt das Rückstellung. Der Grund steht fest, Höhe oder Zeitpunkt noch nicht.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Rückstellung oder nicht?',
      text: 'Wie erfasst die MBG den Vorgang zum 31.12.?',
      kategorien: ['Rückstellung', 'Sonstige Verbindlichkeit', 'Keine Buchung im alten Jahr'],
      elemente: [
        {
          text: 'Klage eines Gastronomen, Ausgang und Höhe offen',
          kategorie: 'Rückstellung',
        },
        {
          text: 'Die Wartung der Abfüllanlage fiel im Dezember aus und wird im Februar nachgeholt.',
          kategorie: 'Rückstellung',
          erklaerung:
            'Unterlassene Instandhaltung, die in den ersten drei Monaten nachgeholt wird.',
        },
        {
          text: 'Die MBG ersetzt einem Großhändler aus Kulanz beschädigte Etiketten, obwohl die Frist abgelaufen ist.',
          kategorie: 'Rückstellung',
        },
        {
          text: 'Die Dezembermiete steht fest und wird am 8. Januar überwiesen.',
          kategorie: 'Sonstige Verbindlichkeit',
          erklaerung: 'Höhe und Fälligkeit sind sicher – das ist keine Rückstellung.',
        },
        {
          text: 'In zwei Jahren soll eine neue Abfülllinie gekauft werden.',
          kategorie: 'Keine Buchung im alten Jahr',
          erklaerung:
            'Eine bloße Planung ist keine Verpflichtung und kein Aufwand des alten Jahres.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Wann ist eine Rückstellung Pflicht?',
      text: 'Das HGB schreibt Rückstellungen vor für ungewisse Verbindlichkeiten, drohende Verluste aus schwebenden Geschäften, unterlassene Instandhaltung mit Nachholung in den ersten drei Monaten und Kulanzgewährleistungen.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Ungewisse Verbindlichkeiten',
            text: 'Prozesskosten, Garantien, Steuernachzahlungen',
            farbe: '#1c6670',
          },
          {
            titel: 'Drohende Verluste',
            text: 'aus Verträgen, die noch nicht erfüllt sind',
            farbe: '#c2410c',
          },
          {
            titel: 'Unterlassene Instandhaltung',
            text: 'nachgeholt in den ersten drei Monaten',
            farbe: '#65a30d',
          },
          { titel: 'Kulanz', text: 'Gewährleistung ohne rechtliche Pflicht', farbe: '#ca8a04' },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Für die ausgefallene Wartung liegt ein Kostenvoranschlag über ${e(WARTUNG.rueckstellung)} zuzüglich ${e(WARTUNG_UST)} Umsatzsteuer vor. Mit welchem Betrag wird die Rückstellung gebildet?`,
      optionen: [
        { text: e(WARTUNG.rueckstellung), richtig: true },
        { text: e(WARTUNG_UST.plus(WARTUNG.rueckstellung)) },
        { text: e(WARTUNG_UST) },
      ],
      aufloesung: `Ohne Umsatzsteuer: Es gibt noch keine Rechnung und damit keine Vorsteuer. Buchung: ${satzText(WARTUNG)}.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Im Februar kommt die Rechnung',
      text: `Rückstellung ${e(WARTUNG.rueckstellung)}. Rechnung der Fachfirma: ${e(WARTUNG_SPAETER.tatsaechlich)} zuzüglich ${e(SPAETER.vorsteuer)} Umsatzsteuer, sofort überwiesen.`,
      schritte: [
        {
          text: 'Netto vergleichen',
          rechnung: `${e(WARTUNG_SPAETER.tatsaechlich)} − ${e(WARTUNG.rueckstellung)} = ${e(SPAETER.differenz)} Mehrbetrag`,
          warum: 'Die Rückstellung wurde ohne Steuer gebildet, also wird auch netto verglichen.',
        },
        {
          text: 'Rückstellung ausbuchen',
          rechnung: `Rückstellungen ${e(WARTUNG.rueckstellung)} im Soll`,
          warum: 'Der Anlass ist erledigt, die Rückstellung wird vollständig verbraucht.',
        },
        {
          text: 'Mehrbetrag',
          rechnung: `Periodenfremde Aufwendungen ${e(SPAETER.differenz)}`,
          warum: 'Der Mehrbetrag gehört sachlich ins alte Jahr, wird aber erst jetzt bekannt.',
        },
        {
          text: 'Vorsteuer und Bank',
          rechnung: `Vorsteuer ${e(SPAETER.vorsteuer)} an Bank ${e(SPAETER.bank)}`,
          warum: 'Mit der Rechnung entsteht jetzt der Vorsteuerabzug.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Die Rechnung lautet nur über ${e(MINDER.tatsaechlich)} netto. Was passiert mit den restlichen ${e(MINDER_S.differenz)}?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Die lassen wir einfach stehen. Ein kleines Polster für schlechte Zeiten!',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Nein, die Rückstellung wird ganz aufgelöst. Der Rest ist ein Ertrag.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Eine Rückstellung darf nur so lange bestehen, wie ihr Grund besteht.',
          richtig: true,
        },
        { text: 'Rückstellungen dürfen nie verändert werden.' },
        { text: 'Der Rest wird als Vorsteuer erstattet.' },
      ],
      aufloesung: `Buchung: ${satzText(MINDER)}. Ein Polster ohne Anlass würde den Gewinn zu niedrig und die Schulden zu hoch zeigen.`,
    },
    {
      typ: 'erkunden',
      titel: 'Wie endet der Rechtsstreit?',
      text: `Rückstellung für die Klage: ${e(KLAGE.rueckstellung)}. Decke auf, was im neuen Jahr gebucht wird.`,
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Vergleich genau in Höhe der Rückstellung',
            text: satzText({ ...KLAGE, fall: 'inanspruchnahme' }),
            farbe: '#1c6670',
          },
          {
            titel: 'Es wird teurer',
            text: satzText({ ...KLAGE, fall: 'inanspruchnahme', tatsaechlich: '23000' }),
            farbe: '#c2410c',
          },
          {
            titel: 'Es wird billiger',
            text: satzText({ ...KLAGE, fall: 'inanspruchnahme', tatsaechlich: '17000' }),
            farbe: '#65a30d',
          },
          {
            titel: 'Klage zurückgezogen',
            text: satzText({ ...KLAGE, fall: 'aufloesung', tatsaechlich: '0' }),
            farbe: '#ca8a04',
          },
        ],
      },
      fazit:
        'Die Rückstellung wird immer vollständig ausgebucht. Nur die Differenz berührt den Erfolg des neuen Jahres.',
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Die Rechnung für eine nachgeholte Wartung ist da. Ergänze die Differenz und den Überweisungsbetrag.',
      skillId: 'F8-rueckstellungen',
      seed: 21,
      variant: 'inanspruchnahme',
      partId: 'vergleich',
      gefragt: ['differenz', 'bank'],
    },
    {
      typ: 'verstaendnis',
      frage: 'Wie wirkt die Bildung einer Rückstellung auf den Gewinn des alten Jahres?',
      optionen: [
        { text: 'Sie mindert ihn, weil Aufwand gebucht wird.', richtig: true },
        {
          text: 'Gar nicht, es fließt ja noch kein Geld.',
          erklaerung: 'Gewinn ist nicht gleich Zahlung.',
        },
        { text: 'Sie erhöht ihn, weil eine Schuld entsteht.' },
      ],
      figur: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Kein Geld weg – und trotzdem weniger Gewinn?',
      },
    },
    {
      typ: 'merksatz',
      id: 'F8-m1',
      frage: 'Wie werden Rückstellungen gebildet und später gebucht?',
      text: 'Bildung: Aufwandskonto an Rückstellungen (netto, ohne Umsatzsteuer). Im neuen Jahr die Rückstellung vollständig ausbuchen; Mehrbetrag als periodenfremder Aufwand, Minderbetrag als Ertrag aus der Auflösung von Rückstellungen.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz zum 31.12.',
      part: { skillId: 'F8-rueckstellungen', seed: 2, variant: 'bildung', partId: 'buchung' },
      cliffhanger: {
        figur: 'sabine',
        ausdruck: 'neutral',
        text: 'Die Bank möchte unsere GuV sehen – sauber gegliedert wie bei den Großen. Was heißt das eigentlich?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Kostenvoranschlag 5.000 € zzgl. 19 % USt für eine im Januar nachgeholte Reparatur. Wie hoch ist die Rückstellung?',
      optionen: [
        { text: '5.000,00 €', richtig: true },
        { text: '5.950,00 €' },
        { text: '950,00 €' },
      ],
    },
    {
      frage:
        'Eine Rückstellung von 8.000 € wird mit 9.000 € in Anspruch genommen (ohne USt). Wie wird der Mehrbetrag gebucht?',
      optionen: [
        { text: 'Periodenfremde Aufwendungen 1.000 €', richtig: true },
        { text: 'Erträge aus der Auflösung von Rückstellungen 1.000 €' },
        { text: 'Er wird nicht gebucht.' },
      ],
    },
    {
      frage: 'Worin unterscheidet sich eine Rückstellung von einer sonstigen Verbindlichkeit?',
      optionen: [
        { text: 'Bei der Rückstellung sind Höhe und/oder Fälligkeit ungewiss.', richtig: true },
        { text: 'Rückstellungen stehen auf der Aktivseite.' },
        { text: 'Sonstige Verbindlichkeiten mindern den Gewinn nicht.' },
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
      'Gegen BA 6.4 geprüft (§ 249 HGB, Passivierungspflichten, Inanspruchnahme mit Mehr-/Minderbetrag, Gewinnminderung); Umsatzsteuer bei Bildung ausgeschlossen; Zahlen aus der Engine (solveF8); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
