// Lektion F3 – Wertmaßstäbe, Vorsichtsprinzip, Niederst- und Höchstwertprinzip
// (eigene Formulierung und eigene Zahlen; geprüft gegen BA 5.2, 5.3.1, 3.1.4)
import type { Lektion } from './types';

const STRENG = 'Strenges Niederstwertprinzip';
const GEMILDERT = 'Gemildertes Niederstwertprinzip';
const HOECHST = 'Höchstwertprinzip';

export const lektionF3: Lektion = {
  id: 'F3',
  skillId: 'F3-wertmassstaebe',
  abschnitt: 'F',
  titel: 'Was ist das wert? Wertmaßstäbe und Vorsicht',
  kernAha:
    'Vorsicht vor Optimismus: Vermögen höchstens zu (fortgeführten) Anschaffungs- oder Herstellungskosten und von zwei Werten der niedrigere – im Umlaufvermögen immer, im Anlagevermögen nur bei dauernder Wertminderung; Schulden zum höheren Wert.',
  dauerMin: 8,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'abfuellung',
  quelle: 'BA 5.2, S. 131–133; BA 5.3.1, S. 135–138; BA 3.1.4, S. 93',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Unsere Etikettiermaschine ist heute mehr wert als beim Kauf. Ab damit in die Bilanz!',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Ein Händler würde für unsere Etikettiermaschine heute 110.000 € zahlen, gekauft haben wir sie für 96.000 €. Schreiben wir doch den höheren Wert in die Bilanz!',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Schön wär’s. Dann stünde in der Bilanz ein Gewinn, den wir nie gemacht haben.',
        },
      ],
      frage: 'Mit welchem Wert gehört die Maschine am 31.12. in die Bilanz?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wenn du dein gebrauchtes Fahrrad für dein Budget schätzt, nimmst du lieber den vorsichtigen Wert. Sonst planst du mit Geld, das du nie siehst.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Bei Schulden ist es umgekehrt: lieber mit dem höheren Betrag rechnen. Dann gibt es keine böse Überraschung.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Die vier Wertmaßstäbe',
      text: 'Tippe auf die Karten.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Anschaffungskosten',
            text: 'Für Gekauftes (§ 255 Abs. 1 HGB): Anschaffungspreis plus Anschaffungsnebenkosten minus Anschaffungspreisminderungen wie Skonto oder Boni.',
            farbe: '#1c6670',
          },
          {
            titel: 'Herstellungskosten',
            text: 'Für selbst Hergestelltes (§ 255 Abs. 2 HGB): Aufwendungen für die Herstellung, die Erweiterung oder die wesentliche Verbesserung eines Vermögensgegenstands.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Fortgeführte Anschaffungs- oder Herstellungskosten',
            text: 'Anschaffungs- oder Herstellungskosten minus planmäßige Abschreibungen.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Tageswert',
            text: 'Auch Zeit- oder Wiederbeschaffungswert genannt: der allgemeine Wert, abgeleitet aus Börsen- oder Marktpreis.',
            farbe: '#e8792b',
          },
        ],
      },
      fazit:
        'Bei der Etikettiermaschine stehen sich zwei Werte gegenüber: die fortgeführten Anschaffungskosten und der Tageswert.',
    },
    {
      typ: 'vorhersage',
      frage:
        'Die Maschine kostete 96.000 €, wird über 8 Jahre linear abgeschrieben und ist jetzt 3 Jahre in Gebrauch. Ein Händler würde 110.000 € zahlen. Welcher Bilanzansatz ist richtig?',
      optionen: [
        {
          text: '60.000 € – die fortgeführten Anschaffungskosten',
          richtig: true,
          erklaerung: 'Richtig: Sie sind die Obergrenze für den Bilanzansatz.',
        },
        {
          text: '110.000 € – der höhere Tageswert',
          erklaerung: 'Das wäre ein Gewinn, der durch keinen Verkauf realisiert ist.',
        },
        {
          text: '96.000 € – die ursprünglichen Anschaffungskosten',
          erklaerung: 'Hier fehlen die planmäßigen Abschreibungen der drei Jahre.',
        },
      ],
      aufloesung:
        '96.000 € ÷ 8 Jahre = 12.000 € je Jahr; nach drei Jahren bleiben 60.000 €. Die fortgeführten Anschaffungskosten sind die Obergrenze – ein höherer Tageswert darf nicht angesetzt werden.',
    },
    {
      typ: 'konzept',
      titel: 'Das Vorsichtsprinzip',
      text: 'Vorsicht dient der Kapitalerhaltung und dem Gläubigerschutz: Vermögen zum niedrigeren, Schulden zum höheren Wert, vorhersehbare Risiken und Verluste erfassen. Anschaffungs- oder Herstellungskosten sind die Obergrenze, damit keine unrealisierten Gewinne erscheinen.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: STRENG,
            text: 'Umlaufvermögen: immer der niedrigere Wert – auch bei nur vorübergehender Wertminderung.',
            farbe: '#1c6670',
          },
          {
            titel: GEMILDERT,
            text: 'Anlagevermögen: außerplanmäßig abschreiben muss man nur bei voraussichtlich dauernder Wertminderung.',
            farbe: '#8cbf3f',
          },
          {
            titel: HOECHST,
            text: 'Schulden: von zwei möglichen Werten ist der höhere anzusetzen.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welcher Grundsatz greift?',
      kategorien: [STRENG, GEMILDERT, HOECHST],
      elemente: [
        {
          text: 'Aktien im Umlaufvermögen: Kurs am 31.12. gefallen, Erholung im Frühjahr erwartet',
          kategorie: STRENG,
        },
        {
          text: 'Etikettiermaschine: Ein neues Modell macht sie dauerhaft weniger wert',
          kategorie: GEMILDERT,
        },
        {
          text: 'Lieferantenrechnung in US-Dollar: Der Dollar ist bis zum Stichtag gestiegen',
          kategorie: HOECHST,
        },
        { text: 'Aromakonzentrat im Lager: Marktpreis gefallen', kategorie: STRENG },
        {
          text: 'Abfüllanlage: Gebrauchtpreise nur vorübergehend eingebrochen',
          kategorie: GEMILDERT,
          erklaerung:
            'Gemildertes Niederstwertprinzip: Bei nur vorübergehender Wertminderung bleibt es bei den fortgeführten Anschaffungskosten.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Herstellungskosten eines selbst gebauten Förderbands',
      text: 'Materialeinzelkosten 40.000 €, Fertigungslöhne 15.000 €, MGK 25 %, FGK 200 %, Sondereinzelkosten der Fertigung 3.000 €, anteilige Abschreibungen der Werkstattmaschinen 2.000 €, Verwaltungsgemeinkosten 10 %, Kantine und freiwillige soziale Leistungen 1.200 €, zurechenbare Fremdkapitalzinsen 1.500 €, Forschung 4.000 €, Sondereinzelkosten des Vertriebs 2.500 €.',
      schritte: [
        {
          text: 'Gemeinkosten berechnen',
          rechnung: 'MGK 25 % × 40.000 € = 10.000 €; FGK 200 % × 15.000 € = 30.000 €',
          warum: 'Die Zuschlagssätze beziehen sich auf die jeweiligen Einzelkosten.',
        },
        {
          text: 'Wertuntergrenze',
          rechnung: '40.000 + 10.000 + 15.000 + 30.000 + 3.000 + 2.000 = 100.000 €',
          warum:
            'Pflicht: Material- und Fertigungseinzelkosten, Sondereinzelkosten der Fertigung, angemessene Material- und Fertigungsgemeinkosten und der fertigungsbedingte Werteverzehr der Anlagen (Abschreibungen).',
        },
        {
          text: 'Wertobergrenze',
          rechnung:
            '100.000 + 10.000 (10 % Verwaltung) + 1.200 (Sozialkosten) + 1.500 (Fremdkapitalzinsen) = 112.700 €',
          warum:
            'Allgemeine Verwaltungskosten, Sozialkosten und zurechenbare Fremdkapitalzinsen dürfen einbezogen werden – Wahlrecht.',
        },
        {
          text: 'Forschung und Vertrieb',
          rechnung: 'Die 4.000 € Forschung und die 2.500 € Vertrieb bleiben draußen.',
          warum:
            'Forschungs- und Vertriebskosten gehören nicht zur Herstellung: Einbeziehungsverbot.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine Anlage im Anlagevermögen ist dauerhaft weniger wert. Ergänze die fortgeführten Anschaffungskosten, die außerplanmäßige Abschreibung und den Bilanzansatz.',
      skillId: 'F3-wertmassstaebe',
      seed: 5,
      variant: 'niederstwert-av',
      partId: 'wert',
      gefragt: ['fortgefuehrt', 'apl', 'ansatz'],
    },
    {
      typ: 'wer-hat-recht',
      frage:
        'Die Aktien der MBG im Umlaufvermögen notieren am 31.12. unter den Anschaffungskosten. Die Bank erwartet eine Erholung im Frühjahr. Muss abgeschrieben werden?',
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Das ist doch nur vorübergehend. Wir lassen die Anschaffungskosten einfach stehen.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Im Umlaufvermögen zählt auch eine vorübergehende Wertminderung. Wir schreiben auf den Börsenkurs ab.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Für das Umlaufvermögen gilt das strenge Niederstwertprinzip: immer der niedrigere Wert.',
          richtig: true,
        },
        { text: 'Aktien werden grundsätzlich zum höheren Wert angesetzt.' },
        {
          text: 'Abgeschrieben wird nur bei dauernder Wertminderung – das gilt für alle Vermögensgegenstände.',
        },
      ],
      aufloesung:
        'Die Ausnahme für nur vorübergehende Wertminderungen gibt es beim Anlagevermögen (gemildertes Niederstwertprinzip). Im Umlaufvermögen gilt stets der niedrigere Wert.',
    },
    {
      typ: 'merksatz',
      id: 'F3-m1',
      frage: 'Was besagen Niederstwert- und Höchstwertprinzip?',
      text: 'Vermögen höchstens zu (fortgeführten) Anschaffungs- oder Herstellungskosten. Umlaufvermögen: strenges Niederstwertprinzip – immer der niedrigere Wert. Anlagevermögen: gemildertes – außerplanmäßig abschreiben nur bei voraussichtlich dauernder Wertminderung. Schulden: Höchstwertprinzip – der höhere Wert.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Ermitteln Sie die Wertuntergrenze und die Wertobergrenze der Herstellungskosten nach § 255 Abs. 2 HGB.',
      part: {
        skillId: 'F3-wertmassstaebe',
        seed: 3,
        variant: 'herstellungskosten',
        partId: 'wert',
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Ich hab eine Idee: Wir leasen die neuen Gabelstapler. Dann tauchen sie gar nicht in unserer Bilanz auf, oder?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Welcher Bewertungsgrundsatz gilt für das Umlaufvermögen?',
      optionen: [
        { text: 'Strenges Niederstwertprinzip', richtig: true },
        { text: 'Gemildertes Niederstwertprinzip' },
        { text: 'Höchstwertprinzip' },
      ],
    },
    {
      frage:
        'Ein Vermögensgegenstand ist am Stichtag mehr wert als seine Anschaffungskosten. Was wird angesetzt?',
      optionen: [
        { text: 'Die Anschaffungskosten', richtig: true },
        { text: 'Der höhere Tageswert' },
        { text: 'Der Mittelwert aus beiden' },
      ],
    },
    {
      frage: 'Dürfen Vertriebskosten in die Herstellungskosten einbezogen werden?',
      optionen: [
        { text: 'Nein, es besteht ein Einbeziehungsverbot', richtig: true },
        { text: 'Ja, sie sind Pflichtbestandteil' },
        { text: 'Ja, als Wahlbestandteil' },
      ],
    },
    {
      frage: 'Eine Verbindlichkeit ist bis zum Stichtag gestiegen. Was gilt?',
      optionen: [
        { text: 'Der höhere Wert wird angesetzt (Höchstwertprinzip)', richtig: true },
        { text: 'Es bleibt beim ursprünglichen Wert' },
        { text: 'Der niedrigere Wert wird angesetzt' },
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
      'BA 5.2 (vier Wertmaßstäbe, § 255 Abs. 1 und 2, Tabelle 5 Herstellungskosten, Tageswert), BA 5.3.1 (Vorsichtsprinzip, Obergrenze, strenges und gemildertes Niederstwertprinzip, Höchstwertprinzip, Fremdwährungsbeispiel), BA 3.1.4 (Anschaffungskostenschema) abgeglichen am 03.11.2026; Zahlen von der Engine (GC-F3-1, GC-F3-3)',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
