// Lektion I4 – Stufenleiterverfahren (eigene Formulierung; geprüft gegen K2 Kap. 1.4.2.3, S. 32–35;
// Reihenfolge nach 04-fachregeln.md, Konvention 10). Alle Beträge werden von der Engine berechnet.
import {
  gesamtLeistung,
  reihenfolgeWerte,
  solveStufenleiter,
  stufenleiter,
  type LvParams,
} from '../../engine/generators/leistungsverrechnung';
import { formatEuro, formatNumber, formatPlain, type Val } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());
const q = (v: Val, einheit: string) => `${formatNumber(v.value)} €/${einheit}`;

// Beispiel der Lektion (eigene Zahlen): Energie liefert wertmäßig mehr an die Instandhaltung
const P: LvParams = {
  hilfs: [
    { name: 'Energie', primaer: '30000', einheit: 'kWh' },
    { name: 'Instandhaltung', primaer: '13000', einheit: 'Std.' },
  ],
  haupt: [
    { name: 'Material', primaer: '20000' },
    { name: 'Fertigung', primaer: '35000' },
  ],
  mengen: [
    [0, 2000, 4000, 6000],
    [50, 0, 150, 300],
  ],
};
const S = solveStufenleiter(P);
const W = reihenfolgeWerte(P);
const FALSCH = solveStufenleiter(P, { nurPrimaer: true });
const L_E = gesamtLeistung(P, 0);
const L_I = gesamtLeistung(P, 1);

// Klausurbrücke (eigene Zahlen)
const K: LvParams = {
  hilfs: [
    { name: 'Energie', primaer: '24000', einheit: 'kWh' },
    { name: 'Instandhaltung', primaer: '15000', einheit: 'Std.' },
  ],
  haupt: [
    { name: 'Material', primaer: '18000' },
    { name: 'Fertigung', primaer: '42000' },
  ],
  mengen: [
    [0, 1000, 3000, 4000],
    [40, 0, 160, 200],
  ],
};
const K_TEIL = stufenleiter
  .parts(K, solveStufenleiter(K))
  .find((p) => p.id === 'reihenfolge') as TaskPart;

