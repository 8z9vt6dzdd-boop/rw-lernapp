// Lektion C2 – Bezugskosten: Anschaffungsnebenkosten auf dem Unterkonto, Umbuchung, Verteilung
// (eigene Formulierung und eigene Zahlen; geprüft gegen BA 3.1.2; Buchungen nach 04-fachregeln.md GC-07
// und docs/m7/c1.md GC-C2-01/03). Alle Beträge rechnet die Engine.
import { rechneC2, solveC2, type C2Params } from '../../engine/generators/c1/c2-bezugskosten';
import { formatEuro, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value);
const BASIS: C2Params = {
  variante: 'einkauf',
  stoff: 'Rohstoffe',
  gegenstand: 'Zucker',
  partner: 'Zuckerkontor Hellwegland KG (Lippstadt)',
  ustSatz: '0.19',
  warenwert: '20000',
  posten: [{ art: 'Fracht', betrag: '500' }],
  gutschrift: '0',
  speditionBrutto: '595',
  zahlung: 'Kasse',
  rechnungNetto: '0',
  anteil: '0',
  zweiterStoff: 'Hilfsstoffe',
  zweiterGegenstand: 'Etiketten',
  zweiterWarenwert: '6000',
  kgErster: 6000,
  kgZweiter: 2000,
  fracht: '800',
  versicherung: '240',
  vorlage: 0,
};
const EK = solveC2(BASIS);
const SPED = solveC2({ ...BASIS, variante: 'spedition' });
const AUF = solveC2({ ...BASIS, variante: 'aufteilung', warenwert: '9000' });
const AUF_FALSCH = rechneC2(
  { ...BASIS, variante: 'aufteilung', warenwert: '9000' },
  { schluesselVertauscht: true },
);
const WARE = formatEuro(BASIS.warenwert);
const FRACHT = e(EK.bezugskosten);
const ANSCHAFFUNG = e(EK.warenwert.plus(EK.bezugskosten));

