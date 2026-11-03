// Lektion J1 – Grundlagen der Kostenträgerrechnung, Kalkulationsverfahren wählen (eigene Formulierung;
// geprüft gegen K2 Kap. 2.1 und 2.2.1, S. 46–53). Keine Rechenwerte; Klausurbrücke als Zuordnung.
import { FIRMA } from '../../config';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const PR = FIRMA.produkte;
const DIV = 'Divisionskalkulation';
const AEZ = 'Äquivalenzziffernkalkulation';
const ZUS = 'Zuschlagskalkulation';
const KUP = 'Kuppelkalkulation';
const VERFAHREN = [DIV, AEZ, ZUS, KUP];

const K_TEIL: TaskPart = {
  typ: 'rechenkette',
  id: 'verfahren',
  titel: 'Kalkulationsverfahren',
  felder: [
    {
      typ: 'auswahl',
      id: 'masse',
      label: 'Massenfertigung eines einzigen, einheitlichen Produkts',
      optionen: VERFAHREN,
      soll: DIV,
    },
    {
      typ: 'auswahl',
      id: 'sorte',
      label: 'Sortenfertigung: gleicher Rohstoff, gleiches Verfahren, verschiedene Größen',
      optionen: VERFAHREN,
      soll: AEZ,
    },
    {
      typ: 'auswahl',
      id: 'einzel',
      label: 'Einzel- und Serienfertigung unterschiedlicher Produkte',
      optionen: VERFAHREN,
      soll: ZUS,
    },
    {
      typ: 'auswahl',
      id: 'kuppel',
      label: 'Ein Prozess, aus dem zwangsläufig mehrere Produkte entstehen',
      optionen: VERFAHREN,
      soll: KUP,
    },
  ],
};

