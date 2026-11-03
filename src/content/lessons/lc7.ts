// Lektion C7 – Bezugskalkulation (eigene Formulierung; Schema nach docs/m7/c2.md, GC-C7).
// Alle Beträge werden von der Engine berechnet.
import { kalkuliere, type Angebot } from '../../engine/generators/c2/bezugskalkulation';
import { formatEuro, formatPlain, formatProzent, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val | string) => formatEuro(typeof v === 'string' ? v : v.value.toString());
const b = (v: Val) => v.value.toString();
const p = formatProzent;

const MENGE = 500;
const TEWES: Angebot = {
  lieferant: 'Aromahaus Tewes GmbH (Bielefeld)',
  preis: '24',
  rabatt: '0.05',
  skonto: '0.02',
  frachtArt: 'pauschal',
  fracht: '150',
  versicherung: '0',
};
const BRAKEMEIER: Angebot = {
  lieferant: 'Fruchtkonzentrate Brakemeier GmbH (Detmold)',
  preis: '25.6',
  rabatt: '0.125',
  skonto: '0.03',
  frachtArt: 'frei',
  fracht: '0',
  versicherung: '0',
};
const A = kalkuliere(TEWES, MENGE);
const B = kalkuliere(BRAKEMEIER, MENGE);
const B_GUENSTIGER = B.bp.cmp(A.bp) < 0;
const VORTEIL = A.bp.minus(B.bp).abs();
const LISTE_DIFF = B.lep.minus(A.lep);

