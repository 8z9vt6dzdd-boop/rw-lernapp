// Fehlertypen M7, Batch k2 (Teilkostenrechnung K5–K9).
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_K2: Record<string, Fehlertyp> = {
  'vollkosten-als-untergrenze': {
    titel: 'Selbstkosten als kurzfristige Preisuntergrenze',
    erklaerung:
      'Die Fixkosten fallen mit und ohne Zusatzauftrag an. Kurzfristig liegt die Preisuntergrenze bei den variablen Stückkosten; jeder Preis darüber bringt einen positiven Deckungsbeitrag.',
  },
  'verdraengung-ignoriert': {
    titel: 'Verdrängte Normalmenge übersehen',
    erklaerung:
      'Reicht die freie Kapazität nicht, fallen normale Verkäufe weg. Ihr Deckungsbeitrag geht verloren und muss vom Deckungsbeitrag des Zusatzauftrags abgezogen werden.',
  },
  'rangfolge-nach-absolutem-db': {
    titel: 'Rangfolge nach Stückdeckungsbeitrag statt nach relativem Deckungsbeitrag',
    erklaerung:
      'Bei einem Engpass entscheidet, was ein Produkt je Engpasseinheit einbringt: Stückdeckungsbeitrag ÷ Beanspruchung des Engpasses je Stück. Ein hoher Stückdeckungsbeitrag nützt wenig, wenn das Produkt die Anlage lange belegt.',
  },
  'fixkosten-bei-freier-kapazitaet': {
    titel: 'Ohnehin anfallende Fixkosten eingerechnet',
    erklaerung:
      'Bei freier Kapazität ändern sich Abschreibung, Miete und Gehälter durch die Entscheidung nicht. Verglichen werden nur die variablen Kosten der Eigenfertigung mit dem Preis des Fremdbezugs.',
  },
  'zusatzfixkosten-vergessen': {
    titel: 'Zusätzliche Fixkosten der Eigenfertigung vergessen',
    erklaerung:
      'Verursacht die Eigenfertigung zusätzliche Fixkosten, lohnt sie sich erst ab der kritischen Menge: zusätzliche Fixkosten ÷ (Fremdbezugspreis − variable Kosten je Stück).',
  },
  'sollkosten-proportional': {
    titel: 'Sollkosten proportional gerechnet',
    erklaerung:
      'Sollkosten passen nur die variablen Plankosten an die Istbeschäftigung an; die fixen Plankosten bleiben in voller Höhe. Wer den vollen Verrechnungssatz mit der Istbeschäftigung multipliziert, erhält die verrechneten Plankosten.',
  },
  'verbrauchsabweichung-falsche-basis': {
    titel: 'Verbrauchsabweichung gegen die falsche Größe gerechnet',
    erklaerung:
      'Die Verbrauchsabweichung vergleicht die Istkosten mit den Sollkosten, also mit dem an die Istbeschäftigung angepassten Budget. Der Vergleich mit den verrechneten Plankosten ergibt die Gesamtabweichung.',
  },
};
