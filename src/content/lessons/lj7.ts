// Lektion J7 – Gesamtkosten- und Umsatzkostenverfahren (eigene Formulierung; geprüft gegen K2 Kap. 2.3,
// S. 82–89). Alle Beträge werden von der Engine berechnet.
import { gkvUkv, solveGkvUkv, type GkvUkvParams } from '../../engine/generators/j/gkv-ukv';
import { formatEuro, formatPlain, sum } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const BEISPIEL: GkvUkvParams = {
  variante: 'vergleich',
  monat: 'Mai',
  produkte: [
    {
      name: 'Paderquell Energy',
      produziert: 20_000,
      abgesetzt: 18_000,
      preis: '14',
      material: '120000',
      fertigung: '60000',
      vv: '30000',
    },
    {
      name: 'Senne Lemon',
      produziert: 10_000,
      abgesetzt: 11_000,
      preis: '12',
      material: '50000',
      fertigung: '30000',
      vv: '16000',
    },
  ],
};
const S = solveGkvUkv(BEISPIEL);
const [EN, LE] = BEISPIEL.produkte;
const OHNE_BV = solveGkvUkv(BEISPIEL, { ohneBv: true });
const MATERIAL = sum(BEISPIEL.produkte.map((x) => x.material));
const FERTIGUNG = sum(BEISPIEL.produkte.map((x) => x.fertigung));
const VV = sum(BEISPIEL.produkte.map((x) => x.vv));
const UKV_PROD = solveGkvUkv(BEISPIEL, { ukvProduktion: true });
const SK_OHNE_VV = S.skUmsatz[0]!.minus(EN!.vv);
const MEHRUNG = EN!.produziert - EN!.abgesetzt;
const MINDERUNG = LE!.abgesetzt - LE!.produziert;

// Klausurbrücke (eigene Zahlen)
const K: GkvUkvParams = {
  variante: 'ukv',
  monat: 'Juni',
  produkte: [
    {
      name: 'Paderquell Energy',
      produziert: 15_000,
      abgesetzt: 16_000,
      preis: '15',
      material: '75000',
      fertigung: '52500',
      vv: '24000',
    },
    {
      name: 'Senne Lemon',
      produziert: 12_000,
      abgesetzt: 10_000,
      preis: '11',
      material: '48000',
      fertigung: '36000',
      vv: '12000',
    },
  ],
};
const K_TEIL = gkvUkv.parts(K, solveGkvUkv(K)).find((p) => p.id === 'ukv') as TaskPart;

