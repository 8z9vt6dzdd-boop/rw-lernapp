// Lektion G2 – Abgrenzung: neutraler Aufwand, Grund-, Anders- und Zusatzkosten, Ergebnistabelle
// (eigene Formulierung; geprüft gegen K1 Kap. 1.2, S. 26–29, und Kap. 1.6, S. 41–42).
// Alle Beträge kommen aus der Engine (generators/g/g2-abgrenzung.ts, GC-G2-2).
import { solveErgebnistabelle, type EtParams } from '../../engine/generators/g/g2-abgrenzung';
import { formatEuro, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

const JANUAR: EtParams = {
  umsatz: '900000',
  zinsertraege: '6000',
  mietertraege: '4000',
  rohstoffe: '310000',
  loehne: '180000',
  gehaelter: '95000',
  afaFb: '72000',
  afaKalk: '64000',
  zinsFb: '9000',
  zinsKalk: '15000',
  steuern: '21000',
  steuerNachzahlung: '5000',
  spende: '3000',
  unternehmerlohn: '12000',
};
const S = solveErgebnistabelle(JANUAR);

const NEUTRAL = ['betriebsfremd', 'periodenfremd', 'außerordentlich', 'Kosten (Zweckaufwand)'];

export const lektionG2: Lektion = {
  id: 'G2',
  skillId: 'G2-abgrenzung',
  abschnitt: 'G',
  titel: 'Abgrenzung: Was die Kostenrechnung aussortiert',
  kernAha:
    'Nicht jeder Aufwand ist Kosten: Neutraler Aufwand (betriebsfremd, periodenfremd, außerordentlich) bleibt draußen, Grundkosten werden in gleicher Höhe übernommen, Anderskosten anders bewertet, Zusatzkosten kommen ohne Aufwand hinzu. Die Ergebnistabelle stimmt beides ab: Gesamtergebnis = neutrales Ergebnis + Betriebsergebnis.',
  dauerMin: 8,
  figuren: ['leni', 'jana', 'tobias'],
  ort: 'buero',
  quelle: 'K1 1.2 (S. 26–29), 1.6 (S. 41–42)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: '690.000 € Aufwand im Januar. Wie viel davon soll eine Dose Senne Lemon tragen?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: `Hier ist der Januar: ${e(S.summen.aufwand)} Aufwand. Darin stecken eine Spende, eine Steuernachzahlung fürs Vorjahr und die bilanziellen Abschreibungen.`,
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Und der Lohn für Frank und Sabine fehlt ganz. So kann ich keine Dose kalkulieren.',
        },
      ],
      frage: 'Welche dieser Beträge gehören in die Kosten einer Dose – und welche nicht?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Wie bei einer Reisekostenabrechnung: Das private Abendessen kommt nicht hinein, auch wenn du es bezahlt hast.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Aufwand, der nicht zum Betrieb, nicht in den Monat oder nicht zum normalen Ablauf gehört, heißt neutraler Aufwand.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Neutral – und wenn ja, welche Art?',
      kategorien: NEUTRAL,
      elemente: [
        {
          text: 'Spende an ein Kinderhospiz',
          kategorie: 'betriebsfremd',
          erklaerung: 'Hat mit Getränken nichts zu tun.',
        },
        {
          text: 'Kursverlust bei Aktien, die als Geldanlage gekauft wurden',
          kategorie: 'betriebsfremd',
        },
        {
          text: 'Gewerbesteuer-Nachzahlung für das Vorjahr',
          kategorie: 'periodenfremd',
          erklaerung: 'Die Ursache liegt im Vorjahr.',
        },
        { text: 'Nicht versicherter Brandschaden im Leergutlager', kategorie: 'außerordentlich' },
        { text: 'Gehälter der Verwaltung für Januar', kategorie: 'Kosten (Zweckaufwand)' },
        {
          text: 'Feuerversicherung des Werks für Januar',
          kategorie: 'Kosten (Zweckaufwand)',
          erklaerung: 'Betrieblich, im Monat, gewöhnlich: Zweckaufwand.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Aufwand und Kosten im Vergleich',
      text: 'Neutraler Aufwand wird keine Kosten. Der Zweckaufwand wird Kosten: in gleicher Höhe als Grundkosten oder anders bewertet als Anderskosten. Zusatzkosten haben gar keinen Aufwand. Anders- und Zusatzkosten heißen kalkulatorische Kosten.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Neutraler Aufwand', text: 'nur Buchhaltung, keine Kosten', farbe: '#e8792b' },
          { titel: 'Grundkosten', text: 'Aufwand = Kosten, gleicher Betrag', farbe: '#1c6670' },
          {
            titel: 'Anderskosten',
            text: 'Aufwand vorhanden, Kosten anders bewertet',
            farbe: '#8cbf3f',
          },
          { titel: 'Zusatzkosten', text: 'Kosten ohne Aufwand', farbe: '#e2b13c' },
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: `Die Buchhaltung schreibt die Abfüllanlage mit ${formatEuro(JANUAR.afaFb)} ab, Leni rechnet mit ${formatEuro(JANUAR.afaKalk)}. Welcher Betrag gehört in die Kosten?`,
      a: {
        figur: 'jana',
        ausdruck: 'neutral',
        text: `Gebucht sind ${formatEuro(JANUAR.afaFb)}. Mehr Wahrheit gibt es nicht.`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Die Bilanz folgt Gesetz und Steuerrecht, ich dem tatsächlichen Wertverzehr. In die Kosten kommen ${formatEuro(JANUAR.afaKalk)}.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die kalkulatorische Abschreibung bildet den Wertverzehr ab und ist Anderskosten; der bilanzielle Betrag wird nur abgegrenzt.',
          richtig: true,
        },
        { text: 'Abschreibungen sind immer neutraler Aufwand.' },
        { text: 'Es zählt immer der höhere Betrag.' },
      ],
      aufloesung:
        'Beide Zahlen sind richtig – jede in ihrem System. Die Buchhaltung bleibt bei ihrem Betrag, die Kostenrechnung setzt den kalkulatorischen Wert an.',
    },
    {
      typ: 'vorhersage',
      frage:
        'Frank und Sabine Wessel arbeiten voll in der MBG mit, beziehen aber als Gesellschafter kein Gehalt. Was setzt Leni dafür an?',
      optionen: [
        { text: 'Nichts – es wurde ja nichts gezahlt' },
        { text: 'Einen kalkulatorischen Unternehmerlohn als Zusatzkosten', richtig: true },
        { text: 'Anderskosten in Höhe der Privatentnahmen' },
      ],
      aufloesung: `Ohne Unternehmerlohn sähe die MBG billiger aus als ein Betrieb, der eine Geschäftsführung bezahlt. Leni setzt deshalb ${formatEuro(JANUAR.unternehmerlohn!)} als Zusatzkosten an – Kosten ohne Aufwand.`,
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Praktikant füllt die Ergebnistabelle',
      text: 'In einer Zeile steckt ein Fehler.',
      zeilen: [
        `Umsatzerlöse ${formatEuro(JANUAR.umsatz)} → Leistungen`,
        `Spende ${formatEuro(JANUAR.spende!)} → Kosten`,
        `Abschreibungen: Aufwand lt. FB ${formatEuro(JANUAR.afaFb)}, verrechnete Kosten ${formatEuro(JANUAR.afaKalk)}`,
        `Kalkulatorischer Unternehmerlohn ${formatEuro(JANUAR.unternehmerlohn!)} → verrechnete Kosten und Kosten`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Die Spende ist betriebsfremd und gehört in den neutralen Aufwand.',
          richtig: true,
        },
        { text: 'Umsatzerlöse sind neutrale Erträge.' },
        { text: 'Der Unternehmerlohn gehört in die Spalte Aufwand lt. FB.' },
      ],
      aufloesung:
        'Neutraler Aufwand bleibt im Abgrenzungsbereich. In die Kosten käme sonst ein Betrag, den keine Dose verursacht hat.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Ergebnistabelle des Januars',
      text: 'Rechnungskreis I ist die Buchhaltung, Rechnungskreis II die Kostenrechnung. Dazwischen liegt der Abgrenzungsbereich.',
      schritte: [
        {
          text: 'Gesamtergebnis der Buchhaltung',
          rechnung: `${e(S.summen.ertrag)} − ${e(S.summen.aufwand)} = ${e(S.gesamtergebnis)}`,
          warum: 'Alle Erträge minus alle Aufwendungen, wie in der GuV.',
        },
        {
          text: 'Unternehmensbezogene Abgrenzung',
          rechnung: `neutrale Erträge ${e(S.summen.nE)} − neutraler Aufwand ${e(S.summen.nA)} = ${e(S.ergebnisAbgrenzung)}`,
          warum:
            'Zinsen aus Festgeld, Miete aus dem Wohnhaus, Spende und Steuernachzahlung werden herausgehalten.',
        },
        {
          text: 'Kostenrechnerische Korrekturen',
          rechnung: `verrechnete Kosten ${e(S.summen.vk)} − Aufwand lt. FB ${e(S.summen.afb)} = ${e(S.ergebnisKorrekturen)}`,
          warum:
            'Kalkulatorische Abschreibungen, Zinsen und Unternehmerlohn ersetzen bzw. ergänzen den gebuchten Aufwand.',
        },
        {
          text: 'Betriebsergebnis und Abstimmung',
          rechnung: `${e(S.summen.l)} − ${e(S.summen.k)} = ${e(S.betriebsergebnis)}; ${e(S.neutral)} + ${e(S.betriebsergebnis)} = ${e(S.gesamtergebnis)}`,
          warum: 'Neutrales Ergebnis plus Betriebsergebnis ergibt genau das Gesamtergebnis.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Die Kostenrechnung verrechnet insgesamt mehr kalkulatorische Kosten, als die Buchhaltung dafür an Aufwand gebucht hat. Was gilt für das Ergebnis aus kostenrechnerischen Korrekturen?',
      optionen: [
        {
          text: 'Es ist positiv; das Betriebsergebnis ist entsprechend niedriger.',
          richtig: true,
          erklaerung:
            'Verrechnete Kosten − Aufwand lt. FB > 0. Mehr Kosten drücken das Betriebsergebnis, das Gesamtergebnis bleibt gleich.',
        },
        {
          text: 'Es ist negativ; das Gesamtergebnis sinkt.',
          erklaerung:
            'Das Gesamtergebnis der Buchhaltung ändert sich durch die Kostenrechnung nie.',
        },
        {
          text: 'Es ist immer null.',
          erklaerung:
            'Null wäre es nur, wenn alle kalkulatorischen Werte dem gebuchten Aufwand entsprächen.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'G2-m1',
      frage: 'Wie werden Aufwand und Kosten voneinander abgegrenzt?',
      text: 'Neutraler Aufwand (betriebsfremd, periodenfremd, außerordentlich) ist keine Kosten. Zweckaufwand wird Kosten: Grundkosten in gleicher Höhe, Anderskosten anders bewertet. Zusatzkosten haben keinen Aufwand. Ergebnistabelle: Gesamtergebnis = neutrales Ergebnis + Betriebsergebnis.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Prüfen Sie für jeden Sachverhalt, ob neutraler Aufwand (mit Art), Grundkosten, Anderskosten, Zusatzkosten oder weder Aufwand noch Kosten vorliegen. Abrechnungsperiode ist der laufende Monat.',
      part: { skillId: 'G2-abgrenzung', seed: 2, variant: 'zuordnung', partId: 'zuordnung' },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Leni will die Abfüllanlage künftig mit ihrem Wiederbeschaffungswert ansetzen statt mit dem gezahlten Preis. Morgen will ich wissen, was Kosten eigentlich sind.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie heißt Aufwand, dem in der Periode keine Kosten gegenüberstehen?',
      optionen: [
        { text: 'Neutraler Aufwand', richtig: true },
        { text: 'Zusatzkosten' },
        { text: 'Grundkosten' },
      ],
    },
    {
      frage: 'Kalkulatorische Abschreibung vom Wiederbeschaffungswert ist …',
      optionen: [
        { text: 'Anderskosten', richtig: true },
        { text: 'Zusatzkosten' },
        { text: 'neutraler Aufwand' },
      ],
    },
    {
      frage: 'Wie lautet die Abstimmung in der Ergebnistabelle?',
      optionen: [
        { text: 'Gesamtergebnis = neutrales Ergebnis + Betriebsergebnis', richtig: true },
        { text: 'Betriebsergebnis = Gesamtergebnis + neutrales Ergebnis' },
        { text: 'Neutrales Ergebnis = Kosten − Leistungen' },
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
      'K1 1.2 (S. 26–29: neutraler Aufwand mit drei Arten und Beispielen, Zweckaufwand, Grund-, Anders-, Zusatzkosten, kalkulatorische Kosten) und K1 1.6 (S. 41–42: Ergebnistabelle, unternehmensbezogene Abgrenzung, kostenrechnerische Korrekturen, Gesamtergebnis = neutrales Ergebnis + Betriebsergebnis) abgeglichen am 03.11.2026; Zahlen aus der Engine (GC-G2-2)',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
