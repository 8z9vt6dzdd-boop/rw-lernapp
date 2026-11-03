// Lektion E4 – Bestandsveränderungen (eigene Formulierung; Buchungsregeln nach 04-fachregeln.md, GC-11).
// Alle Beträge werden von der Engine berechnet.
import {
  bestandsveraenderung,
  solveBestand,
  type BestandParams,
} from '../../engine/generators/bestandsveraenderung';
import { formatEuro, sum, type Val } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

// Beispiel der Lektion: unfertige Erzeugnisse steigen, fertige sinken
const BEISPIEL: BestandParams = { ueAB: '10000', ueEB: '16000', feAB: '40000', feEB: '30000' };
const S = solveBestand(BEISPIEL);

// Verständnisfrage: Erfolg mit Minderbestand
const ERLOESE = '500000';
const AUFWAND = '420000';
const MINDER = '30000';
const GEWINN = sum([ERLOESE]).minus(AUFWAND).minus(MINDER);
const FALSCH_PLUS = sum([ERLOESE]).minus(AUFWAND).plus(MINDER);
const OHNE = sum([ERLOESE]).minus(AUFWAND);

// Klausurbrücke: eigene Zahlen, Buchungsteil aus dem Generator
const KLAUSUR: BestandParams = { ueAB: '24000', ueEB: '18000', feAB: '50000', feEB: '71000' };
const KLAUSUR_TEIL = bestandsveraenderung
  .parts(KLAUSUR, solveBestand(KLAUSUR))
  .find((p) => p.id === 'buchung') as TaskPart;

