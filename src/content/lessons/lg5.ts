// Lektion G5 – Einzel- und Gemeinkosten (eigene Formulierung; geprüft gegen K1 Kap. 1.4.2, S. 32–33).
// Zuordnungen kommen aus der Engine (generators/g/g5-einzel-gemein.ts).
import { FIRMA } from '../../config';
import { kostenartG5 } from '../../engine/generators/g/g5-einzel-gemein';
import type { Lektion } from './types';

const z = (id: string) => kostenartG5(id).zurechnung;
const t = (id: string) => kostenartG5(id).text(FIRMA);

export const lektionG5: Lektion = {
  id: 'G5',
  skillId: 'G5-einzel-gemein',
  abschnitt: 'G',
  titel: 'Einzel- und Gemeinkosten: Was gehört zu genau einer Charge?',
  kernAha:
    'Einzelkosten lassen sich einem Kostenträger direkt zurechnen, Gemeinkosten nur über Schlüssel oder Zuschläge. Unechte Gemeinkosten wären direkt zurechenbar, die Erfassung lohnt aber nicht; Sondereinzelkosten gehören zu einem Auftrag. Fixe Kosten sind regelmäßig Gemeinkosten.',
  dauerMin: 7,
  figuren: ['tobias', 'leni', 'jana'],
  ort: 'besprechung',
  quelle: 'K1 1.4.2 (S. 32–33)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Die Hotelkette will Senne Lemon mit eigenem Etikett. Was kostet uns genau dieser Auftrag?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Das Landhotel Kerkhoff will 5.000 Flaschen Senne Lemon mit eigenem Etikett. Leni, was kostet uns genau dieser Auftrag?',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Den Zucker kann ich dir auf den Cent sagen. Aber wie viel vom Gehalt der Werkleiterin steckt in diesen Flaschen?',
        },
      ],
      frage: 'Welche Kosten lassen sich dem Hotelauftrag direkt zuordnen – und welche nicht?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'In einer WG gehört der Joghurt mit deinem Namen nur dir. Die Stromrechnung teilen sich alle.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Der Joghurt sind Einzelkosten, die Stromrechnung Gemeinkosten. Gemeinkosten verteilen wir über einen Schlüssel.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Direkt zurechenbar oder nicht?',
      kategorien: ['Einzelkosten', 'Gemeinkosten'],
      elemente: [
        { text: t('konzentrat'), kategorie: 'Einzelkosten' },
        { text: t('akkordlohn'), kategorie: 'Einzelkosten' },
        { text: t('braumalz'), kategorie: 'Einzelkosten' },
        {
          text: t('werkleitung'),
          kategorie: 'Gemeinkosten',
          erklaerung: 'Sie arbeitet für alle Sorten gleichzeitig.',
        },
        { text: t('miete'), kategorie: 'Gemeinkosten' },
        { text: t('versicherung'), kategorie: 'Gemeinkosten' },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Zurechenbarkeit auf den Kostenträger',
      text: 'Einzelkosten ordnet man dem Kostenträger direkt zu, ohne Umrechnung. Gemeinkosten fallen für mehrere Produkte gemeinsam an und werden über Schlüssel oder Zuschlagssätze verteilt. Sondereinzelkosten gehören zu einem Auftrag statt zum einzelnen Stück.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Einzelkosten', text: 'Fertigungsmaterial, Akkordlohn', farbe: '#1c6670' },
          { titel: 'Gemeinkosten', text: 'Gehälter, Versicherungen, Zinsen', farbe: '#e8792b' },
          {
            titel: 'Sondereinzelkosten',
            text: 'Fertigung: Rüstkosten. Vertrieb: Ausgangsfrachten, Spezialverpackungen',
            farbe: '#e2b13c',
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `${t('leim')}: Man könnte den Leim je Flasche abwiegen. Wie behandelt die MBG ihn?`,
      optionen: [
        { text: 'Als Einzelkosten, weil er sich zurechnen ließe' },
        { text: 'Als unechte Gemeinkosten', richtig: true },
        { text: 'Gar nicht, weil der Betrag klein ist' },
      ],
      aufloesung: `${z('leim')}: Ihrem Inhalt nach sind es Einzelkosten (und variabel), doch die Erfassung je Flasche wäre viel zu aufwendig. Deshalb laufen sie wie Gemeinkosten mit.`,
    },
    {
      typ: 'wer-hat-recht',
      frage: `${t('druckplatte')}. Wie wird sie verrechnet?`,
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Das sind Gemeinkosten. Die verteilen wir auf alle Flaschen der MBG.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Die Platte braucht nur dieser Auftrag. Also trägt ihn der Hotelauftrag allein.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: `Es sind ${z('druckplatte')}: einem Auftrag direkt zurechenbar, aber nicht der einzelnen Flasche.`,
          richtig: true,
        },
        { text: 'Druckplatten sind immer Sondereinzelkosten des Vertriebs.' },
        { text: 'Alles, was mit Etiketten zu tun hat, sind unechte Gemeinkosten.' },
      ],
      aufloesung:
        'Rüstkosten und auftragsbezogene Werkzeuge sind Sondereinzelkosten der Fertigung, Ausgangsfrachten und Spezialverpackungen Sondereinzelkosten des Vertriebs.',
    },
    {
      typ: 'erkunden',
      titel: 'Zwei Brillen auf dieselben Kosten',
      text: 'Fix und variabel fragt: Was passiert bei mehr Menge? Einzel und Gemein fragt: Wem lässt es sich zurechnen? Decke auf, wie beides zusammenhängt.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Einzelkosten',
            text: 'sind variabel: Mehr Flaschen brauchen mehr Konzentrat und mehr Akkordlohn.',
            farbe: '#1c6670',
          },
          {
            titel: 'Unechte Gemeinkosten',
            text: 'sind ebenfalls variabel: Mehr Flaschen brauchen mehr Leim – nur gemessen wird er nicht je Flasche.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Echte Gemeinkosten',
            text: 'sind oft fix: Miete, Gehälter, Versicherung. Fixe Kosten sind regelmäßig Gemeinkosten.',
            farbe: '#e8792b',
          },
        ],
      },
      fazit:
        'Nach der Systematik des Lehrbriefs sind variable Kosten also Einzelkosten oder unechte Gemeinkosten. Nicht jede variable Kostenart ist automatisch Einzelkosten.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Welche Aussage stimmt?',
      optionen: [
        {
          text: 'Fixe Kosten sind regelmäßig Gemeinkosten.',
          richtig: true,
          erklaerung:
            'Was unabhängig von der Menge anfällt, lässt sich keiner einzelnen Flasche zuordnen.',
        },
        {
          text: 'Alle variablen Kosten sind Einzelkosten.',
          erklaerung: 'Unechte Gemeinkosten sind variabel, werden aber nicht einzeln erfasst.',
        },
        {
          text: 'Sondereinzelkosten sind Gemeinkosten eines Auftrags.',
          erklaerung:
            'Sondereinzelkosten sind einem Auftrag direkt zurechenbar – also gerade keine Gemeinkosten.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'G5-m1',
      frage: 'Was unterscheidet Einzel-, Gemein-, unechte Gemein- und Sondereinzelkosten?',
      text: 'Einzelkosten: dem Kostenträger direkt zurechenbar. Gemeinkosten: nur über Schlüssel oder Zuschläge verteilbar. Unechte Gemeinkosten: eigentlich Einzelkosten, aber Erfassung zu aufwendig. Sondereinzelkosten: einem Auftrag zurechenbar (Fertigung oder Vertrieb). Fixe Kosten sind regelmäßig Gemeinkosten.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Ordnen Sie die Kostenarten den Kategorien Einzelkosten, Sondereinzelkosten der Fertigung bzw. des Vertriebs, unechte oder echte Gemeinkosten zu.',
      part: { skillId: 'G5-einzel-gemein', seed: 4, variant: 'zuordnung', partId: 'zuordnung' },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Das Gehalt der Werkleiterin muss trotzdem auf die Sorten. Nach welcher Regel ist das fair?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was sind unechte Gemeinkosten?',
      optionen: [
        {
          text: 'Eigentlich Einzelkosten, deren genaue Zurechnung zu aufwendig wäre',
          richtig: true,
        },
        { text: 'Gemeinkosten, die nur scheinbar anfallen' },
        { text: 'Fixe Kosten eines einzelnen Auftrags' },
      ],
    },
    {
      frage: 'Die Ausgangsfracht für eine bestimmte Lieferung ist …',
      optionen: [
        { text: 'Sondereinzelkosten des Vertriebs', richtig: true },
        { text: 'Sondereinzelkosten der Fertigung' },
        { text: 'echte Gemeinkosten' },
      ],
    },
    {
      frage: 'Welche Kostenart ist typischerweise Einzelkosten?',
      optionen: [
        { text: 'Fertigungsmaterial laut Entnahmeschein', richtig: true },
        { text: 'Gehalt der Werkleiterin' },
        { text: 'Feuerversicherung des Werks' },
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
      'K1 1.4.2 (S. 32–33: Einzelkosten direkt zurechenbar, Gemeinkosten über Schlüssel/Zuschläge, fixe Kosten regelmäßig Gemeinkosten, unechte Gemeinkosten, Sondereinzelkosten der Fertigung und des Vertriebs, Zusammenhang mit fix/variabel) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
