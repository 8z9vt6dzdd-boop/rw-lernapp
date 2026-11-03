// Lektion H7 – Buchung kalkulatorischer Kosten, Fremdleistungen, Abgaben an die öffentliche Hand
// (eigene Formulierung und eigene Zahlen; geprüft gegen K1 Kap. 2.5–2.7, S. 85–87).
import { Val, formatEuro } from '../../engine/money';
import type { AuswahlFeld } from '../../engine/task';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value);

// Beispiel: kalkulatorische und bilanzielle Ansätze eines Monats
const KALK = { afa: new Val('15000'), zinsen: new Val('5000'), lohn: new Val('40000') };
const BILANZ = { afa: new Val('10000'), zinsen: new Val('7000') };
const SUMME_KALK = KALK.afa.plus(KALK.zinsen).plus(KALK.lohn);
const SUMME_BILANZ = BILANZ.afa.plus(BILANZ.zinsen);
const SALDO_ABGRENZUNG = SUMME_KALK.minus(SUMME_BILANZ);
const WIRKUNG_GUV = SALDO_ABGRENZUNG.minus(SUMME_KALK);

// Fremdleistung: Reparaturrechnung
const REP_NETTO = new Val('2000');
const REP_BRUTTO = REP_NETTO.times('1.19');

const ARTEN = ['Grundkosten', 'Anderskosten', 'Zusatzkosten', 'Keine Kosten'];
const auswahl = (id: string, label: string, soll: string): AuswahlFeld => ({
  typ: 'auswahl',
  id,
  label,
  optionen: ARTEN,
  soll,
});

