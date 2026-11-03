// Lektion 0.3 – Die Bilanz: das Foto am 31.12. (eigene Formulierung; fachlich geprüft gegen BA 2.3.1)
import type { Lektion } from './types';

const SEITE = ['Aktiva', 'Passiva'];

export const lektion03: Lektion = {
  id: '0.3',
  skillId: '0.3-bilanz',
  abschnitt: '0',
  titel: 'Die Bilanz: das Foto am 31.12.',
  kernAha:
    'Links steht, wofür das Geld eingesetzt ist (Vermögen), rechts, woher es kommt (Kapital). Beide Seiten sind immer gleich groß.',
  dauerMin: 5,
  figuren: ['jana', 'frank', 'tobias', 'leni'],
  ort: 'buero',
  quelle: 'BA 2.3.1',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Die Sparkasse will wissen, wie wir dastehen. Jana sagt, wir schicken ein Foto?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Die Sparkasse fragt, wie die MBG eigentlich dasteht. Was schicke ich denen?',
        },
        { figur: 'jana', ausdruck: 'freut', text: 'Ganz einfach: ein Foto vom 31. Dezember.' },
      ],
      frage: 'Ein Foto von einer Firma? Was könnte Jana damit meinen?',
    },
    {
      typ: 'konzept',
      titel: 'Ein Foto am Stichtag',
      text: 'Eine Bilanz ist eine Momentaufnahme: Was besitzt die MBG an einem bestimmten Tag – und woher stammt das Geld dafür? Links das eine, rechts das andere. Wie eine Waage.',
      visual: { typ: 'waage', links: [], rechts: [] },
    },
    {
      typ: 'sortieren',
      titel: 'Was haben wir – und woher kommt das Geld?',
      text: 'Sortiere die Posten der MBG.',
      kategorien: ['Was wir haben', 'Woher das Geld kommt'],
      elemente: [
        { text: 'Abfüllanlage', kategorie: 'Was wir haben' },
        { text: 'Guthaben auf dem Bankkonto', kategorie: 'Was wir haben' },
        {
          text: 'Kredit der Sparkasse',
          kategorie: 'Woher das Geld kommt',
          erklaerung: 'Ein Kredit ist geliehenes Geld – eine Quelle, kein Besitz.',
        },
        { text: 'Dosen im Lager', kategorie: 'Was wir haben' },
        {
          text: 'Offene Rechnung des Aromenlieferanten',
          kategorie: 'Woher das Geld kommt',
          erklaerung:
            'Die Aromen sind schon da, bezahlt sind sie noch nicht: Der Lieferant hat sie quasi vorfinanziert.',
        },
        {
          text: 'Einlage von Frank und Sabine',
          kategorie: 'Woher das Geld kommt',
          erklaerung: 'Das Geld der Eigentümer heißt Eigenkapital.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Die MBG kauft einen Gabelstapler für 30.000 € und finanziert ihn mit einem Kredit. Was passiert mit der Waage?',
      visual: {
        typ: 'waage',
        links: [
          { text: 'Abfüllanlage', betrag: '400000' },
          { text: 'Dosen im Lager', betrag: '60000' },
          { text: 'Bank', betrag: '90000' },
        ],
        rechts: [
          { text: 'Eigenkapital', betrag: '300000' },
          { text: 'Darlehen Sparkasse', betrag: '200000' },
          { text: 'Verbindlichkeiten', betrag: '50000' },
        ],
      },
      optionen: [
        { text: 'Sie kippt nach links – die MBG hat ja mehr.' },
        { text: 'Sie kippt nach rechts – die Schulden steigen.' },
        { text: 'Sie bleibt gerade – beide Seiten wachsen um 30.000 €.', richtig: true },
      ],
      aufloesung:
        'Der Stapler kommt links dazu, der Kredit rechts. Beide Seiten werden um 30.000 € größer, die Waage bleibt im Gleichgewicht. Probier es gleich selbst aus.',
    },
    {
      typ: 'erkunden',
      titel: 'Leg den Gabelstapler auf die Waage',
      text: 'Lege den neuen Stapler und den Kredit auf die richtige Seite.',
      erkunden: {
        art: 'waage-zuordnen',
        start: {
          links: [
            { text: 'Abfüllanlage', betrag: '400000' },
            { text: 'Dosen im Lager', betrag: '60000' },
            { text: 'Bank', betrag: '90000' },
          ],
          rechts: [
            { text: 'Eigenkapital', betrag: '300000' },
            { text: 'Darlehen Sparkasse', betrag: '200000' },
            { text: 'Verbindlichkeiten', betrag: '50000' },
          ],
        },
        posten: [
          { text: 'Gabelstapler', betrag: '30000', seite: 'links' },
          { text: 'Kredit für den Stapler', betrag: '30000', seite: 'rechts' },
        ],
      },
      fazit:
        'Jeder Euro, der links eingesetzt ist, kommt rechts aus einer Quelle: von den Eigentümern oder von Gläubigern. Deshalb sind beide Seiten immer gleich groß.',
    },
    {
      typ: 'dialog',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Schön. Und wo auf dem Foto steht unser Gewinn?',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Er steckt im Eigenkapital. Wie er entstanden ist, zeigt aber nicht das Foto, sondern der Film – die Gewinn- und Verlustrechnung.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Warum sind beide Seiten der Bilanz eigentlich gleich groß?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Purer Zufall – Jana hat halt gut gerechnet.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Das muss so sein. Jeder Euro links ist von irgendwoher gekommen.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Alles, was die MBG hat, wurde von Eigentümern oder Gläubigern finanziert – das steht rechts.',
          richtig: true,
        },
        { text: 'Die Bank verlangt, dass beide Seiten gleich sind.' },
        { text: 'Man darf links nur so viel kaufen, wie Eigenkapital da ist.' },
      ],
      aufloesung:
        'Links steht die Verwendung des Geldes, rechts seine Herkunft. Es ist dasselbe Geld, nur von zwei Seiten betrachtet. Mit Krediten kann die MBG übrigens mehr kaufen, als Eigenkapital da ist – dann wächst rechts das Fremdkapital.',
    },
    {
      typ: 'verstaendnis',
      frage:
        'Am 31.12. stehen auf der linken Seite der Bilanz 580.000 €. Was steht in der Summe rechts?',
      optionen: [
        { text: '580.000 €', richtig: true, erklaerung: 'Richtig: Summe links = Summe rechts.' },
        {
          text: 'Weniger, weil die Schulden abgezogen werden.',
          erklaerung:
            'Schulden werden nicht abgezogen, sie stehen rechts als eine der Quellen. Die Summen sind gleich.',
        },
        {
          text: 'Mehr, weil der Gewinn noch dazukommt.',
          erklaerung:
            'Der Gewinn steckt bereits im Eigenkapital auf der rechten Seite. Die Summen sind gleich.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: '0.3-m1',
      frage: 'Was zeigen Aktiva und Passiva einer Bilanz?',
      text: 'Bilanz = Foto am Stichtag. Aktiva (links): wofür das Geld eingesetzt ist – Mittelverwendung. Passiva (rechts): woher es kommt – Mittelherkunft. Summe links = Summe rechts.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Ordnen Sie die folgenden Bilanzpositionen der Aktiv- oder der Passivseite zu.',
      part: {
        typ: 'rechenkette',
        id: 'zuordnung',
        titel: 'Bilanzpositionen',
        felder: [
          {
            typ: 'auswahl',
            id: 'maschinen',
            label: 'Technische Anlagen und Maschinen',
            optionen: SEITE,
            soll: 'Aktiva',
          },
          {
            typ: 'auswahl',
            id: 'darlehen',
            label: 'Darlehensschulden',
            optionen: SEITE,
            soll: 'Passiva',
          },
          {
            typ: 'auswahl',
            id: 'forderungen',
            label: 'Forderungen aus Lieferungen und Leistungen',
            optionen: SEITE,
            soll: 'Aktiva',
          },
          { typ: 'auswahl', id: 'ek', label: 'Eigenkapital', optionen: SEITE, soll: 'Passiva' },
        ],
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Ein Kunde hat mir gerade 5.000 € bar gegeben, das trag ich einfach bei „Kasse“ ein. Passt doch, Jana?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was zeigt die rechte Seite der Bilanz (Passiva)?',
      optionen: [
        { text: 'Woher das Geld kommt', richtig: true },
        { text: 'Was die Firma besitzt' },
        { text: 'Den Gewinn des Jahres' },
      ],
    },
    {
      frage: 'Die MBG kauft eine Maschine auf Kredit. Was passiert mit der Bilanzsumme?',
      optionen: [
        { text: 'Sie steigt auf beiden Seiten.', richtig: true },
        { text: 'Sie bleibt gleich.' },
        { text: 'Sie sinkt.' },
      ],
    },
    {
      frage: 'Wohin gehört ein Bankguthaben?',
      optionen: [
        { text: 'Aktivseite', richtig: true },
        { text: 'Passivseite' },
        { text: 'Gar nicht in die Bilanz' },
      ],
    },
    {
      frage: 'Wann gilt eine Bilanz?',
      optionen: [
        { text: 'Für einen bestimmten Stichtag', richtig: true },
        { text: 'Für das ganze Jahr' },
        { text: 'Für die nächsten zwölf Monate' },
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
      'BA 2.3.1.2 (Aktivseite = Verwendung der Mittel, Passivseite = Finanzierung) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
