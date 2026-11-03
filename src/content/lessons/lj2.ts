// Lektion J2 – Divisionskalkulation (eigene Formulierung; geprüft gegen K2 Kap. 2.2.2, S. 53–58).
// Alle Beträge werden von der Engine berechnet.
import { division, solveDivision, type DivisionParams } from '../../engine/generators/j/division';
import { dec, formatEuro, formatPlain } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const BEISPIEL: DivisionParams = {
  variante: 'zweistufig',
  monat: 'Juni',
  produkt: 'Paderquell Energy 0,5 l',
  einheit: 'Kartons',
  produziert: 20_000,
  abgesetzt: 16_000,
  herstellkosten: '90000',
  vvKosten: '24000',
};
const S = solveDivision(BEISPIEL).werte;
const P = BEISPIEL.produziert!;
const A = BEISPIEL.abgesetzt!;
const GESAMT = dec(BEISPIEL.herstellkosten!).plus(BEISPIEL.vvKosten!);
const EINSTUFIG = GESAMT.div(P);
const JE_ABSATZ = GESAMT.div(A);

// Mehrstufig: Sirupansatz → Ausmischen → Abfüllung (hl)
const MEHR: DivisionParams = {
  variante: 'mehrstufig',
  monat: 'Juli',
  produkt: 'Senne Lemon',
  einheit: 'hl',
  stufen: [
    { name: 'Sirupansatz', kosten: '36000', menge: 4_000 },
    { name: 'Ausmischen', kosten: '22800', menge: 3_800 },
    { name: 'Abfüllung', kosten: '15400', menge: 4_400 },
  ],
  vvKosten: '12600',
  abgesetzt: 4_200,
};
const M = solveDivision(MEHR).werte;
const M_FALSCH_KUM = solveDivision(MEHR, { nichtKumuliert: true }).werte;
const M_FALSCH_SUMME = dec(MEHR.stufen![0]!.kosten).plus(MEHR.stufen![1]!.kosten).div(3_800);

// Klausurbrücke (eigene Zahlen)
const K: DivisionParams = {
  variante: 'zweistufig',
  monat: 'August',
  produkt: 'Paderquell Energy 0,33 l',
  einheit: 'Kartons',
  produziert: 25_000,
  lagerAnfang: 2_000,
  lagerEnde: 5_000,
  abgesetzt: 22_000,
  gesamtkosten: '168000',
  vvKosten: '33000',
};
const K_TEIL = division.parts(K, solveDivision(K)).find((p) => p.id === 'division') as TaskPart;

