// Lektion H6 – Kalkulatorische Wagnisse, Unternehmerlohn und Miete (eigene Formulierung; geprüft gegen
// K1 Kap. 2.4.3, S. 83–84, Kap. 2.3, S. 68, und Kap. 1 zu Zusatzkosten). Beträge von der Engine (GC-H6).
import { solveWagnis, type WagnisParams } from '../../engine/generators/h/wagnisse';
import { Val, formatEuro, formatPlain, formatProzent } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value);

const W: WagnisParams = {
  variante: 'bestaende',
  basisJahre: ['240000', '260000', '300000', '200000'],
  schaeden: '15000',
  basisAktuell: '280000',
};
const S = solveWagnis(W);
const FALSCH = solveWagnis(W, { ungewichtet: true });
const satz = (v: Val) => formatProzent(v.valueDp(4));

const Z: WagnisParams = {
  variante: 'zusatzkosten',
  gehaelter: ['8000', '7000'],
  flaeche: 600,
  mieteQm: '5.5',
};
const ZS = solveWagnis(Z);

export const lektionH6: Lektion = {
  id: 'H6',
  skillId: 'H6-wagnisse',
  abschnitt: 'H',
  titel: 'Wagnisse: Schäden glätten, bevor sie passieren',
  kernAha:
    'Einzelne Schäden kommen zufällig. Die Kostenrechnung setzt stattdessen einen Erfahrungswert an: Wagnissatz = Schäden der Vergangenheit ÷ Bezugsbasis desselben Zeitraums. Wagniskosten sind Anderskosten; Unternehmerlohn und Miete für eigene Räume der Gesellschafter sind Zusatzkosten.',
  dauerMin: 8,
  figuren: ['jana', 'leni', 'tobias', 'sabine'],
  ort: 'lager',
  quelle: 'K1 2.4.3 (S. 83–84), 2.3 (S. 68), 1 (Zusatzkosten)',
  teaser: {
    figur: 'jana',
    ausdruck: 'entsetzt',
    text: 'Abgelaufene Paletten, kaputte Dosen, ein Kunde, der nicht zahlt. Wie kommt so etwas in die Kalkulation?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'entsetzt',
          text: 'Im März sind drei Paletten abgelaufen, im Juni gar nichts, im Oktober ein ganzer Container.',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Wenn wir jeden Schaden seinem Monat anlasten, springen die Stückkosten wild hin und her.',
        },
      ],
      frage: 'Wie bringt die MBG zufällige Schäden gleichmäßig in die Kalkulation?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie eine Rücklage fürs Auto: Jeden Monat legst du etwas zurück, weil sicher irgendwann eine Reparatur kommt. Nur wann, weißt du nicht.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genau das sind kalkulatorische Wagnisse: ein Erfahrungswert statt des Zufalls. Die echten Schäden bucht die Finanzbuchhaltung trotzdem.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Welches Wagnis ist das?',
      text: 'Ordne die Schäden bei der MBG der passenden Wagnisart zu.',
      kategorien: ['Beständewagnis', 'Fertigungswagnis', 'Vertriebswagnis', 'Entwicklungswagnis'],
      elemente: [
        {
          text: 'Paletten im Lager überschreiten das Mindesthaltbarkeitsdatum.',
          kategorie: 'Beständewagnis',
          erklaerung: 'Wertverlust der Lagerbestände durch Schwund, Verderb oder Veralten.',
        },
        {
          text: 'Eine Charge wird falsch befüllt und muss vernichtet werden.',
          kategorie: 'Fertigungswagnis',
          erklaerung: 'Ausschuss in der Produktion.',
        },
        {
          text: 'Ein Gastronom geht insolvent, die Rechnung bleibt offen.',
          kategorie: 'Vertriebswagnis',
          erklaerung: 'Forderungsausfälle und Währungsverluste gehören zum Vertriebswagnis.',
        },
        {
          text: 'Eine neue Rezeptur wird nach monatelangen Versuchen verworfen.',
          kategorie: 'Entwicklungswagnis',
          erklaerung: 'Kosten fehlgeschlagener Forschungs- und Entwicklungsarbeiten.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Vom Erfahrungswert zum Kostenansatz',
      text: 'Wagnissatz = Schäden der Vorjahre ÷ Bezugsbasis derselben Jahre (etwa Lagerbestände oder Umsätze). Wagniskosten = Wagnissatz × Bezugsbasis des laufenden Jahres.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Schäden der Vorjahre', text: formatEuro(W.schaeden!), farbe: '#e8792b' },
          { titel: 'Lagerbestände der Vorjahre', text: e(S.summeBasis!), farbe: '#1c6670' },
          { titel: 'Wagnissatz', text: satz(S.satz!), farbe: '#8cbf3f' },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Durchschnittliche Lagerbestände der letzten vier Jahre: ${W.basisJahre!.map((x) => formatEuro(x)).join(', ')}. Schäden in diesen Jahren zusammen ${formatEuro(W.schaeden!)}. Welcher Wagnissatz gilt?`,
      optionen: [
        { text: satz(S.satz!), richtig: true },
        { text: satz(FALSCH.satz!) },
        { text: formatProzent(new Val(W.schaeden!).div(W.basisAktuell!).valueDp(4)) },
      ],
      aufloesung: `${formatEuro(W.schaeden!)} ÷ ${e(S.summeBasis!)} = ${satz(S.satz!)}. Schäden und Bezugsbasis müssen denselben Zeitraum abdecken – also beide über alle vier Jahre summieren. Bei ${formatEuro(W.basisAktuell!)} Lagerbestand im laufenden Jahr ergibt das ${e(S.wagnis!)} Wagniskosten.`,
    },
    {
      typ: 'verstaendnis',
      frage: 'Welches Risiko darf die MBG nicht als kalkulatorisches Wagnis ansetzen?',
      optionen: [
        {
          text: 'Den Brand im Lager, gegen den eine Feuerversicherung abgeschlossen ist',
          richtig: true,
          erklaerung:
            'Versicherte Risiken sind schon über die Versicherungsprämie in den Kosten. Auch das allgemeine Unternehmerrisiko ist kein Wagnis, es wird über den Gewinnzuschlag abgedeckt.',
        },
        {
          text: 'Den Schwund im Aromalager',
          erklaerung: 'Das ist ein typisches Beständewagnis.',
        },
        {
          text: 'Ausfälle von Forderungen gegenüber Gastronomen',
          erklaerung: 'Das ist ein typisches Vertriebswagnis.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Welche Art kalkulatorischer Kosten sind Wagniskosten?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Zusatzkosten! Wagnisse stehen doch gar nicht in der Buchhaltung.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Doch: Die tatsächlichen Schäden buchen wir als Aufwand. Die Kostenrechnung setzt nur einen anderen, geglätteten Betrag an.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Dem Kostenansatz steht in der Finanzbuchhaltung Aufwand in anderer Höhe gegenüber: Anderskosten.',
          richtig: true,
        },
        { text: 'Wagnisse sind neutraler Aufwand und gehören nicht in die Kostenrechnung.' },
        { text: 'Wagniskosten sind immer Einzelkosten eines Produkts.' },
      ],
      aufloesung:
        'Wagniskosten sind Anderskosten und zugleich Gemeinkosten. Der Unterschied zwischen kalkulatorischem Wagnis und tatsächlichem Schaden geht ins neutrale Ergebnis.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Zusatzkosten: Unternehmerlohn und Miete',
      text: `Frank und Sabine Wessel arbeiten voll mit (Vergleichsgehälter ${formatEuro(Z.gehaelter![0]!)} und ${formatEuro(Z.gehaelter![1]!)} im Monat). Die MBG nutzt ihre private Lagerhalle mit ${formatPlain(Z.flaeche!)} m² unentgeltlich, ortsüblich wären ${formatEuro(Z.mieteQm!)} je m² und Monat.`,
      schritte: [
        {
          text: 'Kalkulatorischer Unternehmerlohn',
          rechnung: `(${formatEuro(Z.gehaelter![0]!)} + ${formatEuro(Z.gehaelter![1]!)}) × 12 = ${e(ZS.lohnJahr!)}`,
          warum:
            'Maßstab ist das Gehalt, das für eine vergleichbare Tätigkeit in der Branche gezahlt würde.',
        },
        {
          text: 'Kalkulatorische Miete',
          rechnung: `${formatPlain(Z.flaeche!)} m² × ${formatEuro(Z.mieteQm!)} × 12 = ${e(ZS.mieteJahr!)}`,
          warum: 'Die Gesellschafter könnten die Halle sonst vermieten.',
        },
        {
          text: 'Zusatzkosten pro Jahr',
          rechnung: `${e(ZS.lohnJahr!)} + ${e(ZS.mieteJahr!)} = ${e(ZS.zusatzJahr!)}`,
          warum: 'Kein Aufwand in der Buchhaltung, aber echte Opportunitätskosten.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein anderes Wagnis mit neuen Zahlen: Ergänze den Wagnissatz und die Wagniskosten des laufenden Jahres.',
      skillId: 'H6-wagnisse',
      seed: 2,
      variant: 'gewaehrleistung',
      partId: 'wagnis',
      gefragt: ['satz', 'wagnis'],
    },
    {
      typ: 'verstaendnis',
      frage: 'Warum setzt die MBG als OHG überhaupt einen kalkulatorischen Unternehmerlohn an?',
      figur: {
        figur: 'sabine',
        ausdruck: 'gruebelt',
        text: 'Wir bekommen doch ohnehin den Gewinn.',
      },
      optionen: [
        {
          text: 'Damit die Kosten vollständig und mit denen einer Kapitalgesellschaft vergleichbar sind, deren Geschäftsführer ein Gehalt beziehen.',
          richtig: true,
          erklaerung:
            'Ohne Unternehmerlohn wären die Preise zu niedrig kalkuliert, die Arbeit der Gesellschafter wäre gratis.',
        },
        {
          text: 'Weil das Finanzamt ihn als Betriebsausgabe verlangt.',
          erklaerung:
            'In der Personengesellschaft darf gerade kein Gehalt der Gesellschafter als Aufwand gebucht werden.',
        },
        {
          text: 'Weil er die Zinsen auf das Eigenkapital ersetzt.',
          erklaerung: 'Eigenkapitalzinsen sind eine eigene kalkulatorische Kostenart.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'H6-m1',
      frage:
        'Wie ermittelt man kalkulatorische Wagnisse und wie sind Wagnisse, Unternehmerlohn und kalkulatorische Miete einzuordnen?',
      text: 'Wagnissatz = Schäden der Vorjahre ÷ Bezugsbasis derselben Jahre; × aktuelle Basis. Wagnisse sind Anderskosten (nicht: allgemeines Unternehmerrisiko, versicherte Risiken). Unternehmerlohn und Miete eigener Räume sind Zusatzkosten.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Ermitteln Sie den kalkulatorischen Unternehmerlohn und die kalkulatorische Miete pro Monat und pro Jahr und ordnen Sie diese Kosten ein.',
      part: { skillId: 'H6-wagnisse', seed: 3, variant: 'zusatzkosten', partId: 'zusatz' },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'ueberrascht',
        text: 'Abschreibung, Zinsen, Wagnisse, Unternehmerlohn – alles zusätzliche Kosten. Schrumpft damit nicht unser Gewinn?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Umsätze der letzten drei Jahre zusammen 6 Mio. €, Gewährleistungskosten in dieser Zeit 30.000 €. Wagnissatz?',
      optionen: [{ text: '0,5 %', richtig: true }, { text: '1,5 %' }, { text: '5 %' }],
    },
    {
      frage: 'Wie sind kalkulatorische Wagnisse einzuordnen?',
      optionen: [
        { text: 'Anderskosten', richtig: true },
        { text: 'Zusatzkosten' },
        { text: 'Neutraler Aufwand' },
      ],
    },
    {
      frage: 'Was darf nicht als kalkulatorisches Wagnis angesetzt werden?',
      optionen: [
        { text: 'Das allgemeine Unternehmerrisiko', richtig: true },
        { text: 'Der Verderb von Lagerbeständen' },
        { text: 'Der Ausschuss in der Fertigung' },
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
      'K1 Kap. 2.4.3 (S. 83–84: Wagnisarten, Ausschluss von Unternehmerrisiko und versicherten Risiken, Anderskosten und Gemeinkosten, Erfahrungswerte), Kap. 2.3 (S. 68: Unternehmerlohn als Zusatzkosten), Kap. 1 (kalkulatorische Miete als Zusatzkosten) und Lösungshinweis zu Wagnissen (Differenz ins neutrale Ergebnis) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
