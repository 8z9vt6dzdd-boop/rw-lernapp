// Lektion F5 – Bewertung des Umlaufvermögens: Vorräte, Bewertungsvereinfachungen, Niederstwerttest
// (eigene Formulierung und eigene Zahlen; geprüft gegen BA 5.3.5.1 und 5.3.1)
import type { Lektion } from './types';

const RHB = 'Roh-, Hilfs- und Betriebsstoffe';
const FE = 'Fertige Erzeugnisse';
const UE = 'Unfertige Erzeugnisse';
const HW = 'Handelswaren';

export const lektionF5: Lektion = {
  id: 'F5',
  skillId: 'F5-bewertung-uv',
  abschnitt: 'F',
  titel: 'Inventur im Konzentratlager: Welcher Preis gilt?',
  kernAha:
    'Gleichartige Vorräte werden mit einer Bewertungsvereinfachung bewertet (gewogener Durchschnitt, Fifo, Lifo) – danach kommt immer noch der Niederstwerttest: Im Umlaufvermögen gilt stets der niedrigere Wert, höchstens die Anschaffungskosten.',
  dauerMin: 8,
  figuren: ['jana', 'tobias', 'leni'],
  ort: 'lager',
  quelle: 'BA 5.3.5.1, S. 143–145; BA 5.3.1, S. 136',
  teaser: {
    figur: 'jana',
    ausdruck: 'gruebelt',
    text: '1.200 kg Konzentrat im Tank, vier verschiedene Einkaufspreise. Welcher gilt?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Im Tank sind noch 1.200 kg Aromakonzentrat. Eingekauft haben wir dieses Jahr zu vier verschiedenen Preisen.',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Nimm einfach den höchsten Preis. Dann sieht die Bilanz am schönsten aus.',
        },
      ],
      frage: 'Welcher Kilopreis gehört in die Bilanz – und darf Tobias sich den aussuchen?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Stell dir eine Kaffeedose vor, in die du immer neue Bohnen aus verschiedenen Packungen kippst. Welche Bohnen gerade drin sind, weiß am Ende niemand genau.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Deshalb erlaubt das Gesetz bei gleichartigen Vorräten Vereinfachungen. Man bildet einen Durchschnitt oder unterstellt eine Verbrauchsreihenfolge.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Angenommen, das zuerst gekaufte Konzentrat wird auch zuerst verbraucht. Aus welchen Lieferungen stammen die 1.200 kg im Tank?',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Anfangsbestand 1.1.', text: '1.000 kg zu 4,00 €/kg', farbe: '#7fa88e' },
          { titel: 'Zugang März', text: '2.000 kg zu 4,60 €/kg', farbe: '#8cbf3f' },
          { titel: 'Zugang Juli', text: '1.500 kg zu 5,20 €/kg', farbe: '#e2b13c' },
          { titel: 'Zugang Oktober', text: '500 kg zu 4,80 €/kg', farbe: '#e8792b' },
        ],
      },
      optionen: [
        { text: 'Aus den letzten Lieferungen: Oktober und Juli', richtig: true },
        {
          text: 'Aus dem Anfangsbestand und der März-Lieferung',
          erklaerung: 'Das wäre der Fall, wenn das zuletzt Gekaufte zuerst verbraucht würde.',
        },
        {
          text: 'Aus allen Lieferungen zu gleichen Teilen',
          erklaerung: 'Das entspräche eher der Idee des Durchschnitts, nicht einer Reihenfolge.',
        },
      ],
      aufloesung:
        'Das ist das Fifo-Verfahren (first in, first out): Der Endbestand stammt aus den letzten Zugängen – 500 kg aus Oktober, 700 kg aus Juli. Beim Lifo-Verfahren (last in, first out) ist es umgekehrt: Der Endbestand stammt aus Anfangsbestand und ersten Zugängen.',
    },
    {
      typ: 'konzept',
      titel: 'Bewertungsvereinfachungen',
      text: 'Grundsätzlich wird jeder Vermögensgegenstand einzeln bewertet. Bei gleichartigen Vorräten erlaubt das Gesetz Vereinfachungen: gewogener Durchschnitt (§ 240 Abs. 4 HGB), Fifo und Lifo sowie unter Voraussetzungen einen Festwert (§ 240 Abs. 3 HGB).',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Gewogener Durchschnitt',
            text: 'Gesamtwert aller Posten ÷ Gesamtmenge. Auch steuerlich anerkannt.',
            farbe: '#1c6670',
          },
          {
            titel: 'Fifo',
            text: 'Zuerst beschafft, zuerst verbraucht: Endbestand aus den letzten Zugängen.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Lifo',
            text: 'Zuletzt beschafft, zuerst verbraucht: Endbestand aus Anfangsbestand und ersten Zugängen.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Festwert',
            text: 'Fester Bestand zu festem Wert, der in den Folgejahren beibehalten wird.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'verstaendnis',
      frage: 'Für welchen Vorrat kommt ein Festwert am ehesten in Frage?',
      figur: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Ein Festwert spart Arbeit. Aber nicht für alles passt er.',
      },
      optionen: [
        {
          text: 'Reinigungsmittel für die Abfüllanlage: regelmäßig ersetzt, geringer Gesamtwert, kaum Schwankungen',
          richtig: true,
          erklaerung:
            'Richtig: regelmäßiger Ersatz, nachrangige Bedeutung des Gesamtwerts und nur geringe Veränderungen nach Wert, Menge und Zusammensetzung.',
        },
        {
          text: 'Aromakonzentrat: großer Wert, stark schwankende Mengen und Preise',
          erklaerung:
            'Wert und Menge schwanken stark, und der Gesamtwert ist bedeutend – das passt nicht zum Festwert.',
        },
        {
          text: 'Liboriwein für den Weiterverkauf, je nach Saison sehr unterschiedliche Mengen',
          erklaerung:
            'Ein Festwert ist für Sachanlagen sowie Roh-, Hilfs- und Betriebsstoffe gedacht, deren Bestand sich kaum ändert.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Gewogener Durchschnitt und Niederstwerttest',
      text: 'Lieferungen wie oben, Endbestand 1.200 kg. Der Tageswert (Wiederbeschaffungspreis) am 31.12. beträgt 4,50 €/kg.',
      schritte: [
        {
          text: 'Gesamtwert und Gesamtmenge',
          rechnung: '4.000 + 9.200 + 7.800 + 2.400 = 23.400 € für 5.000 kg',
          warum: 'Jede Lieferung zählt mit ihrer Menge – deshalb heißt der Durchschnitt gewogen.',
        },
        {
          text: 'Anschaffungskosten des Endbestands',
          rechnung: '23.400 € ÷ 5.000 kg = 4,68 €/kg; 1.200 kg × 4,68 € = 5.616,00 €',
          warum: 'So hoch wären die Anschaffungskosten der 1.200 kg.',
        },
        {
          text: 'Niederstwerttest',
          rechnung: '1.200 kg × 4,50 € = 5.400,00 € < 5.616,00 €; Abschreibung 216,00 €',
          warum: 'Umlaufvermögen: strenges Niederstwertprinzip – der niedrigere Wert zählt.',
        },
        {
          text: 'Schlussbilanzkonto',
          rechnung: 'SBK an Rohstoffe 5.400,00 €',
          warum: 'Der Bilanzansatz geht in das Schlussbilanzkonto.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Diesmal nach Fifo. Ergänze die Anschaffungskosten des Endbestands, den Tageswert und den Bilanzansatz.',
      skillId: 'F5-bewertung-uv',
      seed: 3,
      variant: 'fifo',
      partId: 'bewertung',
      gefragt: ['ak', 'tw', 'ansatz'],
    },
    {
      typ: 'wer-hat-recht',
      frage:
        'Der Marktpreis für Konzentrat ist bis zum 31.12. über den Einkaufspreis gestiegen. Mit welchem Wert kommt der Endbestand in die Bilanz?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Mit dem höheren Marktpreis! Der Vorrat ist schließlich mehr wert geworden.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Höchstens mit den Anschaffungskosten. Der Wertzuwachs ist noch nicht realisiert.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Anschaffungskosten sind die Obergrenze; nicht realisierte Gewinne dürfen nicht ausgewiesen werden.',
          richtig: true,
        },
        { text: 'Vorräte werden immer mit dem Marktpreis bewertet.' },
        { text: 'Bei steigenden Preisen muss man auf Lifo umstellen.' },
      ],
      aufloesung:
        'Die Bewertungsvereinfachung liefert die Anschaffungskosten; der Niederstwerttest kann sie nur senken, nie erhöhen. Ein höherer Marktpreis bleibt unberücksichtigt, bis das Konzentrat verkauft oder verarbeitet ist.',
    },
    {
      typ: 'sortieren',
      titel: 'Was gehört zu welchem Vorratsposten?',
      kategorien: [RHB, UE, FE, HW],
      elemente: [
        { text: 'Aromakonzentrat im Rohstofftank', kategorie: RHB },
        { text: 'Etiketten für Senne Lemon', kategorie: RHB },
        { text: 'Angesetzter Sirup im Lagertank', kategorie: UE },
        { text: 'Palettierte Dosen Paderquell Energy im Logistikzentrum', kategorie: FE },
        { text: 'Zugekaufter Liboriwein', kategorie: HW },
      ],
    },
    {
      typ: 'merksatz',
      id: 'F5-m1',
      frage: 'Wie werden gleichartige Vorräte am Bilanzstichtag bewertet?',
      text: 'Erst die Anschaffungskosten des Endbestands vereinfacht ermitteln: gewogener Durchschnitt, Fifo (Endbestand aus den letzten Zugängen) oder Lifo (aus Anfangsbestand und ersten Zugängen). Dann der Niederstwerttest: Im Umlaufvermögen gilt stets der niedrigere Wert, höchstens die Anschaffungskosten.',
    },
    {
      typ: 'klausur',
      punkte: 5,
      aufgabe:
        'Bewerten Sie den Endbestand nach dem gewogenen Durchschnitt unter Beachtung des Niederstwertprinzips und geben Sie den Bilanzansatz an.',
      part: { skillId: 'F5-bewertung-uv', seed: 4, variant: 'durchschnitt', partId: 'bewertung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'entsetzt',
        text: 'Schlechte Nachricht: Das Bistro Paderufer hat Insolvenz beantragt. Die schulden uns noch eine komplette Sommerlieferung.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Fifo-Verfahren: Woraus besteht der Endbestand?',
      optionen: [
        { text: 'Aus den letzten Zugängen', richtig: true },
        { text: 'Aus Anfangsbestand und ersten Zugängen' },
        { text: 'Aus dem Durchschnitt aller Zugänge' },
      ],
    },
    {
      frage:
        'Der Tageswert eines Vorrats liegt am Stichtag unter den Anschaffungskosten. Was wird angesetzt?',
      optionen: [
        { text: 'Der niedrigere Tageswert', richtig: true },
        { text: 'Die Anschaffungskosten' },
        { text: 'Der Mittelwert aus beiden' },
      ],
    },
    {
      frage: 'Wie berechnet man den gewogenen Durchschnittspreis?',
      optionen: [
        { text: 'Gesamtwert aller Posten ÷ Gesamtmenge', richtig: true },
        { text: 'Mittelwert der Einkaufspreise' },
        { text: 'Preis der letzten Lieferung' },
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
      'BA 5.3.5.1 (Gliederung der Vorräte, strenges Niederstwertprinzip im Umlaufvermögen, Einzelbewertung und Sammelbewertung, gewogener Durchschnitt § 240 Abs. 4, Festwert § 240 Abs. 3 mit Voraussetzungen, Fifo und Lifo, Vereinfachungen entbinden nicht vom Niederstwerttest), BA 5.3.1 (Obergrenze Anschaffungskosten), Lösungshinweis Übungsaufgabe 28 c (SBK an Hilfsstoffe zum Anschaffungswert) abgeglichen am 03.11.2026; Zahlen von der Engine (GC-F5-1, GC-F5-2)',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
