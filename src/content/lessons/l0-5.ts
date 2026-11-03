// Lektion 0.5 – Warum doppelt? Jede Sache hat zwei Seiten (eigene Formulierung; geprüft gegen BA 2.3.1.3–2.3.1.4)
import type { Lektion } from './types';

const ARTEN = ['Aktivtausch', 'Passivtausch', 'Aktiv-Passiv-Mehrung', 'Aktiv-Passiv-Minderung'];

export const lektion05: Lektion = {
  id: '0.5',
  skillId: '0.5-doppik',
  abschnitt: '0',
  titel: 'Warum doppelt? Jede Sache hat zwei Seiten',
  kernAha:
    'Jeder Geschäftsvorfall verändert mindestens zwei Stellen – deshalb bleibt die Bilanz immer im Gleichgewicht.',
  dauerMin: 5,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'lager',
  quelle: 'BA 2.3.1.3, 2.3.1.4',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Ich hab 5.000 € bar bekommen und einfach bei „Kasse“ eingetragen. Passt doch?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Ein Kunde hat seine offene Rechnung bar bezahlt: 5.000 €. Ich hab bei „Kasse“ einfach plus 5.000 € eingetragen – fertig!',
        },
        { figur: 'jana', ausdruck: 'gruebelt', text: 'Und wo fehlt jetzt etwas?' },
      ],
      frage: 'Tobias hat eine einzige Zahl geändert. Reicht das?',
    },
    {
      typ: 'vorhersage',
      frage: 'Was passiert mit der Bilanz, wenn Tobias nur bei „Kasse“ 5.000 € dazuschreibt?',
      optionen: [
        { text: 'Nichts – mehr Geld ist mehr Geld.' },
        { text: 'Sie kippt: Links stehen plötzlich 5.000 € mehr als rechts.', richtig: true },
        { text: 'Rechts kommt automatisch Gewinn dazu.' },
      ],
      aufloesung:
        'Die Bilanz gerät aus dem Gleichgewicht. Dabei ist ja gar nichts dazugekommen: Die Forderung an den Kunden hat sich nur in Bargeld verwandelt. Die Forderung muss um 5.000 € sinken.',
    },
    {
      typ: 'erkunden',
      titel: 'Vier Vorfälle, eine Waage',
      text: 'Buche die Vorfälle der Woche nacheinander und beobachte die Waage.',
      erkunden: {
        art: 'geschaeftsvorfall',
        start: {
          links: [
            { text: 'Kasse', betrag: '2000' },
            { text: 'Forderungen', betrag: '8000' },
            { text: 'Bank', betrag: '20000' },
          ],
          rechts: [
            { text: 'Eigenkapital', betrag: '22000' },
            { text: 'Verbindlichkeiten', betrag: '8000' },
          ],
        },
        vorfaelle: [
          {
            text: 'Kunde zahlt seine Rechnung bar (5.000 €)',
            aenderungen: [
              { seite: 'links', text: 'Kasse', delta: '5000' },
              { seite: 'links', text: 'Forderungen', delta: '-5000' },
            ],
          },
          {
            text: 'Rohstoffe auf Rechnung gekauft (3.000 €)',
            aenderungen: [
              { seite: 'links', text: 'Rohstoffe', delta: '3000' },
              { seite: 'rechts', text: 'Verbindlichkeiten', delta: '3000' },
            ],
          },
          {
            text: 'Lieferant per Bank bezahlt (4.000 €)',
            aenderungen: [
              { seite: 'links', text: 'Bank', delta: '-4000' },
              { seite: 'rechts', text: 'Verbindlichkeiten', delta: '-4000' },
            ],
          },
          {
            text: 'Lieferantenschuld in ein Darlehen umgewandelt (2.000 €)',
            aenderungen: [
              { seite: 'rechts', text: 'Verbindlichkeiten', delta: '-2000' },
              { seite: 'rechts', text: 'Darlehen', delta: '2000' },
            ],
          },
        ],
      },
      fazit:
        'Jeder Vorfall hat zwei Seiten: Woher kommt etwas, wohin geht es? Manchmal ändern sich zwei Posten auf derselben Seite, manchmal einer links und einer rechts. Die Waage bleibt immer gerade.',
    },
    {
      typ: 'konzept',
      titel: 'Vier Arten, die Bilanz zu verändern',
      text: 'Wie beim Umbuchen vom Sparbuch aufs Girokonto: Eins nimmt ab, das andere zu. In der Bilanz gibt es genau vier Muster.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Aktivtausch',
            text: 'Zwei Posten links tauschen: einer plus, einer minus. Summe gleich.',
            farbe: '#1c6670',
          },
          {
            titel: 'Passivtausch',
            text: 'Zwei Posten rechts tauschen. Summe gleich.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Aktiv-Passiv-Mehrung',
            text: 'Links und rechts je plus. Die Summe steigt.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Aktiv-Passiv-Minderung',
            text: 'Links und rechts je minus. Die Summe sinkt.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welches Muster ist es?',
      kategorien: ARTEN,
      elemente: [
        {
          text: 'Bargeld wird auf das Bankkonto eingezahlt.',
          kategorie: 'Aktivtausch',
          erklaerung: 'Kasse minus, Bank plus – beides links.',
        },
        {
          text: 'Kauf von Dosen auf Rechnung.',
          kategorie: 'Aktiv-Passiv-Mehrung',
          erklaerung: 'Vorräte plus, Verbindlichkeiten plus.',
        },
        {
          text: 'Ein Darlehen wird per Bank getilgt.',
          kategorie: 'Aktiv-Passiv-Minderung',
          erklaerung: 'Bank minus, Darlehen minus.',
        },
        {
          text: 'Eine Lieferantenschuld wird in ein Darlehen umgewandelt.',
          kategorie: 'Passivtausch',
          erklaerung: 'Verbindlichkeiten minus, Darlehen plus – beides rechts.',
        },
        {
          text: 'Kauf eines Gabelstaplers gegen Barzahlung.',
          kategorie: 'Aktivtausch',
          erklaerung: 'Fuhrpark plus, Kasse minus.',
        },
      ],
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Das Schöne daran: Wenn links und rechts am Ende nicht gleich sind, wissen wir sofort, dass irgendwo ein Fehler steckt.',
        },
        {
          figur: 'jana',
          ausdruck: 'freut',
          text: 'Doppelte Buchführung ist also auch eine eingebaute Kontrolle. Das nennt man übrigens Doppik.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Tobias’ Notizzettel',
      text: 'Tobias hat drei Vorgänge notiert. In einer Zeile fehlt die zweite Seite. Tippe sie an.',
      zeilen: [
        'Darlehen ausgezahlt: Bank +10.000 €, Darlehen +10.000 €',
        'Kunde überweist offene Rechnung: Bank +3.000 €',
        'Gabelstapler bar gekauft: Fuhrpark +8.000 €, Kasse −8.000 €',
      ],
      fehlerZeile: 1,
      gruende: [
        { text: 'Die Forderung an den Kunden muss um 3.000 € sinken.', richtig: true },
        { text: 'Die Bank darf bei einer Überweisung nicht steigen.' },
        { text: 'Es fehlt die Umsatzsteuer.' },
      ],
      aufloesung:
        'Der Kunde hat eine Schuld beglichen. Für die MBG heißt das: Bank plus 3.000 €, Forderungen minus 3.000 € – ein Aktivtausch.',
    },
    {
      typ: 'verstaendnis',
      frage:
        'Die MBG nimmt einen Kredit über 50.000 € auf, das Geld kommt aufs Bankkonto. Wie verändert sich die Bilanzsumme?',
      optionen: [
        {
          text: 'Sie steigt um 50.000 €.',
          richtig: true,
          erklaerung:
            'Bank plus 50.000 € links, Darlehen plus 50.000 € rechts: eine Aktiv-Passiv-Mehrung.',
        },
        {
          text: 'Sie bleibt gleich.',
          erklaerung: 'Das wäre ein Tausch auf einer Seite. Hier wachsen aber beide Seiten.',
        },
        {
          text: 'Sie steigt um 100.000 €.',
          erklaerung:
            'Doppelt buchen heißt nicht doppelt zählen: Jede Seite wächst um 50.000 €, die Summe also um 50.000 €.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: '0.5-m1',
      text: 'Doppelte Buchführung: Jeder Geschäftsvorfall verändert mindestens zwei Posten – woher und wohin. Deshalb bleibt die Bilanz immer im Gleichgewicht.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Geben Sie an, welche Art der Bilanzveränderung jeweils vorliegt.',
      part: {
        typ: 'rechenkette',
        id: 'bilanzveraenderung',
        titel: 'Bilanzveränderungen',
        felder: [
          {
            typ: 'auswahl',
            id: 'maschine',
            label: 'Kauf einer Maschine auf Ziel',
            optionen: ARTEN,
            soll: 'Aktiv-Passiv-Mehrung',
          },
          {
            typ: 'auswahl',
            id: 'abhebung',
            label: 'Barabhebung vom Bankkonto',
            optionen: ARTEN,
            soll: 'Aktivtausch',
          },
        ],
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Jana, im Konto Bank steht „Soll 5.000“. Sollen wir das etwa noch bezahlen?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie viele Posten verändert ein Geschäftsvorfall mindestens?',
      optionen: [{ text: 'Zwei', richtig: true }, { text: 'Einen' }, { text: 'Alle' }],
    },
    {
      frage: 'Kauf von Rohstoffen auf Rechnung – welche Bilanzveränderung?',
      optionen: [
        { text: 'Aktiv-Passiv-Mehrung', richtig: true },
        { text: 'Aktivtausch' },
        { text: 'Passivtausch' },
      ],
    },
    {
      frage: 'Ein Kunde überweist eine offene Rechnung. Was passiert?',
      optionen: [
        { text: 'Bank plus, Forderungen minus', richtig: true },
        { text: 'Bank plus, Eigenkapital plus' },
        { text: 'Nur die Bank ändert sich' },
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
      'BA 2.3.1.3 (vier Bilanzveränderungen), 2.3.1.4 (Doppik) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
