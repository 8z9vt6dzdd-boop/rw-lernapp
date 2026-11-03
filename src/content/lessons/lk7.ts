// Lektion K7 – Eigenfertigung oder Fremdbezug: selbst abfüllen oder Lohnabfüller (eigene Formulierung;
// Inhalt nach den Lehrbuch-Übungen zu Eigenfertigung/Fremdbezug, Golden Case GC-24 aus 04-fachregeln.md).
// Alle Beträge werden von der Engine berechnet.
import { solveMob, type MobParams } from '../../engine/generators/k2/k7-make-or-buy';
import { formatEuro, formatPlain } from '../../engine/money';
import type { Lektion } from './types';

// Herbst: freie Kapazität auf der eigenen Anlage
const FREI: MobParams = {
  variante: 'freie-kapazitaet',
  produkt: 'Paderquell Energy 0,33 l',
  fremdpreis: '0.12',
  bestandteile: [
    { name: 'Dose und Verschluss', betrag: '0.05' },
    { name: 'Energie, Kohlensäure und Reinigung', betrag: '0.02' },
    { name: 'zusätzliche Schichtlöhne', betrag: '0.02' },
  ],
  fixUmlage: '0.05',
  menge: 500_000,
};
const SF = solveMob(FREI);
const SF_VK = solveMob(FREI, { fixkostenEingerechnet: true });

// GC-24: zusätzliche Linie mit Fixkosten
const GC24: MobParams = {
  variante: 'kritische-menge',
  produkt: 'Paderquell Energy 0,33 l',
  fremdpreis: '0.12',
  bestandteile: [{ name: 'variable Kosten der eigenen Abfüllung', betrag: '0.08' }],
  zusatzFix: '30000',
  menge: 500_000,
};
const SK = solveMob(GC24);
const MENGEN = [500_000, 750_000, 1_000_000].map((menge) => ({
  menge,
  s: solveMob({ ...GC24, menge }),
}));

const e = formatEuro;
const n = formatPlain;

