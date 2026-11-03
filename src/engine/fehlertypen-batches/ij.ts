// Fehlertypen M7, Batch ij.
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_IJ: Record<string, Fehlertyp> = {
  // BAB, Verteilung primärer Gemeinkosten (I2)
  'schluessel-falsch-summiert': {
    titel: 'Schlüsselsumme falsch gebildet',
    erklaerung:
      'Geteilt wird durch die Summe der Schlüsselgrößen aller Kostenstellen dieser Zeile – auch der Vorkostenstellen. Kontrolle: Die verteilten Anteile einer Zeile ergeben zusammen genau ihren Betrag.',
  },
  'zeile-vertauscht': {
    titel: 'Schlüssel der falschen Zeile verwendet',
    erklaerung:
      'Jede Kostenart hat ihre eigene Verteilungsgrundlage: Raumkosten nach Fläche, Sozialkosten nach Mitarbeitern, Abschreibungen nach Anlagenwerten. Prüfe, ob du in der richtigen Zeile der Schlüsseltabelle bist.',
  },
  // Anbauverfahren (I3)
  'anbau-gesamtleistung': {
    titel: 'Durch die gesamte Leistung geteilt',
    erklaerung:
      'Beim Anbauverfahren werden Lieferungen zwischen den Vorkostenstellen ignoriert. Der Verrechnungssatz ist deshalb primäre Gemeinkosten ÷ Leistung an die Hauptkostenstellen – sonst bleiben Kosten unverteilt.',
  },
  'summe-ohne-primaerkosten': {
    titel: 'Primäre Gemeinkosten der Hauptkostenstelle vergessen',
    erklaerung:
      'Die Gesamtgemeinkosten einer Hauptkostenstelle sind ihre eigenen primären Gemeinkosten plus die sekundären Gemeinkosten, die sie von den Vorkostenstellen übernimmt.',
  },
  // Zuschlagssätze, Über-/Unterdeckung (I6)
  'bestandsveraenderung-vorzeichen': {
    titel: 'Bestandsveränderung mit falschem Vorzeichen',
    erklaerung:
      'Herstellkosten des Umsatzes = Herstellkosten der Periode − Mehrbestand + Minderbestand. Ein Mehrbestand wurde produziert, aber nicht verkauft; ein Minderbestand wurde verkauft, aber in einer früheren Periode produziert.',
  },
  'hk-periode-statt-umsatz': {
    titel: 'Bestandsveränderungen nicht berücksichtigt',
    erklaerung:
      'Verwaltungs- und Vertriebsgemeinkosten beziehen sich auf die Herstellkosten des Umsatzes. Die Herstellkosten der Periode müssen dafür noch um die Bestandsveränderungen korrigiert werden.',
  },
  'ueber-unterdeckung-vertauscht': {
    titel: 'Über- und Unterdeckung verwechselt',
    erklaerung:
      'Verrechnete Normalgemeinkosten größer als Istgemeinkosten: Es wurde zu viel verrechnet – Überdeckung. Normal kleiner als Ist: zu wenig verrechnet – Unterdeckung.',
  },
  'normal-auf-ist-basis': {
    titel: 'Normalzuschlag auf Ist-Herstellkosten gerechnet',
    erklaerung:
      'In der Normalrechnung werden auch die Herstellkosten des Umsatzes mit den Normalgemeinkosten von Material und Fertigung gebildet. Darauf beziehen sich die Normalzuschläge für Verwaltung und Vertrieb.',
  },
};