export const lektionI4: Lektion = {
  id: 'I4',
  skillId: 'I4-stufenleiter',
  abschnitt: 'I',
  titel: 'Stufenleiterverfahren: Wer zahlt den Strom?',
  kernAha:
    'Vorkostenstellen werden nacheinander abgerechnet: zuerst die, die wertmäßig mehr an die andere liefert. Leistungen an bereits abgerechnete Stellen werden nicht zurückverrechnet.',
  dauerMin: 8,
  figuren: ['leni', 'frank', 'jana', 'tobias'],
  ort: 'besprechung',
  quelle: 'K2 1.4.2.3 (S. 32–35); 04-fachregeln.md (Konvention 10, GC-16)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Energie und Werkstatt verkaufen nichts – trotzdem kosten sie im Monat 43.000 €. Wer trägt das?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Energie und Instandhaltung verkaufen keine einzige Dose. Trotzdem kosten sie diesen Monat ${formatEuro('43000')}.`,
        },
        { figur: 'frank', ausdruck: 'gruebelt', text: 'Und welche Abteilung bezahlt das am Ende?' },
      ],
      frage: 'Wie verteilt man die Kosten von Abteilungen, die sich auch noch gegenseitig helfen?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Wie in einer WG: Die Stromrechnung teilen alle – je nachdem, wer wie viel verbraucht.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Nur dass hier auch die Werkstatt Strom braucht und die Energie-Leute die Werkstatt rufen. Die beiden helfen sich gegenseitig.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Energie und Werkstatt helfen sich gegenseitig. Rechnet man sie nacheinander ab – wer sollte zuerst drankommen?',
      optionen: [
        { text: 'Die Abteilung mit den höheren eigenen Kosten' },
        { text: 'Die Abteilung, die wertmäßig mehr an die andere liefert', richtig: true },
        { text: 'Egal – das Ergebnis ist immer gleich' },
      ],
      aufloesung: `Energie liefert ${formatPlain(P.mengen[0]![1]!)} kWh im Wert von ${e(W[0])} an die Instandhaltung, die Instandhaltung liefert ${formatPlain(P.mengen[1]![0]!)} Stunden im Wert von ${e(W[1])} zurück. Energie liefert wertmäßig mehr, also wird sie zuerst abgerechnet – so geht die kleinere Leistung verloren.`,
    },
    {
      typ: 'konzept',
      titel: 'Vorkostenstellen und Hauptkostenstellen',
      text: 'Vorkostenstellen arbeiten für andere Stellen, nicht direkt für das Produkt. Ihre Kosten werden über Verrechnungssätze – Kosten je kWh oder je Stunde – an die Stellen weitergegeben, die ihre Leistungen nutzen.',
      visual: {
        typ: 'kostenstellen',
        hilfs: [
          { name: 'Energie', primaer: '30000', einheit: 'kWh' },
          { name: 'Instandhaltung', primaer: '13000', einheit: 'Std.' },
        ],
        haupt: [
          { name: 'Material', primaer: '20000' },
          { name: 'Fertigung', primaer: '35000' },
        ],
        pfeile: [
          { von: 'Energie', an: 'Instandhaltung', menge: '2000' },
          { von: 'Instandhaltung', an: 'Energie', menge: '50' },
          { von: 'Energie', an: 'Material', menge: '4000' },
          { von: 'Energie', an: 'Fertigung', menge: '6000' },
          { von: 'Instandhaltung', an: 'Material', menge: '150' },
          { von: 'Instandhaltung', an: 'Fertigung', menge: '300' },
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Durch wie viele Stunden wird bei der Instandhaltung geteilt?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `Durch alle ${formatPlain(L_I)} Stunden – die hat die Werkstatt ja geleistet.`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Nur durch ${formatPlain(L_I - P.mengen[1]![0]!)}. Die Stunden für die Energie zählen nicht mehr, die ist schon abgerechnet.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Leistungen an eine bereits abgerechnete Stelle werden nicht zurückverrechnet und deshalb aus der Gesamtleistung herausgenommen.',
          richtig: true,
        },
        { text: 'Die Werkstatt hat für die Energie umsonst gearbeitet.' },
        { text: 'Bei der zweiten Stelle wird immer durch die halbe Leistung geteilt.' },
      ],
      aufloesung:
        'Würde man durch alle Stunden teilen, landete ein Teil der Werkstattkosten auf Stunden, die niemand mehr bezahlt. Dann ginge in der Verteilung Geld verloren.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Stufenleiter Schritt für Schritt',
      visual: {
        typ: 'kostenstellen',
        hilfs: [
          { name: 'Energie', einheit: 'kWh' },
          { name: 'Instandhaltung', einheit: 'Std.' },
        ],
        haupt: [{ name: 'Material' }, { name: 'Fertigung' }],
        pfeile: [
          { von: 'Energie', an: 'Instandhaltung', menge: '2000' },
          { von: 'Energie', an: 'Material', menge: '4000' },
          { von: 'Energie', an: 'Fertigung', menge: '6000' },
          { von: 'Instandhaltung', an: 'Material', menge: '150' },
          { von: 'Instandhaltung', an: 'Fertigung', menge: '300' },
        ],
      },
      schritte: [
        {
          text: 'Reihenfolge bestimmen',
          rechnung: `Energie → Instandhaltung: ${e(W[0])}; Instandhaltung → Energie: ${e(W[1])}`,
          warum:
            'Wert = primäre Kosten ÷ Gesamtleistung × an die andere Stelle abgegebene Menge. Der größere Wert bestimmt, wer zuerst kommt.',
        },
        {
          text: 'Verrechnungssatz Energie',
          rechnung: `${formatEuro('30000')} ÷ ${formatPlain(L_E)} kWh = ${q(S.saetze[0], 'kWh')}`,
          warum:
            'Die erste Stelle verteilt nur ihre eigenen, primären Kosten auf alle ihre Leistungen.',
        },
        {
          text: 'Die Instandhaltung empfängt Energiekosten',
          rechnung: `${formatPlain(P.mengen[0]![1]!)} kWh × ${q(S.saetze[0], 'kWh')} = ${e(S.empfangen)}`,
          warum: 'Die Werkstatt hat Strom verbraucht – diese Kosten trägt sie jetzt mit.',
        },
        {
          text: 'Verrechnungssatz Instandhaltung',
          rechnung: `(${formatEuro('13000')} + ${e(S.empfangen)}) ÷ (${formatPlain(L_I)} − ${formatPlain(P.mengen[1]![0]!)}) Std. = ${q(S.saetze[1], 'Std.')}`,
          warum:
            'Eigene plus empfangene Kosten, geteilt durch die Stunden ohne die Leistung an die bereits abgerechnete Energie.',
        },
        {
          text: 'Auf die Hauptkostenstellen verteilen',
          rechnung: `Material: ${formatEuro('20000')} + ${e(S.umlage[0][0]!)} + ${e(S.umlage[1][0]!)} = ${e(S.summen[0]!)}; Fertigung: ${formatEuro('35000')} + ${e(S.umlage[0][1]!)} + ${e(S.umlage[1][1]!)} = ${e(S.summen[1]!)}`,
          warum: `Kontrolle: Zusammen ${e(S.summen[0]!.plus(S.summen[1]!))} – genau die primären Gemeinkosten aller vier Stellen. Es wird nur umverteilt.`,
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat gerechnet',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Verrechnungssatz Energie: ${formatEuro('30000')} ÷ ${formatPlain(L_E)} kWh = ${q(S.saetze[0], 'kWh')}`,
        `Instandhaltung erhält: ${formatPlain(P.mengen[0]![1]!)} kWh × ${q(S.saetze[0], 'kWh')} = ${e(S.empfangen)}`,
        `Verrechnungssatz Instandhaltung: ${formatEuro('13000')} ÷ ${formatPlain(L_I - P.mengen[1]![0]!)} Std. = ${q(FALSCH.saetze[1], 'Std.')}`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: `Die von der Energie empfangenen ${e(S.empfangen)} fehlen im Zähler.`,
          richtig: true,
        },
        { text: 'Es müsste durch alle Stunden geteilt werden.' },
        { text: 'Die Instandhaltung hätte zuerst abgerechnet werden müssen.' },
      ],
      aufloesung: `Richtig: (${formatEuro('13000')} + ${e(S.empfangen)}) ÷ ${formatPlain(L_I - P.mengen[1]![0]!)} Std. = ${q(S.saetze[1], 'Std.')}. Sonst bleiben die Stromkosten der Werkstatt auf keiner Hauptkostenstelle hängen.`,
    },
    {
      typ: 'verstaendnis',
      frage:
        'Warum muss die Summe der Hauptkostenstellen am Ende den gesamten primären Gemeinkosten entsprechen?',
      optionen: [
        {
          text: 'Weil nur umverteilt wird – es kommt nichts dazu und nichts geht verloren.',
          richtig: true,
          erklaerung:
            'Genau. Deshalb ist der Vergleich eine gute Kontrolle für die eigene Rechnung.',
        },
        {
          text: 'Weil die Hauptkostenstellen ihre Kosten selbst festlegen.',
          erklaerung: 'Die Summe ergibt sich aus der Rechnung, nicht aus einer Festlegung.',
        },
        {
          text: 'Das muss sie nicht – Abweichungen sind beim Stufenleiterverfahren normal.',
          erklaerung:
            'Bis auf kleine Rundungsdifferenzen muss die Summe stimmen. Größere Abweichungen zeigen einen Rechenfehler.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'I4-m1',
      frage: 'Wie läuft das Stufenleiterverfahren ab?',
      text: 'Zuerst die Vorkostenstelle abrechnen, die wertmäßig mehr an die andere liefert. Zweiter Satz = (eigene + empfangene Kosten) ÷ (Leistung ohne Lieferungen an bereits abgerechnete Stellen). Kontrolle: Summe Hauptkostenstellen = alle primären Gemeinkosten.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Vorkostenstelle Energie: primäre Gemeinkosten ${formatEuro('24000')}, Leistung ${formatPlain(gesamtLeistung(K, 0))} kWh (davon 1.000 kWh an die Instandhaltung). Vorkostenstelle Instandhaltung: primäre Gemeinkosten ${formatEuro('15000')}, Leistung ${formatPlain(gesamtLeistung(K, 1))} Std. (davon 40 Std. an die Energie). Bestimmen Sie die Reihenfolge nach dem Stufenleiterverfahren und die Verrechnungssätze (auf 2 Nachkommastellen).`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Die 40 Stunden der Werkstatt für die Energie haben wir einfach unter den Tisch fallen lassen. Geht das nicht genauer?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Welche Vorkostenstelle wird beim Stufenleiterverfahren zuerst abgerechnet?',
      optionen: [
        { text: 'Die, die wertmäßig mehr an die andere Vorkostenstelle liefert', richtig: true },
        { text: 'Die mit der größeren Leistungsmenge' },
        { text: 'Immer die Energie' },
      ],
    },
    {
      frage:
        'Die zweite Stelle hat 20.000 € primäre Kosten, empfängt 4.000 € und leistet 500 Std., davon 20 an die erste Stelle. Verrechnungssatz?',
      optionen: [
        { text: '50,00 €/Std.', richtig: true },
        { text: '48,00 €/Std.' },
        { text: '41,67 €/Std.' },
      ],
    },
    {
      frage:
        'Was passiert mit Leistungen der zweiten Stelle an die bereits abgerechnete erste Stelle?',
      optionen: [
        { text: 'Sie werden nicht verrechnet.', richtig: true },
        { text: 'Sie werden am Ende zurückgebucht.' },
        { text: 'Sie werden der Verwaltung belastet.' },
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
      'K2 Kap. 1.4.2.3 (S. 32–35: paarweiser Wertvergleich, Verrechnungssatz der zweiten Stelle mit sekundären Kosten und ohne Leistungen an vorgelagerte Stellen) und 04-fachregeln.md Konvention 10 abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
