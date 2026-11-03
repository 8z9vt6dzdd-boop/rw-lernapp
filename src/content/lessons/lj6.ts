// Lektion J6 – Kuppelproduktkalkulation (eigene Formulierung; geprüft gegen K2 Kap. 2.2.6, S. 76–81).
// Alle Beträge werden von der Engine berechnet.
import { kuppel, solveKuppel, type KuppelParams } from '../../engine/generators/j/kuppel';
import { formatEuro, formatPlain } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const VERTEILUNG: KuppelParams = {
  variante: 'verteilung',
  monat: 'Mai',
  gesamtkosten: '189200',
  produkte: [
    { name: 'Zitronensaft', einheit: 'hl', menge: 1_000, preis: '150', einzelkosten: '20000' },
    { name: 'Zitronenöl', einheit: 'kg', menge: 400, preis: '50', einzelkosten: '3200' },
    { name: 'Fruchtfasern', einheit: 't', menge: 60, preis: '500', einzelkosten: '6000' },
  ],
};
const V = solveKuppel(VERTEILUNG);
const V_FALSCH = solveKuppel(VERTEILUNG, { einzelkostenNichtAbgezogen: true });
const SAFT = VERTEILUNG.produkte[0];

const RESTWERT: KuppelParams = {
  variante: 'restwert',
  monat: 'Juni',
  gesamtkosten: '412000',
  produkte: [
    { name: 'Almeblick Tequila-Bier', einheit: 'hl', menge: 8_000 },
    { name: 'Biertreber', einheit: 't', menge: 1_200, preis: '40', wvk: '15' },
    { name: 'Überschusshefe', einheit: 'kg', menge: 2_500, preis: '6', wvk: '2' },
  ],
};
const R = solveKuppel(RESTWERT);
const R_OHNE_WVK = solveKuppel(RESTWERT, { wvkNichtAbgezogen: true });
const [BIER, TREBER, HEFE] = RESTWERT.produkte;
const TREBER_BRUTTO = R_OHNE_WVK.nettoerloese![0]!;
const TREBER_WVK = TREBER_BRUTTO.minus(R.nettoerloese![0]!);

// Klausurbrücke (eigene Zahlen)
const K: KuppelParams = {
  variante: 'verteilung',
  monat: 'Juli',
  gesamtkosten: '158800',
  produkte: [
    { name: 'Zitronensaft', einheit: 'hl', menge: 1_200, preis: '125', einzelkosten: '14400' },
    { name: 'Zitronenöl', einheit: 'kg', menge: 500, preis: '36', einzelkosten: '2000' },
    { name: 'Fruchtfasern', einheit: 't', menge: 40, preis: '800', einzelkosten: '2400' },
  ],
};
const K_TEIL = kuppel.parts(K, solveKuppel(K)).find((p) => p.id === 'stueck') as TaskPart;