export const lektionJ7: Lektion = {
  id: 'J7',
  skillId: 'J7-gkv-ukv',
  abschnitt: 'J',
  titel: 'Betriebsergebnis: Hat die MBG im Mai verdient?',
  kernAha:
    'Das Betriebsergebnis lässt sich auf zwei Wegen ermitteln. Das Gesamtkostenverfahren zieht alle Kosten der Periode von der Gesamtleistung ab (Umsatz ± Bestandsveränderungen zu Herstellkosten); das Umsatzkostenverfahren zieht nur die Selbstkosten der verkauften Menge vom Umsatz ab. Beide kommen zum gleichen Ergebnis.',
  dauerMin: 8,
  figuren: ['frank', 'jana', 'leni', 'tobias'],
  ort: 'gesellschafter',
  quelle: 'K2 2.3 (S. 82–89); 04-fachregeln.md',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Umsatz minus Kosten, fertig ist das Monatsergebnis. Oder etwa nicht?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'freut',
          text: `Im ${BEISPIEL.monat} hatten wir ${formatEuro(S.umsatzSumme)} Umsatz und ${formatEuro(S.kosten)} Kosten. Also ${formatEuro(OHNE_BV.beGkv)} Gewinn, oder?`,
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: `Wir haben aber ${formatPlain(MEHRUNG)} Kartons ${EN!.name} mehr produziert als verkauft. Und von ${LE!.name} haben wir ${formatPlain(MINDERUNG)} Kartons aus dem Lager geholt.`,
        },
      ],
      frage: 'Gehören die Kosten der Kartons, die noch im Lager stehen, in das Ergebnis des Mai?',
    },
    {
      typ: 'dialog',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wer im Herbst Marmelade für das ganze Jahr kocht, hat jetzt alle Kosten. Die vollen Gläser im Regal sind trotzdem etwas wert.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Die Kostenträgerzeitrechnung ermittelt das Betriebsergebnis eines Monats. Dafür gibt es zwei Verfahren, die zum selben Ergebnis führen.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Lager: ${EN!.name} +${formatPlain(MEHRUNG)} Kartons zu ${formatEuro(S.kh[0]!)}, ${LE!.name} −${formatPlain(MINDERUNG)} Kartons zu ${formatEuro(S.kh[1]!)} Herstellkosten. Was passiert mit Franks ${formatEuro(OHNE_BV.beGkv)}?`,
      optionen: [
        { text: `Das Ergebnis steigt um ${formatEuro(S.bvSumme)}.`, richtig: true },
        { text: `Das Ergebnis sinkt um ${formatEuro(S.bvSumme)}.` },
        { text: 'Das Ergebnis bleibt gleich, Lager zählt nicht.' },
      ],
      aufloesung: `Mehrung ${formatEuro(S.bv[0]!)}, Minderung ${formatEuro(S.bv[1]!)}: zusammen ${formatEuro(S.bvSumme)}. Das Betriebsergebnis ist ${formatEuro(S.beGkv)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Gesamtkostenverfahren',
      text: 'Umsatzerlöse plus Bestandsmehrungen minus Bestandsminderungen ergeben die Gesamtleistung. Davon zieht man alle Kosten des Monats ab, gegliedert nach Kostenarten. Bestände werden zu Herstellkosten bewertet.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Umsatzerlöse', text: formatEuro(S.umsatzSumme), farbe: '#1c6670' },
          {
            titel: 'Bestandsveränderungen',
            text: `${formatEuro(S.bv[0]!)} und ${formatEuro(S.bv[1]!)}`,
            farbe: '#8cbf3f',
          },
          { titel: 'Gesamtleistung', text: formatEuro(S.gesamtleistung), farbe: '#e2b13c' },
          { titel: 'Kosten der Periode', text: `− ${formatEuro(S.kosten)}`, farbe: '#e8792b' },
          { titel: 'Betriebsergebnis', text: formatEuro(S.beGkv), farbe: '#1c6670' },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Betriebsergebniskonto (GKV)',
      text: 'Tippe für jeden Posten an, ob er ins Soll oder ins Haben gehört.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Betriebsergebniskonto (GKV)',
        vorgaenge: [
          { text: 'Materialkosten', betrag: MATERIAL.value.toFixed(2), seite: 'soll' },
          { text: 'Umsatzerlöse', betrag: S.umsatzSumme.value.toFixed(2), seite: 'haben' },
          { text: 'Fertigungskosten', betrag: FERTIGUNG.value.toFixed(2), seite: 'soll' },
          {
            text: `Bestandsmehrung ${EN!.name}`,
            betrag: S.bv[0]!.value.toFixed(2),
            seite: 'haben',
          },
          { text: 'Verwaltungs- und Vertriebskosten', betrag: VV.value.toFixed(2), seite: 'soll' },
          {
            text: `Bestandsminderung ${LE!.name}`,
            betrag: S.bv[1]!.value.abs().toFixed(2),
            seite: 'soll',
          },
        ],
      },
      fazit: `Kosten und Bestandsminderungen stehen im Soll, Umsatzerlöse und Bestandsmehrungen im Haben. Der Saldo ist der Betriebsgewinn von ${formatEuro(S.beGkv)}.`,
    },
    {
      typ: 'wer-hat-recht',
      frage: `Womit bewertet man die ${formatPlain(MEHRUNG)} Kartons ${EN!.name} im Lager?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `Mit dem Verkaufspreis von ${formatEuro(EN!.preis)}. So viel sind sie ja wert!`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Mit den Herstellkosten von ${formatEuro(S.kh[0]!)} je Karton.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Verdient ist erst beim Verkauf; im Lager stecken nur die Kosten der Herstellung.',
          richtig: true,
        },
        { text: 'Lagerbestände werden immer mit null bewertet.' },
        { text: 'Bewertet wird mit den Selbstkosten einschließlich Vertrieb.' },
      ],
      aufloesung: `Herstellkosten je Karton = (${formatEuro(EN!.material)} + ${formatEuro(EN!.fertigung)}) ÷ ${formatPlain(EN!.produziert)} = ${formatEuro(S.kh[0]!)}. Mit dem Verkaufspreis würde ein Gewinn gezeigt, der noch gar nicht entstanden ist.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein anderer Monat nach dem Gesamtkostenverfahren. Ergänze Bestandsveränderungen, Gesamtleistung und Betriebsergebnis.',
      skillId: 'J7-gkv-ukv',
      seed: 3,
      variant: 'gkv',
      partId: 'gkv',
      gefragt: ['bv', 'gl', 'be-gkv'],
    },
    {
      typ: 'konzept',
      titel: 'Umsatzkostenverfahren',
      text: 'Jeder Produktart stehen nur die Selbstkosten der verkauften Menge gegenüber: Herstellkosten je Stück × Absatzmenge plus Verwaltungs- und Vertriebskosten. Bestandsveränderungen braucht man nicht, dafür sieht man das Ergebnis je Produkt.',
      visual: {
        typ: 'karten',
        karten: BEISPIEL.produkte.map((x, i) => ({
          titel: x.name,
          text: `${formatEuro(S.umsatz[i]!)} − ${formatEuro(S.skUmsatz[i]!)} = ${formatEuro(S.erfolg[i]!)}`,
          farbe: ['#1c6670', '#e2b13c'][i]!,
        })),
      },
    },
    {
      typ: 'verstaendnis',
      frage: `Selbstkosten des Umsatzes für ${EN!.name}: Herstellkosten ${formatEuro(S.kh[0]!)} je Karton, verkauft ${formatPlain(EN!.abgesetzt)} Kartons, Verwaltung und Vertrieb ${formatEuro(EN!.vv)}. Wie hoch sind sie?`,
      optionen: [
        {
          text: formatEuro(S.skUmsatz[0]!),
          richtig: true,
          erklaerung: `${formatEuro(S.kh[0]!)} × ${formatPlain(EN!.abgesetzt)} + ${formatEuro(EN!.vv)}.`,
        },
        {
          text: formatEuro(UKV_PROD.skUmsatz[0]!),
          erklaerung:
            'Das sind die Kosten der ganzen Produktion. Im Umsatzkostenverfahren zählt nur die verkaufte Menge.',
        },
        {
          text: formatEuro(SK_OHNE_VV),
          erklaerung: 'Hier fehlen die Verwaltungs- und Vertriebskosten.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Welches Verfahren?',
      kategorien: ['Gesamtkostenverfahren', 'Umsatzkostenverfahren'],
      elemente: [
        {
          text: 'Zeigt die Kosten gegliedert nach Kostenarten',
          kategorie: 'Gesamtkostenverfahren',
          erklaerung: 'Material, Fertigung, Verwaltung und Vertrieb für den ganzen Monat.',
        },
        {
          text: 'Braucht die Bestandsveränderungen',
          kategorie: 'Gesamtkostenverfahren',
          erklaerung: 'Nur so passen Kosten und Leistungen zusammen.',
        },
        {
          text: 'Zeigt das Ergebnis je Produktart',
          kategorie: 'Umsatzkostenverfahren',
          erklaerung: 'Umsatz und Selbstkosten stehen je Produkt gegenüber.',
        },
        {
          text: 'Braucht Selbstkosten je Stück aus der Kalkulation',
          kategorie: 'Umsatzkostenverfahren',
          erklaerung: 'Ohne Kostenträgerstückrechnung geht es nicht.',
        },
        {
          text: 'Rechnet mit der abgesetzten Menge',
          kategorie: 'Umsatzkostenverfahren',
          erklaerung: 'Erlöse und Kosten beziehen sich auf dieselbe Menge.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'J7-m1',
      frage: 'Wie ermitteln Gesamt- und Umsatzkostenverfahren das Betriebsergebnis?',
      text: 'GKV: Umsatzerlöse ± Bestandsveränderungen (zu Herstellkosten) − alle Kosten der Periode. UKV: Umsatzerlöse − Selbstkosten der abgesetzten Menge. Beide liefern dasselbe Betriebsergebnis.',
    },
    {
      typ: 'klausur',
      punkte: 6,
      aufgabe: `Für den ${K.monat} liegen vor (Mengen in Kartons): ${K.produkte
        .map(
          (x) =>
            `${x.name}: Produktion ${formatPlain(x.produziert)}, Absatz ${formatPlain(x.abgesetzt)}, Preis ${formatEuro(x.preis)}, Materialkosten ${formatEuro(x.material)}, Fertigungskosten ${formatEuro(x.fertigung)}, Verwaltungs- und Vertriebskosten ${formatEuro(x.vv)}`,
        )
        .join(
          '; ',
        )}. Ermitteln Sie das Betriebsergebnis je Produktart nach dem Umsatzkostenverfahren.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Im Winter füllen wir nur halb so viel ab, aber Halle und Anlage kosten genauso viel. Was passiert dann mit den Kosten je Dose?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Umsatz 500.000 €, Kosten der Periode 420.000 €, Bestandsmehrung zu Herstellkosten 20.000 €. Betriebsergebnis nach dem GKV?',
      optionen: [{ text: '100.000 €', richtig: true }, { text: '60.000 €' }, { text: '80.000 €' }],
    },
    {
      frage: 'Womit werden Bestandsveränderungen im Gesamtkostenverfahren bewertet?',
      optionen: [
        { text: 'Mit Herstellkosten', richtig: true },
        { text: 'Mit Verkaufspreisen' },
        { text: 'Mit Selbstkosten' },
      ],
    },
    {
      frage: 'Was stellt das Umsatzkostenverfahren den Umsatzerlösen gegenüber?',
      optionen: [
        { text: 'Die Selbstkosten der abgesetzten Produkte', richtig: true },
        { text: 'Alle Kosten der Periode nach Kostenarten' },
        { text: 'Die Herstellkosten der gesamten Produktion' },
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
      'K2 Kap. 2.3 (S. 82–89: Kostenträgerzeitrechnung; GKV mit Bestandsmehrungen im Haben, Bestandsminderungen im Soll, Bewertung zu Herstellkosten; UKV mit Selbstkosten der abgesetzten Produkte; beide Verfahren gleiches Ergebnis; UKV zeigt Erfolg je Produktart) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