export const lektionJ1: Lektion = {
  id: 'J1',
  skillId: 'J1-ktr-grundlagen',
  abschnitt: 'J',
  titel: 'Kostenträger: Welche Kalkulation passt?',
  kernAha:
    'Die Kostenträgerrechnung fragt, wofür die Kosten anfallen – je Stück (Kalkulation) oder je Periode (Betriebsergebnis). Welches Kalkulationsverfahren passt, entscheidet die Fertigung: Masse → Division, Sorten → Äquivalenzziffern, Einzel- und Serienfertigung → Zuschlag, Kuppelproduktion → Kuppelkalkulation.',
  dauerMin: 7,
  figuren: ['frank', 'leni', 'jana', 'tobias'],
  ort: 'abfuellung',
  quelle: 'K2 2.1, 2.2.1 (S. 46–53)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Millionen gleicher Dosen und ein Sonderauftrag fürs Hotel – rechnen wir beide gleich?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'ueberrascht',
          text: `Leni, rechnest du jetzt für jede einzelne Dose ${PR.energy} einen eigenen Zuschlag aus?`,
        },
        { figur: 'leni', ausdruck: 'freut', text: 'Um Himmels willen, nein.' },
      ],
      frage:
        'Die MBG füllt Millionen gleicher Dosen ab, nimmt aber auch Sonderaufträge an. Passt dafür dasselbe Rechenverfahren?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Wer für eine Party zwanzig gleiche Pizzen backt, teilt die Einkaufsrechnung einfach durch zwanzig.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Ein Caterer mit lauter Sonderwünschen kann das nicht. Er muss jeden Auftrag einzeln kalkulieren.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Eine Abfülllinie füllt das ganze Jahr nur ${PR.energy} 0,25 l ab – immer gleich. Welches Verfahren reicht für die Stückkosten?`,
      optionen: [
        { text: 'Gesamtkosten ÷ Menge (Divisionskalkulation)', richtig: true },
        { text: 'Zuschläge für jede Kostenstelle (Zuschlagskalkulation)' },
        { text: 'Gewichtung mit Äquivalenzziffern' },
      ],
      aufloesung:
        'Bei einem einheitlichen Massenprodukt verursacht jede Dose gleich viel Kosten. Dann genügt es, die Kosten der Periode durch die Menge zu teilen – wie bei den Pizzen.',
    },
    {
      typ: 'konzept',
      titel: 'Fertigungsart bestimmt das Verfahren',
      text: 'Massenfertigung: Divisionskalkulation. Sortenfertigung (gleicher Rohstoff, gleiches Verfahren, nur andere Größe oder Farbe): Äquivalenzziffernkalkulation. Serien- und Einzelfertigung: Zuschlagskalkulation. Kuppelproduktion (mehrere Produkte zwangsläufig aus einem Prozess): Restwert- oder Verteilungsmethode.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Masse', text: 'Divisionskalkulation', farbe: '#1c6670' },
          { titel: 'Sorten', text: 'Äquivalenzziffernkalkulation', farbe: '#8cbf3f' },
          { titel: 'Serie und Einzelstück', text: 'Zuschlagskalkulation', farbe: '#e2b13c' },
          { titel: 'Kuppelprodukte', text: 'Restwert- oder Verteilungsmethode', farbe: '#e8792b' },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welches Verfahren passt?',
      text: 'Situationen bei der MBG',
      kategorien: [DIV, AEZ, ZUS, KUP],
      elemente: [
        {
          text: `${PR.energy} in 0,25 l, 0,33 l und 0,5 l – gleiche Rezeptur, gleiche Anlage`,
          kategorie: AEZ,
          erklaerung:
            'Sorten unterscheiden sich nur in der Größe. Äquivalenzziffern gewichten, wie viel Kosten jede Sorte im Verhältnis verursacht.',
        },
        {
          text: 'Sonderabfüllung mit eigenem Etikett für eine Hotelkette',
          kategorie: ZUS,
        },
        {
          text: 'Beim Brauen fällt Treber an, der als Futtermittel verkauft wird',
          kategorie: KUP,
          erklaerung: 'Bier und Treber entstehen zwangsläufig im selben Prozess: Kuppelprodukte.',
        },
        { text: `Eine Linie füllt ein Jahr lang nur ${PR.lemon} 0,33 l ab`, kategorie: DIV },
        {
          text: 'Viele verschiedene Getränke mit unterschiedlichen Rohstoffen und Arbeitsgängen',
          kategorie: ZUS,
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Braucht die Divisionskalkulation einen Betriebsabrechnungsbogen?',
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Ohne Kostenstellen geht in der Kalkulation gar nichts.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Für die Divisionskalkulation nicht. Die Kosten werden gleichmäßig auf alle Einheiten verteilt.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Bei gleichartigen Produkten braucht es für die Kalkulation keine Trennung nach Kostenstellen – die Kostenträgerrechnung schließt direkt an die Kostenartenrechnung an.',
          richtig: true,
        },
        { text: 'Die Divisionskalkulation kennt keine Gemeinkosten, weil es sie dort nicht gibt.' },
        { text: 'Kostenstellen gibt es nur in der Buchhaltung.' },
      ],
      aufloesung:
        'Kostenstellen können trotzdem sinnvoll sein – dann für die Wirtschaftlichkeitskontrolle, nicht für die Kalkulation.',
    },
    {
      typ: 'konzept',
      titel: 'Je Stück oder je Periode',
      text: 'Kostenartenrechnung: Welche Kosten? Kostenstellenrechnung: Wo? Kostenträgerrechnung: Wofür? Die Kostenträgerstückrechnung (Kalkulation) ermittelt Herstell- und Selbstkosten je Einheit. Die Kostenträgerzeitrechnung (Betriebsergebnisrechnung) stellt Kosten und Erlöse einer Periode gegenüber.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Kostenarten', text: 'Welche Kosten?', farbe: '#4a9fd8' },
          { titel: 'Kostenstellen', text: 'Wo entstanden?', farbe: '#e2b13c' },
          { titel: 'Kostenträger', text: 'Wofür? Je Stück oder je Periode', farbe: '#1c6670' },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Stückrechnung oder Zeitrechnung?',
      kategorien: ['Kostenträgerstückrechnung', 'Kostenträgerzeitrechnung'],
      elemente: [
        {
          text: `Was kostet ein Karton ${PR.energy} 0,25 l?`,
          kategorie: 'Kostenträgerstückrechnung',
        },
        {
          text: 'Wie hoch war das Betriebsergebnis im März?',
          kategorie: 'Kostenträgerzeitrechnung',
        },
        { text: 'Angebotspreis für die Hotelkette', kategorie: 'Kostenträgerstückrechnung' },
        {
          text: 'Kosten und Erlöse des Quartals gegenüberstellen',
          kategorie: 'Kostenträgerzeitrechnung',
        },
        {
          text: 'Herstellkosten je Karton für die Bewertung des Lagers',
          kategorie: 'Kostenträgerstückrechnung',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Tobias braucht den Preis für die Hotelkette, bevor der Auftrag erteilt ist. Welche Kalkulation ist das?',
      figur: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Die Hotelkette will bis Freitag ein Angebot.',
      },
      optionen: [
        {
          text: 'Vorkalkulation',
          richtig: true,
          erklaerung:
            'Vor Auftragserteilung oder Produktionsbeginn, meist für Preisverhandlung und Angebot.',
        },
        {
          text: 'Nachkalkulation',
          erklaerung:
            'Die Nachkalkulation folgt nach der Produktion und dient der Kostenkontrolle.',
        },
        {
          text: 'Kostenträgerzeitrechnung',
          erklaerung: 'Sie betrachtet eine ganze Periode, nicht einen einzelnen Auftrag.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'J1-m1',
      frage: 'Welches Kalkulationsverfahren passt zu welcher Fertigungsart?',
      text: 'Kostenträgerstückrechnung (Kalkulation) je Einheit, Kostenträgerzeitrechnung je Periode. Massenfertigung: Divisionskalkulation. Sortenfertigung: Äquivalenzziffernkalkulation. Serien- und Einzelfertigung: Zuschlagskalkulation. Kuppelproduktion: Restwert- oder Verteilungsmethode.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: 'Ordnen Sie den Fertigungsarten das jeweils geeignete Kalkulationsverfahren zu.',
      part: K_TEIL,
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'freut',
        text: 'Fangen wir mit dem einfachsten Verfahren an. Was kostet eine Dose, wenn eine Linie nur eine Sorte abfüllt?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Welches Verfahren passt zur Sortenfertigung?',
      optionen: [
        { text: 'Äquivalenzziffernkalkulation', richtig: true },
        { text: 'Kuppelkalkulation' },
        { text: 'Simultanverfahren' },
      ],
    },
    {
      frage: 'Was ermittelt die Kostenträgerzeitrechnung?',
      optionen: [
        { text: 'Das Betriebsergebnis einer Periode', richtig: true },
        { text: 'Die Selbstkosten eines Stücks' },
        { text: 'Die Gemeinkosten je Kostenstelle' },
      ],
    },
    {
      frage: 'Für welches Kalkulationsverfahren ist keine Kostenstellenrechnung erforderlich?',
      optionen: [
        { text: 'Divisionskalkulation', richtig: true },
        { text: 'Differenzierende Zuschlagskalkulation' },
        { text: 'Maschinenstundensatzrechnung' },
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
      'K2 Kap. 2.1 (welche/wo/wofür; Stückrechnung = Kalkulation mit Herstell- und Selbstkosten je Stück, Zeitrechnung = Betriebsergebnisrechnung bzw. kurzfristige Erfolgsrechnung), 2.2.1 (Kostenträgerarten, Vor- und Nachkalkulation, Abb. 15 Kalkulationsverfahren je Fertigungsart, Definitionen Massen-, Sorten-, Serien-, Einzel-, Kuppelproduktion), 2.2.2.1 (Divisionskalkulation ohne Kostenstellenrechnung für die Kalkulation) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
