// Lektion F9 – Aufbau der GuV nach HGB (eigene Formulierung; BA 7.1–7.2, §§ 242, 246, 275 HGB).
// Theorie-Skill; die Staffel-Beispielzahlen sind erfunden und werden hier exakt summiert.
import { Val, formatEuro, sum } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

// Erfundene MBG-Zahlen (Lernversion), Gesamtkostenverfahren
const UMSATZ = new Val('4800000');
const BESTAND_PLUS = new Val('60000');
const SONST_ERTRAG = new Val('40000');
const MATERIAL = new Val('2300000');
const PERSONAL = new Val('1400000');
const AFA = new Val('350000');
const SONST_AUFWAND = new Val('450000');
const ZINSERTRAG = new Val('10000');
const ZINSAUFWAND = new Val('70000');
const STEUERN_EE = new Val('50000');
const SONST_STEUERN = new Val('10000');

const GESAMTLEISTUNG = sum([UMSATZ, BESTAND_PLUS, SONST_ERTRAG]);
const BETRIEBSERGEBNIS = GESAMTLEISTUNG.minus(sum([MATERIAL, PERSONAL, AFA, SONST_AUFWAND]));
const FINANZERGEBNIS = ZINSERTRAG.minus(ZINSAUFWAND);
const VOR_STEUERN = BETRIEBSERGEBNIS.plus(FINANZERGEBNIS);
const JUE = VOR_STEUERN.minus(STEUERN_EE).minus(SONST_STEUERN);
const MIETE_AUFWAND = new Val('20000');
const MIETE_ERTRAG = new Val('5000');

