// Fehlertypen M7, Batch b (Umsatzsteuer rechnen und buchen: B1, B2).
// Wiederverwendet werden außerdem: steuer-falsches-konto, soll-haben-vertauscht (Basis),
// einkauf-ohne-vorsteuer (c1), brutto-als-netto und erloeskonto-verwechselt (d).
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_B: Record<string, Fehlertyp> = {
  // B1 Rechnen
  'b-prozent-vom-brutto': {
    titel: 'Steuersatz auf den Bruttobetrag angewendet',
    erklaerung:
      'Der Steuersatz bezieht sich immer auf den Nettobetrag (100 %). Der Bruttobetrag entspricht 119 % bzw. 107 %. Deshalb: Netto = Brutto ÷ 1,19 (bzw. ÷ 1,07), die Steuer ist die Differenz. „Brutto minus 19 %“ ergibt einen zu kleinen Nettobetrag.',
  },
  'b-steuersatz-verwechselt': {
    titel: '7 % und 19 % verwechselt',
    erklaerung:
      'Der ermäßigte Satz von 7 % gilt zum Beispiel für Bücher, Zeitungen und Zeitschriften sowie für Personenbeförderung, der allgemeine Satz von 19 % für fast alles andere – auch für Getränke, Verpackungen und Reparaturen. Nimm den Satz, der im Sachverhalt bei der jeweiligen Position steht.',
  },
  'b-ein-satz-fuer-alles': {
    titel: 'Alle Positionen mit demselben Steuersatz gerechnet',
    erklaerung:
      'Stehen auf einer Rechnung Positionen mit 19 % und mit 7 %, werden die Nettobeträge nach Steuersätzen getrennt und die Steuer für jeden Satz einzeln berechnet.',
  },
  'b-zahllast-richtung': {
    titel: 'Zahllast und Vorsteuerüberhang verwechselt',
    erklaerung:
      'Ist die Umsatzsteuer (Schuld) höher als die Vorsteuer (Forderung), muss die MBG die Differenz an das Finanzamt zahlen: Zahllast. Ist die Vorsteuer höher, erstattet das Finanzamt die Differenz: Vorsteuerüberhang.',
  },

  // B2 Buchen
  'b-verkauf-ohne-umsatzsteuer': {
    titel: 'Umsatzsteuer beim Verkauf vergessen',
    erklaerung:
      'Umsatzerlöse stehen netto im Haben. Die Steuer, die der Kunde mitbezahlt, schuldet die MBG dem Finanzamt: Umsatzsteuer im Haben. Forderungen, Bank oder Kasse steigen um den Bruttobetrag.',
  },
  'b-zahlungskonto-falsch': {
    titel: 'Falsches Zahlungskonto',
    erklaerung:
      '„Auf Ziel“ heißt: Es wird später gezahlt – beim Einkauf Verbindlichkeiten a. LL, beim Verkauf Forderungen a. LL. Barzahlung läuft über die Kasse, eine Überweisung über die Bank.',
  },
  'b-positionen-zusammengefasst': {
    titel: 'Positionen nicht auf ihre Konten verteilt',
    erklaerung:
      'Jede Rechnungsposition kommt mit ihrem Nettobetrag auf das passende Konto (z. B. Hilfsstoffe, Werbung, Umsatzerlöse für Handelswaren). Nur Positionen auf demselben Konto werden addiert; die Steuer steht in einer Summe.',
  },
  'b-zahllast-als-aufwand': {
    titel: 'Zahllast als Aufwand gebucht',
    erklaerung:
      'Die Umsatzsteuer ist für die MBG kein Aufwand, sondern ein durchlaufender Posten. Die Zahllast ist eine Schuld auf dem Konto Umsatzsteuer; mit der Überweisung sinkt sie: Umsatzsteuer an Bank.',
  },
  'b-zahllast-ueber-vorsteuer': {
    titel: 'Zahllast über das Vorsteuerkonto bezahlt',
    erklaerung:
      'Nach der Verrechnung ist das Konto Vorsteuer ausgeglichen. Die Zahllast steht als Saldo auf dem Konto Umsatzsteuer – die Überweisung mindert deshalb die Umsatzsteuer im Soll.',
  },
  'b-erstattung-ueber-umsatzsteuer': {
    titel: 'Erstattung über das Umsatzsteuerkonto gebucht',
    erklaerung:
      'Bei einem Vorsteuerüberhang bleibt nach der Verrechnung ein Saldo auf dem Konto Vorsteuer (Forderung an das Finanzamt). Die Erstattung gleicht diese Forderung aus: Bank an Vorsteuer.',
  },
};
