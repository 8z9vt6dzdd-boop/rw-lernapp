// Lektion I5 – Simultanverfahren (eigene Formulierung; geprüft gegen K2 Kap. 1.4.2.4, S. 36–37).
// Alle Beträge werden von der Engine berechnet (Gleichungssystem exakt mit Brüchen).
import {
  gesamtLeistung,
  simultan,
  solveSimultan,
  solveStufenleiter,
  type LvParams,
} from '../../engine/generators/leistungsverrechnung';
import { Decimal, formatEuro, formatNumber, formatPlain, type Val } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());
const n = (d: InstanceType<typeof Decimal>) => formatPlain(d);

// Beispiel der Lektion (eigene Zahlen, Lösung glatt)
const P: LvParams = {
  hilfs: [
    { name: 'Energie', primaer: '28000', einheit: 'kWh' },
    { name: 'Instandhaltung', primaer: '17000', einheit: 'Std.' },
  ],
  haupt: [
    { name: 'Material', primaer: '30000' },
    { name: 'Fertigung', primaer: '40000' },
  ],
  mengen: [
    [0, 1000, 4000, 5000],
    [40, 0, 160, 200],
  ],
};
const S = solveSimultan(P);
const STUFE = solveStufenleiter(P);
const L_E = gesamtLeistung(P, 0);
const L_I = gesamtLeistung(P, 1);
const E_AN_I = P.mengen[0]![1]!;
const I_AN_E = P.mengen[1]![0]!;
// Zwischenschritte des Einsetzungsverfahrens
const A = new Decimal(P.hilfs[0]!.primaer).div(L_E); // q_E = A + B · q_I
const B = new Decimal(I_AN_E).div(L_E);
const C = new Decimal(P.hilfs[1]!.primaer).plus(A.times(E_AN_I)); // (L_I − B·E_AN_I) · q_I = C
const D = new Decimal(L_I).minus(B.times(E_AN_I));

// Klausurbrücke (eigene Zahlen)
const K: LvParams = {
  hilfs: [
    { name: 'Energie', primaer: '18800', einheit: 'kWh' },
    { name: 'Instandhaltung', primaer: '10000', einheit: 'Std.' },
  ],
  haupt: [
    { name: 'Material', primaer: '25000' },
    { name: 'Fertigung', primaer: '30000' },
  ],
  mengen: [
    [0, 500, 2000, 2500],
    [20, 0, 80, 100],
  ],
};
const K_TEIL = simultan.parts(K, solveSimultan(K)).find((p) => p.id === 'saetze') as TaskPart;

