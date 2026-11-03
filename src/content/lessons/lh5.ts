// Lektion H5 – Kalkulatorische Zinsen (eigene Formulierung; geprüft gegen K1 Kap. 2.4.2, S. 80–83,
// und 04-fachregeln.md, Konvention 9). Alle Beträge werden von der Engine berechnet (GC-H5 in docs/m7/h.md).
import { solveZinsen, type ZinsParams } from '../../engine/generators/h/kalk-zinsen';
import { Val, formatEuro, formatProzent } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value);

const ANLAGE: ZinsParams = {
  variante: 'durchschnitt',
  zinssatz: '0.08',
  anlage: 'Abfüllanlage',
  anschaffungswert: '480000',
  restwert: '40000',
  nd: 8,
};
const D = solveZinsen(ANLAGE);
const VOLL = solveZinsen(ANLAGE, { vollerWert: true });
const OHNE_RW = solveZinsen(ANLAGE, { ohneRestwert: true });
const R = solveZinsen({ ...ANLAGE, variante: 'restwert' });

const BN: ZinsParams = {
  variante: 'betriebsnotwendig',
  zinssatz: '0.1',
  positionen: [
    { name: 'Grundstück', wert: '300000', art: 'grund' },
    { name: 'Gebäude', wert: '1200000', art: 'abnutzbar' },
    { name: 'Abfüllanlage', wert: '900000', art: 'abnutzbar' },
    { name: 'Vermietetes Wohnhaus', wert: '250000', art: 'nicht-betrieblich' },
    { name: 'Vorräte', wert: '320000', endwert: '280000', art: 'uv' },
    { name: 'Forderungen', wert: '180000', endwert: '220000', art: 'uv' },
    { name: 'Zahlungsmittel', wert: '50000', art: 'uv' },
    { name: 'Kundenanzahlungen', wert: '60000', art: 'abzug' },
    { name: 'Lieferantenkredite', wert: '90000', art: 'abzug' },
    { name: 'Darlehen der Sparkasse', wert: '500000', art: 'verzinst' },
  ],
};
const B = solveZinsen(BN);
const B_FALSCH = solveZinsen(BN, { darlehenAbzug: true });
const i = formatProzent(ANLAGE.zinssatz);

