// Lektion I3 – Anbauverfahren (eigene Formulierung; geprüft gegen K2 Kap. 1.4.2.1 und 1.4.2.2, S. 26–32).
// Alle Beträge werden von der Engine berechnet.
import {
  anbau,
  anHauptkostenstellen,
  gesamtleistungAnbau,
  solveAnbau,
  type AnbauParams,
} from '../../engine/generators/ij/anbau';
import { formatEuro, formatNumber, formatPlain, sum, type Val } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());
const q = (v: Val, einheit: string) => `${formatNumber(v.value)} €/${einheit}`;

// Beispiel der Lektion (eigene Zahlen)
const P: AnbauParams = {
  hilfs: [
    { name: 'Energie', primaer: '12000', einheit: 'kWh' },
    { name: 'Instandhaltung', primaer: '9000', einheit: 'Std.' },
  ],
  haupt: [
    { name: 'Material', primaer: '20000' },
    { name: 'Fertigung', primaer: '50000' },
    { name: 'Verwaltung', primaer: '15000' },
  ],
  mengen: [
    [0, 2000, 1000, 4000, 1000],
    [100, 0, 50, 200, 50],
  ],
};
const S = solveAnbau(P);
const FALSCH = solveAnbau(P, { durchGesamtleistung: true });
const L_E = gesamtleistungAnbau(P, 0);
const L_I = gesamtleistungAnbau(P, 1);
const H_E = anHauptkostenstellen(P, 0);
const H_I = anHauptkostenstellen(P, 1);
const E_AN_I = P.mengen[0]![1]!;
const I_AN_E = P.mengen[1]![0]!;
// Was beim Teilen durch die Gesamtleistung unverteilt liegen bliebe
const VERLOREN = FALSCH.saetze[0]!.times(E_AN_I);

// Lückenbeispiel vom Generator
const L_SEED = 4;

// Klausurbrücke (eigene Zahlen)
const K: AnbauParams = {
  hilfs: [
    { name: 'Energie', primaer: '15000', einheit: 'kWh' },
    { name: 'Instandhaltung', primaer: '7200', einheit: 'Std.' },
  ],
  haupt: [
    { name: 'Material', primaer: '25000' },
    { name: 'Fertigung', primaer: '60000' },
  ],
  mengen: [
    [0, 1000, 2000, 8000],
    [40, 0, 60, 180],
  ],
};
const K_TEIL = anbau.parts(K, solveAnbau(K)).find((p) => p.id === 'saetze') as TaskPart;

