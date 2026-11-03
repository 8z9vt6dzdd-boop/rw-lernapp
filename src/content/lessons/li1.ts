// Lektion I1 – Kostenstellenbildung (eigene Formulierung; geprüft gegen K2 Kap. 1.1, 1.2.1, 1.2.2, S. 12–19).
// Keine Rechenwerte; die Klausurbrücke ist eine Zuordnung.
import { FIRMA } from '../../config';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const K = FIRMA.kostenstellen;
const VOR = 'Vorkostenstelle (Hilfskostenstelle)';
const END = 'Endkostenstelle (Hauptkostenstelle)';

const K_TEIL: TaskPart = {
  typ: 'rechenkette',
  id: 'stellen',
  titel: 'Kostenstellen der MBG',
  felder: [
    { typ: 'auswahl', id: 'energie', label: K.energie, optionen: [VOR, END], soll: VOR },
    { typ: 'auswahl', id: 'material', label: K.material, optionen: [VOR, END], soll: END },
    {
      typ: 'auswahl',
      id: 'instandhaltung',
      label: K.instandhaltung,
      optionen: [VOR, END],
      soll: VOR,
    },
    { typ: 'auswahl', id: 'vertrieb', label: K.vertrieb, optionen: [VOR, END], soll: END },
  ],
};