export const lektionH5: Lektion = {
  id: 'H5',
  skillId: 'H5-kalk-zinsen',
  abschnitt: 'H',
  titel: 'Kalkulatorische Zinsen: Was kostet gebundenes Geld?',
  kernAha:
    'Auch eigenes Geld kostet etwas: Was in Anlagen und Vorräten steckt, könnte anderswo Zinsen bringen. Die Kostenrechnung verzinst deshalb das betriebsnotwendige Kapital (betriebsnotwendiges Vermögen minus zinsloses Abzugskapital) – Anlagen meist mit dem halben Wert, weil die Kapitalbindung über die Nutzung sinkt.',
  dauerMin: 8,
  figuren: ['frank', 'leni', 'jana', 'tobias'],
  ort: 'besprechung',
  quelle: 'K1 2.4.2 (S. 80–83); 04-fachregeln.md (Konvention 9)',
  teaser: {
    figur: 'frank',
    ausdruck: 'neutral',
    text: 'Die Abfüllanlage ist mit eigenem Geld bezahlt. Also kostet das Kapital nichts – oder?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'freut',
          text: `Die Abfüllanlage für ${formatEuro(ANLAGE.anschaffungswert!)} haben wir aus eigener Tasche bezahlt, ganz ohne Kredit. Zinsen fallen also keine an.`,
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Auf einem Festgeldkonto hätte dieses Geld aber Zinsen gebracht.',
        },
      ],
      frage: 'Kostet eigenes Kapital etwas, obwohl niemand Zinsen dafür verlangt?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie beim bar bezahlten Auto: keine Rate an die Bank, aber das Geld im Auto bringt eben auch keine Zinsen mehr.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Die Buchhaltung kennt nur Zinsen, die wirklich gezahlt werden. Die Kostenrechnung setzt für das gesamte gebundene Kapital kalkulatorische Zinsen an.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: 'Wie sind kalkulatorische Zinsen auf das Eigenkapital einzuordnen?',
      optionen: [
        {
          text: 'Zusatzkosten',
          richtig: true,
          erklaerung:
            'Im externen Rechnungswesen dürfen nur Fremdkapitalzinsen als Aufwand gebucht werden. Für Eigenkapital gibt es keinen Aufwand – also Zusatzkosten.',
        },
        {
          text: 'Anderskosten',
          erklaerung:
            'Anderskosten sind es beim Fremdkapital: Dort steht Zinsaufwand gegenüber, nur in anderer Höhe.',
        },
        {
          text: 'Neutraler Aufwand',
          erklaerung: 'Neutraler Aufwand gehört gerade nicht in die Kostenrechnung.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Die Kapitalbindung sinkt',
      text: `Der kalkulatorische Restwert der Anlage sinkt jedes Jahr – und mit ihm das gebundene Kapital, von ${formatEuro(ANLAGE.anschaffungswert!)} bis auf ${formatEuro(ANLAGE.restwert!)}. Im Durchschnitt gebunden: (Anschaffungswert + Restwert) ÷ 2.`,
      visual: {
        typ: 'afa-verlauf',
        basis: ANLAGE.anschaffungswert!,
        restwert: ANLAGE.restwert!,
        nd: ANLAGE.nd!,
        verfahren: ['linear'],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Zinssatz ${i}. Wie hoch sind die kalkulatorischen Zinsen pro Jahr nach der Durchschnittswertverzinsung?`,
      optionen: [
        { text: e(D.zinsenJahr), richtig: true },
        { text: e(VOLL.zinsenJahr) },
        { text: e(OHNE_RW.zinsenJahr) },
      ],
      aufloesung: `(${formatEuro(ANLAGE.anschaffungswert!)} + ${formatEuro(ANLAGE.restwert!)}) ÷ 2 = ${e(D.kapitalbindung!)}; × ${i} = ${e(D.zinsenJahr)} pro Jahr oder ${e(D.zinsenMonat)} pro Monat. Vom vollen Anschaffungswert wären es ${e(VOLL.zinsenJahr)} – zu viel, weil das Kapital nicht die ganze Zeit voll gebunden ist.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die zweite Methode: Restwertverzinsung',
      text: `Gleiche Anlage, linear abgeschrieben, Zinsen jeweils vom kalkulatorischen Restwert zu Beginn des Jahres.`,
      schritte: [
        {
          text: 'Jährliche Abschreibung',
          rechnung: `(${formatEuro(ANLAGE.anschaffungswert!)} − ${formatEuro(ANLAGE.restwert!)}) ÷ ${ANLAGE.nd} = ${e(R.afa!)}`,
          warum: 'Um diesen Betrag sinkt der Restwert jedes Jahr.',
        },
        {
          text: 'Zinsen der ersten drei Jahre',
          rechnung: R.restwerte!.map(
            (r, k) => `Jahr ${k + 1}: ${e(r)} × ${i} = ${e(R.zinsenJahre![k]!)}`,
          ).join('; '),
          warum: 'Die Zinsen sinken mit dem Restwert.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Welche Methode nimmt die MBG für ihre Anlagen?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Restwertverzinsung ist genauer, also nehmen wir die. Dann sind die neuen Anlagen eben anfangs teuer.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Der Durchschnittswert ist viel einfacher zu rechnen. Und er verteilt die Zinsen gleichmäßig über die Nutzungsdauer.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Gleichmäßige Kosten über alle Jahre bei deutlich einfacherer Berechnung.',
          richtig: true,
        },
        { text: 'Die Restwertverzinsung ist gesetzlich verboten.' },
        { text: 'Der Durchschnittswert ergibt über die Nutzungsdauer immer höhere Zinsen.' },
      ],
      aufloesung: `Nach der Restwertmethode zahlen die ersten Jahre mehr (${e(R.zinsenJahre![0]!)} im ersten Jahr), die letzten weniger. Der Durchschnittswert setzt jedes Jahr ${e(D.zinsenJahr)} an.`,
    },
    {
      typ: 'sortieren',
      titel: 'Was wird verzinst?',
      text: 'Ordne die Posten aus der Bilanz der MBG zu.',
      kategorien: ['Betriebsnotwendiges Vermögen', 'Nicht betriebsnotwendig', 'Abzugskapital'],
      elemente: [
        { text: 'Abfüllanlage und Tanks', kategorie: 'Betriebsnotwendiges Vermögen' },
        { text: 'Vorräte an Aromen und Dosen', kategorie: 'Betriebsnotwendiges Vermögen' },
        {
          text: 'An Privatleute vermietetes Wohnhaus',
          kategorie: 'Nicht betriebsnotwendig',
          erklaerung: 'Dient nicht dem Betriebszweck und wird ausgesondert.',
        },
        {
          text: 'Wertpapiere als reine Geldanlage',
          kategorie: 'Nicht betriebsnotwendig',
        },
        {
          text: 'Anzahlungen eines Großhändlers',
          kategorie: 'Abzugskapital',
          erklaerung:
            'Zinslos überlassenes Kapital: Es wird vom betriebsnotwendigen Vermögen abgezogen.',
        },
        {
          text: 'Offene Rechnungen bei Lieferanten (Lieferantenkredit)',
          kategorie: 'Abzugskapital',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Betriebsnotwendiges Kapital',
      text: 'Ein Kollege ermittelt das betriebsnotwendige Kapital. In einer Zeile steckt der Fehler.',
      zeilen: [
        `Betriebsnotwendiges Vermögen ${e(B.bnV!)}`,
        `− Kundenanzahlungen ${formatEuro('60000')}`,
        `− Lieferantenkredite ${formatEuro('90000')}`,
        `− Darlehen der Sparkasse ${formatEuro('500000')}`,
        `= Betriebsnotwendiges Kapital ${e(B_FALSCH.bnK!)}`,
      ],
      fehlerZeile: 3,
      gruende: [
        {
          text: 'Das Darlehen ist verzinst und damit kein Abzugskapital.',
          richtig: true,
        },
        { text: 'Kundenanzahlungen dürfen nicht abgezogen werden.' },
        { text: 'Lieferantenkredite gehören zum betriebsnotwendigen Vermögen.' },
      ],
      aufloesung: `Abzugskapital ist nur zinslos überlassenes Kapital: ${e(B.abzug!)}. Das betriebsnotwendige Kapital beträgt ${e(B.bnK!)}, bei 10 % sind das ${e(B.zinsenJahr)} kalkulatorische Zinsen im Jahr.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein neuer Bilanzauszug: Ergänze das betriebsnotwendige Kapital und die kalkulatorischen Zinsen pro Jahr.',
      skillId: 'H5-kalk-zinsen',
      seed: 4,
      variant: 'betriebsnotwendig',
      partId: 'zinsen',
      gefragt: ['bnk', 'jahr'],
    },
    {
      typ: 'merksatz',
      id: 'H5-m1',
      frage: 'Wie ermittelt man die kalkulatorischen Zinsen?',
      text: 'Betriebsnotwendiges Vermögen (abnutzbares Anlagevermögen zum Durchschnittswert, Umlaufvermögen mit Mittelwerten) minus Abzugskapital (zinslos: Anzahlungen, Lieferantenkredite) = betriebsnotwendiges Kapital; mal kalkulatorischer Zinssatz.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Ermitteln Sie die kalkulatorischen Zinsen der Anlage nach der Durchschnittswertverzinsung pro Jahr und pro Monat.',
      part: { skillId: 'H5-kalk-zinsen', seed: 6, variant: 'durchschnitt', partId: 'zinsen' },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'entsetzt',
        text: 'Im Lager ist schon wieder eine Palette Senne Lemon abgelaufen. Wer trägt eigentlich solche Schäden in der Kalkulation?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Anschaffungswert 200.000 €, Restwert 0 €, Zinssatz 6 %. Kalkulatorische Zinsen pro Jahr (Durchschnittswert)?',
      optionen: [{ text: '6.000 €', richtig: true }, { text: '12.000 €' }, { text: '3.000 €' }],
    },
    {
      frage: 'Was ist Abzugskapital?',
      optionen: [
        {
          text: 'Kapital, das dem Betrieb zinslos zur Verfügung steht, etwa Kundenanzahlungen',
          richtig: true,
        },
        { text: 'Alle Bankdarlehen' },
        { text: 'Das Eigenkapital der Gesellschafter' },
      ],
    },
    {
      frage:
        'Betriebsnotwendiges Vermögen 900.000 €, Abzugskapital 100.000 €, Zinssatz 10 %. Zinsen pro Jahr?',
      optionen: [{ text: '80.000 €', richtig: true }, { text: '90.000 €' }, { text: '100.000 €' }],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'K1 Kap. 2.4.2 (S. 80–83: Eigen- und Fremdkapitalzinsen als Opportunitätskosten, Zusatz- bzw. Anderskosten, betriebsnotwendiges Vermögen, Restwert- und Durchschnittswertmethode, Abzugskapital, Mittelwerte im Umlaufvermögen) und 04-fachregeln.md Konvention 9 abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