export const lektionI3: Lektion = {
  id: 'I3',
  skillId: 'I3-anbau',
  abschnitt: 'I',
  titel: 'Anbauverfahren: Der schnelle Weg',
  kernAha:
    'Beim Anbauverfahren geben die Vorkostenstellen ihre Kosten nur an die Hauptkostenstellen ab: Verrechnungssatz = primäre Gemeinkosten ÷ Leistung an die Hauptkostenstellen. Was sich die Vorkostenstellen gegenseitig liefern, wird ignoriert – das ist schnell, aber ungenau.',
  dauerMin: 7,
  figuren: ['leni', 'jana', 'tobias', 'frank'],
  ort: 'besprechung',
  quelle: 'K2 1.4.2.1, 1.4.2.2 (S. 26–32)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Frank will die Zahlen bis heute Abend. Geht das auch schneller als ganz genau?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'neutral',
          text: 'Ich brauche bis heute Abend die Gemeinkosten von Material, Fertigung und Verwaltung.',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Dann lassen wir weg, was sich Energie und Werkstatt gegenseitig liefern.',
        },
      ],
      frage: 'Darf man das einfach weglassen – und was wird dadurch ungenau?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie zwei Mitbewohner, die sich ständig etwas leihen. Für die WG-Kasse zählt nur, was jeder für die WG ausgibt – das Hin und Her untereinander lässt man weg.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genau so arbeitet das Anbauverfahren, auch Blockumlageverfahren genannt.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die Energie hat ${formatEuro(P.hilfs[0]!.primaer)} Kosten und liefert ${formatPlain(L_E)} kWh – davon ${formatPlain(E_AN_I)} kWh an die Werkstatt. Durch welche Menge teilt man beim Anbauverfahren?`,
      optionen: [
        { text: `${formatPlain(H_E)} kWh`, richtig: true },
        { text: `${formatPlain(L_E)} kWh` },
        { text: `${formatPlain(E_AN_I)} kWh` },
      ],
      aufloesung: `Nur die ${formatPlain(H_E)} kWh an die Hauptkostenstellen zählen: ${formatEuro(P.hilfs[0]!.primaer)} ÷ ${formatPlain(H_E)} kWh = ${q(S.saetze[0]!, 'kWh')}. Wer durch alle ${formatPlain(L_E)} kWh teilt, lässt ${e(VERLOREN)} auf dem Strom der Werkstatt liegen – den verrechnet beim Anbau niemand.`,
    },
    {
      typ: 'konzept',
      titel: 'Nur an die Hauptkostenstellen',
      text: 'Jede Vorkostenstelle verteilt ihre primären Gemeinkosten ausschließlich auf die Hauptkostenstellen, auch Endkostenstellen genannt. Lieferungen zwischen den Vorkostenstellen werden ignoriert. Verrechnungssatz = primäre Gemeinkosten ÷ an die Hauptkostenstellen abgegebene Leistung.',
      visual: {
        typ: 'kostenstellen',
        hilfs: [
          { name: 'Energie', primaer: P.hilfs[0]!.primaer, einheit: 'kWh' },
          { name: 'Instandhaltung', primaer: P.hilfs[1]!.primaer, einheit: 'Std.' },
        ],
        haupt: P.haupt.map((h) => ({ name: h.name, primaer: h.primaer })),
        pfeile: [
          ...P.haupt.map((h, k) => ({
            von: 'Energie',
            an: h.name,
            menge: String(P.mengen[0]![2 + k]!),
          })),
          ...P.haupt.map((h, k) => ({
            von: 'Instandhaltung',
            an: h.name,
            menge: String(P.mengen[1]![2 + k]!),
          })),
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Liefert das Anbauverfahren das genaue Ergebnis?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Klar – am Ende sind doch alle Kosten verteilt.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Verteilt ja, aber verzerrt: Die Werkstatt verbraucht ${formatPlain(E_AN_I)} kWh Strom und trägt davon keinen Cent.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Exakt ist das Anbauverfahren nur, wenn sich die Vorkostenstellen gegenseitig keine Leistungen liefern.',
          richtig: true,
        },
        { text: 'Beim Anbauverfahren gehen immer Kosten verloren.' },
        { text: 'Das Anbauverfahren verteilt mehr Kosten als die anderen Verfahren.' },
      ],
      aufloesung:
        'Die Summe stimmt, die Aufteilung nicht ganz: Den Vorkostenstellen werden keine sekundären Kosten zugerechnet. Je größer die Lieferungen untereinander, desto größer der Fehler.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Das Anbauverfahren Schritt für Schritt',
      schritte: [
        {
          text: 'Leistung an die Hauptkostenstellen',
          rechnung: `Energie: ${formatPlain(L_E)} − ${formatPlain(E_AN_I)} = ${formatPlain(H_E)} kWh; Instandhaltung: ${formatPlain(L_I)} − ${formatPlain(I_AN_E)} = ${formatPlain(H_I)} Std.`,
          warum: 'Die Lieferungen an die jeweils andere Vorkostenstelle fallen heraus.',
        },
        {
          text: 'Verrechnungssätze',
          rechnung: `${formatEuro(P.hilfs[0]!.primaer)} ÷ ${formatPlain(H_E)} kWh = ${q(S.saetze[0]!, 'kWh')}; ${formatEuro(P.hilfs[1]!.primaer)} ÷ ${formatPlain(H_I)} Std. = ${q(S.saetze[1]!, 'Std.')}`,
          warum: 'Nur die eigenen, primären Gemeinkosten – empfangen hat beim Anbau niemand etwas.',
        },
        {
          text: 'Umlage auf die Hauptkostenstellen',
          rechnung: P.haupt
            .map((h, k) => `${h.name}: ${e(S.umlage[0]![k]!)} + ${e(S.umlage[1]![k]!)}`)
            .join('; '),
          warum: 'Umlage = Verrechnungssatz × an die Hauptkostenstelle abgegebene Menge.',
        },
        {
          text: 'Summen und Kontrolle',
          rechnung: `${P.haupt.map((h, k) => `${h.name} ${e(S.summen[k]!)}`).join('; ')}; zusammen ${e(sum(S.summen))}`,
          warum: `Primäre Gemeinkosten der Hauptkostenstelle plus Umlagen. Zusammen genau die primären Gemeinkosten aller Stellen (${e(S.primaerGesamt)}).`,
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat gerechnet',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Verrechnungssatz Energie: ${formatEuro(P.hilfs[0]!.primaer)} ÷ ${formatPlain(H_E)} kWh = ${q(S.saetze[0]!, 'kWh')}`,
        `Verrechnungssatz Instandhaltung: ${formatEuro(P.hilfs[1]!.primaer)} ÷ ${formatPlain(L_I)} Std. = ${q(FALSCH.saetze[1]!, 'Std.')}`,
        `Umlage Energie an die Fertigung: ${formatPlain(P.mengen[0]![3]!)} kWh × ${q(S.saetze[0]!, 'kWh')} = ${e(S.umlage[0]![1]!)}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: `Die ${formatPlain(I_AN_E)} Stunden für die Energie gehören nicht in den Nenner – geteilt wird durch ${formatPlain(H_I)} Std.`,
          richtig: true,
        },
        { text: 'Die Instandhaltung muss zuerst die Energiekosten übernehmen.' },
        { text: 'Der Satz müsste durch die Zahl der Hauptkostenstellen geteilt werden.' },
      ],
      aufloesung: `Richtig: ${formatEuro(P.hilfs[1]!.primaer)} ÷ ${formatPlain(H_I)} Std. = ${q(S.saetze[1]!, 'Std.')}. Mit ${q(FALSCH.saetze[1]!, 'Std.')} blieben die Kosten der Stunden für die Energie unverteilt.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du: ein neuer Monat',
      text: 'Gleiches Muster, neue Zahlen. Ergänze für die Instandhaltung die Leistung an die Hauptkostenstellen und den Verrechnungssatz.',
      skillId: 'I3-anbau',
      seed: L_SEED,
      partId: 'saetze',
      gefragt: ['l-1', 'q-1'],
    },
    {
      typ: 'verstaendnis',
      frage: `Wie hoch sind die Gemeinkosten aller Hauptkostenstellen zusammen nach dem Anbauverfahren?`,
      optionen: [
        {
          text: `${e(S.primaerGesamt)} – alle primären Gemeinkosten`,
          richtig: true,
          erklaerung:
            'Es wird nur umverteilt. Das ist die Kontrolle für jede Leistungsverrechnung.',
        },
        {
          text: `${e(sum(P.haupt.map((h) => h.primaer)))} – nur die der Hauptkostenstellen`,
          erklaerung: 'Dann wären die Kosten von Energie und Werkstatt verschwunden.',
        },
        {
          text: `${e(sum(FALSCH.summen))} – etwas weniger, weil die Lieferungen untereinander fehlen`,
          erklaerung:
            'Das passiert nur, wenn man durch die Gesamtleistung teilt. Richtig gerechnet geht nichts verloren.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'I3-m1',
      frage: 'Wie funktioniert das Anbauverfahren?',
      text: 'Verrechnungssatz = primäre Gemeinkosten der Vorkostenstelle ÷ an die Hauptkostenstellen abgegebene Leistung. Lieferungen zwischen Vorkostenstellen werden ignoriert. Schnell, aber nur exakt, wenn es solche Lieferungen nicht gibt.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe: `Vorkostenstelle Energie: primäre Gemeinkosten ${formatEuro(K.hilfs[0]!.primaer)}, Leistung ${formatPlain(gesamtleistungAnbau(K, 0))} kWh, davon ${formatPlain(K.mengen[0]![1]!)} kWh an die Instandhaltung. Vorkostenstelle Instandhaltung: primäre Gemeinkosten ${formatEuro(K.hilfs[1]!.primaer)}, Leistung ${formatPlain(gesamtleistungAnbau(K, 1))} Std., davon ${formatPlain(K.mengen[1]![0]!)} Std. an die Energie. Ermitteln Sie die Verrechnungssätze nach dem Anbauverfahren.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: `Die Werkstatt verbraucht ${formatPlain(E_AN_I)} kWh und trägt keinen Cent davon. Das geht doch genauer, oder?`,
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was wird beim Anbauverfahren nicht verrechnet?',
      optionen: [
        { text: 'Leistungen zwischen den Vorkostenstellen', richtig: true },
        { text: 'Leistungen an die Hauptkostenstellen' },
        { text: 'Die primären Gemeinkosten der Vorkostenstellen' },
      ],
    },
    {
      frage:
        'Energie: 6.000 € primäre Gemeinkosten, 5.000 kWh Leistung, davon 1.000 kWh an die Werkstatt. Verrechnungssatz nach dem Anbauverfahren?',
      optionen: [
        { text: '1,50 €/kWh', richtig: true },
        { text: '1,20 €/kWh' },
        { text: '6,00 €/kWh' },
      ],
    },
    {
      frage: 'Wann liefert das Anbauverfahren exakte Ergebnisse?',
      optionen: [
        {
          text: 'Wenn sich die Vorkostenstellen gegenseitig keine Leistungen liefern',
          richtig: true,
        },
        { text: 'Immer' },
        { text: 'Wenn es mehr als zwei Hauptkostenstellen gibt' },
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
      'K2 Kap. 1.4.2.1 (Anbau- und Stufenleiterverfahren mit nicht exakten Verrechnungspreisen, nur Simultanverfahren exakt), 1.4.2.2 (Blockumlageverfahren; nur Leistungen von Vor- an Endkostenstellen; q = primäre Gemeinkosten ÷ an die Hauptkostenstellen abgegebene Leistungen; kritische Würdigung: Vorkostenstellen ohne sekundäre Kosten, exakt nur ohne Leistungsbeziehungen gleicher Kategorie) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
