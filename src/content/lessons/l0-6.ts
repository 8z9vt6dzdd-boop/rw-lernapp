// Lektion 0.6 – Das Konto: ein Notizzettel mit zwei Spalten (eigene Formulierung; geprüft gegen BA 2.3.1.4)
import { sum } from '../../engine/money';
import type { Lektion } from './types';

// Klausurbrücke: Werte von der Engine berechnet
const ZUGAENGE = ['15000', '6000', '2500'];
const ABGAENGE = ['4200', '1300'];
const SOLL = sum(ZUGAENGE);
const HABEN = sum(ABGAENGE);
const SALDO = SOLL.minus(HABEN);

export const lektion06: Lektion = {
  id: '0.6',
  skillId: '0.6-konto',
  abschnitt: '0',
  titel: 'Das Konto: ein Notizzettel mit zwei Spalten',
  kernAha:
    'Ein Konto hat zwei Seiten. Soll heißt nur „links“, Haben nur „rechts“ – nicht „sollen“ und „haben“.',
  dauerMin: 5,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 2.3.1.4',
  teaser: {
    figur: 'tobias',
    ausdruck: 'ueberrascht',
    text: 'Im Konto Bank steht „Soll 5.000“. Sollen wir das noch zahlen?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'ueberrascht',
          text: 'Jana, im Konto Bank steht „Soll 5.000“. Sollen wir das noch zahlen?',
        },
        { figur: 'jana', ausdruck: 'freut', text: 'Gute Frage. Falsche Spur.' },
      ],
      frage: 'Was bedeutet „Soll“ in der Buchhaltung wirklich?',
    },
    {
      typ: 'konzept',
      titel: 'Wie die WG-Kasse am Kühlschrank',
      text: 'Links notiert ihr, was in die Kasse kommt, rechts, was rausgeht. Am Monatsende zieht ihr die Differenz – das ist der Bestand. Ein Konto funktioniert genauso: zwei Spalten, eine Differenz.',
      visual: {
        typ: 'tkonto',
        name: 'WG-Kasse',
        soll: [
          { text: 'Anfang', betrag: '50' },
          { text: 'Einzahlung Mia', betrag: '20' },
        ],
        haben: [{ text: 'Einkauf', betrag: '35' }],
        saldo: true,
      },
    },
    {
      typ: 'vorhersage',
      frage: 'Im Konto Bank steht links „Soll 5.000 €“. Was heißt das?',
      optionen: [
        { text: 'Die MBG soll noch 5.000 € zahlen.' },
        { text: 'Die 5.000 € stehen auf der linken Seite des Kontos.', richtig: true },
        { text: 'Der Betrag ist noch nicht bezahlt.' },
      ],
      aufloesung:
        'Soll ist einfach der Name der linken Seite, Haben der Name der rechten. Die Wörter stammen von italienischen Kaufleuten vor rund 500 Jahren – mit „sollen“ oder „haben“ im heutigen Sinn haben sie nichts zu tun.',
    },
    {
      typ: 'erkunden',
      titel: 'Buche das Bankkonto der MBG',
      text: 'Bei einem Konto für Vermögen wie Bank stehen Anfangsbestand und Zugänge links. Wohin gehören die Vorgänge?',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Bank',
        anfang: { seite: 'soll', text: 'Anfangsbestand', betrag: '20000' },
        vorgaenge: [
          { text: 'Kunde überweist', betrag: '5000', seite: 'soll' },
          { text: 'Miete Lager überwiesen', betrag: '3000', seite: 'haben' },
          { text: 'Darlehen ausgezahlt', betrag: '10000', seite: 'soll' },
          { text: 'Lieferant bezahlt', betrag: '7000', seite: 'haben' },
        ],
      },
      fazit:
        'Links 35.000 €, rechts 10.000 €. Die Differenz von 25.000 € ist der Saldo – so viel liegt am Ende auf dem Bankkonto. Er wird auf der kleineren Seite eingetragen, damit beide Seiten gleich groß sind.',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Konten für Vermögen – also alles, was in der Bilanz links steht – heißen Aktivkonten. Anfangsbestand und Zugänge kommen ins Soll.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Bei Passivkonten wie Darlehen ist es genau umgekehrt. Sie stehen in der Bilanz ja auch rechts.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Soll oder Haben?',
      text: 'Wo wird gebucht?',
      kategorien: ['Soll', 'Haben'],
      elemente: [
        {
          text: 'Zugang auf dem Konto Bank',
          kategorie: 'Soll',
          erklaerung: 'Aktivkonto: Zugänge im Soll.',
        },
        {
          text: 'Abgang auf dem Konto Kasse',
          kategorie: 'Haben',
          erklaerung: 'Aktivkonto: Abgänge im Haben.',
        },
        {
          text: 'Anfangsbestand Rohstoffe',
          kategorie: 'Soll',
          erklaerung: 'Aktivkonto: Anfangsbestand im Soll.',
        },
        {
          text: 'Neue Verbindlichkeit gegenüber einem Lieferanten',
          kategorie: 'Haben',
          erklaerung: 'Passivkonto: Zugänge im Haben.',
        },
        {
          text: 'Tilgung eines Darlehens',
          kategorie: 'Soll',
          erklaerung: 'Passivkonto: Abgänge im Soll.',
        },
        {
          text: 'Anfangsbestand Eigenkapital',
          kategorie: 'Haben',
          erklaerung: 'Passivkonto: Anfangsbestand im Haben.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Ein Konto abschließen',
      text: 'Konto Kasse: Anfangsbestand 3.000 €, Einzahlung 1.500 €, Barzahlung 900 €.',
      visual: {
        typ: 'tkonto',
        name: 'Kasse',
        soll: [
          { text: 'Anfangsbestand', betrag: '3000' },
          { text: 'Einzahlung', betrag: '1500' },
        ],
        haben: [{ text: 'Barzahlung', betrag: '900' }],
        saldo: true,
      },
      schritte: [
        {
          text: 'Die größere Seite addieren.',
          rechnung: 'Soll: 3.000 + 1.500 = 4.500 €',
          warum: 'Die größere Seite gibt die Summe vor, die am Ende auf beiden Seiten stehen muss.',
        },
        {
          text: 'Die Summe auf die kleinere Seite übertragen.',
          rechnung: 'Haben: Summe ebenfalls 4.500 €',
          warum:
            'Ein abgeschlossenes Konto hat auf beiden Seiten dieselbe Summe – wie eine Bilanz.',
        },
        {
          text: 'Die Differenz als Saldo auf der kleineren Seite eintragen.',
          rechnung: '4.500 − 900 = 3.600 € (Schlussbestand im Haben)',
          warum:
            'Der Saldo füllt die Lücke. Er ist der Betrag, der am Ende noch in der Kasse liegt.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Konto Verbindlichkeiten: Anfangsbestand 12.000 €, neue Schulden 4.000 €, bezahlt 6.000 €. Wo steht der Schlussbestand, und wie hoch ist er?',
      optionen: [
        {
          text: 'Im Soll, 10.000 €',
          richtig: true,
          erklaerung:
            'Haben: 12.000 + 4.000 = 16.000 €. Soll: 6.000 €. Saldo 10.000 € auf der kleineren Seite, also im Soll.',
        },
        {
          text: 'Im Haben, 10.000 €',
          erklaerung:
            'Der Betrag stimmt, die Seite nicht: Der Saldo steht immer auf der kleineren Seite – hier im Soll.',
        },
        {
          text: 'Im Soll, 22.000 €',
          erklaerung: 'Bezahlte Schulden mindern das Konto. 12.000 + 4.000 − 6.000 = 10.000 €.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: '0.6-m1',
      text: 'Ein Konto hat zwei Seiten: Soll = links, Haben = rechts – mehr bedeuten die Wörter nicht. Aktivkonten: Anfangsbestand und Zugänge im Soll. Passivkonten: im Haben. Der Saldo steht auf der kleineren Seite.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Das Konto Bank der MBG weist einen Anfangsbestand von 15.000,00 € auf. Zugänge: 6.000,00 € und 2.500,00 €. Abgänge: 4.200,00 € und 1.300,00 €. Schließen Sie das Konto ab.',
      part: {
        typ: 'rechenkette',
        id: 'konto-bank',
        titel: 'Abschluss Konto Bank',
        felder: [
          {
            typ: 'zahl',
            id: 'soll',
            label: 'Summe der Soll-Seite (ohne Saldo)',
            kind: 'betrag',
            einheit: '€',
            soll: SOLL,
          },
          {
            typ: 'zahl',
            id: 'haben',
            label: 'Summe der Haben-Seite (ohne Saldo)',
            kind: 'betrag',
            einheit: '€',
            soll: HABEN,
          },
          {
            typ: 'zahl',
            id: 'saldo',
            label: 'Schlussbestand (Saldo)',
            kind: 'betrag',
            einheit: '€',
            soll: SALDO,
          },
          {
            typ: 'auswahl',
            id: 'seite',
            label: 'Der Saldo steht im …',
            optionen: ['Soll', 'Haben'],
            soll: 'Haben',
          },
        ],
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'feiert',
        text: 'Ich hab dem Aromenlieferanten versprochen, dass wir schnell zahlen – dafür gibt er uns sogar 2 % Skonto. Gut, oder?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was bedeutet „Soll“ bei einem Konto?',
      optionen: [
        { text: 'Die linke Seite', richtig: true },
        { text: 'Einen Betrag, der noch zu zahlen ist' },
        { text: 'Einen geplanten Wert' },
      ],
    },
    {
      frage: 'Wo stehen Zugänge auf einem Aktivkonto wie Bank?',
      optionen: [
        { text: 'Im Soll', richtig: true },
        { text: 'Im Haben' },
        { text: 'Je nach Betrag' },
      ],
    },
    {
      frage: 'Konto Kasse: Soll 4.500 €, Haben 900 €. Saldo?',
      optionen: [
        { text: '3.600 € im Haben', richtig: true },
        { text: '3.600 € im Soll' },
        { text: '5.400 € im Haben' },
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
      'BA 2.3.1.4 (Soll links, Haben rechts, Aufbau Aktiv-/Passivkonten, Kontenabschluss) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
