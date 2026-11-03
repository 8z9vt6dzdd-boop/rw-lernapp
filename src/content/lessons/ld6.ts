// Lektion D6 – Privatentnahmen und -einlagen (eigene Formulierung; BA 2.3.4, 3.3 Fußnote zum Konto
// Privat; 04-fachregeln.md Konvention 7 und GC-08). Alle Beträge rechnet die Engine.
import { formatEuro, type Val } from '../../engine/money';
import { solvePrivat, type PrivatParams } from '../../engine/generators/d/privat';
import type { Lektion } from './types';

const BASIS: PrivatParams = {
  fall: 'gegenstand',
  gesellschafter: 'Sabine Wessel',
  betrag: '600',
  menge: 0,
  stueckwert: '0',
  konto: 'Bank',
  was: '„Senne Lemon“',
  anlagekonto: '',
  soll: [],
  haben: [],
  ustSatz: '0.19',
};
const G = solvePrivat(BASIS);
const MOEBEL = solvePrivat({ ...BASIS, fall: 'privatrechnung', betrag: '2380' });
const POSTEN = {
  geld: '24000',
  steuer: '9000',
  einlage: '10000',
};
const ABSCHLUSS = solvePrivat({
  ...BASIS,
  fall: 'abschluss',
  soll: [
    { text: 'Geldentnahmen', betrag: POSTEN.geld },
    { text: 'Einkommensteuer', betrag: POSTEN.steuer },
    { text: 'Entnahme Erzeugnisse', betrag: G.brutto.value.toString() },
  ],
  haben: [{ text: 'Einlage Bank', betrag: POSTEN.einlage }],
});
const e = (v: Val | string) => formatEuro(v);