export const lektionJ2: Lektion = {
  id: 'J2',
  skillId: 'J2-division',
  abschnitt: 'J',
  titel: 'Divisionskalkulation: Durch welche Menge teilen?',
  kernAha:
    'Bei einem einheitlichen Produkt teilt man Kosten durch Menge. Fallen Produktion und Absatz auseinander, wird getrennt: Herstellkosten durch die produzierte Menge, Verwaltungs- und Vertriebskosten durch die abgesetzte Menge.',
  dauerMin: 7,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'abfuellung',
  quelle: 'K2 2.2.2 (S. 53–58); 04-fachregeln.md',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Eine Linie, ein Produkt, eine Division. Was soll da schiefgehen?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Linie 3 hat im Juni nur ${BEISPIEL.produkt} abgefüllt: ${formatPlain(P)} Kartons, Kosten insgesamt ${formatEuro(GESAMT)}.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Also kostet ein Karton ${formatEuro(EINSTUFIG)}. Rechnen kann ich auch!`,
        },
      ],
      frage: `Verkauft wurden aber nur ${formatPlain(A)} Kartons, der Rest steht im Logistikzentrum. Stimmt Tobias' Preis trotzdem?`,
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wer für ein Fest 40 Brötchen backt, teilt Mehl und Strom durch 40. Die Fahrt zum Ausliefern zahlt man aber nur für die Brötchen, die wirklich weggehen.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Das ist die Divisionskalkulation: Kosten geteilt durch Menge. Die spannende Frage ist nur, durch welche Menge.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Angenommen, alle ${formatPlain(P)} Kartons wären im Juni auch verkauft worden. Was kostet dann ein Karton?`,
      optionen: [
        { text: formatEuro(EINSTUFIG), richtig: true },
        { text: formatEuro(JE_ABSATZ) },
        { text: formatEuro(S.get('khs')) },
      ],
      aufloesung: `${formatEuro(GESAMT)} ÷ ${formatPlain(P)} = ${formatEuro(EINSTUFIG)}. Bei einem einzigen Produkt ohne Lagerveränderung reicht eine Division: die einstufige Divisionskalkulation.`,
    },
    {
      typ: 'konzept',
      titel: 'Einstufig: eine Division',
      text: 'Selbstkosten je Stück = Gesamtkosten der Periode ÷ Menge. Das klappt nur, wenn ein einheitliches Produkt hergestellt wird und alles Produzierte im selben Zeitraum verkauft wird.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Ein Produkt', text: 'Alle Kartons sind gleich.', farbe: '#1c6670' },
          {
            titel: 'Kein Lageraufbau',
            text: 'Produktion = Absatz.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Formel',
            text: 'Gesamtkosten ÷ Menge = Selbstkosten je Stück',
            farbe: '#e2b13c',
          },
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: `Im Juni gingen nur ${formatPlain(A)} von ${formatPlain(P)} Kartons raus. Wie rechnet man jetzt?`,
      a: {
        figur: 'tobias',
        ausdruck: 'erklaert',
        text: `Dann teile ich alle Kosten durch die ${formatPlain(A)} verkauften Kartons.`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Die Herstellkosten gehören zu allen ${formatPlain(P)} Kartons. Nur Verwaltung und Vertrieb gehören zu den ${formatPlain(A)} verkauften.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Hergestellt wurde für die ganze Produktion; Verwaltungs- und Vertriebskosten fallen erst mit dem Absatz an.',
          richtig: true,
        },
        { text: 'Kosten werden immer auf die verkaufte Menge verteilt.' },
        { text: 'Lagerbestände dürfen in der Kalkulation keine Kosten tragen.' },
      ],
      aufloesung: `Tobias käme auf ${formatEuro(JE_ABSATZ, 3)} je Karton. Dann trügen die verkauften Kartons auch die Herstellung der Lagerware mit – die Selbstkosten wären zu hoch.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Zweistufige Divisionskalkulation',
      text: `Herstellkosten ${formatEuro(BEISPIEL.herstellkosten!)}, Verwaltungs- und Vertriebskosten ${formatEuro(BEISPIEL.vvKosten!)}.`,
      schritte: [
        {
          text: 'Herstellkosten je Karton',
          rechnung: `${formatEuro(BEISPIEL.herstellkosten!)} ÷ ${formatPlain(P)} = ${formatEuro(S.get('khs'))}`,
          warum: 'Hergestellt wurden alle Kartons, auch die im Lager.',
        },
        {
          text: 'Verwaltungs- und Vertriebskosten je Karton',
          rechnung: `${formatEuro(BEISPIEL.vvKosten!)} ÷ ${formatPlain(A)} = ${formatEuro(S.get('vvs'))}`,
          warum: 'Diese Kosten entstehen erst, wenn verkauft wird.',
        },
        {
          text: 'Selbstkosten je Karton',
          rechnung: `${formatEuro(S.get('khs'))} + ${formatEuro(S.get('vvs'))} = ${formatEuro(S.get('ks'))}`,
          warum: 'Beide Stufen zusammen ergeben die Selbstkosten.',
        },
        {
          text: 'Lagerbestand bewerten',
          rechnung: `${formatPlain(P - A)} Kartons × ${formatEuro(S.get('khs'))} = ${formatEuro(S.get('bv'))}`,
          warum: 'Im Lager stecken nur Herstellkosten, Vertrieb kommt erst beim Verkauf dazu.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Durch welche Menge teilen?',
      text: 'Ordne die Kosten der Linie 3 zu.',
      kategorien: ['Produzierte Menge', 'Abgesetzte Menge'],
      elemente: [
        {
          text: 'Sirup, Aromen und Dosen',
          kategorie: 'Produzierte Menge',
          erklaerung: 'Material steckt in jedem hergestellten Karton.',
        },
        {
          text: 'Löhne an der Abfüllanlage',
          kategorie: 'Produzierte Menge',
          erklaerung: 'Fertigung gehört zu den Herstellkosten.',
        },
        {
          text: 'Provision für den Außendienst',
          kategorie: 'Abgesetzte Menge',
          erklaerung: 'Vertriebskosten fallen mit dem Verkauf an.',
        },
        {
          text: 'Ausgangsfracht zum Großhändler',
          kategorie: 'Abgesetzte Menge',
          erklaerung: 'Nur verkaufte Ware wird ausgeliefert.',
        },
        {
          text: 'Gehälter der Verwaltung',
          kategorie: 'Abgesetzte Menge',
          erklaerung:
            'Verwaltungs- und Vertriebskosten werden zusammen auf die abgesetzte Menge verteilt.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein neuer Monat auf Linie 3. Ergänze Herstellkosten je Karton, Verwaltungs- und Vertriebskosten je Karton und die Selbstkosten.',
      skillId: 'J2-division',
      seed: 4,
      variant: 'zweistufig',
      partId: 'division',
      gefragt: ['khs', 'vvs', 'ks'],
    },
    {
      typ: 'konzept',
      titel: 'Mehrstufig: Stufe für Stufe',
      text: 'Bleibt Sirup zwischen zwei Stufen im Tank, braucht jede Stufe eigene Stückkosten: Kosten der Stufe ÷ Menge der Stufe plus Stückkosten der Vorstufe. Damit werden die Zwischenlager bewertet.',
      visual: {
        typ: 'lager',
        titel: `${MEHR.produkt} im Juli (hl)`,
        tanks: MEHR.stufen!.map((s, j) => ({
          name: `${s.name}: ${formatEuro(M.get(`kh-${j}`))}/hl`,
          fuellung: 0.3 + 0.2 * j,
          farbe: ['#e2b13c', '#8cbf3f', '#1c6670'][j]!,
        })),
      },
    },
    {
      typ: 'verstaendnis',
      frage: `Der Sirupansatz kostet ${formatEuro(M.get('kh-0'))} je hl. Das Ausmischen kostet ${formatEuro(MEHR.stufen![1]!.kosten)} für ${formatPlain(MEHR.stufen![1]!.menge)} hl. Wie hoch sind die Stückherstellkosten nach dem Ausmischen?`,
      optionen: [
        {
          text: formatEuro(M.get('kh-1')),
          richtig: true,
          erklaerung: `${formatEuro(M.get('kh-0'))} aus der Vorstufe + ${formatEuro(M_FALSCH_KUM.get('kh-1'))} aus dieser Stufe.`,
        },
        {
          text: formatEuro(M_FALSCH_KUM.get('kh-1')),
          erklaerung: 'Das ist nur der Kostensatz dieser Stufe. Der Sirup aus der Vorstufe fehlt.',
        },
        {
          text: formatEuro(M_FALSCH_SUMME),
          erklaerung:
            'Die Kosten des Sirupansatzes gehören zu seiner eigenen Menge, nicht zur Menge der nächsten Stufe.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'J2-m1',
      frage: 'Wie rechnet man die zweistufige Divisionskalkulation?',
      text: 'Selbstkosten je Stück = Herstellkosten ÷ produzierte Menge + Verwaltungs- und Vertriebskosten ÷ abgesetzte Menge. Lagerbestände werden zu Herstellkosten bewertet.',
    },
    {
      typ: 'klausur',
      punkte: 6,
      aufgabe: `Die MBG füllt auf einer Linie ausschließlich ${K.produkt} ab. Im ${K.monat} wurden ${formatPlain(K.produziert!)} Kartons produziert. Lagerbestand am Monatsanfang ${formatPlain(K.lagerAnfang!)} Kartons, am Monatsende ${formatPlain(K.lagerEnde!)} Kartons. Die Gesamtkosten betragen ${formatEuro(K.gesamtkosten!)}, davon ${formatEuro(K.vvKosten!)} Verwaltungs- und Vertriebskosten. Ermitteln Sie mit der zweistufigen Divisionskalkulation die Selbstkosten je Karton und bewerten Sie die Bestandsveränderung.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'gruebelt',
        text: 'Ab nächstem Monat füllt Linie 3 drei Dosengrößen ab. Teilen wir dann wieder einfach durch alle Kartons?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Produziert 10.000 Kartons, verkauft 8.000. Herstellkosten 50.000 €, Verwaltung und Vertrieb 12.000 €. Selbstkosten je Karton?',
      optionen: [{ text: '6,50 €', richtig: true }, { text: '6,20 €' }, { text: '7,75 €' }],
    },
    {
      frage: 'Wann reicht die einstufige Divisionskalkulation?',
      optionen: [
        {
          text: 'Ein einheitliches Produkt und keine Veränderung der Lagerbestände',
          richtig: true,
        },
        { text: 'Mehrere ähnliche Sorten mit unterschiedlichen Kosten' },
        { text: 'Immer, wenn die Verwaltungskosten bekannt sind' },
      ],
    },
    {
      frage: 'Womit werden Zwischenlager in der mehrstufigen Divisionskalkulation bewertet?',
      optionen: [
        { text: 'Mit den Stückherstellkosten der jeweiligen Stufe', richtig: true },
        { text: 'Mit den Selbstkosten des Endprodukts' },
        { text: 'Mit dem Verkaufspreis' },
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
      'K2 Kap. 2.2.2 (S. 53–58: einstufige Division nur ohne Lagerveränderung; zweistufig HK ÷ Produktion + VV ÷ Absatz; mehrstufig Stückherstellkosten je Stufe kumuliert, Lagerbewertung zu Herstellkosten der Stufe) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
