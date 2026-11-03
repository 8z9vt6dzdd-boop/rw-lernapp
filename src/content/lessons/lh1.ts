// Lektion H1 – Materialverbrauchsmengen (eigene Formulierung; geprüft gegen K1 Kap. 2.2.1, S. 48–54).
// Alle Mengen werden von der Engine berechnet (Golden Case GC-H1 in docs/m7/h.md).
import { solveMengen, type MengenParams } from '../../engine/generators/h/materialmengen';
import { formatPlain } from '../../engine/money';
import type { Lektion } from './types';

const P: MengenParams = {
  variante: 'vergleich',
  material: 'Zucker',
  einheit: 'kg',
  erzeugnisEinheit: 'Chargen',
  preis: '0.9',
  ab: 12_000,
  zugaenge: [18_000, 9_000],
  eb: 10_500,
  entnahmen: [14_000, 9_500, 4_000],
  erzeugnisse: [
    { name: 'Senne Lemon', menge: 50, bedarf: 250 },
    { name: 'Paderquell Energy', menge: 35, bedarf: 400 },
  ],
};
const S = solveMengen(P);
const kg = (x: number) => `${formatPlain(x)} kg`;

export const lektionH1: Lektion = {
  id: 'H1',
  skillId: 'H1-materialmengen',
  abschnitt: 'H',
  titel: 'Drei Wege zum Zuckerverbrauch',
  kernAha:
    'Den Materialverbrauch kann man aus den Beständen (Inventurmethode), aus den Entnahmescheinen (Skontrationsmethode) oder aus den Stücklisten (retrograde Methode) ermitteln. Erst der Vergleich zeigt, wo Material verloren geht: im Lager oder in der Fertigung.',
  dauerMin: 7,
  figuren: ['leni', 'jana', 'tobias'],
  ort: 'lager',
  quelle: 'K1 2.2.1 (S. 48–54)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Lager, Fertigung und Inventur nennen drei verschiedene Zahlen für den Zuckerverbrauch. Wer hat recht?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Ich brauche für die Kostenrechnung nur eine Zahl: Wie viel Zucker haben wir im Januar verbraucht?',
        },
        {
          figur: 'jana',
          ausdruck: 'ueberrascht',
          text: `Das Lager sagt ${kg(S.skontration)}, die Rezepturen sagen ${kg(S.retrograd)}, die Inventur ergibt ${kg(S.inventur)}.`,
        },
      ],
      frage: 'Wie kann es für denselben Zucker drei verschiedene Verbrauchszahlen geben?',
      visual: {
        typ: 'lager',
        titel: 'Zuckersilo im Werk Paderborn',
        tanks: [
          { name: 'Silo am 1. Januar', fuellung: 0.55 },
          { name: 'Silo am 31. Januar', fuellung: 0.45 },
        ],
      },
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir vor, du willst wissen, wie viel Milch deine WG in einer Woche trinkt. Du kannst am Montag und am Sonntag in den Kühlschrank schauen.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Oder ihr schreibt jede Packung auf, die jemand herausnimmt. Oder du rechnest vom Rezept zurück: drei Kuchen mit je einem halben Liter.',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Und wenn nachts einer heimlich trinkt, merkt das nur der Kühlschrank-Blick. Verstehe!',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Am 1. Januar lagen ${kg(P.ab)} Zucker im Silo. Im Januar kamen ${kg(S.zugang)} dazu, am 31. Januar sind noch ${kg(P.eb)} da. Wie viel Zucker ist im Januar weg?`,
      optionen: [
        { text: kg(S.inventur), richtig: true },
        { text: kg(S.zugang) },
        { text: kg(P.ab - P.eb) },
      ],
      aufloesung: `Anfangsbestand ${kg(P.ab)} plus Zugänge ${kg(S.zugang)} minus Endbestand ${kg(P.eb)} ergibt ${kg(S.inventur)}. Genau so rechnet die Inventurmethode – sie zählt aber alles als Verbrauch, was fehlt, auch Verlorenes.`,
    },
    {
      typ: 'konzept',
      titel: 'Drei Methoden, drei Quellen',
      text: 'Inventurmethode: Anfangsbestand + Zugänge − Endbestand laut Inventur. Skontrationsmethode: Summe aller Materialentnahmescheine. Retrograde Methode: hergestellte Menge × Bedarf je Einheit laut Stückliste.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Inventurmethode',
            text: 'Quelle: Inventur und Lieferscheine',
            farbe: '#1c6670',
          },
          {
            titel: 'Skontrationsmethode',
            text: 'Quelle: Materialentnahmescheine',
            farbe: '#e8792b',
          },
          {
            titel: 'Retrograde Methode',
            text: 'Quelle: Stücklisten und Produktionsmengen',
            farbe: '#8cbf3f',
          },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Was verrät jede Methode?',
      text: 'Tippe auf die Karten und finde heraus, wo die Stärken und Schwächen liegen.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Inventurmethode',
            text: 'Braucht für jeden Monat eine Inventur, also viel Zählarbeit. Schwund im Lager verschwindet unbemerkt im Verbrauch.',
            farbe: '#1c6670',
          },
          {
            titel: 'Skontrationsmethode',
            text: 'Jede Entnahme hat einen Beleg mit Kostenstelle und Zweck. Daraus ergibt sich ein rechnerischer Endbestand, den die Inventur überprüfen kann.',
            farbe: '#e8792b',
          },
          {
            titel: 'Retrograde Methode',
            text: 'Zeigt den Sollverbrauch laut Stückliste. Ob im Lager oder in der Fertigung etwas verloren ging, sieht man damit allein nicht.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Festwertverfahren',
            text: 'Ganz einfach: Verbrauch = Zugang. Nur sinnvoll bei geringwertigem Material oder fast gleichbleibenden Beständen.',
            farbe: '#e2b13c',
          },
        ],
      },
      fazit: 'Für eine genaue Analyse kombiniert man die Methoden.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Skontration: Wo ist der Zucker geblieben?',
      text: `Laut Entnahmescheinen wurden ${P.entnahmen.map(kg).join(', ')} an die Fertigung ausgegeben.`,
      schritte: [
        {
          text: 'Verbrauch laut Entnahmescheinen',
          rechnung: `${P.entnahmen.map((x) => formatPlain(x)).join(' + ')} = ${kg(S.skontration)}`,
          warum: 'Bei der Skontrationsmethode zählt jede belegte Entnahme als Verbrauch.',
        },
        {
          text: 'Rechnerischer Endbestand (Soll)',
          rechnung: `${formatPlain(P.ab)} + ${formatPlain(S.zugang)} − ${formatPlain(S.skontration)} = ${kg(S.sollEbSkontration)}`,
          warum: 'So viel müsste laut Belegen noch im Silo liegen.',
        },
        {
          text: 'Inventurdifferenz',
          rechnung: `${formatPlain(S.sollEbSkontration)} − ${formatPlain(P.eb)} = ${kg(S.schwund)}`,
          warum:
            'Die Inventur findet weniger als die Belege versprechen: Der Rest ist im Lager verloren gegangen (Schwund).',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Laut Rezepturen brauchten ${P.erzeugnisse.map((e) => `${e.menge} ${P.erzeugnisEinheit} ${e.name} à ${kg(e.bedarf)}`).join(' und ')} zusammen ${kg(S.retrograd)}. Wie viel wurde verbraucht?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `Steht doch in der Stückliste: ${kg(S.retrograd)}. Mehr haben wir nicht verbraucht.`,
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Die Stückliste sagt, was wir hätten verbrauchen sollen. Was tatsächlich weg ist, zeigen Entnahmescheine und Inventur.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die retrograde Methode liefert nur den Sollverbrauch; Ausschuss und Schwund erkennt man erst im Vergleich.',
          richtig: true,
        },
        { text: 'Stücklisten sind immer veraltet.' },
        { text: 'Die Inventurmethode ist gesetzlich vorgeschrieben.' },
      ],
      aufloesung: `Entnommen wurden ${kg(S.skontration)}, laut Stückliste nötig waren ${kg(S.retrograd)}: ${kg(S.mehrverbrauch)} Mehrverbrauch in der Fertigung. Dazu kommen ${kg(S.schwund)} Schwund im Lager – zusammen genau der Unterschied zur Inventurmethode.`,
    },
    {
      typ: 'sortieren',
      titel: 'Lager oder Fertigung?',
      text: 'Wo zeigt sich der Verlust beim Vergleich der Methoden?',
      kategorien: ['Lagerschwund', 'Mehrverbrauch in der Fertigung'],
      elemente: [
        {
          text: 'Ein Sack Zucker reißt beim Umlagern auf und wird entsorgt.',
          kategorie: 'Lagerschwund',
          erklaerung:
            'Ohne Entnahmeschein: Der rechnerische Endbestand ist höher als der Inventurbestand.',
        },
        {
          text: 'Eine Charge Sirup wird falsch angesetzt und weggeschüttet.',
          kategorie: 'Mehrverbrauch in der Fertigung',
          erklaerung:
            'Der Zucker wurde belegt entnommen, steckt aber in keinem fertigen Erzeugnis.',
        },
        {
          text: 'Zucker wird ohne Beleg für die Kantine geholt.',
          kategorie: 'Lagerschwund',
          erklaerung: 'Fehlt ein Entnahmeschein, taucht die Menge erst als Inventurdifferenz auf.',
        },
        {
          text: 'Die Mischanlage dosiert dauerhaft etwas mehr als die Rezeptur vorsieht.',
          kategorie: 'Mehrverbrauch in der Fertigung',
          erklaerung: 'Entnahmen und Sollverbrauch laut Stückliste weichen voneinander ab.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Skontrationsmethode mit neuen Zahlen: Ergänze rechnerischen Endbestand und Inventurdifferenz.',
      skillId: 'H1-materialmengen',
      seed: 11,
      variant: 'skontration',
      partId: 'mengen',
      gefragt: ['solleb', 'schwund'],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Welche Methode liefert aus Belegen einen rechnerischen Endbestand, den man mit der Inventur vergleichen kann?',
      optionen: [
        {
          text: 'Die Skontrationsmethode',
          richtig: true,
          erklaerung:
            'Anfangsbestand + Zugänge − Entnahmen laut Schein = Soll-Endbestand; die Differenz zur Inventur zeigt Schwund oder Diebstahl.',
        },
        {
          text: 'Die Inventurmethode',
          erklaerung: 'Sie nutzt den Inventurbestand selbst, hat also nichts zum Vergleichen.',
        },
        {
          text: 'Das Festwertverfahren',
          erklaerung: 'Es setzt einfach den Zugang als Verbrauch an und betrachtet keine Bestände.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'H1-m1',
      frage: 'Wie ermitteln Inventur-, Skontrations- und retrograde Methode den Materialverbrauch?',
      text: 'Inventurmethode: Anfangsbestand + Zugänge − Endbestand laut Inventur. Skontrationsmethode: Summe der Entnahmescheine (Soll-Endbestand gegen Inventur zeigt Schwund). Retrograde Methode: hergestellte Menge × Bedarf laut Stückliste.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Ermitteln Sie die Verbrauchsmengen nach der Inventur-, der Skontrations- und der retrograden Methode und erklären Sie die Abweichungen rechnerisch.',
      part: { skillId: 'H1-materialmengen', seed: 5, variant: 'vergleich', partId: 'mengen' },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Die Mengen stehen. Nur beim Zitronenaroma hakt es: Wir haben es zu drei verschiedenen Preisen eingekauft – welcher gilt für den Verbrauch?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Anfangsbestand 4.000 kg, Zugänge 9.000 kg, Endbestand laut Inventur 3.500 kg. Verbrauch nach der Inventurmethode?',
      optionen: [{ text: '9.500 kg', richtig: true }, { text: '9.000 kg' }, { text: '500 kg' }],
    },
    {
      frage: 'Woraus ergibt sich der Verbrauch bei der Skontrationsmethode?',
      optionen: [
        { text: 'Aus der Summe der Materialentnahmescheine', richtig: true },
        { text: 'Aus Anfangs- und Endbestand laut Inventur' },
        { text: 'Aus den Stücklisten der hergestellten Erzeugnisse' },
      ],
    },
    {
      frage:
        '2.000 Flaschen mit je 3 Etiketten wurden hergestellt. Sollverbrauch an Etiketten (retrograd)?',
      optionen: [
        { text: '6.000 Stück', richtig: true },
        { text: '2.000 Stück' },
        { text: '2.003 Stück' },
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
      'K1 Kap. 2.2.1 (S. 48–54: Festwertverfahren, Inventurmethode, Skontrationsmethode mit rechnerischem Endbestand, retrograde Methode, Kombination der Verfahren) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