export const lektionD6: Lektion = {
  id: 'D6',
  skillId: 'D6-privat',
  abschnitt: 'D',
  titel: 'Privat ist privat: Entnahmen und Einlagen',
  kernAha:
    'Privates läuft über das Konto Privat, nie über die GuV: Entnahmen im Soll, Einlagen im Haben. Wer Waren oder Leistungen der Firma privat nutzt, wird wie ein Kunde behandelt (Entnahme v. G. u. s. L. plus Umsatzsteuer); bei Geld gibt es keine Steuer. Der Saldo geht ins Eigenkapital.',
  dauerMin: 8,
  figuren: ['sabine', 'jana', 'leni', 'tobias', 'frank'],
  ort: 'lager',
  quelle: 'BA 2.3.4 und 3.3 (Konto Privat); 04-fachregeln.md (Konvention 7, GC-08)',
  teaser: {
    figur: 'sabine',
    ausdruck: 'freut',
    text: 'Zwei Kartons für Mamas Geburtstag – das darf ich doch einfach mitnehmen?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'lager',
        titel: 'Logistikzentrum: Entnahme für private Zwecke',
        regal: [{ name: 'Senne Lemon', paletten: 7, farbe: '#8cbf3f' }],
      },
      sprecher: [
        {
          figur: 'sabine',
          ausdruck: 'freut',
          text: 'Ich nehme Getränke für die Feier meiner Mutter mit. Gehört doch eh uns!',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Gern, aber nur mit Beleg. Und das Finanzamt möchte auch etwas davon.',
        },
      ],
      frage: 'Sabine kauft doch gar nichts. Warum will das Finanzamt dann Umsatzsteuer?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir den Bäcker vor, der seine eigenen Brötchen frühstückt. Verkauft hätte er sie mit Mehrwertsteuer – also zahlt er sie auch beim Eigenverbrauch.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Sonst könnte man über die Firma steuerfrei einkaufen und privat verbrauchen. Genau das verhindert die Steuer auf Entnahmen.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die entnommenen Getränke sind netto ${e(G.netto)} wert. Mit welchem Betrag wird das Konto Privat belastet?`,
      optionen: [
        { text: e(G.netto) },
        { text: e(G.brutto), richtig: true },
        { text: e(G.netto.minus(G.ust)) },
      ],
      aufloesung: `Sabine wird wie eine Kundin behandelt: ${e(G.netto)} Warenwert plus ${e(G.ust)} Umsatzsteuer = ${e(G.brutto)}. Um diesen Betrag sinkt ihr Anteil am Eigenkapital.`,
    },
    {
      typ: 'konzept',
      titel: 'Das Konto Privat',
      text: 'Privat ist ein Unterkonto des Eigenkapitals. Entnahmen stehen im Soll, Einlagen im Haben. Weil Privates kein Aufwand und kein Ertrag ist, berührt es die GuV nicht.',
      visual: {
        typ: 'tkonto',
        name: 'Privat',
        soll: [
          { text: 'Geldentnahmen', betrag: POSTEN.geld },
          { text: 'Einkommensteuer', betrag: POSTEN.steuer },
          { text: 'Entnahme Getränke', betrag: G.brutto.value.toString(), neu: true },
        ],
        haben: [{ text: 'Einlage Bank', betrag: POSTEN.einlage }],
        untertitel: 'Unterkonto des Eigenkapitals',
      },
    },
    {
      typ: 'sortieren',
      titel: 'Mit oder ohne Umsatzsteuer?',
      kategorien: ['Entnahme mit Umsatzsteuer', 'Entnahme ohne Steuer', 'Privateinlage'],
      elemente: [
        {
          text: 'Frank nimmt Kartons Paderquell Energy für eine Gartenparty mit.',
          kategorie: 'Entnahme mit Umsatzsteuer',
        },
        {
          text: 'Ein Lkw der MBG fährt am Wochenende Sabines Umzug.',
          kategorie: 'Entnahme mit Umsatzsteuer',
          erklaerung: 'Auch private Nutzung von Firmenleistungen ist eine Entnahme mit Steuer.',
        },
        {
          text: 'Frank überweist sich 3.000 € auf sein privates Girokonto.',
          kategorie: 'Entnahme ohne Steuer',
        },
        {
          text: 'Sabines Einkommensteuer wird vom Geschäftskonto bezahlt.',
          kategorie: 'Entnahme ohne Steuer',
          erklaerung: 'Personensteuern der Gesellschafter einer OHG laufen über Privat.',
        },
        {
          text: 'Frank zahlt eine Erbschaft auf das Firmenkonto ein.',
          kategorie: 'Privateinlage',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Sabines Entnahme buchen',
      schritte: [
        {
          text: 'Wert der Entnahme',
          rechnung: `${e(G.netto)} netto`,
          warum: 'Bewertet wird mit dem Nettowert der entnommenen Getränke.',
        },
        {
          text: 'Umsatzsteuer',
          rechnung: `${e(G.netto)} × 19 % = ${e(G.ust)}`,
          warum: 'Die Entnahme wird wie ein Verkauf an Sabine besteuert.',
        },
        {
          text: 'Buchungssatz',
          rechnung: `Privat ${e(G.brutto)} an Entnahme v. G. u. s. L. ${e(G.netto)}, an Umsatzsteuer ${e(G.ust)}`,
          warum:
            'Das Ertragskonto „Entnahme von Gegenständen und sonstigen Leistungen“ gleicht den Aufwand aus, den die Herstellung der Getränke schon verursacht hat.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Die Rechnung für Franks neues Wohnzimmersofa (${e(MOEBEL.brutto)} inkl. Umsatzsteuer) wird vom Geschäftskonto bezahlt.`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Da steht Umsatzsteuer drauf. Die holen wir uns als Vorsteuer zurück!',
      },
      b: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Vorsteuer gibt es nur für Einkäufe der Firma. Privat wird mit dem vollen Betrag belastet.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Das Sofa dient nicht dem Unternehmen – also kein Vorsteuerabzug.',
          richtig: true,
        },
        { text: 'Vorsteuer darf man nur bei Rechnungen über 5.000 € abziehen.' },
        { text: 'Möbel sind von der Umsatzsteuer befreit.' },
      ],
      aufloesung: `Richtig ist: Privat ${e(MOEBEL.brutto)} an Bank ${e(MOEBEL.brutto)}. Wer hier Vorsteuer abzieht, holt sich Steuer für einen privaten Einkauf zurück.`,
    },
    {
      typ: 'erkunden',
      titel: 'Das Konto Privat am Jahresende',
      text: 'Trage die Vorgänge des Jahres ein und sieh dir an, welche Seite größer wird.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Privat',
        vorgaenge: [
          { text: 'Geldentnahmen', betrag: POSTEN.geld, seite: 'soll' },
          { text: 'Einkommensteuer der Gesellschafter', betrag: POSTEN.steuer, seite: 'soll' },
          { text: 'Entnahme Getränke', betrag: G.brutto.value.toString(), seite: 'soll' },
          { text: 'Einlage aus einer Erbschaft', betrag: POSTEN.einlage, seite: 'haben' },
        ],
      },
      fazit: `Entnahmen ${e(ABSCHLUSS.entnahmen)}, Einlagen ${e(ABSCHLUSS.einlagen)}. Der Saldo von ${e(ABSCHLUSS.saldo)} steht im Haben und wird ins Eigenkapital übertragen.`,
    },
    {
      typ: 'verstaendnis',
      frage: `Wie lautet die Abschlussbuchung für dieses Konto Privat?`,
      optionen: [
        {
          text: `Eigenkapital an Privat ${e(ABSCHLUSS.saldo)}`,
          richtig: true,
          erklaerung: 'Richtig. Die Entnahmen überwiegen, also sinkt das Eigenkapital.',
        },
        {
          text: `Privat an Eigenkapital ${e(ABSCHLUSS.saldo)}`,
          erklaerung:
            'So bucht man nur, wenn die Einlagen überwiegen. Hier stehen im Soll mehr Entnahmen.',
        },
        {
          text: `GuV an Privat ${e(ABSCHLUSS.saldo)}`,
          erklaerung:
            'Privates gehört nicht in die GuV. Privat wird über das Eigenkapital abgeschlossen.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine neue Entnahme mit Menge und Stückwert. Ergänze den Wert der Entnahme und die Umsatzsteuer.',
      skillId: 'D6-privat',
      seed: 5,
      variant: 'gegenstand',
      partId: 'rechnung',
      gefragt: ['netto', 'ust'],
    },
    {
      typ: 'merksatz',
      id: 'D6-m1',
      frage: 'Wie werden Privatentnahmen und Privateinlagen gebucht?',
      text: 'Geld: Privat an Bank/Kasse. Gegenstände und Leistungen: Privat (brutto) an Entnahme v. G. u. s. L. (netto), an Umsatzsteuer. Private Rechnungen: Privat brutto, ohne Vorsteuer. Einlagen: Bank (bzw. Anlagekonto) an Privat. Abschluss über das Eigenkapital.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für die Privatentnahme.',
      part: { skillId: 'D6-privat', seed: 3, variant: 'gegenstand', partId: 'buchung' },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'freut',
        text: 'Im Juli kommt unsere neue Abfülllinie. Montage, Fracht, Skonto – Jana, was davon gehört eigentlich zur Maschine?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Ein Gesellschafter entnimmt Erzeugnisse im Nettowert von 1.000 € (19 % USt). Buchung?',
      optionen: [
        {
          text: 'Privat 1.190 € an Entnahme v. G. u. s. L. 1.000 €, an Umsatzsteuer 190 €',
          richtig: true,
        },
        { text: 'Privat 1.000 € an Fertige Erzeugnisse 1.000 €' },
        { text: 'Privat 1.190 € an Umsatzerlöse 1.000 €, an Umsatzsteuer 190 €' },
      ],
    },
    {
      frage:
        'Die Einkommensteuer eines OHG-Gesellschafters wird vom Geschäftskonto überwiesen. Buchung?',
      optionen: [
        { text: 'Privat an Bank', richtig: true },
        { text: 'Betriebssteuern an Bank' },
        { text: 'Privat und Vorsteuer an Bank' },
      ],
    },
    {
      frage: 'Einlagen überwiegen die Entnahmen. Wie wird Privat abgeschlossen?',
      optionen: [
        { text: 'Privat an Eigenkapital', richtig: true },
        { text: 'Eigenkapital an Privat' },
        { text: 'Privat an GuV' },
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
      'BA 2.3.4 (Privatentnahmen in Form von Geld, Erzeugnissen, Nutzungen, Leistungen; Einlagen), BA 3.3 Fußnote 30 (Privatkonto, Personensteuern), 04-fachregeln.md Konvention 7 und GC-08; Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