export const lektionI5: Lektion = {
  id: 'I5',
  skillId: 'I5-simultan',
  abschnitt: 'I',
  titel: 'Simultanverfahren: Wer schuldet wem?',
  kernAha:
    'Das Simultanverfahren berücksichtigt alle gegenseitigen Leistungen: Für jede Vorkostenstelle gilt eine Gleichung, und das System liefert alle Verrechnungssätze gleichzeitig.',
  dauerMin: 8,
  figuren: ['jana', 'leni', 'tobias'],
  ort: 'besprechung',
  quelle: 'K2 1.4.2.4 (S. 36–37); 04-fachregeln.md (GC-17)',
  teaser: {
    figur: 'jana',
    ausdruck: 'gruebelt',
    text: 'Beim Stufenleiterverfahren haben wir die Werkstattstunden für die Energie ignoriert. Geht das genauer?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: `Die Werkstatt hat ${formatPlain(I_AN_E)} Stunden für die Energie gearbeitet. Beim Stufenleiterverfahren fiel das einfach unter den Tisch.`,
        },
        { figur: 'leni', ausdruck: 'gruebelt', text: 'Ignorieren ist bequem. Aber ist es fair?' },
      ],
      frage: 'Wie verrechnet man Leistungen, die in beide Richtungen fließen?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Zwei Nachbarn helfen sich: Der eine repariert das Fahrrad, der andere mäht den Rasen. Was jeder dem anderen schuldet, hängt vom Wert beider Leistungen ab.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Und den Wert kennt man erst, wenn man beide gleichzeitig ausrechnet. Daher der Name: simultan.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Lohnt sich der Aufwand?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Simultan ist doch übertrieben. Das Stufenleiterverfahren reicht völlig.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Das Stufenleiterverfahren ist eine Näherung. Das Simultanverfahren rechnet exakt, weil es alle Leistungen in beide Richtungen verrechnet.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Nur das Simultanverfahren berücksichtigt auch die Leistungen an bereits abgerechnete Stellen.',
          richtig: true,
        },
        { text: 'Das Simultanverfahren verteilt insgesamt mehr Kosten.' },
        { text: 'Beim Stufenleiterverfahren gehen Kosten verloren.' },
      ],
      aufloesung: `Beide Verfahren verteilen dieselbe Summe – es geht nur um die Aufteilung. Im Beispiel kostet die Werkstattstunde stufenweise ${formatNumber(STUFE.saetze[1].value)} €, simultan genau ${formatNumber(S.saetze[1]!.value)} €. Ob sich der Mehraufwand lohnt, hängt davon ab, wie groß die Rückflüsse sind.`,
    },
    {
      typ: 'konzept',
      titel: 'Eine Gleichung je Vorkostenstelle',
      text: 'Was eine Stelle insgesamt leistet, ist so viel wert wie ihre Kosten: Gesamtleistung × eigener Verrechnungssatz = primäre Kosten + empfangene Mengen × Verrechnungssatz der liefernden Stelle.',
      visual: {
        typ: 'kostenstellen',
        hilfs: [
          { name: 'Energie', primaer: '28000', einheit: 'kWh' },
          { name: 'Instandhaltung', primaer: '17000', einheit: 'Std.' },
        ],
        haupt: [
          { name: 'Material', primaer: '30000' },
          { name: 'Fertigung', primaer: '40000' },
        ],
        pfeile: [
          { von: 'Energie', an: 'Instandhaltung', menge: '1000' },
          { von: 'Instandhaltung', an: 'Energie', menge: '40' },
          { von: 'Energie', an: 'Material', menge: '4000' },
          { von: 'Energie', an: 'Fertigung', menge: '5000' },
          { von: 'Instandhaltung', an: 'Material', menge: '160' },
          { von: 'Instandhaltung', an: 'Fertigung', menge: '200' },
        ],
      },
    },
    {
      typ: 'verstaendnis',
      frage: 'Welche Gleichung gilt für die Energie? (q_E und q_I sind die Verrechnungssätze)',
      optionen: [
        {
          text: `${formatPlain(L_E)} q_E = ${formatPlain(P.hilfs[0]!.primaer)} + ${formatPlain(I_AN_E)} q_I`,
          richtig: true,
          erklaerung: `Die Energie empfängt ${formatPlain(I_AN_E)} Werkstattstunden. Deren Wert kommt zu ihren primären Kosten dazu.`,
        },
        {
          text: `${formatPlain(L_E)} q_E = ${formatPlain(P.hilfs[0]!.primaer)} + ${formatPlain(E_AN_I)} q_I`,
          erklaerung: `${formatPlain(E_AN_I)} kWh liefert die Energie an die Werkstatt – das ist ihre Abgabe, nicht ihr Empfang.`,
        },
        {
          text: `${formatPlain(L_E)} q_E = ${formatPlain(P.hilfs[0]!.primaer)}`,
          erklaerung:
            'So wären die Werkstattstunden für die Energie wieder unter den Tisch gefallen.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Das Gleichungssystem lösen',
      text: `(I) ${formatPlain(L_E)} q_E = ${formatPlain(P.hilfs[0]!.primaer)} + ${formatPlain(I_AN_E)} q_I   (II) ${formatPlain(L_I)} q_I = ${formatPlain(P.hilfs[1]!.primaer)} + ${formatPlain(E_AN_I)} q_E`,
      schritte: [
        {
          text: 'Gleichung I nach q_E auflösen',
          rechnung: `q_E = ${n(A)} + ${n(B)} q_I`,
          warum: `Beide Seiten durch ${formatPlain(L_E)} teilen.`,
        },
        {
          text: 'In Gleichung II einsetzen',
          rechnung: `${formatPlain(L_I)} q_I = ${formatPlain(P.hilfs[1]!.primaer)} + ${formatPlain(E_AN_I)} · (${n(A)} + ${n(B)} q_I) = ${n(C)} + ${n(B.times(E_AN_I))} q_I`,
          warum: 'So bleibt nur noch eine Unbekannte übrig.',
        },
        {
          text: 'q_I ausrechnen',
          rechnung: `${n(D)} q_I = ${n(C)} → q_I = ${formatNumber(S.saetze[1]!.value)} €/Std.`,
          warum: 'Alle q_I-Glieder auf eine Seite bringen und teilen.',
        },
        {
          text: 'q_E ausrechnen',
          rechnung: `q_E = ${n(A)} + ${n(B)} · ${formatNumber(S.saetze[1]!.value)} = ${formatNumber(S.saetze[0]!.value)} €/kWh`,
          warum: 'Den gefundenen Wert in die aufgelöste Gleichung I einsetzen.',
        },
        {
          text: 'Verteilen und kontrollieren',
          rechnung: `Material ${e(S.summen[0]!)}, Fertigung ${e(S.summen[1]!)}; zusammen ${e(S.summen[0]!.plus(S.summen[1]!))}`,
          warum:
            'Umlage = Verrechnungssatz × an die Hauptkostenstelle abgegebene Menge. Die Summe entspricht allen primären Gemeinkosten.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat die Gleichungen aufgestellt',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Energie: ${formatPlain(L_E)} q_E = ${formatPlain(P.hilfs[0]!.primaer)} + ${formatPlain(I_AN_E)} q_I`,
        `Instandhaltung: ${formatPlain(L_I)} q_I = ${formatPlain(P.hilfs[1]!.primaer)} + ${formatPlain(I_AN_E)} q_E`,
        `Kontrolle: Summe der Hauptkostenstellen = ${formatEuro(S.primaerGesamt.value.toString())}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: `Die Instandhaltung empfängt ${formatPlain(E_AN_I)} kWh von der Energie, nicht ${formatPlain(I_AN_E)}.`,
          richtig: true,
        },
        { text: 'Die Instandhaltung darf keine Energiekosten tragen.' },
        { text: 'Die Kontrollsumme muss kleiner sein als die primären Kosten.' },
      ],
      aufloesung:
        'In die Gleichung einer Stelle gehören die Mengen, die sie empfängt. Der Kollege hat Liefer- und Empfangsrichtung verwechselt.',
    },
    {
      typ: 'sortieren',
      titel: 'Stufenleiter oder simultan?',
      kategorien: ['Stufenleiterverfahren', 'Simultanverfahren'],
      elemente: [
        {
          text: 'Leistungen an bereits abgerechnete Stellen bleiben unberücksichtigt',
          kategorie: 'Stufenleiterverfahren',
        },
        { text: 'Alle gegenseitigen Leistungen werden verrechnet', kategorie: 'Simultanverfahren' },
        {
          text: 'Die Reihenfolge der Vorkostenstellen ist wichtig',
          kategorie: 'Stufenleiterverfahren',
        },
        { text: 'Es wird ein Gleichungssystem gelöst', kategorie: 'Simultanverfahren' },
        { text: 'Liefert exakte Verrechnungssätze', kategorie: 'Simultanverfahren' },
      ],
    },
    {
      typ: 'merksatz',
      id: 'I5-m1',
      frage: 'Wie stellt man beim Simultanverfahren die Gleichungen auf?',
      text: 'Je Vorkostenstelle eine Gleichung: Gesamtleistung × eigener Satz = primäre Kosten + empfangene Mengen × Satz der liefernden Stelle. Das System gleichzeitig lösen, dann auf die Hauptkostenstellen verteilen.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Vorkostenstelle Energie: primäre Gemeinkosten ${formatEuro(K.hilfs[0]!.primaer)}, Leistung ${formatPlain(gesamtLeistung(K, 0))} kWh, davon ${formatPlain(K.mengen[0]![1]!)} kWh an die Instandhaltung. Vorkostenstelle Instandhaltung: primäre Gemeinkosten ${formatEuro(K.hilfs[1]!.primaer)}, Leistung ${formatPlain(gesamtLeistung(K, 1))} Std., davon ${formatPlain(K.mengen[1]![0]!)} Std. an die Energie. Ermitteln Sie die Verrechnungssätze nach dem Simultanverfahren.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'freut',
        text: 'Jetzt kennen wir die Gemeinkosten jeder Hauptkostenstelle. Aber wie kommen sie in den Preis eines einzelnen Auftrags?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was berücksichtigt das Simultanverfahren, das Stufenleiterverfahren aber nicht?',
      optionen: [
        { text: 'Leistungen an bereits abgerechnete Vorkostenstellen', richtig: true },
        { text: 'Die primären Gemeinkosten' },
        { text: 'Die Hauptkostenstellen' },
      ],
    },
    {
      frage:
        'Energie leistet 5.000 kWh, hat 10.000 € primäre Kosten und empfängt 50 Werkstattstunden. Welche Gleichung stimmt?',
      optionen: [
        { text: '5.000 q_E = 10.000 + 50 q_I', richtig: true },
        { text: '5.000 q_E = 10.000 − 50 q_I' },
        { text: '50 q_E = 10.000 + 5.000 q_I' },
      ],
    },
    {
      frage: 'Wie groß ist die Summe der Hauptkostenstellen nach dem Simultanverfahren?',
      optionen: [
        { text: 'Genau so groß wie alle primären Gemeinkosten', richtig: true },
        { text: 'Größer als beim Stufenleiterverfahren' },
        { text: 'Kleiner als alle primären Gemeinkosten' },
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
      'K2 Kap. 1.4.2.4 (S. 36–37: je Kostenstelle eine Gleichung, abgegebene Leistungen = primäre Kosten + bewertete empfangene Leistungen, exakte Verrechnungssätze) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
