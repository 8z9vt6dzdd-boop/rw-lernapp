// Fehlertypen M7, Batch j.
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_J: Record<string, Fehlertyp> = {
  // J2 Divisionskalkulation
  'division-mengen-vertauscht': {
    titel: 'Produktions- und Absatzmenge vertauscht',
    erklaerung:
      'Herstellkosten entstehen für alles, was produziert wurde: Teile sie durch die produzierte Menge. Verwaltungs- und Vertriebskosten fallen erst beim Verkauf an: Teile sie durch die abgesetzte Menge.',
  },
  'division-einstufig-trotz-lager': {
    titel: 'Einstufig gerechnet, obwohl sich das Lager verändert',
    erklaerung:
      'Wenn produzierte und abgesetzte Menge auseinanderfallen, reicht eine einzige Division nicht. Trenne Herstellkosten (÷ Produktion) und Verwaltungs- und Vertriebskosten (÷ Absatz).',
  },
  'hk-inkl-vv': {
    titel: 'Verwaltungs- und Vertriebskosten nicht herausgerechnet',
    erklaerung:
      'Die Gesamtkosten enthalten auch Verwaltung und Vertrieb. Herstellkosten = Gesamtkosten − Verwaltungs- und Vertriebskosten; erst diese werden auf die produzierte Menge verteilt.',
  },
  'stufen-nicht-kumuliert': {
    titel: 'Kosten der Vorstufe nicht übernommen',
    erklaerung:
      'In der mehrstufigen Divisionskalkulation trägt jedes Zwischenprodukt die Stückherstellkosten der Vorstufe mit. Stückherstellkosten der Stufe = Stückherstellkosten der Vorstufe + Kosten der Stufe ÷ Bearbeitungsmenge der Stufe.',
  },
  'stufenkosten-durch-endmenge': {
    titel: 'Alle Stufenkosten durch die Endmenge geteilt',
    erklaerung:
      'Jede Stufe hat ihre eigene Bearbeitungsmenge. Teile die Kosten einer Stufe nur durch die Menge dieser Stufe; sonst werden Zwischenlager falsch bewertet.',
  },
  'bestand-zu-selbstkosten': {
    titel: 'Bestände mit Selbstkosten statt Herstellkosten bewertet',
    erklaerung:
      'Lagerbestände und Bestandsveränderungen werden zu Herstellkosten bewertet. Verwaltungs- und Vertriebskosten gehören nicht dazu, sie entfallen auf die abgesetzte Menge.',
  },

  // J5 Maschinenstundensatz
  'zinsen-voller-wert': {
    titel: 'Zinsen auf den vollen Wiederbeschaffungswert',
    erklaerung:
      'Während der Nutzungsdauer ist im Durchschnitt nur die Hälfte des Werts gebunden. Kalkulatorische Zinsen = Wiederbeschaffungswert ÷ 2 × Zinssatz.',
  },
  'monatswert-nicht-hochgerechnet': {
    titel: 'Monatswert nicht auf das Jahr hochgerechnet',
    erklaerung:
      'Der Maschinenstundensatz bezieht Jahreskosten auf die Jahreslaufzeit. Raumkosten oder Grundpreise je Monat müssen deshalb mit 12 multipliziert werden.',
  },
  'instandhaltung-faktor-nicht-verteilt': {
    titel: 'Instandhaltungsfaktor nicht auf die Jahre verteilt',
    erklaerung:
      'Der Faktor beschreibt die Instandhaltung über die gesamte Nutzungsdauer. Jahreskosten = Faktor × Wiederbeschaffungswert ÷ Nutzungsdauer.',
  },
  'leistungsgrad-vergessen': {
    titel: 'Leistungsgrad nicht berücksichtigt',
    erklaerung:
      'Die Anlage zieht im Mittel nicht ihre volle installierte Leistung. Verbrauch in kWh = installierte kW × Leistungsgrad × Laufstunden.',
  },
  'rest-fgk-falsche-basis': {
    titel: 'Restfertigungsgemeinkosten auf die falsche Basis',
    erklaerung:
      'Die Maschinenkosten sind über den Stundensatz schon verrechnet. Der Zuschlag für die Restfertigungsgemeinkosten wird nur auf die Fertigungslöhne gerechnet.',
  },
  'maschinenkosten-vergessen': {
    titel: 'Maschinenkosten fehlen in den Fertigungskosten',
    erklaerung:
      'Fertigungskosten = Fertigungslöhne + Restfertigungsgemeinkosten + Maschinenkosten (Laufzeit × Maschinenstundensatz).',
  },

  // J6 Kuppelkalkulation
  'einzelkosten-nicht-abgezogen': {
    titel: 'Einzelkosten der Sorten nicht abgezogen',
    erklaerung:
      'Verteilt werden nur die Kosten des gemeinsamen Kuppelprozesses. Ziehe zuerst die Einzelkosten der Weiterverarbeitung von den Gesamtkosten ab.',
  },
  'einzelkosten-vergessen': {
    titel: 'Einzelkosten je Einheit vergessen',
    erklaerung:
      'Selbstkosten je Einheit = Stückkosten aus dem Kuppelprozess + Einzelkosten je Einheit der Sorte.',
  },
  'weiterverarbeitung-nicht-abgezogen': {
    titel: 'Weiterverarbeitungskosten nicht abgezogen',
    erklaerung:
      'Ein Nebenprodukt entlastet das Hauptprodukt nur um das, was nach seiner Aufbereitung übrig bleibt: (Erlös − Weiterverarbeitungskosten je Einheit) × Menge.',
  },
  'nebenerloes-addiert': {
    titel: 'Nebenerlöse addiert statt abgezogen',
    erklaerung:
      'Die Erlöse der Nebenprodukte mindern die Kosten, die das Hauptprodukt tragen muss. Restkosten = Kosten des Kuppelprozesses − Nettoerlöse der Nebenprodukte.',
  },

  // J7 Gesamt- und Umsatzkostenverfahren
  'bv-vorzeichen-falsch': {
    titel: 'Bestandsminderung als Mehrung gerechnet',
    erklaerung:
      'Wurde mehr verkauft als produziert, ist der Bestand gesunken. Diese Minderung wird von den Umsatzerlösen abgezogen, nicht addiert.',
  },
  'gkv-ohne-bv': {
    titel: 'Bestandsveränderungen fehlen im Gesamtkostenverfahren',
    erklaerung:
      'Das Gesamtkostenverfahren zieht die Kosten der gesamten Produktion ab. Damit Kosten und Leistungen zusammenpassen, gehören die Bestandsveränderungen zu Herstellkosten in die Gesamtleistung.',
  },
  'ukv-produktionsmenge': {
    titel: 'Herstellkosten der Produktion statt des Umsatzes angesetzt',
    erklaerung:
      'Im Umsatzkostenverfahren zählen nur die Kosten der verkauften Menge: Herstellkosten je Stück × Absatzmenge + Verwaltungs- und Vertriebskosten.',
  },
};