export const lektionH7: Lektion = {
  id: 'H7',
  skillId: 'H7-sonstige-kostenarten',
  abschnitt: 'H',
  titel: 'Kalkulatorische Kosten buchen, Fremdleistungen und Abgaben',
  kernAha:
    'Kalkulatorische Kosten werden in der Kostenrechnung gebucht und auf einem Gegenkonto als verrechnete Kosten wieder gutgeschrieben – das Gesamtergebnis bleibt unverändert. Fremdleistungen und Kostensteuern, Gebühren und Beiträge sind Grundkosten; Umsatzsteuer und Gewinnsteuern sind keine Kosten.',
  dauerMin: 8,
  figuren: ['frank', 'leni', 'jana'],
  ort: 'buero',
  quelle: 'K1 2.5–2.7 (S. 85–87)',
  teaser: {
    figur: 'frank',
    ausdruck: 'ueberrascht',
    text: 'Leni rechnet zehntausende Euro kalkulatorische Kosten zusätzlich. Ist der Gewinn jetzt kleiner?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'ueberrascht',
          text: `Leni setzt diesen Monat ${e(SUMME_KALK)} kalkulatorische Kosten an, in der Buchhaltung stehen nur ${e(SUMME_BILANZ)} Aufwand.`,
        },
        {
          figur: 'frank',
          ausdruck: 'entsetzt',
          text: 'Ist unser Gewinn jetzt um den Unterschied kleiner?',
        },
      ],
      frage: 'Verändern kalkulatorische Kosten den Gewinn in der Gewinn- und Verlustrechnung?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir ein Haushaltsbuch vor, in dem du dir für dein eigenes Zimmer eine Miete anrechnest. Auf der anderen Seite schreibst du dieselbe Miete als gedachte Einnahme gut – dein Kontostand ändert sich nicht.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'So machen wir es auch: kalkulatorische Kosten in der Kostenrechnung, Gegenbuchung als verrechnete kalkulatorische Kosten. Beides landet am Ende in der GuV und hebt sich auf.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Kalkulatorisch: Abschreibungen ${e(KALK.afa)}, Zinsen ${e(KALK.zinsen)}, Unternehmerlohn ${e(KALK.lohn)}. Bilanziell: Abschreibungen ${e(BILANZ.afa)}, Zinsaufwand ${e(BILANZ.zinsen)}. Um wie viel ändert die Buchung der kalkulatorischen Kosten das Gesamtergebnis?`,
      optionen: [
        { text: 'Gar nicht, die Buchung ist erfolgsneutral.', richtig: true },
        { text: `Es sinkt um ${e(SUMME_KALK)}.` },
        { text: `Es sinkt um ${e(SALDO_ABGRENZUNG)}.` },
      ],
      aufloesung: `Das Betriebsergebnis trägt ${e(SUMME_KALK)} Kosten. Im Abgrenzungsbereich stehen dem ${e(SUMME_KALK)} verrechnete Kosten gegenüber, abzüglich ${e(SUMME_BILANZ)} tatsächlichem Aufwand. In der GuV bleibt wie ohne Kostenrechnung genau der Aufwand von ${e(SUMME_BILANZ)} übrig.`,
    },
    {
      typ: 'konzept',
      titel: 'Zwei Konten, ein Betrag',
      text: 'Im Gemeinschaftskontenrahmen der Industrie: kalkulatorische Kosten in Kontenklasse 4 (Abschluss über das Betriebsergebnis), Gegenbuchung in Kontenklasse 2 als verrechnete kalkulatorische Kosten (Abschluss über das Abgrenzungssammelkonto).',
      visual: {
        typ: 'tkonten',
        konten: [
          {
            name: 'Kalkulatorische Zinsen',
            untertitel: 'Kontenklasse 4',
            soll: [{ text: 'Verrechnete kalk. Zinsen', betrag: KALK.zinsen.value.toString() }],
            haben: [{ text: 'Betriebsergebnis', betrag: KALK.zinsen.value.toString() }],
          },
          {
            name: 'Verrechnete kalkulatorische Zinsen',
            untertitel: 'Kontenklasse 2',
            soll: [{ text: 'Abgrenzungssammelkonto', betrag: KALK.zinsen.value.toString() }],
            haben: [{ text: 'Kalk. Zinsen', betrag: KALK.zinsen.value.toString() }],
          },
        ],
      },
    },
    {
      typ: 'fehlerjagd',
      titel: 'Buchungen der kalkulatorischen Kosten',
      text: 'Ein Kollege hat die kalkulatorischen Kosten des Monats gebucht. Eine Zeile ist falsch.',
      zeilen: [
        `Kalkulatorische Abschreibungen an Verrechnete kalkulatorische Abschreibungen ${e(KALK.afa)}`,
        `Kalkulatorische Zinsen an Verrechnete kalkulatorische Zinsen ${e(KALK.zinsen)}`,
        `Kalkulatorischer Unternehmerlohn an Bank ${e(KALK.lohn)}`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Kalkulatorische Kosten führen zu keiner Zahlung; Gegenkonto ist der verrechnete kalkulatorische Unternehmerlohn.',
          richtig: true,
        },
        { text: 'Kalkulatorische Abschreibungen werden direkt gegen das Anlagenkonto gebucht.' },
        { text: 'Kalkulatorische Zinsen gehören auf das Konto Zinsaufwand.' },
      ],
      aufloesung:
        'An die Gesellschafter fließt kein Geld. Der Unternehmerlohn wird nur verrechnet, damit er in der Kalkulation steckt.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Warum der Gewinn gleich bleibt',
      schritte: [
        {
          text: 'Betriebsergebnis',
          rechnung: `${e(KALK.afa)} + ${e(KALK.zinsen)} + ${e(KALK.lohn)} = ${e(SUMME_KALK)} Kosten`,
          warum: 'Die Kostenrechnung arbeitet mit den kalkulatorischen Werten.',
        },
        {
          text: 'Abgrenzungssammelkonto',
          rechnung: `${e(SUMME_KALK)} verrechnete Kosten − ${e(SUMME_BILANZ)} bilanzieller Aufwand = Saldo ${e(SALDO_ABGRENZUNG)}`,
          warum:
            'Hier treffen die verrechneten kalkulatorischen Kosten auf den tatsächlichen Aufwand.',
        },
        {
          text: 'Wirkung in der GuV',
          rechnung: `${e(SALDO_ABGRENZUNG)} − ${e(SUMME_KALK)} = ${e(WIRKUNG_GUV)}`,
          warum:
            'Übrig bleibt genau der bilanzielle Aufwand. Die kalkulatorischen Kosten sind erfolgsneutral.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Abgaben an die öffentliche Hand: Kosten oder nicht?',
      kategorien: ['Kosten', 'Keine Kosten'],
      elemente: [
        {
          text: 'Kraftfahrzeugsteuer für die Auslieferungs-Lkw',
          kategorie: 'Kosten',
          erklaerung: 'Kostensteuer: Sie hängt ursächlich mit der Leistungserstellung zusammen.',
        },
        { text: 'Grundsteuer für das Werksgelände', kategorie: 'Kosten' },
        {
          text: 'Umsatzsteuer auf eine Aromarechnung',
          kategorie: 'Keine Kosten',
          erklaerung: 'Durchlaufender Posten in der Finanzbuchhaltung.',
        },
        {
          text: 'Einkommensteuer der Gesellschafter',
          kategorie: 'Keine Kosten',
          erklaerung: 'Gewinnsteuern sind Folge, nicht Voraussetzung der betrieblichen Tätigkeit.',
        },
        {
          text: 'Pflichtbeitrag an die Industrie- und Handelskammer',
          kategorie: 'Kosten',
          erklaerung: 'Beiträge und Gebühren (etwa Zölle oder Maut) sind Grundkosten.',
        },
        { text: 'Maut für die Lkw-Touren nach Bielefeld', kategorie: 'Kosten' },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Gehören Gewinnsteuern in die Kalkulation der Dosenpreise?',
      a: {
        figur: 'frank',
        ausdruck: 'neutral',
        text: 'Steuer ist Steuer. Die Einkommensteuer zahlen wir genauso wie die Kfz-Steuer.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Die Kfz-Steuer brauchen wir, um überhaupt ausliefern zu können. Die Gewinnsteuer entsteht erst, wenn wir Gewinn gemacht haben.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Gewinnsteuern sind Folge und nicht Voraussetzung des Wirtschaftens; nur Kostensteuern sind Kosten.',
          richtig: true,
        },
        { text: 'Die Einkommensteuer wird vom Finanzamt erstattet.' },
        { text: 'Alle Steuern sind durchlaufende Posten.' },
      ],
      aufloesung:
        'Eine Firma kann auch mit Verlust oder einem Gewinn von null arbeiten – Gewinnsteuern sind also keine Voraussetzung der Leistungserstellung.',
    },
    {
      typ: 'verstaendnis',
      frage: `Eine Werkstatt repariert die Sirupanlage und berechnet ${e(REP_BRUTTO)} einschließlich 19 % Umsatzsteuer. Mit welchem Betrag gehen die Kosten für diese Fremdleistung in die Kostenrechnung?`,
      optionen: [
        {
          text: e(REP_NETTO),
          richtig: true,
          erklaerung:
            'Kosten für Fremdleistungen werden mit dem Nettorechnungsbetrag angesetzt. Sie sind Grundkosten.',
        },
        {
          text: e(REP_BRUTTO),
          erklaerung: 'Die Umsatzsteuer ist keine Kostensteuer, sondern ein durchlaufender Posten.',
        },
        {
          text: e(REP_BRUTTO.minus(REP_NETTO)),
          erklaerung: 'Das ist nur die Umsatzsteuer.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Auf den Strom für die Abfüllanlage erhebt der Staat eine Ökosteuer. Hat sie Kostencharakter?',
      optionen: [
        {
          text: 'Ja, als Verbrauchsteuer ist sie Teil des Einstandspreises für Energie.',
          richtig: true,
          erklaerung: 'Ohne Energie keine Abfüllung: Die Steuer hängt an der Leistungserstellung.',
        },
        {
          text: 'Nein, Steuern sind nie Kosten.',
          erklaerung: 'Kostensteuern wie Kfz-, Grund- oder Verbrauchsteuern sind Kosten.',
        },
        {
          text: 'Nein, sie ist wie die Einkommensteuer eine Gewinnsteuer.',
          erklaerung: 'Sie fällt mit dem Energieverbrauch an, nicht erst mit einem Gewinn.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'H7-m1',
      frage: 'Wie werden kalkulatorische Kosten gebucht und welche Abgaben sind Kosten?',
      text: 'Kalkulatorische Kosten (Klasse 4, Betriebsergebnis) an verrechnete kalkulatorische Kosten (Klasse 2, Abgrenzungssammelkonto): erfolgsneutral. Fremdleistungen netto als Grundkosten. Kostensteuern, Gebühren, Beiträge sind Grundkosten; Umsatzsteuer und Gewinnsteuern keine Kosten.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Ordnen Sie die Sachverhalte zu: Grundkosten, Anderskosten, Zusatzkosten oder keine Kosten.',
      part: {
        typ: 'rechenkette',
        id: 'kostenarten',
        titel: 'Einordnung',
        felder: [
          auswahl('kfz', 'Kraftfahrzeugsteuer für den Fuhrpark', 'Grundkosten'),
          auswahl('ust', 'Umsatzsteuer auf eine Eingangsrechnung', 'Keine Kosten'),
          auswahl('rep', 'Reparatur der Sirupanlage durch eine Fremdfirma (netto)', 'Grundkosten'),
          auswahl('est', 'Einkommensteuer der Gesellschafter', 'Keine Kosten'),
          auswahl('lohn', 'Kalkulatorischer Unternehmerlohn in der OHG', 'Zusatzkosten'),
          auswahl('wagnis', 'Kalkulatorisches Beständewagnis', 'Anderskosten'),
        ],
      },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Alle Kostenarten sind erfasst. Aber wo sind sie angefallen: in der Abfüllung, im Lager oder in der Verwaltung?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie wirkt die Buchung kalkulatorischer Kosten auf das Gesamtergebnis der GuV?',
      optionen: [
        { text: 'Sie ist erfolgsneutral.', richtig: true },
        { text: 'Sie mindert den Gewinn um die kalkulatorischen Kosten.' },
        { text: 'Sie erhöht den Gewinn um die Zusatzkosten.' },
      ],
    },
    {
      frage: 'Welche Steuer ist eine Kostensteuer?',
      optionen: [
        { text: 'Grundsteuer', richtig: true },
        { text: 'Umsatzsteuer' },
        { text: 'Körperschaftsteuer' },
      ],
    },
    {
      frage: 'Mit welchem Betrag werden Fremdleistungen in der Kostenrechnung angesetzt?',
      optionen: [
        { text: 'Mit dem Nettorechnungsbetrag', richtig: true },
        { text: 'Mit dem Bruttorechnungsbetrag' },
        { text: 'Mit einem kalkulatorischen Aufschlag' },
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
      'K1 Kap. 2.5 (S. 85–86: Klasse 4/Klasse 2, Betriebsergebnis, Abgrenzungssammelkonto, erfolgsneutral), 2.6 (S. 86: Fremdleistungen netto, Grundkosten), 2.7 (S. 86–87: Kostensteuern, keine USt und Gewinnsteuern, Gebühren und Beiträge als Grundkosten) sowie Lösungshinweis zur Ökosteuer abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