export const lektionK7: Lektion = {
  id: 'K7',
  skillId: 'K7-make-or-buy',
  abschnitt: 'K',
  titel: 'Selbst abfüllen oder Lohnabfüller?',
  kernAha:
    'Bei Eigenfertigung oder Fremdbezug zählen nur die Kosten, die durch die Entscheidung entstehen oder wegfallen. Bei freier Kapazität sind das die variablen Kosten; kommen Fixkosten hinzu, entscheidet die kritische Menge.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana', 'frank'],
  ort: 'abfuellung',
  quelle:
    'Lehrbuch-Übungen Deckungsbeitragsrechnung (Eigenfertigung oder Fremdbezug); K2 Kap. 2.1 (Kalkulation für dispositive Zwecke); 04-fachregeln.md GC-24',
  teaser: {
    figur: 'tobias',
    ausdruck: 'gruebelt',
    text: 'Ein Lohnabfüller bietet seine Dienste an. Ist der billiger als unsere eigene Anlage?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'neutral',
          text: `Für ${n(FREI.menge)} Dosen im Herbst ist auf unserer Anlage noch Platz. Ein Lohnabfüller will ${e(FREI.fremdpreis)} je Dose.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Unsere Kalkulation sagt ${e(SF.vollkosten)} je Dose. Also geben wir ab und sparen!`,
        },
      ],
      frage: 'Ist die eigene Abfüllung wirklich teurer?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Dein Auto steht ohnehin vor der Tür, Versicherung und Steuer zahlst du sowieso. Für die Fahrt zum Baumarkt zählt nur das Benzin.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genauso hier: Abschreibung der Anlage, Hallenmiete und Werksleitung zahlen wir in jedem Fall. Sie gehören nicht in den Vergleich.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Was ändert sich durch die Entscheidung?',
      text: 'Fällt der Betrag nur an, wenn die MBG selbst abfüllt?',
      kategorien: ['Nur bei eigener Abfüllung', 'Fällt ohnehin an'],
      elemente: [
        {
          text: 'Dosen und Verschlüsse',
          kategorie: 'Nur bei eigener Abfüllung',
          erklaerung: 'Beim Lohnabfüller sind sie in seinem Preis enthalten.',
        },
        {
          text: 'Strom, Kohlensäure und Reinigung für die zusätzlichen Dosen',
          kategorie: 'Nur bei eigener Abfüllung',
          erklaerung: 'Variable Kosten, die mit jeder Dose entstehen.',
        },
        {
          text: 'Zusätzliche Schichtlöhne',
          kategorie: 'Nur bei eigener Abfüllung',
          erklaerung: 'Ohne die Herbstmenge würde diese Schicht nicht gefahren.',
        },
        {
          text: 'Abschreibung der vorhandenen Abfüllanlage',
          kategorie: 'Fällt ohnehin an',
          erklaerung: 'Die Anlage steht da, ob sie läuft oder nicht.',
        },
        {
          text: 'Gehalt der Werksleitung',
          kategorie: 'Fällt ohnehin an',
          erklaerung: 'Fixkosten, die sich durch die Entscheidung nicht ändern.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die variablen Kosten der eigenen Abfüllung betragen ${e(SF.kv)} je Dose. Was spart die MBG je Dose, wenn sie selbst abfüllt?`,
      optionen: [
        { text: e(SF.differenz), richtig: true },
        {
          text: `${e(SF_VK.differenz.abs())} Mehrkosten`,
          erklaerung: 'So sieht es nur aus, wenn man die ohnehin anfallenden Fixkosten einrechnet.',
        },
        {
          text: e(FREI.fremdpreis),
          erklaerung: 'Auch die eigene Abfüllung kostet etwas: die variablen Kosten.',
        },
      ],
      aufloesung: `${e(FREI.fremdpreis)} − ${e(SF.kv)} = ${e(SF.differenz)} je Dose. Bei ${n(FREI.menge)} Dosen spart die MBG ${e(SF.vorteilGesamt)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Was wird verglichen?',
      text: 'Bei freier Kapazität vergleicht man die variablen Kosten der Eigenfertigung mit dem Preis des Fremdbezugs. Umgelegte Fixkosten bleiben außen vor, weil sie in beiden Fällen anfallen.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'eigene Abfüllung', text: `variabel ${e(SF.kv)} je Dose`, farbe: '#8cbf3f' },
          { titel: 'Lohnabfüller', text: `${e(FREI.fremdpreis)} je Dose`, farbe: '#e8792b' },
          {
            titel: 'außen vor',
            text: `Umlage ${e(FREI.fixUmlage!)} je Dose: fällt ohnehin an`,
            farbe: '#7fa88e',
          },
        ],
      },
    },
    {
      typ: 'entscheidung',
      frage: `Nächstes Jahr soll eine eigene zweite Linie her: zusätzliche Fixkosten ${e(GC24.zusatzFix!)} im Jahr, variable Kosten ${e(SK.kv)} je Dose. Geplant sind ${n(GC24.menge)} Dosen. Was empfiehlst du?`,
      figur: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: `Der Lohnabfüller bleibt bei ${e(GC24.fremdpreis)} je Dose.`,
      },
      optionen: [
        {
          text: 'Eigene Linie, weil die variablen Kosten niedriger sind',
          folge: `Eigene Linie: ${e(SK.kostenEigen)}. Lohnabfüller: ${e(SK.kostenFremd)}. Die MBG zahlt ${e(SK.kostenEigen.minus(SK.kostenFremd))} drauf.`,
          ausdruck: 'entsetzt',
        },
        {
          text: 'Beim Lohnabfüller bleiben',
          folge: `Lohnabfüller: ${e(SK.kostenFremd)}, eigene Linie: ${e(SK.kostenEigen)}. Das spart ${e(SK.kostenEigen.minus(SK.kostenFremd))}.`,
          ausdruck: 'freut',
          empfohlen: true,
        },
      ],
      fazit:
        'Neue Fixkosten muss die Ersparnis je Dose erst einmal verdienen. Bei kleiner Menge reicht sie dafür nicht.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die kritische Menge',
      text: 'Ab welcher Menge lohnt sich die eigene Linie?',
      schritte: [
        {
          text: 'Ansatz',
          rechnung: `${e(GC24.zusatzFix!)} + ${e(SK.kv)} × x = ${e(GC24.fremdpreis)} × x`,
          warum: 'Bei der kritischen Menge kosten beide Möglichkeiten gleich viel.',
        },
        {
          text: 'Ersparnis je Dose',
          rechnung: `${e(GC24.fremdpreis)} − ${e(SK.kv)} = ${e(SK.differenz)}`,
          warum: 'So viel trägt jede selbst abgefüllte Dose zu den neuen Fixkosten bei.',
        },
        {
          text: 'Kritische Menge',
          rechnung: `${e(GC24.zusatzFix!)} ÷ ${e(SK.differenz)} = ${n(SK.kritischeMenge)} Dosen`,
          warum: 'Darüber ist die eigene Linie günstiger, darunter der Lohnabfüller.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Drei Mengen im Vergleich',
      text: 'Decke auf, was beide Möglichkeiten bei verschiedenen Mengen kosten.',
      erkunden: {
        art: 'aufdecken',
        karten: MENGEN.map(({ menge, s }) => ({
          titel: `${n(menge)} Dosen`,
          text: `eigene Linie ${e(s.kostenEigen)}, Lohnabfüller ${e(s.kostenFremd)}`,
          farbe:
            s.kostenEigen.cmp(s.kostenFremd) < 0
              ? '#8cbf3f'
              : s.kostenEigen.cmp(s.kostenFremd) > 0
                ? '#e8792b'
                : '#e2b13c',
        })),
      },
      fazit: `Unter ${n(SK.kritischeMenge)} Dosen ist der Lohnabfüller günstiger, genau dort sind beide gleich, darüber gewinnt die eigene Linie.`,
    },
    {
      typ: 'verstaendnis',
      frage: `Die Planung steigt auf ${n(MENGEN[2]!.menge)} Dosen im Jahr. Was gilt jetzt?`,
      optionen: [
        {
          text: `Die eigene Linie ist günstiger, sie spart ${e(MENGEN[2]!.s.vorteilGesamt)}.`,
          richtig: true,
        },
        {
          text: 'Der Lohnabfüller bleibt günstiger, weil die Linie Fixkosten verursacht.',
          erklaerung:
            'Oberhalb der kritischen Menge sind die Fixkosten durch die Ersparnis je Dose gedeckt.',
        },
        {
          text: 'Beide kosten gleich viel.',
          erklaerung: `Gleich teuer sind sie nur bei genau ${n(SK.kritischeMenge)} Dosen.`,
        },
      ],
      figur: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Vergleiche die Planmenge mit der kritischen Menge.',
      },
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein neues Angebot eines Lohnabfüllers. Ergänze die Kostendifferenz je Stück und die kritische Menge.',
      skillId: 'K7-make-or-buy',
      seed: 5,
      variant: 'kritische-menge',
      partId: 'rechnung',
      gefragt: ['diff', 'xkrit'],
    },
    {
      typ: 'merksatz',
      id: 'K7-m1',
      frage: 'Welche Kosten vergleicht man bei Eigenfertigung oder Fremdbezug?',
      text: 'Nur die Kosten, die durch die Entscheidung entstehen oder wegfallen. Bei freier Kapazität: variable Kosten gegen Fremdbezugspreis. Mit zusätzlichen Fixkosten: kritische Menge = zusätzliche Fixkosten ÷ (Fremdbezugspreis − variable Kosten je Stück).',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Ermitteln Sie die entscheidungsrelevanten Kosten je Stück und den Kostenvorteil der eigenen Abfüllung. Die Anlage hat freie Kapazität.',
      part: { skillId: 'K7-make-or-buy', seed: 6, variant: 'freie-kapazitaet', partId: 'rechnung' },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Dreimal hätte uns die Kalkulation mit Selbstkosten fast falsch beraten. Brauchen wir die Vollkostenrechnung überhaupt noch?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Freie Kapazität. Eigenfertigung: variable Kosten 3,00 €, umgelegte Fixkosten 1,50 € je Stück. Fremdbezug: 4,00 €. Was ist günstiger?',
      optionen: [
        { text: 'Eigenfertigung, sie spart 1,00 € je Stück', richtig: true },
        { text: 'Fremdbezug, er spart 0,50 € je Stück' },
        { text: 'Beides kostet gleich viel' },
      ],
    },
    {
      frage:
        'Zusätzliche Fixkosten 20.000 €, variable Kosten 0,10 €, Fremdbezugspreis 0,15 € je Stück. Wie hoch ist die kritische Menge?',
      optionen: [
        { text: '400.000 Stück', richtig: true },
        { text: '200.000 Stück' },
        { text: '133.334 Stück' },
      ],
    },
    {
      frage: 'Welche Kosten bleiben bei freier Kapazität außen vor?',
      optionen: [
        { text: 'Fixkosten, die ohnehin anfallen', richtig: true },
        { text: 'Die variablen Kosten der Eigenfertigung' },
        { text: 'Der Preis des Fremdbezugs' },
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
      'Lehrbuch-Übungen Deckungsbeitragsrechnung (Eigenfertigung oder Fremdbezug bei freier Kapazität: nur variable bzw. proportionale Kosten), K2 Kap. 2.1 und GC-24 abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