export const lektionC7: Lektion = {
  id: 'C7',
  skillId: 'C7-bezugskalkulation',
  abschnitt: 'C',
  titel: 'Bezugskalkulation: Was kostet das Aroma wirklich?',
  kernAha:
    'Der Listenpreis ist nur der Anfang: Erst nach Rabatt, Skonto und Bezugskosten steht der Bezugspreis fest – das, was die Ware wirklich kostet. Angebote werden über den Bezugspreis verglichen.',
  dauerMin: 7,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'buero',
  quelle: 'BA 3.1.2 (Anschaffungsnebenkosten); Lehrbuch-Übungen zur Bezugskalkulation (Schema)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Zwei Angebote für Zitronenaroma. Das billigere auf dem Papier – ist es auch das billigere im Lager?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: `Angebot A: ${TEWES.lieferant}`,
            text: `${formatPlain(MENGE)} kg zu ${e(TEWES.preis)}/kg, ${p(TEWES.rabatt)} Rabatt, ${p(TEWES.skonto)} Skonto, Fracht ${e(TEWES.fracht)}`,
            farbe: '#e2b13c',
          },
          {
            titel: `Angebot B: ${BRAKEMEIER.lieferant}`,
            text: `${formatPlain(MENGE)} kg zu ${e(BRAKEMEIER.preis)}/kg, ${p(BRAKEMEIER.rabatt)} Rabatt, ${p(BRAKEMEIER.skonto)} Skonto, frei Haus`,
            farbe: '#8cbf3f',
          },
        ],
      },
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Für die Sommersaison brauchen wir ${formatPlain(MENGE)} kg Zitronenaroma. Tewes ist auf der Liste ${e(LISTE_DIFF)} billiger.`,
        },
        { figur: 'tobias', ausdruck: 'freut', text: 'Dann ist die Sache doch klar, oder?' },
      ],
      frage: 'Ist das Angebot mit dem niedrigeren Listenpreis automatisch das günstigere?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Wie beim Onlineshop: Der niedrigste Preis hilft wenig, wenn der Versand teuer ist und der andere Shop einen Gutschein gibt.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wir rechnen deshalb jedes Angebot bis zum Bezugspreis durch. Das ist der Preis, zu dem die Ware bei uns im Lager liegt.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: 'Tipp vorab: Welches Angebot ist am Ende günstiger?',
      optionen: [
        { text: 'Angebot A (Tewes) – der Listenpreis ist niedriger', richtig: !B_GUENSTIGER },
        { text: 'Angebot B (Brakemeier) – trotz höherem Listenpreis', richtig: B_GUENSTIGER },
      ],
      aufloesung: `Angebot ${B_GUENSTIGER ? 'B' : 'A'} ist insgesamt ${e(VORTEIL)} günstiger. Der höhere Rabatt, der höhere Skonto und die freie Lieferung machen den höheren Listenpreis mehr als wett. Gleich rechnen wir nach.`,
    },
    {
      typ: 'konzept',
      titel: 'Die Treppe der Bezugskalkulation',
      text: 'Listeneinkaufspreis minus Rabatt ergibt den Zieleinkaufspreis. Minus Skonto ergibt den Bareinkaufspreis. Plus Bezugskosten wie Fracht und Versicherung ergibt den Bezugspreis, auch Einstandspreis genannt.',
      visual: {
        typ: 'treppe',
        stufen: [
          { label: 'Listeneinkaufspreis', betrag: b(A.lep), art: 'basis' },
          { label: `− Liefererrabatt ${p(TEWES.rabatt)}`, betrag: b(A.rabatt), art: 'basis' },
          { label: 'Zieleinkaufspreis', betrag: b(A.zep), art: 'summe' },
          { label: `− Liefererskonto ${p(TEWES.skonto)}`, betrag: b(A.skonto), art: 'basis' },
          { label: 'Bareinkaufspreis', betrag: b(A.bep), art: 'summe' },
          { label: 'Bezugskosten (Fracht)', betrag: b(A.bezugskosten), art: 'zuschlag' },
          { label: 'Bezugspreis', betrag: b(A.bp), art: 'summe' },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Abziehen oder hinzurechnen?',
      text: 'Was macht die Ware billiger, was teurer?',
      kategorien: ['Wird abgezogen', 'Wird hinzugerechnet'],
      elemente: [
        { text: 'Mengenrabatt des Lieferanten', kategorie: 'Wird abgezogen' },
        {
          text: 'Skonto für Zahlung innerhalb von 10 Tagen',
          kategorie: 'Wird abgezogen',
          erklaerung: 'Vom Zieleinkaufspreis, also nach dem Rabatt.',
        },
        { text: 'Fracht der Spedition', kategorie: 'Wird hinzugerechnet' },
        { text: 'Transportversicherung', kategorie: 'Wird hinzugerechnet' },
        {
          text: 'Treuerabatt für Stammkunden',
          kategorie: 'Wird abgezogen',
          erklaerung: 'Ein Rabatt mindert den Listenpreis.',
        },
        {
          text: 'Verpackung, die der Lieferant berechnet',
          kategorie: 'Wird hinzugerechnet',
          erklaerung: 'Verpackungskosten sind Bezugskosten.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Angebot B Schritt für Schritt',
      text: `${formatPlain(MENGE)} kg zu ${e(BRAKEMEIER.preis)}, ${p(BRAKEMEIER.rabatt)} Rabatt, ${p(BRAKEMEIER.skonto)} Skonto, frei Haus.`,
      schritte: [
        {
          text: 'Listeneinkaufspreis',
          rechnung: `${formatPlain(MENGE)} × ${e(BRAKEMEIER.preis)} = ${e(B.lep)}`,
          warum: 'Menge mal Preis laut Preisliste – noch ohne jeden Abzug.',
        },
        {
          text: 'Liefererrabatt abziehen',
          rechnung: `${e(B.lep)} − ${e(B.rabatt)} = ${e(B.zep)}`,
          warum:
            'Der Rabatt steht schon auf der Rechnung. Was übrig bleibt, ist der Zieleinkaufspreis.',
        },
        {
          text: 'Liefererskonto abziehen',
          rechnung: `${e(B.zep)} × ${p(BRAKEMEIER.skonto)} = ${e(B.skonto)} → ${e(B.bep)}`,
          warum: 'Skonto gibt es nur auf den Rechnungsbetrag, also auf den Zieleinkaufspreis.',
        },
        {
          text: 'Bezugskosten hinzurechnen',
          rechnung: `${e(B.bep)} + ${e(B.bezugskosten)} = ${e(B.bp)}`,
          warum: 'Frei Haus: Der Lieferant trägt die Fracht, es kommt nichts hinzu.',
        },
        {
          text: 'Bezugspreis je kg',
          rechnung: `${e(B.bp)} ÷ ${formatPlain(MENGE)} = ${e(B.bpEinheit)}`,
          warum: `Zum Vergleich: Angebot A kostet ${e(A.bpEinheit)} je kg.`,
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: 'Wovon wird der Liefererskonto berechnet?',
      optionen: [
        {
          text: 'Vom Zieleinkaufspreis (nach Abzug des Rabatts)',
          richtig: true,
          erklaerung: 'Genau: Erst Rabatt, dann Skonto auf den verbleibenden Rechnungsbetrag.',
        },
        {
          text: 'Vom Listeneinkaufspreis',
          erklaerung:
            'Der Rabatt ist schon abgezogen, wenn bezahlt wird. Skonto gibt es nur auf den Betrag, der auf der Rechnung steht.',
        },
        {
          text: 'Vom Bezugspreis einschließlich Fracht',
          erklaerung: 'Die Fracht der Spedition steht nicht auf der Rechnung des Lieferanten.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein neues Angebot über Zitronenaroma. Ergänze den Skonto und den Bezugspreis.',
      skillId: 'C7-bezugskalkulation',
      seed: 4,
      variant: 'bezugspreis',
      partId: 'schema',
      gefragt: ['skonto', 'bp'],
    },
    {
      typ: 'entscheidung',
      frage: 'Welches Angebot nimmt die MBG an?',
      figur: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Ich hätte ja einfach den billigeren Listenpreis genommen.',
      },
      optionen: [
        {
          text: 'Angebot B von Brakemeier',
          empfohlen: B_GUENSTIGER,
          folge: `Die Aromen liegen für ${e(B.bp)} im Lager, also ${e(B.bpEinheit)} je kg.`,
          ausdruck: 'freut',
        },
        {
          text: 'Angebot A von Tewes',
          empfohlen: !B_GUENSTIGER,
          folge: `Die Aromen kosten die MBG ${e(A.bp)} – ${e(VORTEIL)} mehr als nötig.`,
          ausdruck: 'gruebelt',
        },
      ],
      fazit:
        'Verglichen wird der Bezugspreis, nicht der Listenpreis. Er ist zugleich der Wert, mit dem die Ware als Anschaffungskosten ins Lager geht.',
    },
    {
      typ: 'merksatz',
      id: 'C7-m1',
      frage: 'Wie lautet das Schema der Bezugskalkulation?',
      text: 'Listeneinkaufspreis − Liefererrabatt = Zieleinkaufspreis − Liefererskonto = Bareinkaufspreis + Bezugskosten = Bezugspreis (Einstandspreis). Angebote vergleicht man über den Bezugspreis.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Ermitteln Sie den Bezugspreis der Lieferung insgesamt und je 100 kg. Runden Sie Zwischenergebnisse auf zwei Nachkommastellen.',
      part: {
        skillId: 'C7-bezugskalkulation',
        seed: 6,
        variant: 'bezugspreis',
        partId: 'schema',
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Wir haben auch Liboriwein gekauft, um ihn unverändert weiterzuverkaufen. Sind das jetzt Rohstoffe?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Listeneinkaufspreis 10.000 €, 10 % Rabatt, 2 % Skonto, Fracht 200 €. Wie hoch ist der Bezugspreis?',
      optionen: [
        { text: '9.020,00 €', richtig: true },
        { text: '9.000,00 €' },
        { text: '9.016,00 €' },
      ],
    },
    {
      frage: 'Wie heißt der Preis nach Abzug von Rabatt und Skonto, aber vor den Bezugskosten?',
      optionen: [
        { text: 'Bareinkaufspreis', richtig: true },
        { text: 'Zieleinkaufspreis' },
        { text: 'Bezugspreis' },
      ],
    },
    {
      frage: 'Woran erkennt man das günstigere von zwei Angeboten?',
      optionen: [
        { text: 'Am niedrigeren Bezugspreis', richtig: true },
        { text: 'Am niedrigeren Listenpreis' },
        { text: 'Am höheren Rabattsatz' },
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
      'Schema gegen Lehrbuch-Übungen (Bezugskalkulation) und BA 3.1.2 (Anschaffungsnebenkosten) geprüft; Zahlen aus der Engine (GC-C7); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