export const lektionF9: Lektion = {
  id: 'F9',
  skillId: 'F9-guv-aufbau',
  abschnitt: 'F',
  titel: 'Die GuV mit Zwischensummen',
  kernAha:
    'Die GuV stellt Aufwendungen und Erträge des ganzen Geschäftsjahres gegenüber, ohne sie zu verrechnen. In der Staffelform führt sie Schritt für Schritt vom Betriebsergebnis über das Finanzergebnis und die Steuern zum Jahresüberschuss – und bei Kapitalgesellschaften weiter zum Bilanzgewinn.',
  dauerMin: 7,
  figuren: ['sabine', 'frank', 'jana', 'leni'],
  ort: 'gesellschafter',
  quelle: 'BA 7.1–7.2 (§§ 242, 246 Abs. 2, 275 HGB)',
  teaser: {
    figur: 'sabine',
    ausdruck: 'gruebelt',
    text: 'Die Bank will wissen, womit wir unser Geld verdienen. Reicht das GuV-Konto?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'sabine',
          ausdruck: 'gruebelt',
          text: 'Die Bank fragt: Wie viel verdient die MBG mit Getränken und wie viel kosten die Kredite?',
        },
        {
          figur: 'frank',
          ausdruck: 'neutral',
          text: 'Steht doch alles im GuV-Konto. Links Aufwand, rechts Ertrag, unten der Gewinn.',
        },
      ],
      frage: 'Das GuV-Konto zeigt den Gewinn. Warum reicht es der Bank trotzdem nicht?',
    },
    {
      typ: 'dialog',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie beim Haushaltsbuch mit Zwischensummen: erst Gehalt minus Fixkosten, dann minus Kreditraten, dann was übrig bleibt.',
        },
        {
          figur: 'leni',
          ausdruck: 'freut',
          text: 'Untereinander statt nebeneinander. Das heißt Staffelform.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die MBG zahlt ${e(MIETE_AUFWAND)} Miete für ein Lager und nimmt ${e(MIETE_ERTRAG)} Miete von einer Spedition ein. Darf sie in der GuV nur ${e(MIETE_AUFWAND.minus(MIETE_ERTRAG))} Mietaufwand zeigen?`,
      optionen: [
        { text: 'Ja, das ist übersichtlicher.' },
        { text: 'Nein, Aufwendungen und Erträge dürfen nicht verrechnet werden.', richtig: true },
        { text: 'Nur, wenn beide Verträge im selben Monat beginnen.' },
      ],
      aufloesung:
        'Es gilt das Bruttoprinzip (Verrechnungsverbot, § 246 Abs. 2 HGB): Beide Beträge stehen getrennt in der GuV. Sonst sähe niemand, wie groß Aufwand und Ertrag wirklich sind.',
    },
    {
      typ: 'konzept',
      titel: 'Kontoform oder Staffelform?',
      text: 'Einzelunternehmen und Personengesellschaften wie die MBG dürfen wählen. Kapitalgesellschaften müssen die Staffelform verwenden, entweder nach dem Gesamtkostenverfahren oder nach dem international üblichen Umsatzkostenverfahren (§ 275 HGB).',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Kontoform',
            text: 'Aufwand links, Ertrag rechts – wie ein T-Konto',
            farbe: '#1c6670',
          },
          {
            titel: 'Staffelform',
            text: 'untereinander, mit Zwischenergebnissen',
            farbe: '#65a30d',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Wohin gehört der Posten?',
      text: 'Ordne die Posten der MBG den Stufen der Staffel zu.',
      kategorien: ['Betriebsergebnis', 'Finanzergebnis', 'Steuern'],
      elemente: [
        { text: 'Umsatzerlöse aus Limonade und Bier', kategorie: 'Betriebsergebnis' },
        { text: 'Löhne und Gehälter im Werk', kategorie: 'Betriebsergebnis' },
        { text: 'Abschreibung auf die Abfüllanlage', kategorie: 'Betriebsergebnis' },
        {
          text: 'Zinsen für das Darlehen der Sparkasse',
          kategorie: 'Finanzergebnis',
          erklaerung: 'Zinsen und ähnliche Aufwendungen gehören ins Finanzergebnis.',
        },
        { text: 'Erträge aus einer Beteiligung an einem Großhändler', kategorie: 'Finanzergebnis' },
        {
          text: 'Kfz-Steuer für die Auslieferungs-Lkw',
          kategorie: 'Steuern',
          erklaerung: 'Gehört zu den sonstigen Steuern.',
        },
        {
          text: 'Gewerbesteuer',
          kategorie: 'Steuern',
          erklaerung: 'Gehört zu den Steuern vom Einkommen und vom Ertrag.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Staffel der MBG',
      text: 'Erfundene Jahreszahlen der MBG (Lernversion), Gesamtkostenverfahren.',
      schritte: [
        {
          text: 'Gesamtleistung',
          rechnung: `${e(UMSATZ)} Umsatzerlöse + ${e(BESTAND_PLUS)} Bestandserhöhung + ${e(SONST_ERTRAG)} sonstige betriebliche Erträge = ${e(GESAMTLEISTUNG)}`,
          warum: 'Alles, was die MBG im Jahr geleistet hat – auch das, was noch im Lager steht.',
        },
        {
          text: 'Betriebsergebnis',
          rechnung: `${e(GESAMTLEISTUNG)} − Material ${e(MATERIAL)} − Personal ${e(PERSONAL)} − Abschreibungen ${e(AFA)} − sonstige betriebliche Aufwendungen ${e(SONST_AUFWAND)} = ${e(BETRIEBSERGEBNIS)}`,
          warum:
            'So viel bringt das eigentliche Getränkegeschäft. International entspricht das im Wesentlichen dem EBIT.',
        },
        {
          text: 'Finanzergebnis',
          rechnung: `${e(ZINSERTRAG)} Zinserträge − ${e(ZINSAUFWAND)} Zinsaufwendungen = ${e(FINANZERGEBNIS)}`,
          warum:
            'Hier stehen Beteiligungs- und Zinserträge sowie Zinsen und ähnliche Aufwendungen.',
        },
        {
          text: 'Jahresüberschuss',
          rechnung: `${e(VOR_STEUERN)} − ${e(STEUERN_EE)} Steuern vom Einkommen und Ertrag − ${e(SONST_STEUERN)} sonstige Steuern = ${e(JUE)}`,
          warum: 'Erst nach allen Steuern steht fest, was das Jahr unter dem Strich gebracht hat.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Die MBG hat mehr Dosen abgefüllt als verkauft. Welches Verfahren zeigt die Bestandserhöhung als eigenen Posten?',
      optionen: [
        { text: 'Das Gesamtkostenverfahren', richtig: true },
        {
          text: 'Das Umsatzkostenverfahren',
          erklaerung: 'Es berücksichtigt nur die Kosten der verkauften Produkte.',
        },
        { text: 'Keines von beiden' },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Was gehört zum Jahresabschluss?',
      text: 'Decke auf, wer welchen Teil aufstellen muss.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          { titel: 'Bilanz', text: 'alle Kaufleute – Stichtag, Foto', farbe: '#1c6670' },
          { titel: 'GuV', text: 'alle Kaufleute – Zeitraum, Film (§ 242 HGB)', farbe: '#65a30d' },
          {
            titel: 'Anhang',
            text: 'Kapitalgesellschaften und Personengesellschaften mit Haftungsbeschränkung',
            farbe: '#ca8a04',
          },
          {
            titel: 'Lagebericht',
            text: 'zusätzlich mittelgroße und große dieser Gesellschaften',
            farbe: '#c2410c',
          },
        ],
      },
      fazit:
        'Die MBG ist eine OHG mit voll haftenden Gesellschaftern: Ihr Abschluss besteht aus Bilanz und GuV.',
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Ist der Jahresüberschuss einer Aktiengesellschaft dasselbe wie ihr Bilanzgewinn?',
      a: {
        figur: 'frank',
        ausdruck: 'neutral',
        text: 'Klar, Gewinn ist Gewinn. Zwei Wörter für dieselbe Zahl.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Nicht ganz. Erst werden Teile in die Rücklagen eingestellt, dann bleibt der Bilanzgewinn.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Jahresüberschuss minus Einstellung in die Rücklagen ergibt den Bilanzgewinn.',
          richtig: true,
        },
        { text: 'Der Bilanzgewinn ist der Jahresüberschuss vor Steuern.' },
        { text: 'Der Bilanzgewinn ist das Betriebsergebnis.' },
      ],
      aufloesung:
        'Behält eine Kapitalgesellschaft Gewinne ein (Thesaurierung), stellt sie diese in die Gewinnrücklagen ein. Der Rest ist der Bilanzgewinn bzw. Bilanzverlust.',
    },
    {
      typ: 'merksatz',
      id: 'F9-m1',
      frage: 'Wie ist die GuV in Staffelform aufgebaut?',
      text: 'Erst das Betriebsergebnis, dazu das Finanzergebnis; davon gehen die Steuern ab (vom Einkommen und Ertrag sowie sonstige) – das ergibt den Jahresüberschuss bzw. Jahresfehlbetrag. Nach Einstellung in Rücklagen bleibt der Bilanzgewinn bzw. Bilanzverlust. Aufwand und Ertrag werden nie verrechnet.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Erläutern Sie, wie sich in der GuV nach HGB das Ergebnis vom Betriebsergebnis bis zum Bilanzgewinn entwickelt.',
      part: {
        typ: 'kurzantwort',
        id: 'guv-staffel',
        frage:
          'Erläutern Sie, wie sich in der GuV nach HGB das Ergebnis vom Betriebsergebnis bis zum Bilanzgewinn entwickelt.',
        punkte: 4,
        checkliste: [
          {
            aussage:
              'Betriebsergebnis: Gesamtleistung abzüglich Material-, Personalaufwand, Abschreibungen und sonstiger betrieblicher Aufwendungen.',
            punkte: 1,
          },
          {
            aussage:
              'Finanzergebnis aus Beteiligungs-, Wertpapier- und Zinserträgen abzüglich Zinsen und ähnlicher Aufwendungen wird hinzugerechnet.',
            punkte: 1,
          },
          {
            aussage:
              'Nach Abzug der Steuern vom Einkommen und Ertrag sowie der sonstigen Steuern ergibt sich der Jahresüberschuss bzw. Jahresfehlbetrag.',
            punkte: 1,
          },
          {
            aussage:
              'Abzüglich der Einstellung in die Rücklagen ergibt sich der Bilanzgewinn bzw. Bilanzverlust.',
            punkte: 1,
          },
        ],
        muster:
          'Ausgangspunkt ist die Gesamtleistung. Zieht man Materialaufwand, Personalaufwand, Abschreibungen und sonstige betriebliche Aufwendungen ab, erhält man das Betriebsergebnis. Hinzu kommt das Finanzergebnis (Erträge aus Beteiligungen, Wertpapieren und Zinsen abzüglich Zinsen und ähnlicher Aufwendungen). Vom Ergebnis vor Steuern werden die Steuern vom Einkommen und Ertrag und die sonstigen Steuern abgezogen; das ergibt den Jahresüberschuss bzw. Jahresfehlbetrag. Werden Gewinne in Rücklagen eingestellt, bleibt der Bilanzgewinn bzw. Bilanzverlust.',
      },
      cliffhanger: {
        figur: 'sabine',
        ausdruck: 'ueberrascht',
        text: 'Ein Investor aus London fragt nach unseren Zahlen nach IFRS. Ist das nicht einfach HGB auf Englisch?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was besagt das Bruttoprinzip in der GuV?',
      optionen: [
        {
          text: 'Aufwendungen und Erträge dürfen nicht miteinander verrechnet werden.',
          richtig: true,
        },
        { text: 'Alle Beträge werden einschließlich Umsatzsteuer ausgewiesen.' },
        { text: 'Nur Erträge werden ausgewiesen.' },
      ],
    },
    {
      frage: 'Wer muss die GuV in Staffelform aufstellen?',
      optionen: [
        { text: 'Kapitalgesellschaften', richtig: true },
        { text: 'Alle Kaufleute' },
        { text: 'Nur Einzelunternehmen' },
      ],
    },
    {
      frage:
        'Betriebsergebnis 300.000 €, Finanzergebnis −40.000 €, Steuern 60.000 €. Wie hoch ist der Jahresüberschuss?',
      optionen: [
        { text: '200.000 €', richtig: true },
        { text: '280.000 €' },
        { text: '400.000 €' },
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
      'Gegen BA 7.1–7.2 geprüft (Bruttoprinzip, Konto-/Staffelform, GKV/UKV, Staffel bis Bilanzgewinn, Bestandteile des Jahresabschlusses); Finanzergebnis mit Abzug der Zinsaufwendungen (Lehrbrief-Druckfehler, siehe docs/m7/f2.md); Zahlen exakt summiert; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
