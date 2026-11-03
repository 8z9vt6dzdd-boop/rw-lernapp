// Fehlertypen M7, Batch g (KLR-Grundlagen G1–G5, Lehrbrief K1 Kap. 1).
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_G: Record<string, Fehlertyp> = {
  // G1 – Grundbegriffe
  'auszahlung-ausgabe-verwechselt': {
    titel: 'Auszahlung und Ausgabe verwechselt',
    erklaerung:
      'Auszahlung heißt: Geld verlässt Kasse oder Bankkonto. Ausgabe heißt: Das Geldvermögen (Kasse + Forderungen − Verbindlichkeiten) sinkt. Wer eine alte Rechnung bezahlt oder ein Darlehen tilgt, hat eine Auszahlung, aber keine Ausgabe; wer auf Ziel kauft, hat eine Ausgabe, aber noch keine Auszahlung.',
  },
  'einzahlung-einnahme-verwechselt': {
    titel: 'Einzahlung und Einnahme verwechselt',
    erklaerung:
      'Einzahlung heißt: Geld fließt zu. Einnahme heißt: Das Geldvermögen steigt, etwa durch einen Verkauf auf Ziel. Zahlt ein Kunde eine alte Rechnung oder nimmt die MBG ein Darlehen auf, ist das nur eine Einzahlung.',
  },
  'ausgabe-aufwand-verwechselt': {
    titel: 'Einkauf und Verbrauch verwechselt',
    erklaerung:
      'Aufwand entsteht erst, wenn Güter verbraucht werden. Ein Einkauf auf Lager ist eine Ausgabe, aber kein Aufwand; wird später aus dem Lager verbraucht, ist das Aufwand ohne Ausgabe.',
  },
  'einnahme-ertrag-verwechselt': {
    titel: 'Herstellung und Verkauf verwechselt',
    erklaerung:
      'Ertrag ist der Wertzuwachs der Periode. Werden Getränke hergestellt und eingelagert, entsteht Ertrag (und Leistung) ohne Einnahme; die Einnahme folgt erst mit dem Verkauf.',
  },
  'neutral-als-kosten': {
    titel: 'Neutralen Aufwand als Kosten behandelt',
    erklaerung:
      'Betriebsfremder, periodenfremder und außerordentlicher Aufwand ist neutraler Aufwand. Er mindert den Gewinn der Buchhaltung, gehört aber nicht in die Kostenrechnung (Spende, Steuernachzahlung für das Vorjahr, nicht versicherter Schaden).',
  },
  'neutral-als-leistung': {
    titel: 'Neutralen Ertrag als Leistung behandelt',
    erklaerung:
      'Erträge, die nicht aus der typischen betrieblichen Tätigkeit stammen (Miete aus einer nicht betrieblich genutzten Wohnung, Zinsen aus Geldanlagen), sind neutrale Erträge und keine Leistungen.',
  },
  'kosten-als-neutral': {
    titel: 'Betrieblichen Vorgang als neutral eingestuft',
    erklaerung:
      'Was der Herstellung und dem Absatz dient, im Monat anfällt und gewöhnlich ist, gehört in die Kostenrechnung: Gehälter, Versicherungen, Abgaben und Fremdleistungen sind Grundkosten, Verkäufe aus der eigenen Produktion sind Leistungen.',
  },
  'zusatzkosten-als-aufwand': {
    titel: 'Kalkulatorische Kosten als Aufwand behandelt',
    erklaerung:
      'Kalkulatorischer Unternehmerlohn, Eigenkapitalzinsen und kalkulatorische Miete gibt es nur in der Kostenrechnung. Die Buchhaltung bucht dafür keinen Aufwand: Es sind Zusatzkosten.',
  },
  'zusatzleistung-als-ertrag': {
    titel: 'Zusatzleistung als Ertrag behandelt',
    erklaerung:
      'Die Nutzung eines nicht aktivierten, selbst erstellten Patents erscheint nicht in der Buchhaltung. Die Kostenrechnung erfasst sie als Zusatzleistung ohne Ertrag.',
  },
  // G2 – Abgrenzung
  'neutral-art-verwechselt': {
    titel: 'Art des neutralen Aufwands verwechselt',
    erklaerung:
      'Betriebsfremd: hat nichts mit dem Betriebszweck zu tun (Spende, Kursverlust). Periodenfremd: gehört in eine andere Periode (Nachzahlung für das Vorjahr). Außerordentlich: ungewöhnlich und einmalig (nicht versicherter Brand- oder Unfallschaden).',
  },
  'grundkosten-anderskosten-verwechselt': {
    titel: 'Grund- und Anderskosten verwechselt',
    erklaerung:
      'Grundkosten übernimmt die Kostenrechnung in gleicher Höhe wie den Aufwand. Anderskosten haben zwar einen Aufwand, werden aber anders bewertet – etwa kalkulatorische Abschreibungen vom Wiederbeschaffungswert oder Verbrauch zu Tagespreisen.',
  },
  'anderskosten-zusatzkosten-verwechselt': {
    titel: 'Anders- und Zusatzkosten verwechselt',
    erklaerung:
      'Anderskosten: Es gibt einen Aufwand, nur in anderer Höhe. Zusatzkosten: Es gibt gar keinen Aufwand (kalkulatorischer Unternehmerlohn, Eigenkapitalzinsen, kalkulatorische Miete).',
  },
  'zahlung-als-aufwand': {
    titel: 'Zahlungsvorgang als Aufwand gewertet',
    erklaerung:
      'Tilgungen und Privatentnahmen verbrauchen keine Güter für den Betrieb. Es fließt Geld, aber es entsteht weder Aufwand noch Kosten.',
  },
  'korrektur-vorzeichen': {
    titel: 'Ergebnis der kostenrechnerischen Korrekturen mit falschem Vorzeichen',
    erklaerung:
      'Ergebnis aus kostenrechnerischen Korrekturen = verrechnete Kosten − Aufwand lt. FB. Rechnet die Kostenrechnung mit mehr Kosten als die Buchhaltung Aufwand hat, ist das Ergebnis positiv. Kontrolle: neutrales Ergebnis + Betriebsergebnis = Gesamtergebnis.',
  },
  'bilanziell-statt-kalkulatorisch': {
    titel: 'Bilanzielle statt kalkulatorischer Werte in den Kosten',
    erklaerung:
      'In die Spalte Kosten gehören bei Abschreibungen und Zinsen die kalkulatorischen Beträge. Der Aufwand laut Finanzbuchhaltung steht nur in der Spalte „Aufwand lt. FB“ der kostenrechnerischen Korrekturen.',
  },
  'zusatzkosten-vergessen': {
    titel: 'Zusatzkosten vergessen',
    erklaerung:
      'Der kalkulatorische Unternehmerlohn steht nicht in der Buchhaltung, muss aber in der Ergebnistabelle bei den verrechneten Kosten und bei den Kosten ergänzt werden.',
  },
  // G4 – Fixe und variable Kosten
  'durchschnitt-statt-differenz': {
    titel: 'Durchschnittskosten statt variabler Stückkosten',
    erklaerung:
      'Gesamtkosten ÷ Menge sind die Stückkosten einschließlich Fixkostenanteil. Die variablen Stückkosten ergeben sich aus Kostendifferenz ÷ Mengendifferenz zweier Beschäftigungen.',
  },
  'alles-variabel': {
    titel: 'Alle Kosten als variabel hochgerechnet',
    erklaerung:
      'Wer die Kosten einfach im Verhältnis der Mengen hochrechnet, unterstellt, es gäbe keine Fixkosten. Die Fixkosten bleiben aber bei jeder Menge gleich.',
  },
  'fixkosten-vergessen': {
    titel: 'Fixkosten vergessen',
    erklaerung:
      'Gesamtkosten = Fixkosten + variable Stückkosten × Menge. Die Stückkosten enthalten neben kv auch den Fixkostenanteil Kf ÷ Menge.',
  },
  'differenz-nicht-hochgerechnet': {
    titel: 'Kostendifferenz als gesamte variable Kosten genommen',
    erklaerung:
      'Die Kostendifferenz gehört nur zur Differenz der Beschäftigungsgrade. Erst je Prozentpunkt rechnen, dann mit dem gefragten Beschäftigungsgrad multiplizieren.',
  },
  'fix-variabel-vertauscht': {
    titel: 'Fix und variabel vertauscht',
    erklaerung:
      'Variabel sind Kosten, die mit der Produktionsmenge steigen oder fallen (Material, Akkordlohn). Fix sind Kosten, die unabhängig von der Menge anfallen (Miete, Gehälter, zeitabhängige Abschreibung).',
  },
  'intervallfix-verkannt': {
    titel: 'Intervallfixe Kosten nicht erkannt',
    erklaerung:
      'Intervallfixe (sprungfixe) Kosten bleiben innerhalb eines Beschäftigungsbereichs gleich und steigen beim Überschreiten einer Grenze sprunghaft, etwa wenn eine zusätzliche Schichtleitung eingestellt wird.',
  },
  // G5 – Einzel- und Gemeinkosten
  'einzel-gemein-vertauscht': {
    titel: 'Einzel- und Gemeinkosten vertauscht',
    erklaerung:
      'Einzelkosten lassen sich einem Kostenträger direkt zurechnen (Fertigungsmaterial laut Entnahmeschein, Akkordlohn). Gemeinkosten fallen für mehrere Produkte gemeinsam an und werden über Schlüssel oder Zuschläge verteilt.',
  },
  'unechte-gemeinkosten-verkannt': {
    titel: 'Unechte Gemeinkosten nicht erkannt',
    erklaerung:
      'Unechte Gemeinkosten sind ihrem Inhalt nach Einzelkosten (und variabel), werden aber wie Gemeinkosten behandelt, weil die genaue Erfassung je Stück zu aufwendig wäre – etwa Leim oder Kleinmaterial.',
  },
  'sondereinzelkosten-verkannt': {
    titel: 'Sondereinzelkosten nicht erkannt',
    erklaerung:
      'Sondereinzelkosten gehören nicht zum einzelnen Stück, aber zu einem bestimmten Auftrag. In der Fertigung: Rüstkosten, Sonderwerkzeuge. Im Vertrieb: Ausgangsfrachten, Spezialverpackungen.',
  },
};