export const lektionE4: Lektion = {
  id: 'E4',
  skillId: 'E4-bestandsveraenderung',
  abschnitt: 'E',
  titel: 'Bestandsveränderungen: volle Tanks, voller Erfolg?',
  kernAha:
    'Was hergestellt, aber noch nicht verkauft ist, hat trotzdem einen Wert: Ein Mehrbestand erhöht den Erfolg, ein Minderbestand mindert ihn.',
  dauerMin: 7,
  figuren: ['tobias', 'leni', 'jana'],
  ort: 'lager',
  quelle: 'BA 2.3, BA 3.4; 04-fachregeln.md (GC-11)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'ueberrascht',
    text: 'Wir haben viel produziert und wenig verkauft – und trotzdem steigt unser Erfolg?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'lager',
        titel: 'Tanklager am 31.12.',
        tanks: [
          { name: 'Sirup (Anfang)', fuellung: 0.3 },
          { name: 'Sirup (Ende)', fuellung: 0.5 },
          { name: 'Fertigware (Anfang)', fuellung: 0.8, farbe: '#e2b13c' },
          { name: 'Fertigware (Ende)', fuellung: 0.6, farbe: '#e2b13c' },
        ],
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'ueberrascht',
          text: 'Im Dezember haben wir massenhaft Sirup angesetzt und kaum verkauft. Laut Leni hilft das trotzdem unserem Erfolg?',
        },
        { figur: 'leni', ausdruck: 'freut', text: 'Volle Tanks sind kein verlorenes Geld.' },
      ],
      frage: 'Wie kann etwas, das noch gar nicht verkauft ist, den Erfolg erhöhen?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Denk an eine Bäckerei: Abends liegen noch Brote im Regal. Mehl, Strom und Lohn sind verbraucht – aber die Brote sind noch etwas wert.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'In der GuV stehen alle Aufwendungen des Jahres. Den Wert der Vorräte gleichen wir über das Konto Bestandsveränderungen aus.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Im Tank lag am Jahresanfang Sirup für ${formatEuro(BEISPIEL.ueAB)}, am Jahresende für ${formatEuro(BEISPIEL.ueEB)}. Was ist passiert?`,
      optionen: [
        { text: 'Ein Mehrbestand – es ist mehr da als vorher.', richtig: true },
        { text: 'Ein Minderbestand – es wurde verbraucht.' },
        { text: 'Nichts, Vorräte spielen für den Erfolg keine Rolle.' },
      ],
      aufloesung: `Endbestand größer als Anfangsbestand: ein Mehrbestand von ${e(S.dUE)}. Die MBG hat mehr hergestellt, als sie weiterverarbeitet oder verkauft hat. Dieser Wert erhöht den Erfolg.`,
    },
    {
      typ: 'konzept',
      titel: 'Mehrbestand und Minderbestand',
      text: 'Endbestand minus Anfangsbestand: Ist das Ergebnis positiv, liegt ein Mehrbestand vor – er erhöht den Erfolg. Ist es negativ, liegt ein Minderbestand vor – es wurde mehr verkauft als hergestellt, das mindert den Erfolg.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Mehrbestand',
            text: 'Erzeugniskonto an Bestandsveränderungen – wirkt wie ein Ertrag.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Minderbestand',
            text: 'Bestandsveränderungen an Erzeugniskonto – wirkt wie ein Aufwand.',
            farbe: '#e8792b',
          },
          {
            titel: 'Abschluss',
            text: 'Der Saldo des Kontos Bestandsveränderungen geht in die GuV.',
            farbe: '#1c6670',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Mehr oder weniger?',
      kategorien: ['Mehrbestand – erhöht den Erfolg', 'Minderbestand – mindert den Erfolg'],
      elemente: [
        {
          text: `Fertige Erzeugnisse: Anfang ${formatEuro(BEISPIEL.feAB)}, Ende ${formatEuro(BEISPIEL.feEB)}`,
          kategorie: 'Minderbestand – mindert den Erfolg',
        },
        {
          text: `Unfertige Erzeugnisse: Anfang ${formatEuro(BEISPIEL.ueAB)}, Ende ${formatEuro(BEISPIEL.ueEB)}`,
          kategorie: 'Mehrbestand – erhöht den Erfolg',
        },
        {
          text: 'Im Sommer mehr Dosen verkauft als abgefüllt',
          kategorie: 'Minderbestand – mindert den Erfolg',
          erklaerung: 'Das Lager leert sich.',
        },
        {
          text: 'Für das Weihnachtsgeschäft auf Vorrat produziert',
          kategorie: 'Mehrbestand – erhöht den Erfolg',
          erklaerung: 'Das Lager füllt sich.',
        },
        {
          text: 'Die Lagertanks sind am Jahresende voller als am Jahresanfang',
          kategorie: 'Mehrbestand – erhöht den Erfolg',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Buchen und abschließen',
      text: `Unfertige Erzeugnisse: ${formatEuro(BEISPIEL.ueAB)} → ${formatEuro(BEISPIEL.ueEB)}. Fertige Erzeugnisse: ${formatEuro(BEISPIEL.feAB)} → ${formatEuro(BEISPIEL.feEB)}.`,
      visual: {
        typ: 'tkonto',
        name: 'Bestandsveränderungen',
        soll: [{ text: 'Fertige Erzeugnisse', betrag: S.dFE.abs().value.toString() }],
        haben: [{ text: 'Unfertige Erzeugnisse', betrag: S.dUE.value.toString() }],
        saldo: true,
      },
      schritte: [
        {
          text: 'Unfertige Erzeugnisse: Mehrbestand',
          rechnung: `Unfertige Erzeugnisse an Bestandsveränderungen ${e(S.dUE)}`,
          warum:
            'Der Bestand steigt, also nimmt das Aktivkonto im Soll zu. Bestandsveränderungen steht im Haben – wie ein Ertrag.',
        },
        {
          text: 'Fertige Erzeugnisse: Minderbestand',
          rechnung: `Bestandsveränderungen an Fertige Erzeugnisse ${e(S.dFE.abs())}`,
          warum:
            'Der Bestand sinkt, also nimmt das Aktivkonto im Haben ab. Bestandsveränderungen steht im Soll – wie ein Aufwand.',
        },
        {
          text: 'Saldo bilden',
          rechnung: `${e(S.dUE)} − ${e(S.dFE.abs())} = ${e(S.saldo)}`,
          warum:
            'Jede Erzeugnisart wird einzeln gebucht. Erst im Konto Bestandsveränderungen werden beide verrechnet.',
        },
        {
          text: 'Abschluss über die GuV',
          rechnung: `Gewinn- und Verlustkonto an Bestandsveränderungen ${e(S.saldo.abs())}`,
          warum:
            'Insgesamt überwiegt der Minderbestand. Er mindert den Erfolg und steht deshalb in der GuV im Soll.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat gebucht',
      text: 'Eine der drei Buchungen ist falsch. Tippe sie an.',
      zeilen: [
        `Unfertige Erzeugnisse an Bestandsveränderungen ${e(S.dUE)}`,
        `Fertige Erzeugnisse an Bestandsveränderungen ${e(S.dFE.abs())}`,
        `GuV an Bestandsveränderungen ${e(S.saldo.abs())}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Der Bestand an fertigen Erzeugnissen ist gesunken – also Bestandsveränderungen an Fertige Erzeugnisse.',
          richtig: true,
        },
        { text: 'Unfertige und fertige Erzeugnisse müssen in einem Satz gebucht werden.' },
        { text: 'Der Saldo wird über das Schlussbilanzkonto abgeschlossen.' },
      ],
      aufloesung:
        'Bei einem Minderbestand nimmt das Erzeugniskonto ab und steht im Haben. Der Kollege hat Mehr- und Minderbestand verwechselt.',
    },
    {
      typ: 'verstaendnis',
      frage: `Umsatzerlöse ${formatEuro(ERLOESE)}, übrige Aufwendungen ${formatEuro(AUFWAND)}, Minderbestand an fertigen Erzeugnissen ${formatEuro(MINDER)}. Wie hoch ist der Gewinn?`,
      optionen: [
        {
          text: e(GEWINN),
          richtig: true,
          erklaerung: `${formatEuro(ERLOESE)} − ${formatEuro(AUFWAND)} − ${formatEuro(MINDER)} = ${e(GEWINN)}. Der Minderbestand wirkt wie zusätzlicher Aufwand.`,
        },
        {
          text: e(FALSCH_PLUS),
          erklaerung: 'Ein Minderbestand erhöht den Erfolg nicht – er mindert ihn.',
        },
        {
          text: e(OHNE),
          erklaerung: 'Die Bestandsveränderung fehlt. Sie gehört in die Erfolgsrechnung.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'E4-m1',
      frage: 'Wie werden Bestandsveränderungen gebucht und wie wirken sie auf den Erfolg?',
      text: 'Mehrbestand: Erzeugniskonto an Bestandsveränderungen – erhöht den Erfolg. Minderbestand: Bestandsveränderungen an Erzeugniskonto – mindert ihn. Jede Erzeugnisart einzeln buchen, den Saldo über die GuV abschließen.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe: `Die Inventur ergibt: Unfertige Erzeugnisse Anfangsbestand ${formatEuro(KLAUSUR.ueAB)}, Endbestand ${formatEuro(KLAUSUR.ueEB)}; fertige Erzeugnisse Anfangsbestand ${formatEuro(KLAUSUR.feAB)}, Endbestand ${formatEuro(KLAUSUR.feEB)}. Bilden Sie die Buchungssätze einschließlich Abschluss des Kontos Bestandsveränderungen.`,
      part: KLAUSUR_TEIL,
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'freut',
        text: 'Einkauf, Verkauf, Abschreibung, Bestände: Alle Bausteine sind da. Jetzt bucht die MBG ein ganzes Geschäftsjahr am Stück, vom Eröffnungsbilanzkonto bis zur Schlussbilanz.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Fertige Erzeugnisse: Anfangsbestand 20.000 €, Endbestand 26.000 €. Buchung?',
      optionen: [
        { text: 'Fertige Erzeugnisse an Bestandsveränderungen 6.000 €', richtig: true },
        { text: 'Bestandsveränderungen an Fertige Erzeugnisse 6.000 €' },
        { text: 'Fertige Erzeugnisse an GuV 6.000 €' },
      ],
    },
    {
      frage: 'Wie wirkt ein Minderbestand auf den Erfolg?',
      optionen: [
        { text: 'Er mindert den Erfolg.', richtig: true },
        { text: 'Er erhöht den Erfolg.' },
        { text: 'Gar nicht.' },
      ],
    },
    {
      frage: 'Überwiegen die Mehrbestände, wie wird das Konto Bestandsveränderungen abgeschlossen?',
      optionen: [
        { text: 'Bestandsveränderungen an GuV', richtig: true },
        { text: 'GuV an Bestandsveränderungen' },
        { text: 'Bestandsveränderungen an Schlussbilanzkonto' },
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
      'Buchungslogik nach 04-fachregeln.md (GC-11) und 03-aufgabentypen.md (E4); Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
