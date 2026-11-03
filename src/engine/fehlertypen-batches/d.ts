// Fehlertypen M7, Batch d (Absatz und Privat: D1, D2, D3, D5, D6).
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_D: Record<string, Fehlertyp> = {
  // Allgemein im Absatz
  'brutto-als-netto': {
    titel: 'Bruttobetrag als Nettobetrag behandelt',
    erklaerung:
      'Steht „einschließlich Umsatzsteuer“ oder „brutto“ dabei, steckt die Steuer schon im Betrag. Netto = Brutto ÷ (1 + Steuersatz), die Steuer ist die Differenz.',
  },
  'rabatt-vergessen': {
    titel: 'Rabatt nicht abgezogen',
    erklaerung:
      'Ein Rabatt, der in der Rechnung abgezogen wurde, mindert den Warenwert. Umsatzerlöse und Umsatzsteuer werden vom Wert nach Rabatt gerechnet – auch bei einer späteren Rücksendung.',
  },
  'erloeskonto-verwechselt': {
    titel: 'Falsches Erlöskonto',
    erklaerung:
      'Selbst hergestellte Getränke führen zu „Umsatzerlöse für eigene Erzeugnisse“, zugekaufte Handelswaren (Wein, Vodka) zu „Umsatzerlöse für Handelswaren“.',
  },

  // D1 Verkauf
  'sofortrabatt-gebucht': {
    titel: 'Sofortrabatt gebucht',
    erklaerung:
      'Ein Rabatt, der direkt in der Rechnung abgezogen wird, wird nicht gebucht. Auf Umsatzerlöse kommt nur der Warenwert nach Rabatt; Erlösberichtigungen sind für nachträgliche Nachlässe gedacht.',
  },
  'rabatt-auf-nebenkosten': {
    titel: 'Rabatt auch auf Verpackung und Fracht',
    erklaerung:
      'Der Wiederverkäuferrabatt gilt nur für den Warenwert. Verpackung und Fracht werden ohne Rabatt hinzugerechnet.',
  },
  'verkaufsnebenkosten-vergessen': {
    titel: 'Berechnete Verpackung oder Fracht vergessen',
    erklaerung:
      'Was die MBG dem Kunden für Verpackung und Fracht in Rechnung stellt, gehört zum Nettobetrag der Ausgangsrechnung und damit zu den Umsatzerlösen.',
  },
  'nebenkosten-als-aufwandsminderung': {
    titel: 'Berechnete Nebenkosten nicht als Erlös gebucht',
    erklaerung:
      'Dem Kunden berechnete Verpackung und Fracht sind Umsatzerlöse. Sie werden nicht im Haben eines Aufwandskontos (z. B. Ausgangsfrachten) verrechnet.',
  },

  // D2 Rücksendung
  'ruecksendung-als-erloesberichtigung': {
    titel: 'Rücksendung über Erlösberichtigungen gebucht',
    erklaerung:
      'Eine Rücksendung macht den Verkauf rückgängig (Storno): Umsatzerlöse im Soll. Erlösberichtigungen sind nur für Nachlässe, bei denen die Ware beim Kunden bleibt.',
  },
  'ruecksendung-auf-bestandskonto': {
    titel: 'Rücksendung auf dem Bestandskonto gebucht',
    erklaerung:
      'Beim Verkauf wurde der Erlös gebucht, kein Lagerabgang. Die Rücksendung storniert deshalb den Erlös. Der Lagerbestand wird erst über die Inventur angepasst.',
  },
  'ruecksendung-ohne-ust': {
    titel: 'Umsatzsteuer bei der Rücksendung nicht korrigiert',
    erklaerung:
      'Mit dem Verkauf wird auch die Umsatzsteuer storniert. Nettowert auf Umsatzerlöse, Steuer auf Umsatzsteuer, beides im Soll; die Forderung sinkt um den Bruttobetrag.',
  },

  // D3 Erlösberichtigungen
  'nachlass-als-umsatzstorno': {
    titel: 'Nachlass direkt auf Umsatzerlöse gebucht',
    erklaerung:
      'Behält der Kunde die Ware und bekommt einen Nachlass (Mängelrüge, Bonus, Kulanz), wird das Unterkonto Erlösberichtigungen belastet. Direkt auf Umsatzerlöse geht nur die Rücksendung.',
  },
  'nachlass-ohne-steuerkorrektur': {
    titel: 'Umsatzsteuer beim Nachlass nicht korrigiert',
    erklaerung:
      'Ein Nachlass mindert das Entgelt und damit die geschuldete Umsatzsteuer. Nettomethode: Erlösberichtigungen netto und Umsatzsteuer im Soll. Bruttomethode: später „Umsatzsteuer an Erlösberichtigungen“.',
  },
  'korrektur-richtung-vertauscht': {
    titel: 'Steuerkorrektur in falscher Richtung',
    erklaerung:
      'Bei der Bruttomethode sinkt die Umsatzsteuerschuld nachträglich: Umsatzsteuer (Soll) an Erlösberichtigungen (Haben).',
  },
  'erloesberichtigung-ueber-guv': {
    titel: 'Erlösberichtigungen direkt über die GuV abgeschlossen',
    erklaerung:
      'Erlösberichtigungen sind ein Unterkonto der Umsatzerlöse. Sie werden über das Hauptkonto abgeschlossen (Umsatzerlöse an Erlösberichtigungen); in die GuV geht nur der Nettoumsatz.',
  },
  'erloesberichtigung-addiert': {
    titel: 'Erlösberichtigungen zum Umsatz addiert',
    erklaerung:
      'Erlösberichtigungen mindern die Umsatzerlöse. Nettoumsatz = Umsatzerlöse − Erlösberichtigungen.',
  },

  // D5 Ausgangsfrachten
  'ausgangsfracht-als-bezugskosten': {
    titel: 'Ausgangsfracht als Bezugskosten gebucht',
    erklaerung:
      'Bezugskosten gehören zum Einkauf von Stoffen. Fracht für die Auslieferung an Kunden ist Vertriebsaufwand: Ausgangsfrachten.',
  },
  'eingangsfracht-als-ausgangsfracht': {
    titel: 'Eingangsfracht als Ausgangsfracht gebucht',
    erklaerung:
      'Fracht für eingekaufte Stoffe erhöht deren Anschaffungskosten und kommt auf das Unterkonto Bezugskosten des Stoffes. Ausgangsfrachten betreffen nur den Versand an Kunden.',
  },
  'ausgangsfracht-als-erloesberichtigung': {
    titel: 'Fracht als Erlösberichtigung gebucht',
    erklaerung:
      'Erlösberichtigungen sind Nachlässe an Kunden. Eine Frachtrechnung, die die MBG bezahlt, ist Aufwand: Ausgangsfrachten (bzw. Bezugskosten im Einkauf).',
  },
  'fracht-ohne-vorsteuer': {
    titel: 'Vorsteuer auf die Fracht vergessen',
    erklaerung:
      'Die Spedition ist ein Lieferant der MBG. Die Umsatzsteuer auf ihrer Rechnung ist für die MBG Vorsteuer; als Aufwand wird nur der Nettobetrag gebucht.',
  },
  'weiterberechnete-fracht-verrechnet': {
    titel: 'Berechnete Fracht mit Ausgangsfrachten verrechnet',
    erklaerung:
      'Die Fracht, die der Kunde bezahlt, ist Umsatzerlös. Die Rechnung der Spedition ist Aufwand. Beide Vorgänge werden getrennt und ohne Verrechnung gebucht.',
  },

  // D6 Privat
  'entnahme-ohne-ust': {
    titel: 'Umsatzsteuer auf die Entnahme vergessen',
    erklaerung:
      'Entnimmt ein Gesellschafter Gegenstände oder Leistungen, wird er umsatzsteuerlich wie ein Kunde behandelt: Privat (brutto) an Entnahme v. G. u. s. L. (netto) und an Umsatzsteuer.',
  },
  'entnahme-als-erloes': {
    titel: 'Entnahme als Umsatzerlös gebucht',
    erklaerung:
      'Eine Privatentnahme ist kein Verkauf. Der Nettowert kommt auf das Ertragskonto „Entnahme von Gegenständen und sonstigen Leistungen“.',
  },
  'geldentnahme-mit-ust': {
    titel: 'Umsatzsteuer auf eine Geldentnahme',
    erklaerung:
      'Wer Geld entnimmt oder private Steuern über das Geschäftskonto zahlt, verbraucht keine Leistung des Unternehmens. Gebucht wird nur Privat an Bank bzw. Kasse.',
  },
  'privat-mit-vorsteuer': {
    titel: 'Vorsteuer bei privater Rechnung abgezogen',
    erklaerung:
      'Vorsteuer darf nur für Leistungen an das Unternehmen abgezogen werden. Bezahlt die MBG eine private Rechnung, wird Privat mit dem vollen Bruttobetrag belastet.',
  },
  'einlage-entnahme-verwechselt': {
    titel: 'Einlage als Entnahme gebucht',
    erklaerung:
      'Bei einer Einlage fließt Geld oder Vermögen ins Unternehmen: Bank (bzw. Kasse, Anlagekonto) im Soll, Privat im Haben.',
  },
  'sacheinlage-mit-vorsteuer': {
    titel: 'Vorsteuer bei Sacheinlage abgezogen',
    erklaerung:
      'Ein Gegenstand aus dem Privatvermögen kommt ohne Rechnung und ohne ausgewiesene Umsatzsteuer in die Firma. Er wird mit dem Zeitwert auf dem Anlagekonto erfasst, gegen Privat.',
  },
  'privatabschluss-ueber-guv': {
    titel: 'Konto Privat über die GuV abgeschlossen',
    erklaerung:
      'Privat ist ein Unterkonto des Eigenkapitals. Es wird über das Konto Eigenkapital abgeschlossen; Privatvorgänge berühren den Gewinn nicht.',
  },
  'privatabschluss-richtung': {
    titel: 'Abschluss des Kontos Privat in falscher Richtung',
    erklaerung:
      'Überwiegen die Entnahmen (Soll), sinkt das Eigenkapital: Eigenkapital an Privat. Überwiegen die Einlagen (Haben): Privat an Eigenkapital.',
  },
};