export const lektionJ6: Lektion = {
  id: 'J6',
  skillId: 'J6-kuppel',
  abschnitt: 'J',
  titel: 'Kuppelkalkulation: Saft, Öl und Fasern aus einer Zitrone',
  kernAha:
    'Kuppelprodukte entstehen zwangsläufig gemeinsam, eine verursachungsgerechte Verteilung gibt es nicht. Ohne klares Hauptprodukt verteilt man nach Marktpreisen (Verteilungsmethode); mit Hauptprodukt zieht man die Nettoerlöse der Nebenprodukte ab und teilt den Rest (Restwertmethode).',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'abfuellung',
  quelle: 'K2 2.2.6 (S. 76–81); 04-fachregeln.md',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Eine Presse, drei Produkte. Wer bezahlt die Presse?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Die neue Zitruspresse liefert für Senne Lemon Saft, Zitronenöl und Fruchtfasern, alles im selben Arbeitsgang. Der Pressvorgang kostet im ${VERTEILUNG.monat} ${formatEuro(V.kuppelkosten!)}.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Drei Produkte, also trägt jedes ein Drittel. Fair ist fair!',
        },
      ],
      frage: 'Wie viel von der Presse hat das Zitronenöl eigentlich verursacht?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Ein Hähnchen gibt es nur mit Brust und Keulen zusammen. Welcher Teil hat das Futter verursacht?',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Das nennt man Kuppelproduktion: Mehrere Produkte entstehen zwangsläufig gemeinsam. Verursachungsgerecht verteilen geht nicht, wir brauchen eine sinnvolle Hilfsregel.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Saft bringt ${formatEuro(V.erloese![0]!)} Erlös, Öl ${formatEuro(V.erloese![1]!)}, Fasern ${formatEuro(V.erloese![2]!)}. Welche Verteilung der Pressenkosten ist am vernünftigsten?`,
      optionen: [
        { text: 'Nach den Erlösen: Wer mehr einbringt, trägt mehr.', richtig: true },
        { text: 'Gleichmäßig, jedes Produkt ein Drittel.' },
        { text: 'Nach dem Gewicht der Produkte.' },
      ],
      aufloesung:
        'Nach dem Tragfähigkeitsprinzip trägt jedes Produkt so viel, wie es am Markt verkraftet. Ein Drittel für das Öl wäre mehr, als es überhaupt einbringt.',
    },
    {
      typ: 'konzept',
      titel: 'Verteilungsmethode',
      text: 'Zuerst die Einzelkosten der Weiterverarbeitung abziehen. Den Rest teilt man durch die Summe der Erlöse: Das ergibt die Kosten je € Erlös. Mal Marktpreis gibt die Stückkosten aus dem Kuppelprozess.',
      visual: {
        typ: 'karten',
        karten: VERTEILUNG.produkte.map((x, i) => ({
          titel: x.name,
          text: `${formatPlain(x.menge)} ${x.einheit} × ${formatEuro(x.preis!)} = ${formatEuro(V.erloese![i]!)} Erlös`,
          farbe: ['#e2b13c', '#8cbf3f', '#1c6670'][i]!,
        })),
      },
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat gerechnet',
      text: `Gesamtkosten ${formatEuro(VERTEILUNG.gesamtkosten)} einschließlich Einzelkosten. Eine Zeile ist falsch.`,
      zeilen: [
        `Summe der Erlöse: ${formatEuro(V.summeErloese!)}`,
        `Kosten je € Erlös: ${formatEuro(VERTEILUNG.gesamtkosten)} ÷ ${formatEuro(V.summeErloese!)} = ${formatPlain(V_FALSCH.kostenJeEuro!.value)}`,
        `Stückkosten Saft aus der Presse: Kosten je € Erlös × ${formatEuro(SAFT!.preis!)}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Die Einzelkosten der Sorten hätten vorher abgezogen werden müssen.',
          richtig: true,
        },
        { text: 'Man teilt durch die Summe der Mengen, nicht der Erlöse.' },
        { text: 'Die Gesamtkosten müssen zuerst durch drei geteilt werden.' },
      ],
      aufloesung: `Verteilt werden nur die Kosten des Pressvorgangs: ${formatEuro(V.kuppelkosten!)} ÷ ${formatEuro(V.summeErloese!)} = ${formatPlain(V.kostenJeEuro!.value)}. Die Einzelkosten kommen je Sorte erst danach dazu.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Verteilungsmethode Schritt für Schritt',
      schritte: [
        {
          text: 'Kosten des Kuppelprozesses',
          rechnung: `${formatEuro(VERTEILUNG.gesamtkosten)} − ${VERTEILUNG.produkte.map((x) => formatEuro(x.einzelkosten!)).join(' − ')} = ${formatEuro(V.kuppelkosten!)}`,
          warum: 'Nur der gemeinsame Pressvorgang wird verteilt.',
        },
        {
          text: 'Kosten je € Erlös',
          rechnung: `${formatEuro(V.kuppelkosten!)} ÷ ${formatEuro(V.summeErloese!)} = ${formatPlain(V.kostenJeEuro!.value)}`,
          warum: 'Die Marktpreise wirken wie Äquivalenzziffern.',
        },
        {
          text: 'Stückkosten aus der Presse',
          rechnung: VERTEILUNG.produkte
            .map(
              (x, i) =>
                `${x.name}: ${formatPlain(V.kostenJeEuro!.value)} × ${formatEuro(x.preis!)} = ${formatEuro(V.stueckKuppel![i]!)}`,
            )
            .join('; '),
          warum: 'Teurere Produkte tragen mehr.',
        },
        {
          text: 'Selbstkosten je Einheit',
          rechnung: VERTEILUNG.produkte
            .map(
              (x, i) =>
                `${x.name}: ${formatEuro(V.stueckKuppel![i]!)} + ${formatEuro(V.stueckEinzel![i]!)} = ${formatEuro(V.stueckSelbst![i]!)}`,
            )
            .join('; '),
          warum: 'Dazu kommen die Einzelkosten je Einheit der Sorte.',
        },
        {
          text: 'Kontrolle',
          rechnung: `${V.selbstSorte!.map((x) => formatEuro(x)).join(' + ')} = ${formatEuro(VERTEILUNG.gesamtkosten)}`,
          warum: 'Alle Sorten zusammen tragen genau die Gesamtkosten.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `In der Brauerei entstehen neben ${BIER!.name} auch ${TREBER!.name} und ${HEFE!.name}. Wie kalkuliert man hier?`,
      a: {
        figur: 'tobias',
        ausdruck: 'erklaert',
        text: 'Wie bei der Zitrone: Wir verteilen alles nach den Erlösen.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Hier ist das Bier eindeutig das Hauptprodukt. Die Nebenprodukte entlasten es nur um ihren Nettoerlös.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Gibt es ein klares Hauptprodukt, nutzt man die Restwertmethode.',
          richtig: true,
        },
        { text: 'Nebenprodukte bleiben in der Kalkulation immer unberücksichtigt.' },
        { text: 'Bei Bier muss man die Äquivalenzziffern nach der Flaschengröße bilden.' },
      ],
      aufloesung:
        'Treber und Hefe sind Nebenprodukte. Ihre Erlöse nach Abzug der Weiterverarbeitung werden von den Kosten abgezogen, den Rest trägt das Bier.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Restwertmethode Schritt für Schritt',
      text: `Kosten des Brauprozesses im ${RESTWERT.monat}: ${formatEuro(RESTWERT.gesamtkosten)} für ${formatPlain(BIER!.menge)} hl Bier.`,
      schritte: [
        ...RESTWERT.produkte.slice(1).map((x, i) => ({
          text: x.name,
          rechnung: `(${formatEuro(x.preis!)} − ${formatEuro(x.wvk!)}) × ${formatPlain(x.menge)} ${x.einheit} = ${formatEuro(R.nettoerloese![i]!)}`,
          warum: 'Erlös abzüglich Weiterverarbeitung, mal Menge.',
        })),
        {
          text: 'Restkosten des Hauptprodukts',
          rechnung: `${formatEuro(RESTWERT.gesamtkosten)} − ${R.nettoerloese!.map((x) => formatEuro(x)).join(' − ')} = ${formatEuro(R.restkosten!)}`,
          warum: 'Die Nebenprodukte entlasten das Bier.',
        },
        {
          text: 'Herstellkosten je hl Bier',
          rechnung: `${formatEuro(R.restkosten!)} ÷ ${formatPlain(BIER!.menge)} hl = ${formatEuro(R.hkHaupt!)}`,
          warum: 'Der Rest wird durch die Menge des Hauptprodukts geteilt.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: `${TREBER!.name}: ${formatPlain(TREBER!.menge)} t, Erlös ${formatEuro(TREBER!.preis!)} je t, Pressen und Abtransport ${formatEuro(TREBER!.wvk!)} je t. Um wie viel entlastet der Treber das Bier?`,
      optionen: [
        {
          text: formatEuro(R.nettoerloese![0]!),
          richtig: true,
          erklaerung: 'Nur der Nettoerlös nach der Weiterverarbeitung entlastet das Hauptprodukt.',
        },
        {
          text: formatEuro(TREBER_BRUTTO),
          erklaerung: 'Das ist der volle Erlös. Die Kosten für Pressen und Abtransport fehlen.',
        },
        {
          text: formatEuro(TREBER_WVK),
          erklaerung: 'Das sind nur die Weiterverarbeitungskosten.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein anderer Brauprozess. Ergänze die Restkosten des Biers und die Herstellkosten je hl.',
      skillId: 'J6-kuppel',
      seed: 2,
      variant: 'restwert',
      partId: 'restwert',
      gefragt: ['rest', 'kh'],
    },
    {
      typ: 'merksatz',
      id: 'J6-m1',
      frage: 'Wann nutzt man die Verteilungsmethode, wann die Restwertmethode?',
      text: 'Kein klares Hauptprodukt: Verteilungsmethode, Kosten des Kuppelprozesses nach Marktpreisen verteilen. Klares Hauptprodukt: Restwertmethode, Kosten minus Nettoerlöse der Nebenprodukte, Rest ÷ Menge des Hauptprodukts.',
    },
    {
      typ: 'klausur',
      punkte: 6,
      aufgabe: `Die Zitruspresse der MBG verursacht im ${K.monat} Gesamtkosten von ${formatEuro(K.gesamtkosten)} einschließlich der Einzelkosten der Weiterverarbeitung. ${K.produkte
        .map(
          (x) =>
            `${x.name}: ${formatPlain(x.menge)} ${x.einheit}, Marktpreis ${formatEuro(x.preis!)}, Einzelkosten ${formatEuro(x.einzelkosten!)}`,
        )
        .join(
          '; ',
        )}. Ermitteln Sie nach der Verteilungsmethode (Marktpreise als Verteilungsbasis) die Stück- und Sortenselbstkosten.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Schön, jetzt kenne ich die Kosten je Liter. Aber hat die MBG im Mai insgesamt etwas verdient?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Kuppelprozess 300.000 €, Nebenprodukt: 1.000 t zu 50 €/t, Weiterverarbeitung 10 €/t. Hauptprodukt 13.000 hl. Herstellkosten je hl nach der Restwertmethode?',
      optionen: [{ text: '20,00 €', richtig: true }, { text: '19,23 €' }, { text: '23,85 €' }],
    },
    {
      frage: 'Wann wendet man die Verteilungsmethode an?',
      optionen: [
        {
          text: 'Wenn sich kein eindeutiges Haupt- und Nebenprodukt unterscheiden lässt',
          richtig: true,
        },
        { text: 'Wenn es genau ein Hauptprodukt gibt' },
        { text: 'Wenn die Produkte nacheinander auf verschiedenen Linien entstehen' },
      ],
    },
    {
      frage: 'Was wird bei der Verteilungsmethode als Äquivalenzziffer genutzt?',
      optionen: [
        { text: 'Die Marktpreise der Produkte', richtig: true },
        { text: 'Die Mengen der Produkte' },
        { text: 'Die Weiterverarbeitungskosten' },
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
      'K2 Kap. 2.2.6 (S. 76–81: keine verursachungsgerechte Zuordnung; Verteilungsmethode nach Tragfähigkeit mit Marktpreisen als Äquivalenzziffern, Einzelkosten vorab abziehen; Restwertmethode mit Hauptprodukt, (Erlös − Weiterverarbeitung) × Menge abziehen, Rest ÷ Menge Hauptprodukt) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
