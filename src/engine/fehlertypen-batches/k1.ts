// Fehlertypen M7, Batch k1 (Teilkostenrechnung K1–K4).
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_K1: Record<string, Fehlertyp> = {
  // K1 Kostenverlauf
  'stueckkosten-konstant': {
    titel: 'Stückkosten wie variable Kosten behandelt',
    erklaerung:
      'Die Stückkosten einer Beschäftigung lassen sich nicht einfach mit einer anderen Menge multiplizieren. Sie enthalten einen Fixkostenanteil, der mit steigender Menge sinkt. Rechne immer mit K = K_f + k_v · x.',
  },
  'kv-durchschnitt-statt-differenz': {
    titel: 'Durchschnittskosten statt variable Kosten',
    erklaerung:
      'Gesamtkosten ÷ Menge ergibt die Stückkosten einschließlich Fixkosten. Die variablen Kosten je Einheit erhältst du aus Kostendifferenz ÷ Mengendifferenz, weil die Fixkosten in beiden Monaten gleich sind.',
  },
  'kv-je-stueck-sinkt': {
    titel: 'Variable Kosten je Einheit sind konstant',
    erklaerung:
      'Bei linearem Kostenverlauf bleiben die variablen Kosten je Einheit gleich. Die Stückkosten sinken nur, weil sich die Fixkosten auf mehr Einheiten verteilen (Fixkostendegression).',
  },
  // K2 Deckungsbeitrag
  'fixkosten-je-stueck-im-db': {
    titel: 'Fixkosten im Stückdeckungsbeitrag',
    erklaerung:
      'Der Stückdeckungsbeitrag ist Preis minus variable Kosten je Einheit. Fixkosten werden erst vom gesamten Deckungsbeitrag abgezogen, nicht je Stück.',
  },
  'fixkosten-nicht-abgezogen': {
    titel: 'Fixkosten nicht abgezogen',
    erklaerung:
      'Der Deckungsbeitrag ist noch kein Gewinn. Betriebsergebnis = Summe der Deckungsbeiträge − Fixkosten.',
  },
  'fixkosten-nicht-addiert': {
    titel: 'Rückrechnung ohne Fixkosten',
    erklaerung:
      'Aus Betriebsergebnis = Deckungsbeitrag − Fixkosten folgt: Deckungsbeitrag = Betriebsergebnis + Fixkosten. Erst dann durch die Menge teilen.',
  },
  // K3 Gewinnschwelle
  'preis-statt-db': {
    titel: 'Fixkosten durch den Preis geteilt',
    erklaerung:
      'Jede Einheit trägt nur ihren Stückdeckungsbeitrag zur Fixkostendeckung bei, nicht den ganzen Preis. Gewinnschwelle = Fixkosten ÷ (Preis − variable Kosten je Einheit).',
  },
  'nicht-aufgerundet': {
    titel: 'Gewinnschwelle nicht aufgerundet',
    erklaerung:
      'Geht die Division nicht auf, wird auf die nächste ganze Einheit aufgerundet. Mit der abgerundeten Menge bleibt noch ein kleiner Verlust.',
  },
  'umsatz-statt-menge': {
    titel: 'Menge und Umsatz verwechselt',
    erklaerung:
      'Fixkosten ÷ Stückdeckungsbeitrag ergibt eine Menge (Stück). Den Umsatz an der Gewinnschwelle erhältst du erst, wenn du diese Menge mit dem Preis multiplizierst.',
  },
  'fixkosten-summe-statt-differenz': {
    titel: 'Fixkosten addiert statt subtrahiert',
    erklaerung:
      'An der kritischen Menge sind beide Kostenfunktionen gleich. Umgestellt ergibt sich: Differenz der Fixkosten ÷ Differenz der variablen Kosten je Einheit.',
  },
  // K4 Mehrstufige Deckungsbeitragsrechnung
  'gruppenfix-einzeln-zugerechnet': {
    titel: 'Gruppenfixe Kosten einem Erzeugnis zugerechnet',
    erklaerung:
      'Erzeugnisgruppenfixe Kosten entstehen für die ganze Gruppe. Sie werden erst von der Summe der DB II der Gruppe abgezogen (DB III) und fallen nicht weg, solange ein Erzeugnis der Gruppe bleibt.',
  },
  'gruppenfix-nicht-abgebaut': {
    titel: 'Wegfall der Gruppe übersehen',
    erklaerung:
      'Ist das eingestellte Erzeugnis das einzige seiner Gruppe, entfallen auch die gruppenfixen Kosten. Die Ergebnisverbesserung entspricht dann dem negativen DB III der Gruppe.',
  },
  'einstellung-nach-db-i': {
    titel: 'Entscheidung nach dem DB I',
    erklaerung:
      'Ein positiver DB I genügt nur, wenn keine Fixkosten abbaubar sind. Sind erzeugnisfixe Kosten abbaubar, entscheidet der DB II: Ist er negativ, verbessert die Einstellung das Ergebnis.',
  },
};