export const lektionI1: Lektion = {
  id: 'I1',
  skillId: 'I1-kostenstellenbildung',
  abschnitt: 'I',
  titel: 'Kostenstellen: Wo entstehen die Kosten?',
  kernAha:
    'Kostenstellen sind die Bereiche, in denen Kosten entstehen und verantwortet werden. Gute Kostenstellen sind klar abgegrenzt, haben eine passende Bezugsgröße und genau eine verantwortliche Person – und bleiben wirtschaftlich.',
  dauerMin: 6,
  figuren: ['frank', 'leni', 'jana', 'tobias'],
  ort: 'besprechung',
  quelle: 'K2 1.1, 1.2.1, 1.2.2 (S. 12–19)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Wir wissen jetzt, welche Kosten anfallen. Aber wo im Werk entstehen sie eigentlich?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'entsetzt',
          text: 'Die Stromkosten des Werks sind um ein Fünftel gestiegen. Wer verbraucht da so viel?',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Keine Ahnung – bisher steht alles in einem einzigen Topf: die MBG.',
        },
      ],
      frage: 'Warum hilft Frank eine einzige Gesamtrechnung für das ganze Werk nicht weiter?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Stell dir eine WG mit einem Stromzähler je Zimmer vor. Erst dann sieht man, wer den Heizlüfter laufen lässt.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'In der Kostenrechnung heißen diese Zimmer Kostenstellen. Für jede werden die Kosten erfasst, geplant und kontrolliert.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Wohin gehört welcher Bereich der MBG?',
      text: 'Eine übliche Einteilung folgt den Aufgaben im Betrieb.',
      kategorien: ['Material', 'Fertigung', 'Verwaltung', 'Vertrieb', 'Allgemeine Kostenstelle'],
      elemente: [
        { text: 'Wareneingang und Rohstofflager', kategorie: 'Material' },
        { text: 'Sirup- und Braukeller', kategorie: 'Fertigung' },
        { text: 'Abfüllanlage', kategorie: 'Fertigung' },
        { text: 'Rechnungswesen', kategorie: 'Verwaltung' },
        { text: 'Außendienst Gastronomie', kategorie: 'Vertrieb' },
        {
          text: 'Fertigwarenlager und Versand',
          kategorie: 'Vertrieb',
          erklaerung: 'Lager für fertige Ware, Verpackung und Versand zählen zum Absatz.',
        },
        {
          text: 'Werkstatt (Instandhaltung)',
          kategorie: 'Allgemeine Kostenstelle',
          erklaerung:
            'Die Werkstatt arbeitet für viele andere Stellen – wie Energieversorgung oder Transport.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Vorkostenstellen und Endkostenstellen',
      text: 'Vorkostenstellen, auch Hilfskostenstellen genannt, leisten für andere Stellen, etwa Energie und Instandhaltung. Endkostenstellen, auch Hauptkostenstellen genannt, dienen direkt der Erstellung der Produkte: Material, Fertigung, Verwaltung, Vertrieb.',
      visual: {
        typ: 'kostenstellen',
        hilfs: [
          { name: K.energie, einheit: 'kWh' },
          { name: K.instandhaltung, einheit: 'Std.' },
        ],
        haupt: [
          { name: K.material },
          { name: 'Fertigung' },
          { name: K.verwaltung },
          { name: K.vertrieb },
        ],
        pfeile: [
          { von: K.energie, an: K.instandhaltung, menge: '1500' },
          { von: K.energie, an: 'Fertigung', menge: '9000' },
          { von: K.instandhaltung, an: 'Fertigung', menge: '240' },
          { von: K.instandhaltung, an: K.material, menge: '60' },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage:
        'Leni überlegt, die Fertigung in zwölf Kostenstellen aufzuteilen – eine je Tank. Was ist die Folge?',
      optionen: [
        { text: 'Die Kostenrechnung wird genauer, ohne Nachteile.' },
        {
          text: 'Mehr Information, aber Kosten wie das Gehalt des Braumeisters müssten dann aufgeteilt werden.',
          richtig: true,
        },
        { text: 'Nichts – die Zahl der Kostenstellen spielt keine Rolle.' },
      ],
      aufloesung:
        'Feine Kostenstellen zeigen genauer, wo Kosten entstehen. Grobe Kostenstellen lassen sich dagegen leichter eindeutig bebuchen. Beides zieht in verschiedene Richtungen – gesucht ist ein Kompromiss, dessen Aufwand den Nutzen nicht übersteigt (Wirtschaftlichkeit).',
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Wer soll die Kostenstelle Abfüllung verantworten?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Alle drei Schichtleitungen gemeinsam – geteilte Verantwortung ist doppelte Verantwortung!',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Genau eine Person. Sie darf mehrere Kostenstellen führen, aber eine Kostenstelle darf nie mehrere Chefs haben.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Nur eine klar verantwortliche Person kann Abweichungen erklären und Einsparungen umsetzen.',
          richtig: true,
        },
        { text: 'Mehrere Verantwortliche senken die Kosten der Kostenstelle.' },
        { text: 'Verantwortliche braucht nur die Verwaltung.' },
      ],
      aufloesung:
        'Kostenstelle und Verantwortungsbereich sollen übereinstimmen. Die verantwortliche Person wird auch an den Vorgabewerten beteiligt, an denen sie später gemessen wird.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Lenis Liste der Bezugsgrößen',
      text: 'Eine Bezugsgröße passt nicht zur Kostenverursachung. Tippe sie an.',
      zeilen: [
        'Raumkosten nach der Fläche in Quadratmetern',
        'Freiwillige Sozialkosten nach der Zahl der Mitarbeiter',
        'Abschreibungen der Abfüllanlage nach der Zahl der Telefonanschlüsse',
        'Instandhaltung nach den geleisteten Werkstattstunden',
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Telefonanschlüsse haben nichts mit dem Wertverzehr der Anlage zu tun – Kosten und Bezugsgröße müssen sich gemeinsam verändern.',
          richtig: true,
        },
        { text: 'Abschreibungen dürfen nicht auf Kostenstellen verteilt werden.' },
        { text: 'Die Zahl der Mitarbeiter ist nie eine geeignete Bezugsgröße.' },
      ],
      aufloesung:
        'Für jede Kostenstelle braucht es eine Maßgröße, die mit den Kosten mitwächst: Fläche für Raumkosten, Kapitalbindung für Abschreibungen, Stunden für die Werkstatt.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Welche Kostenstelle der MBG ist eine Vorkostenstelle?',
      optionen: [
        {
          text: K.instandhaltung,
          richtig: true,
          erklaerung:
            'Die Werkstatt repariert für andere Stellen. Ihre Kosten werden später an die Endkostenstellen weiterverrechnet.',
        },
        {
          text: K.vertrieb,
          erklaerung:
            'Der Vertrieb ist eine Endkostenstelle: Seine Kosten gehen direkt auf die Produkte.',
        },
        {
          text: K.fertigung2,
          erklaerung: 'In der Abfüllung wird direkt am Produkt gearbeitet – eine Endkostenstelle.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'I1-m1',
      frage: 'Welche Grundsätze gelten für die Bildung von Kostenstellen?',
      text: 'Kostenstellen sind Bereiche, in denen Kosten anfallen und erfasst, geplant und kontrolliert werden. Gute Kostenstellen: Belege eindeutig zuordenbar, passende Bezugsgröße, genau eine verantwortliche Person, wirtschaftlich vertretbar. Vorkostenstellen (Hilfskostenstellen) leisten für andere Stellen, Endkostenstellen (Hauptkostenstellen) für das Produkt.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe:
        'Ordnen Sie die folgenden Kostenstellen eines Getränkeherstellers den Vorkostenstellen oder den Endkostenstellen zu.',
      part: K_TEIL,
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Jetzt hat jeder Bereich seine Kostenstelle. Aber die Miete für das Werk kommt als eine einzige Rechnung – wer zahlt welchen Teil?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie viele Personen sollen eine Kostenstelle verantworten?',
      optionen: [
        { text: 'Genau eine', richtig: true },
        { text: 'Mindestens zwei' },
        { text: 'Alle Beschäftigten der Stelle' },
      ],
    },
    {
      frage: 'Was kennzeichnet eine Vorkostenstelle?',
      optionen: [
        { text: 'Sie erbringt Leistungen für andere Kostenstellen.', richtig: true },
        { text: 'Sie arbeitet direkt am Produkt.' },
        { text: 'Sie verursacht keine Kosten.' },
      ],
    },
    {
      frage: 'Welche Bezugsgröße passt zu den Raumkosten?',
      optionen: [
        { text: 'Die Fläche in Quadratmetern', richtig: true },
        { text: 'Die Zahl der verkauften Dosen' },
        { text: 'Der Umsatz des Vertriebs' },
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
      'K2 Kap. 1.1 (Kostenstelle: Bereich, in dem Kosten anfallen, erfasst, geplant, kontrolliert werden), 1.2.1 (vier Grundsätze: eindeutige Zuordnung, eindeutige Beziehung Leistung–Kostenverursachung, Kongruenz mit Verantwortungsbereich mit genau einer verantwortlichen Person, Wirtschaftlichkeit; gegenläufige Tendenz der ersten beiden), 1.2.2 (funktionale Einteilung, Vor-/Endkostenstellen, Kostenstellenplan mit allgemeinen Kostenstellen) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