export const lektionC2: Lektion = {
  id: 'C2',
  skillId: 'C2-bezugskosten',
  abschnitt: 'C',
  titel: 'Was kostet der Zucker wirklich?',
  kernAha:
    'Alles, was nötig ist, damit ein Werkstoff bei uns ankommt (Fracht, Verpackung, Versicherung), gehört zu seinen Anschaffungskosten. Es wird auf dem Unterkonto Bezugskosten gesammelt und am Periodenende auf das Stoffkonto umgebucht.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 3.1.2 (Abb. 55–58, typische Bezugskosten); 04-fachregeln.md (GC-07); docs/m7/c1.md',
  teaser: {
    figur: 'tobias',
    ausdruck: 'gruebelt',
    text: `Auf der Zuckerrechnung stehen ${FRACHT} Fracht. Das sind doch Versandkosten, oder?`,
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        absender: BASIS.partner,
        nummer: '2026-0311',
        datum: '03.02.',
        zeilen: [
          { text: 'Zucker, 25 t', betrag: EK.warenwert.value.toString() },
          { text: 'Fracht frei Werk Paderborn', betrag: EK.bezugskosten.value.toString() },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: EK.vorsteuer.value.toString() },
          { text: 'Rechnungsbetrag', betrag: EK.rechnung.value.toString(), fett: true },
        ],
        fuss: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Fracht kenne ich, die buchen wir bei Lieferungen an Kunden immer auf Ausgangsfrachten.',
        },
        { figur: 'jana', ausdruck: 'gruebelt', text: 'Nur, wenn wir etwas verschicken.' },
      ],
      frage: 'Gehört die Fracht zum Zucker – oder ist sie ein eigener Aufwand?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Du bestellst ein Sofa für 800 € und zahlst 60 € Lieferung. Was hat dich das Sofa gekostet?',
        },
        {
          figur: 'tobias',
          ausdruck: 'ueberrascht',
          text: '860 €. Ohne Lieferung stünde es ja nicht in meinem Wohnzimmer.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genau. In der Buchhaltung heißen solche Kosten Anschaffungsnebenkosten, beim Einkauf von Werkstoffen Bezugskosten.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Einkauf oder Verkauf?',
      text: 'Bezugskosten entstehen, damit Ware zur MBG kommt. Ausgangsfrachten entstehen, wenn die MBG Ware an Kunden schickt.',
      kategorien: ['Bezugskosten (Einkauf)', 'Ausgangsfrachten (Verkauf)'],
      elemente: [
        {
          text: 'Spedition bringt Braumalz aus Warburg ins Werk',
          kategorie: 'Bezugskosten (Einkauf)',
          erklaerung: 'Transport zur MBG: Nebenkosten des Einkaufs.',
        },
        {
          text: 'Transportversicherung für eine Lieferung Aromen',
          kategorie: 'Bezugskosten (Einkauf)',
          erklaerung: 'Versicherung der eingekauften Ware gehört zu den Anschaffungskosten.',
        },
        {
          text: 'Lkw bringt Senne Lemon zum Getränkemarkt nach Detmold',
          kategorie: 'Ausgangsfrachten (Verkauf)',
          erklaerung: 'Versand an einen Kunden: Vertriebskosten.',
        },
        {
          text: 'Spezialverpackung, die der Etikettenlieferant berechnet',
          kategorie: 'Bezugskosten (Einkauf)',
          erklaerung: 'Verpackungskosten beim Einkauf sind Bezugskosten.',
        },
        {
          text: 'Paketdienst schickt Probedosen an ein Landhotel',
          kategorie: 'Ausgangsfrachten (Verkauf)',
          erklaerung: 'Die Ware verlässt die MBG Richtung Kunde.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Ein eigenes Unterkonto',
      text: 'Bezugskosten erhöhen die Anschaffungskosten des Werkstoffs. Zur Kontrolle sammelt die MBG sie zunächst auf einem Unterkonto, zum Beispiel „Bezugskosten für Rohstoffe“, und bucht sie spätestens am Jahresende auf das Stoffkonto um.',
      visual: {
        typ: 'tkonten',
        konten: [
          { name: 'Rohstoffe', soll: [{ text: 'Zucker', betrag: BASIS.warenwert }], haben: [] },
          {
            name: 'Bezugskosten für Rohstoffe',
            soll: [{ text: 'Fracht', betrag: EK.bezugskosten.value.toString() }],
            haben: [],
            untertitel: 'Unterkonto',
          },
          {
            name: 'Vorsteuer',
            soll: [{ text: 'Rechnung Zucker', betrag: EK.vorsteuer.value.toString() }],
            haben: [],
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: 'Worauf berechnet der Lieferer die Umsatzsteuer?',
      optionen: [
        { text: 'Nur auf den Zucker' },
        { text: 'Auf Zucker und Fracht zusammen', richtig: true },
        { text: 'Gar nicht – Fracht ist steuerfrei' },
      ],
      aufloesung: `Bezugskosten sind umsatzsteuerpflichtig: (${WARE} + ${FRACHT}) × 19 % = ${e(EK.vorsteuer)}. Die MBG holt sich diese Vorsteuer vollständig vom Finanzamt zurück.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Von der Rechnung bis zur Umbuchung',
      text: `Zucker ${WARE} netto, Fracht ${FRACHT} netto, 19 % Umsatzsteuer, auf Ziel.`,
      schritte: [
        {
          text: 'Eingangsrechnung buchen',
          rechnung: `Rohstoffe ${WARE}, Bezugskosten für Rohstoffe ${FRACHT}, Vorsteuer ${e(EK.vorsteuer)} an Verbindlichkeiten a. LL ${e(EK.rechnung)}`,
          warum: 'Warenwert aufs Stoffkonto, Fracht aufs Unterkonto, Steuer auf Vorsteuer.',
        },
        {
          text: 'Am Periodenende umbuchen',
          rechnung: `Rohstoffe an Bezugskosten für Rohstoffe ${FRACHT}`,
          warum:
            'Das Unterkonto wird über sein Hauptkonto abgeschlossen. Der Sollsaldo wandert ins Soll des Stoffkontos.',
        },
        {
          text: 'Anschaffungskosten des Zuckers',
          rechnung: `${WARE} + ${FRACHT} = ${ANSCHAFFUNG}`,
          warum: 'So viel hat es gekostet, den Zucker ins Silo zu bekommen.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Die Speditionsrechnung',
      text: `Eine Spedition bringt Zucker ins Werk und kassiert ${e(SPED.rechnung)} brutto bar. Ein Kollege hat gebucht. Welche Zeile ist falsch?`,
      zeilen: [
        `Soll: Ausgangsfrachten ${e(SPED.bezugskosten)}`,
        `Soll: Vorsteuer ${e(SPED.vorsteuer)}`,
        `Haben: Kasse ${e(SPED.rechnung)}`,
      ],
      fehlerZeile: 0,
      gruende: [
        {
          text: 'Die Fracht bringt Ware zur MBG: Das sind Bezugskosten für Rohstoffe.',
          richtig: true,
        },
        { text: 'Bei Barzahlung gibt es keine Vorsteuer.' },
        { text: `Die Kasse müsste ${e(SPED.bezugskosten)} zeigen.` },
      ],
      aufloesung: `Richtig ist: Bezugskosten für Rohstoffe ${e(SPED.bezugskosten)}, Vorsteuer ${e(SPED.vorsteuer)} an Kasse ${e(SPED.rechnung)}. Ausgangsfrachten gibt es nur beim Verkauf.`,
    },
    {
      typ: 'verstaendnis',
      frage: `Eine Sammelladung bringt ${BASIS.kgErster / 1000} t Zucker (Wert ${formatEuro('9000')}) und ${BASIS.kgZweiter / 1000} t Etiketten (Wert ${formatEuro(BASIS.zweiterWarenwert)}). Die Fracht kostet ${formatEuro(BASIS.fracht)}. Wie viel davon gehört zum Zucker?`,
      optionen: [
        {
          text: e(AUF.frachtErster),
          richtig: true,
          erklaerung:
            'Fracht ist eine Gewichtsspese und wird nach Gewicht verteilt: 6 von 8 Tonnen.',
        },
        {
          text: e(AUF_FALSCH.frachtErster),
          erklaerung:
            'Das wäre die Verteilung nach dem Warenwert – die gilt für Wertspesen wie die Versicherung.',
        },
        {
          text: formatEuro('400'),
          erklaerung: 'Halbe-halbe wäre bequem, entspricht aber nicht der Verursachung.',
        },
      ],
      figur: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Schwere Ware verursacht mehr Fracht. Teure Ware braucht mehr Versicherung.',
      },
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'In dieser Rechnung steckt die Fracht im Nettobetrag. Rechne den Frachtanteil heraus und ermittle die Vorsteuer.',
      skillId: 'C2-bezugskosten',
      seed: 6,
      variant: 'frachtanteil',
      partId: 'rechnung',
      gefragt: ['bezugskosten', 'vorsteuer'],
    },
    {
      typ: 'merksatz',
      id: 'C2-m1',
      frage: 'Wie werden Bezugskosten beim Werkstoffeinkauf gebucht?',
      text: 'Bezugskosten (Fracht, Verpackung, Versicherung des Einkaufs) sind Anschaffungsnebenkosten: netto auf das Unterkonto „Bezugskosten für …“, Vorsteuer abziehen, am Periodenende „Stoffkonto an Bezugskosten“ umbuchen.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für die Speditionsrechnung.',
      part: { skillId: 'C2-bezugskosten', seed: 3, variant: 'spedition', partId: 'buchung' },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'entsetzt',
        text: 'Die neuen Etiketten von Schlüter sind verschmiert. Ein Viertel der Rollen geht zurück!',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Rohstoffe 10.000 € netto plus Fracht 200 € netto, 19 % USt. Wie hoch ist die Vorsteuer?',
      optionen: [
        { text: '1.938,00 €', richtig: true },
        { text: '1.900,00 €' },
        { text: '38,00 €' },
      ],
    },
    {
      frage: 'Auf welches Konto gehört die Eingangsfracht für Hilfsstoffe?',
      optionen: [
        { text: 'Bezugskosten für Hilfsstoffe', richtig: true },
        { text: 'Ausgangsfrachten' },
        { text: 'Nachlässe für Hilfsstoffe' },
      ],
    },
    {
      frage: 'Wie wird das Konto „Bezugskosten für Rohstoffe“ am Periodenende abgeschlossen?',
      optionen: [
        { text: 'Rohstoffe an Bezugskosten für Rohstoffe', richtig: true },
        { text: 'Bezugskosten für Rohstoffe an Rohstoffe' },
        { text: 'GuV an Bezugskosten für Rohstoffe' },
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
      'Gegen BA 3.1.2 (Abb. 56–58: Unterkonto, Umsatzsteuerpflicht, Umbuchung) geprüft; Verteilung nach Gewicht/Wert nach Lehrbuch-Übung (Curriculum C2); Zahlen aus der Engine (GC-07, GC-C2-01/03); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
